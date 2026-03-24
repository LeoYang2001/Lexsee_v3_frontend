import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  AppState,
  Clipboard,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import { DrawerActions } from "@react-navigation/routers";
import { useAppSelector } from "../../../../store/hooks";
import BrainLoadSlider from "../../../../components/provision/BrainLoadSlider";
import {
  DAILY_LEXSEE_DISCOVER,
  DAILY_LEXSEE_PROGRESS,
} from "./dailyLexsee.mock";
import { SlidersHorizontal } from "lucide-react-native";
import Reanimated, { FadeIn } from "react-native-reanimated";
import {
  fetchYoutubeVideos,
  fetchUserYoutubeLibrary,
  deleteYoutubeVideo,
  YouTubeVideoMetadata,
  uploadYoutubeVideo,
} from "../../../../apis/fetchYoutubeVideo";

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

interface SimulationResult {
  totalDaysElapsed: number;
  peakReviewsPerDay: number;
}

function simulateMastery(
  wordsPerDay: number,
  totalWords: number,
  masteryInterval: number = 180,
): SimulationResult {
  let daysElapsed = 0;
  let masteredCount = 0;
  let wordBank: {
    nextDueDay: number;
    interval: number;
    ease: number;
    reviews: number;
  }[] = [];
  let wordsIntroduced = 0;
  let maxReviewsInADay = 0;

  while (masteredCount < totalWords) {
    daysElapsed++;
    let reviewsToday = 0;

    if (wordsIntroduced < totalWords) {
      const remaining = totalWords - wordsIntroduced;
      const batchSize = Math.min(wordsPerDay, remaining);
      for (let i = 0; i < batchSize; i++) {
        wordBank.push({
          nextDueDay: daysElapsed,
          interval: 0,
          ease: 2.5,
          reviews: 0,
        });
        wordsIntroduced++;
      }
    }

    for (let word of wordBank) {
      if (word.nextDueDay === daysElapsed && word.interval < masteryInterval) {
        reviewsToday++;
        word.reviews++;

        if (word.reviews % 2 === 0) {
          const boostedInterval = (word.interval || 1) * word.ease * 1.3;
          word.interval = Math.max(1, Math.round(boostedInterval));
          word.ease += 0.15;
        } else {
          const calculatedInterval = (word.interval || 1) * word.ease;
          word.interval = Math.max(1, Math.round(calculatedInterval));
        }

        word.nextDueDay = daysElapsed + word.interval;

        if (word.interval >= masteryInterval) {
          masteredCount++;
        }
      }
    }

    maxReviewsInADay = Math.max(maxReviewsInADay, reviewsToday);

    if (daysElapsed > 20000) break;
  }

  return {
    totalDaysElapsed: daysElapsed,
    peakReviewsPerDay: maxReviewsInADay,
  };
}

