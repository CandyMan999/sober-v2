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
import { EULA_URL, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "../../constants/legal";

const TermsEulaScreen = () => {
  const openLink = (url) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.paragraph}>Last updated: July 2024</Text>

        <Text style={styles.paragraph}>
          Welcome to Sober Motivation. These Terms of Service (“Terms”) are a
          contract between you and Sober Motivation that describes your rights
          and responsibilities when using our mobile application and related
          services (collectively, the “Service”). By creating an account or
          continuing to use the Service, you agree to these Terms.
        </Text>

        <Text style={styles.sectionTitle}>Using the Service</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old and legally allowed to use the
          Service in your region. You are responsible for the security of your
          account and for all activity that happens under it. You agree not to
          engage in any harmful, abusive, or illegal behavior while using the
          Service.
        </Text>
        <Text style={styles.paragraph}>
          We may update, suspend, or terminate the Service at any time to keep
          our community safe or to comply with legal requirements. We may also
          send you important updates about the Service by push notification or
          email.
        </Text>

        <Text style={styles.sectionTitle}>Subscriptions & Billing</Text>
        <Text style={styles.paragraph}>
          Some features of the Service are offered through auto-renewing
          subscriptions. Renewal charges occur at the end of each billing period
          unless you cancel at least 24 hours beforehand in your device
          settings. Free trials, if offered, will convert to paid plans unless
          canceled before renewal.
        </Text>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.paragraph}>
          We respect your privacy and handle your information as described in
          our Privacy Policy. We do not sell your phone number or personal
          details, and we only share information with trusted partners as needed
          to deliver the Service.
        </Text>

        <Text style={styles.sectionTitle}>Safety & Community Guidelines</Text>
        <Text style={styles.paragraph}>
          Keep your profile authentic, be respectful to others, and avoid
          posting content that is violent, hateful, explicit, or otherwise
          inappropriate. We may remove content or restrict accounts that break
          these rules or violate the law.
        </Text>

        <Text style={styles.sectionTitle}>Contact & Support</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms or need support, reach us at
          <Text style={styles.boldText}> support@sobermotivation.app</Text>.
        </Text>

        <Text style={styles.title}>End User License Agreement (EULA)</Text>
        <Text style={styles.paragraph}>
          Your use of Sober Motivation is also governed by the standard Apple
          End User License Agreement (EULA) applicable to apps downloaded from
          the App Store. The Apple EULA explains your rights to install and use
          the app on Apple devices.
        </Text>

        <TouchableOpacity onPress={() => openLink(EULA_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            Read the Apple End User License Agreement
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>License Grant</Text>
        <Text style={styles.paragraph}>
          We grant you a personal, non-transferable, non-exclusive license to
          install and use the app on devices you own or control in accordance
          with the Apple EULA. You may not reverse engineer, modify, or resell
          the app.
        </Text>

        <Text style={styles.sectionTitle}>Disclaimers</Text>
        <Text style={styles.paragraph}>
          Sober Motivation is provided “as is” without warranties of any kind.
          We are not liable for damages resulting from your use of the Service
          except as required by law. Some regions do not allow the exclusion of
          implied warranties, so these limitations may not apply to you.
        </Text>

        <Text style={styles.sectionTitle}>Updates to these Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms or the EULA notice from time to time. We will
          post the updated version in the app. Continued use of the Service
          after changes take effect means you accept the revised terms.
        </Text>

        <Text style={styles.sectionTitle}>Related Policies</Text>
        <TouchableOpacity onPress={() => openLink(TERMS_OF_SERVICE_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>View Terms of Service on the web</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>View Privacy Policy on the web</Text>
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

export default TermsEulaScreen;
