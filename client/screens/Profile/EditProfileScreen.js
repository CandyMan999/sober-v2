import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const RowItem = ({ label, value, onPress, icon }) => (
  <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.rowLeft}>
      {icon}
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
    </View>
    <Feather name="chevron-right" size={18} color="#9ca3af" />
  </TouchableOpacity>
);

const EditProfileScreen = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit profile</Text>
      </View>

      <View style={styles.avatarCard}>
        <LinearGradient
          colors={["#6b21a8", "#9333ea"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarButton}
        >
          <MaterialCommunityIcons name="account-edit" size={20} color="#fef3c7" />
          <Text style={styles.avatarButtonText}>Create your avatar</Text>
        </LinearGradient>

        <View style={styles.avatarCircle}>
          <Feather name="camera" size={26} color="#9ca3af" />
        </View>
        <TouchableOpacity style={styles.editPhotoLink}>
          <Text style={styles.editPhotoText}>Edit photo or avatar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile</Text>
        <RowItem
          label="Name"
          value="Add name"
          icon={<Feather name="user" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
        <RowItem
          label="Username"
          value="Update username"
          icon={<Feather name="at-sign" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
        <RowItem
          label="Bio"
          value="Add a short bio"
          icon={<Feather name="info" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferences</Text>
        <RowItem
          label="Change profile pic"
          icon={<Feather name="image" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
        <RowItem
          label="Change drunk pic"
          icon={<MaterialCommunityIcons name="glass-mug-variant" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
        <RowItem
          label="Notification settings"
          icon={<Ionicons name="notifications-outline" size={18} color="#9ca3af" />}
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.toggleRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications" size={18} color="#9ca3af" />
            <Text style={styles.rowLabel}>Push notifications</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: "#f59e0b" }} />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.rowLeft}>
            <Feather name="map-pin" size={18} color="#9ca3af" />
            <Text style={styles.rowLabel}>Location access</Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ true: "#f59e0b" }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "700",
  },
  avatarCard: {
    alignItems: "center",
    backgroundColor: "#0b1220",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 18,
  },
  avatarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  avatarButtonText: {
    color: "#fef3c7",
    fontWeight: "700",
    marginLeft: 10,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b1220",
    marginTop: 14,
  },
  editPhotoLink: {
    marginTop: 10,
  },
  editPhotoText: {
    color: "#60a5fa",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 18,
  },
  sectionLabel: {
    color: "#9ca3af",
    fontSize: 12,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowTextBlock: {
    marginLeft: 10,
  },
  rowLabel: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  rowValue: {
    color: "#9ca3af",
    marginTop: 2,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
});

export default EditProfileScreen;
