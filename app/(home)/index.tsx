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

      {/* Main Content */}
      <View className="flex-1 px-6 py-8">
        <Text className="text-xl font-semibold text-gray-800 mb-6">
          Lexsee v3 - Your AI Legal Assistant
        </Text>

        {/* Action Cards */}
        <View className="space-y-4">
          <Link href="/(home)/chat" asChild>
            <TouchableOpacity className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mr-4">
                  <Text className="text-2xl">💬</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Start Chat
                  </Text>
                  <Text className="text-gray-600">
                    Ask legal questions and get AI assistance
                  </Text>
                </View>
                <Text className="text-gray-400">→</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/(home)/profile" asChild>
            <TouchableOpacity className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-green-100 rounded-lg items-center justify-center mr-4">
                  <Text className="text-2xl">👤</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Profile
                  </Text>
                  <Text className="text-gray-600">
                    Manage your account settings
                  </Text>
                </View>
                <Text className="text-gray-400">→</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/(about)" asChild>
            <TouchableOpacity className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-purple-100 rounded-lg items-center justify-center mr-4">
                  <Text className="text-2xl">ℹ️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    About
                  </Text>
                  <Text className="text-gray-600">
                    Learn more about Lexsee v3
                  </Text>
                </View>
                <Text className="text-gray-400">→</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Quick Stats */}
        <View className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
          <Text className="text-white text-lg font-semibold mb-2">
            Getting Started
          </Text>
          <Text className="text-blue-100">
            Welcome to Lexsee v3! Start by asking a legal question in the chat.
          </Text>
        </View>
      </View>
    </View>
  );
}
