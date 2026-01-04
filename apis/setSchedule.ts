import * as Notifications from "expo-notifications";
import { ProfileState } from "../store/slices/profileSlice";
import { client } from "../app/client";

/**
 * Create or get a ReviewSchedule for a specific date
 */
const getOrCreateReviewSchedule = async (
  userProfileId: string,
  scheduleDate: string
) => {
  try {
    // Check if schedule already exists for this date
    const existing = await (client as any).models.ReviewSchedule.list({
      filter: {
        and: [
          { userProfileId: { eq: userProfileId } },
          { scheduleDate: { eq: scheduleDate } },
        ],
      },
    });

    if (existing.data && existing.data.length > 0) {
      console.log(`✅ Found existing schedule for ${scheduleDate}`);
      return existing.data[0];
    }

    // Create new schedule for this date
    console.log(`📅 Creating new schedule for ${scheduleDate}`);
    const newSchedule = await (client as any).models.ReviewSchedule.create({
      userProfileId,
      scheduleDate,
      toBeReviewedCount: 0,
      reviewedCount: 0,
      totalWords: 0,
    });

    return newSchedule.data;
  } catch (error) {
    console.error(
      `❌ Error getting/creating schedule for ${scheduleDate}:`,
      error
    );
    return null;
  }
};

/**
 * Create a ReviewScheduleWord entry
 */
const addWordToSchedule = async (reviewScheduleId: string, wordId: string) => {
  try {
    const scheduleWord = await (client as any).models.ReviewScheduleWord.create(
      {
        reviewScheduleId,
        wordId,
        status: "TO_REVIEW",
      }
    );

    console.log(`✅ Added word ${wordId} to schedule`);
    return scheduleWord.data;
  } catch (error) {
    console.error(`❌ Error adding word ${wordId} to schedule:`, error);
    return null;
  }
};

/**
 * Check if word already exists in schedule
 */
const wordExistsInSchedule = async (
  reviewScheduleId: string,
  wordId: string
): Promise<boolean> => {
  try {
    const result = await (client as any).models.ReviewScheduleWord.list({
      filter: {
        and: [
          { reviewScheduleId: { eq: reviewScheduleId } },
          { wordId: { eq: wordId } },
        ],
      },
    });

    return result.data && result.data.length > 0;
  } catch (error) {
    console.error("❌ Error checking if word exists in schedule:", error);
    return false;
  }
};

/**
 * Remove word from today's schedule (after review)
 */
const removeWordFromTodaysSchedule = async (
  userProfileId: string,
  wordId: string
): Promise<boolean> => {
  try {
    const currentDate = new Date().toISOString().split("T")[0];

    // Get today's schedule
    const todaysSchedule = await (client as any).models.ReviewSchedule.list({
      filter: {
        and: [
          { userProfileId: { eq: userProfileId } },
          { scheduleDate: { eq: currentDate } },
        ],
      },
    });

    if (!todaysSchedule.data || todaysSchedule.data.length === 0) {
      console.warn("⚠️ No schedule found for today");
      return false;
    }

    const schedule = todaysSchedule.data[0];

    // Find and delete the ReviewScheduleWord entry
    const scheduleWords = await (client as any).models.ReviewScheduleWord.list({
      filter: {
        and: [
          { reviewScheduleId: { eq: schedule.id } },
          { wordId: { eq: wordId } },
        ],
      },
    });

    if (scheduleWords.data && scheduleWords.data.length > 0) {
      const scheduleWord = scheduleWords.data[0];
      await (client as any).models.ReviewScheduleWord.delete({
        id: scheduleWord.id,
      });

      console.log(`✅ Removed word ${wordId} from today's schedule`);

      // Update schedule counts
      await updateScheduleCounts(schedule.id);
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error removing word from schedule:", error);
    return false;
  }
};

/**
 * Update schedule counts (totalWords, toBeReviewedCount, reviewedCount)
 */
const updateScheduleCounts = async (reviewScheduleId: string) => {
  try {
    const scheduleWords = await (client as any).models.ReviewScheduleWord.list({
      filter: {
        reviewScheduleId: { eq: reviewScheduleId },
      },
    });

    const words = scheduleWords.data || [];
    const toBeReviewedCount = words.filter(
      (w: any) => w.status === "TO_REVIEW"
    ).length;
    const reviewedCount = words.filter(
      (w: any) => w.status === "REVIEWED"
    ).length;
    const totalWords = words.length;

    await (client as any).models.ReviewSchedule.update({
      id: reviewScheduleId,
      totalWords,
      toBeReviewedCount,
      reviewedCount,
    });

    console.log(
      `✅ Updated schedule counts: ${toBeReviewedCount} to review, ${reviewedCount} reviewed`
    );
  } catch (error) {
    console.error("❌ Error updating schedule counts:", error);
  }
};

/**
 * Updated handleScheduleNotification for new schema
 * Schedules a word for a future review date
 */
export const handleScheduleNotification = async (
  userProfile: ProfileState,
  wordId: string | undefined,
  next_due: Date
): Promise<boolean> => {
  if (!wordId) {
    console.error("❌ wordId is undefined");
    return false;
  }

  if (
    !userProfile.profile ||
    !userProfile.profile.userId ||
    !userProfile.profile.id
  ) {
    console.error("❌ Missing profile data");
    return false;
  }

  try {
    const userProfileId = userProfile.profile.id;
    const nextDueDate = new Date(next_due).toISOString().split("T")[0];

    console.log(`📅 Scheduling word ${wordId} for ${nextDueDate}`);

    // Step 1: Get or create ReviewSchedule for the next due date
    const schedule = await getOrCreateReviewSchedule(
      userProfileId,
      nextDueDate
    );
    if (!schedule) {
      console.error("❌ Failed to create/get schedule");
      return false;
    }

    // Step 2: Check if word already exists in this schedule
    const exists = await wordExistsInSchedule(schedule.id, wordId);
    if (exists) {
      console.warn(`⚠️ Word ${wordId} already scheduled for ${nextDueDate}`);
      return true;
    }

    // Step 3: Add word to the schedule
    const scheduleWord = await addWordToSchedule(schedule.id, wordId);
    if (!scheduleWord) {
      console.error("❌ Failed to add word to schedule");
      return false;
    }

    // Step 4: Update schedule counts
    await updateScheduleCounts(schedule.id);

    // Step 5: Set/update notification for this date
    const notificationId = await setSchedule(
      schedule.toBeReviewedCount || 1,
      next_due
    );

    if (notificationId) {
      // Cancel old notification if it exists
      if (schedule.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          schedule.notificationId
        );
        console.log("🔔 Cancelled old notification");
      }

      // Update schedule with new notification ID
      await (client as any).models.ReviewSchedule.update({
        id: schedule.id,
        notificationId: notificationId,
      });

      console.log("✅ Scheduled notification for", nextDueDate);
    }

    return true;
  } catch (error) {
    console.error("❌ Error in handleScheduleNotification:", error);
    return false;
  }
};

