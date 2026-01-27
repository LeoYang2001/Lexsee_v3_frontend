import { RecallAccuracy } from "../types/common/RecallAccuracy";
import { getLocalDate } from "../util/utli";

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

  console.log("📊 getNextReview - Input:", {
    review_interval,
    ease_factor,
    recall_accuracy,
  });

  let newEase = ease_factor;
  let newInterval = review_interval;

  switch (recall_accuracy) {
    case "poor":
      // Forgot → reset interval, decrease ease
      console.log("  ├─ 😞 POOR recall - resetting interval to 1, decreasing ease");
      newInterval = 1;
      newEase = Math.max(1.3, newEase - 0.2);
      console.log(`  ├─ newInterval: ${newInterval}, newEase: ${newEase.toFixed(2)}`);
      break;

    case "fair":
      // Hard recall → same, ease down
      console.log("  ├─ 😐 FAIR recall - keeping interval, decreasing ease");
      newInterval = review_interval;
      newEase = Math.max(1.3, newEase - 0.15);
      console.log(`  ├─ newInterval: ${newInterval}, newEase: ${newEase.toFixed(2)}`);
      break;

    case "good":
      // Normal recall → use ease factor as multiplier
      console.log("  ├─ 🙂 GOOD recall - multiplying interval by ease factor");
      const calculatedInterval = review_interval * newEase;
      newInterval = Math.max(1, Math.round(calculatedInterval));
      console.log(`  ├─ ${review_interval} × ${newEase.toFixed(2)} = ${calculatedInterval.toFixed(2)} → ${newInterval} days`);
      // no change to ease
      break;

    case "excellent":
      // Very easy → boost interval and ease
      console.log("  ├─ 😄 EXCELLENT recall - boosting interval and ease");
      const boostedInterval = review_interval * newEase * 1.3;
      newInterval = Math.max(1, Math.round(boostedInterval));
      newEase = newEase + 0.15;
      console.log(`  ├─ ${review_interval} × ${ease_factor.toFixed(2)} × 1.3 = ${boostedInterval.toFixed(2)} → ${newInterval} days`);
      console.log(`  ├─ newEase: ${ease_factor.toFixed(2)} + 0.15 = ${newEase.toFixed(2)}`);
      break;
  }

  // Calculate next review date
  const currentDate = getLocalDate();
  const newNextDue = new Date(currentDate);
  newNextDue.setDate(newNextDue.getDate() + newInterval);

  console.log(`  ├─ 📅 Current date: ${currentDate}`);
  console.log(`  ├─ ➕ Adding ${newInterval} days`);
  console.log(`  └─ 📌 Next due: ${newNextDue.toISOString().split('T')[0]}`);

  const output = {
    next_due: newNextDue,
    review_interval: newInterval,
    ease_factor: newEase,
  };

  console.log("✅ getNextReview - Output:", {
    next_due: output.next_due.toISOString().split('T')[0],
    review_interval: output.review_interval,
    ease_factor: output.ease_factor.toFixed(2),
  });

  return output;
}

export function calculateStreak(allSchedules: any) {
  // Guard
  if (!Array.isArray(allSchedules) || allSchedules.length === 0) return 0;

  // allSchedules is expected sorted from latest -> oldest
  const todayStr = new Date().toISOString().split("T")[0];
  let streak = 0;

  for (let i = 0; i < allSchedules.length; i++) {
    const s = allSchedules[i];
    if (!s) continue;

    // fully reviewed day increments streak
    if (s.reviewedCount === s.totalWords) {
      streak++;
      continue;
    }

    // if the latest entry is today's schedule and it's not reviewed yet,
    // keep counting past it (do not treat today's unreviewed as a break).
    if (s.scheduleDate === todayStr) {
      // skip today's unreviewed schedule and continue checking previous days
      continue;
    }

    // any past (non-today) non-complete schedule breaks the streak
    break;
  }

  return streak;
}

/**
 * Calculate learning score from completion and accuracy using
 * a weighted geometric mean.
 *
 * WHY geometric mean?
 * - Both completion AND accuracy must be good to get a high score
 * - One high value cannot fully compensate for the other being low
 * - This matches real learning: guessing through everything ≠ mastery
 *
 * completion, accuracy: numbers in range [0, 100]
 * wAcc: weight of accuracy importance (0.6–0.8 recommended)
 */
export function score_geo(completion: number, accuracy: number, wAcc = 0.7) {
  const c = Math.max(0, Math.min(1, completion / 100));
  const a = Math.max(0, Math.min(1, accuracy / 100));
  const wComp = 1 - wAcc;

  const s = Math.pow(a, wAcc) * Math.pow(c, wComp);
  return Math.round(100 * s);
}
