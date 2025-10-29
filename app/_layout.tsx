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
import { useAppDispatch } from "../store/hooks";
import {
  setWords,
  setSynced,
  setLoading,
  setError,
} from "../store/slices/wordsListSlice";
import { clearUser, fetchUserInfo } from "../store/slices/userSlice";
import { getCurrentUser } from "aws-amplify/auth";
import {
  clearProfile,
  setProfile,
  setProfileError,
  setProfileLoading,
} from "../store/slices/profileSlice";
import * as Notifications from "expo-notifications";
import { useCheckChina } from "../hooks/useCheckChina";

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

  // Move your profile helper functions here
  const serializeProfile = async (profile: any) => {
    const { wordsList, ...cleanProfile } = profile;

    try {
      const wordsList_res = await wordsList();
      const wordsListData = wordsList_res.data;

      return {
        ...cleanProfile,
        wordsListId: wordsListData?.id || null,
      };
    } catch (error) {
      console.error("Error fetching wordsList:", error);
      return {
        ...cleanProfile,
        wordsListId: null,
      };
    }
  };

  const checkUserProfile = async (userId: string): Promise<boolean> => {
    dispatch(setProfileLoading(true));

    try {
      const profileResult = await (client as any).models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (profileResult.data.length > 0) {
        const profile = profileResult.data[0];

        const serializedProfile = await serializeProfile(profile);
        dispatch(setProfile(serializedProfile));

        // Clear any pending creation for this user
        if (profileCreationTimeout.current[userId]) {
          clearTimeout(profileCreationTimeout.current[userId]);
          delete profileCreationTimeout.current[userId];
        }
        delete profileCreationInProgress.current[userId];

        return true;
      } else {
        // Check if we're already creating a profile for this user
        if (profileCreationInProgress.current[userId]) {
          console.log(
            "⏳ Profile creation already in progress for user:",
            userId
          );
          return false;
        }

        console.log("No profile found, creating new profile...");

        // Mark profile creation as in progress
        profileCreationInProgress.current[userId] = true;

        let newProfileResult;
        try {
          newProfileResult = await (client as any).models.UserProfile.create({
            userId: userId,
            username: "user",
            schedule: JSON.stringify({}),
          });
          console.log("✅ created new profile", newProfileResult.data?.id);
        } catch (error) {
          console.error("❌ Error creating new profile:", error);
          delete profileCreationInProgress.current[userId];
          return false;
        }

        if (newProfileResult.data) {
          try {
            await (client as any).models.WordsList.create({
              userProfileId: newProfileResult.data.id,
            });
            console.log("✅ created new words list");
          } catch (error) {
            console.error("❌ Error creating words list:", error);
          }

          const serializedProfile = await serializeProfile(
            newProfileResult.data
          );
          dispatch(setProfile(serializedProfile));

          // Clear creation flag after success with a timeout to prevent race conditions
          profileCreationTimeout.current[userId] = setTimeout(() => {
            delete profileCreationInProgress.current[userId];
          }, 2000);

          return true;
        } else {
          dispatch(setProfileError("Failed to create profile"));
          delete profileCreationInProgress.current[userId];
          return false;
        }
      }
    } catch (error) {
      console.error("❌ Error checking user profile:", error);
      dispatch(setProfileError("Error checking user profile"));
      delete profileCreationInProgress.current[userId];
      return false;
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
        const cleanWords = [...items].map((word) => {
          const { wordsList, ...cleanWord } = word;
          return cleanWord;
        });
        dispatch(setWords(cleanWords));
        dispatch(setSynced(isSynced));
      },
      error: (error: any) => {
        console.error("WordsList subscription error:", error);
        dispatch(setError(error.message || "Failed to sync words"));
      },
    });

    setWordsSubscription(sub);
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
