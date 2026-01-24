import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import PhoneticAudio from "../common/PhoneticAudio";
import ImageZoomModal from "../common/ImageZoomModal";
// Add Reanimated imports
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ConversationResponse } from "../../apis/AIFeatures";



interface ReviewFlexCardProps {
  word: any;
  familiarityLevel: string;
  onHintPressed?: () => void;
  hintCount?: number;
  isLoading?: boolean;
  conversationData: ConversationResponse | null;
}

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;


const AnimatedLoadingMessages = () => {
  const messages = [
    "No sample sentences found",
    "Currently generating for you",
    "This might take a while...",
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messageOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    messageOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });

    const timer = setTimeout(() => {
      // Fade out
      messageOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });

      // Change message after fade out
      const changeTimer = setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        messageOpacity.value = 0; // Reset opacity for next message
      }, 500);

      return () => clearTimeout(changeTimer);
    }, 1500); // Show each message for 2.5 seconds

    return () => clearTimeout(timer);
  }, [currentMessageIndex, messageOpacity]);

  const animatedMessageStyle = useAnimatedStyle(() => {
    return {
      opacity: messageOpacity.value,
    };
  });

  return (
    <Animated.Text
      style={[
        animatedMessageStyle,
        {
          fontSize: 15,
          color: "#60a5fa",
          opacity: 0.8,
          fontWeight: "500",
        },
      ]}
    >
      {messages[currentMessageIndex]}
    </Animated.Text>
  );
};

const FairContentLoadingSkeleton = ({ height = 400 }: { height?: number }) => (
  <View style={{ height: height }} className="flex-col pt-6 pb-8 items-center">
    {/* Header text */}
    <View className="w-48 h-4 bg-gray-700 rounded-lg mb-4 opacity-50" />

    {/* Word title skeleton */}
    <View className="w-40 h-10 bg-gray-700 rounded-lg mb-4 opacity-50 mt-2" />

    {/* Part of speech tags */}
    <View className="flex-row gap-2 mb-4">
      <View className="w-16 h-6 bg-gray-700 rounded-lg opacity-50" />
      <View className="w-20 h-6 bg-gray-700 rounded-lg opacity-50" />
    </View>

    {/* Image skeleton */}
    <View className="w-full mt-4 px-4">
      <View className="w-full h-16 bg-gray-700 rounded-lg opacity-50" />
    </View>

    {/* Examples loading section with improved messaging */}
    <View className="w-full px-4 mt-8">
      {/* Animated loading indicator */}
      <View className="flex-row items-center gap-2 mb-3">
        <View
          className="w-2 h-2 bg-blue-400 rounded-full"
          style={{
            opacity: 0.8,
          }}
        />
        {/* <Text
          style={{
            fontSize: 15,
            color: "#60a5fa",
            opacity: 0.8,
            fontWeight: "500",
          }}
        >
          Generating example sentences...
        </Text> */}
        <AnimatedLoadingMessages />
      </View>

      {/* Subtle info message */}
      <Text
        style={{
          fontSize: 13,
          color: "#9ca3af",
          opacity: 0.6,
          marginBottom: 12,
          fontStyle: "italic",
          lineHeight: 14,
        }}
      >
        We're creating contextual examples to help you learn this word better.
        This may take a moment.
      </Text>

      {/* Animated example message skeletons */}
      <View className="gap-4">
        {/* First message skeleton */}
        <View className="gap-1.5">
          <View
            className="w-20 h-3 bg-gray-700 rounded opacity-50"
            style={{ marginBottom: 4 }}
          />
          <View className="flex-col gap-1.5">
            <View className="w-full h-10 bg-gray-700 rounded-lg opacity-50" />
            <View className="w-5/6 h-10 bg-gray-700 rounded-lg opacity-50" />
          </View>
        </View>
      </View>
    </View>
  </View>
);

const LoadingSkeleton = ({ height = 200 }: { height?: number }) => (
  <View
    className="flex-col pt-6 pb-8 items-center"
    style={{ minHeight: height }}
  >
    {/* Pulse animation for loading */}
    <View className="w-24 h-8 bg-gray-700 rounded-lg mb-6 opacity-50" />
    <View className="w-32 h-12 bg-gray-700 rounded-lg mb-4 opacity-50" />
    <View className="flex-row gap-2 mb-4">
      <View className="w-16 h-6 bg-gray-700 rounded-lg opacity-50" />
      <View className="w-16 h-6 bg-gray-700 rounded-lg opacity-50" />
    </View>
    <View className="w-full px-4 mt-4">
      <View className="w-full h-32 bg-gray-700 rounded-lg opacity-50" />
    </View>
  </View>
);

