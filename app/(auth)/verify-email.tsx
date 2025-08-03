import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
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
    <View className="flex-1 justify-center px-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <View className="bg-white rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Text className="text-2xl">📧</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Check Your Email
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            We've sent a 6-digit verification code to
          </Text>
          <Text className="text-blue-600 font-medium text-center">{email}</Text>
        </View>

        {/* Code Input */}
        <View className="mb-8">
          <Text className="text-gray-700 mb-4 text-center font-medium">
            Enter verification code
          </Text>
          <View className="flex-row justify-center space-x-3">
            {code.map((digit, index) => (
              <TextInput
                key={index}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold"
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={{
                  borderColor: digit ? "#3B82F6" : "#D1D5DB",
                }}
              />
            ))}
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 mb-6"
          onPress={handleVerify}
          disabled={loading || code.join("").length !== 6}
          style={{
            opacity: loading || code.join("").length !== 6 ? 0.6 : 1,
          }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? "Verifying..." : "Verify Email"}
          </Text>
        </TouchableOpacity>

        {/* Resend Code */}
        <View className="items-center mb-6">
          <Text className="text-gray-600 mb-2">Didn't receive the code?</Text>
          {resendTimer > 0 ? (
            <Text className="text-gray-500">
              Resend available in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode} disabled={loading}>
              <Text className="text-blue-600 font-medium">
                {loading ? "Sending..." : "Resend Code"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back to Sign In */}
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity>
            <Text className="text-gray-600 text-center">← Back to Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
