import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
  const token = await AsyncStorage.getItem("expoPushToken");
  return token;
};

export const getAppleId = async () => {
  const appleId = await AsyncStorage.getItem("appleUserId");
  return appleId;
};

export const getAuthContext = async () => {
  const [token, appleId] = await Promise.all([
    AsyncStorage.getItem("expoPushToken"),
    AsyncStorage.getItem("appleUserId"),
  ]);

  return { token, appleId };
};
