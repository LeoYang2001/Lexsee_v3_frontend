import React from "react";
import { View, Text } from "react-native";

interface ErrorMessageProps {
  error: string;
  showMockDataMessage?: boolean;
}

export default function ErrorMessage({
  error,
  showMockDataMessage = true,
}: ErrorMessageProps) {
  if (!error) return null;

  return (
    <View
      style={{
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(244, 67, 54, 0.3)",
        margin: 12,
        padding: 12,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "#f44336", fontSize: 14 }}>API Error: {error}</Text>
      {showMockDataMessage && (
        <Text
          style={{
            color: "#f44336",
            fontSize: 12,
            marginTop: 4,
            opacity: 0.8,
          }}
        >
          Using sample images for demonstration
        </Text>
      )}
    </View>
  );
}
