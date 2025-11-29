import React from "react";
import { useRoute } from "@react-navigation/native";

import UserConnectionsList from "./components/UserConnectionsList";

const FollowersScreen = () => {
  const route = useRoute();
  const { users = [], title, subtitle, username, buddiesCount } =
    route.params || {};

  const buddiesLine =
    typeof buddiesCount === "number"
      ? `${buddiesCount} sober ${buddiesCount === 1 ? "buddy" : "buddies"}`
      : null;

  const subtitleWithBuddies = buddiesLine
    ? `${
        subtitle ||
        (username
          ? `People who follow ${username}`
          : "Everyone who follows you shows up here.")
      } • ${buddiesLine}`
    :
      subtitle ||
      (username
        ? `People who follow ${username}`
        : "Everyone who follows you shows up here.");

  return (
    <UserConnectionsList
      title={title || "Followers"}
      subtitle={subtitleWithBuddies}
      users={users}
      emptyTitle="No followers yet"
      emptyDescription="When someone follows you, they'll appear in this list."
    />
  );
};

export default FollowersScreen;
