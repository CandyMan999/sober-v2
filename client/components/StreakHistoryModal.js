// components/StreakHistoryModal.js
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const ACCENT = "#F59E0B";
const BG = "#020617";
const BORDER = "#1F2937";

const screenWidth = Dimensions.get("window").width;

// ---- HELPERS ----

// Normalize various date shapes: Date, millis number, "millis string", ISO
const toDate = (value) => {
  if (!value && value !== 0) return null;

  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // Number → treat as epoch millis
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    // pure digits → epoch millis
    if (/^\d+$/.test(value)) {
      const d = new Date(parseInt(value, 10));
      return isNaN(d.getTime()) ? null : d;
    }

    // Otherwise let Date parse (ISO, etc.)
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

const dayDiff = (start, end) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;

  const ms = e.getTime() - s.getTime();
  if (ms <= 0) return 0;

  return ms / (1000 * 60 * 60 * 24);
};

const formatShortRange = (start, end) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "";

  const sStr = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const eStr = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${sStr} – ${eStr}`;
};

const formatDateLabel = (date, isCurrent = false) => {
  const d = toDate(date);
  if (!d) return isCurrent ? "Now" : "";
  const base = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return isCurrent ? "Now" : base;
};

const StreakHistoryModal = ({
  visible,
  onClose,
  streaks = [],
  currentStartDate,
  now = new Date(),
}) => {
  const { items, longestStreak, currentStreakDays, relapseCount } =
    useMemo(() => {
      const list = [];

      // Past streaks from history
      streaks.forEach((s, idx) => {
        if (!s.startAt || !s.endAt) return;

        const endDate = toDate(s.endAt);
        const days = dayDiff(s.startAt, s.endAt);
        if (!endDate || !days || days <= 0) return;

        list.push({
          key: `past-${idx}`,
          label: `S${idx + 1}`,
          rangeLabel: formatShortRange(s.startAt, s.endAt),
          days: Math.floor(days),
          isCurrent: false,
          date: endDate,
          dateLabel: formatDateLabel(endDate),
        });
      });

      // Current running streak
      let currentStreakDays = 0;
      if (currentStartDate) {
        const start = toDate(currentStartDate);
        if (start) {
          currentStreakDays = Math.floor(dayDiff(start, now));
          if (currentStreakDays > 0) {
            const nowDate = toDate(now);
            list.push({
              key: "current",
              label: "Now",
              rangeLabel: formatShortRange(start, now),
              days: currentStreakDays,
              isCurrent: true,
              date: nowDate,
              dateLabel: formatDateLabel(nowDate, true),
            });
          }
        }
      }

      // sort by end date so the line graph flows in time
      list.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.getTime() - b.date.getTime();
      });

      const longestStreak =
        list.length > 0 ? Math.max(...list.map((i) => i.days)) : 0;

      const relapseCount = streaks.length;

      return { items: list, longestStreak, currentStreakDays, relapseCount };
    }, [streaks, currentStartDate, now]);

  const chartData = useMemo(() => {
    if (!items || items.length === 0) return null;

    return {
      labels: items.map((i) => i.dateLabel),
      datasets: [
        {
          data: items.map((i) => (i.days <= 0 ? 1 : i.days)), // min 1 so line shows
        },
      ],
    };
  }, [items]);

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Streak history</Text>
            <Text style={styles.headerSubtitle}>
              How your sober streaks have evolved over time.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Thin accent divider */}
        <View style={styles.headerDivider} />

        {/* Summary chips */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>Longest streak</Text>
            <Text style={styles.summaryValue}>
              {longestStreak} day{longestStreak === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={{ ...styles.summaryLabel, color: ACCENT }}>
              Current streak
            </Text>
            <Text style={styles.summaryValue}>
              {currentStreakDays} day{currentStreakDays === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>Relapses logged</Text>
            <Text style={styles.summaryValue}>{relapseCount}</Text>
          </View>
        </View>

        {!items || items.length === 0 || !chartData ? (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>
              Once you’ve logged a few streaks, you’ll see a timeline of your
              sober days here.
            </Text>
          </View>
        ) : (
          <>
            {/* Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle}>Days sober per streak</Text>
              </View>

              {/* Picker / interaction hint */}
              <View style={styles.chartHintRow}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={14}
                  color="#9CA3AF"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.chartHintText}>
                  Tap & swipe to explore your timeline
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScroll}
              >
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth - 32, items.length * 70)}
                  height={260}
                  fromZero
                  bezier
                  withInnerLines
                  withDots
                  segments={4}
                  chartConfig={{
                    backgroundColor: BG,
                    backgroundGradientFrom: BG,
                    backgroundGradientTo: BG,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(248, 250, 252, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(156, 163, 175, ${opacity})`,
                    propsForDots: {
                      r: "4",
                    },
                  }}
                  style={styles.chart}
                />
              </ScrollView>
            </View>

            {/* Labels under chart */}
            {/* Labels under chart */}
            <View style={styles.labelsList}>
              <Text style={styles.listTitle}>Streak breakdown</Text>

              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                {items.map((i) => (
                  <View key={i.key} style={styles.labelRow}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: i.isCurrent ? ACCENT : "#2563EB" },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labelTitle}>
                        {i.isCurrent ? "Current streak" : `Past streak`}
                      </Text>
                      <Text style={styles.labelSubtitle}>
                        {i.rangeLabel} · {i.days} day
                        {i.days === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.25)",
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  summaryChip: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  summaryValue: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#020617",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  chartHeaderRow: {
    marginBottom: 4,
  },
  chartTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  chartHintRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    marginTop: 4,
    marginBottom: 4,
  },
  chartHintText: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  chartScroll: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  chart: {
    borderRadius: 16,
  },
  labelsList: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#020617",
    paddingVertical: 8,
    paddingHorizontal: 10,
    flex: 1,
    minHeight: 120,
  },
  listTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  labelTitle: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
  labelSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});

export default StreakHistoryModal;
