import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
  const token = await AsyncStorage.getItem("expoPushToken");
  return token;
};

export const getAppleId = async () => {
  const appleId = await AsyncStorage.getItem("appleUserId");
  return appleId;
};
