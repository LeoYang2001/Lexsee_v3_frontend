import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import GradientBackground from "../../components/common/GradientBackground";
import { BlurView } from "expo-blur";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Create refs for each input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first input on mount and start resend countdown
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    // Start 60-second countdown when component mounts (since email was just sent)
    setResendTimer(60);

    return () => clearTimeout(timer);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to go to previous input
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter all 6 digits");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: verificationCode,
      });

      if (isSignUpComplete) {
        Alert.alert(
          "Success!",
          "Your email has been verified successfully. You can now sign in.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/sign-in"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error confirming sign up:", error);
      Alert.alert("Verification Failed", (error as Error).message);
      setCode(["", "", "", "", "", ""]); // Clear the code on error
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setLoading(true);
    try {
      await resendSignUpCode({
        username: email,
      });
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
      setResendTimer(60); // 60 second cooldown
    } catch (error) {
      console.error("Error resending code:", error);
      Alert.alert("Error", (error as Error).message);
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
          <View className="flex-1 justify-start  px-6 py-16">
            {/* Spacer for top */}
            <View className="h-[20%]" />

            {/* Content Container */}
            <View className="flex-1 justify-center">
              {/* Header */}
              <View className="items-start  mb-12">
                <Text
                  style={{
                    fontSize: 28,
                  }}
                  className=" font-semibold text-white mb-4 text-center"
                >
                  Verification Code Sent
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                  }}
                  className=" font-semibold text-white text-center mb-2"
                >
                  Check your email {email}
                </Text>
              </View>

              {/* Form */}
              <View className="space-y-6">
                <View>
                  {/* 6-Digit Code Input */}
                  <View className="flex-row justify-center gap-3 mb-6">
                    {code.map((digit, index) => (
                      <View
                        key={index}
                        style={{
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor:
                            focusedIndex === index
                              ? "rgba(255, 255, 255, 0.5)"
                              : "transparent",
                        }}
                        className="relative overflow-hidden"
                      >
                        <BlurView intensity={20}>
                          <TextInput
                            ref={(ref) => {
                              inputRefs.current[index] = ref;
                            }}
                            className="w-14 h-14 text-white bg-white/10 text-center text-xl font-semibold"
                            style={{
                              fontSize: 18,
                              borderRadius: 12,
                            }}
                            value={digit}
                            onChangeText={(value) =>
                              handleCodeChange(value, index)
                            }
                            onKeyPress={({ nativeEvent }) =>
                              handleKeyPress(nativeEvent.key, index)
                            }
                            onFocus={() => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                            keyboardType="number-pad"
                            maxLength={1}
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          />
                        </BlurView>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Verify Email Button */}
                <TouchableOpacity
                  style={{
                    height: 52,
                    backgroundColor: "#FA541C",
                    borderRadius: 12,
                    marginTop: 24,
                    opacity: loading || code.join("").length !== 6 ? 0.6 : 1,
                  }}
                  className="flex justify-center items-center"
                  onPress={handleVerify}
                  disabled={loading || code.join("").length !== 6}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    {loading ? "Verifying..." : "Verify Email"}
                  </Text>
                </TouchableOpacity>

                {/* Resend Email Button */}
                <TouchableOpacity
                  style={{
                    height: 52,
                    backgroundColor:
                      resendTimer > 0 ? "#150702" : "rgba(255, 255, 255, 0.2)",
                    borderRadius: 12,
                    marginTop: 16,
                    borderWidth: 1,
                    borderColor: "#FF6A3760",
                    opacity: resendTimer > 0 || loading ? 0.6 : 1,
                  }}
                  className="flex justify-center items-center"
                  onPress={handleResendCode}
                  disabled={resendTimer > 0 || loading}
                >
                  <Text
                    style={{
                      color: "#FF6A3760",
                    }}
                    className="text-center font-semibold text-lg"
                  >
                    {resendTimer > 0
                      ? `Resend Email (${resendTimer}s)`
                      : loading
                        ? "Sending..."
                        : "Resend Email"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Links */}
              {/* <View className="mt-8 items-center">
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity className="mt-4">
                    <Text className="text-white text-center text-lg">
                      ← Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
