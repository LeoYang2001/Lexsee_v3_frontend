import * as Notifications from "expo-notifications";
import { client } from "../app/client";
import { UserProfile } from "../store/slices/profileSlice";

/**
 * Create or get a ReviewSchedule for a specific date
 * Return the ReviewSchedule object and a boolean indicating if it was created
 */
const getOrCreateReviewSchedule = async (
  userProfileId: string,
  scheduleDate: string,
) => {
  try {
    // Check if schedule already exists for this date
    const existing = await (
      client as any
    ).models.ReviewSchedule.listReviewSchduleByUserProfileId({
      userProfileId: userProfileId,
      filter: {
        scheduleDate: { eq: scheduleDate },
      },
      limit: 1000,
    });

    if (existing.data && existing.data.length > 0) {
      console.log(`✅ Found existing schedule for ${scheduleDate}`);
      return {
        schedule: existing.data[0],
        created: false,
      };
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

    return {
      schedule: newSchedule.data,
      created: true,
    };
  } catch (error) {
    console.error(
      `❌ Error getting/creating schedule for ${scheduleDate}:`,
      error,
    );
    return null;
  }
};
/**
 * Updated handleScheduleNotification for new schema
 * Schedules a word for a future review date
 */
export const handleScheduleNotification = async (
  userProfile: UserProfile,
  wordId: string | undefined,
  next_due: Date,
): Promise<boolean> => {
  if (!wordId) {
    console.error("❌ wordId is undefined");
    return false;
  }

  if (!userProfile || !userProfile.userId || !userProfile.id) {
    console.error("❌ Missing profile data");
    return false;
  }

  // to schedule a word based the next_due date
  // 1. create a reviewScheduleWord
  // 2. push the reviewScheduleWord to the reviewSchedule of that date
  //.     2.1 if reviewSchedule of that date does not exist, create one
  // set notification for that date
  //.     2.2 if reviewScheduleWord already exists in that date, skip
  // overwrite with the same notificationId if exists

  try {
    const userProfileId = userProfile.id;
    const nextDueDate = new Date(next_due).toISOString().split("T")[0];

    // Step 1: create a reviewScheduleWord
    const scheduleWordEntity = await (
      client as any
    ).models.ReviewScheduleWord.create({
      reviewScheduleId: "to_be_set", // placeholder, will set later
      wordId,
      status: "TO_REVIEW",
    });

    console.log(`✅ Added word ${wordId} to schedule`);
    console.log("scheduleWordEntity: ", JSON.stringify(scheduleWordEntity));
    console.log(
      `🔍 DEBUG - scheduleWordEntity.data.id: ${scheduleWordEntity?.data?.id}`,
    );

    // Step 2:  push the reviewScheduleWord to the reviewSchedule of that date
    // 2.1 if reviewSchedule of that date does not exist, create one
    // 2.2 if reviewScheduleWord already exists in that date, skip
    // set notification for that date
    // overwrite with the same notificationId if exists

    // 2.2 if reviewScheduleWord already exists in that date, skip
    const { schedule, created } = (await getOrCreateReviewSchedule(
      userProfileId,
      nextDueDate,
    )) as { schedule: any; created: boolean };

    // if existed, overwrite the notification with the same notificationId
    // if just created, set a notification
    if (!created) {
      // existed schedule,  overwrite the notification with the same notificationId
      const wordsCount = schedule.toBeReviewedCount - schedule.reviewedCount; // get current count
      console.log("try to schedule on next_due", next_due);
      const notificationId = await setSchedule(wordsCount + 1, next_due);
      console.log(`🔍 DEBUG - overwrite notificationId: ${notificationId}`);

      // update schedule
      await (client as any).models.ReviewSchedule.update({
        id: schedule.id,
        toBeReviewedCount: wordsCount + 1,
        totalWords: schedule.totalWords + 1,
      });
    } else {
      // just created schedule, set a notification
      const notificationId = await setSchedule(1, next_due);
      console.log(`🔍 DEBUG - First notificationId: ${notificationId}`);

      // update schedule with new notificationId
      await (client as any).models.ReviewSchedule.update({
        id: schedule.id,
        notificationId,
        toBeReviewedCount: 1,
        totalWords: 1,
      });
    }

    // last! push the reviewScheduleWord to the reviewSchedule of that date
    console.log(
      `🔍 DEBUG - Updating ReviewScheduleWord ${scheduleWordEntity.data.id} with reviewScheduleId: ${schedule.id}`,
    );
    await (client as any).models.ReviewScheduleWord.update({
      id: scheduleWordEntity.data.id,
      reviewScheduleId: schedule.id,
    });

    console.log(`✅ Successfully completed scheduling for word ${wordId}`);
    return true;
  } catch (error) {
    console.error("❌ Error in handleScheduleNotification:", error);
    return false;
  }
};

// - [ ] UNCOLLECT A WORD

// 4. Delete the word
//     1. Remove from wordlist
//     2. Delete the word

/**
 * Uncollect a word and update schedules/notifications accordingly
 */
export const uncollectWord = async (
  wordId: string,
  scheduleWord: any,
  schedule: any,
): Promise<boolean> => {
  try {
    // 1. Get the review entity to get the review schedule based on date

    // 1.2  Second, get the review schedule id from the entity
    if (scheduleWord.id) {
      console.log(
        `🔍 DEBUG - Fetching schedule with id: ${scheduleWord.reviewScheduleId}`,
      );

      const scheduleWordsCount = schedule.totalWords;
      console.log(`🔍 DEBUG - Total words in schedule: ${scheduleWordsCount}`);
      // 2.1 If there’s only one entity
      //     1. Cancel notification
      //     2. Delete entity & schedule
      if (scheduleWordsCount === 1) {
        console.log(
          `🔍 DEBUG - Only one word in schedule, deleting entire schedule`,
        );

        if (schedule?.notificationId) {
          console.log(
            `🔍 DEBUG - Canceling notification: ${schedule.notificationId}`,
          );
          await Notifications.cancelScheduledNotificationAsync(
            schedule.notificationId,
          );
          console.log(
            `🔕 Canceled notification ${schedule.notificationId} for schedule`,
          );
        }

        // delete entity
        console.log(
          `🔍 DEBUG - Deleting ReviewScheduleWord entity: ${scheduleWord.id}`,
        );
        await (client as any).models.ReviewScheduleWord.delete({
          id: scheduleWord.id,
        });
        console.log(`🗑️ Deleted ReviewScheduleWord entity ${scheduleWord.id}`);

        // delete schedule
        console.log(`🔍 DEBUG - Deleting ReviewSchedule: ${schedule.id}`);
        await (client as any).models.ReviewSchedule.delete({
          id: schedule.id,
        });
        console.log(`🗑️ Deleted ReviewSchedule ${schedule.id}`);
      }
      //2.2 If there’s more than one entity
      else {
        console.log(
          `🔍 DEBUG - More than one entity in schedule${JSON.stringify(schedule)}`,
        );
        // more than one entity, just delete the entity
        await (client as any).models.ReviewScheduleWord.delete({
          id: scheduleWord.id,
        });
        // update notification & schedule counts
        const cur_totalWords = schedule.totalWords;
        const cur_tobeReviewedCount = schedule.toBeReviewedCount;
        console.log(`🔍 DEBUG - Current totalWords: ${cur_totalWords}`);
        console.log(
          `🔍 DEBUG - Current toBeReviewedCount: ${cur_tobeReviewedCount}`,
        );
        console.log(`🔍 DEBUG - New totalWords will be: ${cur_totalWords - 1}`);
        console.log(
          `🔍 DEBUG - New toBeReviewedCount will be: ${cur_tobeReviewedCount - 1}`,
        );

        await (client as any).models.ReviewSchedule.update({
          id: schedule.id,
          toBeReviewedCount: cur_tobeReviewedCount - 1,
          totalWords: cur_totalWords - 1,
        });
        console.log(`✅ Updated schedule counts after uncollecting word`);

        // overwrite notification with the same notificationID
        if (schedule.notificationId) {
          const newNotificationDate = new Date(schedule.scheduleDate);
          console.log(
            `🔍 DEBUG - Setting new notification for ${cur_tobeReviewedCount - 1} words at ${newNotificationDate}`,
          );
          const newNotificationId = await setSchedule(
            cur_tobeReviewedCount - 1,
            newNotificationDate,
          );
          console.log(`🔍 DEBUG - New notification ID: ${newNotificationId}`);
        }
      }
    }
    return true;
  } catch (error) {
    console.error("❌ Error in uncollectWord:", error);
    return false;
  }
};

/**
 * Schedule notification for a specific date
 */
export const setSchedule = async (
  wordsCount: number,
  next_due: Date,
): Promise<string | null> => {
  if (!next_due || !(next_due instanceof Date) || isNaN(next_due.getTime())) {
    console.error("❌ [setSchedule] Invalid date provided:", next_due);
    return null;
  }

  console.log("try to schedule in function setSchedule nextdue:", next_due);

  try {
    const notificationContent = {
      title: "Time to Review!",
      body:
        wordsCount > 1
          ? `You have ${wordsCount} words to review.`
          : `You have one word to review today!`,
    };

    const scheduledYear = next_due.getFullYear();
    const scheduledMonth = next_due.getMonth() + 1;
    const scheduledDay = next_due.getUTCDate();
    const scheduledHour = 9;
    const scheduledMinute = 0;

    const notificationId = `review-${scheduledYear}-${scheduledMonth}-${scheduledDay}`;

    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: scheduledYear,
      month: scheduledMonth,
      day: scheduledDay,
      hour: scheduledHour,
      minute: scheduledMinute,
      repeats: false,
    };

    // --- LOGGING THE LOCAL TIME ---
    console.log(
      `⏰ [setSchedule] Notification scheduled for local time: ${scheduledYear}-${scheduledMonth}-${scheduledDay} at ${scheduledHour}:00`,
    );

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: notificationContent,
      trigger,
    });

    return identifier;
  } catch (error: any) {
    console.error("❌ [setSchedule] Error:", error.message);
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
  recall_accuracy: "poor" | "fair" | "good" | "excellent",
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
      `📊 Updated metrics for word ${wordId}: interval=${newInterval}, easeFactor=${newEaseFactor.toFixed(2)}`,
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

export const checkScheduledNotifications = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  if (scheduled.length === 0) {
    console.log("📭 No notifications scheduled.");
    return;
  }

  console.log(`📅 Found ${scheduled.length} scheduled notification(s):`);

  scheduled.forEach((notif, index) => {
    console.log(`--- Notification #${index + 1} ---`);
    console.log(`ID: ${notif.identifier}`);
    console.log(`Title: ${notif.content.title}`);
    console.log(`Trigger:`, JSON.stringify(notif.trigger, null, 2));
  });
};

export const cleanAllNotifications = async () => {
  try {
    console.log("🧹 [Notifications] Clearing all scheduled notifications...");
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("✅ [Notifications] All notifications cleared.");
  } catch (error) {
    console.error("❌ [Notifications] Failed to clear notifications:", error);
  }
};
