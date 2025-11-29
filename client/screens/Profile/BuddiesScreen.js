import React from "react";
import { useRoute } from "@react-navigation/native";

import UserConnectionsList from "./components/UserConnectionsList";

const BuddiesScreen = () => {
  const route = useRoute();
  const { users = [], title, subtitle, username } = route.params || {};

  return (
    <UserConnectionsList
      title={title || "Buddies"}
      subtitle={
        subtitle ||
        (username
          ? `${username}'s sober buddies`
          : "Your sober buddies will be listed here.")
      }
      users={users}
      emptyTitle="No buddies yet"
      emptyDescription="Invite or follow people to make them buddies."
    />
  );
};

export default BuddiesScreen;
