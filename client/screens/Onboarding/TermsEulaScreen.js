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
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "../../constants/legal";

const TermsEulaScreen = () => {
  const openLink = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.paragraph}>Last updated: December 2025</Text>

        <Text style={styles.paragraph}>
          Welcome to Sober Motivation. These Terms of Service (“Terms”) are a
          contract between you and Sober Motivation (“Sober Motivation,” “we,”
          “us,” or “our”) that governs your access to and use of our mobile
          application and related services (collectively, the “Service”). By
          creating an account or using the Service, you agree to these Terms. If
          you do not agree, do not use the Service.
        </Text>

        <Text style={styles.sectionTitle}>Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old to use the Service. By using the
          Service, you represent that you are 18+ and legally permitted to use
          the Service in your region.
        </Text>

        <Text style={styles.sectionTitle}>Your Account</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your
          account and for all activity that occurs under it. You agree to
          provide accurate information and to keep your account information up
          to date. You may not share or transfer your account to others.
        </Text>

        <Text style={styles.sectionTitle}>Community Rules (Safety First)</Text>
        <Text style={styles.paragraph}>
          Sober Motivation is a sobriety-focused community. You agree not to:
        </Text>
        <Text style={styles.paragraph}>
          • Post unlawful, hateful, harassing, threatening, or violent content.
        </Text>
        <Text style={styles.paragraph}>
          • Post sexual content involving minors or attempt to engage with
          minors. (This results in immediate account action and may be reported
          as required by law.)
        </Text>
        <Text style={styles.paragraph}>
          • Post pornography, explicit nudity, or sexually explicit content.
        </Text>
        <Text style={styles.paragraph}>
          • Share private information about others, or encourage self-harm or
          harm to others.
        </Text>
        <Text style={styles.paragraph}>
          • Attempt to exploit, scrape, reverse engineer, disrupt, or abuse the
          Service (including spam, bots, or automated account creation).
        </Text>

        <Text style={styles.paragraph}>
          We may remove content, restrict features, suspend, or terminate
          accounts that violate these Terms or our community safety rules.
        </Text>

        <Text style={styles.sectionTitle}>User Content</Text>
        <Text style={styles.paragraph}>
          The Service may allow you to create, upload, and share content (for
          example videos, posts, captions, comments, and profile content) (“User
          Content”). You retain ownership of your User Content, but you grant us
          a license to host, store, display, reproduce, and distribute your User
          Content as needed to operate, improve, and promote the Service and to
          enforce these Terms. This license is non-exclusive, worldwide,
          royalty-free, and ends when your content is deleted from the Service,
          except to the extent the content has been shared with others and
          cannot reasonably be retrieved (or where retention is required for
          safety, legal, or operational reasons).
        </Text>

        <Text style={styles.sectionTitle}>Content Moderation & AI Tools</Text>
        <Text style={styles.paragraph}>
          To help keep the community safe, we use automated systems (including
          AI-based detection) and human review to identify and address content
          that may violate these Terms (for example nudity or explicit content).
          You understand that automated tools can make mistakes and we do not
          guarantee that all prohibited content will be detected or removed.
        </Text>

        <Text style={styles.sectionTitle}>Blocking & Reporting</Text>
        <Text style={styles.paragraph}>
          You can block users and report content in the app. Blocking prevents
          certain interactions. Reports help us investigate potential violations
          and take action when appropriate.
        </Text>

        <Text style={styles.sectionTitle}>Location-Based Safety Features</Text>
        <Text style={styles.paragraph}>
          The Service includes optional location-based safety features such as
          geo-fenced alerts when you are near certain venues (for example bars
          or liquor stores) and optional buddy alerts. These features require
          location permissions on your device and may require background
          location access depending on your settings.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldText}>
            We do not share your precise location with other users.
          </Text>{" "}
          Any safety alerts are designed to help you stay aware and supported.
          You can turn location features on or off at any time in the app and/or
          your device settings.
        </Text>

        <Text style={styles.sectionTitle}>Subscriptions & Billing</Text>
        <Text style={styles.paragraph}>
          Some features may be offered through auto-renewing subscriptions.
          Prices and billing terms are shown at the time of purchase. Payment is
          charged to your App Store account on confirmation. Subscriptions renew
          automatically unless cancelled at least 24 hours before the end of the
          current period. You can manage or cancel subscriptions in your App
          Store account settings. Free trials, if offered, convert to paid plans
          unless cancelled before the trial ends.
        </Text>

        <Text style={styles.sectionTitle}>No Medical Advice</Text>
        <Text style={styles.paragraph}>
          Sober Motivation provides educational and supportive tools and is not
          a medical device or healthcare provider. The Service does not provide
          medical advice, diagnosis, or treatment. If you are experiencing a
          medical emergency, call local emergency services immediately. Always
          seek the advice of a qualified professional with any questions you may
          have regarding a medical condition or treatment.
        </Text>

        <Text style={styles.sectionTitle}>
          Acceptable Use & Prohibited Conduct
        </Text>
        <Text style={styles.paragraph}>
          You agree to use the Service only for lawful purposes and in a manner
          consistent with these Terms. You may not attempt to interfere with the
          Service’s operation, access non-public areas, or use the Service to
          distribute malware or spam.
        </Text>

        <Text style={styles.sectionTitle}>Termination</Text>
        <Text style={styles.paragraph}>
          You may stop using the Service at any time. We may suspend or
          terminate your access to the Service if you violate these Terms or if
          we reasonably believe your use poses a risk to the community, the
          Service, or others. We may also discontinue or modify features of the
          Service at any time.
        </Text>

        <Text style={styles.sectionTitle}>Disclaimers</Text>
        <Text style={styles.paragraph}>
          The Service is provided “as is” and “as available” without warranties
          of any kind. To the fullest extent permitted by law, we disclaim all
          warranties, express or implied, including implied warranties of
          merchantability, fitness for a particular purpose, and non-
          infringement.
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the fullest extent permitted by law, Sober Motivation will not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits or revenues, whether incurred
          directly or indirectly, or any loss of data, use, goodwill, or other
          intangible losses resulting from (a) your access to or use of (or
          inability to access or use) the Service; (b) any conduct or content of
          any third party on the Service; or (c) unauthorized access, use, or
          alteration of your content or information.
        </Text>
        <Text style={styles.paragraph}>
          Some jurisdictions do not allow certain limitations of liability, so
          some of the above may not apply to you.
        </Text>

        <Text style={styles.sectionTitle}>Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to defend, indemnify, and hold harmless Sober Motivation and
          its affiliates from and against any claims, liabilities, damages,
          losses, and expenses (including reasonable legal fees) arising out of
          or in any way connected with your use of the Service or your violation
          of these Terms.
        </Text>

        <Text style={styles.sectionTitle}>Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of the United States and the
          state/region where our company is established, without regard to
          conflict of law principles. Depending on where you live, you may have
          additional rights under local laws.
        </Text>

        <Text style={styles.sectionTitle}>Changes to These Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time. If we make material
          changes, we will update the “Last updated” date and may provide
          additional notice within the app. Your continued use of the Service
          after changes take effect means you accept the revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>Contact & Support</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms or need support, contact us at
          <Text style={styles.boldText}> support@sobermotivation.app</Text>.
        </Text>

        <Text style={styles.title}>End User License Agreement (EULA)</Text>
        <Text style={styles.paragraph}>
          If you downloaded the app from the Apple App Store, your use of the
          app is also governed by Apple’s standard End User License Agreement
          (EULA), unless we provide a custom EULA. The Apple EULA explains your
          rights to install and use the app on Apple devices.
        </Text>

        <TouchableOpacity onPress={() => openLink(EULA_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            Read the Apple End User License Agreement
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>License Grant</Text>
        <Text style={styles.paragraph}>
          Subject to these Terms and the Apple EULA (if applicable), we grant
          you a personal, non-transferable, non-exclusive, revocable license to
          install and use the app on devices you own or control. You may not
          copy, modify, distribute, sell, lease, reverse engineer, or attempt to
          extract the source code of the app except as permitted by law.
        </Text>

        <Text style={styles.sectionTitle}>Related Policies</Text>
        <TouchableOpacity onPress={() => openLink(TERMS_OF_SERVICE_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            View Terms of Service on the web
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)}>
          <Text style={[styles.paragraph, styles.linkText]}>
            View Privacy Policy on the web
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

export default TermsEulaScreen;
