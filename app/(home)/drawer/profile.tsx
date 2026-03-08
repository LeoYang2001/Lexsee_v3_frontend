import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/routers";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { client } from "../../client";
import { GrowthStyle, setProfile } from "../../../store/slices/profileSlice";
import { LANGUAGES, TIMEZONES } from "../../../lib/profileData";
import { MODES } from "../../../components/provision/defaultConfig";

const USERNAME_REGEX = /^(?=.{3,24}$)(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/;

const validateUsername = (username: string) => {
  if (!username.trim()) {
    return { isValid: false, message: "Display name is required." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      message:
        "3-24 chars, letters/numbers/underscore only, must include at least one letter.",
    };
  }

  return { isValid: true, message: "Format valid ✓" };
};
const checkDisplayNameAvailability = async (
  displayName: string,
  currentProfileId?: string,
) => {
  if (!displayName || displayName.trim().length < 2) return false;

  console.log("caling check checkDisplayNameAvailability");

  try {
    // 1. Use the secondary index query field for O(1) lookup performance
    // Note: If you want case-insensitivity, ensure you save displayNames
    // in a consistent casing (e.g., lowercase) during creation/update.
    const result = await (client as any).models.UserProfile.listByDisplayName({
      displayName: displayName.trim(),
    });

    const existingUsers = result?.data || [];

    // Case 1: No one has this name.
    if (existingUsers.length === 0) {
      console.log("✅ Name is completely unique.");
      return true;
    }

    // Case 2: Someone has this name. Is it the current user?
    // Note: We check against the 'userId' field because that's your Cognito link
    const isOwnedByMe = existingUsers.some(
      (profile: any) => profile.id === currentProfileId,
    );
    if (isOwnedByMe) {
      console.log("✅ User is re-entering their own current name.");
      return true;
    }

    // Case 3: The name is taken by someone else.
    console.log("❌ Name is taken by another user.");
    return false;
  } catch (error) {
    // Safety fallback: if the network fails, we usually don't want to
    // hard-block the user, but logging the error is vital.
    console.error("Error checking display name availability:", error);
    return true;
  }
};

type ModalType = "language" | "timezone" | null;

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile.data);

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [nativeLanguage, setNativeLanguage] = useState(
    profile?.nativeLanguage || "English",
  );
  const [timezone, setTimezone] = useState(
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [selectedMode, setSelectedMode] = useState<GrowthStyle>(
    profile?.growthStyle || "FLUENCY",
  );

  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [languageSearch, setLanguageSearch] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [displayNameFocused, setDisplayNameFocused] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isDisplayNameAvailable, setIsDisplayNameAvailable] = useState<
    boolean | null
  >(null);
  const blurCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Track if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      displayName !== profile.displayName ||
      nativeLanguage !== profile.nativeLanguage ||
      timezone !== profile.timezone ||
      selectedMode !== profile.growthStyle
    );
  }, [displayName, nativeLanguage, timezone, selectedMode, profile]);

  const selectedLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.name === nativeLanguage) || null,
    [nativeLanguage],
  );

  const selectedTimezoneLabel = useMemo(() => {
    return TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone;
  }, [timezone]);

  const filteredLanguages = useMemo(
    () =>
      LANGUAGES.filter((lang) =>
        lang.name.toLowerCase().includes(languageSearch.toLowerCase()),
      ),
    [languageSearch],
  );

  const filteredTimezones = useMemo(
    () =>
      TIMEZONES.filter(
        (tz) =>
          tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
          tz.value.toLowerCase().includes(timezoneSearch.toLowerCase()),
      ),
    [timezoneSearch],
  );

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const validateAndSetDisplayName = (text: string) => {
    setDisplayName(text);
    const result = validateUsername(text.trim());
    setValidationMessage(result.message);
    // Reset availability check while typing
    setIsDisplayNameAvailable(null);
    setIsCheckingAvailability(false);
  };

  const handleDisplayNameBlur = () => {
    setDisplayNameFocused(false);

    const trimmed = displayName.trim();
    const result = validateUsername(trimmed);

    // Only check availability if format is valid
    if (!result.isValid) {
      setValidationMessage(result.message);
      setIsDisplayNameAvailable(null);
      setIsCheckingAvailability(false);
      return;
    }

    // Clear any pending checks
    if (blurCheckTimerRef.current) {
      clearTimeout(blurCheckTimerRef.current);
    }

    const currentRequestId = ++requestIdRef.current;
    setValidationMessage("Checking availability...");
    setIsCheckingAvailability(true);

    blurCheckTimerRef.current = setTimeout(async () => {
      const available = await checkDisplayNameAvailability(
        trimmed,
        profile?.id,
      );
      if (currentRequestId !== requestIdRef.current) return;

      setIsCheckingAvailability(false);
      setIsDisplayNameAvailable(available);
      setValidationMessage(
        available ? "Display name available" : "Display name already taken",
      );
    }, 300);
  };

  const regexValidation = validateUsername(displayName.trim());
  const isDisplayNameValid = regexValidation.isValid;
  const displayNameBorderColor = isCheckingAvailability
    ? "#9CA3AF"
    : isDisplayNameAvailable === true
      ? "#34D399"
      : isDisplayNameAvailable === false
        ? "#F87171"
        : isDisplayNameValid
          ? "#34D399"
          : displayName.trim()
            ? "#F87171"
            : "#2D3036";

  const statusColor = isCheckingAvailability
    ? "#9CA3AF"
    : isDisplayNameAvailable === true
      ? "#34D399"
      : isDisplayNameAvailable === false
        ? "#F87171"
        : "#9CA3AF";

  const handleSave = async () => {
    if (!profile?.id) {
      Alert.alert(
        "Error",
        "Profile not available. Please re-login and try again.",
      );
      return;
    }

    if (!displayName.trim()) {
      Alert.alert("Validation", "Display name cannot be empty.");
      return;
    }

    if (isDisplayNameAvailable === false) {
      Alert.alert(
        "Validation",
        "This display name is already taken. Please choose another.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: profile.id,
        displayName: displayName.trim(),
        nativeLanguage,
        timezone,
        growthStyle: selectedMode,
      };

      const result = await (client as any).models.UserProfile.update(payload);

      if (result?.errors?.length) {
        throw new Error(result.errors[0].message || "Failed to update profile");
      }

      dispatch(
        setProfile({
          ...profile,
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
      );

      Alert.alert("Saved", "Profile settings updated successfully.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save profile settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#191D24]">
      <TouchableOpacity
        className="ml-auto mt-20 mb-2 mr-4 p-2"
        onPress={openDrawer}
        activeOpacity={0.7}
      >
        <View style={{ width: 18 }} className="w-8 flex gap-1">
          <View style={{ height: 2 }} className="bg-white w-full" />
          <View style={{ height: 2 }} className="bg-white w-full" />
        </View>
      </TouchableOpacity>

      <View className="flex-1 flex-col justify-between px-6 pt-6 pb-4">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <Text className="text-3xl font-bold text-white leading-tight">
            Profile Settings
          </Text>
          <Text className="text-[#9CA3AF] text-sm leading-5 mt-3 mb-6">
            Update your personal details and study-related preferences.
          </Text>

          <View className="gap-3 ">
            <Text className="text-white text-sm font-semibold">
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={validateAndSetDisplayName}
              onFocus={() => setDisplayNameFocused(true)}
              onBlur={handleDisplayNameBlur}
              className="h-14 rounded-xl px-4 text-white text-lg"
              style={[styles.input, { borderColor: displayNameBorderColor }]}
              placeholderTextColor="#6B7280"
              placeholder="Enter your display name"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View
              style={{
                height: 24,
              }}
            >
              {displayNameFocused ? (
                <Text
                  style={{
                    color: isDisplayNameValid
                      ? "#34D399"
                      : displayName.trim()
                        ? "#F87171"
                        : "#9CA3AF",
                  }}
                  className="text-xs leading-4  px-1"
                >
                  {displayName.trim()
                    ? isDisplayNameValid
                      ? "Format valid ✓"
                      : "3-24 chars, letters/numbers/underscore only, must include at least one letter."
                    : "3-24 chars, letters/numbers/underscore only, must include at least one letter."}
                </Text>
              ) : (
                <>
                  {isDisplayNameValid && (
                    <View
                      className="flex-row items-center  px-1"
                      style={{ gap: 8 }}
                    >
                      {isCheckingAvailability && (
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      )}
                      <Text
                        style={{ color: statusColor }}
                        className="text-xs leading-4"
                      >
                        {validationMessage}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          <View className="gap-3 mb-6">
            <Text className="text-white text-sm font-semibold">
              Native Language
            </Text>
            <Pressable
              onPress={() => setActiveModal("language")}
              className="h-14 rounded-xl px-4 flex-row items-center justify-between"
              style={styles.input}
            >
              <View className="flex-row items-center gap-3">
                {selectedLanguage ? (
                  <>
                    <Text className="text-2xl">{selectedLanguage.flag}</Text>
                    <Text className="text-white text-lg">
                      {selectedLanguage.name}
                    </Text>
                  </>
                ) : (
                  <Text className="text-[#6B7280] text-lg">
                    Select language
                  </Text>
                )}
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </Pressable>
          </View>

          <View className="gap-3 mb-6">
            <Text className="text-white text-sm font-semibold">Timezone</Text>
            <View
              className="h-14 rounded-xl px-4 flex-row items-center justify-between"
              style={styles.input}
            >
              <Pressable
                onPress={() => setActiveModal("timezone")}
                className="flex-row items-center gap-2 flex-1"
              >
                <Text className="text-xl">🌍</Text>
                <Text className="text-white text-base flex-1" numberOfLines={1}>
                  {selectedTimezoneLabel}
                </Text>
              </Pressable>
              <TouchableOpacity
                onPress={() =>
                  setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
                }
                style={styles.autoDetectBadge}
              >
                <Text style={styles.autoDetectBadgeText}>Auto</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="gap-3 mb-6">
            <Text className="text-white text-sm font-semibold mb-2">
              Study Mode
            </Text>
            <View className="gap-3">
              {MODES.map((mode) => (
                <ModeCardAnimated
                  key={mode.id}
                  mode={mode}
                  isSelected={selectedMode === mode.id}
                  onSelect={() => {
                    setSelectedMode(mode.id as GrowthStyle);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        disabled={saving || !hasChanges}
        onPress={handleSave}
        style={{
          opacity: hasChanges && !saving ? 1 : 0.5,
        }}
        className="mx-6 mb-6 py-4 rounded-xl bg-[#FA541C] items-center justify-center"
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white text-lg font-bold">
            {hasChanges ? "Save Changes" : "No Changes"}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={activeModal === "language"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 ">
            <Pressable
              className="flex-1"
              onPress={() => setActiveModal(null)}
            />
            <View
              className="bg-[#1A1A1A] rounded-t-3xl p-6 pb-8"
              style={{ maxHeight: "75%" }}
            >
              <Text className="text-white text-lg font-semibold mb-4">
                Select Language
              </Text>
              <TextInput
                value={languageSearch}
                onChangeText={setLanguageSearch}
                placeholder="Search languages..."
                placeholderTextColor="#6B7280"
                className="bg-[#1C1F26] rounded-xl px-4 py-3 text-white border border-gray-700 mb-4"
              />
              <ScrollView
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {filteredLanguages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    onPress={() => {
                      setNativeLanguage(lang.name);
                      setActiveModal(null);
                      setLanguageSearch("");
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800"
                  >
                    <Text className="mr-3 text-2xl">{lang.flag}</Text>
                    <Text className="text-white text-base flex-1">
                      {lang.name}
                    </Text>
                    {nativeLanguage === lang.name && (
                      <Text className="text-[#FA541C] text-xl">✓</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={activeModal === "timezone"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 ">
            <Pressable
              className="flex-1"
              onPress={() => setActiveModal(null)}
            />
            <View
              className="bg-[#1A1A1A] rounded-t-3xl p-6 pb-8"
              style={{ maxHeight: "75%" }}
            >
              <Text className="text-white text-lg font-semibold mb-4">
                Select Timezone
              </Text>
              <TextInput
                value={timezoneSearch}
                onChangeText={setTimezoneSearch}
                placeholder="Search timezones..."
                placeholderTextColor="#6B7280"
                className="bg-[#1C1F26] rounded-xl px-4 py-3 text-white border border-gray-700 mb-4"
              />
              <ScrollView
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {filteredTimezones.map((tz) => (
                  <Pressable
                    key={tz.value}
                    onPress={() => {
                      setTimezone(tz.value);
                      setActiveModal(null);
                      setTimezoneSearch("");
                    }}
                    className="px-6 py-4 border-b border-gray-800 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-white text-base">{tz.label}</Text>
                      <Text className="text-gray-500 text-sm mt-1">
                        {tz.value}
                      </Text>
                    </View>
                    {timezone === tz.value && (
                      <Text className="text-[#FA541C] text-xl">✓</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#2D3036",
    backgroundColor: "#111214",
  },
  autoDetectBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoDetectBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

const ModeCardAnimated = ({
  mode,
  isSelected,
  onSelect,
}: {
  mode: any;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const animationValue = useSharedValue(0);
  const contentHeightRef = useRef(40); // estimated height for selected content

  useEffect(() => {
    animationValue.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
    });
  }, [isSelected]);

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationValue.value,
      [0, 1],
      [0, contentHeightRef.current],
      Extrapolate.CLAMP,
    );

    return {
      height,
      opacity: animationValue.value,
      overflow: "hidden",
    };
  });

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <LinearGradient
        colors={mode.gradientColors as any}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? "#FFFFFF" : "transparent",
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text
              style={{
                color: mode.badge === "Recommended" ? "#FFF" : "#000",
              }}
              className="text-lg font-bold mb-1"
            >
              {mode.title}
            </Text>
            <Text
              style={{
                color: mode.badge === "Recommended" ? "#FFF" : "#000",
              }}
              className="opacity-70 text-sm"
            >
              {mode.desc}
            </Text>
          </View>
          {mode.badge === "Recommended" && (
            <Text className="text-white text-sm font-bold ml-2">✨</Text>
          )}
        </View>
        <Animated.View
          style={contentAnimatedStyle}
          onLayout={(e) => {
            contentHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          <Text
            style={{
              color: mode.badge === "Recommended" ? "#FFF" : "#000",
            }}
            className="mt-3 font-semibold"
          >
            ✓ Selected
          </Text>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
