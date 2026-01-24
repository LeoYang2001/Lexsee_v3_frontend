import { View, Text } from 'react-native'
import React from 'react'
import useStreak from '../../hooks/useStreak';

interface ReviewStatusDisplayProps {
  reviewStatus: "review_begin" | "review_in_progress" | "viewProgress";
  stats: { pastCount: number, todayCount: number, total: number, completed: number }
}

const ReviewStatusDisplay = ({ reviewStatus, stats }: ReviewStatusDisplayProps) => {


  return (
     <View
      className=" w-full h-full flex items-start   justify-center px-6 "
    >
     {
      reviewStatus === "review_begin" ? (
        <Text className="text-white">
          <ReviewBeginView  stats={stats} />
        </Text>
      ) : reviewStatus === "review_in_progress" ? (
        <Text className="text-white">In Progress</Text>
      ) : (
          <ViewProgressView />
      )
     }
    </View>
  )
}

const ViewProgressView = () => {
  const streak = useStreak();
  
  return (
    //  onPress={checkScheduledNotifications}
   <View className='flex-row items-baseline gap-x-1'>
  <Text style={{ fontSize: 24 }} className="text-white">
    {streak}
  </Text>
  <Text style={{ fontSize: 12 }} className='text-white opacity-80'>
    -days streak
  </Text>
</View>
  );
};


const ReviewBeginView = ({ stats }: { stats: { pastCount: number, todayCount: number, total: number, completed: number } }) => {
  
  return (
    //  onPress={checkScheduledNotifications}
   <View className='flex-row items-baseline gap-x-1'>
  <Text style={{ fontSize: 24 }} className="text-white">
    {stats.total}
  </Text>
  <Text style={{ fontSize: 12 }} className='opacity-80 text-white'>
    words to review
  </Text>
</View>
  );
};


export default ReviewStatusDisplay