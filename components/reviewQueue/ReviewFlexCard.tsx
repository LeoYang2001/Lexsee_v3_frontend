import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Word } from "../../types/common/Word";
import PhoneticAudio from "../common/PhoneticAudio";
import { ImageUp } from "lucide-react-native";
import ImageZoomModal from "../common/ImageZoomModal";
// Add Reanimated imports
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface ReviewFlexCardProps {
  word: Word;
  familiarityLevel: string;
  onHintPressed?: () => void;
  hintCount?: number;
}

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;

const ReviewFlexCard = ({
  word,
  familiarityLevel,
  onHintPressed,
  hintCount = 0,
}: ReviewFlexCardProps) => {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [contentHeight, setContentHeight] = useState(200);

  // Refs for measuring content
  const excellentRef = useRef<View>(null);
  const goodRef = useRef<View>(null);
  const fairRef = useRef<View>(null);
  const poorRef = useRef<View>(null);

  // Animated values
  const cardHeight = useSharedValue(200);
  const contentOpacity = useSharedValue(1);

  // Measure content height for each familiarity level
  const measureContent = (level: string) => {
    const getRef = () => {
      switch (level) {
        case "excellent":
          return excellentRef;
        case "good":
          return goodRef;
        case "fair":
          return fairRef;
        case "poor":
          return poorRef;
        default:
          return excellentRef;
      }
    };

    const ref = getRef();
    if (ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        const measuredHeight = height + 24; // Add padding
        setContentHeight(measuredHeight);

        // Animate to measured height
        cardHeight.value = withTiming(measuredHeight, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
      });
    }
  };

  // Animate when familiarity level changes
  useEffect(() => {
    // Brief fade out
    contentOpacity.value = withTiming(0.3, {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    });

    // Measure content after a short delay (to allow render)
    const timer = setTimeout(() => {
      measureContent(familiarityLevel);

      // Fade back in
      contentOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [familiarityLevel]);

  // Initial measurement
  useEffect(() => {
    const timer = setTimeout(() => {
      measureContent(familiarityLevel);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
      borderRadius: BORDER_RADIUS * 2,
      backgroundColor: "#2b2c2d",
      overflow: "hidden",
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  const handleImagePress = () => {
    if (word?.imgUrl) {
      setIsImageZoomed(true);
    }
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomed(false);
  };

  // Get familiarity level color
  const getFamiliarityColor = (level: string): string => {
    switch (level) {
      case "excellent":
        return "#10B981"; // Green
      case "good":
        return "#3B82F6"; // Blue
      case "fair":
        return "#F59E0B"; // Yellow
      case "poor":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  // Content components for measurement
  const ExcellentContent = () => (
    <View
      ref={excellentRef}
      onLayout={() => measureContent("excellent")}
      className="flex-col pt-6 pb-6 items-center"
    >
      <Text style={{ fontSize: 14 }} className="color-white opacity-30">
        Remember the word?
      </Text>
      <View className="mt-6">
        <PhoneticAudio size={32} phonetics={word.phonetics} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {word?.meanings.map((meaning, index) => (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#3c3d3e",
            }}
            className="px-3 py-1"
            key={index}
          >
            <Text style={{ fontSize: 12 }} className="text-white opacity-70">
              {meaning.partOfSpeech}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const GoodContent = () => (
    <View
      ref={goodRef}
      onLayout={() => measureContent("good")}
      className="flex-col pt-6 pb-8 items-center"
    >
      <Text style={{ fontSize: 14 }} className="color-white opacity-30">
        Remember the word?
      </Text>
      <View className="mt-6">
        <PhoneticAudio size={32} phonetics={word.phonetics} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {word?.meanings.map((meaning, index) => (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#3c3d3e",
            }}
            className="px-3 py-1"
            key={index}
          >
            <Text style={{ fontSize: 12 }} className="text-white opacity-70">
              {meaning.partOfSpeech}
            </Text>
          </View>
        ))}
      </View>
      {word?.imgUrl && (
        <View className="w-full mt-4">
          <TouchableOpacity
            onPress={handleImagePress}
            activeOpacity={0.8}
            className="relative"
          >
            <ImageBackground
              source={{ uri: word.imgUrl }}
              style={{
                height: 120,
                borderRadius: 10,
                overflow: "hidden",
              }}
              className="w-full flex justify-center items-center"
              resizeMode="cover"
            >
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 10,
                    opacity: 0.9,
                  }}
                >
                  Tap to zoom
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const FairContent = () => (
    <View
      ref={fairRef}
      onLayout={() => measureContent("fair")}
      className="flex-col pt-6 pb-8 items-center"
    >
      <Text style={{ fontSize: 14 }} className="color-white opacity-30">
        Remember the word?
      </Text>
      <View className="mt-6">
        <PhoneticAudio size={32} phonetics={word.phonetics} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {word?.meanings.map((meaning, index) => (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#3c3d3e",
            }}
            className="px-3 py-1"
            key={index}
          >
            <Text style={{ fontSize: 12 }} className="text-white opacity-70">
              {meaning.partOfSpeech}
            </Text>
          </View>
        ))}
      </View>
      {word?.imgUrl && (
        <View className="w-full mt-4">
          <TouchableOpacity onPress={handleImagePress} activeOpacity={0.8}>
            <ImageBackground
              source={{ uri: word.imgUrl }}
              style={{
                height: 100,
                borderRadius: 10,
                overflow: "hidden",
              }}
              className="w-full flex justify-center items-center"
              resizeMode="cover"
            >
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 10,
                    opacity: 0.9,
                  }}
                >
                  Tap to zoom
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}
      <View className="mt-4 px-2 w-full">
        {word?.meanings.slice(0, 2).map((meaning, index) => (
          <View key={index} className="mb-3 flex flex-col">
            <Text
              style={{ fontSize: 14 }}
              className="text-white opacity-70 font-semibold mb-1"
            >
              {meaning.partOfSpeech}
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
              }}
              className="text-white opacity-90"
            >
              {meaning.definition}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const PoorContent = () => (
    <View
      ref={poorRef}
      onLayout={() => measureContent("poor")}
      className="flex-col pt-6 pb-8 items-center"
    >
      <Text style={{ fontSize: 14 }} className="color-white opacity-30">
        Remember the word?
      </Text>
      <View className="mt-6">
        <PhoneticAudio size={32} phonetics={word.phonetics} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {word?.meanings.map((meaning, index) => (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#3c3d3e",
            }}
            className="px-3 py-1"
            key={index}
          >
            <Text style={{ fontSize: 12 }} className="text-white opacity-70">
              {meaning.partOfSpeech}
            </Text>
          </View>
        ))}
      </View>
      {word?.imgUrl && (
        <View className="w-full mt-4">
          <TouchableOpacity onPress={handleImagePress} activeOpacity={0.8}>
            <ImageBackground
              source={{ uri: word.imgUrl }}
              style={{
                height: 100,
                borderRadius: 10,
                overflow: "hidden",
              }}
              className="w-full flex justify-center items-center"
              resizeMode="cover"
            >
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 10,
                    opacity: 0.9,
                  }}
                >
                  Tap to zoom
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}
      <View className="mt-4 px-2 w-full">
        {word?.meanings.map((meaning, index) => (
          <View key={index} className="mb-3 flex flex-col">
            <Text
              style={{ fontSize: 14 }}
              className="text-white opacity-70 font-semibold mb-1"
            >
              {meaning.partOfSpeech}
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
              }}
              className="text-white opacity-90"
            >
              {meaning.definition}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <ImageZoomModal
        visible={isImageZoomed}
        imageUri={word?.imgUrl || ""}
        onClose={handleCloseImageZoom}
        showCloseHint={true}
        backgroundColor="rgba(0, 0, 0, 0.95)"
        overlayOpacity={0.9}
      />

      {/* Animated Container */}
      <Animated.View
        style={[animatedCardStyle]}
        className="p-3 relative flex w-full flex-col"
      >
        {/* Familiarity Level Indicator */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: getFamiliarityColor(familiarityLevel),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: "white",
              textTransform: "capitalize",
            }}
          >
            {familiarityLevel}
            {hintCount > 0 && ` (${hintCount})`}
          </Text>
        </View>

        {/* Animated Content */}
        <Animated.View style={[animatedContentStyle, { flex: 1 }]}>
          {familiarityLevel === "excellent" && <ExcellentContent />}
          {familiarityLevel === "good" && <GoodContent />}
          {familiarityLevel === "fair" && <FairContent />}
          {familiarityLevel === "poor" && <PoorContent />}
        </Animated.View>
      </Animated.View>
    </>
  );
};

export default ReviewFlexCard;
