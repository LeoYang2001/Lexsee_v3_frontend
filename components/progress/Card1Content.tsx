import { View, Text, ScrollView } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react-native";
import { calculateStreak } from "../../lib/reviewAlgorithm";
import ProgressCalendar from "./ProgressCalendar";
import ProgressReview from "./ProgressReview";
import { getLocalDate } from "../../util/utli";
import useStreak from "../../hooks/useStreak";
import { useAppSelector } from "../../store/hooks";

interface Card1ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
 
}

const Card1Content: React.FC<Card1ContentProps> = ({
  viewMode,
}) => {
  // selected date lifted here
  // default selected date to today (YYYY-MM-DD)
  const [selectedIso, setSelectedIso] = useState<string | null>(
    getLocalDate()
  );

  const incomingSchedules = useAppSelector(state => state.reviewSchedule.items)
  const pastSchedules = useAppSelector(state => state.completedReviewSchedules.items)
    
  // Combine incoming and past schedules and sort them by scheduleDate from latest to earliest
  const allSchedules = [...incomingSchedules, ...pastSchedules].sort((a, b) => new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime())

  // guard schedules to avoid undefined being passed into calculateStreak
  const streak =useStreak();



  // Only render content when card1 is expanded (or compact row for card2Expanded)
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

        {streak > 0 ? (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingUp color={"#CF4A1E"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              {streak}-Day Streak
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
    <View className=" flex-1 flex flex-col justify-start ">
      <View
        style={{
          height: 48,
        }}
        className=" w-full   px-3 flex flex-row  justify-start gap-2 items-center"
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

        {streak > 0 ? (
          <View className=" ml-auto flex flex-row items-center gap-2">
            <TrendingUp color={"#CF4A1E"} />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
              }}
            >
              {streak}-Day Streak
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

      <View className="  flex-1  relative  flex flex-col w-full ">
        <ProgressCalendar
          viewMode={viewMode}
          selectedIso={selectedIso}
          onSelectDate={setSelectedIso}
          allSchedules={allSchedules}
        />
        <View className=" flex-1 mt-3 w-full p-3">
          <ProgressReview
            allSchedules={allSchedules}
            selectedIso={selectedIso}
          />
        </View>
      </View>
    </View>
  );
};

export default Card1Content;
