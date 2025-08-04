import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { signOut } from "aws-amplify/auth";
import { useAppDispatch } from "../../store/hooks";
import { clearUser } from "../../store/slices/userSlice";
import { Feather } from "@expo/vector-icons";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            dispatch(clearUser());
            router.replace("/(auth)");
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Sign Out Error", (error as Error).message);
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
            danger ? "bg-red-100" : "bg-gray-100"
          }`}
        >
          <Feather
            name={icon as any}
            size={20}
            color={danger ? "#EF4444" : "#6B7280"}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`text-lg font-semibold ${danger ? "text-red-600" : "text-gray-800"}`}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
        {showArrow && (
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Account Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">Account</Text>

          <SettingItem
            icon="user"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => router.push("/(home)/profile")}
          />

          <SettingItem
            icon="bell"
            title="Notifications"
            subtitle="Configure notification preferences"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Notification settings will be available soon."
              )
            }
          />

          <SettingItem
            icon="shield"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Privacy settings will be available soon."
              )
            }
          />
        </View>

        {/* App Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">App</Text>

          <SettingItem
            icon="info"
            title="About"
            subtitle="Learn more about LexSee"
            onPress={() => router.push("/(about)")}
          />

          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => router.push("/(home)/contact")}
          />

          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Rate us on the App Store"
            onPress={() =>
              Alert.alert(
                "Thank you!",
                "Rating feature will be available soon."
              )
            }
          />
        </View>

        {/* Sign Out */}
        <View className="mb-8">
          <SettingItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            showArrow={false}
            danger={true}
          />
        </View>
      </View>
    </ScrollView>
  );
}
