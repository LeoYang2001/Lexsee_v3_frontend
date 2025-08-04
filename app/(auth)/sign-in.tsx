import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { Link, router } from "expo-router";
import { signIn } from "aws-amplify/auth";
import GradientBackground from "../../components/common/GradientBackground";
import { BlurView } from "expo-blur";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Focus states for input styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        router.replace("/(home)");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      Alert.alert("Sign In Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground
      imagePath={require("../../assets/images/signInBgImage.png")}
      gradientLocations={[0, 0.3, 0.6, 1]}
      overlayOpacity={0.65}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-between px-6 py-16">
            {/* Spacer for top */}
            <View className="h-[20%]" />

            {/* Content Container */}
            <View className="flex-1 justify-center">
              {/* Header */}
              <View className="items-center mb-12">
                <Text className="text-4xl font-bold text-white mb-4 text-center">
                  Welcome Back
                </Text>
                <Text className="text-lg text-gray-200 text-center">
                  Sign in to your account
                </Text>
              </View>

              {/* Form */}
              <View className="space-y-6">
                <View>
                  <Text className="text-white mb-3 font-medium text-lg">
                    Email
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                    }}
                    className="relative overflow-hidden"
                  >
                    {/* Blur backdrop when focused */}
                    {true && (
                      <BlurView
                        intensity={20}
                        tint="light"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />
                    )}

                    <TextInput
                      className="rounded-xl px-4 py-4 text-white bg-white/10"
                      style={{
                        fontSize: 16,
                        borderWidth: 2,
                        borderColor: emailFocused
                          ? "white"
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white mb-3 font-medium text-lg">
                    Password
                  </Text>
                  <View className="relative">
                    {/* Blur backdrop when focused */}
                    {passwordFocused && (
                      <BlurView
                        intensity={20}
                        tint="light"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 12,
                        }}
                      />
                    )}

                    <TextInput
                      className="rounded-xl px-4 py-4 text-white bg-white/10"
                      style={{
                        fontSize: 16,
                        borderWidth: 2,
                        borderColor: passwordFocused
                          ? "white"
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      secureTextEntry
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    height: 52,
                    backgroundColor: "#FA541C",
                    borderRadius: 12,
                    marginTop: 24,
                  }}
                  className="flex justify-center items-center"
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    {loading ? "Signing In..." : "Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Links */}
              <View className="mt-8 items-center">
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity>
                    <Text className="text-white text-center text-lg">
                      Don't have an account?{" "}
                      <Text style={{ color: "#FA541C", fontWeight: "600" }}>
                        Register
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
