import { useCallback } from "react";
import { Linking } from "react-native";

export function useOpenSocial() {
  const openSocial = useCallback(async (platform, socialsData) => {
    if (!socialsData) return;

    const app = socialsData.deeplink?.app || null;
    const web = socialsData.deeplink?.web || socialsData.website || app;

    if (!app && !web) return;

    try {
      if (app) {
        const canOpen = await Linking.canOpenURL(app);

        if (canOpen) {
          await Linking.openURL(app);
          return;
        }
      }

      if (web) {
        await Linking.openURL(web);
      }
    } catch (err) {
      console.warn(`Error opening ${platform} link:`, err);
      if (web) {
        await Linking.openURL(web);
      }
    }
  }, []);

  return { openSocial };
}
