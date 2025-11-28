import React, { useContext, useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Context from "../context";

const HALO_MAP = {
  orange: ["#fed7aa", "#f97316", "#facc15"],
  blue: ["#0ea5e9", "#6366f1", "#a855f7"],
};

const Avatar = ({
  uri,
  fallbackSource,
  userId,
  username,
  size = 38,
  haloColor = "orange",
  haloColors,
  onPress,
  style,
  disableNavigation = false,
}) => {
  const navigation = useNavigation();
  const { state } = useContext(Context);
  const viewerId = state?.user?.id;
  const isCurrentUser = viewerId && userId && viewerId === userId;

  const gradientColors = useMemo(() => {
    if (Array.isArray(haloColors) && haloColors.length) return haloColors;
    return HALO_MAP[haloColor] || HALO_MAP.orange;
  }, [haloColor, haloColors]);

  const haloSize = size + 6;
  const innerSize = haloSize - 4;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!disableNavigation && userId && !isCurrentUser) {
      navigation.navigate("UserProfile", {
        userId,
        initialUser: { id: userId, username, profilePicUrl: uri },
      });
    }
  };

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatarHalo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2, padding: 2 }]}
    >
      <View
        style={[
          styles.avatarInner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : fallbackSource ? (
          <Image
            source={fallbackSource}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Ionicons name="person" size={Math.max(14, size / 3)} color="#0b1222" />
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress || (userId && !isCurrentUser && !disableNavigation)) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={style}
        disabled={disableNavigation || isCurrentUser}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
};

const styles = StyleSheet.create({
  avatarHalo: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarInner: {
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#facc15",
  },
});

export default Avatar;
