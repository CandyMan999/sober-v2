import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "../../../../constants/colors";
import ToggleRow from "./ToggleRow";

const { accent, oceanBlue, textSecondary } = COLORS;

const NotificationSettingsSection = ({
  notificationsOpen,
  setNotificationsOpen,
  notificationSettings,
  handleNotificationSettingChange,
  savingNotificationKey,
}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.dropdownHeader}
      onPress={() => setNotificationsOpen((prev) => !prev)}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <Ionicons name="notifications" size={18} color={oceanBlue} />
        <Text style={styles.rowLabelWithIcon}>Notification settings</Text>
      </View>
      <Feather
        name={notificationsOpen ? "chevron-up" : "chevron-down"}
        size={18}
        color={textSecondary}
      />
    </TouchableOpacity>

    {notificationsOpen ? (
      <View style={styles.dropdownBody}>
        <ToggleRow
          icon={<Feather name="award" size={18} color={accent} />}
          label="Milestones"
          value={notificationSettings.otherUserMilestones}
          onValueChange={(value) =>
            handleNotificationSettingChange("otherUserMilestones", value)
          }
          activeColor={accent}
          loading={savingNotificationKey === "otherUserMilestones"}
        />
        <ToggleRow
          icon={<Feather name="message-circle" size={18} color={oceanBlue} />}
          label="Comments"
          value={notificationSettings.otherUserComments}
          onValueChange={(value) =>
            handleNotificationSettingChange("otherUserComments", value)
          }
          activeColor={oceanBlue}
          loading={savingNotificationKey === "otherUserComments"}
        />
        <ToggleRow
          icon={<Feather name="users" size={18} color={accent} />}
          label="Friends posts"
          value={notificationSettings.followingPosts}
          onValueChange={(value) =>
            handleNotificationSettingChange("followingPosts", value)
          }
          activeColor={accent}
          loading={savingNotificationKey === "followingPosts"}
        />
        <ToggleRow
          icon={<MaterialCommunityIcons name="beer" size={18} color={oceanBlue} />}
          label="Buddies near bars & liquor stores"
          value={notificationSettings.buddiesNearVenue}
          onValueChange={(value) =>
            handleNotificationSettingChange("buddiesNearVenue", value)
          }
          activeColor={oceanBlue}
          loading={savingNotificationKey === "buddiesNearVenue"}
        />
        <ToggleRow
          icon={<Feather name="sunrise" size={18} color={accent} />}
          label="Daily push notifications"
          value={notificationSettings.dailyPush}
          onValueChange={(value) =>
            handleNotificationSettingChange("dailyPush", value)
          }
          activeColor={accent}
          loading={savingNotificationKey === "dailyPush"}
        />
      </View>
    ) : null}
  </View>
);

export default NotificationSettingsSection;

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
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginLeft: 12,
  },
  dropdownBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    paddingBottom: 4,
  },
});
