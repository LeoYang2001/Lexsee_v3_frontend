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

  console.log("algorithm result: ", review_interval, ease_factor);
  return {
    next_due: newNextDue,
    review_interval: newInterval,
    ease_factor: newEase,
  };
}
