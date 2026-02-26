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
import { Link, router, useRouter } from "expo-router";
import { signUp } from "aws-amplify/auth";
import GradientBackground from "../../components/common/GradientBackground";
import { BlurView } from "expo-blur";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Focus states for input styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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
          ],
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
    <GradientBackground
      imagePath={require("../../assets/images/signInBgImage.png")}
      gradientLocations={[0, 0.3, 0.6, 1]}
      overlayOpacity={0.7}
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
                  Register with Email
                </Text>
                <Text className="text-lg text-gray-200 text-center">
                  Join LexSee and start your legal journey
                </Text>
              </View>

              {/* Form */}
              <View className="space-y-6  mb-4">
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                    }}
                    className="text-white my-3 opacity-70 font-medium"
                  >
                    Email
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: emailFocused
                        ? "rgba(255, 255, 255, 0.5)"
                        : "transparent",
                    }}
                    className="relative overflow-hidden"
                  >
                    <BlurView intensity={20}>
                      <TextInput
                        className="rounded-xl px-4 py-4 text-white bg-white/10"
                        style={{
                          fontSize: 16,
                        }}
                        value={email}
                        onChangeText={setEmail}
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                      />
                    </BlurView>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 14,
                    }}
                    className="text-white my-3 opacity-70 font-medium"
                  >
                    Password
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: passwordFocused
                        ? "rgba(255, 255, 255, 0.5)"
                        : "transparent",
                    }}
                    className="relative overflow-hidden"
                  >
                    <BlurView intensity={20}>
                      <TextInput
                        className="rounded-xl px-4 py-4 text-white bg-white/10"
                        style={{
                          fontSize: 16,
                        }}
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        secureTextEntry
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                    </BlurView>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 14,
                    }}
                    className="text-white my-3 opacity-70 font-medium"
                  >
                    Confirm Password
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: confirmPasswordFocused
                        ? "rgba(255, 255, 255, 0.5)"
                        : "transparent",
                    }}
                    className="relative overflow-hidden"
                  >
                    <BlurView intensity={20}>
                      <TextInput
                        className="rounded-xl px-4 py-4 text-white bg-white/10"
                        style={{
                          fontSize: 16,
                        }}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        secureTextEntry
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                      />
                    </BlurView>
                  </View>
                  {/* <Text className="text-sm text-gray-300 mt-2 px-2">
                    Must be at least 8 characters with uppercase, lowercase,
                    numbers, and symbols
                  </Text> */}
                </View>

                <TouchableOpacity
                  style={{
                    height: 52,
                    backgroundColor: "#FA541C",
                    borderRadius: 12,
                    marginTop: 24,
                  }}
                  className="flex justify-center items-center"
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Links */}
              <View className="mt-8 items-center">
                <TouchableOpacity
                  onPress={() => {
                    router.back();
                  }}
                >
                  <Text className="text-white text-center text-lg">
                    Already have an account?{" "}
                    <Text style={{ color: "#FA541C", fontWeight: "600" }}>
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
