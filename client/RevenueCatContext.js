import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

import { CHANGE_PLAN_MUTATION } from "./GraphQL/mutations";
import { useClient } from "./client";

// ✅ Public iOS SDK key (safe for client use)
// Later you can move this back into @env
const EXPO_REVENUE_CAT_API_KEY = "appl_IHgLeqcpOMRkDTCBNNNOfEDKbxy";

// Guard so we don't configure Purchases twice (dev/StrictMode/hot reload)
let hasConfiguredPurchases = false;

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children, state, dispatch }) => {
  const client = useClient();
  // Your app shape: state.user
  const currentUser = state?.user;

  // Current offering (we expect "default" with $rc_monthly / $rc_annual)
  const [currentOffering, setCurrentOffering] = useState(null);

  // Simple flag based on entitlement "premium"
  const [isPremium, setIsPremium] = useState(false);

  // Helps block UI while RC is warming up
  const [initializing, setInitializing] = useState(true);

  // --- 3. Helper: sync RC entitlements -> backend planType ---
  // Mapping for *today*:
  // - If entitlement "premium" is active -> planType = "Premium"
  // - Otherwise                         -> planType = "Free"
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
        userId: user.id, // matches your CHANGE_PLAN_MUTATION signature
        planType: desiredPlanType,
      };

      const data = await client.request(CHANGE_PLAN_MUTATION, variables);
      const updatedUser = data?.changePlan;

      if (updatedUser) {
        // Merge updated user back into your state.user
        dispatch({ type: "SET_USER", payload: { ...user, ...updatedUser } });
      }
    } catch (e) {
      console.log("Error syncing plan with backend:", e);
    }
  };

  // -------------------------
  // 1. Initial RevenueCat setup
  // -------------------------
  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (!hasConfiguredPurchases) {
          await Purchases.configure({
            apiKey: EXPO_REVENUE_CAT_API_KEY,
            appUserID: null,
            observerMode: false,
            useAmazon: false,
          });
          hasConfiguredPurchases = true;
        }

        const offerings = await Purchases.getOfferings();
        console.log("RC offerings.current:", offerings.current);

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

  // ----------------------------------
  // 2. When currentUser changes (login/logout)
  // ----------------------------------
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

  // ----------------------------------
  // Purchase a package (monthly / annual)
  // ----------------------------------
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

  // ----------------------------------
  // Restore purchases (new device / reinstall)
  // ----------------------------------
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
    [currentOffering, isPremium, initializing, currentUser]
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
