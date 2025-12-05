import { View, Text, ScrollView } from "react-native";
import React from "react";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react-native";
import { calculateStreak } from "../../lib/reviewAlgorithm";

interface Card1ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
  todaySchedule: any;
  allSchedules: any;
}

const Card1Content: React.FC<Card1ContentProps> = ({
  viewMode,
  todaySchedule,
  allSchedules,
}) => {
  // Only render content when card1 is expanded
  if (viewMode === "card2Expanded") {
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
          Calendar
        </Text>

        {calculateStreak(allSchedules) > 0 ? (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingUp color={"#CF4A1E"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              {calculateStreak(allSchedules)}-Day Streak
            </Text>
          </View>
        ) : (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingDown color={"#0c8ce9"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              No Streak Yet
            </Text>
          </View>
        )}
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

        {calculateStreak(allSchedules) > 0 ? (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingUp color={"#CF4A1E"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              {calculateStreak(allSchedules)}-Day Streak
            </Text>
          </View>
        ) : (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingDown color={"#0c8ce9"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              No Streak Yet
            </Text>
          </View>
        )}
      </View>
      <ScrollView
        className="  flex-1  flex flex-col w-full border  border-red-50"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {todaySchedule ? (
            <>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.7,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Schedule Date: {todaySchedule.scheduleDate}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.7,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Total Words: {todaySchedule.totalWords || 0}
              </Text>
              <Text
                style={{
                  color: "#FFA500",
                  opacity: 0.8,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                To Review: {todaySchedule.toBeReviewedCount || 0}
              </Text>
              <Text
                style={{
                  color: "#4CAF50",
                  opacity: 0.8,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Reviewed: {todaySchedule.reviewedCount || 0}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.7,
                  fontSize: 12,
                }}
              >
                Success Rate: {(todaySchedule.successRate || 0).toFixed(2)}%
              </Text>
            </>
          ) : (
            <Text style={{ color: "#fff", opacity: 0.5, fontSize: 12 }}>
              No schedule for today
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Card1Content;
