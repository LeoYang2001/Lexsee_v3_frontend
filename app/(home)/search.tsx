import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { ChevronLeft } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { getWordSuggestions } from "../../apis/getWordSuggestions";

export default function SearchPage() {
  const theme = useTheme();
  const [showInput, setShowInput] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const mockHistoryList = [
    { id: 1, text: "wistful" },
    { id: 2, text: "serene" },
    { id: 3, text: "melancholy" },
    { id: 4, text: "ephemeral" },
    { id: 5, text: "nostalgia" },
  ];

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

  const handleWordSelect = (word: string) => {
    setSearchQuery("");
    setSuggestions([]);
    Keyboard.dismiss();
    // Navigate to definition page
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
          <TouchableOpacity className=" my-4 flex flex-row items-center gap-2">
            <Text className=" text-white">English</Text>
            <AntDesign name="caretdown" size={12} color="#ccc" />
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
            <Text
              style={{
                fontSize: 12,
              }}
              className=" text-white opacity-70"
            >
              {searchQuery.trim().length > 0 ? "Suggestions" : "History"}
            </Text>
            {searchQuery.trim().length === 0 && (
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 12,
                  }}
                  className="text-white opacity-70"
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
              mockHistoryList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="py-3 border-b border-white/10"
                  onPress={() => handleWordSelect(item.text)}
                >
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-white text-base">{item.text}</Text>
                    <AntDesign name="clockcircleo" size={14} color="#666" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
