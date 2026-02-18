import { useEffect, useRef, useState } from "react";
import { Hub } from "@aws-amplify/core";
import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { Alert, AppState } from "react-native";
import { client } from "../app/client";
import { setProfile, UserProfile } from "../store/slices/profileSlice";
import { useDispatch } from "react-redux";
import {
  checkIfTrialExpired,
  cleanSchedules,
  cleanScheduleWords,
  cleanWords,
} from "../util/utli";
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
import { useAppSelector } from "../store/hooks";
import { probeOpenAIConnection } from "../store/slices/aiSettingsSlice";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import Purchases from "react-native-purchases";
import { setProStatus } from "../store/slices/subscriptionSlice";
import { store } from "../store";
import RevenueCatUI from "react-native-purchases-ui";

type AuthMode = "unknown" | "authed" | "guest";
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

const timeout = (ms: number) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), ms),
  );
};

export function useLaunchSequence() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>("unknown");

  // what screen RootLayout should navigate to AFTER splash hides
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  // AI settings from Redux
  const { hasTested } = useAppSelector((state) => state.aiSettings);

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
      console.log("[LaunchSequence] Cold start started");

      try {
        // 🚀 THE UMBRELLA TIMEOUT
        // This covers BOTH getCurrentUser AND handleAuthSuccess (initializeData)
        await Promise.race([
          (async () => {
            const user = await getCurrentUser();
            if (!mounted) return;
            await handleAuthSuccess("cold_start");
          })(),
          timeout(8000), // Give the whole "Log in + Sync" process 8 seconds
        ]);
      } catch (error: any) {
        if (!mounted) return;

        // If it times out or getCurrentUser fails,
        // handleAuthFail will clear the splash screen and move to Login.
        console.log(
          "[LaunchSequence] Launch failed or timed out:",
          error.message,
        );
        handleAuthFail(
          error.message === "TIMEOUT" ? "network_timeout" : "auth_error",
        );
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

    if (reason === "network_timeout") {
      // Maybe show a specific Toast or Banner: "Offline mode enabled"
      Alert.alert(
        "Network issues",
        "We had trouble connecting to the server. Please check your internet connection and try again.",
        [{ text: "Retry", onPress: () => handleAuthFail("network_timeout") }],
      );
      return;
    }

    // 1. Close WebSockets
    try {
      unsubscribeAll();

      // 2. Safely log out of RevenueCat
      const isConfigured = await Purchases.isConfigured();
      if (isConfigured) {
        // Check if the user is actually identified before logging out
        const isAnonymous = await Purchases.isAnonymous();

        if (!isAnonymous) {
          await Purchases.logOut();
          console.log("🧹 [Cleanup] RevenueCat identified user logged out.");
        } else {
          console.log(
            "ℹ️ [Cleanup] User already anonymous, skipping RC logout.",
          );
        }
      }
      dispatch({ type: "USER_LOGOUT" });

      setAuthMode("guest");

      setRouteOnce("/(auth)");
      setAppReady(true);
    } catch (error) {
      console.log("[LaunchSequence] Error during auth fail handling:", error);
    }
  };

  /**
   * Auth success (authed)
   */
  const handleAuthSuccess = async (source?: "cold_start" | "hub") => {
    setAuthMode("authed");

    // 1. Settle period for Hub events
    if (source === "hub") await new Promise((res) => setTimeout(res, 200));

    let retryCount = 0;
    const maxRetries = 3;

    const tryInitialize = async () => {
      try {
        const user = await getCurrentUser();
        const success = await initializeData(user.userId);
        if (success) {
          setRouteOnce("/(home)");
          // setRouteOnce("/(auth)/provision");
          setAppReady(true);
        }
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`⚠️ Auth race detected. Retry ${retryCount}...`);
          setTimeout(tryInitialize, 500 * retryCount); // Exponential backoff
        } else {
          handleAuthFail("auth_initialization_retry_exhausted");
        }
      }
    };

    tryInitialize();
  };

  // Initialize user data after authentication
  const initializeData = async (userId: string) => {
    console.log("🚀 [Sequence] Phase 2: Starting Data Initialization...");
    try {
      // Phase 1: Identity
      if (REVENUECAT_API_KEY) {
        const isConfigured = await Purchases.isConfigured();
        if (!isConfigured) {
          Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserID: userId,
          });
          console.log("✅ RevenueCat Configured");
        }

        // 🛡️ BLOCKING IDENTITY SYNC
        // This ensures the SDK is locked to your Cognito userId BEFORE anything else happens
        const loginResult = await Purchases.logIn(userId);

        // Immediately update Redux so the rest of the app knows the status
        const currentIsPro =
          !!loginResult.customerInfo.entitlements.active["LexSee Pro"];
        dispatch(setProStatus(currentIsPro));

        console.log(
          `✅ [RC] Identity Synced for ${userId}. Pro Status: ${currentIsPro}`,
        );
      } else {
        console.log("REVENUECAT_API_KEY is not set");
      }
      const profile = await fetchProfile(userId);
      console.log(
        "fetched profile from initializeData:",
        JSON.stringify(profile),
      );

      console.log("🔔 [Sequence] Checking notification permissions...");
      await requestNotificationPermissions();

      // Start the AI Probe (Silent / Non-blocking)
      checkAISettings();

      if (!profile) {
        console.log("📝 [Sequence] New User detected. Creating workspace...");
        // should reroute to provision page
        router.push({
          pathname: "/(auth)/provision",
          params: { userId },
        });

        const newProfile = await createProfile(userId);
        await loadProfileIntoRedux(newProfile.data);
        const success = await createInitialWordsList(newProfile.data.id);
        if (!success)
          throw new Error("Failed to create initial data for new user");
      } else {
        console.log(
          "✅ [Sequence] Existing User detected. Loading preferences...",
        );
        await loadProfileIntoRedux(profile);
      }

      // 2. Subscriptions
      console.log("📡 [Sequence] Opening data streams (Subscriptions)...");

      await subscribeToPurchases();
      subscribeToWords();
      subscribeToReviewSchedules();
      subscribeToCompletedReviewSchedules();
      subscribeToReviewScheduleWords();

      const isPro = store.getState().subscription.isPro;
      if (checkIfTrialExpired(profile.createdAt) && !isPro) {
        await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: "pro",
        });
      }

      console.log("🏁 [Sequence] All systems GO.");
      return true;
    } catch (error) {
      console.error(
        "❌ [Sequence] Critical failure during init:",
        JSON.stringify(error),
      );
      signOut();

      // if fail error is [NoSignedUser: No current user]
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "NoSignedUser"
      ) {
        console.warn("⚠️ [Sequence] No signed-in user found.");
        // fall back
        signOut();
      }
      return false;
    }
  };
  const fetchProfile = async (userId: string) => {
    console.log("⏳ [Fetch] Checking for profile...");

    /// 1. Fetch with Selection Set
    const response = await (
      client as any
    ).models.UserProfile.listUserProfileByUserId({
      userId,
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
    console.log("loading profile info:", JSON.stringify(profile));
    try {
      const attributes = await fetchUserAttributes();

      let providerType = undefined;
      if (attributes.identities) {
        const parsedIdentities = JSON.parse(attributes.identities);
        providerType = parsedIdentities?.[0]?.providerType;
      }
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
        providerType,
        onboardingStage: profile.onboardingStage || "SEARCH",
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

        const cleanedItems = cleanWords(items).sort((a, b) => {
          // If updatedAt is undefined, we treat it as 0 (the beginning of time)
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

          return timeB - timeA; // Newest first
        });

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

  const subscribeToPurchases = async () => {
    console.log("💎 [Sequence] Opening purchase stream...");

    // 1. Set up the Live Listener
    Purchases.addCustomerInfoUpdateListener((info) => {
      const activeEntitlements = Object.keys(info.entitlements.active);
      const isPro = !!info.entitlements.active["LexSee Pro"];

      console.log("🔔 [RC Listener] Update Received");
      console.log("   > Active Entitlements:", activeEntitlements);
      console.log("   > Target 'LexSee Pro' found?:", isPro);

      dispatch(setProStatus(isPro));
    });

    // 2. Immediate Initial Check
    try {
      console.log("⏳ [RC Check] Fetching current CustomerInfo...");
      const info = await Purchases.getCustomerInfo();

      const allEntitlements = Object.keys(info.entitlements.all);
      const activeEntitlements = Object.keys(info.entitlements.active);
      const isPro = !!info.entitlements.active["LexSee Pro"];

      console.log("✅ [RC Check] Success");
      console.log("   > All Entitlements in Dashboard:", allEntitlements);
      console.log("   > Currently Active:", activeEntitlements);
      console.log("   > Identified User ID:", info.originalAppUserId);
      console.log("   > Resulting isPro:", isPro);

      dispatch(setProStatus(isPro));
    } catch (e: any) {
      console.error("❌ [RC Check] Failed to fetch initial CustomerInfo", {
        message: e.message,
        code: e.code,
        underlyingError: e.underlyingError,
      });
    }
  };

  const checkAISettings = async () => {
    // If Redux-Persist already loaded 'hasTested: true' from storage, stop here.
    if (hasTested) {
      console.log(
        "🤖 [AI] Model preference loaded from storage. Skipping probe.",
      );
      return;
    }

    console.log("🚀 [AI] First launch or untested state. Probing OpenAI...");
    // Trigger the thunk we built in the previous step
    dispatch(probeOpenAIConnection() as any);
  };

  const unsubscribeAll = () => {
    console.log("🧹 [Cleanup] Closing all data streams...");
    wordsSubscription?.unsubscribe();
    reviewScheduleSubscription?.unsubscribe();
    completedReviewScheduleSubscription?.unsubscribe();
    reviewScheduleWordSubscription?.unsubscribe();

    setWordsSubscription(null);
    setReviewScheduleSubscription(null);
    setCompletedReviewScheduleSubscription(null);
    setReviewScheduleWordSubscription(null);
  };

  const requestNotificationPermissions = async () => {
    // 1. Check current status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Only ask if we don't have it yet
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permission not granted for notifications!");
      return false;
    }

    return true;
  };
  return {
    authMode,
    targetRoute,
    appReady,
  };
}
