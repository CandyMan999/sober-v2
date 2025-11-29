import React from "react";
import { useRoute } from "@react-navigation/native";

import UserConnectionsList from "./components/UserConnectionsList";

const FollowingScreen = () => {
  const route = useRoute();
  const { users = [], title, subtitle, username } = route.params || {};

  return (
    <UserConnectionsList
      title={title || "Following"}
      subtitle={
        subtitle ||
        (username
          ? `Everyone ${username} keeps up with`
          : "People you follow will appear here.")
      }
      users={users}
      emptyTitle="No follows yet"
      emptyDescription="Start following people to fill this list."
    />
  );
};

export default FollowingScreen;
