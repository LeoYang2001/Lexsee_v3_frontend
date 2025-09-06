import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface EmptyStateProps {
  isLoading: boolean;
  currentWord: string;
  onBackPress: () => void;
}

export default function EmptyState({
  isLoading,
  currentWord,
  onBackPress,
}: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      {isLoading ? (
        <>
          <ActivityIndicator size="large" color="#E44814" />
          <Text
            style={{
              color: "#666",
              fontSize: 16,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Searching for "{currentWord}" images...
          </Text>
        </>
      ) : (
        <>
          <Text
            style={{
              color: "#666",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            No images found for "{currentWord}"{"\n"}Try searching for a
            different word
          </Text>
          <TouchableOpacity
            onPress={onBackPress}
            style={{
              backgroundColor: "#323335",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14 }}>
              Back to {currentWord}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
