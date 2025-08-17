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
import { signIn, signInWithRedirect } from "aws-amplify/auth";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInfo } from "../../store/slices/userSlice";
import GradientBackground from "../../components/common/GradientBackground";
import { BlurView } from "expo-blur";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

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
        // Fetch user info and update Redux store
        const resultAction = await dispatch(fetchUserInfo());

        if (fetchUserInfo.fulfilled.match(resultAction)) {
          // User info fetched successfully, redirect to home
          router.replace("/(home)");
        } else {
          // Failed to fetch user info, show error but user is still signed in
          Alert.alert(
            "Warning",
            "Signed in successfully but failed to load user data. Please restart the app."
          );
          router.replace("/(home)");
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
      Alert.alert("Sign In Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);

      await signInWithRedirect({
        provider: "Google",
      });
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error("Error signing in with Google:", e);
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
                        placeholder="Enter your email"
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
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        secureTextEntry
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                    </BlurView>
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
              <TouchableOpacity
                onPress={handleSignInWithGoogle}
                className="text-white text-center font-semibold text-lg"
              >
                <Text className="text-white font-semibold">
                  📧 Googleでサインイン
                </Text>
              </TouchableOpacity>

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
