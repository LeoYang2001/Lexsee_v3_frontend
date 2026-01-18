import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import React from "react";
import { Award, Calendar } from "lucide-react-native";
import BadgeItem from "./BadgeItem";
import type { Badge, UnAchievedBadge } from "../../types/common/Badge";
import Animated from "react-native-reanimated";
import { router } from "expo-router";



interface Card2ContentProps {
  viewMode: "default" | "card1Expanded" | "card2Expanded";
  isLoading: boolean;
}

const mockTotalBadgesList: UnAchievedBadge[] = [
  {
    badgeId: "rookie_reader",
    badgeName: "Rookie Reader",
    badgeDesp: "Awarded for completing your first reading session.",
    badgeImage: "https://example.com/badges/rookie_reader.png",
  },
  {
    badgeId: "daily_streak_3",
    badgeName: "3-Day Streak",
    badgeDesp: "Read for 3 consecutive days.",
    badgeImage: "https://example.com/badges/daily_streak_3.png",
  },
  {
    badgeId: "daily_streak_7",
    badgeName: "Weekly Warrior",
    badgeDesp: "Maintained a 7-day reading streak.",
    badgeImage: "https://example.com/badges/daily_streak_7.png",
  },
  {
    badgeId: "night_owl",
    badgeName: "Night Owl",
    badgeDesp: "Completed a reading session after midnight.",
    badgeImage: "https://example.com/badges/night_owl.png",
  },
  {
    badgeId: "early_bird",
    badgeName: "Early Bird",
    badgeDesp: "Read before 7 AM.",
    badgeImage: "https://example.com/badges/early_bird.png",
  },
  {
    badgeId: "bookworm_10",
    badgeName: "Bookworm",
    badgeDesp: "Completed 10 reading sessions.",
    badgeImage: "https://example.com/badges/bookworm_10.png",
  },
  {
    badgeId: "focus_master",
    badgeName: "Focus Master",
    badgeDesp: "Finished a full session without pausing.",
    badgeImage: "https://example.com/badges/focus_master.png",
  },
  {
    badgeId: "vocab_builder",
    badgeName: "Vocabulary Builder",
    badgeDesp: "Learned 20 new words.",
    badgeImage: "https://example.com/badges/vocab_builder.png",
  },
  {
    badgeId: "marathon_reader",
    badgeName: "Marathon Reader",
    badgeDesp: "Read for more than 60 minutes in one session.",
    badgeImage: "https://example.com/badges/marathon_reader.png",
  },
  {
    badgeId: "weekend_reader",
    badgeName: "Weekend Reader",
    badgeDesp: "Completed a reading session on the weekend.",
    badgeImage: "https://example.com/badges/weekend_reader.png",
  },
  {
    badgeId: "consistent_learner",
    badgeName: "Consistent Learner",
    badgeDesp: "Read at least 4 times in a single week.",
    badgeImage: "https://example.com/badges/consistent_learner.png",
  },
  {
    badgeId: "elite_reader",
    badgeName: "Elite Reader",
    badgeDesp: "Completed 50 total reading sessions.",
    badgeImage: "https://example.com/badges/elite_reader.png",
  },
];

const achievedBadgeIds: Badge[] = [
  {
    badgeId: "rookie_reader",
    badgeName: "Rookie Reader",
    badgeDesp: "Awarded for completing your first reading session.",
    badgeImage: "https://example.com/badges/rookie_reader.png",
    badgeAchievedDate: "2024-10-01",
  },
  {
    badgeId: "daily_streak_3",
    badgeName: "3-Day Streak",
    badgeDesp: "Read for 3 consecutive days.",
    badgeImage: "https://example.com/badges/daily_streak_3.png",
    badgeAchievedDate: "2024-10-03",
  },
];

const Card2Content: React.FC<Card2ContentProps> = ({
  viewMode,
  isLoading,
}) => {
  // Only render content when card2 is expanded
  if (viewMode === "card1Expanded") {
    return (
      <View className=" flex-1 px-3   w-full  flex flex-row  justify-start gap-2 items-center">
        <Award color="#fff" opacity={0.6} size={16} />
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
        <Award color="#fff" opacity={0.6} size={16} />
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
      <ScrollView
        className="  flex-1  flex flex-col w-full "
        showsVerticalScrollIndicator={false}
      >
        {/* Create a grid of 3 col each row for badges */}
        {isLoading ? (
          <View className=" flex-1  justify-center items-center py-10">
            <ActivityIndicator size="small" color="#FA541C" />
          </View>
        ) : (
          <View className=" flex-1  flex-row flex-wrap  justify-start items-center pb-6">
            {mockTotalBadgesList.map((badge) => {
              const isAchieved = achievedBadgeIds.some(
                (achieved) => achieved.badgeId === badge.badgeId
              );
              return (
                <BadgeItem
                  key={badge.badgeId}
                  badge={badge}
                  isAchieved={isAchieved}
                  onPress={() => {
                    router.push(`/badgeDetail/${badge.badgeId}`);
                    /* placeholder: open badge details or show tooltip */
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Card2Content;
