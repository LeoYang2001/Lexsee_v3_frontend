import { useEffect, useRef, useState } from "react";
import { Hub } from "@aws-amplify/core";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { AppState } from "react-native";
import { client } from "../app/client";
import { setProfile, UserProfile } from "../store/slices/profileSlice";
import { useDispatch } from "react-redux";
import { cleanSchedules, cleanScheduleWords, cleanWords } from "../util/utli";
import { setSynced, setWords } from "../store/slices/wordsListSlice";
import {
  setReviewSchedules,
  setSchedulesSynced,
} from "../store/slices/reviewScheduleSlice";
import {
  setScheduleWords,
  setScheduleWordsSynced,
} from "../store/slices/reviewScheduleWordsSlice";
import {
  setCompletedReviewSchedules,
  setCompletedSchedulesSynced,
} from "../store/slices/completedReviewScheduleSlice";

type AuthMode = "unknown" | "authed" | "guest";

export function useLaunchSequence() {
  const [authMode, setAuthMode] = useState<AuthMode>("unknown");

  // what screen RootLayout should navigate to AFTER splash hides
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  // user id after successful authentication
  const [userId, setUserId] = useState<string | null>(null);

  //Subscription to Words WebSocket
  const [wordsSubscription, setWordsSubscription] = useState<any>(null);
  const [reviewScheduleSubscription, setReviewScheduleSubscription] =
    useState<any>(null);
  const [
    completedReviewScheduleSubscription,
    setCompletedReviewScheduleSubscription,
  ] = useState<any>(null);
  const [reviewScheduleWordSubscription, setReviewScheduleWordSubscription] =
    useState<any>(null);

  // Redux dispatch
  const dispatch = useDispatch();

  // RootLayout uses this to hide splash
  const [appReady, setAppReady] = useState(false);

  // prevent duplicate navigation
  const lastTargetRouteRef = useRef<string | null>(null);
  const setRouteOnce = (route: string) => {
    if (lastTargetRouteRef.current === route) return;
    lastTargetRouteRef.current = route;
    setTargetRoute(route);
  };

  //MAIN BRANCH: COLD START, RESUME

  /**
   * Cold start (initial launch)
   */
  useEffect(() => {
    let mounted = true;

    const resolveInitialAuth = async () => {
      console.log("[LaunchSequence] Cold start: checking auth");

      try {
        await getCurrentUser();
        if (!mounted) return;
        await handleAuthSuccess("cold_start");
      } catch {
        if (!mounted) return;
        handleAuthFail("cold_start_not_authenticated");
      }
    };

    resolveInitialAuth();

    // Hub reactive auth changes (runtime)
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      const event = payload.event;
      console.log("[LaunchSequence] Hub event:", event);

      if (event === "signedOut") {
        handleAuthFail("hub_signedOut");
        return;
      }

      if (event === "signedIn" || event === "signInWithRedirect") {
        handleAuthSuccess("hub");
        return;
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Resume (app returns to foreground)
   */
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;

      console.log("[LaunchSequence] Resume: app became active");

      try {
        await getCurrentUser();
        console.log("[LaunchSequence] Resume: session still valid");
        // If the app becomes active, check if all the subscriptions are still active
        if (!wordsSubscription) {
          subscribeToWords();
        }
        if (!reviewScheduleSubscription) {
          subscribeToReviewSchedules();
        }
        if (!completedReviewScheduleSubscription) {
          subscribeToCompletedReviewSchedules();
        }
        if (!reviewScheduleWordSubscription) {
          subscribeToReviewScheduleWords();
        }
      } catch {
        handleAuthFail("resume_session_invalid");
      }
    });

    return () => sub.remove();
  }, []);

  // ----------- helper functions -----------------

  /**
   * Auth failure (guest)
   */
  const handleAuthFail = async (reason?: string) => {
    console.log("[LaunchSequence] Auth failed:", reason ?? "unknown");

    setAuthMode("guest");
    setUserId(null);

    setRouteOnce("/(auth)/sign-in");
    setAppReady(true);
  };

  /**
   * Auth success (authed)
   */
  const handleAuthSuccess = async (source?: "cold_start" | "hub") => {
    setAuthMode("authed");

    try {
      const user = await getCurrentUser();
      const id = user.userId;
      setUserId(id);

      // --- NEW LOGIC START ---
      // Instead of setting appReady immediately, run the sequence
      const success = await initializeData(id);

      if (success) {
        setRouteOnce("/(home)");
        setAppReady(true); // 👈 Splash only hides now
      } else {
        handleAuthFail("data_init_failed");
      }
      // --- NEW LOGIC END ---
    } catch {
      handleAuthFail("fetch_user_id_failed");
    }
  };

  // Initialize user data after authentication
  const initializeData = async (userId: string) => {
    console.log("🚀 [Sequence] Phase 2: Starting Data Initialization...");
    try {
      // 1. Profile Check
      const profile = await fetchProfile(userId);

      if (!profile) {
        console.log("📝 [Sequence] New User detected. Creating workspace...");
        const newProfile = await createProfile(userId);
        await loadProfileIntoRedux(newProfile.data);
        const success = await createInitialWordsList(newProfile.data.id);
        if (!success)
          throw new Error("Failed to create initial data for new user");
      } else {
        console.log("existing profile:", JSON.stringify(profile));
        console.log(
          "✅ [Sequence] Existing User detected. Loading preferences...",
        );
        await loadProfileIntoRedux(profile);
      }

      // 2. Subscriptions
      console.log("📡 [Sequence] Opening data streams (Subscriptions)...");
      subscribeToWords();
      subscribeToReviewSchedules();
      subscribeToCompletedReviewSchedules();
      subscribeToReviewScheduleWords();

      console.log("🏁 [Sequence] All systems GO.");
      return true;
    } catch (error) {
      console.error("❌ [Sequence] Critical failure during init:", error);
      return false;
    }
  };
  const fetchProfile = async (userId: string) => {
    console.log("⏳ [Fetch] Checking for profile...");

    /// 1. Fetch with Selection Set
    const response = await (client as any).models.UserProfile.list({
      filter: { userId: { eq: userId } },
      limit: 1000,
    });

    const profileData = response?.data?.[0];

    if (!profileData) {
      console.log("⚠️ [Fetch] No profile found in database.");
      return null;
    }

    console.log("✅ [Fetch] Profile found:", profileData.id);

    return profileData;
  };

  const createProfile = async (userId: string) => {
    const newProfile = await (client as any).models.UserProfile.create({
      userId,
      username: "user",
    });

    console.log("✅ [Create] New profile created:", JSON.stringify(newProfile));
    return newProfile;
  };

  const createInitialWordsList = async (userProfileId: string) => {
    // i want to create wordsList, only wordsList
    if (!userProfileId) {
      console.log(
        "⚠️ [Create] Missing userProfileId, cannot create initial data.",
      );
      return false;
    }
    await (client as any).models.WordsList.create({
      userProfileId,
    });
    console.log("✅ [Create] Initial words list created.");
    return true;
  };

  const loadProfileIntoRedux = async (profile: any) => {
    console.log("⏳ [Redux] Syncing profile to global state...");

    try {
      // 1. Map raw JSON to your UserProfile interface
      const formattedProfile: UserProfile = {
        id: profile.id,
        userId: profile.userId,
        username: profile.username || "Guest",
        owner: profile.owner,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        // Handle the wordsListId if it exists in the raw data
        wordsListId: profile.wordsListId || undefined,
      };

      // 2. Dispatch to the store
      dispatch(setProfile(formattedProfile));

      console.log("✅ [Redux] Profile loaded successfully");

      // Maintain your simulated delay for the splash screen
      await new Promise((res) => setTimeout(res, 500));
      return true;
    } catch (error) {
      console.error("❌ [Redux] Failed to load profile:", error);
      return false;
    }
  };

  const subscribeToWords = async () => {
    console.log("⏳ [Sub] Subscribing to Words...");

    if (wordsSubscription) {
      console.log("⚠️ [Sub] Words subscription already connected.");
      return true;
    }

    const sub = (client.models as any).Word.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        // 1. Transform the raw items into our clean UI format
        // This uses the transformer we just built
        const cleanedItems = cleanWords(items);

        // 2. Update Redux with the data
        dispatch(setWords(cleanedItems));

        // 3. Update the Sync status so the UI knows if we're "Live" or "Local"
        dispatch(setSynced(isSynced));

        console.log(
          `📡 [Words] Updated: ${items.length} words. Synced: ${isSynced}`,
        );
      },
      error: (error: any) => {
        console.error("❌ Words subscription error:", error);
      },
    });

    setWordsSubscription(sub);
    return true;
  };

  const subscribeToReviewSchedules = async () => {
    console.log("⏳ [Sub] Connecting to Review Schedules subscription...");

    if (reviewScheduleSubscription) {
      console.log("⚠️ [Sub] Review Schedules subscription already connected.");
      return true;
    }

    const sub = (client.models as any).ReviewSchedule.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        // 1. Transform raw Amplify instances into plain serializable objects
        // This strips the [Function anonymous] fields that cause Redux errors
        const cleanedSchedules = cleanSchedules(items);

        // 2. Dispatch the cleaned array to your new slice
        dispatch(setReviewSchedules(cleanedSchedules));

        // 3. Update the sync status
        dispatch(setSchedulesSynced(isSynced));

        console.log(
          `✅ [Sub] Review Schedules: ${items.length} items processed. (Synced: ${isSynced})`,
        );
      },
      error: (error: any) => {
        console.error("❌ Review Schedules subscription error:", error);
        // Optional: dispatch(setSchedulesError(error.message));
      },
    });

    setReviewScheduleSubscription(sub);
    console.log("✅ [Sub] Review Schedules subscription connected.");
    return true;
  };

  const subscribeToCompletedReviewSchedules = async () => {
    console.log(
      "⏳ [Sub] Connecting to Completed Review Schedules subscription...",
    );
    if (completedReviewScheduleSubscription) {
      console.log(
        "⚠️ [Sub] Completed Review Schedules subscription already connected.",
      );
      return true;
    }

    const sub = (
      client.models as any
    ).CompletedReviewSchedule.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        const cleanedSchedules = cleanSchedules(items);

        // 2. Dispatch the cleaned array to your new slice
        dispatch(setCompletedReviewSchedules(cleanedSchedules));

        // 3. Update the sync status
        dispatch(setCompletedSchedulesSynced(isSynced));

        console.log(
          "📋 [Sub] Completed Review Schedules subscription update received.",
        );
        console.log(
          `📋 Subscription update: ${items.length} completed review schedules, synced: ${isSynced}`,
        );
        console.log("completed review schedules items we fetched", items);
      },
      error: (error: any) => {
        console.error(
          "❌ Completed Review Schedules subscription error:",
          error,
        );
      },
    });
    setCompletedReviewScheduleSubscription(sub);
    console.log("✅ [Sub] Completed Review Schedules subscription connected.");
    return true;
  };

  const subscribeToReviewScheduleWords = async () => {
    console.log("⏳ [Sub] Subscribing to Review Schedule Words...");

    if (reviewScheduleWordSubscription) {
      console.log(
        "⚠️ [Sub] Review Schedule Words subscription already connected.",
      );
      return true;
    }

    const sub = (
      client.models as any
    ).ReviewScheduleWord.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        // 1. Transform the raw items into our clean UI format
        // This strips the [Function anonymous] relationships
        const cleanedWords = cleanScheduleWords(items);

        // 2. Update Redux with the data
        dispatch(setScheduleWords(cleanedWords));

        // 3. Update the Sync status
        dispatch(setScheduleWordsSynced(isSynced));

        console.log(
          `📡 [ReviewScheduleWord] Updated: ${items.length} records. Synced: ${isSynced}`,
        );
      },
      error: (error: any) => {
        console.error("❌ ReviewScheduleWord subscription error:", error);
      },
    });

    setReviewScheduleWordSubscription(sub);
    return true;
  };
  return {
    authMode,
    targetRoute,
    appReady,
  };
}
