// pages/SoberTimeScreen/SoberTimeScreen.js
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { LiquidGlassView } from "@callstack/liquid-glass";

import { AlertModal, StreakHistoryModal } from "../../components";
import { RESET_SOBRIETY_MUTATION } from "../../GraphQL/mutations";
import Context from "../../context";
import { useClient } from "../../client";
import { COLORS } from "../../constants/colors";

const MILESTONES = [1, 2, 3, 5, 7, 10, 14, 30, 60, 90, 180, 365];

const parseStartDate = (raw) => {
  if (!raw) return null;
  if (!isNaN(Number(raw))) {
    const d = new Date(Number(raw));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const SoberTimeScreen = () => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const user = state?.user || {};
  const authToken = user?.token || null;
  const rawStart = user?.sobrietyStartAt;
  const milestonesNotified = user?.milestonesNotified || [];
  const streaks = user?.streaks || [];

  const scrollViewRef = useRef(null);
  const storedStartDate = parseStartDate(rawStart);

  const [selectedDate, setSelectedDate] = useState(
    storedStartDate || new Date()
  );
  const [useToday, setUseToday] = useState(!storedStartDate);
  const [showPicker, setShowPicker] = useState(false);
  const [savingReset, setSavingReset] = useState(false);
  const [hasPendingCustomDate, setHasPendingCustomDate] = useState(false);

  // History full-screen modal
  const [historyVisible, setHistoryVisible] = useState(false);

  // Modal: confirm + error
  const [modalState, setModalState] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    confirmLabel: undefined,
    cancelLabel: undefined,
    onConfirm: undefined,
    onCancel: undefined,
  });

  const openErrorModal = (message) => {
    setModalState({
      visible: true,
      type: "error",
      title: "Can’t update date",
      message,
      confirmLabel: "Close",
      cancelLabel: undefined,
      onConfirm: () =>
        setModalState((prev) => ({
          ...prev,
          visible: false,
        })),
      onCancel: () =>
        setModalState((prev) => ({
          ...prev,
          visible: false,
        })),
    });
  };

  const openConfirmTodayModal = (today) => {
    setModalState({
      visible: true,
      type: "confirm",
      title: "Reset sobriety date?",
      message:
        "Are you sure you want to reset your sobriety date to today? This will close your current streak and start a new one.",
      confirmLabel: "Yes, reset",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        setModalState((prev) => ({ ...prev, visible: false }));

        setUseToday(true);
        setShowPicker(false);
        setSelectedDate(today);
        setHasPendingCustomDate(false);

        await persistSobrietyDate(today);
      },
      onCancel: () =>
        setModalState((prev) => ({
          ...prev,
          visible: false,
        })),
    });
  };

  useEffect(() => {
    const newParsed = parseStartDate(rawStart);
    if (newParsed) {
      setSelectedDate(newParsed);
      setUseToday(false);
      setHasPendingCustomDate(false);
    }
  }, [rawStart]);

  const effectiveStartDate =
    selectedDate && !isNaN(selectedDate) ? selectedDate : storedStartDate;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = useMemo(() => {
    if (!effectiveStartDate) return null;
    const ms = now - effectiveStartDate;
    if (ms <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  }, [now, effectiveStartDate]);

  const currentDays = diff ? diff.days : 0;

  const averageRelapseDay = useMemo(() => {
    const serverValue =
      user?.averageRelapseDay != null ? Number(user.averageRelapseDay) : null;

    if (serverValue != null && Number.isFinite(serverValue) && serverValue > 0)
      return serverValue;

    if (!streaks.length) return null;

    const durations = streaks
      .map((s) => {
        if (!s.startAt || !s.endAt) return null;
        const start = parseStartDate(s.startAt);
        const end = parseStartDate(s.endAt);
        if (!start || !end) return null;

        const ms = end.getTime() - start.getTime();
        if (ms <= 0) return null;

        return ms / (1000 * 60 * 60 * 24);
      })
      .filter((value) => value != null && !Number.isNaN(value));

    if (!durations.length) return null;

    const avg =
      durations.reduce((sum, days) => sum + days, 0) / durations.length;

    return Math.round(avg);
  }, [streaks, user?.averageRelapseDay]);

  const nextMilestone = diff
    ? MILESTONES.find((m) => m > currentDays) || null
    : null;

  const daysToNext =
    diff && nextMilestone != null ? nextMilestone - currentDays : null;

  // Progress to next milestone
  let progressToNext = 0;
  let elapsedHours = 0;
  if (diff && nextMilestone != null && nextMilestone > 0) {
    // Use hours for the first 3 days
    if (currentDays < 3) {
      elapsedHours =
        diff.days * 24 + diff.hours + diff.minutes / 60 + diff.seconds / 3600;
      const totalHoursToNext = nextMilestone * 24;
      progressToNext = Math.min(1, elapsedHours / totalHoursToNext);
    } else {
      // After that, use day-based progress
      progressToNext = Math.min(1, currentDays / nextMilestone);
    }
  }

  const pastMilestones = diff ? MILESTONES.filter((m) => m <= currentDays) : [];
  const upcomingMilestones = diff
    ? MILESTONES.filter((m) => m > currentDays).slice(0, 3)
    : [];

  const formatTwo = (n) => (n < 10 ? `0${n}` : `${n}`);

  const formatDate = (d) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Validation now uses modal only
  const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      openErrorModal(
        "You can’t choose a future date. Pick today or a past date."
      );
      return false;
    }
    return true;
  };

  const isToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return today.getTime() === selected.getTime();
  };

  const persistSobrietyDate = async (newDate) => {
    if (!authToken) {
      console.log("No auth token; skipping RESET_SOBRIETY_MUTATION");
      return;
    }

    try {
      setSavingReset(true);

      const { resetSobrietyDate } = await client.request(
        RESET_SOBRIETY_MUTATION,
        {
          token: authToken,
          newStartAt: newDate.toISOString(),
        }
      );

      if (resetSobrietyDate) {
        dispatch({
          type: "SET_USER",
          payload: resetSobrietyDate,
        });

        if (resetSobrietyDate.sobrietyStartAt) {
          const backendDate = parseStartDate(resetSobrietyDate.sobrietyStartAt);
          if (backendDate) {
            setSelectedDate(backendDate);
          }
        }

        setShowPicker(false);
        setHasPendingCustomDate(false);
      }
    } catch (err) {
      console.log("Error resetting sobriety date:", err);

      const msgFromServer =
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        "We couldn’t update your sober date. Try again.";

      openErrorModal(msgFromServer);
      // keep picker state as-is on server error
    } finally {
      setSavingReset(false);
    }
  };

  const handleSetToday = () => {
    if (savingReset) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!validateDate(today)) {
      return;
    }

    openConfirmTodayModal(today);
  };

  const handlePickDatePress = async () => {
    if (savingReset) return;

    const scrollToBottom = () =>
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        150
      );

    if (!useToday && hasPendingCustomDate) {
      if (!selectedDate) return;
      if (!validateDate(selectedDate)) {
        // reset back to today but keep picker logic alone
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
        return;
      }
      await persistSobrietyDate(selectedDate);
      return;
    }

    setUseToday(false);
    setShowPicker(true);
    scrollToBottom();
  };

  const handleDateChange = (event, date) => {
    const type = event?.type;

    if (type === "dismissed") {
      setShowPicker(false);
      return;
    }

    if (type === "set" && date) {
      if (!validateDate(date)) {
        // invalid → reset to today but keep picker open
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
        return;
      }

      setSelectedDate(date);
      setUseToday(false);
      setHasPendingCustomDate(true);

      // On Android we close after a valid selection, iOS spinner stays open
      if (Platform.OS === "android") {
        setShowPicker(false);
      }
    }
  };

  // Build hint text with hours for first 3 days
  let nextHintText = "";
  if (diff && nextMilestone && daysToNext != null) {
    if (currentDays < 3) {
      const currentElapsedHours =
        diff.days * 24 + diff.hours + diff.minutes / 60 + diff.seconds / 3600;
      const totalHoursToNext = nextMilestone * 24;
      let hoursToNext = Math.ceil(totalHoursToNext - currentElapsedHours);
      if (hoursToNext < 0) hoursToNext = 0;

      if (hoursToNext === 0) {
        nextHintText = "You’re hitting this milestone today.";
      } else {
        nextHintText = `Only ${hoursToNext} hour${
          hoursToNext === 1 ? "" : "s"
        } to go.`;
      }
    } else {
      if (daysToNext === 0) {
        nextHintText = "You’re hitting this milestone today.";
      } else {
        nextHintText = `Only ${daysToNext} day${
          daysToNext === 1 ? "" : "s"
        } to go.`;
      }
    }
  }

  /**
   * 🔥 TIMER CHIP ANIMATIONS 🔥
   * - Hours & minutes: more pronounced pulse on change
   * - Seconds: subtle micro-pulse every tick
   */
  const hoursAnim = useRef(new Animated.Value(0)).current;
  const minutesAnim = useRef(new Animated.Value(0)).current;
  const secondsAnim = useRef(new Animated.Value(0)).current;

  const pulseChip = (anim, durationIn = 130, durationOut = 220) => {
    anim.stopAnimation?.();
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: durationIn,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: durationOut,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hours pulse (bigger, slower)
  useEffect(() => {
    if (!diff) return;
    pulseChip(hoursAnim, 180, 260);
  }, [diff?.hours]);

  // Minutes pulse
  useEffect(() => {
    if (!diff) return;
    pulseChip(minutesAnim, 150, 230);
  }, [diff?.minutes]);

  // Seconds micro-pulse
  useEffect(() => {
    if (!diff) return;
    pulseChip(secondsAnim, 110, 200);
  }, [diff?.seconds]);

  const chipScaleStyle = (anim, intensity = 0.06) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + intensity],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
    ],
  });

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        ref={scrollViewRef}
      >
        <Text style={styles.title}>Sober Time</Text>

        {/* TIMER CARD */}
        <View style={styles.timerCard}>
          {diff && effectiveStartDate ? (
            <>
              <Text style={styles.timerLabel}>You’ve been sober for</Text>

              <View style={styles.daysRow}>
                <Text style={styles.daysNumber}>{diff.days}</Text>
                <Text style={styles.daysText}>days</Text>
              </View>

              <View style={styles.chipsRow}>
                {/* HOURS CHIP */}
                <View style={styles.chipWrapper}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.chipHighlightBase,
                      {
                        opacity: hoursAnim,
                        borderColor: "rgba(251,191,36,0.9)",
                        backgroundColor: "rgba(251,191,36,0.18)",
                        shadowColor: "#FBBF24",
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.chipAnimated,
                      chipScaleStyle(hoursAnim, 0.08),
                    ]}
                  >
                    <LiquidGlassView
                      style={styles.chip}
                      interactive
                      effect="clear"
                      tintColor="rgba(15,23,42,0.45)"
                      colorScheme="system"
                    >
                      <Text style={styles.chipValue}>
                        {formatTwo(diff.hours)}
                      </Text>
                      <Text style={styles.chipLabel}>HRS</Text>
                    </LiquidGlassView>
                  </Animated.View>
                </View>

                {/* MINUTES CHIP */}
                <View style={styles.chipWrapper}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.chipHighlightBase,
                      {
                        opacity: minutesAnim,
                        borderColor: "rgba(45,212,191,0.9)",
                        backgroundColor: "rgba(45,212,191,0.14)",
                        shadowColor: "#22C55E",
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.chipAnimated,
                      chipScaleStyle(minutesAnim, 0.07),
                    ]}
                  >
                    <LiquidGlassView
                      style={styles.chip}
                      interactive
                      effect="clear"
                      tintColor="rgba(15,23,42,0.45)"
                      colorScheme="system"
                    >
                      <Text style={styles.chipValue}>
                        {formatTwo(diff.minutes)}
                      </Text>
                      <Text style={styles.chipLabel}>MIN</Text>
                    </LiquidGlassView>
                  </Animated.View>
                </View>

                {/* SECONDS CHIP */}
                <View style={styles.chipWrapper}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.chipHighlightBase,
                      {
                        opacity: secondsAnim,
                        borderColor: "rgba(56,189,248,0.9)",
                        backgroundColor: "rgba(56,189,248,0.16)",
                        shadowColor: "#38BDF8",
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.chipAnimated,
                      chipScaleStyle(secondsAnim, 0.05),
                    ]}
                  >
                    <LiquidGlassView
                      style={styles.chip}
                      interactive
                      effect="clear"
                      tintColor="rgba(15,23,42,0.45)"
                      colorScheme="system"
                    >
                      <Text style={styles.chipValue}>
                        {formatTwo(diff.seconds)}
                      </Text>
                      <Text style={styles.chipLabel}>SEC</Text>
                    </LiquidGlassView>
                  </Animated.View>
                </View>
              </View>

              <Text style={styles.sinceText}>
                Since{" "}
                <Text style={styles.sinceDate}>
                  {formatDate(effectiveStartDate)}
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.timerLabel}>No sober date set yet</Text>
              <Text style={styles.timerSubtext}>
                Choose your sober start date to start the clock.
              </Text>
            </>
          )}
        </View>

        {/* MILESTONES CARD */}
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneTitle}>Milestones</Text>
            {diff && (
              <Text style={styles.milestoneSubTitle}>
                {currentDays} day{currentDays === 1 ? "" : "s"} in
              </Text>
            )}
          </View>

          {diff ? (
            <>
              {nextMilestone ? (
                <View style={styles.nextRow}>
                  <Text style={styles.nextLabel}>Next milestone</Text>
                  <Text style={styles.nextValue}>{nextMilestone} days</Text>
                </View>
              ) : (
                <Text style={styles.cardText}>
                  You’ve passed all configured milestones. Beast mode.
                </Text>
              )}

              {nextMilestone && (
                <>
                  <Text style={styles.nextHint}>{nextHintText}</Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressToNext * 100}%` },
                      ]}
                    />
                  </View>
                </>
              )}

              {pastMilestones.length > 0 && (
                <View style={styles.milestoneGroup}>
                  <Text style={styles.groupLabel}>Reached</Text>
                  <View style={styles.badgeRow}>
                    {pastMilestones.slice(-3).map((m) => {
                      const notified = milestonesNotified.includes(m);
                      return (
                        <LiquidGlassView
                          key={`past-${m}`}
                          style={[
                            styles.milestoneBadge,
                            notified && styles.milestoneBadgeNotified,
                          ]}
                          interactive
                          effect="clear"
                          tintColor={
                            notified
                              ? "rgba(6,78,59,0.7)"
                              : "rgba(15,23,42,0.7)"
                          }
                          colorScheme="system"
                        >
                          <Text style={styles.badgeEmoji}>
                            {notified ? "✅" : "✨"}
                          </Text>
                          <Text style={styles.badgeText}>{m}d</Text>
                        </LiquidGlassView>
                      );
                    })}
                  </View>
                </View>
              )}

              {upcomingMilestones.length > 0 && (
                <View style={styles.milestoneGroup}>
                  <Text style={styles.groupLabel}>Coming up</Text>
                  <View style={styles.badgeRow}>
                    {upcomingMilestones.map((m) => (
                      <LiquidGlassView
                        key={`up-${m}`}
                        style={styles.milestoneBadgeDim}
                        interactive
                        effect="clear"
                        tintColor="rgba(15,23,42,0.7)"
                        colorScheme="system"
                      >
                        <Text style={styles.badgeEmoji}>⏳</Text>
                        <Text style={styles.badgeText}>{m}d</Text>
                      </LiquidGlassView>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.cardText}>
              Set your sober date to start tracking milestones like 1, 3, 7, 30
              days and beyond.
            </Text>
          )}
        </View>

        {/* HISTORY BUTTON (opens full-screen chart) */}
        <View style={styles.historyButtonWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setHistoryVisible(true)}
            style={styles.historyButton}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color="#FBBF24"
                style={{ marginRight: 10 }}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.historyButtonText}>View history</Text>
                <Text style={styles.historyButtonSub}>
                  See relapses, longest streak & trends
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* RESET DATE CARD */}
        <View style={styles.resetCard}>
          <Text style={styles.resetTitle}>Adjust sober start date</Text>
          <Text style={styles.resetSubtitle}>
            Choose when this sober streak started. You can reset to today or
            pick any past date.
          </Text>

          <View style={styles.optionsRow}>
            <LiquidGlassView
              interactive
              effect="clear"
              tintColor={
                useToday ? "rgba(245,158,11,0.36)" : "rgba(15,23,42,0.6)"
              }
              colorScheme="system"
              style={[
                styles.optionButton,
                useToday && styles.optionButtonActive,
              ]}
            >
              <TouchableOpacity
                style={styles.optionTouchable}
                onPress={handleSetToday}
                activeOpacity={0.9}
                disabled={savingReset}
              >
                <Text
                  style={[
                    styles.optionText,
                    useToday && styles.optionTextActive,
                  ]}
                >
                  Starts today
                </Text>
                {isToday() && (
                  <Text style={styles.optionHint}>Today selected</Text>
                )}
              </TouchableOpacity>
            </LiquidGlassView>

            <LiquidGlassView
              interactive
              effect="clear"
              tintColor={
                !useToday || hasPendingCustomDate
                  ? "rgba(245,158,11,0.36)"
                  : "rgba(15,23,42,0.6)"
              }
              colorScheme="system"
              style={[
                styles.optionButton,
                styles.optionButtonLast,
                !useToday && styles.optionButtonActive,
                hasPendingCustomDate && styles.optionButtonPending,
              ]}
            >
              <TouchableOpacity
                style={styles.optionTouchable}
                onPress={handlePickDatePress}
                activeOpacity={0.9}
                disabled={savingReset}
              >
                <Text
                  style={[
                    styles.optionText,
                    !useToday && styles.optionTextActive,
                  ]}
                >
                  {hasPendingCustomDate ? "Save date" : "Pick a date"}
                </Text>
                <Text style={styles.optionHint}>
                  {selectedDate
                    ? hasPendingCustomDate
                      ? `Tap again to save ${formatDate(selectedDate)}`
                      : formatDate(selectedDate)
                    : "Choose a past date"}
                </Text>
              </TouchableOpacity>
            </LiquidGlassView>
          </View>

          {showPicker && !useToday && Platform.OS === "ios" && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={styles.picker}
                textColor="white"
              />
            </View>
          )}

          {showPicker && !useToday && Platform.OS === "android" && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        cancelLabel={modalState.cancelLabel}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />

      <StreakHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        streaks={streaks}
        currentStartDate={effectiveStartDate}
        averageRelapseDay={averageRelapseDay}
        now={now}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 16,
  },
  // TIMER CARD
  timerCard: {
    backgroundColor: "#020617",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  timerLabel: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 8,
  },
  timerSubtext: {
    color: "#6b7280",
    fontSize: 13,
  },
  daysRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: "#e5e7eb",
    marginRight: 8,
  },
  daysText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chipWrapper: {
    flex: 1,
    position: "relative",
  },
  chipAnimated: {
    flex: 1,
  },
  chipHighlightBase: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 999,
    borderWidth: 1,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  chipValue: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  chipLabel: {
    color: "#9ca3af",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  sinceText: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
  },
  sinceDate: {
    color: "#e5e7eb",
    fontWeight: "600",
  },

  // MILESTONES
  milestoneCard: {
    backgroundColor: "#020617",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  milestoneTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  milestoneSubTitle: {
    color: "#6b7280",
    fontSize: 13,
  },
  avgRow: {
    marginBottom: 8,
  },
  avgChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.6)",
    backgroundColor: "transparent",
  },
  avgChipText: {
    color: "#fef3c7",
    fontSize: 12,
    fontWeight: "600",
  },
  cardText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  nextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nextLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  nextValue: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
  nextHint: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#111827",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  milestoneGroup: {
    marginTop: 8,
  },
  groupLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  milestoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1f2937",
    marginRight: 6,
    marginBottom: 6,
  },
  milestoneBadgeNotified: {
    borderColor: "#059669",
  },
  milestoneBadgeDim: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#111827",
    marginRight: 6,
    marginBottom: 6,
  },
  badgeEmoji: {
    marginRight: 4,
    fontSize: 12,
  },
  badgeText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "500",
  },

  // HISTORY BUTTON
  historyButtonWrapper: {
    marginBottom: 16,
  },
  historyButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "#020617",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "column",
  },
  historyButtonText: {
    color: "#FBBF24",
    fontSize: 15,
    fontWeight: "600",
  },
  historyButtonSub: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },

  // RESET CARD
  resetCard: {
    backgroundColor: "#020617",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  resetTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  resetSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "transparent",
    marginRight: 8,
  },
  optionTouchable: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  optionButtonLast: {
    marginRight: 0,
  },
  optionButtonActive: {
    borderColor: "#F59E0B",
  },
  optionButtonPending: {
    borderColor: "#F97316",
  },
  optionText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextActive: {
    color: "#FBBF24",
    textAlign: "center",
  },
  optionHint: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  pickerContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 200 : undefined,
  },
});

export default SoberTimeScreen;
