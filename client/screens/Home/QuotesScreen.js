import React from "react";
import { View, Text, StyleSheet } from "react-native";
import FeedPlaceholder from "../../components/FeedPlaceholder";

const QuotesScreen = () => {
  return (
    <FeedPlaceholder caption="Swipe for more quotes (placeholder).">
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>“Quote goes here…”</Text>
        <Text style={styles.quoteHandle}>- @handle</Text>
      </View>
    </FeedPlaceholder>
  );
};

const styles = StyleSheet.create({
  quoteContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  quoteText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  quoteHandle: {
    color: "#9ca3af",
    fontSize: 16,
  },
});

export default QuotesScreen;
