import React from "react";
import { Text } from "react-native";
import FeedPlaceholder from "../../components/FeedPlaceholder";

const CommunityScreen = () => {
  return (
    <FeedPlaceholder caption="Caption placeholder...">
      <Text style={{ color: "#fff", fontSize: 18 }}>
        Community Feed Placeholder
      </Text>
    </FeedPlaceholder>
  );
};

export default CommunityScreen;
