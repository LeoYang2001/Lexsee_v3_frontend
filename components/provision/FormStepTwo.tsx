import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { ProfileData } from "../../app/(auth)/onboarding";
import { LANGUAGES, TIMEZONES } from "../../lib/profileData";

const FormStepTwo = ({
  step,
  onNext,
  onBack,
  isLoading = false,
}: {
  step: number;
  onNext: (nextData: Partial<ProfileData>) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<{
    code: string;
    name: string;
    flag: string;
  } | null>(null);
  const [timezone, setTimezone] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");

  useEffect(() => {
    // Auto-detect timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detectedTimezone);
  }, []);

  const canContinue = !!selectedLanguage;

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()),
  );

  const filteredTimezones = TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
      tz.value.toLowerCase().includes(timezoneSearch.toLowerCase()),
  );

  return (
    <>
      <View className="flex-1 flex-col justify-between px-6 pt-24 pb-10">
        <View className="gap-6">
          <Text className="text-3xl font-bold text-white leading-tight">
            Language & Location
          </Text>

          <View className="gap-4">
            {/* Language Selection */}
            <View className="gap-3">
              <Text className="text-white text-sm font-semibold">
                Native Language
              </Text>
              <Pressable
                onPress={() => setShowLanguageModal(true)}
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
                      Select your native language
                    </Text>
                  )}
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </Pressable>
              {!selectedLanguage && (
                <Text className="text-[#9CA3AF] text-xs leading-4 px-1">
                  Choose the language you're most comfortable with.
                </Text>
              )}
            </View>

            {/* Timezone Display */}
            <View className="gap-3">
              <Text className="text-white text-sm font-semibold">Timezone</Text>
              <View
                className="h-14 rounded-xl px-4 flex-row items-center justify-between"
                style={styles.timezoneBox}
              >
                <Pressable
                  onPress={() => setShowTimezoneModal(true)}
                  className="flex-row items-center gap-2 flex-1"
                >
                  <Text className="text-xl">🌍</Text>
                  <Text className="text-white text-lg">
                    {TIMEZONES.find((tz) => tz.value === timezone)?.label ||
                      timezone}
                  </Text>
                </Pressable>
                <TouchableOpacity
                  onPress={() => {
                    const detectedTimezone =
                      Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimezone(detectedTimezone);
                  }}
                  style={styles.autoDetectBadge}
                >
                  <Text style={styles.autoDetectBadgeText}>Auto</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-[#9CA3AF] text-xs leading-4 px-1">
                Automatically detected, tap badge to re-detect.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="  mr-auto  p-2 "
            disabled={isLoading}
            onPress={() => {
              // Handle next step
              console.log("Back pressed");
              onBack();
            }}
          >
            <Text
              style={{
                opacity: isLoading ? 0.3 : 1,
              }}
              className="text-white text-xl font-bold"
            >
              Previous
            </Text>
            <View></View>
          </TouchableOpacity>
          <TouchableOpacity
            className="  ml-auto  p-2 "
            disabled={!canContinue || isLoading}
            onPress={() => {
              // Handle next step
              console.log("Next pressed");
              onNext({
                nativeLanguage: selectedLanguage!.name,
                timezone,
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
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50">
            <Pressable
              className="flex-1"
              onPress={() => setShowLanguageModal(false)}
            />
            <View
              className="bg-[#131416] rounded-t-3xl"
              style={{ maxHeight: "75%" }}
            >
              <View className="p-6 border-b border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-white">
                    Select Language
                  </Text>
                  <Pressable onPress={() => setShowLanguageModal(false)}>
                    <Text className="text-gray-400 text-3xl leading-none">
                      ×
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={languageSearch}
                  onChangeText={setLanguageSearch}
                  placeholder="Search languages..."
                  placeholderTextColor="#6B7280"
                  className="bg-[#1C1F26] rounded-xl px-4 py-3 text-white border border-gray-700"
                />
              </View>
              <ScrollView
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {filteredLanguages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setShowLanguageModal(false);
                      setLanguageSearch("");
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800"
                  >
                    <Text className="mr-3 text-2xl">{lang.flag}</Text>
                    <Text className="text-white text-base flex-1">
                      {lang.name}
                    </Text>
                    {selectedLanguage?.code === lang.code && (
                      <Text className="text-[#FA541C] text-xl">✓</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Timezone Selection Modal */}
      <Modal
        visible={showTimezoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50">
            <Pressable
              className="flex-1"
              onPress={() => setShowTimezoneModal(false)}
            />
            <View
              className="bg-[#131416] rounded-t-3xl"
              style={{ maxHeight: "75%" }}
            >
              <View className="p-6 border-b border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-white">
                    Select Timezone
                  </Text>
                  <Pressable onPress={() => setShowTimezoneModal(false)}>
                    <Text className="text-gray-400 text-3xl leading-none">
                      ×
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={timezoneSearch}
                  onChangeText={setTimezoneSearch}
                  placeholder="Search timezones..."
                  placeholderTextColor="#6B7280"
                  className="bg-[#1C1F26] rounded-xl px-4 py-3 text-white border border-gray-700"
                />
              </View>
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
                      setShowTimezoneModal(false);
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
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#2D3036",
    backgroundColor: "#111214",
  },
  timezoneBox: {
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
  backButton: {
    borderColor: "#374151",
  },
  nextButton: {
    backgroundColor: "#FA541C",
  },
  nextButtonDisabled: {
    backgroundColor: "#374151",
    opacity: 0.5,
  },
});

export default FormStepTwo;
