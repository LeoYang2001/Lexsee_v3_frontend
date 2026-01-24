import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { useAppSelector } from '../store/hooks'
import { getLocalDate } from '../util/utli';

const calculateSrsStreak = (sortedSchedules: any[], todayStr: string) => {
  let streak = 0;

  for (const schedule of sortedSchedules) {
    // Skip future schedules
    if (schedule.scheduleDate > todayStr) continue;

    const isFinished = schedule.totalWords > 0 && 
                       schedule.reviewedCount === schedule.totalWords;

    if (isFinished) {
      streak++;
    } else {
      // If the user hasn't finished TODAY yet, don't break the streak.
      // But if we hit a PAST date that isn't finished, the streak stops.
      if (schedule.scheduleDate === todayStr) continue; 
      
      break; 
    }
  }
  return streak;
};

const useStreak = () => {

    const currentDate = getLocalDate()

    const incomingSchedules = useAppSelector(state => state.reviewSchedule.items)
    const pastSchedules = useAppSelector(state => state.completedReviewSchedules.items)

    // Combine incoming and past schedules and sort them by scheduleDate from latest to earliest
    const allTimeSchedules = [...incomingSchedules, ...pastSchedules].sort((a, b) => new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime())
    console.log(calculateSrsStreak(allTimeSchedules, currentDate))

    
  return calculateSrsStreak(allTimeSchedules, currentDate)
}

export default useStreak