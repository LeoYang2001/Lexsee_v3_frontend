import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Link, router } from "expo-router";
import { getCurrentUser, signOut } from "aws-amplify/auth";

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      router.replace("/(auth)");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Sign Out Error", (error as Error).message);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-6 px-6 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Welcome back!
            </Text>
            <Text className="text-gray-600 mt-1">
              {user?.signInDetails?.loginId || "User"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-100 px-4 py-2 rounded-lg"
          >
            <Text className="text-red-600 font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Information */}
      <View className="flex-1 px-6 py-8">
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            User Information
          </Text>

          <View className="space-y-3">
            <View>
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-gray-800 font-medium">
                {user?.signInDetails?.loginId || "Not available"}
              </Text>
            </View>

            <View>
              <Text className="text-sm text-gray-500">User ID</Text>
              <Text className="text-gray-800 font-medium">
                {user?.userId || "Not available"}
              </Text>
            </View>

            <View>
              <Text className="text-sm text-gray-500">Username</Text>
              <Text className="text-gray-800 font-medium">
                {user?.username || "Not available"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
