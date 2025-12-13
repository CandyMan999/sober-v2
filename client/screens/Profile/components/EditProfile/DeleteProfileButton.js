import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../../../constants/colors";

const DeleteProfileButton = ({ deletingAccount, onPress }) => (
  <View style={[styles.sectionCard, styles.deleteSectionCard]}>
    <TouchableOpacity
      style={styles.deleteProfileButton}
      activeOpacity={0.9}
      disabled={deletingAccount}
      onPress={onPress}
    >
      <View
        style={[
          styles.deleteProfileInner,
          deletingAccount && styles.deleteProfileInnerDisabled,
        ]}
      >
        <View style={styles.deleteProfileContent}>
          <View style={styles.deleteProfileIconBadge}>
            <Feather name="trash-2" size={16} color="#fecaca" />
          </View>

          <View style={styles.deleteProfileTextBlock}>
            <Text style={styles.deleteProfileTitle}>Delete profile</Text>
          </View>

          <View style={styles.deleteProfileRight}>
            {deletingAccount ? (
              <ActivityIndicator color="#fecaca" size="small" />
            ) : (
              <Feather name="arrow-right" size={16} color="#fecaca" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  </View>
);

export default DeleteProfileButton;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
  },
  deleteSectionCard: {
    marginTop: 22,
  },
  deleteProfileButton: {
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteProfileInner: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)", // same red border
    backgroundColor: "rgba(248,113,113,0.12)", // soft transparent red fill
  },
  deleteProfileInnerDisabled: {
    opacity: 0.7,
  },
  deleteProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteProfileIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(127,29,29,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.85)",
  },
  deleteProfileTextBlock: {
    flex: 1,
  },
  deleteProfileTitle: {
    color: "#fee2e2",
    fontWeight: "800",
    fontSize: 14,
  },
  deleteProfileSubtitle: {
    color: "#fecaca",
    fontSize: 11,
    marginTop: 2,
  },
  deleteProfileRight: {
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
