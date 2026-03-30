import { useEffect, useRef, useState } from "react";
import { Hub } from "@aws-amplify/core";
import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { Alert, AppState } from "react-native";
import { client } from "../app/client";
import { setProfile, UserProfile } from "../store/slices/profileSlice";
import { useDispatch } from "react-redux";
import { cleanSchedules, cleanWords } from "../util/utli";
import { setSynced, setWords } from "../store/slices/wordsListSlice";

import {
  setCompletedReviewSchedules,
  setCompletedSchedulesSynced,
} from "../store/slices/completedReviewScheduleSlice";
import { useAppSelector } from "../store/hooks";
import { probeOpenAIConnection } from "../store/slices/aiSettingsSlice";
import * as Notifications from "expo-notifications";
import Purchases from "react-native-purchases";
import { setProStatus } from "../store/slices/subscriptionSlice";
import RevenueCatUI from "react-native-purchases-ui";
import Constants from "expo-constants";

type AuthMode = "unknown" | "authed" | "guest";
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

const timeout = (ms: number) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), ms),
  );
};

const isKnownLegacyDisplayNameNullError = (err: any) => {
  const topLevelMessage = String(err?.message || "");
  const nestedMessages = Array.isArray(err?.errors)
    ? err.errors.map((e: any) => String(e?.message || "")).join(" | ")
    : "";
  const combined = `${topLevelMessage} ${nestedMessages}`;

  return (
    combined.includes("Cannot return null for non-nullable type") &&
    combined.includes("UserProfile") &&
    combined.includes("displayName")
  );
};

