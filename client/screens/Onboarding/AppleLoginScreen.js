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
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Avatar from "../../components/Avatar";

import { useClient } from "../../client";
import { APPLE_LOGIN_MUTATION } from "../../GraphQL/mutations";
import { RANDOM_USERS_QUERY } from "../../GraphQL/queries";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";
import { getToken } from "../../utils/helpers";

const APPLE_ID_KEY = "appleUserId";
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
});

export default AppleLoginScreen;
