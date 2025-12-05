import { router, Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import { Hub } from "@aws-amplify/core";
import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Provider } from "react-redux";
import { store } from "../store";
import outputs from "../amplify_outputs.json";
import "../global.css";
import { useEffect, useState, useRef } from "react";
import { client } from "./client";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setWords,
  setSynced,
  setLoading,
  setError,
  cleanWords,
} from "../store/slices/wordsListSlice";
import { clearUser, fetchUserInfo } from "../store/slices/userSlice";
import { getCurrentUser } from "aws-amplify/auth";
import {
  clearProfile,
  setProfile,
  setProfileError,
  setProfileLoading,
  cleanUserProfile,
} from "../store/slices/profileSlice";
import * as Notifications from "expo-notifications";
import { useCheckChina } from "../hooks/useCheckChina";
import { setTodaySchedule } from "../store/slices/reviewScheduleSlice";

Amplify.configure(outputs);

//notification settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppContent() {
  const dispatch = useAppDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wordsSubscription, setWordsSubscription] = useState<any>(null);
  const { ifChina, isLoading } = useCheckChina();

  // Track profile creation to prevent duplicates
  const profileCreationInProgress = useRef<{ [key: string]: boolean }>({});
  const profileCreationTimeout = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});

  const userProfile = useAppSelector((state) => state.profile.profile);
  const [scheduleSubscription, setScheduleSubscription] = useState<any>(null);

  async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Permission not granted for notifications!");
      return false;
    }

    return true;
  }
  useEffect(() => {
    if (!isLoading) {
      console.log(
        `📍 Location determined: ${ifChina ? "🇨🇳 China" : "🌍 Outside China"}`
      );
    }
  }, [ifChina, isLoading]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const checkUserProfile = async (userId: string): Promise<boolean> => {
    dispatch(setProfileLoading(true));

    try {
      const profileResult = await (client as any).models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (profileResult.data && profileResult.data.length > 0) {
        const profile = profileResult.data[0];
        console.log("✅ Profile found:", profile);

        // FIX: Clean the profile BEFORE dispatching
        const serializedProfile = await cleanUserProfile(profile);
        dispatch(setProfile(serializedProfile));

        if (profileCreationTimeout.current[userId]) {
          clearTimeout(profileCreationTimeout.current[userId]);
          delete profileCreationTimeout.current[userId];
        }
        delete profileCreationInProgress.current[userId];

        return true;
      } else {
        if (profileCreationInProgress.current[userId]) {
          console.log(
            "⏳ Profile creation already in progress for user:",
            userId
          );
          return false;
        }

        console.log("No profile found, creating new profile...");
        profileCreationInProgress.current[userId] = true;

        let newProfileResult;
        try {
          newProfileResult = await (client as any).models.UserProfile.create({
            userId: userId,
            username: "user",
            ifChineseUser: false,
          });

          console.log(
            "📋 Full profile result:",
            JSON.stringify(newProfileResult, null, 2)
          );

          const createdProfile = newProfileResult.data || newProfileResult;
          const profileId = createdProfile?.id;

          if (!profileId) {
            console.error("❌ No profile ID returned:", newProfileResult);
            throw new Error(
              `Profile creation failed: ${JSON.stringify(newProfileResult.errors)}`
            );
          }

          console.log("✅ Created new profile with ID:", profileId);

          // Create WordsList after profile
          try {
            const wordsListResult = await (
              client as any
            ).models.WordsList.create({
              userProfileId: profileId,
            });
            console.log("✅ Created new words list:", wordsListResult.data?.id);
          } catch (wordsListError) {
            console.warn(
              "⚠️ WordsList creation failed (non-blocking):",
              wordsListError
            );
          }

          // FIX: Clean the profile BEFORE dispatching
          const serializedProfile = await cleanUserProfile(createdProfile);
          dispatch(setProfile(serializedProfile));

          console.log("✅ Profile setup complete for user:", userId);

          profileCreationTimeout.current[userId] = setTimeout(() => {
            delete profileCreationInProgress.current[userId];
          }, 2000);

          return true;
        } catch (error) {
          console.error("❌ Error creating new profile:", error);
          console.error("Error message:", (error as any).message);
          console.error("Full error:", JSON.stringify(error, null, 2));

          delete profileCreationInProgress.current[userId];
          dispatch(
            setProfileError(
              `Failed to create profile: ${(error as Error).message}`
            )
          );
          return false;
        }
      }
    } catch (error) {
      console.error("❌ Error checking user profile:", error);
      dispatch(setProfileError("Error checking user profile"));
      delete profileCreationInProgress.current[userId];
      return false;
    } finally {
      dispatch(setProfileLoading(false));
    }
  };

  // Function to start words subscription
  const startWordsSubscription = () => {
    if (wordsSubscription) {
      console.log("📋 Words subscription already active");
      return;
    }

    console.log("🔄 Starting words subscription for authenticated user");

    const sub = (client.models as any).Word.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        // Clean words before dispatching
        const cleanedWords = cleanWords(items);

        console.log(
          `📋 Subscription update: ${cleanedWords.length} words, synced: ${isSynced}`
        );

        dispatch(setWords(cleanedWords));
        dispatch(setSynced(isSynced));
      },
      error: (error: any) => {
        console.error("❌ Words subscription error:", error);
        dispatch(setError(error.message || "Failed to sync words"));
      },
    });

    setWordsSubscription(sub);
    console.log("✅ Words subscription started successfully");
  };

  // Function to stop words subscription
  const stopWordsSubscription = () => {
    if (wordsSubscription) {
      console.log("🛑 Stopping words subscription");
      wordsSubscription.unsubscribe?.();
      setWordsSubscription(null);

      // Clear words from Redux when unauthenticated
      dispatch(setWords([]));
      dispatch(setSynced(false));
    }
  };

  const handleSuccessfulAuth = async (user: any) => {
    try {
      console.log("🔐 Setting user as authenticated");
      setIsAuthenticated(true);

      // Start words subscription now that user is authenticated
      startWordsSubscription();

      // Fetch user info and store in Redux
      const resultAction = await dispatch(fetchUserInfo());

      if (fetchUserInfo.fulfilled.match(resultAction)) {
        // Check if user has setup profile
        const userHasProfile = await checkUserProfile(
          resultAction.payload.userId
        );

        if (userHasProfile) {
          router.replace("/(home)");
        } else {
          router.replace("/(auth)");
        }
      } else {
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Error handling successful auth:", error);
      handleAuthFailure();
    }
  };

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    stopWordsSubscription();
    dispatch(clearUser());
    dispatch(clearProfile());
    router.replace("/(auth)/sign-in");
  };

  useEffect(() => {
    dispatch(setLoading(true));

    // Subscribe to Auth status changes
    const authListener = Hub.listen("auth", async (data) => {
      const { event } = data.payload;

      console.log("🔐 Auth event:", event);

      switch (event) {
        case "signInWithRedirect":
          console.log("✅ Sign in with redirect completed");
          try {
            const user = await getCurrentUser();
            await handleSuccessfulAuth(user);
          } catch (error) {
            console.error("❌ Failed after redirect:", error);
            handleAuthFailure();
          }
          break;

        case "signInWithRedirect_failure":
          console.log("❌ Sign in with redirect failed");
          handleAuthFailure();
          break;

        case "signedIn":
          console.log("✅ User signed in (email)");
          try {
            const user = await getCurrentUser();
            await handleSuccessfulAuth(user);
          } catch (error) {
            console.error("❌ Failed after email sign in:", error);
            handleAuthFailure();
          }
          break;

        case "signedOut":
          console.log("🚪 User signed out");
          handleAuthFailure();
          break;

        case "tokenRefresh_failure":
          console.log("❌ Session invalid");
          handleAuthFailure();
          break;

        default:
          break;
      }
    });

    // Initial auth check (only once on app start)
    const checkInitialAuth = async () => {
      try {
        const user = await getCurrentUser();
        console.log("✅ Initial auth check - user authenticated");
        await handleSuccessfulAuth(user);
      } catch (error) {
        console.log("❌ Initial auth check - user not authenticated");
        setIsAuthenticated(false);
        router.replace("/(auth)/sign-in");
      }
    };

    // Delay initial auth check to let splash screen show
    const authCheckTimer = setTimeout(checkInitialAuth, 2500);

    return () => {
      authListener();
      clearTimeout(authCheckTimer);
      // Clean up words subscription on component unmount
      stopWordsSubscription();
    };
  }, [dispatch]);

  // Add helper function
  const cleanSchedule = (schedule: any) => ({
    id: schedule.id,
    userProfileId: schedule.userProfileId,
    scheduleDate: schedule.scheduleDate,
    notificationId: schedule.notificationId || null,
    successRate: schedule.successRate || null,
    totalWords: schedule.totalWords || null,
    reviewedCount: schedule.reviewedCount || null,
    toBeReviewedCount: schedule.toBeReviewedCount || null,
    scheduleInfo: schedule.scheduleInfo || null,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  });

  // Subscribe to today's schedule
  useEffect(() => {
    if (!userProfile?.id) {
      console.log("⚠️ No profile for schedule subscription");
      return;
    }

    console.log("🔄 Setting up schedule subscription");

    const currentDate = new Date().toISOString().split("T")[0];

    const sub = (client.models as any).ReviewSchedule.observeQuery({
      filter: {
        and: [
          { userProfileId: { eq: userProfile.id } },
          { scheduleDate: { eq: currentDate } },
        ],
      },
    }).subscribe({
      next: ({ items, isSynced }: any) => {
        console.log(
          `📋 Schedule subscription update: ${items.length} items, synced: ${isSynced}`
        );

        if (items.length > 0) {
          const cleanedSchedule = cleanSchedule(items[0]);
          console.log("✅ Schedule cleaned and dispatched:", cleanedSchedule);
          dispatch(setTodaySchedule(cleanedSchedule));
        }
      },
      error: (error: any) => {
        console.error("❌ Schedule subscription error:", error);
      },
    });

    setScheduleSubscription(sub);

    return () => {
      if (sub) {
        sub.unsubscribe();
        console.log("🔕 Schedule subscription unsubscribed");
      }
    };
  }, [userProfile?.id, dispatch]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="(home)"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen name="(about)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(definition)"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(gallery)"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(inventory)"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(reviewQueue)"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="(progress)"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <Authenticator.Provider>
          <AppContent />
        </Authenticator.Provider>
      </Provider>
    </ThemeProvider>
  );
}
