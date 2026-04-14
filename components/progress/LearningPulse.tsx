import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { useSelector } from "react-redux";
import {
  selectMonthlyReport,
  selectWeeklyProgress,
  selectWordsLearnedToday,
} from "../../store/slices/wordsListSlice";
import { useAppSelector } from "../../store/hooks";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DailyPalette = {
  ring: string;
  track: string;
  centerBg: string;
  text: string;
};

const getDailyPalette = (progress: number): DailyPalette => {
  const p = Math.min(Math.max(progress, 0), 100);

  if (p >= 100) {
    return {
      ring: "#22C55E",
      track: "#1F2937",
      centerBg: "#DCFCE7",
      text: "#14532D",
    };
  }

  if (p >= 80) {
    return {
      ring: "#FF9800",
      track: "#2B2B31",
      centerBg: "#FFD8A8",
      text: "#1D1D1F",
    };
  }

  if (p >= 50) {
    return {
      ring: "#A78BFA",
      track: "#2B2B31",
      centerBg: "#EDE9FE",
      text: "#4C1D95",
    };
  }

  return {
    ring: "#60A5FA",
    track: "#2B2B31",
    centerBg: "#DBEAFE",
    text: "#1E3A8A",
  };
};

const DailyProgressRing = ({
  progress,
  palette,
}: {
  progress: number;
  palette: DailyPalette;
}) => {
  const size = 136;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.min(Math.max(progress, 0), 100);

  const dashOffset = useSharedValue(circumference);

  useEffect(() => {
    const targetOffset = (1 - normalized / 100) * circumference;
    dashOffset.value = circumference;
    dashOffset.value = withTiming(targetOffset, {
      duration: 950,
      easing: Easing.out(Easing.cubic),
    });
  }, [circumference, dashOffset, normalized]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Svg
        width={126}
        height={126}
        viewBox="0 0 136 136"
        style={{
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      >
        <Circle
          cx={68}
          cy={68}
          r={56}
          stroke={palette.track}
          strokeWidth={12}
          fill="transparent"
        />
        <AnimatedCircle
          cx={68}
          cy={68}
          r={56}
          stroke={palette.ring}
          strokeWidth={12}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>

      <View
        className="w-[92px] h-[92px] rounded-full items-center justify-center"
        style={{ backgroundColor: palette.centerBg }}
      >
        <Text style={{ color: palette.text }} className="text-2xl font-bold">
          {Math.round(normalized)}%
        </Text>
      </View>
    </View>
  );
};

const ProgressCard = ({ children }: { children: React.ReactNode }) => (
  <View className="w-full h-full bg-[#1C1C1E] rounded-3xl p-4 border border-white/5">
    {children}
  </View>
);

const LearningPulse = () => {
  const profile = useAppSelector((state) => state.profile.data);
  const wordsToday = useSelector(selectWordsLearnedToday);
  const dailyPacing = profile?.dailyPacing || 0;
  const dailyProgress =
    dailyPacing > 0 ? (wordsToday.count / dailyPacing) * 100 : 0;
  const dailyPalette = getDailyPalette(dailyProgress);

  const [isSheetVisible, setIsSheetVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsSheetVisible(true);
        }}
        className="w-full h-full"
      >
        <ProgressCard>
          <View className="w-full h-full flex-row items-center justify-between">
            <View className="flex-1 pr-3 justify-between h-full">
              <Text className="text-gray-400 text-base font-medium">
                Daily progress
              </Text>

              <View>
                <Text className="text-white text-2xl font-bold">
                  {wordsToday.count}/{dailyPacing}
                </Text>
              </View>

              <Text className="text-gray-400 text-[11px] uppercase tracking-[1.5px]">
                Tap to view details
              </Text>
            </View>

            <DailyProgressRing
              progress={dailyProgress}
              palette={dailyPalette}
            />
          </View>
        </ProgressCard>
      </TouchableOpacity>

      <Modal
        visible={isSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSheetVisible(false)}
      >
        {/* Modal Mask  */}
        {isSheetVisible && (
          <Animated.View
            entering={FadeIn.delay(200)}
            className="absolute w-full h-full inset-0 bg-black/50 "
          ></Animated.View>
        )}
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSheetVisible(false);
            }}
          />

          <View
            className="bg-[#111113] rounded-t-3xl px-4 pt-3 pb-6"
            style={{ height: "72%" }}
          >
            <View className="w-10 h-1 bg-white/20 rounded-full self-center mb-4" />

            <ScrollView
              className="flex-1"
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-5 pb-2">
                <WeeklyProgress profile={profile} />

                <View className="h-px bg-white/10" />

                <MonthlyProgress />

                <View className="h-px bg-white/10" />

                <YearlyPlaceholder />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const WeeklyProgress = ({ profile }: { profile: any }) => {
  const { totalThisWeek, dailyBuckets } = useSelector(selectWeeklyProgress);
  const dailyPacing = profile?.dailyPacing || 3;
  const completedDays = dailyBuckets.filter(
    (bucket: any) => bucket.count >= dailyPacing,
  ).length;

  return (
    <View className="w-full">
      <Text className="text-gray-400 text-base font-medium">
        Weekly progress
      </Text>
      <Text className="text-gray-500 text-[11px] uppercase tracking-[2px] mt-1">
        Last 7 days completion
      </Text>

      <View className="flex-row items-center justify-between mt-4">
        {dailyBuckets.map((bucket: any) => {
          const isGoalMet = bucket.count >= dailyPacing;
          const dayInitial =
            bucket.dayName?.[0] ||
            new Date(bucket.date).toLocaleDateString("en-US", {
              weekday: "narrow",
            });

          return (
            <View key={bucket.date} className="items-center">
              <Text className="text-gray-500 text-[10px] mb-2">
                {dayInitial}
              </Text>
              <View
                className={`w-4 h-4 rounded-full ${isGoalMet ? "bg-[#FF6B35]" : "bg-[#2C2C2E]"}`}
              />
            </View>
          );
        })}
      </View>

      <View className="mt-4 flex-row items-baseline justify-between">
        <Text className="text-white text-xl font-bold"></Text>
        <Text className="text-gray-500 text-xs  font-semibold">
          {" "}
          {completedDays}/7 days Goal met
        </Text>
      </View>
    </View>
  );
};

