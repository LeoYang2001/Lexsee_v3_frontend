import * as Notifications from "expo-notifications";
import { ProfileState } from "../store/slices/profileSlice";
import { client } from "../app/client";

// In your setSchedule.ts
export const updateProfileInDatabase = async (updatedProfile: any) => {
  try {
    const result = await (client as any).models.UserProfile.update({
      id: updatedProfile.id,
      schedule: updatedProfile.schedule, // This should be a JSON string
    });

    if (result.data) {
      console.log("✅ Profile updated in database successfully");
      const { wordsList, ...cleanProfile } = result.data;

      return cleanProfile;
    } else {
      console.error("❌ Failed to update profile in database");
      return null;
    }
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return null;
  }
};

export const handleScheduleAndCleanup = async (
  userProfile: ProfileState,
  wordId: string | undefined,
  next_due: Date
) => {
  if (!wordId) {
    console.error("wordId is undefined");
    return false;
  }

  if (
    !userProfile.profile ||
    !userProfile.profile.userId ||
    !userProfile.profile.schedule
  ) {
    console.error("Missing profile data");
    return false;
  }

  try {
    const schedule = JSON.parse(userProfile.profile.schedule);
    const currentDate = new Date().toISOString().split("T")[0];
    // Clean up id in todays date since it's reviewed now
    if (schedule[currentDate]) {
      const index = schedule[currentDate].reviewWordsIds.indexOf(wordId);
      if (index > -1) {
        schedule[currentDate].reviewWordsIds.splice(index, 1);
        console.log(`Removed wordId ${wordId} from today's schedule`);
      }
    }
    //schedule next review
    const nextDueDate = new Date(next_due).toISOString().split("T")[0];

    if (schedule[nextDueDate]) {
      // Check if wordId already exists (prevent duplicates)
      if (schedule[nextDueDate].reviewWordsIds.includes(wordId)) {
        console.warn(
          `⚠️ Word ID ${wordId} already exists in today's schedule. Skipping duplicate.`
        );
      } else {
        // Not the first word for today
        schedule[nextDueDate].reviewWordsIds.push(wordId);
      }

      // Cancel old notification
      if (schedule[nextDueDate].notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          schedule[nextDueDate].notificationId
        );
        console.log("Cancelled old notification");
      }

      // Schedule new notification
      schedule[nextDueDate].notificationId = await setSchedule(
        schedule[nextDueDate].reviewWordsIds.length,
        next_due
      );
    } else {
      // The first word for today
      schedule[nextDueDate] = { reviewWordsIds: [wordId] };
      schedule[nextDueDate].notificationId = await setSchedule(1, next_due);
    }

    // Update profile in database
    const updatedProfile = await updateProfileInDatabase({
      ...userProfile.profile,
      schedule: JSON.stringify(schedule),
    });

    if (updatedProfile) {
      console.log("✅ Profile updated successfully");
      return updatedProfile;
    } else {
      console.error("❌ Failed to update profile");
      return false;
    }
  } catch (error) {
    console.error("❌ Error in handleScheduleNotification:", error);
    return false;
  }
};

export const handleScheduleNotification = async (
  userProfile: ProfileState,
  wordId: string | undefined,
  next_due: Date
) => {
  if (!wordId) {
    console.error("wordId is undefined");
    return false;
  }

  if (
    !userProfile.profile ||
    !userProfile.profile.userId ||
    !userProfile.profile.schedule
  ) {
    console.error("Missing profile data");
    return false;
  }

  try {
    const schedule = JSON.parse(userProfile.profile.schedule);
    const nextDueDate = new Date(next_due).toISOString().split("T")[0];

    if (schedule[nextDueDate]) {
      // Check if wordId already exists (prevent duplicates)
      if (schedule[nextDueDate].reviewWordsIds.includes(wordId)) {
        console.warn(
          `⚠️ Word ID ${wordId} already exists in today's schedule. Skipping duplicate.`
        );
      } else {
        // Not the first word for today
        schedule[nextDueDate].reviewWordsIds.push(wordId);
      }

      // Cancel old notification
      if (schedule[nextDueDate].notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          schedule[nextDueDate].notificationId
        );
        console.log("Cancelled old notification");
      }

      // Schedule new notification
      schedule[nextDueDate].notificationId = await setSchedule(
        schedule[nextDueDate].reviewWordsIds.length,
        next_due
      );
    } else {
      // The first word for today
      schedule[nextDueDate] = { reviewWordsIds: [wordId] };
      schedule[nextDueDate].notificationId = await setSchedule(1, next_due);
    }

    // Update profile in database
    const updatedProfile = await updateProfileInDatabase({
      ...userProfile.profile,
      schedule: JSON.stringify(schedule),
    });

    if (updatedProfile) {
      console.log("✅ Profile updated successfully");
      return updatedProfile;
    } else {
      console.error("❌ Failed to update profile");
      return false;
    }
  } catch (error) {
    console.error("❌ Error in handleScheduleNotification:", error);
    return false;
  }
};
export const setSchedule = async (wordsCount: number, next_due: Date) => {
  //call the algorithmn to determine the time interval based on wordsCount
  // return {duedate, timeinterval}

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review!",
        body: `You have ${wordsCount} words to review.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next_due,
      },
    });
    return identifier;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

export const updateWordSpacedRepetition = async (
  review_interval: number,
  ease_factor: number,
  recall_accuracy: "poor" | "fair" | "good" | "excellent"
) => {};
