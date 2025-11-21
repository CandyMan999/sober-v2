import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const ChatRoomScreen = ({ route }) => {
  const roomName = route?.params?.roomName || "Room";

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Room: {roomName}</Text>
      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
        <Text style={styles.message}>User1: Message placeholder</Text>
        <Text style={styles.message}>User2: Another message placeholder</Text>
        <Text style={styles.message}>User3: Keep going!</Text>
      </ScrollView>
      <View style={styles.inputBar}>
        <Text style={styles.inputPlaceholder}>Write a message... (placeholder)</Text>
        <Text style={styles.sendText}>Send</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  header: {
    padding: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
  },
  messages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingBottom: 80,
  },
  message: {
    color: "#e5e7eb",
    marginBottom: 10,
  },
  inputBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#111827",
  },
  inputPlaceholder: {
    color: "#9ca3af",
  },
  sendText: {
    color: "#f59e0b",
    fontWeight: "700",
  },
});

export default ChatRoomScreen;
