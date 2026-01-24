import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { ArrowRight, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ReviewStatus } from "../../store/selectors/todayReviewSelectors";


interface ReviewActionButtonProps {
  reviewStatus: ReviewStatus;
  statusColor: string;
  statusBgColor: string;
  statusLabel: string;
}

const ReviewActionButton: React.FC<ReviewActionButtonProps> = ({
  reviewStatus,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (reviewStatus === "viewProgress") {
      // Slide right animation
      router.push({
        pathname: "/(progress)",
      });
    } else {
      router.push("/(reviewQueue)");
    }
  };

  return (
    <View style={{ flex: 3, flexDirection: "row" }}>
      <View
        style={{
          width: 1,
          height: 12,
          backgroundColor: "#fff",
          opacity: 0.2,
          borderRadius: 1,
        }}
      />

      {/* Action Button */}
      <TouchableOpacity
        className="flex-1 h-full flex flex-row justify-center items-center"
        onPress={handlePress}
      >
        <View className="flex flex-col items-center ">
          {reviewStatus === "review_begin" && (
            <View
              className=" flex flex-row items-center gap-2
            "
            >
              <View className=" flex flex-row items-center">
                <Text
                  style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: "400",
                  }}
                >
                  Ready to review?
                </Text>
              </View>
              <ArrowRight color={"#fff"} size={22} />
            </View>
          )}

          {reviewStatus === "review_in_progress" && (
            <View className=" flex flex-row justify-center items-center gap-2">
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "400",
                }}
              >
                Keep going
              </Text>
              <ArrowRight color={"#fff"} size={22} />
            </View>
          )}

          {reviewStatus === "viewProgress" && (
            <View className=" flex flex-row justify-center items-center gap-2">
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "400",
                }}
              >
                View progress
              </Text>
              <ArrowRight color={"#fff"} size={22} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewActionButton;
