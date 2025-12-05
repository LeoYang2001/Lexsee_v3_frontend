import { RecallAccuracy } from "../types/common/RecallAccuracy";

interface ReviewInput {
  review_interval: number; // days
  ease_factor: number; // starts around 2.5
  recall_accuracy: RecallAccuracy;
}

interface ReviewOutput {
  next_due: Date;
  review_interval: number;
  ease_factor: number;
}

export function getNextReview(input: ReviewInput): ReviewOutput {
  const { review_interval, ease_factor, recall_accuracy } = input;

  let newEase = ease_factor;
  let newInterval = review_interval;

  switch (recall_accuracy) {
    case "poor":
      // Forgot → reset interval, decrease ease
      newInterval = 1;
      newEase = Math.max(1.3, newEase - 0.2);
      break;

    case "fair":
      // Hard recall → same, ease down
      newInterval = review_interval;
      newEase = Math.max(1.3, newEase - 0.15);
      break;

    case "good":
      // Normal recall → use ease factor as multiplier
      newInterval = Math.max(1, Math.round(review_interval * newEase));
      // no change to ease
      break;

    case "excellent":
      // Very easy → boost interval and ease
      newInterval = Math.max(1, Math.round(review_interval * newEase * 1.3));
      newEase = newEase + 0.15;
      break;
  }

  // Calculate next review date
  const newNextDue = new Date();
  newNextDue.setDate(newNextDue.getDate() + newInterval);

  // console.log removed for production
  return {
    next_due: newNextDue,
    review_interval: newInterval,
    ease_factor: newEase,
  };
}

export function calculateStreak(allSchedules: any) {
  // Convert the array into a map for O(1) lookup
  const scheduleMap: Record<string, any> = {};
  allSchedules.forEach((s: any) => {
    scheduleMap[s.scheduleDate] = s;
  });

  let streak = 0;

  // Start from today's date
  let currentDate = new Date();
  const todayStr = currentDate.toISOString().split("T")[0];

  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const schedule = scheduleMap[dateStr];

    if (!schedule) {
      // No schedule today, move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    const isReviewed = schedule.reviewedCount > 0;
    const isToday = dateStr === todayStr;

    if (!isReviewed) {
      if (isToday) {
        // Today is allowed to be unreviewed → do NOT break streak
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      } else {
        // Past unreviewed schedule breaks streak
        break;
      }
    }

    // Count reviewed schedule day
    streak++;

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}
