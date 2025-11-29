import React from "react";
import { useRoute } from "@react-navigation/native";

import UserConnectionsList from "./components/UserConnectionsList";

const FollowersScreen = () => {
  const route = useRoute();
  const { users = [], title, subtitle, username } = route.params || {};

  return (
    <UserConnectionsList
      title={title || "Followers"}
      subtitle={
        subtitle ||
        (username
          ? `People who follow ${username}`
          : "Everyone who follows you shows up here.")
      }
      users={users}
      emptyTitle="No followers yet"
      emptyDescription="When someone follows you, they'll appear in this list."
    />
  );
};

export default FollowersScreen;
