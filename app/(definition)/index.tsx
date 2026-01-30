import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  ScrollView,
  Pressable,
  Image,
  LayoutChangeEvent,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  Bookmark,
  ChevronLeft,
  CircleAlert,
  ImageUp,
} from "lucide-react-native";
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
import { fetchDefinition, fetchQuickConversation, generatePhoneticText } from "../../apis/AIFeatures";
import type { ConversationResponse } from "../../apis/AIFeatures";
import { fetchAudioUrl } from "../../apis/fetchPhonetics";

import { client } from "../client";
import ConversationView from "../../components/definition/ConversationView";
import { handleScheduleNotification, uncollectWord } from "../../apis/setSchedule";
import { getLocalDate } from "../../util/utli";
import { useOnboarding } from "../../hooks/useOnboarding";

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
  const { words } = useAppSelector((state) => state.wordsList);
 const profile = useAppSelector((state) => state.profile.data);

 const reviewScheduleWords = useAppSelector((state) => state.reviewScheduleWords.items);
 const reviewSchedules = useAppSelector((state) => state.reviewSchedule.items);


  const [wordInfo, setWordInfo] = useState<Word | undefined>(undefined);

  const [saveStatus, setSaveStatus] = useState("saving");
  const [viewMode, setViewMode] = useState("definition");
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Separate phonetics state with persistence
  const [phonetics, setPhonetics] = useState<Phonetics | undefined>(undefined);
  const [isLoadingPhonetics, setIsLoadingPhonetics] = useState(false);
  const [phoneticsCached, setPhoneticsCached] = useState<{
    [key: string]: Phonetics;
  }>({});
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [definitionSource, setDefinitionSource] = useState<
    "dictionary" | "ai" | null
  >(null);

  // Conversation state
  const [conversationData, setConversationData] =
    useState<ConversationResponse | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isConversationLoaded, setIsConversationLoaded] = useState(false);
  const [showConversationView, setShowConversationView] = useState(false);
  const [playMessageAnimation, setPlayMessageAnimation] = useState(false); // New state for animation

  const userProfile = useAppSelector((state) => state.profile.data);


  const aiSettings = useAppSelector((state) => state.aiSettings);
  const activeModel = aiSettings.activeModel;

  //USER GUIDE 
   const { activeStep, setTargetLayout } = useOnboarding();
    const definitionRef = useRef<ScrollView>(null);
  
    const handleLayout = () => {
      // Only measure if the "Director" says we are in the 'DEFINITION_STEP_1' stage
      if (activeStep === 'DEFINITION_STEP_1') {
      (definitionRef.current as any)?.measureInWindow((x: number, y: number, width: number, height: number) => {
        setTargetLayout({ x, y, width, height });
      });
      }
    };
 


  const handleSaveWord = async (wordInfo: Word) => {
    // save/resave, we reset the schedule
    let wordInfoToSave = {
      ...wordInfo,
      phonetics: phonetics || undefined,
      exampleSentences: wordInfo.exampleSentences || null,
    };

    setSaveStatus("saving");
    try {
      //step1: check if the word exist
      const existingWord = words.find(
        (word) => word.word === wordInfoToSave.word
      );
      if (existingWord) {
        const updateData = {
          id: existingWord.id,
          data: JSON.stringify(wordInfoToSave),
        };
        // If exists, update it, use client function, do not directly update redux as its already listening the updates
        // The generated client may have empty model typings in some environments; cast to any to avoid the TS error.
        const res = await (client.models as any).Word.update(updateData);
        wordInfoToSave.id = res.data.id;
      } else {
        // If not exists, create new word entry
        const createData = {
          data: JSON.stringify({
            ...wordInfoToSave,
            timeStamp: getLocalDate(),
          }),
          wordsListId: profile?.wordsListId,
          status: "COLLECTED",
        };
        const res = await (client.models as any).Word.create(createData);
        wordInfoToSave.id = res.data.id;
      }
    } catch (error) {
      console.log(error);
    }
    // initiate sheduling only when theres no shceduleWord that exists for this word and still has TO_REVIEW status
    const existingScheduleWord = reviewScheduleWords.find(
      (sw) => sw.wordId === wordInfoToSave.id && sw.status === "TO_REVIEW"
    );
    
   if(!existingScheduleWord) {
    //initiate scheduling notification update
    const currentLocalDate = getLocalDate();
    // newNextDue should be the day after currentLocalDate
    const newNextDue = new Date(currentLocalDate);
    newNextDue.setDate(newNextDue.getDate() + wordInfoToSave.review_interval);
    if (userProfile) {
      const ifSuccess = await handleScheduleNotification(
        userProfile,
        wordInfoToSave.id,
        newNextDue
      );
      console.log("Handle schedule notification success:", ifSuccess);
    }
   }
    // 4. Force refresh to get accurate state
    setSaveStatus("saved");
  };

  // Function to fetch conversation
  //optionally receive two parameters: partOfSpeech and definition
  const fetchConversationExample = async (
    partOfSpeech?: string,
    definition?: string
  ) => {
    if (!wordInfo?.word) return;

    setViewMode("conversation");
    setIsLoadingConversation(true);
    setIsConversationLoaded(false);
    setShowConversationView(true); // Show the conversation view when starting to fetch
    setPlayMessageAnimation(true); // Enable animation for newly generated conversations
    let conversation = null;

    try {
      //set a timer to test how fast the conversation loads
      conversation = await fetchQuickConversation(
        wordInfo.word,
        partOfSpeech,
        definition,
        activeModel
      );

      if (conversation) {
        setConversationData(conversation);
        setIsConversationLoaded(true);
        console.log("✅ New conversation generated (with animation)");
      } else {
        setShowConversationView(false);
        setPlayMessageAnimation(false);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setShowConversationView(false);
      setPlayMessageAnimation(false);
    } finally {
      setIsLoadingConversation(false);
    }

    //this step should not block displaying loaded definition
    //save or update definition to the wordInfo

    if (wordInfo && saveStatus !== "saving") {
      console.log("saving convo");
      try {
        let wordInfoToSave = {
          ...wordInfo,
          exampleSentences: JSON.stringify(conversation),
        };
        await handleSaveWord(wordInfoToSave);
      } catch (error) {
        console.error("Error saving word:", error);
      }
    }
  };

  // Get current word consistently
  const currentWord = (params.word as string) || "";

  // FIXED: Handle gallery return with selected image - simplified dependencies
  useFocusEffect(
    React.useCallback(() => {
      const selectedImageUrl = params.selectedImageUrl;
      const fromGallery = params.fromGallery;

      // Only process if we have both gallery flag and image URL and current wordInfo
      if (fromGallery === "true" && selectedImageUrl && wordInfo) {
        // Update wordInfo with new image
        const imageUrl = Array.isArray(selectedImageUrl)
          ? selectedImageUrl[0]
          : selectedImageUrl;
        const updatedWordInfo = {
          ...wordInfo,
          imgUrl: imageUrl,
        };

        setWordInfo(updatedWordInfo);
        handleSaveWord(updatedWordInfo);

        // Clear the gallery params to prevent re-processing
        router.setParams({
          fromGallery: undefined,
          selectedImageUrl: undefined,
        });
      }
    }, [params.fromGallery, params.selectedImageUrl, wordInfo?.word]) // Only depend on word, not entire wordInfo object
  );

  useEffect(() => {
    const fetchPhonectics = async () => {
      if (wordInfo) {
        // If audio is missing, fetch it
        if (!wordInfo.phonetics?.audioUrl) {
          setIsLoadingPhonetics(true);
          const audioUrl = await fetchAudioUrl(wordInfo.word);
          let phoneticText;
          if(!wordInfo.phonetics?.text)
          {
             console.log('No phonetics! No phonetic text available for word:', wordInfo.word)
              phoneticText = await generatePhoneticText(wordInfo.word);
             console.log('Generated phonetic text:', phoneticText);
          }
          // Ensure text is always a string to satisfy Phonetics type (fallback to empty string)
          const existing = wordInfo.phonetics || { text: "" };
          const safePhonetics = {
            ...existing,
            text: existing.text || phoneticText || "",
            audioUrl,
          };
          console.log('Safe phonetics object:', JSON.stringify(safePhonetics));
          // Use the safe phonetics object
          setPhonetics(safePhonetics);
          setIsLoadingPhonetics(false);
        } else {
          // Ensure phonetics state reflects wordInfo if already present
          // also ensure text is a string
          const existing = wordInfo.phonetics;
          if (existing) {
            setPhonetics({ ...existing, text: existing.text ?? "" });
          } else {
            setPhonetics(undefined);
          }
        }
      }
    };

    // call the async function
    fetchPhonectics();
  }, [wordInfo]);

  // FIXED: Cache phonetics without causing re-renders
  useEffect(() => {
    if (phonetics && currentWord && !phoneticsCached[currentWord]) {
      setPhoneticsCached((prev) => ({
        ...prev,
        [currentWord]: phonetics,
      }));
    }
  }, [phonetics, currentWord]); // Removed phoneticsCached dependency

  // Add this state to track if we've already fetched the definition for this word
  const [fetchedWords, setFetchedWords] = useState<Set<string>>(new Set());

  // FIXED: Main definition fetching effect - prevent re-fetch on navigation back
  useEffect(() => {
    const getDefinition = async () => {
      const searchWord = params.word as string;

      if (!searchWord) {
        setIsLoadingDefinition(false);
        return alert("No word provided");
      }

      // Check if we've already fetched this word in this session
      if (fetchedWords.has(searchWord)) {
        return;
      }

      setIsLoadingDefinition(true);
      setIsUsingAI(false);
      setDefinitionSource(null);

      // First, try to find the word in existing words list
      const existingWord = words.find((word) => word.word === searchWord);

      if (existingWord) {
        setWordInfo(existingWord);
        setSaveStatus("saved");
        setDefinitionSource("dictionary");
        setIsLoadingDefinition(false);

        // Set phonetics from existing word
        if (existingWord.phonetics) {
          setPhonetics(existingWord.phonetics);
        }

        // Load existing conversation if available
        if (existingWord.exampleSentences) {
          try {
            // Parse the conversation data from JSON string
            const parsedConversation = JSON.parse(
              existingWord.exampleSentences as string
            );

            // If exampleSentences exist, do not play the animation again
            if (parsedConversation && parsedConversation.conversation) {
              setConversationData(parsedConversation);
              setIsConversationLoaded(true);
              setPlayMessageAnimation(false); // Don't play animation for existing conversations
            } else {
              console.warn(
                "⚠️ Invalid conversation format in exampleSentences"
              );
            }
          } catch (error) {
            console.error("❌ Error parsing existing conversation:", error);
            // Clear invalid conversation data
            setConversationData(null);
            setIsConversationLoaded(false);
            setPlayMessageAnimation(false);
          }
        } else {
          // No existing conversation
          setConversationData(null);
          setIsConversationLoaded(false);
          setPlayMessageAnimation(false);
        }

        // Mark as fetched
        setFetchedWords((prev) => new Set(prev).add(searchWord));
      } else {
        // Check cached phonetics for new words
        const cachedPhonetics = phoneticsCached[searchWord];
        if (cachedPhonetics) {
          setPhonetics(cachedPhonetics);
        }

        // Reset conversation state for new words
        setConversationData(null);
        setIsConversationLoaded(false);
        setShowConversationView(false);
        setPlayMessageAnimation(false); // Reset animation state for new words

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
        const fetchedWord = await fetchDefinition(
          searchWord,
          callbacks,
          activeModel
        );

        if (fetchedWord) {
          setWordInfo(fetchedWord);
          setSaveStatus("unsaved");

          // Only set phonetics if we don't have cached ones
          if (!cachedPhonetics && fetchedWord.phonetics) {
            setPhonetics(fetchedWord.phonetics);
          }

          // Mark as fetched
          setFetchedWords((prev) => new Set(prev).add(searchWord));
        } else {
          alert("Failed to fetch definition for the word: " + searchWord);
          router.back();
        }

        setIsLoadingDefinition(false);
      }
    };

    getDefinition();
  }, [params.word]); // Remove 'words' dependency to prevent re-fetch on Redux updates

  // FIXED: Separate effect to update save status when words list changes
  useEffect(() => {
    if (wordInfo) {
      const existingWord = words.find((word) => word.word === wordInfo.word);
      if (existingWord) {
        setSaveStatus("saved");
        // Update wordInfo with latest data from Redux if needed
        if (JSON.stringify(existingWord) !== JSON.stringify(wordInfo)) {
          setWordInfo(existingWord);
        }
      } else {
        setSaveStatus("unsaved");
      }
    }
  }, [words]); // Only update save status when words change

  // Clear fetched words cache when component unmounts
  useEffect(() => {
    return () => {
      setFetchedWords(new Set());
    };
  }, []);

  // AI Status Component
  const AIStatusIndicator = () => {
    if (definitionSource === "ai") {
      return (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 4,
          }}
        >
          <CircleAlert size={14} color={"#fff"} opacity={0.5} />

          <Text style={{ color: "#fff", fontSize: 12, opacity: 0.3 }}>
            AI-generated • For reference only
          </Text>
        </View>
      );
    }
    return null;
  };

  const definitionSectionHeight = Dimensions.get("window").height * 0.7;
  // Animated values
  const definitionHeight = useSharedValue(definitionSectionHeight);
  const conversationHeight = useSharedValue(0);

  const handleSaveOrUnsave = async () => {
    if (saveStatus === "saved") {
      if (wordInfo) {
        await handleUnsaveWord(wordInfo);
      }
    } else {
      if (wordInfo) {
        //navigate to gallery
        router.push({
          pathname: "/(gallery)",
          params: {
            word: wordInfo.word,
          },
        });
      }
    }
  };

  const handleUnsaveWord = async (wordInfo: Word) => {
        // - [ ] UNCOLLECT A WORD
        // 1. Get the review entity to get the review schedule based on date 
        //     1. First,  get the id of entity based on word id 
        //     2. Second, get the entity id to get schedule id 
        // 2. If there’s only one entity
        //     1. Cancel notification
        //     2. Delete entity & schedule
        // 3. If its not the only one
        //     1. Delete entity
        //     2. Update notification
        // 4. Delete the word 
        //     1. Remove from wordlist 
        //     2. Delete the word 

    setSaveStatus("saving");

    const unreviewScheduleWords = reviewScheduleWords.filter((rsw: any) => rsw.status === "TO_REVIEW");
    const correspondingScheduleWord = unreviewScheduleWords.find((rsw: any) => rsw.wordId === wordInfo.id);
    const correspondingSchedule = reviewSchedules.find((rs: any) => rs.id === correspondingScheduleWord?.reviewScheduleId);
    if(!wordInfo.id || !correspondingScheduleWord?.id || !correspondingSchedule?.id) {
      console.error("❌ Missing required IDs for unsaving word");
      setSaveStatus("unsaved");
      return;
    }
    else{
      await uncollectWord(wordInfo.id, correspondingScheduleWord, correspondingSchedule);
    }
    try {
      
      if (wordInfo.id) {
        const deleteData = {
          id: wordInfo.id,
        };
        const res = await (client.models as any).Word.delete(deleteData);
      }
    } catch (error) {
      console.log(error);
    }
    setSaveStatus("unsaved");
  };

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

  const handleImagePress = () => {
    if (wordInfo?.imgUrl) {
      setIsImageZoomed(true);
    }
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomed(false);
  };

  const clearOldCacheEntries = (maxEntries: number = 20) => {
    const cacheKeys = Object.keys(phoneticsCached);
    if (cacheKeys.length > maxEntries) {
      // Keep only the most recent entries (last used)
      const recentKeys = cacheKeys.slice(-maxEntries);
      const cleanedCache: { [key: string]: Phonetics } = {};

      recentKeys.forEach((key) => {
        cleanedCache[key] = phoneticsCached[key];
      });

      setPhoneticsCached(cleanedCache);
    }
  };

  // ADDED: Auto cleanup when cache gets too large
  useEffect(() => {
    const cacheKeys = Object.keys(phoneticsCached);
    if (cacheKeys.length > 25) {
      // Auto cleanup when over 25 entries
      clearOldCacheEntries(15); // Keep only 15 most recent
    }
  }, [phoneticsCached]);

  // ADDED: Manual cache management in header
  const navigateToGallery = () => {
    router.push({
      pathname: "/(gallery)",
      params: {
        word: currentWord,
      },
    });
  };

  return (
    <View
      style={{
        backgroundColor: theme.background,
      }}
      className="flex w-full h-full flex-col justify-start"
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

      <Pressable
        onPress={() => {
          setViewMode("definition");
        }}
      >
        {/* Definition View with Animated Height */}
        {isLoadingDefinition && definitionSource === "ai" ? (
          <View
            style={{
              height: "50%",
              margin: 6,
              borderRadius: BORDER_RADIUS * 2,
            }}
            className="px-3 "
          >
            <View className="mt-16  w-full justify-between flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  router.back();
                }}
              >
                <ChevronLeft color={"#fff"} />
              </TouchableOpacity>
            </View>
            {/* AI Loading GIF */}
            <View className="flex-1 flex top-6 z-30 items-center justify-center">
              <Image
                source={require("../../assets/aiLoading.gif")}
                style={{
                  width: 120,
                  height: 120,
                  resizeMode: "contain",
                }}
              />
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 18,
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                Generating definition...
              </Text>
            </View>
          </View>
        ) : (
          <Animated.View
            style={[
              {
                backgroundColor: "#1b1c1f",
                margin: 6,
                borderRadius: BORDER_RADIUS * 2,
              },
              animatedDefinitionStyle,
            ]}
            className="px-3 overflow-hidden"
          >
            <View className="mt-16 w-full justify-between flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  router.back();
                }}
              >
                <ChevronLeft color={"#fff"} />
              </TouchableOpacity>
            </View>

            <View className="mt-3 px-2 flex-1 flex flex-col">
              <View className="flex flex-row justify-between items-center">
                <View className="flex flex-col gap-1">
                  {/* Word Title - Skeleton or Real */}
                  {isLoadingDefinition ? (
                    <SkeletonBox width={200} height={36} />
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 30,
                        }}
                        className="text-white"
                      >
                        {wordInfo?.word}
                      </Text>
                    </View>
                  )}

                  {/* Phonetics - Skeleton or Real */}
                  {isLoadingDefinition || !phonetics || isLoadingPhonetics ? (
                    <SkeletonBox
                      width={150}
                      height={24}
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    phonetics && (
                      <PhoneticAudio
                        size={20}
                        phonetics={phonetics}
                        key={`${currentWord}-${phonetics.audioUrl}`}
                      />
                     
                    )
                  )}
                </View>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <TouchableOpacity
                    onPress={handleSaveOrUnsave}
                    disabled={saveStatus === "saving"}
                  >
                    <CollectBtn saveStatus={saveStatus} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Part of Speech Tags - Skeleton or Real */}
              <View className=" mt-4 flex flex-row gap-3 ">
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
                <View className=" w-full flex-1  flex flex-col ">
                  {wordInfo?.imgUrl && (
                    <TouchableOpacity
                      onPress={handleImagePress}
                      activeOpacity={0.8}
                      className=" relative"
                    >
                      <TouchableOpacity
                        onPress={() => {
                          //navigate to gallery
                          navigateToGallery();
                        }}
                        style={{
                          backgroundColor: "#00000050",
                          borderBottomRightRadius: 10,
                          borderTopLeftRadius: 10,
                          width: 40,
                          height: 34,
                        }}
                        className=" absolute bottom-0 right-0  bg-opacity-30 flex flex-row items-center justify-center  z-10"
                      >
                        <ImageUp size={18} color="#fff" />
                      </TouchableOpacity>
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

                  <ScrollView
                  ref={definitionRef}
                  onLayout={handleLayout}
                  className=" w-full py-4 flex-1 mb-10 mt-2">
                    <View className=" text-white  opacity-70" >
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
                          <TouchableOpacity
                            key={index}
                            className=" mb-4 flex flex-col gap-2"
                            onPress={() => {
                              fetchConversationExample(
                                meaning.partOfSpeech,
                                meaning.definition
                              );
                            }}
                          >
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
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </ScrollView>
                  <View className=" absolute bottom-3">
                    <AIStatusIndicator />
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setViewMode("conversation");
        }}
        className=" flex-1"
      >
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
          className="px-3 py-4"
        >
          <View className="flex  pt-6 px-3 flex-row items-center justify-between">
            <Text style={{ color: "#fff", fontSize: 28 }}>Conversation</Text>

            {/* Conditional Generate/Regenerate Button */}
            {(!showConversationView ||
              (showConversationView && isConversationLoaded)) && (
              <ImageBackground
                source={require("../../assets/images/convoButton.png")}
              >
                <TouchableOpacity
                  onPress={() => fetchConversationExample("", "")}
                  disabled={isLoadingConversation}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLoadingConversation ? 0.7 : 1,
                  }}
                >
                  {isLoadingConversation ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text
                        style={{
                          color: "#FEFEFE",
                          fontSize: 14,
                          fontWeight: "400",
                        }}
                      >
                        Generating...
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        color: "#FEFEFE",
                        fontSize: 14,
                        fontWeight: "400",
                      }}
                    >
                      {conversationData
                        ? "Regenerate"
                        : wordInfo?.exampleSentences
                          ? "View Conversation"
                          : "Generate"}
                    </Text>
                  )}
                </TouchableOpacity>
              </ImageBackground>
            )}
          </View>

          <ScrollView className="flex-1 mt-3 px-3 pt-6 pb-12">
            {/* Show conversation view based on showConversationView state */}
            {showConversationView || conversationData ? (
              <ConversationView
                conversation={
                  (conversationData as any)?.conversation ??
                  (conversationData as any)?.lines ??
                  (conversationData as any)?.messages ??
                  []
                }
                isLoading={isLoadingConversation}
                isLoaded={isConversationLoaded}
                highlightWord={currentWord}
                playAnimation={playMessageAnimation} // Pass animation control
              />
            ) : (
              /* Empty State */
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 40,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: "#374151",
                    borderRadius: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>💬</Text>
                </View>
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  See "{wordInfo?.word}" in conversation
                </Text>
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 20,
                    paddingHorizontal: 20,
                  }}
                >
                  Generate a realistic conversation example to see how this word
                  is used in context
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </View>
  );
}
