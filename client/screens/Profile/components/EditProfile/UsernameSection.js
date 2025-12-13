import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../../../constants/colors";

const {
  accent,
  border,
  cardBackground,
  nightBlue,
  textPrimary,
  textSecondary,
} = COLORS;

const UsernameSection = ({
  usernameOpen,
  setUsernameOpen,
  usernameDisplay,
  usernameInput,
  setUsernameInput,
  usernameValidationText,
  isUsernameValid,
  savingUsername,
  handleSaveUsername,
  maxUsernameLength,
}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.dropdownHeader}
      onPress={() => setUsernameOpen((prev) => !prev)}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <Feather name="at-sign" size={18} color={accent} />
        <View style={styles.rowTextBlock}>
          <Text style={styles.rowLabel}>Username</Text>
          <Text style={styles.rowValue}>{usernameDisplay}</Text>
        </View>
      </View>
      <Feather
        name={usernameOpen ? "chevron-up" : "chevron-down"}
        size={18}
        color={textSecondary}
      />
    </TouchableOpacity>

    {usernameOpen ? (
      <View style={styles.dropdownBody}>
        <Text style={styles.helperText}>
          This is how friends find you. Usernames must be unique.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor={textSecondary}
          value={usernameInput}
          onChangeText={setUsernameInput}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxUsernameLength}
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            if (isUsernameValid) handleSaveUsername();
          }}
        />
        <Text
          style={[
            styles.validationText,
            !isUsernameValid && usernameInput?.trim()?.length > 0
              ? styles.validationError
              : null,
          ]}
        >
          {usernameValidationText}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveUsername}
          disabled={!isUsernameValid || savingUsername}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={!isUsernameValid || savingUsername ? [border, border] : [accent, accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.saveButtonInner,
              (!isUsernameValid || savingUsername) && styles.saveButtonDisabled,
            ]}
          >
            {savingUsername ? (
              <ActivityIndicator color={nightBlue} />
            ) : (
              <Text style={styles.saveButtonText}>Save username</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ) : null}
  </View>
);

export default UsernameSection;

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
  rowTextBlock: {
    marginLeft: 10,
    flexShrink: 1,
  },
  rowLabel: {
    color: textPrimary,
    fontWeight: "700",
  },
  rowValue: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  dropdownBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 12,
    paddingBottom: 4,
  },
  helperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: "center",
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
