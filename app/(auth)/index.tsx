import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function AuthIndexScreen() {
  return (
    <View className="flex-1 justify-center px-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <View className="bg-white rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-gray-800 mb-2">Lexsee v3</Text>
          <Text className="text-lg text-gray-600 text-center">
            Your AI Legal Assistant
          </Text>
        </View>

        {/* Welcome Message */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-gray-800 text-center mb-2">
            Welcome!
          </Text>
          <Text className="text-gray-600 text-center">
            Sign in to access your legal AI assistant or create a new account to get started.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity className="bg-blue-600 rounded-xl py-4 px-6">
              <Text className="text-white text-center font-semibold text-lg">
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="bg-white border-2 border-blue-600 rounded-xl py-4 px-6">
              <Text className="text-blue-600 text-center font-semibold text-lg">
                Create Account
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View className="mt-8 pt-6 border-t border-gray-200">
          <Text className="text-sm text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}
