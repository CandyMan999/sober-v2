import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../../../constants/colors";

const { accent, border, nightBlue, oceanBlue, textPrimary, textSecondary } = COLORS;

const SocialLinksSection = ({
  socialOpen,
  setSocialOpen,
  socialConfig,
  socialValidation,
  socialInputs,
  setSocialInputs,
  handleSaveSocialLinks,
  isSocialValid,
  savingSocial,
}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.dropdownHeader}
      onPress={() => setSocialOpen((prev) => !prev)}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <Ionicons name="share-social" size={18} color={oceanBlue} />
        <Text style={styles.rowLabelWithIcon}>Social links</Text>
      </View>
      <Feather
        name={socialOpen ? "chevron-up" : "chevron-down"}
        size={18}
        color={textSecondary}
      />
    </TouchableOpacity>

    {socialOpen ? (
      <>
        <Text style={styles.helperText}>
          Add your usernames (Optional) so friends can tap straight to your
          profile.
        </Text>

        {Object.entries(socialConfig).map(([platform, config]) => {
          const error = socialValidation[platform];

          return (
            <View key={platform} style={styles.socialRow}>
              <View style={styles.rowLeft}>
                {config.icon}
                <Text style={styles.rowLabelWithIcon}>{config.label}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={config.placeholder}
                placeholderTextColor={textSecondary}
                value={socialInputs[platform] || ""}
                onChangeText={(text) =>
                  setSocialInputs((prev) => ({
                    ...prev,
                    [platform]: text,
                  }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <Text
                style={[
                  styles.validationText,
                  error ? styles.validationError : null,
                ]}
              >
                {error || `Paste a link or ${config.placeholder}.`}
              </Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSocialLinks}
          disabled={!isSocialValid || savingSocial}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              !isSocialValid || savingSocial ? [border, border] : [accent, accent]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.saveButtonInner,
              (!isSocialValid || savingSocial) && styles.saveButtonDisabled,
            ]}
          >
            {savingSocial ? (
              <ActivityIndicator color={nightBlue} />
            ) : (
              <Text style={styles.saveButtonText}>Save social links</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </>
    ) : null}
  </View>
);

export default SocialLinksSection;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  rowLabelWithIcon: {
    color: textPrimary,
    fontWeight: "700",
    marginLeft: 12,
  },
  helperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  socialRow: {
    marginTop: 8,
  },
  input: {
    backgroundColor: nightBlue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },
  validationText: {
    color: textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  validationError: {
    color: accent,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonInner: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: nightBlue,
    fontWeight: "800",
  },
});
