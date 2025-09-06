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
import { Bookmark, ChevronLeft, Phone, Images } from "lucide-react-native"; // Added Images icon
import { useAppSelector } from "../../store/hooks";
import { Phonetics, Word } from "../../types/common/Word";
import PhoneticAudio from "../../components/common/PhoneticAudio";
import ImageZoomModal from "../../components/common/ImageZoomModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { fetchDefinition } from "../../apis/fetchDefinition";
import { fetchAudioUrl } from "../../apis/fetchPhonetics";

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

// Add this skeleton component at the top of your file
function SkeletonBox({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#323335",
          borderRadius: 4,
          opacity: 0.6,
        },
        style,
      ]}
    />
  );
}

export default function DefinitionPage() {
  const theme = useTheme();
  const params = useLocalSearchParams();

  const { words, isLoading, isSynced, error } = useAppSelector(
    (state) => state.wordsList
  );

  const [wordInfo, setWordInfo] = useState<Word | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState("saving");
  const [viewMode, setViewMode] = useState("definition");
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  // Add state for image zoom modal
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const [phonetics, setPhonetics] = useState<Phonetics | undefined>(undefined);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [definitionSource, setDefinitionSource] = useState<
    "dictionary" | "ai" | null
  >(null);

  useEffect(() => {
    const getDefinition = async () => {
      setIsLoadingDefinition(true);
      setIsUsingAI(false);
      setDefinitionSource(null);

      const searchWord = params.word as string;

      if (!searchWord) {
        setIsLoadingDefinition(false);
        return alert("No word provided");
      }

      // First, try to find the word in existing words list
      const existingWord = words.find((word) => word.word === searchWord);

      if (existingWord) {
        setWordInfo(existingWord);
        setSaveStatus("saved");
        setDefinitionSource("dictionary"); // Assuming stored words came from dictionary
        setIsLoadingDefinition(false);
      } else {
        // Define callbacks for fetchDefinition
        const callbacks = {
          onAIStart: () => {
            console.log("🤖 AI generation started");
            setIsUsingAI(true);
          },
          onAIEnd: () => {
            console.log("🤖 AI generation ended");
            setIsUsingAI(false);
          },
          onSourceChange: (source: "dictionary" | "ai") => {
            console.log("📍 Source changed to:", source);
            setDefinitionSource(source);
          },
        };

        // Call fetchDefinition with callbacks
        const fetchedWord = await fetchDefinition(searchWord, callbacks);

        if (fetchedWord) {
          setWordInfo(fetchedWord);
          setSaveStatus("unsaved");
        } else {
          alert("Failed to fetch definition for the word: " + searchWord);
        }

        setIsLoadingDefinition(false);
      }
    };

    getDefinition();
  }, [params.word, words]);

  useEffect(() => {
    const fetchPhonectics = async () => {
      if (wordInfo) {
        // If audio is missing, fetch it
        if (!wordInfo.phonetics.audioUrl) {
          const audioUrl = await fetchAudioUrl(wordInfo.word);
          // Use the phonetics object from wordInfo to preserve required properties (like text)
          setPhonetics({ ...wordInfo.phonetics, audioUrl });
          console.log(`get audioUrl for word ${wordInfo.word}: `, audioUrl);
        } else {
          // Ensure phonetics state reflects wordInfo if already present
          setPhonetics(wordInfo.phonetics);
        }
      }
    };

    // call the async function
    fetchPhonectics();
  }, [wordInfo]);

  // AI Status Component
  const AIStatusIndicator = () => {
    if (definitionSource === "ai") {
      return (
        <View
          style={{
            backgroundColor: "rgba(228, 72, 20, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(228, 72, 20, 0.3)",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              backgroundColor: "#E44814",
              borderRadius: 3,
              marginRight: 8,
            }}
          />
          <Text style={{ color: "#E44814", fontSize: 12, opacity: 0.9 }}>
            Definition generated by AI
          </Text>
        </View>
      );
    }
    return null;
  };

  // Loading State with AI Indicator
  const LoadingStateIndicator = () => {
    if (isLoadingDefinition) {
      return (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <ActivityIndicator size="small" color="#E44814" />
          <Text
            style={{ color: "#fff", opacity: 0.8, marginTop: 8, fontSize: 14 }}
          >
            {isUsingAI ? "Generating with AI..." : "Fetching definition..."}
          </Text>
          {isUsingAI && (
            <Text
              style={{
                color: "#E44814",
                opacity: 0.7,
                marginTop: 4,
                fontSize: 12,
              }}
            >
              Dictionary unavailable, using AI fallback
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  const definitionSectionHeight = Dimensions.get("window").height * 0.7;
  // Animated values
  const definitionHeight = useSharedValue(definitionSectionHeight);
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
        definitionSectionHeight - 230 - 18,
        {
          damping: 15,
          stiffness: 120,
          mass: 0.8,
        }
      );
    } else {
      definitionHeight.value = withSpring(definitionSectionHeight, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });
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

  // Function to handle image zoom
  const handleImagePress = () => {
    if (wordInfo?.imgUrl) {
      setIsImageZoomed(true);
    }
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomed(false);
  };

  // Function to navigate to gallery with current word
  const navigateToGallery = () => {
    router.push({
      pathname: "/(gallery)",
      params: {
        word: wordInfo?.word || (params.word as string),
      },
    });
  };

  return (
    <View
      style={{
        backgroundColor: theme.background,
      }}
      className=" flex w-full  h-full flex-col justify-start "
    >
      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={isImageZoomed}
        imageUri={wordInfo?.imgUrl || ""}
        onClose={handleCloseImageZoom}
        showCloseHint={true}
        backgroundColor="rgba(0, 0, 0, 0.95)"
        overlayOpacity={0.9}
      />

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
        className=" px-3  overflow-hidden"
      >
        <View className=" mt-16 w-full  justify-between flex-row items-center  ">
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
          >
            <ChevronLeft color={"#fff"} />
          </TouchableOpacity>

          {/* Header buttons container */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Gallery Button - Updated with word parameter */}
            <TouchableOpacity
              onPress={navigateToGallery}
              style={{
                backgroundColor: "#323335",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Images size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12 }}>Gallery</Text>
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
        </View>

        <View className="mt-3 px-2 flex-1   flex flex-col">
          <View className=" flex flex-row justify-between items-center">
            <View className=" flex flex-col gap-1">
              {/* Word Title - Skeleton or Real */}
              {isLoadingDefinition ? (
                <SkeletonBox width={200} height={36} />
              ) : (
                <Text
                  style={{
                    fontSize: 30,
                  }}
                  className=" text-white "
                >
                  {wordInfo?.word}
                </Text>
              )}

              {/* Phonetics - Skeleton or Real */}
              {isLoadingDefinition || !phonetics ? (
                <SkeletonBox width={150} height={24} style={{ marginTop: 4 }} />
              ) : (
                phonetics && <PhoneticAudio size={20} phonetics={phonetics} />
              )}
            </View>
            <TouchableOpacity
              disabled={saveStatus === "saving"}
              onPress={handleUpdateWordStatus}
            >
              <CollectBtn saveStatus={saveStatus} />
            </TouchableOpacity>
          </View>

          <AIStatusIndicator />
          <LoadingStateIndicator />

          {/* Part of Speech Tags - Skeleton or Real */}
          <View className=" mt-4 flex flex-row gap-3">
            {isLoadingDefinition ? (
              // Skeleton tags
              <>
                <SkeletonBox
                  width={50}
                  height={28}
                  style={{ borderRadius: 2 }}
                />
                <SkeletonBox
                  width={70}
                  height={28}
                  style={{ borderRadius: 2 }}
                />
              </>
            ) : (
              wordInfo?.meanings.map((meaning, index) => (
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
              ))
            )}
          </View>

          {viewMode === "definition" && (
            <View className=" w-full flex-1  flex flex-col">
              {wordInfo?.imgUrl && (
                <TouchableOpacity
                  onPress={handleImagePress}
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={{ uri: wordInfo.imgUrl }}
                    style={{
                      height: 145,
                      borderRadius: 10,
                      overflow: "hidden",
                      position: "relative",
                    }}
                    className=" w-full mt-4 flex justify-center items-center"
                    resizeMode="cover"
                  >
                    {/* Zoom hint overlay */}
                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 12,
                          opacity: 0.9,
                        }}
                      >
                        Tap to zoom
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}

              <ScrollView className=" w-full py-4 flex-1">
                <View className=" text-white  opacity-70">
                  {isLoadingDefinition ? (
                    // Skeleton definitions
                    <>
                      <View className=" mb-4 flex flex-col gap-2">
                        <SkeletonBox width={80} height={20} />
                        <SkeletonBox width="100%" height={16} />
                        <SkeletonBox width="90%" height={16} />
                        <SkeletonBox width="95%" height={16} />
                      </View>
                    </>
                  ) : (
                    wordInfo?.meanings.map((meaning, index) => (
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
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
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
