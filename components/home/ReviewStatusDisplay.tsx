import { View, Text, TouchableOpacity } from 'react-native'
import React, { use } from 'react'
import useStreak from '../../hooks/useStreak';
import { checkScheduledNotifications } from '../../apis/setSchedule';

interface ReviewStatusDisplayProps {
  reviewStatus: "review_begin" | "review_in_progress" | "viewProgress";
  stats: { pastCount: number, todayCount: number, total: number, completed: number }
}

const ReviewStatusDisplay = ({ reviewStatus, stats }: ReviewStatusDisplayProps) => {


  return (
     <View
      className=" w-full h-full flex items-center justify-center px-6 "
    >
     {
      reviewStatus === "review_begin" ? (
        <Text className="text-white">Review Begin</Text>
      ) : reviewStatus === "review_in_progress" ? (
        <Text className="text-white">In Progress</Text>
      ) : (
        <View>
          <ViewProgressView />
        </View>
      )
     }
    </View>
  )
}

const ViewProgressView = () => {
  const streak = useStreak();
  
  return (
    <TouchableOpacity onPress={checkScheduledNotifications}>
      <Text className="text-white"><Text> {streak}</Text>-days streak</Text>
    </TouchableOpacity>
  );
};

export default ReviewStatusDisplay