import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link, router } from "expo-router";
import { signUp } from "aws-amplify/auth";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        Alert.alert(
          "Verification Required",
          "Please check your email for a verification code.",
          [
            {
              text: "OK",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/verify-email",
                  params: { email },
                }),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert("Sign Up Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-gray-50">
      <View className="bg-white rounded-2xl p-8 shadow-lg">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-600">Join Lexsee v3 today</Text>
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
            <Text className="text-sm text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, numbers,
              and symbols
            </Text>
          </View>

          <TouchableOpacity
            className="bg-green-600 rounded-lg py-4 mt-6"
            onPress={handleSignUp}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View className="mt-6 space-y-3">
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 text-center">
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)" asChild>
            <TouchableOpacity>
              <Text className="text-gray-600 text-center">← Back</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
