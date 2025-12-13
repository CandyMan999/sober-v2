import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ToggleSwitch } from "../../../../components";
import { COLORS } from "../../../../constants/colors";

const ToggleRow = ({
  icon,
  label,
  value,
  onValueChange,
  activeColor,
  disabled = false,
  loading = false,
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowLabelWithIcon}>{label}</Text>
    </View>
    <ToggleSwitch
      value={value}
      onValueChange={onValueChange}
      activeColor={activeColor}
      disabled={disabled || loading}
      loading={loading}
    />
  </View>
);

export default ToggleRow;

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
});
