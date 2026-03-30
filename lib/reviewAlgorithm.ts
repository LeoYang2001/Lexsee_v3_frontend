import { RecallAccuracy } from "../types/common/RecallAccuracy";
import { getLocalDate } from "../util/utli";

interface ReviewInput {
  review_interval: number;
  ease_factor: number;
  recall_accuracy: RecallAccuracy;
  scheduledReviewDate: string;
}

interface ReviewOutput {
  next_due: string;
  review_interval: number;
  ease_factor: number;
}

function toLocalDateOnly(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDayDifference(current: Date, scheduled: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcCurrent = Date.UTC(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
  );
  const utcScheduled = Date.UTC(
    scheduled.getFullYear(),
    scheduled.getMonth(),
    scheduled.getDate(),
  );

  return Math.round((utcCurrent - utcScheduled) / msPerDay);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getNextReview(input: ReviewInput): ReviewOutput {
  const { review_interval, ease_factor, recall_accuracy, scheduledReviewDate } =
    input;

  let newEase = ease_factor;
  let newInterval = review_interval;

  // -----------------------------
  // 1. Base review logic
  // -----------------------------
  switch (recall_accuracy) {
    case "poor":
      newInterval = 1;
      newEase = Math.max(1.3, newEase - 0.2);
      break;

    case "fair":
      newInterval = review_interval;
      newEase = Math.max(1.3, newEase - 0.15);
      break;

    case "good": {
      const calculatedInterval = review_interval * newEase;
      newInterval = Math.max(1, Math.round(calculatedInterval));
      break;
    }

    case "excellent": {
      const boostedInterval = review_interval * newEase * 1.3;
      newInterval = Math.max(1, Math.round(boostedInterval));
      newEase = newEase + 0.15;
      break;
    }
  }

  // -----------------------------
  // 2. Late review adjustment
  // -----------------------------
  const currentDate = toLocalDateOnly(getLocalDate());
  const scheduledDate = toLocalDateOnly(scheduledReviewDate);

  const overdueDays = getDayDifference(currentDate, scheduledDate);

  if (overdueDays > 0) {
    console.log("late review occurs, discount reward");
    // How overdue relative to expected interval
    const overdueRatio = overdueDays / Math.max(1, review_interval);

    // Cap the penalty so it doesn't become absurd
    // Example:
    // 10% overdue => small penalty
    // 100% overdue => bigger penalty
    // capped at 35%
    const intervalPenalty = clamp(overdueRatio * 0.25, 0, 0.35);

    newInterval = Math.max(1, Math.round(newInterval * (1 - intervalPenalty)));

    // Optional: only slightly penalize ease if very overdue
    if (
      overdueRatio >= 0.5 &&
      (recall_accuracy === "good" || recall_accuracy === "excellent")
    ) {
      const easePenalty = clamp(overdueRatio * 0.05, 0, 0.15);
      newEase = Math.max(1.3, newEase - easePenalty);
    }
  }

  // -----------------------------
  // 3. Next due date
  // -----------------------------
  const newNextDue = new Date(currentDate);
  newNextDue.setDate(newNextDue.getDate() + newInterval);

  return {
    next_due: newNextDue.toISOString().split("T")[0],
    review_interval: newInterval,
    ease_factor: Number(newEase.toFixed(2)),
  };
}

interface SimulationResult {
  totalDaysElapsed: number;
  peakReviewsPerDay: number;
}

export function simulateMastery(
  wordsPerDay: number,
  totalWords: number,
  masteryInterval: number = 180,
): SimulationResult {
  let daysElapsed = 0;
  let masteredCount = 0;

  // Track each word: { nextDueDay, interval, ease, reviewsCount }
  let wordBank: {
    nextDueDay: number;
    interval: number;
    ease: number;
    reviews: number;
  }[] = [];
  let wordsIntroduced = 0;
  let maxReviewsInADay = 0;

  while (masteredCount < totalWords) {
    daysElapsed++;
    let reviewsToday = 0;

    // 1. Introduce new words at the start of the day
    if (wordsIntroduced < totalWords) {
      const remaining = totalWords - wordsIntroduced;
      const batchSize = Math.min(wordsPerDay, remaining);
      for (let i = 0; i < batchSize; i++) {
        // Initial interval is 0 so they are due "today"
        wordBank.push({
          nextDueDay: daysElapsed,
          interval: 0,
          ease: 2.5,
          reviews: 0,
        });
        wordsIntroduced++;
      }
    }

    // 2. Process all reviews due today
    for (let word of wordBank) {
      // Only review if word is due AND not yet mastered
      if (word.nextDueDay === daysElapsed && word.interval < masteryInterval) {
        reviewsToday++;
        word.reviews++;

        // Logic: Alternating 50/50 Good and Excellent
        if (word.reviews % 2 === 0) {
          // EXCELLENT path
          const boostedInterval = (word.interval || 1) * word.ease * 1.3;
          word.interval = Math.max(1, Math.round(boostedInterval));
          word.ease += 0.15;
        } else {
          // GOOD path
          const calculatedInterval = (word.interval || 1) * word.ease;
          word.interval = Math.max(1, Math.round(calculatedInterval));
        }

        // Schedule the next review date
        word.nextDueDay = daysElapsed + word.interval;

        // Check if this review pushed it into mastery
        if (word.interval >= masteryInterval) {
          masteredCount++;
        }
      }
    }

    // Track the busiest day
    maxReviewsInADay = Math.max(maxReviewsInADay, reviewsToday);

    // Safety break to prevent infinite loops in edge cases
    if (daysElapsed > 20000) break;
  }

  return {
    totalDaysElapsed: daysElapsed,
    peakReviewsPerDay: maxReviewsInADay,
  };
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