export default function DailyLexseeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const profile = useAppSelector((state) => state.profile.data);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDailyPacing, setCustomDailyPacing] = useState("3");
  const [customMasteryInterval, setCustomMasteryInterval] = useState("180");
  const [customNotificationsEnabled, setCustomNotificationsEnabled] =
    useState(false);
  const [customOverallGoal, setCustomOverallGoal] = useState("1000");

  const scrollY = useRef(new Animated.Value(0)).current;
  const [discoverSectionY, setDiscoverSectionY] = useState(0);

  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoMetadata[]>(
    [],
  );
  const [youtubeLoading, setYoutubeLoading] = useState(true);
  const [youtubeError, setYoutubeError] = useState(false);
  const [youtubeDisplayCount, setYoutubeDisplayCount] = useState(3);

  // User-uploaded videos state
  const [userUploadedVideos, setUserUploadedVideos] = useState<
    YouTubeVideoMetadata[]
  >([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [youtubeTab, setYoutubeTab] = useState<"my-videos" | "recommended">(
    "my-videos",
  );
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [dailyUploadsRemaining, setDailyUploadsRemaining] = useState(3);

  const youtubeVideoPages = useMemo(() => {
    const displayedVideos = youtubeVideos.slice(0, youtubeDisplayCount);
    const pages: YouTubeVideoMetadata[][] = [];
    for (let i = 0; i < displayedVideos.length; i += 2) {
      pages.push(displayedVideos.slice(i, i + 2));
    }
    return pages;
  }, [youtubeVideos, youtubeDisplayCount]);

  const progressPercent = useMemo(() => {
    if (!DAILY_LEXSEE_PROGRESS.goal) return 0;
    return DAILY_LEXSEE_PROGRESS.learned / DAILY_LEXSEE_PROGRESS.goal;
  }, []);

  const estimatedVocab = profile?.overallGoal ?? null;

  const loadYoutubeVideo = async () => {
    setYoutubeLoading(true);
    setYoutubeError(false);

    try {
      // Get user ID from profile
      const userId = profile?.userId;

      // Fetch both user library and recommended videos simultaneously
      const [userLibraryResponse, recommendedVideosResponse] =
        await Promise.all([
          userId ? fetchUserYoutubeLibrary(userId) : Promise.resolve([]),
          fetchYoutubeVideos(),
        ]);

      // Process user library - convert to YouTubeVideoMetadata format
      console.log(
        `[YouTube API] Raw userLibraryResponse:`,
        JSON.stringify(userLibraryResponse),
      );

      const filtered = userLibraryResponse.filter((v) => v.isActive);
      console.log(`[YouTube API] After isActive filter:`, filtered.length);

      const userVideos: YouTubeVideoMetadata[] = filtered.map((v) => ({
        date: v.date,
        contentId: v.contentId,
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
        thumbnailUrl: v.thumbnailUrl,
        embedUrl: v.embedUrl,
        mode: "user-uploaded",
        isActive: v.isActive,
        transcriptS3Key: v.transcriptS3Key,
        transcript: v.transcript,
      }));

      // Process recommended videos
      const recommendedVideos = recommendedVideosResponse
        .filter((v) => v.isActive)
        .slice(0, 5);

      // Set states
      if (userVideos.length > 0) {
        setUserUploadedVideos(userVideos);
      }

      if (recommendedVideos.length > 0) {
        setYoutubeVideos(recommendedVideos);
      } else if (userVideos.length === 0) {
        throw new Error("No videos found.");
      }
    } catch (error) {
      console.error("[YouTube API] loadYoutubeVideo Error:", error);
      setYoutubeError(true);
    } finally {
      setYoutubeLoading(false);
    }
  };

  useEffect(() => {
    loadYoutubeVideo();
    loadDailyUploadHistory();
  }, []);

  const loadDailyUploadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("daily_video_uploads");
      const uploads = history ? JSON.parse(history) : [];

      // Get today's date as string (YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0];

      // Filter out old entries (keep only today's uploads)
      const todayUploads = uploads.filter(
        (upload: { videoId: string; date: string }) => upload.date === today,
      );

      // Save cleaned history back to storage
      await AsyncStorage.setItem(
        "daily_video_uploads",
        JSON.stringify(todayUploads),
      );

      // Calculate remaining uploads for today
      const remaining = Math.max(0, 3 - todayUploads.length);
      setDailyUploadsRemaining(remaining);

      console.log(
        `[Daily Uploads] Today: ${todayUploads.length}/3, Remaining: ${remaining}`,
      );
    } catch (error) {
      console.error("[Daily Uploads] Error loading history:", error);
      setDailyUploadsRemaining(3);
    }
  };

  // Listen to app state changes (app backgrounded/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log(
          "[AppState] App resumed from background, checking clipboard",
        );
        checkClipboardForYouTubeLink();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check clipboard whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkClipboardForYouTubeLink();
      console.log("back to app, check clipboard");
    }, []),
  );

  // Reload user videos when returning from player (e.g., after deletion)
  useFocusEffect(
    React.useCallback(() => {
      const reloadUserVideos = async () => {
        const userId = profile?.userId;
        if (userId) {
          try {
            const userLibraryResponse = await fetchUserYoutubeLibrary(userId);
            const userVideos: YouTubeVideoMetadata[] = userLibraryResponse
              .filter((v) => v.isActive)
              .map((v) => ({
                date: v.date,
                contentId: v.contentId,
                videoId: v.videoId,
                title: v.title,
                channelTitle: v.channelTitle,
                thumbnailUrl: v.thumbnailUrl,
                embedUrl: v.embedUrl,
                mode: "user-uploaded",
                isActive: v.isActive,
                transcriptS3Key: v.transcriptS3Key,
                transcript: v.transcript,
              }));

            setUserUploadedVideos(userVideos);
          } catch (error) {
            console.error("Error reloading user videos:", error);
          }
        }
      };

      reloadUserVideos();
    }, [profile?.userId]),
  );

  const checkClipboardForYouTubeLink = async () => {
    try {
      const clipboardContent = await Clipboard.getString();

      // Check if clipboard contains a valid YouTube URL
      const youtubeUrlPattern =
        /(https:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|https:\/\/youtu\.be\/[a-zA-Z0-9_-]{11})/;

      if (clipboardContent && youtubeUrlPattern.test(clipboardContent)) {
        // Extract the URL from the clipboard content
        const match = clipboardContent.match(youtubeUrlPattern);
        if (match) {
          const youtubeUrl = match[0];
          setUploadedVideoUrl(youtubeUrl);
          setShowUploadModal(true);
          // Clear clipboard to avoid duplicate behavior
          await Clipboard.setString("");
          console.log(
            "[Clipboard] YouTube URL auto-filled and modal opened:",
            youtubeUrl,
          );
        }
      }
    } catch (error) {
      console.error("[Clipboard] Error reading from clipboard:", error);
    }
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /(youtube\.com|youtu\.be|youtube-nocookie\.com)/;
    return youtubeRegex.test(url);
  };

  const handleUploadVideo = async () => {
    // 1. Validation
    if (!uploadedVideoUrl.trim()) {
      Alert.alert("Error", "Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(uploadedVideoUrl)) {
      Alert.alert("Error", "Please enter a valid YouTube URL");
      return;
    }

    const userId = profile?.userId;
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    // Check daily upload limit
    if (dailyUploadsRemaining <= 0) {
      Alert.alert(
        "Daily Limit Reached",
        "You can only upload 3 videos per day. Try again tomorrow!",
      );
      return;
    }

    // 2. Set Loading States
    setIsUploadingVideo(true);
    setUploadStatus("Processing video..."); // Standard API doesn't do mid-step updates

    try {
      // 3. Call the refactored API function
      const finalData = await uploadYoutubeVideo(userId, uploadedVideoUrl);

      console.log("FINAL DATA:", JSON.stringify(finalData));

      if (finalData) {
        // 4. Transform transcript from snake_case (Lambda) to camelCase (Frontend)
        const transformedTranscript = (finalData.transcript || []).map(
          (seg: any) => ({
            startMs: seg.start_ms || 0,
            endMs: seg.end_ms || 0,
            text: seg.snippet || "",
            startTimeText: seg.start_time_text || "",
          }),
        );

        // 5. Create the local video object
        const newUserVideo = finalData as YouTubeVideoMetadata;

        // 6. Save to daily upload history
        const today = new Date().toISOString().split("T")[0];
        const videoId = finalData.videoId || finalData.contentId;
        const history = await AsyncStorage.getItem("daily_video_uploads");
        const uploads = history ? JSON.parse(history) : [];
        uploads.push({ videoId, date: today });
        await AsyncStorage.setItem(
          "daily_video_uploads",
          JSON.stringify(uploads),
        );

        // 7. Update daily upload counter
        setDailyUploadsRemaining(Math.max(0, dailyUploadsRemaining - 1));

        // 8. Update State and Cleanup
        setUserUploadedVideos((prev) => [newUserVideo, ...prev]);
        setUploadedVideoUrl("");
        setShowUploadModal(false);
      }
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        error.message || "An unknown error occurred",
      );
    } finally {
      setIsUploadingVideo(false);
      setUploadStatus("");
    }
  };

  const handleDeleteUserVideo = async (video: YouTubeVideoMetadata) => {
    const userId = profile?.userId;
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    Alert.alert(
      "Delete Video",
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setIsDeletingVideo(true);
              const videoId = getYouTubeVideoId(video.embedUrl);
              const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

              console.log("[YouTube Delete] Deleting video:", video.title);

              const result = await deleteYoutubeVideo(userId, youtubeUrl);

              if (result.success) {
                setUserUploadedVideos((prev) =>
                  prev.filter((v) => v.contentId !== video.contentId),
                );
                Alert.alert("Success", result.message);
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("[YouTube Delete] Error:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete video. Please try again.",
              );
            } finally {
              setIsDeletingVideo(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const getSimulationResults = () => {
    const goal = parseInt(customOverallGoal) || 0;
    const pacing = parseInt(customDailyPacing) || 1;
    const interval = parseInt(customMasteryInterval) || 180;

    return simulateMastery(pacing, goal, interval);
  };

  const calculateTimeline = () => {
    const results = getSimulationResults();
    return results.totalDaysElapsed;
  };

  const isFormValid = () => {
    const goal = parseInt(customOverallGoal) || 0;
    const pacing = parseInt(customDailyPacing) || 0;
    const interval = parseInt(customMasteryInterval) || 0;

    return goal > 0 && pacing > 0 && interval > 0;
  };

  const estimatedPeakReviews = getSimulationResults().peakReviewsPerDay;

  const getPacingColor = () => {
    const pacing = parseInt(customDailyPacing) || 0;
    if (pacing < 5) return "#6B7280";
    if (pacing <= 10) return "#10B981";
    return "#EF4444";
  };

  const getPacingStatus = () => {
    const pacing = parseInt(customDailyPacing) || 0;
    if (pacing < 5) return "Too easy";
    if (pacing <= 10) return "Recommended";
    return "Heavy load";
  };

  const handleQuizPress = () => {
    router.push("/(auth)/onboarding");
  };

  const openSource = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Link Error", "Unable to open this link.");
      return;
    }
    await Linking.openURL(url);
  };

  const getYouTubeVideoId = (url: string) => {
    const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
    const longPattern = /[?&]v=([a-zA-Z0-9_-]{11})/;
    const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;

    return (
      url.match(shortPattern)?.[1] ||
      url.match(longPattern)?.[1] ||
      url.match(embedPattern)?.[1] ||
      null
    );
  };

  const openYouTubePlayer = (video: YouTubeVideoMetadata) => {
    const videoId = getYouTubeVideoId(video.embedUrl);

    const transcriptFetchParam = `daily/${video.date}/${video.contentId}/transcript.json`;

    if (!videoId) {
      Alert.alert(
        "Invalid YouTube link",
        "Opening on YouTube website instead.",
      );
      openSource("https://www.youtube.com/");
      return;
    }

    router.push({
      pathname: "/(home)/drawer/dailyLexsee/youtubePlayer",
      params: {
        videoId,
        title: video.title,
        transcript: video.transcript ? JSON.stringify(video.transcript) : "",
        transcriptFetchParam: transcriptFetchParam || "",
        mode: video.mode || "",
        embedUrl: video.embedUrl,
      },
    });
  };

  const getCurrentDate = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const dayNumber = now.toLocaleDateString("en-US", { day: "2-digit" });
    return `${dayName} ${dayNumber}`;
  };

  const dateOpacity = scrollY.interpolate({
    inputRange: [
      0,
      Math.max(100, discoverSectionY - 100),
      Math.max(200, discoverSectionY),
    ],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  const discoverOpacity = scrollY.interpolate({
    inputRange: [
      0,
      Math.max(100, discoverSectionY - 100),
      Math.max(200, discoverSectionY),
    ],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1  bg-[#0F1115] pt-20 px-3">
      {(showCustomModal || showUploadModal) && (
        <Reanimated.View
          entering={FadeIn}
          style={{
            width: windowWidth,
            height: windowHeight,
          }}
          className="absolute top-0 left-0 z-10 bg-black/70"
        />
      )}

      <View className="flex-row justify-between items-center mb-3">
        <TouchableOpacity
          className=" ml-auto p-2"
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <View style={{ width: 18 }} className="w-8 flex gap-1">
            <View style={{ height: 2 }} className="bg-white w-full" />
            <View style={{ height: 2 }} className="bg-white w-full" />
          </View>
        </TouchableOpacity>
      </View>

      <View className=" mb-6 flex flex-row justify-between items-center">
        <View className="relative">
          <Animated.Text
            className="text-white text-3xl font-thin mb-1"
            style={{ opacity: dateOpacity }}
          >
            {getCurrentDate()}
          </Animated.Text>
          <Animated.Text
            className="text-white text-3xl font-thin mb-1 absolute"
            style={{ opacity: discoverOpacity }}
          >
            Discover
          </Animated.Text>
        </View>
        <TouchableOpacity
          className="px-4 py-2 rounded-full bg-[#1B1F27] border border-[#2A2E38]"
          onPress={() => setShowCustomModal(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal color="#C9CDD5" size={14} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="bg-[#171A21] rounded-2xl p-5 mb-4 border border-[#272C36]">
          <Text className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wider">
            Daily Progress
          </Text>
          <Text className="text-white text-xl  mb-6 leading-8">
            {DAILY_LEXSEE_PROGRESS.encouragement}
          </Text>

          <View
            style={{ height: 4 }}
            className=" rounded-full bg-[#2D3340] overflow-hidden"
          >
            <View
              className="h-full bg-[#FA541C]"
              style={{
                width: `${Math.max(0, Math.min(progressPercent, 1)) * 100}%`,
              }}
            />
          </View>
          <View className="flex-row items-end mt-4">
            <View className="flex-1">
              <Text className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wider">
                Already Learned
              </Text>
              <Text className="text-white text-4xl font-bold">
                {DAILY_LEXSEE_PROGRESS.learned}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wider">
                Daily Pacing
              </Text>
              <Text className="text-white text-4xl font-bold">
                {DAILY_LEXSEE_PROGRESS.goal}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-[#12151B] rounded-xl px-4 py-3 mb-8 border border-[#222734]">
          <Text className="text-white/70 text-sm font-semibold mb-1">
            Vocabulary Estimate
          </Text>

          {estimatedVocab ? (
            <Text className="text-[#FA541C]/90 text-lg font-semibold mb-2">
              ~{estimatedVocab.toLocaleString()} words
            </Text>
          ) : (
            <Text className="text-[#7E8694] text-sm mb-2 leading-5">
              No estimate yet. Complete the 5-minute quiz to get your vocabulary
              estimate.
            </Text>
          )}

          <TouchableOpacity
            className="self-start px-3 py-1.5 rounded-md bg-[#2A2E38] border border-[#383F4D]"
            onPress={handleQuizPress}
            activeOpacity={0.85}
          >
            <Text className="text-[#D5DAE3] text-xs font-semibold">
              {estimatedVocab ? "Retry Quiz" : "Take Quiz"}
            </Text>
          </TouchableOpacity>
        </View>

        <View onLayout={(e) => setDiscoverSectionY(e.nativeEvent.layout.y)}>
          <Text className="text-white text-2xl  mb-4">Discover</Text>

          {/* Combined YouTube Learning Section */}
          <View className="mb-8">
            <View className="mb-4 px-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                    }}
                    className="rounded-full bg-[#1F2530] items-center justify-center border border-[#2A2E38]"
                  >
                    <Image
                      source={require("../../../../assets/loginIcons/youtube.png")}
                      style={{ width: 36, height: 36 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text className="text-[#A9B0BC] text-lg font-semibold">
                    YouTube Learning
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowUploadModal(true)}
                  className="rounded-full bg-[#1F2530] items-center justify-center border border-[#2A2E38] p-2"
                >
                  <Feather name="plus" size={16} color="#FA541C" />
                </TouchableOpacity>
              </View>

              {/* Tab Navigation */}
              <View className="flex-row gap-2 mt-3 mb-4">
                <TouchableOpacity
                  onPress={() => setYoutubeTab("my-videos")}
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    youtubeTab === "my-videos"
                      ? "bg-[#FA541C] border-[#FA541C]"
                      : "bg-transparent border-[#2A2E38]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      youtubeTab === "my-videos"
                        ? "text-white"
                        : "text-[#A9B0BC]"
                    }`}
                  >
                    My Videos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setYoutubeTab("recommended")}
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    youtubeTab === "recommended"
                      ? "bg-[#FA541C] border-[#FA541C]"
                      : "bg-transparent border-[#2A2E38]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      youtubeTab === "recommended"
                        ? "text-white"
                        : "text-[#A9B0BC]"
                    }`}
                  >
                    By Lexsee
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* My Videos Tab */}
            {youtubeTab === "my-videos" && (
              <View>
                {userUploadedVideos.length === 0 && youtubeLoading ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    className="-mx-1"
                  >
                    {Array.from({ length: 2 }).map((_, pageIndex) => (
                      <View
                        key={`skeleton-page-${pageIndex}`}
                        className="flex-row px-1"
                        style={{
                          width: 2 * ((windowWidth - 28) / 2) + 8 + 2,
                          gap: 8,
                        }}
                      >
                        {[0, 1].map((itemIndex) => (
                          <View
                            key={`skeleton-${pageIndex}-${itemIndex}`}
                            className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
                            style={{ width: (windowWidth - 28) / 2 }}
                          >
                            <View className="w-full h-[120px] bg-[#2A2E38]" />
                            <View className="p-3">
                              <View className="h-3 w-4/5 bg-[#2A2E38] rounded mb-2" />
                              <View className="h-3 w-2/5 bg-[#232832] rounded" />
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                ) : userUploadedVideos.length === 0 ? (
                  <Pressable
                    onPress={() => setShowUploadModal(true)}
                    className="bg-[#171A21] rounded-2xl border-2 border-dashed border-[#2A2E38] p-6 items-center"
                  >
                    <Feather name="link" size={32} color="#FA541C" />
                    <Text className="text-white text-base font-semibold mt-3 mb-1">
                      Start Your Collection
                    </Text>
                    <Text className="text-[#A9B0BC] text-sm text-center mb-4">
                      Upload your first YouTube video to learn from content you
                      love.
                    </Text>
                    <View className="bg-[#FA541C]/20 rounded-lg px-3 py-2">
                      <Text className="text-[#FA541C] text-xs font-semibold">
                        Tap + to add your first video
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    className="-mx-1"
                  >
                    <View
                      className="flex-row px-1"
                      style={{
                        width:
                          userUploadedVideos.length > 0
                            ? userUploadedVideos.length *
                                ((windowWidth - 28) / 2) +
                              (userUploadedVideos.length - 1) * 8 +
                              2
                            : windowWidth - 20,
                        gap: 8,
                      }}
                    >
                      {userUploadedVideos.map((video) => (
                        <TouchableOpacity
                          key={`my-videos-${video.contentId}`}
                          activeOpacity={0.85}
                          onPress={() => openYouTubePlayer(video)}
                          onLongPress={() => handleDeleteUserVideo(video)}
                          className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden relative"
                          style={{ width: (windowWidth - 28) / 2 }}
                        >
                          <Image
                            source={{ uri: video.thumbnailUrl }}
                            style={{ width: "100%", height: 120 }}
                            resizeMode="cover"
                          />
                          <View className="p-3 flex flex-col justify-between   flex-1">
                            <Text
                              className="text-white text-xs font-semibold mb-1"
                              numberOfLines={2}
                            >
                              {video.title}
                            </Text>
                            <Text
                              className="text-[#A9B0BC] opacity-30 text-[10px] font-semibold"
                              numberOfLines={1}
                            >
                              Hold to delete
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {/* Recommended by Lexsee Tab */}
            {youtubeTab === "recommended" && (
              <View>
                {youtubeLoading ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    className="-mx-1"
                  >
                    {Array.from({ length: 2 }).map((_, pageIndex) => (
                      <View
                        key={`skeleton-page-${pageIndex}`}
                        className="flex-row px-1"
                        style={{
                          width: 2 * ((windowWidth - 28) / 2) + 8 + 2,
                          gap: 8,
                        }}
                      >
                        {[0, 1].map((itemIndex) => (
                          <View
                            key={`skeleton-${pageIndex}-${itemIndex}`}
                            className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
                            style={{ width: (windowWidth - 28) / 2 }}
                          >
                            <View className="w-full h-[120px] bg-[#2A2E38]" />
                            <View className="p-3">
                              <View className="h-3 w-4/5 bg-[#2A2E38] rounded mb-2" />
                              <View className="h-3 w-2/5 bg-[#232832] rounded" />
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                ) : youtubeVideos.length === 0 ? (
                  <Pressable
                    onPress={() => setYoutubeTab("my-videos")}
                    className="bg-[#171A21] rounded-2xl border-2 border-dashed border-[#2A2E38] p-6 items-center"
                  >
                    <Feather name="play-circle" size={32} color="#FA541C" />
                    <Text className="text-white text-base font-semibold mt-3 mb-1">
                      No Recommendations Yet
                    </Text>
                    <Text className="text-[#A9B0BC] text-sm text-center mb-4">
                      Check back soon for curated videos from Lexsee.
                    </Text>
                    <View className="bg-[#FA541C]/20 rounded-lg px-3 py-2">
                      <Text className="text-[#FA541C] text-xs font-semibold">
                        View your uploads
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    scrollEventThrottle={16}
                    onScroll={(event) => {
                      const contentOffsetX = event.nativeEvent.contentOffset.x;
                      const contentWidth = event.nativeEvent.contentSize.width;
                      const layoutWidth =
                        event.nativeEvent.layoutMeasurement.width;

                      if (contentOffsetX + layoutWidth > contentWidth - 50) {
                        if (youtubeDisplayCount < youtubeVideos.length) {
                          setYoutubeDisplayCount((prev) =>
                            Math.min(prev + 3, youtubeVideos.length),
                          );
                        }
                      }
                    }}
                    className="-mx-1"
                  >
                    {youtubeVideoPages.map((page, pageIndex) => (
                      <View
                        key={`recommended-page-${pageIndex}`}
                        className="flex-row px-1"
                        style={{
                          width:
                            page.length > 0
                              ? page.length * ((windowWidth - 28) / 2) +
                                (page.length - 1) * 8 +
                                2
                              : windowWidth - 20,
                          gap: 8,
                        }}
                      >
                        {page.map((video) => (
                          <TouchableOpacity
                            key={video.contentId}
                            activeOpacity={0.85}
                            onPress={() => openYouTubePlayer(video)}
                            className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
                            style={{ width: (windowWidth - 28) / 2 }}
                          >
                            <Image
                              source={{ uri: video.thumbnailUrl }}
                              style={{ width: "100%", height: 120 }}
                              resizeMode="cover"
                            />

                            <View className="p-3">
                              <Text
                                className="text-white text-xs font-semibold mb-1"
                                numberOfLines={2}
                              >
                                {video.title}
                              </Text>
                              <Text
                                className="text-[#FA541C] text-xs font-semibold"
                                numberOfLines={1}
                              >
                                {video.channelTitle}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          <View className="h-[1px] bg-[#2A2E38] mb-4" />

          {/* Other Discover Categories */}
          {DAILY_LEXSEE_DISCOVER.filter((cat) => cat.id !== "watch").map(
            (category, index) => (
              <View key={category.id}>
                {category.id === "scene" ? (
                  <View>
                    <View className="mb-3 px-1">
                      <View className="flex-row items-center justify-start gap-2 mb-1">
                        {category.iconImg ? (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                              width: 36,
                              height: 36,
                            }}
                            onPress={() => openSource("https://www.imdb.com/")}
                            className="rounded-full bg-[#1F2530] items-center justify-center border border-[#2A2E38]"
                          >
                            <Image
                              source={category.iconImg}
                              style={{ width: 28, height: 28 }}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ) : null}
                        <Text className="text-[#A9B0BC] text-base mb-1">
                          {category.subtitle}
                        </Text>
                      </View>
                    </View>

                    {category.items[0] ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => openSource(category.items[0].sourceUrl)}
                        className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
                      >
                        <Image
                          source={{ uri: category.items[0].thumbnail }}
                          style={{ width: "100%", height: 170 }}
                          resizeMode="cover"
                        />

                        <View className="p-4">
                          <Text className="text-white text-lg font-semibold mb-1">
                            {category.items[0].title}
                          </Text>
                          <Text className="text-[#FA541C] text-sm font-semibold mb-2">
                            {category.items[0].duration}
                          </Text>
                          {category.items[0].intro ? (
                            <Text className="text-[#A9B0BC] text-sm leading-5">
                              {category.items[0].intro}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/(home)/drawer/dailyLexsee/detail",
                        params: { category: category.id },
                      })
                    }
                    className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
                  >
                    <Image
                      source={{ uri: category.coverThumbnail }}
                      style={{ width: "100%", height: 150 }}
                      resizeMode="cover"
                    />

                    <View className="p-4 flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-white text-xl font-semibold mb-1">
                          {category.emoji} {category.label}
                        </Text>
                        <Text className="text-[#A9B0BC] text-base mb-1">
                          {category.subtitle}
                        </Text>
                        <Text className="text-[#FA541C] text-sm font-semibold">
                          {category.items.length} suggestions
                        </Text>
                      </View>

                      <Text className="text-white text-xl font-semibold mb-1">
                        ›
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {index <
                  DAILY_LEXSEE_DISCOVER.filter((cat) => cat.id !== "watch")
                    .length -
                    1 && <View className="h-[1px] bg-[#2A2E38] my-4" />}
              </View>
            ),
          )}
        </View>
      </Animated.ScrollView>

      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 "
            onPress={() => setShowCustomModal(false)}
          />
          <View
            className="bg-[#1A1A1A] rounded-t-3xl p-6"
            style={{ maxHeight: "80%" }}
          >
            <Text className="text-white text-xl font-semibold mb-4">
              Custom Goal
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-3">
                  Overall Goal (words)
                </Text>

                <View className="flex-row gap-2">
                  {[1000, 1500, 2000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setCustomOverallGoal(preset.toString())}
                      className={`flex-1 rounded-xl p-3 border ${
                        customOverallGoal === preset.toString()
                          ? "bg-[#FF511B] border-[#FF511B]"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-center text-sm font-semibold ${
                          customOverallGoal === preset.toString()
                            ? "text-white"
                            : "text-white/70"
                        }`}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <BrainLoadSlider
                value={parseInt(customDailyPacing) || 3}
                onValueChange={(value) => setCustomDailyPacing(String(value))}
              />

              <View className="my-6">
                <View className="rounded-xl p-3 border bg-white/5 border-white/10">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: getPacingColor() }}
                    >
                      {customDailyPacing} words/day
                    </Text>
                    <View
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getPacingColor() + "20" }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getPacingColor() }}
                      >
                        {getPacingStatus()}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white text-sm font-semibold mb-2">
                    Estimated Timeline
                  </Text>
                  <View className="gap-1">
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-white/70 text-lg font-bold">
                        ~{calculateTimeline()} days
                      </Text>
                      <Text className="text-white/50 text-xs">
                        to reach your goal
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-2 mt-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: getPacingColor() }}
                      >
                        ~{estimatedPeakReviews} reviews/day
                      </Text>
                      <Text className="text-white/50 text-xs">
                        at peak efficiency
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 pt-3 border-t border-white/10">
                    <Text className="text-white/50 text-xs">
                      💡 Lexsee recommends 5-10 words/day for optimal learning
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-3">
                  Mastery Level
                </Text>

                <View className="flex-row gap-2">
                  {[
                    { days: 180, label: "Mastery", recommended: true },
                    { days: 120, label: "Growth" },
                    { days: 60, label: "Sprint" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.days}
                      onPress={() =>
                        setCustomMasteryInterval(option.days.toString())
                      }
                      className={`flex-1 rounded-xl p-3 border flex-row items-center justify-center ${
                        customMasteryInterval === option.days.toString()
                          ? "bg-[#FF511B] border-[#FF511B]"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <View className="flex-row items-center gap-1">
                        <Text
                          className={`text-sm font-semibold ${
                            customMasteryInterval === option.days.toString()
                              ? "text-white"
                              : "text-white/70"
                          }`}
                        >
                          {option.label}
                        </Text>
                        {option.recommended && (
                          <Text
                            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                              customMasteryInterval === option.days.toString()
                                ? "bg-white/20 text-white"
                                : "bg-[#FF511B]/30 text-[#FF511B]"
                            }`}
                          >
                            Rec
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-5">
                <View className="flex-row items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-sm font-semibold">
                      Learning Daily Notification
                    </Text>
                    <Text className="text-white/50 text-xs mt-1">
                      Do you want Lexsee to remind you of studying?
                    </Text>
                  </View>
                  <Switch
                    value={customNotificationsEnabled}
                    onValueChange={setCustomNotificationsEnabled}
                    trackColor={{ false: "#374151", true: "#FF511B" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-4 pb-4">
              <TouchableOpacity
                className="flex-1 bg-white/10 rounded-xl py-3 items-center"
                onPress={() => setShowCustomModal(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 items-center ${
                  isFormValid() ? "bg-[#FF511B]" : "bg-[#FF511B]/30"
                }`}
                disabled={!isFormValid()}
                onPress={() => {
                  setShowCustomModal(false);
                  Alert.alert("Saved", "DailyLexsee configuration updated.");
                }}
              >
                <Text
                  className={`font-semibold ${
                    isFormValid() ? "text-white" : "text-white/50"
                  }`}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Video Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 "
            onPress={() => setShowUploadModal(false)}
          />
          <View
            className="bg-[#1A1A1A] rounded-t-3xl p-6"
            style={{ maxHeight: "80%" }}
          >
            <Text className="text-white text-xl font-semibold mb-4">
              Add YouTube Video
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              {isUploadingVideo && uploadStatus && (
                <View className="mb-5 bg-[#FA541C]/10 rounded-xl border border-[#FA541C]/30 p-4">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        borderWidth: 3,
                        borderColor: "#FA541C",
                        borderTopColor: "transparent",
                        borderRightColor: "transparent",
                      }}
                      className="animate-spin"
                    />
                    <Text className="text-white text-sm font-semibold flex-1">
                      {uploadStatus}
                    </Text>
                  </View>
                  <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-[#FA541C]"
                      style={{ width: "65%" }}
                    />
                  </View>
                </View>
              )}

              {!isUploadingVideo && (
                <>
                  <View className="mb-4 bg-white/3 rounded-lg border border-white/5 p-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-white/60 text-[11px] font-medium">
                        Videos
                      </Text>
                      <Text className="text-white/70 text-[11px] font-semibold">
                        {userUploadedVideos.length}/10
                      </Text>
                    </View>
                    <View className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-white/40"
                        style={{
                          width: `${(userUploadedVideos.length / 10) * 100}%`,
                        }}
                      />
                    </View>
                    {userUploadedVideos.length >= 10 && (
                      <Text className="text-white/50 text-[10px] mt-1.5">
                        Max capacity reached
                      </Text>
                    )}
                  </View>

                  <View className="mb-4 bg-white/3 rounded-lg border border-white/5 p-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-white/60 text-[11px] font-medium">
                        Daily uploads
                      </Text>
                      <Text
                        className={`text-[11px] font-semibold ${dailyUploadsRemaining === 0 ? "text-white/40" : "text-white/70"}`}
                      >
                        {3 - dailyUploadsRemaining}/3
                      </Text>
                    </View>
                    <View className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <View
                        className={`h-full ${dailyUploadsRemaining === 0 ? "bg-white/20" : "bg-white/40"}`}
                        style={{
                          width: `${((3 - dailyUploadsRemaining) / 3) * 100}%`,
                        }}
                      />
                    </View>
                    {dailyUploadsRemaining === 0 && (
                      <Text className="text-white/40 text-[10px] mt-1.5">
                        Limit reached, try tomorrow
                      </Text>
                    )}
                  </View>
                </>
              )}

              <View className="mb-5">
                <Text className="text-white text-sm font-semibold mb-2">
                  YouTube URL
                </Text>
                <View className="bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                  <Text className="text-white/50 text-xs mb-2">
                    Paste the YouTube link here (auto-fills from clipboard)
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      placeholder="https://youtube.com/watch?v=..."
                      placeholderTextColor="#6B7280"
                      value={uploadedVideoUrl}
                      onChangeText={setUploadedVideoUrl}
                      editable={!isUploadingVideo}
                      className="text-white text-sm flex-1"
                    />
                    {uploadedVideoUrl.trim() && (
                      <TouchableOpacity
                        onPress={() => setUploadedVideoUrl("")}
                        disabled={isUploadingVideo}
                        className="ml-2 p-2"
                      >
                        <Feather name="x" size={18} color="#FA541C" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {userUploadedVideos.length >= 10 && (
                <View className="mb-5 bg-red-500/10 rounded-xl border border-red-500/30 p-4">
                  <View className="flex-row items-start gap-3">
                    <Feather name="alert-circle" size={18} color="#EF4444" />
                    <View className="flex-1">
                      <Text className="text-red-400 text-sm font-semibold mb-1">
                        Storage Limit Reached
                      </Text>
                      <Text className="text-red-300/80 text-xs leading-5">
                        You can store a maximum of 10 videos. Delete videos from
                        "My Videos" tab to make space for new ones.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View className="mb-5 bg-white/5 rounded-xl border border-white/10 p-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="info" size={18} color="#FA541C" />
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold mb-2">
                      How to add videos
                    </Text>
                    <Text className="text-white/70 text-xs leading-5">
                      1. Copy a YouTube link{"\n"}
                      2. Paste it here or let us detect it automatically{"\n"}
                      3. Tap Add and start learning!{"\n"}
                      4. Hold a video to delete it
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-6 pb-4">
              <TouchableOpacity
                className="flex-1 bg-white/10 rounded-xl py-3 items-center"
                onPress={() => {
                  setShowUploadModal(false);
                  setUploadedVideoUrl("");
                }}
                disabled={isUploadingVideo}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 items-center ${
                  uploadedVideoUrl.trim() &&
                  !isUploadingVideo &&
                  userUploadedVideos.length < 10 &&
                  dailyUploadsRemaining > 0
                    ? "bg-[#FF511B]"
                    : "bg-[#FF511B]/30"
                }`}
                disabled={
                  !uploadedVideoUrl.trim() ||
                  isUploadingVideo ||
                  userUploadedVideos.length >= 10 ||
                  dailyUploadsRemaining <= 0
                }
                onPress={handleUploadVideo}
              >
                <Text
                  className={`font-semibold ${
                    uploadedVideoUrl.trim() &&
                    !isUploadingVideo &&
                    userUploadedVideos.length < 10 &&
                    dailyUploadsRemaining > 0
                      ? "text-white"
                      : "text-white/50"
                  }`}
                >
                  {isUploadingVideo ? "Adding..." : "Add Video"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Loading Overlay */}
      {isDeletingVideo && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: "#232326",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderColor: "#27272A",
              borderWidth: 1,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: "#FA541C",
                borderTopColor: "transparent",
                borderRightColor: "transparent",
              }}
              className="animate-spin"
            />
            <Text
              style={{ color: "#F3F4F6" }}
              className="text-base font-semibold mt-4"
            >
              Deleting video...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
