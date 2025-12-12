import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Avatar from "../../components/Avatar";

import { useClient } from "../../client";
import {
  APPLE_LOGIN_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
} from "../../GraphQL/mutations";
import { FETCH_ME_QUERY, RANDOM_USERS_QUERY } from "../../GraphQL/queries";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";
import { getToken } from "../../utils/helpers";
import { EULA_URL, PRIVACY_POLICY_URL } from "../../constants/legal";

const APPLE_ID_KEY = "appleUserId";
const MIN_USERNAME_LENGTH = 3;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const { primaryBackground, textPrimary, textSecondary, accent } = COLORS;

/**
 * ✅ Final approved orbit layout (12 bubbles)
 */
const ORBIT_LAYOUT = [
  { top: -10, left: 10, size: 96 },
  { top: -20, right: 14, size: 88 },

  { top: 45, left: -8, size: 72 },
  { top: 45, right: -6, size: 70 },

  { top: 115, left: 14, size: 76 },
  { top: 115, right: 18, size: 74 },

  { top: 80, left: 120, size: 64 },
  { top: 125, right: 130, size: 82 },

  { top: 0, left: 150, size: 80 },
  { top: 190, left: 130, size: 68 },

  { top: 30, right: 65, size: 60 },
  { top: 165, right: 70, size: 66 },
];

