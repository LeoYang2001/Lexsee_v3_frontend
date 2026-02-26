import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { ChevronLeft } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import { SearchHistoryItem } from "../../types/common/SearchHistoryItem";
import { useSQLiteContext } from "expo-sqlite";

interface SearchSuggestionItem {
  word: string;
  phonetic: string;
}

export default function SearchPage() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState("");
  const inputRef = useRef<TextInput>(null);
  const adminPasskeyRef = useRef<TextInput>(null);

  const ADMIN_PASSKEY = process.env.EXPO_PUBLIC_REVIEWER_PASSKEY;

  // 1. Use your new Local Hook
  const { history, addToHistory, clearHistory } = useSearchHistory();

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoadingSuggestions(true);
        handleSearch(searchQuery);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    }, 100); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (text: string) => {
    try {
      // Use the FTS5 MATCH syntax you tested in TablePlus
      // We append '*' so 'app' finds 'apple', 'apply', etc.
      const allRows = await db.getAllAsync<{ word: string; phonetic: string }>(
        "SELECT word, phonetic FROM dictionary WHERE word MATCH ? LIMIT 20",
        [`${text}*`],
      );
      setSuggestions(allRows);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleWordSelect = (word: string) => {
    // Check for admin entry trigger
    if (word.toLowerCase() === "admin-review") {
      setShowAdminModal(true);
      setSearchQuery("");
      setSuggestions([]);
      Keyboard.dismiss();
      return;
    }

    addToHistory(word);
    setSearchQuery("");
    setSuggestions([]);
    Keyboard.dismiss();
    router.push(`/(definition)?word=${encodeURIComponent(word)}`);
  };

  const handleAdminPasskeySubmit = () => {
    if (adminPasskey === ADMIN_PASSKEY) {
      setShowAdminModal(false);
      setAdminPasskey("");
      router.push("/(reviewGallery)");
    } else {
      Alert.alert("Invalid Passkey", "The passkey you entered is incorrect.", [
        {
          text: "Try Again",
          onPress: () => {
            setAdminPasskey("");
            if (adminPasskeyRef.current) {
              adminPasskeyRef.current.focus();
            }
          },
        },
        {
          text: "Cancel",
          onPress: () => {
            setShowAdminModal(false);
            setAdminPasskey("");
          },
        },
      ]);
    }
  };

  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
    setAdminPasskey("");
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
          <View style={{ position: "relative", width: "100%", height: 49 }}>
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
          </View>
        </View>

        {/* SEARCH SUGGESTIONS OR HISTORY */}
        <View className="w-full flex-1 mt-6">
          <View className=" flex flex-row justify-between items-center">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 12 }} className=" text-white opacity-70">
                {searchQuery.trim().length > 0 ? "Suggestions" : "History"}
              </Text>
            </View>
            {searchQuery.trim().length === 0 && (
              <TouchableOpacity
                onPress={clearHistory}
                disabled={isHistoryLoading || history.length === 0}
              >
                <Text
                  style={{
                    fontSize: 12,
                    opacity:
                      isHistoryLoading || history.length === 0 ? 0.5 : 0.9,
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
                  suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={`suggestion-${index}`}
                      className="py-3 border-b border-white/10"
                      onPress={() => handleWordSelect(item.word)}
                    >
                      <Text className="text-white text-base">{item.word}</Text>
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
                ) : history.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Text className="text-white opacity-60 mb-2">
                      No search history yet
                    </Text>
                  </View>
                ) : (
                  history.map((item: SearchHistoryItem, index: number) => (
                    <TouchableOpacity
                      key={`${item.word}-${index}`}
                      className="py-3 border-b border-white/10"
                      onPress={() => handleWordSelect(item.word)}
                    >
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-white text-base">
                          {item.word}
                        </Text>
                        <AntDesign name="clockcircleo" size={14} color="#666" />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>

        {/* Admin Passkey Modal */}
        <Modal
          visible={showAdminModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseAdminModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              justifyContent: "flex-start",
              alignItems: "center",
              paddingTop: "60%",
            }}
          >
            <View
              style={{
                backgroundColor: theme.background,
                borderRadius: 16,
                padding: 24,
                width: "80%",
                maxWidth: 350,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 8,
                }}
              >
                Developer Access
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#aaa",
                  marginBottom: 20,
                }}
              >
                Enter passkey to access admin panel
              </Text>

              <TextInput
                ref={adminPasskeyRef}
                value={adminPasskey}
                onChangeText={setAdminPasskey}
                placeholder="Enter passkey"
                placeholderTextColor="#666"
                secureTextEntry={true}
                style={{
                  backgroundColor: "#2b2c2d",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: "white",
                  fontSize: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: "#444",
                }}
                returnKeyType="done"
                onSubmitEditing={handleAdminPasskeySubmit}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleCloseAdminModal}
                  style={{
                    flex: 1,
                    backgroundColor: "#444",
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "500" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAdminPasskeySubmit}
                  style={{
                    flex: 1,
                    backgroundColor: "#6366f1",
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "500" }}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}
