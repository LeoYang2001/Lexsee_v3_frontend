import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import React from "react";
import { Calendar } from "lucide-react-native";

interface AllTimeSchedule {
  id: string;
  scheduleDate: string;
  totalWords: number;
  toBeReviewedCount: number;
  reviewedCount: number;
  successRate: number;
}

interface Card2ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
  allSchedules: AllTimeSchedule[];
  isLoading: boolean;
}

const Card2Content: React.FC<Card2ContentProps> = ({
  viewMode,
  allSchedules,
  isLoading,
}) => {
  // Only render content when card2 is expanded
  if (viewMode === "card1Expanded") {
    return (
      <View className=" flex-1 px-3   w-full  flex flex-row  justify-start gap-2 items-center">
        <Calendar color="#fff" opacity={0.6} size={16} />
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "400",
            opacity: 0.4,
          }}
        >
          Badge
        </Text>
      </View>
    );
  }

  return (
    <View className=" flex-1 flex flex-col justify-start px-3">
      <View
        style={{
          height: 48,
        }}
        className=" w-full   flex flex-row  justify-start gap-2 items-center"
      >
        <Calendar color="#fff" opacity={0.6} size={16} />
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "400",
            opacity: 0.4,
          }}
        >
          Calendar
        </Text>
      </View>
      <ScrollView
        className="  flex-1  flex flex-col w-full border  border-red-50"
        showsVerticalScrollIndicator={false}
      ></ScrollView>
    </View>
  );
};

export default Card2Content;
