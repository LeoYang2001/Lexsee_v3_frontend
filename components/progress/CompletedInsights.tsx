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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeIn } from "react-native-reanimated";
import SingleWordProgressBar from "./SingleWordProgressBar";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { UserProfile } from "../../store/slices/profileSlice";
import WordDetailBottomSheet from "../common/WordDetailBottomSheet";

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
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const profile = useSelector((state: RootState) => state.profile.data);

  const schedules = useAppSelector(
    (state) => state.completedReviewSchedules.items,
  );
  const targetRecord = useMemo(() => {
    return schedules.find((s) => s.scheduleDate === selectedIso);
  }, [schedules, selectedIso]);

  const reviewedWordsData = useReviewedWords(targetRecord);

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
      setShowBottomSheet(true);
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

      {/* Bottom Sheet for Word Details */}
      <WordDetailBottomSheet
        isVisible={showBottomSheet}
        selectedWord={selectedWord}
        onClose={() => setShowBottomSheet(false)}
      />
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

export default CompletedInsights;
