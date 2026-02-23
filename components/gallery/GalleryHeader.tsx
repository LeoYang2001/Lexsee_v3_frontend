import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, AlertCircle } from "lucide-react-native";

interface GalleryHeaderProps {
  currentWord: string;
  imageCount: number;
  hasMoreImages: boolean;
  isLoading: boolean;
  onBackPress: () => void;
  onUploadPress: () => void;
  borderRadius: number;
}

export default function GalleryHeader({
  currentWord,
  onBackPress,
  onUploadPress,
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
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity onPress={onBackPress}>
          <ChevronLeft color="#ffffff" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onUploadPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(228, 76, 33, 0.15)",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(228, 76, 33, 0.3)",
          }}
          activeOpacity={0.7}
        >
          <AlertCircle color="#E44C21" size={18} />
          <Text
            style={{
              color: "#E44C21",
              fontSize: 14,
              fontWeight: "600",
              marginLeft: 6,
            }}
          >
            No good image?
          </Text>
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
