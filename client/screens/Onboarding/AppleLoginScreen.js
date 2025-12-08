import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Image, FlatList } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { useClient } from "../../client";
import { APPLE_LOGIN_MUTATION } from "../../GraphQL/mutations";
import { RANDOM_USERS_QUERY } from "../../GraphQL/queries";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";
import { getToken } from "../../utils/helpers";

const APPLE_ID_KEY = "appleUserId";

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

      if (!appleId) {
        Alert.alert("Sign-in failed", "We couldn't get your Apple ID.");
        return;
      }

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
      if (err?.code === "ERR_CANCELED") return;
      console.log("Apple sign-in error", err);
      Alert.alert(
        "Sign-in error",
        "Please try again or use a different device."
      );
    } finally {
      setLoading(false);
    }
  }, [client, dispatch, navigation]);

  const randomizedFaces = useMemo(() => {
    if (!featuredUsers?.length) return [];
    return [...featuredUsers]
      .filter((user) => !!user?.avatar)
      .sort(() => Math.random() - 0.5)
      .slice(0, 9);
  }, [featuredUsers]);

  useEffect(() => {
    let isMounted = true;
    const fetchFaces = async () => {
      try {
        setFacesLoading(true);
        const limit = 18;
        const offset = Math.floor(Math.random() * 50);
        const data = await client.request(RANDOM_USERS_QUERY, {
          limit,
          offset,
        });

        if (!isMounted) return;

        const users = data?.users || [];
        const mappedUsers = [...users]
          .sort(() => Math.random() - 0.5)
          .slice(0, 14)
          .map((user) => ({
            id: user?.id,
            username: user?.username,
            avatar: user?.profilePic?.url || user?.profilePicUrl,
          }));

        setFeaturedUsers(mappedUsers);
      } catch (err) {
        console.log("Face fetch error", err);
      } finally {
        if (isMounted) setFacesLoading(false);
      }
    };

    fetchFaces();

    return () => {
      isMounted = false;
    };
  }, [client]);

  return (
    <LinearGradient
      colors={["#0b0b0f", "#0f1119", "#0b0b0f"]}
      style={styles.container}
    >
      <View style={styles.topSection}>
        <Text style={styles.title}>Log into Sober Motivation</Text>
        <Text style={styles.subtitle}>Continue with your existing account</Text>
      </View>

      <View style={styles.logoCenter}>
        <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.faceCluster}>
        <View style={styles.faceHeader}>
          <Text style={styles.faceHeaderText}>Meet the community</Text>
          {facesLoading && <ActivityIndicator color={COLORS.accent} />}
        </View>
        {!facesLoading && !randomizedFaces.length && (
          <Text style={styles.emptyText}>Faces will show here</Text>
        )}
        {facesLoading ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : (
          <FlatList
            data={randomizedFaces}
            keyExtractor={(item) => item.id || item.username}
            numColumns={3}
            contentContainerStyle={styles.faceList}
            columnWrapperStyle={styles.faceColumn}
            renderItem={({ item }) => (
              <View style={styles.faceWrapper}>
                <LinearGradient
                  colors={["#ff2d55", "#00f2ea"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.faceRing}
                >
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.face}
                    resizeMode="cover"
                  />
                </LinearGradient>
                <Text style={styles.faceName} numberOfLines={1}>
                  {item.username}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.buttonStack}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          disabled={loading}
        />
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={14}
          style={[styles.appleButton, styles.altAppleButton]}
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
    backgroundColor: "#05050a",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  topSection: {
    marginBottom: 28,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 15,
    color: "#9ba3b4",
  },
  logoCenter: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  faceCluster: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 24,
  },
  faceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  faceHeaderText: {
    color: "#f8f9fc",
    fontWeight: "700",
    fontSize: 14,
  },
  faceList: {
    alignItems: "center",
  },
  faceColumn: {
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 12,
  },
  faceWrapper: {
    alignItems: "center",
    width: 96,
  },
  faceRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00f2ea",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  face: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  faceName: {
    marginTop: 6,
    fontSize: 12,
    color: "#dce1ea",
  },
  emptyText: {
    color: "#8c93a3",
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 13,
  },
  buttonStack: {
    width: "100%",
    gap: 14,
    marginTop: 10,
  },
  appleButton: {
    width: "100%",
    height: 56,
  },
  altAppleButton: {
    backgroundColor: "#f1f1f1",
  },
});

export default AppleLoginScreen;
