import React from "react";
import { Pressable, View, Text, Image, TouchableOpacity } from "react-native";
import { Badge as BadgeIcon } from "lucide-react-native";
import type { UnAchievedBadge } from "../../types/common/Badge";
import Animated from "react-native-reanimated";
import { Link } from "expo-router";

type BadgeItemProps = {
  badge: UnAchievedBadge;
  isAchieved?: boolean;
  onPress?: () => void;
};

const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  isAchieved = false,
  onPress,
}) => {
  return (
    <View className=" w-[33%]  px-2 py-2  flex justify-center items-center">
      <Pressable
        onPress={onPress}
        className="w-full h-32 rounded-xl p-3 shadow-sm items-center"
      >
        <Animated.Image
          style={{ width: 64, height: 64 }}
          source={require("../../assets/badges/badge-unachieved.png")}
          sharedTransitionTag={`badge-image-${badge.badgeId}`}
        />
        <Text
          style={{ fontSize: 12 }}
          className="font-semibold text-center mt-2 text-gray-400"
        >
          {badge.badgeName}
        </Text>
      </Pressable>
    </View>
  );
};

export default BadgeItem;