/**
 * Handle completing a word review and scheduling next review
 */
export const handleScheduleAndCleanup = async (
  userProfile: ProfileState,
  wordId: string | undefined,
  next_due: Date
): Promise<boolean> => {
  if (!wordId) {
    console.error("❌ wordId is undefined");
    return false;
  }

  if (!userProfile.profile || !userProfile.profile.id) {
    console.error("❌ Missing profile data");
    return false;
  }

  try {
    const userProfileId = userProfile.profile.id;

    console.log(`🔄 Handling review completion for word ${wordId}`);

    // Step 1: Remove word from today's schedule
    await removeWordFromTodaysSchedule(userProfileId, wordId);

    // Step 2: Schedule for next review
    const scheduled = await handleScheduleNotification(
      userProfile,
      wordId,
      next_due
    );

    if (scheduled) {
      console.log("✅ Word review completed and rescheduled");
      return true;
    } else {
      console.error("❌ Failed to reschedule word");
      return false;
    }
  } catch (error) {
    console.error("❌ Error in handleScheduleAndCleanup:", error);
    return false;
  }
};

/**
 * Schedule notification for a specific date
 */
export const setSchedule = async (
  wordsCount: number,
  next_due: Date
): Promise<string | null> => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review!",
        body: `You have ${wordsCount} word(s) to review.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next_due,
      },
    });

    console.log(`🔔 Notification scheduled with ID: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error("❌ Error scheduling notification:", error);
    return null;
  }
};

/**
 * Update word's spaced repetition metrics
 */
export const updateWordSpacedRepetition = async (
  wordId: string,
  review_interval: number,
  ease_factor: number,
  recall_accuracy: "poor" | "fair" | "good" | "excellent"
): Promise<boolean> => {
  try {
    // Calculate new SM-2 metrics based on recall accuracy
    const scoreMap = {
      poor: 0,
      fair: 2,
      good: 4,
      excellent: 5,
    };

    const score = scoreMap[recall_accuracy];

    // SM-2 algorithm
    let newEaseFactor =
      ease_factor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02);
    newEaseFactor = Math.max(1.3, newEaseFactor); // Min ease factor is 1.3

    let newInterval: number;
    if (score < 3) {
      newInterval = 1; // Reset to 1 day
    } else if (review_interval === 1) {
      newInterval = 3; // After first review, jump to 3 days
    } else {
      newInterval = Math.round(review_interval * newEaseFactor);
    }

    console.log(
      `📊 Updated metrics for word ${wordId}: interval=${newInterval}, easeFactor=${newEaseFactor.toFixed(2)}`
    );

    // Update word with new metrics
    await (client as any).models.Word.update({
      id: wordId,
      review_interval: newInterval,
      ease_factor: newEaseFactor,
    });

    return true;
  } catch (error) {
    console.error("❌ Error updating spaced repetition:", error);
    return false;
  }
};
