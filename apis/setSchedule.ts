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

export const handleScheduleNotification = async (
  userProfile: ProfileState,
  wordId: string | undefined
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
    console.log("before profile updated", userProfile.profile);
    const schedule = JSON.parse(userProfile.profile.schedule);
    const currentDate = new Date().toISOString().split("T")[0];

    if (schedule[currentDate]) {
      // Check if wordId already exists (prevent duplicates)
      if (schedule[currentDate].reviewWordsIds.includes(wordId)) {
        console.warn(
          `⚠️ Word ID ${wordId} already exists in today's schedule. Skipping duplicate.`
        );
      } else {
        // Not the first word for today
        schedule[currentDate].reviewWordsIds.push(wordId);
      }

      // Cancel old notification
      if (schedule[currentDate].notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          schedule[currentDate].notificationId
        );
        console.log("Cancelled old notification");
      }

      // Schedule new notification
      schedule[currentDate].notificationId = await setSchedule(
        schedule[currentDate].reviewWordsIds.length
      );
    } else {
      // The first word for today
      schedule[currentDate] = { reviewWordsIds: [wordId] };
      schedule[currentDate].notificationId = await setSchedule(1);
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
export const setSchedule = async (wordsCount: number) => {
  //call the algorithmn to determine the time interval based on wordsCount
  // return {duedate, timeinterval}
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review!",
        body: `You have ${wordsCount} words to review.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 30,
      },
    });
    return identifier;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};
