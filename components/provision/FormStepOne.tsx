import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { TextInput } from "react-native-gesture-handler";
import { ProfileData } from "../../app/(onboarding)";
import { client } from "../../app/client";

const USERNAME_REGEX = /^(?=.{3,24}$)(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/;

const validateUsername = (username: string) => {
  if (!username.trim()) {
    return { isValid: false, message: "Username is required." };
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

const checkUsernameAvailability = async (
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

const FormStepOne = ({
  step,
  onNext,
  isLoading = false,
  profileId,
}: {
  step: number;
  onNext: (nextData: Partial<ProfileData>) => Promise<void>;
  isLoading?: boolean;
  profileId?: string;
}) => {
  const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const blurCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = username.trim();

    if (!trimmed) {
      setValidationMessage(
        "Use 3-24 chars: letters, numbers, underscore; include at least one letter.",
      );
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    const result = validateUsername(trimmed);
    if (!result.isValid) {
      setValidationMessage(result.message);
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    // Regex is valid while typing; availability will be checked on blur.
    setValidationMessage("Valid format.");
    setIsAvailable(null);
    setIsChecking(false);

    return () => {
      if (blurCheckTimerRef.current) {
        clearTimeout(blurCheckTimerRef.current);
      }
    };
  }, [username]);

  const handleBlur = () => {
    setIsFocused(false);

    const trimmed = username.trim();
    const result = validateUsername(trimmed);
    if (!result.isValid) {
      setValidationMessage(result.message);
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    if (blurCheckTimerRef.current) {
      clearTimeout(blurCheckTimerRef.current);
    }

    const currentRequestId = ++requestIdRef.current;
    setValidationMessage("Checking availability...");
    setIsChecking(true);

    blurCheckTimerRef.current = setTimeout(async () => {
      const available = await checkUsernameAvailability(trimmed, profileId);
      if (currentRequestId !== requestIdRef.current) return;

      setIsChecking(false);
      setIsAvailable(available);
      setValidationMessage(
        available ? "Username available" : "Username already taken",
      );
    }, 300);
  };

  const canContinue = !!username.trim() && !isChecking && isAvailable === true;
  const regexValidation = validateUsername(username.trim());
  const isRegexValid = regexValidation.isValid;

  const statusColor = isChecking
    ? "#9CA3AF"
    : isAvailable === true
      ? "#34D399"
      : isAvailable === false
        ? "#F87171"
        : "#9CA3AF";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 flex-col justify-between px-6 pt-24 pb-4">
        <View className="gap-6">
          <Text className="text-3xl font-bold text-white leading-tight">
            Choose your username
          </Text>

          <View className="gap-3">
            <TextInput
              value={username}
              onChangeText={(text) => setUsername(text)}
              className="h-14 rounded-xl px-4 text-white text-lg"
              style={[
                styles.usernameInput,
                isAvailable === true
                  ? styles.inputValid
                  : isAvailable === false
                    ? styles.inputInvalid
                    : styles.inputNeutral,
              ]}
              placeholderTextColor="#6B7280"
              placeholder="username"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
            />
            {isFocused ? (
              <Text
                style={{
                  color: isRegexValid
                    ? "#34D399"
                    : username.trim()
                      ? "#F87171"
                      : "#9CA3AF",
                }}
                className="text-xs leading-4 px-1"
              >
                {username.trim()
                  ? isRegexValid
                    ? "Format valid ✓"
                    : "3-24 chars, letters/numbers/underscore only, must include at least one letter."
                  : "3-24 chars, letters/numbers/underscore only, must include at least one letter."}
              </Text>
            ) : (
              <>
                {!isRegexValid && (
                  <Text className="text-[#9CA3AF] text-sm leading-5 px-1">
                    This name will appear on your profile and when you share
                    contributions.
                  </Text>
                )}

                {isRegexValid && (
                  <>
                    <Text className="text-[#9CA3AF] text-sm leading-5 px-1">
                      This name will appear on your profile and when you share
                      contributions.
                    </Text>
                    <View
                      className="flex-row items-center px-1"
                      style={{ gap: 8 }}
                    >
                      {isChecking ? (
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      ) : (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 99,
                            backgroundColor: statusColor,
                          }}
                        />
                      )}
                      <Text
                        style={{ color: statusColor }}
                        className="text-xs leading-4"
                      >
                        {validationMessage}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="  ml-auto  p-2 "
          disabled={!canContinue || isLoading}
          onPress={() => {
            // Handle next step
            console.log("Next pressed");
            onNext({
              displayName: username.trim(),
            });
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={{
                opacity: canContinue ? 1 : 0.3,
              }}
              className="text-white text-xl font-bold"
            >
              Next
            </Text>
          )}
          <View></View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  usernameInput: {
    borderWidth: 1,
    backgroundColor: "#111214",
  },
  inputNeutral: {
    borderColor: "#2D3036",
  },
  inputValid: {
    borderColor: "#34D399",
  },
  inputInvalid: {
    borderColor: "#F87171",
  },
});

export default FormStepOne;
