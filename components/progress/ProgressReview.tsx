import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { ArcGauge } from "./ArcGauge";
import { getLocalDate } from "../../util/utli";

interface ProgressReviewProps {
  selectedIso?: string | null;
  allSchedules: any[];
}

export interface ProgressReviewData {
  reviewedWords: number;
  totalWords: number;
  completionRate: number;
  accuracy: number;
}

const ProgressReview: React.FC<ProgressReviewProps> = ({
  allSchedules,
  selectedIso,
}) => {
 
  const [progressData, setProgressData] = useState<ProgressReviewData | null>(
    null
  );

  const [isIncoming, setIsIncoming] = useState(false)
  
  useEffect(() => {

    setProgressData(null);

    setIsIncoming(false);

    const currentDate = getLocalDate();

   
    
    
    const scheduleForSelectedDate = allSchedules.find(
      (schedule) => schedule.scheduleDate === selectedIso
    );
    if (scheduleForSelectedDate) {
      setProgressData({
        reviewedWords: scheduleForSelectedDate.reviewedCount,
        totalWords: scheduleForSelectedDate.totalWords,
        // should only accurate to 1 decimal place
        completionRate: Math.round(100* (scheduleForSelectedDate.reviewedCount / scheduleForSelectedDate.totalWords) * 10) / 10,
        accuracy: Math.round(100 * (scheduleForSelectedDate.successRate / (5 * scheduleForSelectedDate.reviewedCount)) * 10) / 10,
      });

    } else {
      setProgressData(null);
    }

     if(selectedIso && currentDate && selectedIso > currentDate)
    {
      // if the selected date is in the future, mark it as incoming
      setIsIncoming(true)
      return 
    }
  }, [selectedIso, allSchedules])
  
  

  const IncomingView = () => (
    <View className="py-6 items-center  h-full justify-center">
      <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
        {progressData?.totalWords} words are scheduled for this day
      </Text>
      {selectedIso && (
        <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
          {selectedIso}
        </Text>
      )}
    </View>
  );

  const OverdueView = () => (
    <View className="py-6 items-center  flex  text-center h-full justify-center">
      <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
        {progressData?.totalWords} words were scheduled for this day, 
      </Text>
      <Text className=" mt-2" style={{ color: "#9CA3AF", fontSize: 15 }}>
        unfortunately you didn't finish reviewing them.
      </Text>
    </View>
  );

  if(isIncoming && progressData) {
    return <IncomingView />;
  }

  if(progressData && progressData?.reviewedWords < progressData?.totalWords) {
    return <OverdueView />;
  }

  return (
    <View className="w-full h-full">
      {/* loading state */}
      {!progressData ? (
        // no scheduled words for this day
        <View className="py-6 items-center  h-full justify-center">
              <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
                No words scheduled for this day
              </Text>
          {selectedIso && (
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
              {selectedIso}
            </Text>
          )}
        </View>
      ) : (
        // show gauge + stats
        <View className="flex    h-full  items-center   flex-row ">
          <View className="flex-1 h-full  flex justify-center items-center p-3">
            <ArcGauge
              value1={progressData.completionRate}
              value2={progressData.accuracy}
            />
          </View>
          <View className=" w-[50%] h-full pl-12  flex flex-col justify-center gap-6 items-start  p-3">
            <View>
              <View className=" flex flex-row justify-start items-baseline gap-1">
                <Text
                  className="font-semibold"
                  style={{ fontSize: 24, color: "white", lineHeight: 36 }}
                >
                  {progressData.reviewedWords}
                </Text>
                <Text
                  className="text-white opacity-40"
                  style={{
                    fontSize: 12,
                    color: "white",
                    marginBottom: 2,
                  }}
                >
                  /{progressData.totalWords}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "white", opacity: 0.4 }}>
                Completion
              </Text>
            </View>
            <View>
              <View className=" flex flex-row justify-start items-baseline gap-1">
                <Text
                  className="font-semibold"
                  style={{ fontSize: 24, color: "white", lineHeight: 36 }}
                >
                  {progressData.accuracy}
                </Text>
                <Text
                  className="text-white opacity-40"
                  style={{
                    fontSize: 12,
                    color: "white",
                    marginBottom: 2,
                  }}
                >
                  %
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "white", opacity: 0.4 }}>
                Accuracy
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProgressReview;
