import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { ChevronLeft } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { getWordSuggestions } from "../../apis/getWordSuggestions";
import { client } from "../client";
import { useAppSelector } from "../../store/hooks";
import Animated from "react-native-reanimated";

export default function SearchPage() {
  const theme = useTheme();
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const userProfile = useAppSelector((state) => state.profile.profile);

  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  //get real search history from backend

  useEffect(() => {
    const getSearchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const history = await (client.models as any).SearchHistory.list({
          filter: { userProfileId: { eq: userProfile?.id } },
        });
        const rows = Array.isArray(history?.data)
          ? history.data
          : history || [];
        // normalize to array of strings if stored as searchedWords json
        const flat: string[] = rows
          .map((r: any) => {
            if (typeof r === "string") return r;
            // if searchedWords already an array, use first element
            if (Array.isArray(r?.searchedWords))
              return r.searchedWords[0] ?? null;
            // if searchedWords is a JSON string, parse it
            if (typeof r?.searchedWords === "string") {
              try {
                const parsed = JSON.parse(r.searchedWords);
                if (Array.isArray(parsed)) return parsed[0] ?? null;
                return parsed ?? null;
              } catch (e) {
                // fallback to the raw string
                console.warn(
                  "parse searchedWords failed, using raw string:",
                  e
                );
                return r.searchedWords;
              }
            }
            return null;
          })
          .filter(Boolean);

        // dedupe (preserve first occurrence) and keep newest 12
        const deduped: string[] = flat
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 12);

        // prefer storing the raw rows in state for later use, but UI expects strings:
        setSearchHistory(deduped);
        console.log("history got :", rows);
      } catch (error) {
        console.error("Error fetching search history:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    getSearchHistory();

    return () => {
      setSearchHistory([]);
    };
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoadingSuggestions(true);
        const wordSuggestions = await getWordSuggestions(searchQuery);
        setSuggestions(wordSuggestions);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const appendSearchHistory = async (term: string) => {
    if (!term?.trim() || !userProfile?.id) return;

    // update local state (dedupe, newest first) - limit to 12
    setSearchHistory((prev) => {
      const filtered = prev.filter((t: string) => t !== term);
      const next = [term, ...filtered];
      return next.slice(0, 12);
    });

    // persist to backend (best-effort, non-blocking)
    try {
      const models = (client as any)?.models;
      const SearchHistoryModel = models?.SearchHistory;
      if (!SearchHistoryModel) {
        console.log(
          "appendSearchHistory: SearchHistory model not found on client.models"
        );
        return;
      }

      console.log(
        "appendSearchHistory: found SearchHistoryModel, querying existing records for user:",
        userProfile.id
      );
      let res: any;
      try {
        res = await SearchHistoryModel.list({
          filter: { userProfileId: { eq: userProfile.id } },
        });
        console.log("appendSearchHistory: list response:", res);
      } catch (listErr) {
        console.error(
          "appendSearchHistory: SearchHistory.list failed:",
          listErr
        );
        return;
      }

      const rows = Array.isArray(res?.data)
        ? res.data
        : res?.data
          ? [res.data]
          : [];
      const row = rows[0];
      console.log("appendSearchHistory: existing row (first):", row);

      const existing = Array.isArray(row?.searchedWords)
        ? row.searchedWords
        : [];
      // if stored as JSON string, parse it
      if (typeof row?.searchedWords === "string") {
        try {
          const parsed = JSON.parse(row.searchedWords);
          if (Array.isArray(parsed)) {
            // override existing with parsed array
            // eslint-disable-next-line no-unused-vars
            // @ts-ignore
            existing.length = 0;
            // @ts-ignore
            parsed.forEach((p: string) => existing.push(p));
          }
        } catch (e) {
          console.warn(
            "appendSearchHistory: failed to parse existing searchedWords JSON",
            e
          );
        }
      }

      const merged = [
        term,
        ...existing.filter((w: string) => w !== term),
      ].slice(0, 12);
      console.log("appendSearchHistory: merged searchedWords:", merged);

      if (row && typeof SearchHistoryModel.update === "function") {
        try {
          // send JSON string for a.json() field
          const updateRes = await SearchHistoryModel.update({
            id: row.id,
            searchedWords: JSON.stringify(merged),
          });
          console.log(
            "appendSearchHistory: updated row id:",
            row.id,
            "updateRes:",
            updateRes
          );
        } catch (updateErr) {
          console.error(
            "appendSearchHistory: SearchHistory.update failed:",
            updateErr
          );
        }
      } else if (typeof SearchHistoryModel.create === "function") {
        try {
          // send JSON string for a.json() field
          const createRes = await SearchHistoryModel.create({
            userProfileId: userProfile.id,
            searchedWords: JSON.stringify(merged),
          });
          console.log(
            "appendSearchHistory: created new SearchHistory row:",
            createRes
          );
        } catch (createErr) {
          console.error(
            "appendSearchHistory: SearchHistory.create failed:",
            createErr
          );
        }
      } else {
        console.warn(
          "appendSearchHistory: neither update nor create is available on SearchHistoryModel"
        );
      }
    } catch (err) {
      console.warn("append search history failed", err);
    }
  };

  // clear all history locally and on backend
  const clearAllHistory = async () => {
    if (!userProfile?.id) {
      setSearchHistory([]);
      return;
    }

    // optimistic local clear
    setSearchHistory([]);
    setIsHistoryLoading(true);

    try {
      const models = (client as any)?.models;
      const SearchHistoryModel = models?.SearchHistory;
      if (!SearchHistoryModel) {
        console.warn("clearAllHistory: SearchHistory model not found");
        setIsHistoryLoading(false);
        return;
      }

      // find existing row(s) for this user
      const res = await SearchHistoryModel.list({
        filter: { userProfileId: { eq: userProfile.id } },
      });
      console.log("clearAllHistory: list response:", res);
      const rows = Array.isArray(res?.data)
        ? res.data
        : res?.data
          ? [res.data]
          : [];

      // if rows exist, update each to empty json string; otherwise nothing to do
      for (const r of rows) {
        try {
          if (typeof SearchHistoryModel.update === "function") {
            const updateRes = await SearchHistoryModel.update({
              id: r.id,
              searchedWords: JSON.stringify([]),
            });
            console.log("clearAllHistory: cleared row id:", r.id, updateRes);
          } else if (typeof SearchHistoryModel.delete === "function") {
            // fallback: delete the row if update not supported
            const delRes = await SearchHistoryModel.delete({ id: r.id });
            console.log("clearAllHistory: deleted row id:", r.id, delRes);
          } else {
            console.warn(
              "clearAllHistory: neither update nor delete available on model"
            );
          }
        } catch (rowErr) {
          console.error("clearAllHistory: failed to clear row", r?.id, rowErr);
        }
      }
    } catch (err) {
      console.error("clearAllHistory failed:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleWordSelect = (word: string) => {
    appendSearchHistory(word);
    setSearchQuery("");
    setSuggestions([]);
    Keyboard.dismiss();
    router.push(`/(definition)?word=${encodeURIComponent(word)}`);
  };

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [inputRef]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
        className=" flex w-full h-full flex-col justify-start px-3"
      >
        <View className=" mt-16 w-full  justify-between flex-row items-center ">
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
          >
            <ChevronLeft color={"#fff"} />
          </TouchableOpacity>
        </View>
        <View className=" w-full mt-3">
          <Animated.View 
            sharedTransitionTag="search-bar"
            style={{ position: "relative", width: "100%", height: 49 }}
          >
            <TextInput
              ref={inputRef}
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                height: "100%",
                backgroundColor: "#2b2c2d",
                borderRadius: 12,
                paddingHorizontal: 16,
                color: "white",
                fontSize: 16,
                opacity: showInput ? 1 : 0,
                zIndex: showInput ? 2 : 0,
                position: "absolute",
                width: "100%",
                top: 0,
                left: 0,
              }}
              className="w-full"
              placeholder="Search for words..."
              placeholderTextColor="#aaa"
              onBlur={() => setShowInput(false)}
              onFocus={() => setShowInput(true)}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  handleWordSelect(searchQuery.trim());
                }
              }}
            />
            {!showInput && (
              <TouchableOpacity
                style={{
                  height: 49,
                  backgroundColor: "#2b2c2d",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                  alignItems: "flex-start",
                  zIndex: 0,
                }}
                className="w-full flex justify-center "
                onPress={() => {
                  setShowInput(true);
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <AntDesign
                  color={"white"}
                  style={{ opacity: 0.6 }}
                  name="search1"
                  size={22}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* SEARCH SUGGESTIONS OR HISTORY */}
        <View className="w-full flex-1 mt-6">
          <View className=" flex flex-row justify-between items-center">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 12 }} className=" text-white opacity-70">
                {searchQuery.trim().length > 0 ? "Suggestions" : "History"}
              </Text>
              {isHistoryLoading && searchQuery.trim().length === 0 && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
            {searchQuery.trim().length === 0 && (
              <TouchableOpacity
                onPress={clearAllHistory}
                disabled={isHistoryLoading || searchHistory.length === 0}
              >
                <Text
                  style={{
                    fontSize: 12,
                    opacity:
                      isHistoryLoading || searchHistory.length === 0
                        ? 0.5
                        : 0.9,
                  }}
                  className="text-white"
                >
                  Clear all
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView className="px-3 pt-6" keyboardShouldPersistTaps="always">
            {/* Show suggestions if there's a search query, otherwise show history */}
            {searchQuery.trim().length > 0 ? (
              <>
                {isLoadingSuggestions ? (
                  // Loading state
                  <View className="py-4">
                    <Text className="text-white opacity-50 text-center">
                      Loading suggestions...
                    </Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  // Show suggestions
                  suggestions.map((word, index) => (
                    <TouchableOpacity
                      key={`suggestion-${index}`}
                      className="py-3 border-b border-white/10"
                      onPress={() => handleWordSelect(word)}
                    >
                      <Text className="text-white text-base">{word}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  // No suggestions found
                  <View className="py-4">
                    <Text className="text-white opacity-50 text-center">
                      No suggestions found
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Show history when no search query
              <>
                {isHistoryLoading ? (
                  <View className="py-6 items-center justify-center">
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : searchHistory.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Text className="text-white opacity-60 mb-2">
                      No search history yet
                    </Text>
                  </View>
                ) : (
                  searchHistory.map((text: string, index: number) => (
                    <TouchableOpacity
                      key={`${text}-${index}`}
                      className="py-3 border-b border-white/10"
                      onPress={() => handleWordSelect(text)}
                    >
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-white text-base">{text}</Text>
                        <AntDesign name="clockcircleo" size={14} color="#666" />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
