import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { client } from "../../app/client";
import { calculateStreak } from "../../lib/reviewAlgorithm";
import { ReviewScheduleData } from "../../store/slices/reviewScheduleSlice";

type ReviewStatus = "review_begin" | "review_in_progress" | "viewProgress";

interface ReviewStatusDisplayProps {
  reviewStatus: ReviewStatus;
  todayStats: {
    totalToReview: number;
    reviewedCount: number;
    toBeReviewedCount: number;
  };
  totalWords: number;
  onToggleExpand: () => void;
}

const ReviewStatusDisplay: React.FC<ReviewStatusDisplayProps> = ({
  reviewStatus,
  todayStats,
  totalWords,
  onToggleExpand,
}) => {
    const userProfile = useAppSelector((state) => state.profile.profile);
  
 const [allSchedules, setAllSchedules] = useState<ReviewScheduleData[]>([]);

 const [isCalculating, setIsCalculating] = useState(true);
 const [streak, setStreak] = useState(0);



   // Fetch all schedules
   useEffect(() => {
     const fetchAllSchedules = async () => {
       try {
         if (!userProfile?.id) {
           console.warn("⚠️ No user profile for fetching schedules");
           return;
         }
 
 
         const result = await (client.models as any).ReviewSchedule.list({
           filter: {
             userProfileId: { eq: userProfile.id },
           },
         });
 
         if (result.data && result.data.length > 0) {
           const cleanedSchedules = result.data
             .map((schedule: any) => ({
               id: schedule.id,
               scheduleDate: schedule.scheduleDate,
               totalWords: schedule.totalWords || 0,
               toBeReviewedCount: schedule.toBeReviewedCount || 0,
               reviewedCount: schedule.reviewedCount || 0,
               successRate: schedule.successRate || 0,
               scheduleWords: schedule.scheduleWords || [],
             }))
             .sort(
               (a: ReviewScheduleData, b: ReviewScheduleData) =>
                 new Date(b.scheduleDate).getTime() -
                 new Date(a.scheduleDate).getTime()
             );
 
        
           setAllSchedules(cleanedSchedules);
         } else {
           console.log("📅 No schedules found");
           setAllSchedules([]);
         }
       } catch (error) {
         console.error("❌ Error fetching schedules:", error);
       } finally {
        //  setIsLoading(false);
       }
     };
 
     fetchAllSchedules()
   }, [userProfile?.id]);



    useEffect(() => {
       if (allSchedules.length > 0) {
         const calculatedStreak = calculateStreak(allSchedules);
         console.log('calculatedStreak:', calculatedStreak);
         setStreak(calculatedStreak);
         setIsCalculating(false);
       }
     }, [allSchedules]);
   
  return (
    <TouchableOpacity
      className=" w-full h-full flex items-center justify-center px-6"
      onPress={onToggleExpand}
    >
      {reviewStatus === "review_begin" && (
        <View className=" w-full  h-full flex  flex-col justify-center items-start">
          <View className=" flex flex-row items-baseline ">
            <Text
              className="font-semibold"
              style={{ fontSize: 32, color: "white" }}
            >
              {todayStats.toBeReviewedCount}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                marginLeft: 6,
                marginBottom: 2,
              }}
            >
              {todayStats.toBeReviewedCount === 1
                ? "Word to review"
                : "Words to review"}
            </Text>
          </View>
        </View>
      )}

      {reviewStatus === "review_in_progress" && (
        <View
          className="  w-full h-full justify-center items-start px-0"
          style={{ flexDirection: "column" }}
        >
          <View className=" flex flex-row justify-center items-baseline gap-1">
            <Text
              className="font-semibold"
              style={{ fontSize: 32, color: "white", lineHeight: 36 }}
            >
              {todayStats.reviewedCount}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                marginLeft: 4,
                marginBottom: 2,
              }}
            >
              /{todayStats.totalToReview} words reviewed
            </Text>
          </View>
        </View>
      )}

      {reviewStatus === "viewProgress" && (
        <View className=" flex flex-col w-full h-full  items-start justify-center">
          {
            isCalculating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
             <View className=" flex flex-row justify-center items-baseline gap-1">
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: "white", lineHeight: 32 }}
            >
              {streak}
            </Text>
            <Text
              className="text-white opacity-80"
              style={{
                fontSize: 12,
                color: "white",
                lineHeight: 14,
                marginTop: 4,
              }}
            >
              days streak
            </Text>
          </View>
            )
          }
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ReviewStatusDisplay;
