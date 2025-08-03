import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-6 px-6 shadow-sm">
        <View className="flex-row items-center">
          <Link href="/(home)" asChild>
            <TouchableOpacity className="mr-4">
              <Text className="text-blue-600 text-lg">← Back</Text>
            </TouchableOpacity>
          </Link>
          <Text className="text-2xl font-bold text-gray-800">
            About Lexsee v3
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-8">
        {/* App Info */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">⚖️</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">Lexsee v3</Text>
            <Text className="text-gray-600">Version 1.0.0</Text>
          </View>

          <Text className="text-gray-700 text-center leading-6">
            Your intelligent AI legal assistant, designed to help you navigate
            complex legal matters with ease and confidence.
          </Text>
        </View>

        {/* Features */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Features
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center">
              <Text className="text-blue-600 mr-3">✓</Text>
              <Text className="text-gray-700 flex-1">
                AI-powered legal question answering
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-blue-600 mr-3">✓</Text>
              <Text className="text-gray-700 flex-1">
                Secure user authentication
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-blue-600 mr-3">✓</Text>
              <Text className="text-gray-700 flex-1">
                Document analysis and review
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-blue-600 mr-3">✓</Text>
              <Text className="text-gray-700 flex-1">
                Legal research assistance
              </Text>
            </View>
          </View>
        </View>

        {/* Technology Stack */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Built With
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-3">•</Text>
              <Text className="text-gray-700">React Native with Expo</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-3">•</Text>
              <Text className="text-gray-700">AWS Amplify Gen2</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-3">•</Text>
              <Text className="text-gray-700">TypeScript</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-3">•</Text>
              <Text className="text-gray-700">NativeWind (Tailwind CSS)</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-3">•</Text>
              <Text className="text-gray-700">Expo Router</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Contact
          </Text>
          <Text className="text-gray-700 mb-2">
            For support or inquiries, please contact:
          </Text>
          <Text className="text-blue-600">support@lexsee.com</Text>
        </View>

        {/* Legal Disclaimer */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <Text className="text-lg font-semibold text-yellow-800 mb-2">
            Important Disclaimer
          </Text>
          <Text className="text-yellow-700 text-sm leading-5">
            Lexsee v3 provides AI-generated legal information for educational
            purposes only. This is not a substitute for professional legal
            advice. Always consult with a qualified attorney for specific legal
            matters.
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-gray-500 text-sm">
            © 2025 Lexsee. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
