import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { signIn } from 'aws-amplify/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        router.replace('/(home)');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      Alert.alert('Sign In Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-gray-50">
      <View className="bg-white rounded-2xl p-8 shadow-lg">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</Text>
          <Text className="text-gray-600">Sign in to your account</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 mt-6"
            onPress={handleSignIn}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View className="mt-6 space-y-3">
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 text-center">
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(auth)" asChild>
            <TouchableOpacity>
              <Text className="text-gray-600 text-center">
                ← Back
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
