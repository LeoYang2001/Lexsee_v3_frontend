import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import { Feather } from "@expo/vector-icons";

export default function HomeScreen() {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  // Redirect to auth if not authenticated (shouldn't happen, but safety check)
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)");
    }
  }, [isAuthenticated]);

  const QuickActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    color = "#FA541C",
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4"
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${color}20` }}
        >
          <Feather name={icon as any} size={24} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Welcome Section */}
      <View className="bg-white mx-6 mt-6 rounded-xl p-6 shadow-sm border border-gray-100">
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mr-4">
            <Feather name="user" size={28} color="#FA541C" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">
              Welcome back!
            </Text>
            <Text className="text-gray-600 mt-1 text-lg">
              {user?.displayName || user?.email || "User"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Quick Actions
        </Text>

        <QuickActionCard
          icon="info"
          title="About LexSee"
          subtitle="Learn more about our legal services"
          onPress={() => router.push("/(about)")}
          color="#3B82F6"
        />

        <QuickActionCard
          icon="file-text"
          title="App Information"
          subtitle="Version, terms, and app details"
          onPress={() => router.push("/(home)/info")}
          color="#10B981"
        />

        <QuickActionCard
          icon="phone"
          title="Contact Support"
          subtitle="Get help from our support team"
          onPress={() => router.push("/(home)/contact")}
          color="#8B5CF6"
        />

        <QuickActionCard
          icon="settings"
          title="Settings"
          subtitle="Manage your account and preferences"
          onPress={() => router.push("/(home)/settings")}
          color="#6B7280"
        />
      </View>

      {/* User Information */}
      <View className="px-6 pb-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Account Details
        </Text>

        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <View className="space-y-4">
            <View>
              <Text className="text-sm text-gray-500 font-medium">Email</Text>
              <Text className="text-gray-800 font-medium text-lg mt-1">
                {user?.email || "Not available"}
              </Text>
            </View>

            <View className="border-t border-gray-100 pt-4">
              <Text className="text-sm text-gray-500 font-medium">User ID</Text>
              <Text className="text-gray-800 font-medium mt-1">
                {user?.userId || "Not available"}
              </Text>
            </View>

            <View className="border-t border-gray-100 pt-4">
              <Text className="text-sm text-gray-500 font-medium">
                Username
              </Text>
              <Text className="text-gray-800 font-medium mt-1">
                {user?.username || "Not available"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
