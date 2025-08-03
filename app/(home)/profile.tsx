import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function ProfileScreen() {
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
          <Text className="text-2xl font-bold text-gray-800">Profile</Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 py-8">
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Profile Settings
          </Text>
          <Text className="text-gray-600">
            Profile management features will be implemented here.
          </Text>
        </View>
      </View>
    </View>
  );
}
