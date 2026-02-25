import React from "react";
import { TouchableOpacity, Image, Dimensions, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { type GalleryImageResult } from "../../apis/getGalleryImages";

interface ImageItemProps {
  item: GalleryImageResult;
  index: number;
  onPress: (item: any) => void;
}

export default function ImageItem({ item, index, onPress }: ImageItemProps) {
  const { width } = Dimensions.get("window");

  // Single gap variable for all spacing
  const GAP = 8;
  const itemWidth = (width - GAP * 6) / 2;

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    // Quick feedback animation
    scale.value = withSpring(1.05, { damping: 20, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });

    // Call the parent handler
    runOnJS(onPress)(item);
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(300)}
      style={[
        {
          width: itemWidth,
          margin: GAP,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          backgroundColor: "#1F2937",
          borderRadius: 10,
          overflow: "hidden",
          borderWidth:
            item.sourceType === "internal" && item.contributorId
              ? 2
              : item.userSelected
                ? 2
                : 0,
          borderColor:
            item.sourceType === "internal" && item.contributorId
              ? "#F59E0B"
              : item.userSelected
                ? "#E44C21"
                : "transparent",
        }}
        activeOpacity={1} // We handle opacity manually
      >
        <Image
          source={{ uri: item.url }}
          style={{
            width: "100%",
            height: 179,
          }}
          resizeMode="cover"
        />
        {item.sourceType === "internal" && item.contributorId ? (
          <View
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              maxWidth: "85%",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              by {item.contributorName || item.userName || "contributor"}
            </Text>
          </View>
        ) : null}
        {item.userSelected && item.voter_ids && item.voter_ids.length > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(228, 76, 33, 0.9)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {item.voter_ids?.length}{" "}
              {item.voter_ids?.length === 1 ? "vote" : "votes"}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}
