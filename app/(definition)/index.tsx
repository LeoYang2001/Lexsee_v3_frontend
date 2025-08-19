import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  ScrollView,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Bookmark, ChevronLeft, Phone } from "lucide-react-native";
import { useAppSelector } from "../../store/hooks";
import { Word } from "../../types/common/Word";
import PhoneticAudio from "../../components/common/PhoneticAudio";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

function CollectBtn({ saveStatus }: { saveStatus: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  const getBtnStyle = () => {
    switch (saveStatus) {
      case "unsaved":
        return {
          backgroundColor: "#39404e",
          bookMarkColor: "#66686b",
          borderColor: "#39404e",
          colorValue: 0,
        };
      case "saving":
        return {
          backgroundColor: "#3c444c",
          bookMarkColor: "#ffffff",
          borderColor: "#3c444c",
          colorValue: 0.5,
        };
      case "saved":
        return {
          backgroundColor: "#31221f",
          bookMarkColor: "#ce4319",
          borderColor: "#31221f",
          colorValue: 1,
        };
      default:
        return {
          backgroundColor: "#39404e",
          bookMarkColor: "#66686b",
          borderColor: "#39404e",
          colorValue: 0,
        };
    }
  };

  const style = getBtnStyle();

  useEffect(() => {
    // Animate background color
    colorProgress.value = withTiming(style.colorValue, { duration: 300 });

    if (saveStatus === "saving") {
      // Scale down bookmark before showing loading
      scale.value = withSpring(0.2, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    } else {
      // Show bookmark with spring animation
      setTimeout(
        () => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
          opacity.value = withTiming(1, { duration: 150 });
        },
        saveStatus === "saving" ? 0 : 150
      );
    }
  }, [saveStatus]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ["#39404e", "#3c444c", "#31221f"]
    );

    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ["#39404e", "#3c444c", "#31221f"]
    );

    return {
      backgroundColor,
      borderColor,
      transform: [
        {
          scale:
            saveStatus === "saving"
              ? withSpring(1.05, { damping: 15 })
              : withSpring(1),
        },
      ],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedLoadingStyle = useAnimatedStyle(() => {
    return {
      opacity:
        saveStatus === "saving"
          ? withTiming(1, { duration: 200 })
          : withTiming(0, { duration: 150 }),
      transform: [
        {
          scale:
            saveStatus === "saving"
              ? withSpring(1, { damping: 15 })
              : withSpring(0.8),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: 48,
          height: 48,
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        animatedContainerStyle,
      ]}
    >
      {/* Loading Indicator */}
      <Animated.View
        style={[
          {
            position: "absolute",
          },
          animatedLoadingStyle,
        ]}
      >
        <ActivityIndicator size="small" color="#ffffff" />
      </Animated.View>

      {/* Bookmark Icon */}
      <Animated.View style={animatedIconStyle}>
        <Bookmark
          size={20}
          fill={style.bookMarkColor}
          color={style.bookMarkColor}
          strokeWidth={2}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function DefinitionPage() {
  const theme = useTheme();
  const params = useLocalSearchParams();

  const { words, isLoading, isSynced, error } = useAppSelector(
    (state) => state.wordsList
  );

  const matchedWord = words.find((word) => word.id === params.id);

  const [wordInfo, setWordInfo] = useState<Word | undefined>(matchedWord);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [viewMode, setViewMode] = useState("definition"); // definition view mode or conversation view mode

  // Animated values
  const definitionHeight = useSharedValue(
    Dimensions.get("window").height - 257
  );
  const conversationHeight = useSharedValue(0);

  const handleUpdateWordStatus = () => {
    console.log(
      "handleUpdateWordStatus called, current saveStatus:",
      saveStatus
    );
    if (saveStatus === "unsaved") {
      setSaveStatus("saving");
      // Simulate saving process
      setTimeout(() => {
        setSaveStatus("saved");
      }, 1000);
    } else if (saveStatus === "saved") {
      setSaveStatus("saving");
      // Simulate saving process
      setTimeout(() => {
        setSaveStatus("unsaved");
      }, 1000);
    }
  };

  // Toggle view mode function
  const toggleViewMode = () => {
    setViewMode((prev) =>
      prev === "definition" ? "conversation" : "definition"
    );
  };

  // Animate heights based on view mode
  useEffect(() => {
    if (viewMode === "conversation") {
      definitionHeight.value = withSpring(230, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });
      conversationHeight.value = withSpring(
        Dimensions.get("window").height - 257 - 230 - 18,
        {
          damping: 15,
          stiffness: 120,
          mass: 0.8,
        }
      );
    } else {
      definitionHeight.value = withSpring(
        Dimensions.get("window").height - 257,
        {
          damping: 15,
          stiffness: 120,
          mass: 0.8,
        }
      );
      conversationHeight.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });
    }
  }, [viewMode]);

  // Animated styles
  const animatedDefinitionStyle = useAnimatedStyle(() => {
    return {
      height: definitionHeight.value,
    };
  });

  const animatedConversationStyle = useAnimatedStyle(() => {
    return {
      height: conversationHeight.value,
      opacity:
        viewMode === "conversation"
          ? withTiming(1, { duration: 400 })
          : withTiming(0, { duration: 200 }),
    };
  });

  const { width, height } = Dimensions.get("window");
  const BORDER_RADIUS = Math.min(width, height) * 0.06;

  return (
    <View
      style={{
        backgroundColor: theme.background,
      }}
      className=" flex w-full  h-full flex-col justify-start "
    >
      {/* Definition View with Animated Height */}
      <Animated.View
        style={[
          {
            backgroundColor: "#1b1c1f",
            margin: 6,
            borderRadius: BORDER_RADIUS * 2,
          },
          animatedDefinitionStyle,
        ]}
        className=" px-3 "
      >
        <View className=" mt-16 w-full  justify-between flex-row items-center  ">
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
          >
            <ChevronLeft color={"#fff"} />
          </TouchableOpacity>

          {/* Toggle Button */}
          <TouchableOpacity
            onPress={toggleViewMode}
            style={{
              backgroundColor: "#323335",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {viewMode === "definition" ? "Conversation" : "Definition"}
            </Text>
          </TouchableOpacity>
        </View>

        {wordInfo && (
          <View className="mt-3 px-2 flex-1   flex flex-col">
            <View className=" flex flex-row justify-between items-center">
              <View className=" flex flex-col gap-1">
                <Text
                  style={{
                    fontSize: 30,
                  }}
                  className=" text-white "
                >
                  {wordInfo.word}
                </Text>
                <PhoneticAudio size={20} phonetics={wordInfo.phonetics} />
              </View>
              <TouchableOpacity
                disabled={saveStatus === "saving"}
                onPress={handleUpdateWordStatus}
              >
                <CollectBtn saveStatus={saveStatus} />
              </TouchableOpacity>
            </View>
            <View className=" mt-4 flex flex-row gap-3">
              {wordInfo.meanings.map((meaning, index) => (
                <View
                  style={{
                    borderRadius: 2,
                    backgroundColor: "#323335",
                  }}
                  className="p-1"
                  key={index}
                >
                  <Text
                    style={{
                      fontSize: 14,
                    }}
                    className="text-white opacity-70"
                  >
                    {meaning.partOfSpeech}
                  </Text>
                </View>
              ))}
            </View>
            {viewMode === "definition" && (
              <View className=" w-full flex-1  flex flex-col">
                <ImageBackground
                  source={require("../../assets/images/imagePreview.png")}
                  style={{
                    height: 145,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                  className=" w-full mt-4 flex justify-center items-center"
                  resizeMode="cover"
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#E44814",
                    }}
                    className=" p-2  px-4 rounded-full "
                  >
                    <Text className=" text-white font-semibold">
                      Select a Picture
                    </Text>
                  </TouchableOpacity>
                </ImageBackground>
                <ScrollView className=" w-full py-4 flex-1">
                  <View className=" text-white  opacity-70">
                    {wordInfo.meanings.map((meaning, index) => (
                      <View key={index} className=" mb-4 flex flex-col gap-2">
                        <Text
                          style={{
                            fontSize: 16,
                          }}
                          className="text-white opacity-70 font-bold"
                        >
                          {meaning.partOfSpeech}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                          }}
                          className="text-white opacity-90"
                        >
                          {meaning.definition}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Conversation View with Animated Height */}
      <View
        style={[
          {
            flex: 1,
            backgroundColor: "#1b1c1f",
            margin: 6,
            marginTop: 0,
            borderRadius: BORDER_RADIUS * 2,
          },
          animatedConversationStyle,
        ]}
        className=" px-3 py-4"
      >
        <Text style={{ color: "#fff", fontSize: 18, textAlign: "center" }}>
          Conversation Mode
        </Text>
        <Text
          style={{
            color: "#666",
            fontSize: 14,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          AI conversation content will appear here
        </Text>
      </View>
    </View>
  );
}