const AppleLoginScreen = ({ navigation }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);

  const [loading, setLoading] = useState(false);
  const [facesLoading, setFacesLoading] = useState(false);
  const [featuredUsers, setFeaturedUsers] = useState([]);

  const updateLocationIfGranted = useCallback(
    async (token) => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== "granted") {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });

        const coords = position?.coords;

        if (!coords?.latitude || !coords?.longitude) {
          return;
        }

        await client.request(UPDATE_USER_PROFILE_MUTATION, {
          token,
          lat: coords.latitude,
          long: coords.longitude,
        });
      } catch (err) {
        console.log("Unable to refresh location:", err);
      }
    },
    [client]
  );

  const routeFromProfile = useCallback(
    async ({ me, token, appleId }) => {
      if (!me) {
        navigation.replace("AddUserName", { appleId, pushToken: token });
        return;
      }

      const hasUsername =
        me.username && me.username.trim().length >= MIN_USERNAME_LENGTH;

      if (!hasUsername) {
        navigation.replace("AddUserName", {
          appleId,
          username: me.username || "",
          photoURI: me.profilePicUrl || null,
          pushToken: token,
        });
        return;
      }

      const locationTrackingDisabled =
        me?.notificationSettings?.locationTrackingEnabled === false;
      const { status, scope } = await Location.getForegroundPermissionsAsync();
      const hasAlwaysPermission = status === "granted" && scope === "always";

      if (locationTrackingDisabled && me.sobrietyStartAt && me.profilePic) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "LocationPermission",
              params: { requireReenable: true },
            },
          ],
        });
        return;
      }

      if (hasAlwaysPermission && me.sobrietyStartAt && me.profilePic) {
        await updateLocationIfGranted(token);

        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
        return;
      }

      await updateLocationIfGranted(token);

      const nextRouteName = !me.profilePic
        ? "AddPhoto"
        : !me.sobrietyStartAt
        ? "AddSobrietyDate"
        : "LocationPermission";

      navigation.reset({
        index: 0,
        routes: [
          {
            name: nextRouteName,
            params: {
              username: me.username,
              photoURI: me.profilePicUrl || null,
              pushToken: token,
            },
          },
        ],
      });
    },
    [dispatch, navigation, updateLocationIfGranted]
  );

  useEffect(() => {
    let cancelled = false;

    const autoNavigateIfPossible = async () => {
      try {
        const [storedAppleId, token] = await Promise.all([
          AsyncStorage.getItem(APPLE_ID_KEY),
          getToken(),
        ]);

        if (!storedAppleId) return;

        setLoading(true);

        const { fetchMe } = await client.request(FETCH_ME_QUERY, {
          appleId: storedAppleId,
          token,
        });

        dispatch({ type: "SET_PROFILE_OVERVIEW", payload: fetchMe });
        dispatch({ type: "SET_USER", payload: fetchMe });

        if (cancelled) return;
        if (!!fetchMe) {
          await routeFromProfile({
            me: fetchMe,
            token,
            appleId: storedAppleId,
          });
        }
      } catch (err) {
        console.log("Auto navigation check failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    autoNavigateIfPossible();

    return () => {
      cancelled = true;
    };
  }, [client, routeFromProfile]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const appleId = credential?.user;
      if (!appleId) return;

      await AsyncStorage.setItem(APPLE_ID_KEY, appleId);
      const token = await getToken();

      const { appleLogin } = await client.request(APPLE_LOGIN_MUTATION, {
        appleId,
        token,
      });

      if (appleLogin) {
        dispatch({ type: "SET_USER", payload: appleLogin });
      }

      navigation.replace("AddUserName", { appleId });
    } catch (err) {
      if (err?.code !== "ERR_CANCELED") {
        Alert.alert("Sign-in error", "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [client, dispatch, navigation]);

  const randomizedFaces = useMemo(() => {
    if (!featuredUsers.length) return [];
    return [...featuredUsers]
      .filter((u) => !!u.avatar)
      .sort(() => Math.random() - 0.5)
      .slice(0, ORBIT_LAYOUT.length);
  }, [featuredUsers]);

  const orbitFaces = useMemo(() => {
    const withHalo = randomizedFaces.map((face) => ({
      ...face,
      haloColor: Math.random() < 0.5 ? "orange" : "blue",
    }));

    const missing = ORBIT_LAYOUT.length - withHalo.length;
    const placeholders = Array.from({ length: Math.max(0, missing) }).map(
      (_, i) => ({
        id: `placeholder-${i}`,
        avatar: null,
        haloColor: Math.random() < 0.5 ? "orange" : "blue",
      })
    );

    return [...withHalo, ...placeholders];
  }, [randomizedFaces]);

  useEffect(() => {
    let mounted = true;

    const loadFaces = async () => {
      try {
        setFacesLoading(true);
        const data = await client.request(RANDOM_USERS_QUERY);
        if (!mounted) return;

        setFeaturedUsers(
          (data?.users || []).map((u) => ({
            id: u.id,
            userId: u.id,
            username: u.username,
            avatar: u.profilePic?.url || u.profilePicUrl,
          }))
        );
      } finally {
        mounted && setFacesLoading(false);
      }
    };

    loadFaces();
    return () => (mounted = false);
  }, [client]);

  return (
    <LinearGradient
      colors={["#020617", "#050816", "#0b1120", "#020617"]}
      style={styles.container}
    >
      <View style={styles.spacerTop} />

      <View style={styles.center}>
        <Image source={LogoIcon} style={styles.logo} />

        <Text style={styles.title}>
          Sober <Text style={styles.titleAccent}>Motivation</Text>
        </Text>
        <Text style={styles.subtitle}>Stay accountable with the crew</Text>

        <View style={styles.orbit}>
          {facesLoading && <ActivityIndicator color={accent} />}

          {!facesLoading &&
            orbitFaces.map((face, i) => {
              const cfg = ORBIT_LAYOUT[i];
              if (!cfg) return null;

              return (
                <View
                  key={face.id || i}
                  pointerEvents="none"
                  style={[
                    styles.faceWrapper,
                    {
                      width: cfg.size,
                      height: cfg.size,
                      top: cfg.top,
                      ...(cfg.left != null && { left: cfg.left }),
                      ...(cfg.right != null && { right: cfg.right }),
                    },
                  ]}
                >
                  <Avatar
                    uri={face.avatar}
                    userId={face.userId}
                    username={face.username}
                    size={cfg.size - 8}
                    haloColor={face.haloColor}
                    disableNavigation
                  />
                </View>
              );
            })}
        </View>
      </View>

      <View style={styles.buttonArea}>
        {/* BLACK button with subtle light shadow */}
        <View style={styles.appleButtonShadow}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            style={styles.button}
            cornerRadius={999}
            onPress={handleAppleSignIn}
            disabled={loading}
          />
        </View>

        <Text style={styles.or}>- or -</Text>

        {/* White button (no shadow needed) */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          style={styles.button}
          cornerRadius={999}
          onPress={handleAppleSignIn}
          disabled={loading}
        />

        <Text style={styles.legalIntro}>By continuing you agree to our</Text>
        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("TermsEula")}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("PrivacyPolicy")}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL(EULA_URL)}
          activeOpacity={0.7}
        >
          <Text style={[styles.legalLink, styles.legalEula]}>
            Apple End User License Agreement
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: primaryBackground,
  },
  spacerTop: { height: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: textPrimary,
  },
  titleAccent: { color: accent },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: textSecondary,
  },
  orbit: {
    width: SCREEN_WIDTH * 1.08,
    height: 240,
    marginTop: 18,
    position: "relative",
    overflow: "visible",
  },
  faceWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonArea: {
    paddingBottom: 40,
    gap: 10,
  },
  button: {
    width: "100%",
    height: 54,
  },
  appleButtonShadow: {
    borderRadius: 999,
    shadowColor: "#ffffff",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  or: {
    textAlign: "center",
    fontSize: 13,
    color: "#9ba3b4",
  },
  legalIntro: {
    marginTop: 8,
    fontSize: 12,
    color: "#9ba3b4",
    textAlign: "center",
  },
  legalRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  legalDivider: {
    color: "#9ba3b4",
    fontSize: 12,
  },
  legalLink: {
    color: accent,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalEula: {
    marginTop: 4,
    textAlign: "center",
  },
});

export default AppleLoginScreen;
