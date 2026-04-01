import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

type ParentViewMode = "default" | "card1Expanded" | "card2Expanded";

export default function ProgressCalendar({
  viewMode,
  selectedIso = null,
  onSelectDate = () => {},
  markedDates = {}, // Receives unified map: { [iso]: { type: 'PAST'|'FUTURE', ... } }
}: {
  viewMode?: ParentViewMode;
  selectedIso?: string | null;
  onSelectDate?: (iso: string | null) => void;
  markedDates?: Record<string, any>;
}) {
  const COLLAPSED_H = 65;
  const EXPANDED_H = 230;
  const DURATION = 300;

  const heightShared = useSharedValue(
    viewMode === "card1Expanded" ? EXPANDED_H : COLLAPSED_H,
  );

  useEffect(() => {
    heightShared.value = withTiming(
      viewMode === "card1Expanded" ? EXPANDED_H : COLLAPSED_H,
      { duration: DURATION },
    );
  }, [viewMode]);

  const calendarStyle = useAnimatedStyle(() => ({
    height: heightShared.value,
  }));

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // --- Utility Functions ---
  const isoDate = (d: Date) => d.toISOString().split("T")[0];
  const startOfWeek = (d: Date) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - copy.getDay());
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const addMonths = (d: Date, delta: number) =>
    new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const daysInMonth = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const monthCells = useMemo(() => {
    const first = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );
    const leading = first.getDay();
    const total = daysInMonth(visibleMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      cells.push(
        new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d),
      );
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [visibleMonth]);

  const weekDates = useMemo(() => {
    const start = startOfWeek(today);
    return Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return dt;
    });
  }, [today]);

  const isCollapsed = viewMode !== "card1Expanded";

  const overlayAnimated = useAnimatedStyle(() => {
    const p = interpolate(
      heightShared.value,
      [COLLAPSED_H, EXPANDED_H],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [8, 0]) }],
    };
  });

  const weeklyAnimated = useAnimatedStyle(() => {
    const p = interpolate(
      heightShared.value,
      [COLLAPSED_H, EXPANDED_H],
      [0, 1],
      Extrapolate.CLAMP,
    );
    const inv = 1 - p;
    return {
      opacity: inv,
      transform: [{ translateY: interpolate(inv, [0, 1], [-6, 0]) }],
    };
  });

  // --- Status Logic ---
  function DateCell({ date, iso, isToday, isSelected, onPress }: any) {
    if (!date || !iso)
      return <View className="flex-1 items-center justify-center p-1" />;

    const dayData = markedDates[iso];
    const isPast = iso < isoDate(today);

    let cellStatus = "unscheduled";
    if (dayData) {
      if (dayData.type === "FUTURE") {
        cellStatus = "incoming";
      } else if (dayData.type === "PAST") {
        const logs = dayData.logs || [];
        const isComplete = logs.length >= (dayData.totalWords || 0);
        cellStatus = isComplete ? "completed" : "overdue";
      }
    }

    const StatusViews: Record<string, React.ReactNode> = {
      unscheduled: (
        <Text className="text-white text-[14px]">{date.getDate()}</Text>
      ),
      incoming: (
        <Text className="text-white text-[14px] opacity-30">
          {date.getDate()}
        </Text>
      ),
      overdue: (
        <Text className="text-red-500 text-[14px]">{date.getDate()}</Text>
      ),
      completed: <Text className="text-white text-[14px]">✓</Text>,
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-1 items-center justify-center p-1 relative"
        onPress={() => onPress(iso)}
      >
        <View
          style={{ width: 22, height: 22 }}
          className={`items-center justify-center rounded-full ${isSelected ? "bg-orange-500" : ""}`}
        >
          {StatusViews[cellStatus]}
        </View>
        {isToday && (
          <View
            className="absolute bg-white rounded-full"
            style={{ height: 3, width: 3, bottom: 2 }}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      className="w-full bg-[#202123] rounded-lg overflow-hidden"
      style={[calendarStyle]}
    >
      {/* Weekly Row */}
      <Animated.View
        className="absolute top-0 left-0 right-0 py-1"
        style={[weeklyAnimated, { zIndex: isCollapsed ? 10 : 1 }]}
        pointerEvents={isCollapsed ? "auto" : "none"}
      >
        <View className="flex-row justify-between mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((l, i) => (
            <Text
              key={i}
              className="flex-1 text-center text-white opacity-40 text-[10px]"
            >
              {l}
            </Text>
          ))}
        </View>
        <View className="flex-row justify-between">
          {weekDates.map((d) => {
            const iso = isoDate(d);
            return (
              <DateCell
                key={iso}
                date={d}
                iso={iso}
                isToday={iso === isoDate(today)}
                isSelected={iso === selectedIso}
                onPress={onSelectDate}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Monthly Overlay */}
      <Animated.View
        className="absolute top-0 left-0 right-0 p-2"
        style={[overlayAnimated, { zIndex: isCollapsed ? 1 : 10 }]}
        pointerEvents={isCollapsed ? "none" : "auto"}
      >
        <View className="flex-row justify-between items-center mb-2 px-2">
          <TouchableOpacity
            className=" p-2"
            onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          >
            <ChevronLeft size={16} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-[16px] font-medium">
            {visibleMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity
            className=" p-2"
            onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          >
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((l) => (
            <Text
              key={l}
              className="flex-1 text-center text-white opacity-40 text-[10px]"
            >
              {l}
            </Text>
          ))}
        </View>

        <View className="flex-col">
          {Array.from({ length: Math.ceil(monthCells.length / 7) }).map(
            (_, rowIndex) => (
              <View key={rowIndex} className="flex-row">
                {monthCells
                  .slice(rowIndex * 7, rowIndex * 7 + 7)
                  .map((cell, cellIndex) => {
                    const iso = cell ? isoDate(cell) : null;
                    return (
                      <DateCell
                        key={iso || `empty-${rowIndex}-${cellIndex}`}
                        date={cell}
                        iso={iso}
                        isToday={iso === isoDate(today)}
                        isSelected={iso === selectedIso}
                        onPress={onSelectDate}
                      />
                    );
                  })}
              </View>
            ),
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
