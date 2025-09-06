import React from "react";
import { TouchableOpacity, Image, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { type GalleryImageResult } from "../../apis/getGalleryImages";

interface ImageItemProps {
  item: GalleryImageResult;
  index: number;
  onPress: (imageUri: string) => void;
}

export default function ImageItem({ item, index, onPress }: ImageItemProps) {
  const { width } = Dimensions.get("window");

  // Single gap variable for all spacing
  const GAP = 8;

  const itemWidth = (width - GAP * 6) / 2;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(300)}
      style={{
        width: itemWidth,
        margin: GAP, // Applies GAP to all four sides (top, right, bottom, left)
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(item.link)}
        style={{
          backgroundColor: "#1b1c1f",
          borderRadius: 10,
          overflow: "hidden",
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.link }}
          style={{
            width: "100%",
            height: 179,
          }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
