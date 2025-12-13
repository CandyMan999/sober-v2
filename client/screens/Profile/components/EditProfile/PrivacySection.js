import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../../../constants/colors";
import ToggleRow from "./ToggleRow";

const { accent, oceanBlue } = COLORS;

const PrivacySection = ({
  notificationSettings,
  handleNotificationSettingChange,
  savingNotificationKey,
  locationEnabled,
  handleLocationToggle,
  locationToggleLoading,
}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionLabel}>Privacy</Text>
    <ToggleRow
      icon={<Ionicons name="notifications" size={18} color={accent} />}
      label="All push notifications"
      value={notificationSettings.allPushEnabled}
      onValueChange={(value) => handleNotificationSettingChange("allPushEnabled", value)}
      activeColor={accent}
      loading={savingNotificationKey === "allPushEnabled"}
    />
    <ToggleRow
      icon={<Feather name="map-pin" size={18} color={oceanBlue} />}
      label="Location tracking"
      value={locationEnabled}
      onValueChange={handleLocationToggle}
      activeColor={oceanBlue}
      disabled={locationToggleLoading}
      loading={locationToggleLoading}
    />
    <Text style={styles.helperText}>
      We only use your location to catch when you might be hanging at a bar or
      liquor store so we can ping you and your sober buddies before you make any
      dumb decisions.
    </Text>
  </View>
);

export default PrivacySection;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: "center",
  },
});
