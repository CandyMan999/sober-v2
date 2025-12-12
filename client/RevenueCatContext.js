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

const EXPO_REVENUE_CAT_API_KEY = "appl_IHgLeqcpOMRkDTCBNNNOfEDKbxy";

let hasConfiguredPurchases = false;

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children, state, dispatch }) => {
  const client = useClient();
  const currentUser = state?.user;

  const [currentOffering, setCurrentOffering] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [hasPremiumEntitlement, setHasPremiumEntitlement] = useState(false);
  const [hasBackendPremium, setHasBackendPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const deriveMembershipStatus = (info, user) => {
    const entitlementActive = !!info?.entitlements?.active?.premium;
    const backendPlanType = user?.plan?.planType || "";
    const backendPremium = backendPlanType && backendPlanType !== "Free";

    return {
      entitlementActive,
      backendPremium,
      isPremium: entitlementActive || backendPremium,
    };
  };

  const applyMembershipStatus = (info, user) => {
    const {
      entitlementActive,
      backendPremium,
      isPremium: premium,
    } = deriveMembershipStatus(info, user);

    setHasPremiumEntitlement(entitlementActive);
    setHasBackendPremium(backendPremium);
    setIsPremium(premium);

    return { entitlementActive, backendPremium, premium };
  };

  const isTrialExpired = useMemo(() => {
    const trialEndsAtString = currentUser?.trialEndsAt;
    const trialEndsAt = trialEndsAtString ? new Date(trialEndsAtString) : null;

    if (typeof currentUser?.isTrialExpired === "boolean") {
      return currentUser.isTrialExpired;
    }

    return trialEndsAt ? trialEndsAt.getTime() <= Date.now() : false;
  }, [currentUser?.isTrialExpired, currentUser?.trialEndsAt]);

  // -------------------------------------------
  // 🔍 DEBUG HELPER: Shows EXACT RC status
  // -------------------------------------------
  const debugRevenueCatState = async (label = "debug", user = currentUser) => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const membership = deriveMembershipStatus(customerInfo, user);

      const activeEntitlements = customerInfo?.entitlements?.active || {};
      const activeEntitlementKeys = Object.keys(activeEntitlements);

      console.log("[SoberMotion] RevenueCat DEBUG", {
        label,
        appUser: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          planType: user?.plan?.planType,
        },
        revenueCatUser: {
          originalAppUserId: customerInfo?.originalAppUserId,
        },
        subscriptions: {
          activeSubscriptions: customerInfo?.activeSubscriptions,
          allPurchasedProductIdentifiers:
            customerInfo?.allPurchasedProductIdentifiers,
          latestExpirationDate: customerInfo?.latestExpirationDate,
        },
        entitlements: {
          activeKeys: activeEntitlementKeys,
          active: activeEntitlements,
        },
        isPremiumDerived: activeEntitlementKeys.includes("premium"),
        membership,
        managementURL: customerInfo?.managementURL,
        requestDate: customerInfo?.requestDate,
      });
    } catch (e) {
      console.log("[SoberMotion] RevenueCat DEBUG ERROR", e);
    }
  };

  // -------------------------------------------------
  // Sync plan type with backend (Premium / Free)
  // -------------------------------------------------
  const syncPlanWithBackend = async (user = currentUser) => {
    if (!user) return;

    try {
      const latestCustomerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(latestCustomerInfo);

      const membership = applyMembershipStatus(latestCustomerInfo, user);

      const desiredPlanType = membership.entitlementActive ? "Premium" : "Free";
      const currentPlanType = user.plan?.planType || "Free";

      if (currentPlanType === desiredPlanType) return;

      const variables = {
        userId: user.id,
        planType: desiredPlanType,
      };

      const data = await client.request(CHANGE_PLAN_MUTATION, variables);
      const updatedUser = data?.changePlan;

      if (updatedUser) {
        const mergedUser = { ...user, ...updatedUser };
        dispatch({ type: "SET_USER", payload: mergedUser });

        if (state?.profileOverview) {
          dispatch({
            type: "SET_PROFILE_OVERVIEW",
            payload: {
              ...state.profileOverview,
              user: { ...(state.profileOverview.user || {}), ...mergedUser },
            },
          });
        }
      }
    } catch (e) {
      console.log("Error syncing plan with backend:", e);
    }
  };

  // ---------------------------
  // 🚀 Initial RevenueCat setup
  // ---------------------------
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

        if (offerings.current) {
          setCurrentOffering(offerings.current);
        } else {
          console.log("RevenueCat: No current offering found.");
        }

        if (currentUser?.id) {
          try {
            await Purchases.logIn(String(currentUser.id));
          } catch (e) {
            console.log("Error logging in user:", e);
          }
        }

        if (currentUser) {
          await syncPlanWithBackend(currentUser);
        }

        // 🔍 DEBUG — after init
        await debugRevenueCatState("after-setup");
      } catch (error) {
        console.error("Error initializing RevenueCat:", error);
      } finally {
        setInitializing(false);
      }
    };

    setupRevenueCat().catch(console.log);
  }, []);

  // ---------------------------
  // 👤 When user logs in/out
  // ---------------------------
  useEffect(() => {
    const handleUserChange = async () => {
      if (!currentUser?.id) {
        setIsPremium(false);
        setHasPremiumEntitlement(false);
        setHasBackendPremium(false);
        setCustomerInfo(null);
        return;
      }

      try {
        await Purchases.logIn(String(currentUser.id));
      } catch (e) {
        console.log("Error logging in user on change:", e);
      }

      await syncPlanWithBackend(currentUser);

      // 🔍 DEBUG — after user change
      await debugRevenueCatState("after-user-change", currentUser);
    };

    handleUserChange().catch(console.log);
  }, [currentUser?.id]);

  // ---------------------------
  // 💳 Purchase package
  // ---------------------------
  const purchasePackage = async (selectedPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      setCustomerInfo(customerInfo);
      applyMembershipStatus(customerInfo, currentUser);

      if (currentUser) {
        await syncPlanWithBackend(currentUser);
      }

      return customerInfo;
    } catch (e) {
      if (!e.userCancelled) {
        console.error("Purchase failed:", e);
      }
      throw e;
    }
  };

  // ---------------------------
  // ♻️ Restore purchases
  // ---------------------------
  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();

      setCustomerInfo(customerInfo);
      applyMembershipStatus(customerInfo, currentUser);

      if (currentUser) {
        await syncPlanWithBackend(currentUser);
      }

      return customerInfo;
    } catch (e) {
      console.log("Error restoring purchases:", e);
      throw e;
    }
  };

  // ---------------------------
  // Exported context value
  // ---------------------------
  const value = useMemo(
    () => ({
      currentOffering,
      isPremium,
      initializing,
      purchasePackage,
      restorePurchases,
      shouldShowAds: isTrialExpired && !isPremium,
      hasPremiumEntitlement,
      hasBackendPremium,
      customerInfo,
      refreshPlanFromRevenueCat: () => syncPlanWithBackend(currentUser),
      debugRevenueCatState,
    }),
    [
      currentOffering,
      isPremium,
      initializing,
      currentUser,
      isTrialExpired,
      hasPremiumEntitlement,
      hasBackendPremium,
      customerInfo,
    ]
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error("useRevenueCat must be inside provider");
  return ctx;
};
