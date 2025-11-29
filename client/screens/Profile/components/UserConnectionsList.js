import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

const Avatar = ({ uri, username }) => {
  if (!uri) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarFallbackText}>
          {(username || "?").slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={styles.avatar} />;
};

const Badge = ({ label, tone = "muted" }) => (
  <View
    style={[
      styles.badge,
      tone === "accent" ? styles.badgeAccent : styles.badgeMuted,
    ]}
  >
    <Text
      style={[
        styles.badgeText,
        tone === "accent" ? styles.badgeTextDark : styles.badgeText,
      ]}
    >
      {label}
    </Text>
  </View>
);

const UserConnectionsList = ({
  title,
  subtitle,
  users = [],
  emptyTitle = "No people yet",
  emptyDescription = "When you connect with others they'll show up here.",
  loading = false,
  backLabel = "Profile",
}) => {
  const navigation = useNavigation();

  const handleUserPress = (user) => {
    if (!user?.id) return;
    navigation.navigate("UserProfile", { userId: user.id, initialUser: user });
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.personRow}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.85}
    >
      <Avatar uri={item?.profilePicUrl} username={item?.username} />
      <View style={styles.personMeta}>
        <Text style={styles.personName}>{item?.username || "Unknown"}</Text>
        <View style={styles.badgeRow}>
          {item?.isBuddyWithViewer ? <Badge label="Buddy" tone="accent" /> : null}
          {item?.isFollowedByViewer ? <Badge label="Following" /> : null}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={18} color="#f59e0b" />
          </TouchableOpacity>
          <Text style={styles.backText}>{backLabel}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {loading ? (
          <ActivityIndicator size="small" color="#f59e0b" style={{ marginTop: 24 }} />
        ) : users.length ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item, index) => item?.id || `${item?.username || "person"}-${index}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Feather name="users" size={28} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyDescription}>{emptyDescription}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    padding: 24,
    paddingTop: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  backText: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  personMeta: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  badgeAccent: {
    backgroundColor: "#e0f2fe",
    borderColor: "#22d3ee",
  },
  badgeMuted: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeText: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 12,
  },
  badgeTextDark: {
    color: "#0b1220",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111827",
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  avatarFallbackText: {
    color: "#9ca3af",
    fontWeight: "800",
  },
  separator: {
    height: 1,
    backgroundColor: "#111827",
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#111827",
  },
  emptyIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyDescription: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default UserConnectionsList;
