import React from "react";
import { View, Text, StyleSheet } from "react-native";

const FollowingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Following</Text>
      <Text style={styles.subtitle}>People you follow will appear here.</Text>
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

export default FollowingScreen;
