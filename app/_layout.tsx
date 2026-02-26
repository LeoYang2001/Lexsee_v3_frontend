import { router, SplashScreen, Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Provider } from "react-redux";
import { persistor, store } from "../store";
import outputs from "../amplify_outputs.json";
import "../global.css";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useLaunchSequence } from "../hooks/useLaunchSequence";
import { PersistGate } from "redux-persist/integration/react";
import { View } from "react-native";
import { OnboardingOverlay } from "../components/onboarding/OnboardingOverlay";
import { OnboardingProvider } from "../context/OnboardingContext";

import { SQLiteProvider } from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

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

SplashScreen.preventAutoHideAsync();

function AppContent() {
  // Run launch sequence - handles all initialization:
  // 1. China user check (useCheckChina)
  // 2. Initial auth check
  //    - If successful:
  //      a. Check user profile
  //      b. Start words subscription (only if profile exists)
  //      c. Fetch all-time review schedules (only if profile exists)
  //    - If failed: redirect to login
  // 3. Setup schedule subscription (when profile is loaded)
  const { appReady, targetRoute } = useLaunchSequence();
  const navigatedRef = useRef<string | null>(null);

  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function setupDatabase() {
      try {
        const dbName = "lexsee-words.db";
        const dbDir = `${FileSystem.documentDirectory}SQLite`;
        const dbPath = `${dbDir}/${dbName}`;

        // 1. Ensure the SQLite directory exists
        const dirInfo = await FileSystem.getInfoAsync(dbDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }

        // 2. Check if the DB exists
        const fileInfo = await FileSystem.getInfoAsync(dbPath);

        // 3. Always copy in development to ensure FTS5 is active,
        // or just if !exists for production
        if (!fileInfo.exists) {
          const asset = await Asset.fromModule(
            require("../assets/words_phonetic_db/lexsee-words.db"),
          ).downloadAsync();
          await FileSystem.copyAsync({
            from: asset.localUri!,
            to: dbPath,
          });
        }

        setIsDbReady(true);
      } catch (e) {
        console.error("Database initialization failed", e);
      }
    }

    setupDatabase();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!appReady || !targetRoute) return;
      if (navigatedRef.current === targetRoute) return;

      // (4) hide splash first
      await SplashScreen.hideAsync();

      // (5) then navigate
      navigatedRef.current = targetRoute;
      router.replace(targetRoute);
    };

    run();
  }, [appReady, targetRoute, isDbReady]);
  return (
    <View className="flex-1">
      <SQLiteProvider databaseName="lexsee-words.db" useSuspense>
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
            name="(reviewGallery)"
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
      </SQLiteProvider>
      <OnboardingOverlay />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Authenticator.Provider>
            <OnboardingProvider>
              <AppContent />
            </OnboardingProvider>
          </Authenticator.Provider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}
