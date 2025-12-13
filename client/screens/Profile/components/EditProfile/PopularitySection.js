import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "../../../../constants/colors";

const { accent, border, cardBackground, textPrimary, textSecondary } = COLORS;

const PopularitySection = ({
  popularityOpen,
  setPopularityOpen,
  popularityStatus,
  popularityScore,
  popularityEntries,
  loadingPopularity,
}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.dropdownHeader}
      onPress={() => setPopularityOpen((prev) => !prev)}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name="rocket-launch"
          size={18}
          color={accent}
        />
        <Text style={styles.rowLabelWithIcon}>Popularity</Text>
      </View>

      <View style={styles.popularityHeaderRight}>
        <View style={styles.popularityStatusPill}>
          <Text style={styles.popularityStatusText}>{popularityStatus}</Text>
          <View style={styles.popularityScoreBadge}>
            <Text style={styles.popularityScoreText}>{`${popularityScore}%`}</Text>
          </View>
        </View>
        <Feather
          name={popularityOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={textSecondary}
        />
      </View>
    </TouchableOpacity>

    {popularityOpen ? (
      <>
        <Text style={styles.helperText}>
          Hit each milestone to unlock the next badge. Keep sharing, engaging,
          and cheering others on.
        </Text>

        <View style={styles.popularityGrid}>
          {popularityEntries.map((metric) => {
            const widthPercent = metric.progress * 100;
            const fillWidth = widthPercent > 0 ? Math.max(widthPercent, 6) : 0;

            return (
              <View key={metric.key} style={styles.popularityChip}>
                <View style={styles.popularityChipHeader}>
                  <Text style={styles.popularityChipLabel}>{metric.label}</Text>
                  <Text style={styles.popularityChipValue}>
                    {metric.displayValue}
                  </Text>
                </View>
                <View style={styles.popularityProgressTrack}>
                  <View
                    style={[
                      styles.popularityProgressFill,
                      { width: `${fillWidth}%` },
                    ]}
                  />
                </View>
                <Text style={styles.popularityMilestone}>{metric.milestoneLabel}</Text>
              </View>
            );
          })}
        </View>

        {loadingPopularity ? (
          <View style={styles.popularityLoadingRow}>
            <ActivityIndicator color={accent} />
            <Text style={styles.loadingText}>Refreshing your progress…</Text>
          </View>
        ) : null}
      </>
    ) : null}
  </View>
);

export default PopularitySection;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: border,
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
  popularityHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  popularityStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  popularityStatusText: {
    color: textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },
  popularityScoreBadge: {
    backgroundColor: "#0b1220",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  popularityScoreText: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 12,
  },
  helperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  popularityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  popularityChip: {
    width: "48%",
    backgroundColor: cardBackground,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: border,
  },
  popularityChipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  popularityChipLabel: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  popularityChipValue: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  popularityProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
    overflow: "hidden",
  },
  popularityProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: accent,
  },
  popularityMilestone: {
    color: textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
  popularityLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    color: textSecondary,
    fontSize: 12,
  },
});
