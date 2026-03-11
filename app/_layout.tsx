import { router, SplashScreen, Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Provider } from "react-redux";
import { persistor, store } from "../store";
import outputs from "../amplify_outputs.json";
import "../global.css";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useLaunchSequence } from "../hooks/useLaunchSequence";
import { PersistGate } from "redux-persist/integration/react";
import { View } from "react-native";
import { OnboardingOverlay } from "../components/onboarding/OnboardingOverlay";
import { OnboardingProvider } from "../context/OnboardingContext";
import { SQLiteProvider } from "expo-sqlite";

Amplify.configure(outputs);

// Notification settings
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
  const { appReady, targetRoute } = useLaunchSequence();
  const navigatedRef = useRef<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!appReady || !targetRoute) return;
      if (navigatedRef.current === targetRoute) return;

      // Hide splash first, then navigate
      await SplashScreen.hideAsync();

      navigatedRef.current = targetRoute;
      router.replace(targetRoute);
    };

    run();
  }, [appReady, targetRoute]);

  return (
    <View className="flex-1">
      <SQLiteProvider
        databaseName="lexsee-words.db"
        assetSource={{
          assetId: require("../assets/words_phonetic_db/lexsee-words.db"),
        }}
        useSuspense
      >
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

        <OnboardingOverlay />
      </SQLiteProvider>
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
