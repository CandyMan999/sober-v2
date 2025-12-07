import React, { useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { useClient } from "../../client";
import { APPLE_LOGIN_MUTATION } from "../../GraphQL/mutations";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";

const APPLE_ID_KEY = "appleUserId";

const AppleLoginScreen = ({ navigation }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);
  const [loading, setLoading] = useState(false);

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

      const { appleLogin } = await client.request(APPLE_LOGIN_MUTATION, {
        appleId,
      });

      if (appleLogin) {
        dispatch({ type: "SET_USER", payload: appleLogin });
      }

      navigation.replace("AddUserName", { appleId });
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.log("Apple sign-in error", err);
      Alert.alert("Sign-in error", "Please try again or use a different device.");
    } finally {
      setLoading(false);
    }
  }, [client, dispatch, navigation]);

  return (
    <View style={styles.container}>
      <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Sign in with Apple</Text>
      <Text style={styles.subtitle}>
        Securely continue with your Apple ID to keep your progress synced.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        activeOpacity={0.9}
        onPress={handleAppleSignIn}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ["#4B5563", "#4B5563"] : [COLORS.accent, COLORS.accentSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.buttonText}>Continue with Apple</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AppleLoginScreen;
