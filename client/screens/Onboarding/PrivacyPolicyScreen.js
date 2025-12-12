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
import {
  TERMS_OF_SERVICE_URL,
  PRIVACY_POLICY_URL,
} from "../../constants/legal";

const PrivacyPolicyScreen = () => {
  const openExternal = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.paragraph}>Last updated: December 2025</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy explains how Sober Motivation (“Sober Motivation,”
          “we,” “us,” or “our”) collects, uses, and shares information when you
          use our mobile application and related services (the “Service”). By
          using the Service, you agree to this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>Who Can Use the App</Text>
        <Text style={styles.paragraph}>
          Sober Motivation is intended for users age 18 and older. We do not
          knowingly collect personal information from anyone under 18. If you
          believe a minor has provided information to us, contact us and we will
          take appropriate steps.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly, information generated
          when you use the Service, and information from your device, as
          described below.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Account & profile information:</Text>{" "}
          such as a username, profile photo, sobriety-related settings you
          choose to share, and other profile fields you enter.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>User content:</Text> content you create
          or upload (for example posts, videos, captions, comments, reactions,
          and other content). If you block or report content, we store the
          block/ report and related identifiers to enforce safety features.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>
            Approximate location features (optional):
          </Text>{" "}
          if you enable location access, we use location permissions to power
          safety features like “near bar or liquor store” alerts and buddy
          warnings. We use geo-fencing and background location only when you
          enable these features and your device permissions allow it.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Important:</Text> we do{" "}
          <Text style={styles.boldText}>not</Text> display or share your precise
          location with other users. We do not publish your current coordinates
          to other users.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Device & usage data:</Text> such as app
          interactions, pages/screens viewed, approximate timestamps, device
          identifiers, IP address, app version, crash logs, and performance
          data. This helps us keep the Service stable, prevent abuse, and
          improve performance.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Push notifications:</Text> if you enable
          notifications, we store a push token to send you alerts (for example
          reminders, milestone notifications, social notifications, or safety
          alerts). You can change notification preferences in the app and/or in
          your device settings.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Information</Text>
        <Text style={styles.paragraph}>
          We use information to operate, maintain, and improve the Service,
          including to:
        </Text>

        <Text style={styles.paragraph}>
          • Provide core features (posting, feeds, comments, buddies, and
          settings).
        </Text>
        <Text style={styles.paragraph}>
          • Deliver optional safety features like geo-fenced venue alerts when
          enabled.
        </Text>
        <Text style={styles.paragraph}>
          • Moderate content and enforce our rules, including detecting and
          reducing explicit content.
        </Text>
        <Text style={styles.paragraph}>
          • Prevent fraud, abuse, and security incidents.
        </Text>
        <Text style={styles.paragraph}>
          • Communicate with you (support responses, important updates, and
          notifications you choose).
        </Text>

        <Text style={styles.sectionTitle}>
          Content Moderation & AI Detection
        </Text>
        <Text style={styles.paragraph}>
          We use automated tools (including AI-based detection) to help identify
          potentially explicit or inappropriate content (for example nudity).
          These systems may flag, limit visibility of, or remove content. We may
          also review flagged content to improve safety and enforce our rules.
        </Text>

        <Text style={styles.paragraph}>
          No automated system is perfect. If you believe your content was
          incorrectly flagged, you can contact support.
        </Text>

        <Text style={styles.sectionTitle}>How We Share Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share information
          only as described below:
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Service providers:</Text> we use trusted
          vendors to host infrastructure, store media, deliver notifications,
          process subscriptions, and provide analytics/crash reporting. They may
          process information on our behalf, under contracts that require
          appropriate safeguards.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Legal & safety:</Text> we may disclose
          information if required by law, or if we believe disclosure is
          necessary to protect users, the public, or our rights (for example to
          investigate abuse or security issues).
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Business transfers:</Text> if we are
          involved in a merger, acquisition, or sale of assets, information may
          be transferred as part of that transaction.
        </Text>

        <Text style={styles.sectionTitle}>Your Choices & Controls</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Location:</Text> you can enable/disable
          location features in the app and in your device settings. If you turn
          off location permissions, some features (like geo-fenced alerts) will
          not work.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Notifications:</Text> you can manage
          notification preferences in-app and/or through device settings.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>Account & content:</Text> you can update
          certain profile information in the app. You can also delete your
          account from within the app. When you delete your account, we take
          steps to remove or de-identify your information, subject to legal,
          security, and operational needs.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain information for as long as needed to provide the Service,
          comply with legal obligations, resolve disputes, enforce our policies,
          and maintain security. Retention periods vary depending on the type of
          data and how it is used.
        </Text>

        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.paragraph}>
          We use reasonable safeguards designed to protect your information.
          However, no method of transmission or storage is completely secure.
          Please use a strong device passcode and keep your account secure.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will update the “Last updated” date and may
          provide additional notice within the app.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Questions or requests? Reach us at{" "}
          <Text style={styles.boldText}>support@sobermotivation.app</Text>.
        </Text>

        <Text style={styles.sectionTitle}>Related Terms</Text>
        <TouchableOpacity onPress={() => openExternal(TERMS_OF_SERVICE_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            View Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openExternal(PRIVACY_POLICY_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            View this policy on the web
          </Text>
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
