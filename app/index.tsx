import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      await getCurrentUser();
      // User is authenticated, redirect to home
      router.replace('/(home)');
    } catch (error) {
      // User is not authenticated, redirect to auth
      router.replace('/(auth)');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-lg text-gray-600 mt-4">Loading Lexsee v3...</Text>
      </View>
    );
  }

  return null;
}
