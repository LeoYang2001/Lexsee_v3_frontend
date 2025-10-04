import * as Notifications from "expo-notifications";

export const setSchedule = async (word: string) => {
  console.log("setSchedule called with word:", word);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up!",
        body: `Change sides! ${word}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    console.log("Notification scheduled for word:", word);
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
};