const MonthlyProgress = () => {
  const {
    isEligible,
    daysUntilReport,
    retentionRate,
    consistencyRate,
    pacePercentage,
  } = useSelector(selectMonthlyReport);

  if (isEligible) {
    return (
      <View className="w-full">
        <Text className="text-gray-400 text-base font-medium">
          Monthly progress
        </Text>
        <Text className="text-[#FF6B35] text-2xl font-bold mt-2">
          {daysUntilReport} Days
        </Text>
        <Text className="text-gray-600 text-xs mt-1">
          Collecting Memory Data
        </Text>
      </View>
    );
  }

  const monthlyScore = Math.round(
    (Number(retentionRate || 0) +
      Number(consistencyRate || 0) +
      Number(pacePercentage || 0)) /
      3,
  );

  return (
    <View className="w-full">
      <View>
        <Text className="text-gray-400 text-base font-medium">
          Monthly progress
        </Text>
        <Text className="text-gray-500 text-[11px] uppercase tracking-[2px] mt-1">
          Previous 30 days
        </Text>
      </View>

      <View className="mt-4 items-center">
        <TripleSemiRings
          retentionRate={retentionRate}
          consistencyRate={consistencyRate}
          pacePercentage={pacePercentage}
          monthlyScore={monthlyScore}
        />
      </View>

      <View className=" flex-row gap-2">
        <MetricChip label="Retention" value={retentionRate} color="#FF6B35" />
        <MetricChip
          label="Consistency"
          value={consistencyRate}
          color="#4ADE80"
        />
        <MetricChip label="Pacing" value={pacePercentage} color="#60A5FA" />
      </View>
    </View>
  );
};

