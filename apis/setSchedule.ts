import * as Notifications from "expo-notifications";
import { ProfileState } from "../store/slices/profileSlice";
import { client } from "../app/client";

/**
 * Create or get a ReviewSchedule for a specific date
 * Return the ReviewSchedule object and a boolean indicating if it was created
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
    }
  } catch (error) {
    console.error(
      `❌ Error getting/creating schedule for ${scheduleDate}:`,
      error
    );
    return null;
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


  // to schedule a word based the next_due date
  // 1. create a reviewScheduleWord
  // 2. push the reviewScheduleWord to the reviewSchedule of that date 
  //.     2.1 if reviewSchedule of that date does not exist, create one
                // set notification for that date
  //.     2.2 if reviewScheduleWord already exists in that date, skip
                // cancle old notification and set a new one with updated count

  try {
    const userProfileId = userProfile.profile.id;
    const nextDueDate = new Date(next_due).toISOString().split("T")[0];

    console.log(`📅 Scheduling word ${wordId} for ${nextDueDate}`);
    console.log(`🔍 DEBUG - userProfileId: ${userProfileId}`);
    console.log(`🔍 DEBUG - nextDueDate: ${nextDueDate}`);

    // Step 1: create a reviewScheduleWord
     const scheduleWordEntity = await (client as any).models.ReviewScheduleWord.create(
      {
        reviewScheduleId: "to_be_set", // placeholder, will set later
        wordId,
        status: "TO_REVIEW",
      }
    );

    console.log(`✅ Added word ${wordId} to schedule`);
    console.log('scheduleWordEntity: ', JSON.stringify(scheduleWordEntity))
    console.log(`🔍 DEBUG - scheduleWordEntity.data.id: ${scheduleWordEntity?.data?.id}`);

    // Step 2:  push the reviewScheduleWord to the reviewSchedule of that date 
    // 2.1 if reviewSchedule of that date does not exist, create one
    // 2.2 if reviewScheduleWord already exists in that date, skip
    // set notification for that date
    // cancle old notification and set a new one with updated count


    // 2.2 if reviewScheduleWord already exists in that date, skip
    const { schedule, created } = await getOrCreateReviewSchedule(
      userProfileId,
      nextDueDate
    ) as { schedule: any; created: boolean };

    console.log(`🔍 DEBUG - schedule: ${JSON.stringify(schedule)}`);
    console.log(`🔍 DEBUG - schedule.id: ${schedule?.id}`);
    console.log(`🔍 DEBUG - created: ${created}`);

    // if existed, cancel original notification and set a new one
    // if just created, set a notification
    if (!created) {
      // existed schedule,  cancel original notification and set a new one
      const wordsCount = schedule.toBeReviewedCount - schedule.reviewedCount; // get current count
      console.log(`🔍 DEBUG - wordsCount (existing): ${wordsCount}`);
      
      if (schedule.notificationId) {
        console.log(`🔍 DEBUG - Canceling notification: ${schedule.notificationId}`);
        await Notifications.cancelScheduledNotificationAsync(
          schedule.notificationId
        );
        console.log(
          `🔕 Canceled existing notification ${schedule.notificationId} for schedule on ${nextDueDate}`
        );
      }
      const notificationId = await setSchedule(wordsCount + 1, next_due);
      console.log(`🔍 DEBUG - New notificationId: ${notificationId}`);
      
      // update schedule with new notificationId
      await (client as any).models.ReviewSchedule.update({
        id: schedule.id,
        notificationId,
        toBeReviewedCount: wordsCount + 1,
        totalWords: schedule.totalWords + 1,
      });
    }
    else{
      // just created schedule, set a notification
      console.log(`🔍 DEBUG - Creating first notification for new schedule`);
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
    console.log(`🔍 DEBUG - Updating ReviewScheduleWord ${scheduleWordEntity.data.id} with reviewScheduleId: ${schedule.id}`);
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
  wordId: string
): Promise<boolean> => {

  try {

     // 1. Get the review entity to get the review schedule based on date 
    
    console.log(`🗑️ Uncollecting word ${wordId}`);
    console.log(`🔍 DEBUG - Input wordId: ${wordId}`);

    // 1. First,  get the id of entity based on word id 
    const reviewScheduleWords =  await (client as any).models.ReviewScheduleWord.list({
      filter: { wordId: { eq: wordId } }
    });

    console.log(`🔍 DEBUG - reviewScheduleWords result: ${JSON.stringify(reviewScheduleWords)}`);

    const reviewScheduleWordsData = reviewScheduleWords.data || [];
    console.log(`🔍 DEBUG - reviewScheduleWordsData length: ${reviewScheduleWordsData.length}`);
    console.log(`🔍 DEBUG - reviewScheduleWordsData: ${JSON.stringify(reviewScheduleWordsData)}`);
    
    const upcomingSchedule_entity = reviewScheduleWordsData.filter((rsw: any) => rsw.status === "TO_REVIEW")[0];
    console.log(`🔍 DEBUG - upcomingSchedule_entity: ${JSON.stringify(upcomingSchedule_entity)}`);
    console.log(`🔍 DEBUG - upcomingSchedule_entity.id: ${upcomingSchedule_entity?.id}`);
    console.log(`🔍 DEBUG - upcomingSchedule_entity.reviewScheduleId: ${upcomingSchedule_entity?.reviewScheduleId}`);
      
    // 1.2  Second, get the review schedule id from the entity
    if(upcomingSchedule_entity.id)
    {
      console.log(`🔍 DEBUG - Fetching schedule with id: ${upcomingSchedule_entity.reviewScheduleId}`);
      
      const schedule = await (client as any).models.ReviewSchedule.get({
       id: upcomingSchedule_entity.reviewScheduleId
      });
      
      console.log(`🔍 DEBUG - schedule result: ${JSON.stringify(schedule)}`);
      console.log(`🔍 DEBUG - schedule.data: ${JSON.stringify(schedule.data)}`);
      console.log(`🔍 DEBUG - schedule.data.id: ${schedule.data?.id}`);
      console.log(`🔍 DEBUG - schedule.data.notificationId: ${schedule.data?.notificationId}`);
      
      // Get all words in this schedule to check count
      const allScheduleWords = await (client as any).models.ReviewScheduleWord.list({
        filter: { reviewScheduleId: { eq: upcomingSchedule_entity.reviewScheduleId } }
      });
      
      const scheduleWordsCount = allScheduleWords.data?.length || 0;
      console.log(`🔍 DEBUG - Total words in schedule: ${scheduleWordsCount}`);
       // 2.1 If there’s only one entity
        //     1. Cancel notification
        //     2. Delete entity & schedule
      if(scheduleWordsCount === 1){
          console.log(`🔍 DEBUG - Only one word in schedule, deleting entire schedule`);
          
          if(schedule.data.notificationId){
            console.log(`🔍 DEBUG - Canceling notification: ${schedule.data.notificationId}`);
            await Notifications.cancelScheduledNotificationAsync(schedule.data.notificationId);
            console.log(`🔕 Canceled notification ${schedule.data.notificationId} for schedule`);
          }
          
          // delete entity
          console.log(`🔍 DEBUG - Deleting ReviewScheduleWord entity: ${upcomingSchedule_entity.id}`);
          await (client as any).models.ReviewScheduleWord.delete({
            id: upcomingSchedule_entity.id,
          });
          console.log(`🗑️ Deleted ReviewScheduleWord entity ${upcomingSchedule_entity.id}`);
          
          // delete schedule
          console.log(`🔍 DEBUG - Deleting ReviewSchedule: ${schedule.data.id}`);
          await (client as any).models.ReviewSchedule.delete({
            id: schedule.data.id,
          });
          console.log(`🗑️ Deleted ReviewSchedule ${schedule.data.id}`);
      }
      //2.2 If there’s more than one entity
      else{
        console.log(`🔍 DEBUG - More than one entity in schedule${JSON.stringify(schedule)}`);
        // more than one entity, just delete the entity
        await (client as any).models.ReviewScheduleWord.delete({
          id: upcomingSchedule_entity.id,
        });
        console.log(`🗑️ Deleted ReviewScheduleWord entity ${upcomingSchedule_entity.id}`);
        console.log('update schedule notification', JSON.stringify(schedule))
        // update notification & schedule counts
        const cur_totalWords = schedule.data.totalWords; 
        const cur_tobeReviewedCount = schedule.data.toBeReviewedCount;
        console.log(`🔍 DEBUG - Current totalWords: ${cur_totalWords}`);
        console.log(`🔍 DEBUG - Current toBeReviewedCount: ${cur_tobeReviewedCount}`);
        console.log(`🔍 DEBUG - New totalWords will be: ${cur_totalWords - 1}`);
        console.log(`🔍 DEBUG - New toBeReviewedCount will be: ${cur_tobeReviewedCount - 1}`);
        
        await (client as any).models.ReviewSchedule.update({
          id: schedule.data.id,
          toBeReviewedCount: cur_tobeReviewedCount - 1,
          totalWords: cur_totalWords - 1,
        });
        console.log(`✅ Updated schedule counts after uncollecting word`);
        
         // cancel old notification and set a new one with updated count at the original time
        if(schedule.data.notificationId){
          console.log(`🔍 DEBUG - Canceling old notification: ${schedule.data.notificationId}`);
          await Notifications.cancelScheduledNotificationAsync(schedule.data.notificationId);
          console.log(`🔕 Canceled notification ${schedule.data.notificationId} for schedule`);
          
          const newNotificationDate = new Date(schedule.data.scheduleDate);
          console.log(`🔍 DEBUG - Setting new notification for ${cur_tobeReviewedCount - 1} words at ${newNotificationDate}`);
          const newNotificationId = await setSchedule(cur_tobeReviewedCount - 1, newNotificationDate);
          console.log(`🔍 DEBUG - New notification ID: ${newNotificationId}`);
        }
      }
    }
    return true
  } catch (error) {
    console.error("❌ Error in uncollectWord:", error);
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
    let identifier; 
    if(wordsCount > 1)
    {
       identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review!",
        body: `You have ${wordsCount} word(s) to review.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next_due,
      },
    });
    }
    else{
        identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review!",
        body: `You have only one word to review today!`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next_due,
      },
    });
    }
   

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
