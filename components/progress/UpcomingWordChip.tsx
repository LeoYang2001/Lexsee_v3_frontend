import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ChevronDown, ChevronUp } from "lucide-react-native";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineEntry {
  date: string;
  interval: number;
  ease: number;
  familiarityLevel: string;
}

const UpcomingWordChip = ({
  word,
  timeline = [],
}: {
  word: string;
  timeline?: TimelineEntry[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHistory = timeline && timeline.length > 0;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-3">
      <TouchableOpacity
        activeOpacity={hasHistory ? 0.8 : 1}
        onPress={hasHistory ? toggleExpand : undefined}
        style={{ backgroundColor: "#2A2B2E" }}
        className={`px-4 py-4 rounded-2xl border ${
          isExpanded ? "border-orange-500/50" : "border-white/5"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-[#E5E7EB] text-[17px] font-semibold tracking-tight">
            {word}
          </Text>

          {hasHistory && (
            <View className="flex-row items-center gap-2">
              <Text className="text-white/30 text-[11px] font-bold uppercase tracking-wider">
                {isExpanded ? "Hide History" : "History"}
              </Text>
              {isExpanded ? (
                <ChevronUp size={14} color="#f97316" />
              ) : (
                <ChevronDown size={14} color="#9CA3AF" />
              )}
            </View>
          )}
        </View>

        {isExpanded && hasHistory && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mt-4 pt-4 border-t border-white/5"
          >
            <View className="gap-2">
              {/* Show most recent reviews first */}
              {[...timeline]
                .reverse()
                .slice(0, 5)
                .map((entry, i) => (
                  <View
                    key={`${entry.date}-${i}`}
                    className="bg-white/5 rounded-xl p-3 flex-row justify-between items-center"
                  >
                    <View>
                      <Text className="text-white/90 text-[13px] font-medium">
                        {entry.familiarityLevel}
                      </Text>
                      <Text className="text-white/30 text-[10px] mt-0.5">
                        {entry.date}
                      </Text>
                    </View>

                    <View className="items-end">
                      <View className="bg-orange-500/10 px-2 py-0.5 rounded-md">
                        <Text className="text-orange-400 text-[10px] font-bold">
                          {entry.interval}d Interval
                        </Text>
                      </View>
                      <Text className="text-white/20 text-[9px] mt-1">
                        Ease: {entry.ease.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>

            {timeline.length > 5 && (
              <Text className="text-center text-white/20 text-[10px] mt-3">
                Showing last 5 review sessions
              </Text>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UpcomingWordChip;
