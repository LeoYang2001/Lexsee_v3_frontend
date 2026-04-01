import {
  View,
  Text,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import React, { useMemo, useState, useRef, useEffect } from "react";
import CalorieArcChart from "./polarToCartesian";
import { Target, Hand } from "lucide-react-native";
import { CircularGauge } from "./CircularGauge";
import { useAppSelector } from "../../store/hooks";
import {
  useCompletedInsights,
  useReviewedWords,
} from "../../hooks/useCompletedInsights";
import { CompletedReviewSchedule } from "../../store/slices/completedReviewScheduleSlice";
import WordBarChart from "./WordBarChart";
import { useWordProjection } from "../../hooks/useWordProjection";
import SpacedRepetitionChart from "./SpacedRepetitionChart";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeIn } from "react-native-reanimated";
import SingleWordProgressBar from "./SingleWordProgressBar";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { UserProfile } from "../../store/slices/profileSlice";

interface CompletedInsightsProps {
  selectedIso: string | null;
  reviewedWords: number;
  totalWords: number;
  successRate: number;
  viewMode?: "default" | "card1Expanded" | "card2Expanded";
}

const { width } = Dimensions.get("window");
const PAGE_WIDTH = width - 12;

const CompletedInsights: React.FC<CompletedInsightsProps> = ({
  selectedIso,
  viewMode = "default",
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const profile = useSelector((state: RootState) => state.profile.data);

  const schedules = useAppSelector(
    (state) => state.completedReviewSchedules.items,
  );
  const targetRecord = useMemo(() => {
    return schedules.find((s) => s.scheduleDate === selectedIso);
  }, [schedules, selectedIso]);

  const reviewedWordsData = useReviewedWords(targetRecord);

  // Set default selected word to first word in timeline
  useEffect(() => {
    if (reviewedWordsData && reviewedWordsData.length > 0 && !selectedWord) {
      setSelectedWord(reviewedWordsData[0]);
    }
  }, [reviewedWordsData, selectedWord]);

  // Snap back to first page when viewMode changes from default
  useEffect(() => {
    if (viewMode !== "default" && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, animated: true });
      setCurrentPage(0);
    }
  }, [viewMode]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const page = Math.round(offset / PAGE_WIDTH);
    setCurrentPage(page);
  };

  const handleSelectWord = (wordId: string, index: number) => {
    if (reviewedWordsData && reviewedWordsData[index]) {
      setSelectedWord(reviewedWordsData[index]);
      // Snap to page 3
      scrollViewRef.current?.scrollTo({
        x: PAGE_WIDTH * 2,
        animated: true,
      });
      setCurrentPage(2);
    }
  };

  const pages = [
    {
      id: 0,
      title: "Completion",
      subtitle: "Progress over time",
    },
    {
      id: 1,
      title: "Accuracy",
      subtitle: "Performance metrics",
    },
    {
      id: 2,
      title: "Trends",
      subtitle: "Learning patterns",
    },
  ];

  return (
    <View
      key={`completed-${selectedIso}`}
      className="w-full h-full flex flex-col "
    >
      {/* Horizontal ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={viewMode === "default"}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        className="flex-1 "
      >
        <DataSciencePage1 targetRecord={targetRecord} viewMode={viewMode} />
        <DataSciencePage2
          currentPage={currentPage}
          targetRecord={targetRecord}
          profile={profile}
          onSelectWord={handleSelectWord}
        />
        <DataSciencePage3
          selectedWord={selectedWord}
          targetRecord={targetRecord}
          currentPage={currentPage}
          profile={profile}
        />
      </ScrollView>

      {/* Pagination Dots */}
      {viewMode === "default" && (
        <View className="flex-row justify-center items-center gap-2 mt-12 pb-4">
          {pages.map((page) => {
            const isActive = currentPage === page.id;

            return (
              <View
                key={page.id}
                style={{
                  width: isActive ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isActive ? "#FA541C" : "#6B7280",
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const DataSciencePage1 = ({
  viewMode = "default",
  targetRecord,
}: {
  viewMode?: "default" | "card1Expanded" | "card2Expanded";
  targetRecord?: CompletedReviewSchedule | null;
}) => {
  if (!targetRecord) {
    return (
      <View
        style={{ width: PAGE_WIDTH }}
        className="justify-center items-center relative px-3 "
      >
        <Text className="text-gray-500">No data available for this date.</Text>
      </View>
    );
  }
  const insightsMetrics = useCompletedInsights(targetRecord);
  const {
    completionRate = 0,
    retentionRate = 0,
    score = 0,
  } = insightsMetrics || {};

  return (
    <View style={{ width: PAGE_WIDTH }} className="  relative  px-3  ">
      <View className=" w-full h-full px-4  py-4 justify-center flex flex-col items-start bg-[#202123] rounded-2xl">
        <View className=" flex flex-row items-center   gap-1  ">
          <Target color="#fff" opacity={0.6} size={16} />
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "400",
              opacity: 0.4,
            }}
          >
            Review Score
          </Text>
        </View>
        {/* Chart Placeholder */}
        <View className="flex-1   justify-center  items-center w-full">
          {/* Chart Area */}
          <View
            style={{
              width: "100%",
              aspectRatio: 1.2,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CalorieArcChart label="Score" value={score / 100} max={1} />
            {viewMode === "default" && (
              <View className=" w-full flex  px-6 flex-row items-center justify-between">
                <CircularGauge
                  label="Retention"
                  progress={retentionRate / 100}
                  color="#f5ab44"
                />
                <CircularGauge
                  label="Completion"
                  color="#995edf"
                  progress={completionRate / 100}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const DataSciencePage2 = ({
  targetRecord,
  currentPage,
  onSelectWord,
  profile,
}: {
  targetRecord?: CompletedReviewSchedule | null;
  currentPage: number;
  onSelectWord?: (wordId: string, index: number) => void;
  profile?: UserProfile | null;
}) => {
  if (!targetRecord) {
    return (
      <View
        style={{ width: PAGE_WIDTH }}
        className="justify-center items-center relative px-3 "
      >
        <Text className="text-gray-500">No data available for this date.</Text>
      </View>
    );
  }

  const reviewedWordsData = useReviewedWords(targetRecord);
  return (
    <View style={{ width: PAGE_WIDTH }} className="  relative  px-3  ">
      <View className=" w-full h-full px-4  py-4 justify-center flex flex-col items-start bg-[#202123] rounded-2xl">
        <View className=" flex flex-row items-center   gap-1  ">
          <Target color="#fff" opacity={0.6} size={16} />
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "400",
              opacity: 0.4,
            }}
          >
            Word Mastery
          </Text>
        </View>

        {/* Tap Indicator */}
        <View className="flex-row items-center gap-2 mt-3 mb-4 px-3 py-2 bg-[#1a1a1c] rounded-lg">
          <Hand color="#f5ab44" size={14} />
          <Text
            style={{
              color: "#f5ab44",

              fontSize: 12,
              fontWeight: "500",
            }}
          >
            Tap a word to see details
          </Text>
        </View>

        {/* Chart Placeholder */}
        <View className="flex-1     justify-center  items-center w-full">
          {currentPage === 1 && (
            <WordBarChart
              profile={profile}
              words={reviewedWordsData}
              width={PAGE_WIDTH - 24}
              onSelectWord={onSelectWord}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const DataSciencePage3 = ({
  selectedWord,
  currentPage,
  targetRecord,
  profile,
}: {
  selectedWord?: any | null;
  currentPage: number;
  targetRecord?: CompletedReviewSchedule | null;
  profile?: UserProfile | null;
}) => {
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  if (!targetRecord) {
    return (
      <View
        style={{ width: PAGE_WIDTH }}
        className="justify-center items-center relative px-3 "
      >
        <Text className="text-gray-500">No data available for this date.</Text>
      </View>
    );
  }

  const reviewedWordsData = useReviewedWords(targetRecord);
  const targetReviewedWord = reviewedWordsData.find(
    (w) => w.id === selectedWord?.id,
  );

  const {
    timeline: projectedTimeline,
    estimatedMasteryDate,
    daysToMastery,
  } = useWordProjection(targetReviewedWord);

  const handleChartLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setChartDimensions({ width, height });
  };

  if (!selectedWord) {
    return (
      <View style={{ width: PAGE_WIDTH }} className="  relative  px-3  ">
        <View className=" w-full h-full px-4  py-4 justify-center flex flex-col items-start bg-[#202123] rounded-2xl">
          <Text className="text-gray-400">Select a word to view details</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: PAGE_WIDTH }} className="  relative  px-3  ">
      <GestureHandlerRootView>
        <View className=" w-full h-full px-4  py-4 justify-between flex flex-col items-start bg-[#202123] rounded-2xl">
          {/* Header Section */}
          <View className="w-full">
            {/* Word and Mastery Days */}
            <View className="flex-row items-end justify-between mb-6">
              <View className="flex-1">
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 32,
                    fontWeight: "bold",
                  }}
                  numberOfLines={2}
                >
                  {selectedWord.content}
                </Text>
              </View>
              <View className="items-end ml-4">
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Estimated
                </Text>
                <View className="flex-row items-baseline gap-1">
                  <Text
                    style={{
                      color: "#34D399",
                      fontSize: 24,
                      fontWeight: "bold",
                    }}
                  >
                    {daysToMastery}
                  </Text>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 12,
                    }}
                  >
                    days
                  </Text>
                </View>
                {estimatedMasteryDate && (
                  <View>
                    <Text
                      className=" font-semibold"
                      style={{
                        color: "#9CA3AF",
                        fontSize: 10,
                        opacity: 0.7,
                      }}
                    >
                      {new Date(estimatedMasteryDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress being made to the date */}
            {estimatedMasteryDate && currentPage === 2 && (
              <View className="px-3 py-2 bg-[#1a1a1c] rounded-lg mb-6">
                <SingleWordProgressBar
                  wordData={targetReviewedWord}
                  maxInterval={profile?.masteryIntervalDays || 180}
                />
              </View>
            )}
          </View>

          {/* Timeline Chart Section */}
          {selectedWord.timeline &&
            selectedWord.timeline.length > 0 &&
            currentPage === 2 && (
              <Animated.View
                entering={FadeIn}
                className="w-full flex-1 justify-end"
              >
                <View className="bg-[#1a1a1c] rounded-2xl h-full p-3">
                  <View
                    onLayout={handleChartLayout}
                    className="  w-full h-full"
                  >
                    <SpacedRepetitionChart
                      data={projectedTimeline}
                      width={chartDimensions.width}
                      height={chartDimensions.height}
                    />
                  </View>
                </View>
              </Animated.View>
            )}
        </View>
      </GestureHandlerRootView>
    </View>
  );
};

export default CompletedInsights;
