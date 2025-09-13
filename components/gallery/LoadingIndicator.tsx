import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoadingIndicatorProps {
  isLoading: boolean;
  text?: string;
  color?: string;
  size?: "small" | "large";
}

export default function LoadingIndicator({
  isLoading,
  text = "Loading more images...",
  color = "#E44814",
  size = "small",
}: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <View style={{ padding: 20, alignItems: "center" }}>
      <ActivityIndicator size={size} color={color} />
      <Text style={{ color: "#666", marginTop: 8, fontSize: 12 }}>{text}</Text>
    </View>
  );
}