const YearlyPlaceholder = () => {
  return (
    <View className="w-full py-2">
      <View>
        <Text className="text-gray-400 text-base font-medium">
          Yearly progress
        </Text>
        <Text className="text-gray-500 text-xs mt-1">
          Placeholder for yearly insights
        </Text>
      </View>

      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
        <Text className="text-white text-sm">Coming soon</Text>
        <Text className="text-gray-500 text-xs mt-1">
          We will add year-over-year learning trends and milestone projections.
        </Text>
      </View>
    </View>
  );
};

const MetricChip = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View className="flex-1 rounded-xl bg-white/5 border border-white/10 px-2 py-2">
    <Text className="text-gray-500 text-[10px]">{label}</Text>
    <View className="flex-row items-baseline mt-1">
      <Text style={{ color }} className="text-lg font-bold">
        {Math.round(value || 0)}
      </Text>
      <Text style={{ color }} className="text-xs font-bold ml-0.5">
        %
      </Text>
    </View>
  </View>
);

const AnimatedSemiProgressArc = ({
  cx,
  cy,
  r,
  stroke,
  color,
  normalized,
  semiCircumference,
  circumference,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke: number;
  color: string;
  normalized: number;
  semiCircumference: number;
  circumference: number;
  delay: number;
}) => {
  const dashLength = useSharedValue(0);

  useEffect(() => {
    const targetLength = (normalized / 100) * semiCircumference;
    dashLength.value = 0;
    dashLength.value = withDelay(
      delay,
      withTiming(targetLength, {
        duration: 850,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [dashLength, normalized, semiCircumference, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [dashLength.value, circumference],
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      fill="transparent"
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
};

const TripleSemiRings = ({
  retentionRate,
  consistencyRate,
  pacePercentage,
  monthlyScore,
}: {
  retentionRate: number;
  consistencyRate: number;
  pacePercentage: number;
  monthlyScore: number;
}) => {
  const size = 260;
  const chartHeight = 154; // Cut off height for semi-circle
  const center = size / 2;

  const rings = [
    { radius: 102, stroke: 16, color: "#FF6B35", value: retentionRate },
    { radius: 82, stroke: 16, color: "#4ADE80", value: consistencyRate },
    { radius: 62, stroke: 16, color: "#60A5FA", value: pacePercentage },
  ];

  return (
    <View
      style={{ width: size, height: chartHeight }}
      className="items-center justify-start overflow-hidden"
    >
      <Svg
        width={size}
        height={size} // Keep Svg square for rotation, container will clip it
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: "180deg" }] }} // Rotates to face upward
      >
        {rings.map((ring, index) => {
          const circumference = ring.radius * 2 * Math.PI;
          const semiCircumference = circumference / 2;

          // Normalized progress (0 to 100)
          const normalized = Math.min(Math.max(ring.value || 0, 0), 100);

          // Dashoffset calculation:
          // We show 'semiCircumference' worth of track.
          // The progress is a fraction of that semi-circle.
          const progressStroke = (normalized / 100) * semiCircumference;

          return (
            <React.Fragment key={ring.radius}>
              {/* 1. Unlighted Background (The Track) */}
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.color}
                strokeWidth={ring.stroke}
                fill="transparent"
                opacity={0.12} // Matches the "unlighted" dimmed look
                strokeDasharray={`${semiCircumference} ${circumference}`}
                strokeLinecap="round"
              />

              {/* 2. Lighted Progress (The Actual Value) */}
              <AnimatedSemiProgressArc
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.stroke}
                color={ring.color}
                normalized={normalized}
                semiCircumference={semiCircumference}
                circumference={circumference}
                delay={index * 150}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Centered Score Text */}
      <View className="absolute bottom-4 items-center">
        <Text className="text-white text-2xl font-bold">{monthlyScore}%</Text>
        <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
          30-day score
        </Text>
      </View>
    </View>
  );
};

export default LearningPulse;
