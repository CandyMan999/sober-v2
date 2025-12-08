import React, { useContext, useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Context from "../context";

const HALO_MAP = {
  orange: ["#fed7aa", "#f97316", "#facc15"],
  blue: ["#38bdf8", "#0ea5e9", "#2563eb"],
};

const Avatar = ({
  uri,
  fallbackSource,
  userId,
  username,
  size = 38,
  aspectRatio = 1,
  haloColor = "orange",
  haloColors,
  onPress,
  style,
  disableNavigation = false,
  contentRef,
}) => {
  const navigation = useNavigation();
  const { state } = useContext(Context);
  const viewerId = state?.user?.id;
  const isCurrentUser = viewerId && userId && viewerId === userId;

  const gradientColors = useMemo(() => {
    if (Array.isArray(haloColors) && haloColors.length) return haloColors;
    return HALO_MAP[haloColor] || HALO_MAP.orange;
  }, [haloColor, haloColors]);

  const haloWidth = size + 6;
  const haloHeight = haloWidth / aspectRatio;
  const innerWidth = haloWidth - 4;
  const innerHeight = haloHeight - 4;
  const imageWidth = size;
  const imageHeight = size / aspectRatio;
  const isCircle = aspectRatio === 1;
  const radius = isCircle ? innerWidth / 2 : 10;
  const imageRadius = isCircle ? imageWidth / 2 : 10;

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
      style={[
        styles.avatarHalo,
        {
          width: haloWidth,
          height: haloHeight,
          borderRadius: isCircle ? haloWidth / 2 : radius + 4,
          padding: 2,
        },
      ]}
    >
      <View
        ref={contentRef}
        style={[
          styles.avatarInner,
          {
            width: innerWidth,
            height: innerHeight,
            borderRadius: radius,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius: imageRadius,
            }}
          />
        ) : fallbackSource ? (
          <Image
            source={fallbackSource}
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius: imageRadius,
            }}
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              {
                width: imageWidth,
                height: imageHeight,
                borderRadius: imageRadius,
              },
            ]}
          >
            <Ionicons
              name="person"
              size={Math.max(14, size / 3)}
              color="#0b1222"
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );

  const shouldDisable = !onPress && (disableNavigation || isCurrentUser);

  if (onPress || (userId && !isCurrentUser && !disableNavigation)) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={style}
        disabled={shouldDisable}
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
