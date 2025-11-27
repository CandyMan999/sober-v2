import React from "react";
import { View, Text, StyleSheet } from "react-native";

const FollowersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Followers</Text>
      <Text style={styles.subtitle}>
        This screen will show everyone who follows you.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    padding: 24,
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 22,
  },
});

export default FollowersScreen;