const ReviewFlexCard = ({
  word,
  familiarityLevel,
  isLoading = false,
  conversationData,
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

  // Content components for measurement
  const ExcellentContent = ({ isLoading }: { isLoading: boolean }) => {
    if (isLoading) {
      return <LoadingSkeleton height={contentHeight} />;
    } else
      return (
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
            {word?.meanings.map((meaning: any, index: number) => (
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: "#3c3d3e",
                }}
                className="px-3 py-1"
                key={index}
              >
                <Text
                  style={{ fontSize: 12 }}
                  className="text-white opacity-70"
                >
                  {meaning.partOfSpeech}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
  };

  const GoodContent = ({ isLoading }: { isLoading: boolean }) => {
    if (isLoading) {
      return <LoadingSkeleton height={contentHeight} />;
    } else
      return (
        <View
          ref={goodRef}
          onLayout={() => measureContent("good")}
          className="flex-col pt-6 pb-8 items-center"
        >
          <Text style={{ fontSize: 14 }} className="color-white opacity-30">
            Remember the word?
          </Text>
          <Text className=" my-6" style={{ fontSize: 32, color: "white" }}>
            {word.word}
          </Text>
          <View>
            <PhoneticAudio size={18} phonetics={word.phonetics} />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {word?.meanings.map((meaning: any, index: number) => (
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: "#3c3d3e",
                }}
                className="px-3 py-1"
                key={index}
              >
                <Text
                  style={{ fontSize: 12 }}
                  className="text-white opacity-70"
                >
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
                    height: 140,
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
  };

  const FairContent = ({ isLoading }: { isLoading: boolean }) => {
    // Show full skeleton if loading with conversation data
    if (isLoading && conversationData) {
      return <LoadingSkeleton height={contentHeight} />;
    }

    // Show partial skeleton if conversation is still loading
    if (isLoading && !conversationData) {
      return (
        <View
          ref={fairRef}
          onLayout={() => measureContent("fair")}
          className="flex-col pt-6 pb-8 items-center"
        >
          <FairContentLoadingSkeleton />
        </View>
      );
    }

    return (
      <View
        ref={fairRef}
        onLayout={() => measureContent("fair")}
        className="flex-col pt-6 pb-8 items-center"
      >
        <Text style={{ fontSize: 14 }} className="color-white opacity-30">
          Almost there! Can you recall its meaning?
        </Text>
        <View className=" flex-row items-center mt-2 gap-4">
          <Text className=" my-2" style={{ fontSize: 32, color: "white" }}>
            {word.word}
          </Text>
          {/* <PhoneticAudio size={18} phonetics={word.phonetics} /> */}
        </View>

        <View className="mt-0 flex-row flex-wrap gap-2">
          {word?.meanings.map((meaning: any, index: number) => (
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
                  height: 60,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
                className="w-full flex justify-center items-center"
                resizeMode="cover"
              >
                <View
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: `-50%` }, { translateY: `-50%` }],
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 18,
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
          {/* Render example sentences from conversationData */}
          {conversationData?.conversation && (
            <View>
              {(() => {
                try {
                  return (
                    <View className="flex flex-col gap-3">
                      {conversationData.conversation.map(
                        (item: any, index: number) => (
                          <View key={index} className="flex-col gap-1">
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "500",
                                color: "white",
                                opacity: 0.6,
                              }}
                            >
                              {item.speaker}:
                            </Text>
                            {(() => {
                              // Split message and find the target word
                              const targetWord = word.word.toLowerCase();
                              const messageText = item.message;
                              const regex = new RegExp(
                                `\\b(${targetWord})\\b`,
                                "gi"
                              );
                              const parts = messageText.split(regex);

                              return (
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: "white",
                                    opacity: 0.9,
                                    lineHeight: 16,
                                  }}
                                >
                                  "
                                  {parts.map((part: string, idx: number) =>
                                    part?.toLowerCase() === targetWord ? (
                                      <Text
                                        key={idx}
                                        style={{
                                          backgroundColor: "#56362d",
                                          color: "#ea511d",
                                          fontWeight: "700",
                                          paddingHorizontal: 2,
                                          borderRadius: 2,
                                        }}
                                      >
                                        {part}
                                      </Text>
                                    ) : (
                                      <Text key={idx}>{part}</Text>
                                    )
                                  )}
                                  "
                                </Text>
                              );
                            })()}
                          </View>
                        )
                      )}
                    </View>
                  );
                } catch (error) {
                  return (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#ef4444",
                        opacity: 0.6,
                      }}
                    >
                      Could not parse examples
                    </Text>
                  );
                }
              })()}
            </View>
          )}
        </View>
      </View>
    );
  };

  const PoorContent = ({ isLoading }: { isLoading: boolean }) => {
    if (isLoading) {
      return <LoadingSkeleton height={contentHeight} />;
    } else
      return (
        <View
          ref={poorRef}
          onLayout={() => measureContent("poor")}
          className="flex-col pt-6 pb-8 items-center"
        >
          <Text style={{ fontSize: 14 }} className="color-white opacity-30">
            Don't worry! Let's relearn this word!
          </Text>
          <Text className=" my-6" style={{ fontSize: 32, color: "white" }}>
            {word.word}
          </Text>
          <View>
            <PhoneticAudio size={18} phonetics={word.phonetics} />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {word?.meanings.map((meaning: any, index: number) => (
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: "#3c3d3e",
                }}
                className="px-3 py-1"
                key={index}
              >
                <Text
                  style={{ fontSize: 12 }}
                  className="text-white opacity-70"
                >
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
                    height: 140,
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
            {word?.meanings.map((meaning: any, index: number  ) => (
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
  };

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
        {/* Animated Content */}
        <Animated.View style={[animatedContentStyle, { flex: 1 }]}>
          {familiarityLevel === "excellent" && (
            <ExcellentContent isLoading={isLoading} />
          )}
          {familiarityLevel === "good" && <GoodContent isLoading={isLoading} />}
          {familiarityLevel === "fair" && <FairContent isLoading={isLoading} />}
          {familiarityLevel === "poor" && <PoorContent isLoading={isLoading} />}
        </Animated.View>
      </Animated.View>
    </>
  );
};

export default ReviewFlexCard;
