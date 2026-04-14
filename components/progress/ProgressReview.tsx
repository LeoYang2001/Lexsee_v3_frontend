import { View, Text, ScrollView } from "react-native";
import React from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import UpcomingWordChip from "./UpcomingWordChip";
import CompletedInsights from "./CompletedInsights";
import { useAppSelector } from "../../store/hooks";
import { selectUnifiedCalendarData } from "../../store/selectors/calendarSelectors";

interface ProgressReviewProps {
  selectedIso?: string | null;
  viewMode?: "default" | "card1Expanded" | "card2Expanded";
}

const ProgressReview: React.FC<ProgressReviewProps> = ({
  selectedIso,
  viewMode,
}) => {
  const markedDates = useAppSelector(selectUnifiedCalendarData);

  const dayData = selectedIso ? markedDates[selectedIso] : null;

  // 1. EMPTY STATE
  if (!dayData) {
    return (
      <Animated.View
        key={`empty-${selectedIso}`}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        className="py-6  items-center h-full justify-center"
      >
        <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
          No words scheduled for this day
        </Text>
        {selectedIso && (
          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
            {selectedIso}
          </Text>
        )}
      </Animated.View>
    );
  }

  // 2. INCOMING STATE
  if (dayData.type === "FUTURE") {
    // dayData.words might be string[] or WordObject[]
    const words = dayData.words || [];

    return (
      <Animated.View
        key={`future-${selectedIso}`}
        entering={FadeIn.duration(300)}
        className="flex-1 w-full   px-3 "
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "400",
              opacity: 0.4,
            }}
          >
            Upcoming Queue
          </Text>
          <Text className="text-[#6B7280] text-[12px]">
            {words.length} {words.length === 1 ? "word" : "words"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {words.map((item: any, index: number) => {
            // HANDLE STRING VS OBJECT
            const isObject = typeof item === "object" && item !== null;
            const wordText = isObject ? item.content || item.word : item;

            // Logic for timeline parsing
            let timeline = [];
            if (isObject && item.reviewedTimeline) {
              timeline =
                typeof item.reviewedTimeline === "string"
                  ? JSON.parse(item.reviewedTimeline)
                  : item.reviewedTimeline;
            }

            return (
              <UpcomingWordChip
                key={item.id || `${wordText}-${index}`} // item.id is much more stable
                word={wordText || "Unknown"}
                timeline={timeline}
              />
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  }

  // 3. PAST/OVERDUE LOGIC
  const logs = dayData.logs || [];
  const reviewedWords = logs.length;
  const totalWords = dayData.totalWords || 0;

  if (reviewedWords < totalWords) {
    return (
      <Animated.View
        key={`overdue-${selectedIso}`}
        entering={FadeIn.duration(300)}
        className="py-6 items-center flex text-center h-full justify-center px-6"
      >
        <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center" }}>
          {totalWords} words were scheduled for this day,
        </Text>
        <Text
          className="mt-2"
          style={{ color: "#ef4444", fontSize: 15, textAlign: "center" }}
        >
          unfortunately you didn't finish reviewing them.
        </Text>
      </Animated.View>
    );
  }

  // 4. COMPLETED STATE (Insights)
  return (
    <CompletedInsights
      viewMode={viewMode}
      selectedIso={selectedIso || null}
      reviewedWords={reviewedWords}
      totalWords={totalWords}
      successRate={dayData.successRate || 0}
    />
  );
};

export default ProgressReview;
