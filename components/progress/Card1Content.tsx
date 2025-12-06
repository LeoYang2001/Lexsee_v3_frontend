import { View, Text, ScrollView } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react-native";
import { calculateStreak } from "../../lib/reviewAlgorithm";
import { AllTimeSchedule } from "../../app/(progress)";
import ProgressCalendar from "./ProgressCalendar";

interface Card1ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
  todaySchedule: any;
  allSchedules: AllTimeSchedule[];
}

const Card1Content: React.FC<Card1ContentProps> = ({
  viewMode,
  allSchedules,
}) => {
  // selected date lifted here
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  // guard schedules to avoid undefined being passed into calculateStreak
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (allSchedules.length > 0) {
      const calculatedStreak = calculateStreak(allSchedules);
      setStreak(calculatedStreak);
    }
  }, [allSchedules]);

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
        />
        <View className=" flex-1 mt-3 w-full p-3">
          {/* placeholder display of selected date */}
          <Text style={{ color: "#fff" }}>
            {JSON.stringify({ selectedDate: selectedIso })}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Card1Content;
