import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../../../constants/colors";

const { accent, textPrimary, textSecondary, primaryBackground, oceanBlue } = COLORS;

const PhotoTileBase = ({ children, label, onPress, style }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.photoTile, style]}
  >
    {children}
    <Text style={styles.photoLabel}>{label}</Text>
  </TouchableOpacity>
);

const ProfilePhotoTile = ({ label, uri, isUploading, isDeleting, onPick, onDelete }) => (
  <PhotoTileBase label={label} onPress={onPick}>
    <LinearGradient colors={[accent, accent]} style={styles.profileHalo}>
      <View style={styles.profilePreview}>
        {uri ? (
          <Image source={{ uri }} style={styles.profileImage} resizeMode="cover" />
        ) : (
          <View style={[styles.profileImage, styles.photoPlaceholder]}>
            <Feather name="camera" color={textSecondary} size={24} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={primaryBackground} />
          </View>
        ) : null}

        {uri && !isUploading ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="trash-2" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  </PhotoTileBase>
);

const DrunkPhotoTile = ({ label, uri, isUploading, isDeleting, onPick, onDelete }) => (
  <PhotoTileBase label={label} onPress={onPick} style={styles.drunkTile}>
    <LinearGradient colors={[oceanBlue, oceanBlue]} style={styles.drunkHalo}>
      <View style={styles.drunkPreview}>
        {uri ? (
          <Image source={{ uri }} style={styles.drunkImage} resizeMode="cover" />
        ) : (
          <View style={[styles.drunkImage, styles.photoPlaceholder]}>
            <Feather name="image" color={textSecondary} size={24} />
            <Text style={styles.placeholderText}>Tap to add</Text>
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={primaryBackground} />
          </View>
        ) : null}

        {uri && !isUploading ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="trash-2" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  </PhotoTileBase>
);

const PhotoTilesSection = ({
  profileUri,
  drunkUri,
  uploadingSlot,
  deletingSlot,
  pickImage,
  deletePhoto,
}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionLabel}>Photos</Text>
    <View style={styles.photoRow}>
      <ProfilePhotoTile
        label="Profile Photo"
        uri={profileUri}
        isUploading={uploadingSlot === "PROFILE"}
        isDeleting={deletingSlot === "PROFILE"}
        onPick={() => pickImage("PROFILE")}
        onDelete={() => deletePhoto("PROFILE")}
      />
      <DrunkPhotoTile
        label="Drunk Photo"
        uri={drunkUri}
        isUploading={uploadingSlot === "DRUNK"}
        isDeleting={deletingSlot === "DRUNK"}
        onPick={() => pickImage("DRUNK")}
        onDelete={() => deletePhoto("DRUNK")}
      />
    </View>
  </View>
);

export default PhotoTilesSection;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  photoTile: {
    flex: 1,
    alignItems: "center",
  },
  profileHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 4,
    shadowColor: accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  profilePreview: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.nightBlue,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  placeholderText: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  photoLabel: {
    color: textPrimary,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  drunkTile: {
    justifyContent: "flex-start",
  },
  drunkHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 4,
    shadowColor: oceanBlue,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  drunkPreview: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.nightBlue,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  drunkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
});
