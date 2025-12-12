import React from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL } from "../../constants/legal";

const PrivacyPolicyScreen = () => {
  const openExternal = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.paragraph}>Last updated: July 2024</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy explains how Sober Motivation collects, uses, and
          shares information when you use our mobile application (the
          "Service"). By continuing to use the Service, you agree to this
          policy.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly, such as your account
          details and profile content. We also collect certain device and usage
          data to keep the Service running smoothly and secure.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Information</Text>
        <Text style={styles.paragraph}>
          We use your information to operate and improve the Service, personalize
          your experience, communicate with you, and comply with legal
          obligations. We do not sell your personal information.
        </Text>

        <Text style={styles.sectionTitle}>Sharing</Text>
        <Text style={styles.paragraph}>
          We may share limited information with trusted providers that help us
          deliver the Service (for example, messaging, analytics, or cloud
          hosting). We require these partners to safeguard your data.
        </Text>

        <Text style={styles.sectionTitle}>Your Choices</Text>
        <Text style={styles.paragraph}>
          You can update or delete your information from within the app. You can
          also control notifications and location permissions in your device
          settings at any time.
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.paragraph}>
          We use reasonable safeguards to protect your information, but no
          online service can guarantee absolute security. Please keep your
          account details secure and contact us if you suspect unauthorized use.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Questions? Reach us at <Text style={styles.boldText}>support@sobermotivation.app</Text>.
        </Text>

        <Text style={styles.sectionTitle}>Related Terms</Text>
        <TouchableOpacity onPress={() => openExternal(TERMS_OF_SERVICE_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>View Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openExternal(PRIVACY_POLICY_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>View this policy on the web</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  linkText: {
    color: COLORS.accentSoft,
    textDecorationLine: "underline",
  },
  footerSpacing: {
    height: 24,
  },
});

export default PrivacyPolicyScreen;
