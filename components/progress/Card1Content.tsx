import {
  View,
  Text,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import React, { useState } from "react";
import {
  ArrowDownFromLine,
  ArrowUpFromLine,
  Calendar,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import ProgressCalendar from "./ProgressCalendar";
import useStreak from "../../hooks/useStreak";
import { useAppSelector } from "../../store/hooks";
import { selectUnifiedCalendarData } from "../../store/selectors/calendarSelectors";

interface Card1ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
  selectedIso?: string | null;
  setSelectedIso?: (iso: string | null) => void;
  onHeightCalculated?: (
    collapsedHeight: number,
    expandedHeight: number,
  ) => void;
}

const Card1Content: React.FC<Card1ContentProps> = ({
  viewMode,
  selectedIso,
  setSelectedIso,
}) => {
  // selected date lifted here
  // default selected date to today (YYYY-MM-DD)

  // guard schedules to avoid undefined being passed into calculateStreak
  const streak = useStreak();

  const calendarData = useAppSelector(selectUnifiedCalendarData);

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

        <View className="ml-auto flex  flex-row items-center gap-2">
          {/* Handle -1 (First time), 0 (Reset), or >0 (Active) */}
          {streak > 0 ? (
            <TrendingUp color={"#CF4A1E"} />
          ) : (
            <TrendingDown color={"#0c8ce9"} />
          )}
          <Text style={{ color: "#fff", fontSize: 16 }}>
            {streak === -1
              ? "New Learner"
              : streak === 0
                ? "No Streak"
                : `${streak}-Day Streak`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className=" flex-1  flex flex-col justify-start ">
      <View
        style={{
          height: 48,
        }}
        className=" w-full  px-3 flex flex-row  justify-start gap-2 items-center"
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

        <View className="ml-auto flex flex-row items-center gap-2">
          {/* Handle -1 (First time), 0 (Reset), or >0 (Active) */}
          {streak > 0 ? (
            <TrendingUp color={"#CF4A1E"} />
          ) : (
            <TrendingDown color={"#0c8ce9"} />
          )}
          <Text style={{ color: "#fff", fontSize: 16 }}>
            {streak === -1
              ? "New Learner"
              : streak === 0
                ? "No Streak"
                : `${streak}-Day Streak`}
          </Text>
        </View>
      </View>

      <View className="   flex-1  relative  flex flex-col w-full ">
        <View className="  ">
          <ProgressCalendar
            viewMode={viewMode}
            selectedIso={selectedIso}
            onSelectDate={setSelectedIso}
            markedDates={calendarData}
          />
        </View>
      </View>
      <View className=" flex justify-center items-center">
        {viewMode === "default" ? (
          <ArrowDownFromLine color="#fff" opacity={0.7} size={20} />
        ) : (
          <ArrowUpFromLine color="#fff" opacity={0.7} size={20} />
        )}
      </View>
    </View>
  );
};

export default Card1Content;
