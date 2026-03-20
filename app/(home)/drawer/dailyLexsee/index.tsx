import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
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
  YouTubeVideoMetadata,
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
      // 1. Fetch the entire list (sorted by date desc from backend)
      const videoList = await fetchYoutubeVideos();

      if (videoList && videoList.length > 0) {
        const activeVideos = videoList.filter((v) => v.isActive).slice(0, 5);

        if (activeVideos.length > 0) {
          console.log("found active youtube:", JSON.stringify(activeVideos));

          setYoutubeVideos(activeVideos);
        } else {
          throw new Error("No active videos found in the list.");
        }
      } else {
        throw new Error("Video list is empty.");
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
  }, []);

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

  const openYouTubePlayer = (
    url: string,
    title: string,
    date: string,
    contentId: string,
    transcript?: string,
  ) => {
    const videoId = getYouTubeVideoId(url);

    const transcriptFetchParam = `daily/${date}/${contentId}/transcript.json`;

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
        title,
        transcript: transcript || "",
        transcriptFetchParam: transcriptFetchParam || "",
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
      {showCustomModal && (
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

          {DAILY_LEXSEE_DISCOVER.map((category, index) => (
            <View key={category.id}>
              {category.id === "watch" ? (
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
                          onPress={() => openSource("https://www.youtube.com/")}
                          className=" rounded-full bg-[#1F2530] items-center justify-center border border-[#2A2E38]"
                        >
                          <Image
                            source={category.iconImg}
                            style={{ width: 42, height: 42 }}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      ) : null}
                      <Text className="text-[#A9B0BC] text-base mb-1">
                        {category.subtitle}
                      </Text>
                    </View>
                  </View>

                  {youtubeLoading ? (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled
                      className="-mx-1"
                    >
                      {Array.from({ length: 3 }).map((_, pageIndex) => (
                        <View
                          key={`youtube-skeleton-page-${pageIndex}`}
                          className="flex-row px-1"
                          style={{ width: windowWidth - 20, gap: 8 }}
                        >
                          {[0, 1].map((itemIndex) => (
                            <View
                              key={`youtube-skeleton-${pageIndex}-${itemIndex}`}
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
                  ) : youtubeError || youtubeVideos.length === 0 ? (
                    <View className="bg-[#171A21] rounded-2xl border border-[#272C36] p-4">
                      <Text className="text-white text-base font-semibold mb-1">
                        No videos available
                      </Text>
                      <Text className="text-[#A9B0BC] text-sm">
                        Check back later for Daily Lexsee videos.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled
                      scrollEventThrottle={16}
                      onScroll={(event) => {
                        const contentOffsetX =
                          event.nativeEvent.contentOffset.x;
                        const contentWidth =
                          event.nativeEvent.contentSize.width;
                        const layoutWidth =
                          event.nativeEvent.layoutMeasurement.width;

                        // Check if user has scrolled near the end
                        if (contentOffsetX + layoutWidth > contentWidth - 50) {
                          // Load next batch if more videos available
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
                          key={`youtube-page-${pageIndex}`}
                          className="flex-row px-1"
                          style={{ width: windowWidth - 20, gap: 8 }}
                        >
                          {page.map((video) => (
                            <TouchableOpacity
                              key={video.contentId}
                              activeOpacity={0.85}
                              onPress={() =>
                                openYouTubePlayer(
                                  video.embedUrl,
                                  video.title,
                                  video.date,
                                  video.contentId,
                                  video.transcript
                                    ? JSON.stringify(video.transcript)
                                    : undefined,
                                )
                              }
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

                          {page.length === 1 &&
                            youtubeDisplayCount >= youtubeVideos.length && (
                              <View
                                className="rounded-2xl"
                                style={{ width: (windowWidth - 28) / 2 }}
                              />
                            )}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : category.id === "scene" ? (
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

              {index < DAILY_LEXSEE_DISCOVER.length - 1 && (
                <View className="h-[1px] bg-[#2A2E38] my-4" />
              )}
            </View>
          ))}
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
            className="flex-1"
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
    </View>
  );
}
