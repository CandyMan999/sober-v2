import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { useClient } from "../../../../client";
import Context from "../../../../context";
import { UPDATE_SOCIAL_MUTATION } from "../../../../GraphQL/mutations";
import { getToken } from "../../../../utils/helpers";

const { accent, border, nightBlue, oceanBlue, textPrimary, textSecondary } = COLORS;

const SOCIAL_CONFIG = {
  instagram: {
    label: "Instagram (Optional)",
    placeholder: "@username",
    errorLabel: "Instagram",
    regex: /^[A-Za-z0-9._]{1,30}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?instagram\.com\//i,
      /^instagram:\/\/user\?username=/i,
    ],
    icon: <Feather name="instagram" size={22} color={textPrimary} />,
  },
  tiktok: {
    label: "TikTok (Optional)",
    placeholder: "@username",
    errorLabel: "TikTok",
    regex: /^[A-Za-z0-9._]{1,24}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?tiktok\.com\/[@]?/i,
      /^tiktok:\/\/user\?username=/i,
    ],
    icon: <Feather name="music" size={22} color={textPrimary} />,
  },
  x: {
    label: "X (Optional)",
    placeholder: "@handle",
    errorLabel: "X",
    regex: /^[A-Za-z0-9_]{1,15}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?(x|twitter)\.com\//i,
      /^twitter:\/\//i,
      /^x:\/\/profile\//i,
    ],
    icon: <Feather name="twitter" size={22} color={textPrimary} />,
  },
};

const normalizeSocialInput = (platform, rawValue) => {
  const value =
    typeof rawValue === "string"
      ? rawValue
      : typeof rawValue === "object" && rawValue !== null
      ? rawValue.handle
      : "";

  let handle = (value || "").trim();
  if (!handle) return "";

  handle = handle.replace(/@/g, "");

  SOCIAL_CONFIG[platform]?.urlPrefixes?.forEach((pattern) => {
    handle = handle.replace(pattern, "");
  });

  handle = handle.split(/[/?#]/)[0];
  return handle;
};

const SocialLinksSection = ({ currentUser, onUserUpdated, showError }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const [socialOpen, setSocialOpen] = useState(false);
  const [socialInputs, setSocialInputs] = useState({
    instagram: normalizeSocialInput("instagram", currentUser?.social?.instagram),
    tiktok: normalizeSocialInput("tiktok", currentUser?.social?.tiktok),
    x: normalizeSocialInput("x", currentUser?.social?.x),
  });
  const [savingSocial, setSavingSocial] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setSocialInputs({
      instagram: normalizeSocialInput("instagram", currentUser?.social?.instagram),
      tiktok: normalizeSocialInput("tiktok", currentUser?.social?.tiktok),
      x: normalizeSocialInput("x", currentUser?.social?.x),
    });
  }, [currentUser]);

  useEffect(() => {
    const fetchToken = async () => {
      const deviceToken = await getToken();
      setToken(deviceToken);
    };

    fetchToken();
  }, []);

  const socialValidation = useMemo(() => {
    const errors = {};

    Object.entries(socialInputs).forEach(([platform, value]) => {
      const cleaned = normalizeSocialInput(platform, value);
      const config = SOCIAL_CONFIG[platform];
      const label = config?.errorLabel || config?.label || platform;

      if (cleaned && config?.regex && !config.regex.test(cleaned)) {
        errors[platform] = `Enter a valid ${label} username.`;
      }
    });

    return errors;
  }, [socialInputs]);

  const isSocialValid = useMemo(
    () => Object.keys(socialValidation).length === 0,
    [socialValidation]
  );

  const handleSaveSocialLinks = async () => {
    if (!token || savingSocial || !isSocialValid) return;

    const payload = Object.fromEntries(
      Object.entries(socialInputs).map(([platform, value]) => [
        platform,
        normalizeSocialInput(platform, value) || null,
      ])
    );

    const currentHandles = {
      instagram: normalizeSocialInput("instagram", currentUser?.social?.instagram),
      tiktok: normalizeSocialInput("tiktok", currentUser?.social?.tiktok),
      x: normalizeSocialInput("x", currentUser?.social?.x),
    };

    const updates = Object.entries(payload).filter(
      ([platform, handle]) => handle !== currentHandles[platform]
    );

    if (!updates.length) return;

    try {
      setSavingSocial(true);
      let latestUser = currentUser;

      for (const [platform, handle] of updates) {
        const { updateSocial } = await client.request(UPDATE_SOCIAL_MUTATION, {
          token,
          platform,
          handle,
        });

        latestUser = updateSocial;
      }

      if (latestUser) {
        dispatch({ type: "SET_USER", payload: { ...currentUser, ...latestUser } });
        dispatch({
          type: "SET_PROFILE_OVERVIEW",
          payload: { ...(state?.profileOverview || {}), user: latestUser },
        });
        onUserUpdated?.(latestUser);
        setSocialInputs({
          instagram: normalizeSocialInput("instagram", latestUser.social?.instagram),
          tiktok: normalizeSocialInput("tiktok", latestUser.social?.tiktok),
          x: normalizeSocialInput("x", latestUser.social?.x),
        });
      }
    } catch (err) {
      const message =
        err?.response?.errors?.[0]?.message ||
        "We couldn't update your social links right now.";
      showError?.(message, "Social links");
    } finally {
      setSavingSocial(false);
      setSocialOpen(false);
    }
  };

  return (
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

          {Object.entries(SOCIAL_CONFIG).map(([platform, config]) => {
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
};

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
