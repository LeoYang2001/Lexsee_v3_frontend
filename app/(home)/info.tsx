import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function InfoScreen() {
  const InfoCard = ({
    icon,
    title,
    content,
    action,
  }: {
    icon: string;
    title: string;
    content: string;
    action?: () => void;
  }) => (
    <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-start">
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
          <Feather name={icon as any} size={20} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            {title}
          </Text>
          <Text className="text-gray-600 leading-6">{content}</Text>
          {action && (
            <TouchableOpacity onPress={action} className="mt-3">
              <Text className="text-blue-600 font-medium">Learn More →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-500 py-12">
      <View className="px-6 py-6">
        {/* App Info Header */}
        <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6">
          <View className="items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
              <Feather name="smartphone" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white mb-2">
              LexSee v3
            </Text>
            <Text className="text-white/90 text-center">
              Your comprehensive legal assistant and document management
              platform
            </Text>
          </View>
        </View>

        {/* App Details */}
        <InfoCard
          icon="info"
          title="Version Information"
          content="LexSee v3.0.0 - Built with React Native and Expo. This version includes enhanced security, improved user experience, and new AI-powered legal assistance features."
        />

        <InfoCard
          icon="shield"
          title="Privacy & Security"
          content="Your data is protected with end-to-end encryption and AWS Amplify security. We never share your personal information with third parties."
          action={() => Linking.openURL("https://lexsee.com/privacy")}
        />

        <InfoCard
          icon="file-text"
          title="Terms of Service"
          content="By using LexSee, you agree to our terms of service. Please review our terms for important information about your rights and responsibilities."
          action={() => Linking.openURL("https://lexsee.com/terms")}
        />

        <InfoCard
          icon="users"
          title="About Our Team"
          content="LexSee is developed by a team of legal professionals and software engineers dedicated to making legal services more accessible and efficient."
        />

        <InfoCard
          icon="star"
          title="What's New"
          content="• Enhanced authentication with email verification\n• Improved UI with glass-morphism design\n• Better navigation with drawer layout\n• Optimized performance and stability"
        />

        <InfoCard
          icon="help-circle"
          title="Technical Support"
          content="Need help? Our technical support team is available 24/7 to assist you with any issues or questions about the app."
          action={() => Linking.openURL("mailto:support@lexsee.com")}
        />

        {/* Footer */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-center text-gray-500 text-sm">
            © 2025 LexSee. All rights reserved.
          </Text>
          <Text className="text-center text-gray-400 text-xs mt-2">
            Powered by AWS Amplify & React Native
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
