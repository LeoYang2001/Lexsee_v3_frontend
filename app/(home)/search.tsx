import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { ChevronLeft } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";

export default function SearchPage() {
  const theme = useTheme();
  const [showInput, setShowInput] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const mockHistoryList = [
    { id: 1, text: "Example search 1" },
    { id: 2, text: "Example search 2" },
    { id: 3, text: "Example search 3" },
    { id: 4, text: "Example search 4" },
    { id: 5, text: "Example search 5" },
  ];
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
              // Handle back navigation
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
              placeholder="Search..."
              placeholderTextColor="#aaa"
              onBlur={() => setShowInput(false)}
              onFocus={() => setShowInput(true)}
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
        {/* SEARCH HISTORY  */}
        <View className="w-full flex-1 mt-6 border border-red-500">
          <View className=" flex flex-row justify-between items-center">
            <Text
              style={{
                fontSize: 12,
              }}
              className=" text-white opacity-70"
            >
              History
            </Text>
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
          </View>
          <ScrollView className="px-3 pt-6" keyboardShouldPersistTaps="always">
            {mockHistoryList.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="py-2 border-b border-white/10"
                onPress={() => {
                  // Handle search item press
                  console.log(`Search for: ${item.text}`);
                }}
              >
                <Text className="text-white">{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
