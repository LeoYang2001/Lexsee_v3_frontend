import { Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Provider } from "react-redux";
import { store } from "../store";
import outputs from "../amplify_outputs.json";
import "../global.css";
import { useEffect } from "react";
import { client } from "./client";
import { useAppDispatch } from "../store/hooks";
import {
  setWords,
  setSynced,
  setLoading,
  setError,
} from "../store/slices/wordsListSlice";

Amplify.configure(outputs);

// Component that uses hooks (must be inside Provider)
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setLoading(true));

    // Subscribe to Word changes
    const sub = (client.models as any).Word.observeQuery().subscribe({
      next: ({ items, isSynced }: any) => {
        console.log("Words received:", [...items], "Synced:", isSynced);

        // Clean the data by removing the wordsList function
        const cleanWords = [...items].map((word) => {
          const { wordsList, ...cleanWord } = word;
          return cleanWord;
        });

        // Update Redux store
        dispatch(setWords(cleanWords));
        dispatch(setSynced(isSynced));
      },
      error: (error: any) => {
        console.error("WordsList subscription error:", error);
        dispatch(setError(error.message || "Failed to sync words"));
      },
    });

    return () => {
      sub.unsubscribe?.();
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
