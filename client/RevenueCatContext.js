import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { EXPO_REVENUE_CAT_API_KEY } from "@env";

import { CHANGE_PLAN_MUTATION } from "./GraphQL/mutations";
import { useClient } from "./client";

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children, state, dispatch }) => {
  const client = useClient();
  const currentUser = state?.user;

  const [currentOffering, setCurrentOffering] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        await Purchases.configure({
          apiKey: EXPO_REVENUE_CAT_API_KEY,
          appUserID: null,
          observerMode: false,
          useAmazon: false,
        });

        const offerings = await Purchases.getOfferings();

        if (!offerings.current) {
          console.log("RevenueCat: no current offering available");
        } else {
          setCurrentOffering(offerings.current);
        }

        if (currentUser?.id) {
          try {
            await Purchases.logIn(String(currentUser.id));
          } catch (e) {
            console.log("Error logging in user to RevenueCat during init:", e);
          }
        }

        if (currentUser) {
          await syncPlanWithBackend(currentUser);
        }
      } catch (error) {
        console.error("Error initializing RevenueCat:", error);
      } finally {
        setInitializing(false);
      }
    };

    setupRevenueCat().catch(console.log);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUserChange = async () => {
      if (!currentUser?.id) {
        setIsPremium(false);
        return;
      }

      try {
        await Purchases.logIn(String(currentUser.id));
      } catch (e) {
        console.log("Error logging in user to RevenueCat on user change:", e);
      }

      await syncPlanWithBackend(currentUser);
    };

    handleUserChange().catch(console.log);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const syncPlanWithBackend = async (user = currentUser) => {
    if (!user) return;

    try {
      const customerInfo = await Purchases.getCustomerInfo();

      const hasPremium = !!customerInfo.entitlements.active?.premium;

      setIsPremium(hasPremium);

      const desiredPlanType = hasPremium ? "Premium" : "Free";
      const currentPlanType = user.plan?.planType || "Free";

      if (currentPlanType === desiredPlanType) {
        return;
      }

      const variables = {
        userId: user.id,
        planType: desiredPlanType,
      };

      const data = await client.request(CHANGE_PLAN_MUTATION, variables);
      const updatedUser = data?.changePlan;

      if (updatedUser) {
        dispatch({ type: "SET_USER", payload: { ...user, ...updatedUser } });
      }
    } catch (e) {
      console.log("Error syncing plan with backend:", e);
    }
  };

  const purchasePackage = async (selectedPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      const hasPremium = !!customerInfo.entitlements.active?.premium;
      setIsPremium(hasPremium);

      if (currentUser) {
        await syncPlanWithBackend(currentUser);
      }

      return customerInfo;
    } catch (e) {
      if (e.userCancelled) {
        console.log("User cancelled the purchase.");
      } else {
        console.error("Purchase failed:", e);
      }
      throw e;
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();

      const hasPremium = !!customerInfo.entitlements.active?.premium;
      setIsPremium(hasPremium);

      if (currentUser) {
        await syncPlanWithBackend(currentUser);
      }

      return customerInfo;
    } catch (e) {
      console.log("Error restoring purchases:", e);
      throw e;
    }
  };

  const value = useMemo(
    () => ({
      currentOffering,
      isPremium,
      initializing,
      purchasePackage,
      restorePurchases,
      refreshPlanFromRevenueCat: () => syncPlanWithBackend(currentUser),
    }),
    [currentOffering, initializing, isPremium, currentUser]
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error("useRevenueCat must be used inside a RevenueCatProvider");
  }
  return ctx;
};
