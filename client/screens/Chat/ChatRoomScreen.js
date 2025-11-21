import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const rooms = ["General", "Early Days", "Relapse Support"];

const ChatRoomScreen = ({ route }) => {
  const navigation = useNavigation();
  const roomName = route?.params?.roomName || "Room";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomCarousel}
      >
        {rooms.map((room) => (
          <TouchableOpacity
            key={room}
            style={[styles.roomButton, room === roomName && styles.roomButtonActive]}
            onPress={() => navigation.navigate(room, { roomName: room })}
          >
            <Text
              style={[styles.roomButtonText, room === roomName && styles.roomButtonTextActive]}
            >
              {room}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  roomCarousel: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  roomButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  roomButtonActive: {
    backgroundColor: "#f59e0b33",
    borderColor: "#f59e0b",
  },
  roomButtonText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  roomButtonTextActive: {
    color: "#f59e0b",
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
