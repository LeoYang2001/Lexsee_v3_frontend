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
}: {
  viewMode?: ParentViewMode;
  selectedIso?: string | null;
  onSelectDate?: (iso: string | null) => void;
}) {
  const COLLAPSED_H = 65;
  const EXPANDED_H = 230;
  const DURATION = 300;

  // height animation
  const heightShared = useSharedValue(
    viewMode === "card1Expanded" ? EXPANDED_H : COLLAPSED_H
  );
  useEffect(() => {
    heightShared.value = withTiming(
      viewMode === "card1Expanded" ? EXPANDED_H : COLLAPSED_H,
      { duration: DURATION }
    );
  }, [viewMode, heightShared]);

  const calendarStyle = useAnimatedStyle(() => {
    return {
      height: heightShared.value,
    };
  });

  // collapsed: show one week (Sun..Sat) containing today
  const today = useMemo(() => new Date(), []);

  // monthly overlay state
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const d = new Date(today);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  function startOfWeek(d: Date) {
    const copy = new Date(d);
    const day = copy.getDay(); // 0..6 (Sun..Sat)
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function isoDate(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function addMonths(d: Date, delta: number) {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
  }

  function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function daysInMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  // produce a contiguous array of Date | null covering all weeks of the month (start Sun)
  function generateMonthGrid(monthDate: Date) {
    const first = startOfMonth(monthDate);
    const leading = first.getDay(); // 0..6
    const total = daysInMonth(monthDate);
    const cells: (Date | null)[] = [];

    // leading nulls
    for (let i = 0; i < leading; i++) cells.push(null);

    for (let d = 1; d <= total; d++) {
      cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
    }

    // pad to full weeks (multiple of 7)
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const monthCells = useMemo(
    () => generateMonthGrid(visibleMonth),
    [visibleMonth]
  );

  const weekDates = useMemo(() => {
    const start = startOfWeek(today);
    return Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return dt;
    });
  }, [today]);

  const isCollapsed = viewMode !== "card1Expanded";

  // overlay fade style derived from heightShared
  const overlayAnimated = useAnimatedStyle(() => {
    const p = interpolate(
      heightShared.value,
      [COLLAPSED_H, EXPANDED_H],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [8, 0]) }],
    };
  });

  // weekly row animation (fade out when monthly overlay is visible)
  const weeklyAnimated = useAnimatedStyle(() => {
    const p = interpolate(
      heightShared.value,
      [COLLAPSED_H, EXPANDED_H],
      [0, 1],
      Extrapolate.CLAMP
    );
    const inv = 1 - p;
    return {
      opacity: inv,
      transform: [{ translateY: interpolate(inv, [0, 1], [-6, 0]) }],
      height: COLLAPSED_H,
    };
  });

  // Shared small UI: DateCell (used by weekly + monthly)
  function DateCell({
    date,
    iso,
    isToday,
    isSelected,
    onPress,
  }: {
    date: Date | null;
    iso: string | null;
    isToday: boolean;
    isSelected: boolean;
    onPress: (iso: string | null) => void;
  }) {
    if (!date) {
      return <View className="flex-1 items-center justify-center p-1" />;
    }
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-1 items-center relative justify-center p-1 "
        onPress={() => onPress(iso)}
      >
        <View
          style={{ width: 21, height: 21 }}
          className={`  items-center justify-center rounded-full ${
            isSelected ? "bg-orange-500" : ""
          }`}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "400" }}
            className={`${isSelected ? "text-white" : "text-gray-300"}`}
          >
            {date.getDate()}
          </Text>
        </View>
        {/* IsToday Hightlight  */}
      </TouchableOpacity>
    );
  }

  // Shared header used by weekly (compact title) and monthly (month + arrows)
  function CalendarHeader({
    title,
    onPrev,
    onNext,
    compact,
    onTitlePress,
    titleHighlighted = false,
  }: {
    title: string;
    onPrev?: () => void;
    onNext?: () => void;
    compact?: boolean;
    onTitlePress?: () => void;
    titleHighlighted?: boolean;
  }) {
    return (
      <View
        className={`flex-row  py-1  items-center ${compact ? "justify-start" : "justify-between"} mb-2`}
      >
        {!compact && (
          <TouchableOpacity onPress={onPrev} className="p-2">
            <ChevronLeft size={14} color="#fff" opacity={0.7} />
          </TouchableOpacity>
        )}

        {onTitlePress ? (
          <TouchableOpacity onPress={onTitlePress} className="px-2">
            {titleHighlighted ? (
              <View className="px-3 py-1 rounded-md bg-orange-500">
                <Text
                  style={{
                    fontSize: 16,
                    color: "#fff",
                    opacity: 1,
                  }}
                >
                  {title}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  color: "#fff",
                  opacity: 0.6,
                }}
              >
                {title}
              </Text>
            )}
          </TouchableOpacity>
        ) : titleHighlighted ? (
          <View className="px-3 py-1 rounded-md bg-orange-500">
            <Text
              style={{
                fontSize: 16,
                color: "#fff",
                opacity: 1,
              }}
            >
              {title}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 16,
              color: "#fff",
              opacity: 0.6,
            }}
          >
            {title}
          </Text>
        )}

        {!compact && (
          <TouchableOpacity onPress={onNext} className="p-2">
            <ChevronRight size={14} color="#fff" opacity={0.7} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // WeeklyRow component (extracted from return)
  function WeeklyRow({
    weekDates,
    today,
    selectedIso,
    setSelectedIso,
    isCollapsed,
    weeklyStyle,
  }: {
    weekDates: Date[];
    today: Date;
    selectedIso: string | null;
    setSelectedIso: (iso: string | null) => void;
    isCollapsed: boolean;
    weeklyStyle: any;
  }) {
    return (
      <Animated.View
        className="  flex py-1 flex-col"
        style={[
          weeklyStyle,

          // ensure weekly sits under overlay; zIndex helps on Android/iOS
          { zIndex: isCollapsed ? 10 : 1, elevation: isCollapsed ? 2 : 0 },
        ]}
        pointerEvents={isCollapsed ? "auto" : "none"}
      >
        <View className="  flex-row  items-center justify-between">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <View className="flex-1 ">
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.4,
                }}
                key={label}
                className="text-xs text-center"
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-1 w-full justify-between  items-center">
          {weekDates.map((d) => {
            const iso = isoDate(d);
            const isToday = iso === isoDate(today);
            const isSelected = iso === selectedIso;
            return (
              <DateCell
                key={iso}
                date={d}
                iso={iso}
                isToday={isToday}
                isSelected={isSelected}
                onPress={(iso) => {
                  setSelectedIso(iso);
                  console.log("Calendar date pressed:", iso);
                }}
              />
            );
          })}
        </View>
      </Animated.View>
    );
  }

  // MonthlyGrid component (extracted from inline overlay)
  function MonthlyGrid({
    isCollapsed,
    overlayStyle,
    monthCells,
    visibleMonth,
    addMonths,
    isoDate,
    today,
    selectedIso,
    setSelectedIso,
  }: {
    isCollapsed: boolean;
    overlayStyle: any;
    monthCells: (Date | null)[];
    visibleMonth: Date;
    addMonths: (d: Date, delta: number) => Date;
    isoDate: (d: Date) => string;
    today: Date;
    selectedIso: string | null;
    setSelectedIso: (iso: string | null) => void;
  }) {
    // use flex layout to evenly distribute rows: rows = number of weeks in month grid
    const weeks = Math.ceil(monthCells.length / 7);

    return (
      <Animated.View
        className="flex flex-col"
        pointerEvents={isCollapsed ? "none" : "auto"}
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: EXPANDED_H,
            backgroundColor: "transparent",

            zIndex: isCollapsed ? 0 : 20,
            elevation: isCollapsed ? 0 : 6,
          },
          overlayStyle,
        ]}
      >
        {/* use shared header */}
        {(() => {
          const m = visibleMonth.getMonth() + 1;
          const monthStr = `${visibleMonth.getFullYear()}-${String(m).padStart(2, "0")}`;
          const titleHighlighted = selectedIso === monthStr;
          return (
            <CalendarHeader
              title={visibleMonth.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
              onPrev={() => setVisibleMonth((m) => addMonths(m, -1))}
              onNext={() => setVisibleMonth((m) => addMonths(m, 1))}
              compact={false}
              titleHighlighted={titleHighlighted}
              onTitlePress={() => {
                setSelectedIso(monthStr);
                console.log("Month title pressed:", monthStr);
              }}
            />
          );
        })()}

        {/* month grid */}
        <View className=" flex-1 flex flex-col justify-start">
          <View className="  flex-row  items-center justify-between">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <View className="flex-1 " key={label}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#fff",
                    opacity: 0.4,
                  }}
                  className="text-center"
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid rendered using flex rows so each row gets equal height (flex-1). */}
          <View className="flex-1  mt-2    w-full">
            {Array.from({ length: weeks }).map((_, r) => {
              const start = r * 7;
              return (
                <View key={r} className="flex-row flex-1 w-full">
                  {monthCells.slice(start, start + 7).map((cell, cidx) => {
                    const iso = cell ? isoDate(cell) : null;
                    const cellKey = iso ?? `empty-${r}-${cidx}`;
                    return (
                      <DateCell
                        key={cellKey}
                        date={cell}
                        iso={iso}
                        isToday={
                          cell ? isoDate(cell) === isoDate(today) : false
                        }
                        isSelected={
                          cell ? isoDate(cell) === selectedIso : false
                        }
                        onPress={(iso) => {
                          if (!iso) return;
                          setSelectedIso(iso);
                          console.log("Calendar date pressed:", iso);
                        }}
                      />
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className="w-full bg-[#202123] rounded-lg overflow-hidden"
      style={[calendarStyle]}
    >
      {/* Collapsed row (always visible). When expanded, this still shows but fades out */}
      <WeeklyRow
        weekDates={weekDates}
        today={today}
        selectedIso={selectedIso}
        setSelectedIso={onSelectDate}
        isCollapsed={isCollapsed}
        weeklyStyle={weeklyAnimated}
      />

      {/* Monthly overlay (extracted) */}
      <MonthlyGrid
        isCollapsed={isCollapsed}
        overlayStyle={overlayAnimated}
        monthCells={monthCells}
        visibleMonth={visibleMonth}
        addMonths={addMonths}
        isoDate={isoDate}
        today={today}
        selectedIso={selectedIso}
        setSelectedIso={onSelectDate}
      />
    </Animated.View>
  );
}