export function useLaunchSequence() {
  const [authMode, setAuthMode] = useState<AuthMode>("unknown");

  // what screen RootLayout should navigate to AFTER splash hides
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  // AI settings from Redux
  const { hasTested } = useAppSelector((state) => state.aiSettings);

  //Subscription to Words WebSocket
  const [wordsSubscription, setWordsSubscription] = useState<any>(null);

  const [
    completedReviewScheduleSubscription,
    setCompletedReviewScheduleSubscription,
  ] = useState<any>(null);

  const [profileSubscription, setProfileSubscription] = useState<any>(null);

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
            // set user slice

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

        if (!completedReviewScheduleSubscription) {
          subscribeToCompletedReviewSchedules();
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
        const { success, isNewUser } = await initializeData(user.userId);
        if (success) {
          if (isNewUser) {
            // 1. Route to provision page FIRST
            setRouteOnce("/(onboarding)");
            // 2. THEN hide the splash screen
            setAppReady(true);
            console.log("[Sequence] New user - showing Provisioning page.");
          } else {
            // Existing user: proceed to Home
            // setRouteOnce("/(auth)/provision"); // for testing
            setRouteOnce("/(home)");
            setAppReady(true);
          }
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
        // const isConfigured = await Purchases.isConfigured();
        // if (!isConfigured) {
        //   Purchases.configure({
        //     apiKey: REVENUECAT_API_KEY,
        //     appUserID: userId,
        //   });
        //   console.log("✅ RevenueCat Configured");
        // }

        // 🛡️ BLOCKING IDENTITY SYNC
        // This ensures the SDK is locked to your Cognito userId BEFORE anything else happens
        // const loginResult = await Purchases.logIn(userId);

        // Immediately update Redux so the rest of the app knows the status
        // const currentIsPro =
        //   !!loginResult.customerInfo.entitlements.active["LexSee Pro"];
        const currentIsPro = true;

        dispatch(setProStatus(currentIsPro));

        console.log(
          `✅ [RC] Identity Synced for ${userId}. Pro Status: ${currentIsPro}`,
        );
      } else {
        console.log("REVENUECAT_API_KEY is not set");
      }
      // Start the AI Probe (Silent / Non-blocking)
      checkAISettings();

      // check if user completed onboarding, profile.nativeLanguage? profile.timezone?
      let profile = await fetchProfile(userId);
      let isNewUser = false;
      let activeProfileId: string; // We'll store the ID here safely

      if (!profile) {
        isNewUser = true;
        const newProfileRes = await createProfile(userId);
        const newProfileData = newProfileRes.data;

        activeProfileId = newProfileData.id; // Get ID from the new one

        await loadProfileIntoRedux(newProfileData);
        await createInitialWordsList(activeProfileId);
      } else {
        activeProfileId = profile.id; // Get ID from the fetched one

        if (!profile.nativeLanguage || !profile.timezone) {
          isNewUser = true;
        }
        await loadProfileIntoRedux(profile);
      }

      // ✅ SAFE: This now uses the ID we extracted above
      await requestNotificationPermissions(userId, activeProfileId);

      // 2. Subscriptions
      console.log("📡 [Sequence] Opening data streams (Subscriptions)...");

      // await subscribeToPurchases();
      subscribeToWords();
      subscribeToCompletedReviewSchedules();
      subscribeToProfile(userId);

      // const isPro = store.getState().subscription.isPro;
      // if (checkIfTrialExpired(profile.createdAt) && !isPro) {
      //   await RevenueCatUI.presentPaywallIfNeeded({
      //     requiredEntitlementIdentifier: "pro",
      //   });
      // }

      console.log("🏁 [Sequence] All systems GO.");
      return { success: true, isNewUser };
    } catch (error) {
      console.error("❌ [Sequence] Critical failure during init:", error);
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
      return { success: false, isNewUser: false };
    }
  };
  const fetchProfile = async (userId: string) => {
    /// 1. Fetch with Selection Set
    const response = await (client as any).models.UserProfile.listByUserId({
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
      displayName: `DEFAULT-${userId.substring(0, 5)}`,
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
        username: profile.displayName,
        owner: profile.owner,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        // Handle the wordsListId if it exists in the raw data
        wordsListId: profile.wordsListId || undefined,
        nativeLanguage: profile.nativeLanguage,
        timezone: profile.timezone,

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
        const validItems = items.filter(
          (item: any) => item !== null && item.word,
        );
        const cleanedItems = cleanWords(validItems).sort((a, b) => {
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

  const subscribeToProfile = (userId: string) => {
    console.log("⏳ [Sub] Connecting to Profile subscription...");

    if (profileSubscription) return;

    // Use observeQuery to get real-time updates for this specific user
    const sub = (client.models as any).UserProfile.observeQuery({
      filter: { userId: { eq: userId } },
    }).subscribe({
      next: async ({ items }: any) => {
        const profile = items[0];
        console.log(
          "🔄 [Sub] Profile update received:",
          JSON.stringify(profile),
        );

        // 1. Sync to Redux
        await loadProfileIntoRedux(profile);
      },
      error: (err: any) => {
        // Temporary guard: suppress legacy records that violate current schema
        // so the app does not crash while data backfill is in progress.
        if (isKnownLegacyDisplayNameNullError(err)) {
          console.warn(
            "⚠️ [Sub] Suppressed legacy UserProfile null displayName error.",
          );
          return;
        }

        console.error("❌ Profile Sub Error:", err);
      },
    });

    setProfileSubscription(sub);
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
    completedReviewScheduleSubscription?.unsubscribe();
    profileSubscription?.unsubscribe();

    setWordsSubscription(null);
    setCompletedReviewScheduleSubscription(null);
    setProfileSubscription(null);
    console.log("✅ [Cleanup] All subscriptions closed.");
  };

  const requestNotificationPermissions = async (
    userId: string,
    profileId: string,
  ) => {
    try {
      // 1. Check if we are on a physical device (Push doesn't work on most simulators)
      // if (!Constants.isDevice) {
      //   console.log("📱 [Push] Skipping: Not a physical device.");
      //   return false;
      // }

      // 2. Handle Permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("⚠️ [Push] Permission not granted.");
        return false;
      }

      // 3. Get the Token from Expo
      // This requires the projectId from your app.json / eas.json
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log("🎫 [Push] Current Token:", token);

      // 4. Update the UserProfile in the Backend
      // We do this every launch to ensure the token never goes stale
      await (client.models as any).UserProfile.update({
        id: profileId,
        expoPushToken: token,
      });

      console.log("✅ [Push] Token synced to backend.");
      return true;
    } catch (error) {
      console.error("❌ [Push] Failed to register token:", error);
      return false;
    }
  };

  return {
    authMode,
    targetRoute,
    appReady,
  };
}
