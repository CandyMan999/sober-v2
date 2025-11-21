import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const FloatingActionIcons = ({ onLikePress, onCommentPress, onMorePress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={onLikePress}>
        <Text style={styles.icon}>❤️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onCommentPress}>
        <Text style={styles.icon}>💬</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onMorePress}>
        <Text style={styles.icon}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    bottom: 80,
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
  },
});

export default FloatingActionIcons;
