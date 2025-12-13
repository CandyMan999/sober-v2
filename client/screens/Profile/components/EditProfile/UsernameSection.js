import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { useClient } from "../../../../client";
import Context from "../../../../context";
import { UPDATE_USER_PROFILE_MUTATION } from "../../../../GraphQL/mutations";
import { getToken } from "../../../../utils/helpers";

const {
  accent,
  border,
  cardBackground,
  nightBlue,
  textPrimary,
  textSecondary,
} = COLORS;

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 13;

const UsernameSection = ({ currentUser, onUserUpdated, showError }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);

  const [usernameOpen, setUsernameOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentUser?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setUsernameInput(currentUser?.username || "");
  }, [currentUser]);

  useEffect(() => {
    const fetchToken = async () => {
      const deviceToken = await getToken();
      setToken(deviceToken);
    };

    fetchToken();
  }, []);

  const trimmedUsername = useMemo(() => usernameInput.trim(), [usernameInput]);
  const isUsernameValid =
    trimmedUsername.length >= MIN_USERNAME_LENGTH &&
    trimmedUsername.length <= MAX_USERNAME_LENGTH;

  const usernameValidationText = useMemo(() => {
    if (usernameInput.length === 0) return "You can change this later.";
    if (trimmedUsername.length < MIN_USERNAME_LENGTH)
      return "At least 3 characters.";
    if (trimmedUsername.length > MAX_USERNAME_LENGTH)
      return "Max 13 characters.";
    return "Looks good.";
  }, [trimmedUsername.length, usernameInput]);

  const usernameDisplay = useMemo(
    () => trimmedUsername || "Add a handle",
    [trimmedUsername]
  );

  const handleSaveUsername = async () => {
    if (!token || savingUsername || !isUsernameValid) return;
    const trimmed = trimmedUsername;
    if (!trimmed) {
      showError?.("Please enter a username to continue.");
      return;
    }

    try {
      setSavingUsername(true);
      const { updateUserProfile } = await client.request(
        UPDATE_USER_PROFILE_MUTATION,
        { token, username: trimmed }
      );

      dispatch({
        type: "SET_USER",
        payload: { ...currentUser, ...updateUserProfile },
      });
      onUserUpdated?.(updateUserProfile);
      setUsernameOpen(false);
    } catch (err) {
      const message =
        err?.response?.errors?.[0]?.message ||
        "We couldn't update your username right now.";
      showError?.(message, "Username error");
    } finally {
      setSavingUsername(false);
      setUsernameOpen(false);
    }
  };

  return (
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
            maxLength={MAX_USERNAME_LENGTH}
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
};

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
