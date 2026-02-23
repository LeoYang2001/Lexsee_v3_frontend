import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface GalleryHeaderProps {
  currentWord: string;
  imageCount: number;
  hasMoreImages: boolean;
  isLoading: boolean;
  onBackPress: () => void;
  borderRadius: number;
}

export default function GalleryHeader({
  currentWord,
  imageCount,
  hasMoreImages,
  isLoading,
  onBackPress,
  borderRadius,
}: GalleryHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: "#191D24",
        paddingTop: 60,
        paddingBottom: 0,
        paddingHorizontal: 20,
      }}
    >
      {/* Back Button Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity onPress={onBackPress}>
          <ChevronLeft color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Header Content Below Back Button */}
      <View>
        {currentWord ? (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 28,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {currentWord}
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              Choose an image to help you remember this word.{"\n"}
              Images with votes are recommended by other users.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 28,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Gallery
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              Browse images to find visual representations
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
