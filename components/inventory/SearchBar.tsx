import { View, Text, TouchableOpacity, TextInput } from "react-native";
import React, { useEffect, useState } from "react";
import { CircleX, Search } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

interface SearchBarProps {
  ifInputComp: boolean;
  setIfInputComp: (value: boolean) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const SearchBar = ({
  ifInputComp,
  setIfInputComp,
  searchQuery,
  setSearchQuery,
}: SearchBarProps) => {
  const progress = useSharedValue(0);

  const [ifShowInput, setIfShowInput] = useState(false);
  useEffect(() => {
    if (!ifInputComp) {
      setIfShowInput(false);
    }
  }, [ifInputComp]);

  useEffect(() => {
    progress.value = withTiming(ifInputComp ? 1 : 0, { duration: 200 });
  }, [ifInputComp]);

  const searchInputAnimation = useAnimatedStyle(() => {
    return {
      width: withTiming(ifInputComp ? "100%" : "10%", { duration: 200 }),
    };
  });

  const fadeInAnimation = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ["transparent", "#1f2022"]
      ),
      opacity: progress.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "transparent",
        },
        searchInputAnimation,
      ]}
      className="h-full relative  flex justify-center items-start"
    >
      <TouchableOpacity
        style={{
          zIndex: 99,
          opacity: ifShowInput ? 0 : 1,
        }}
        disabled={ifInputComp}
        onPress={() => {
          setIfInputComp(true);
        }}
        className="flex-row items-center px-3 py-2 absolute left-0"
      >
        <Search color={"#6B7280"} />
      </TouchableOpacity>

      {ifInputComp && (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 12,
            },
            fadeInAnimation,
          ]}
        >
          {searchQuery.length > 0 && (
            <TouchableOpacity
              className="  h-full  px-3 flex justify-center items-center border-red-50 p-2"
              style={{
                position: "absolute",
                right: 0,
                zIndex: 99,
              }}
              onPress={() => {
                setSearchQuery("");
              }}
            >
              <CircleX size={21} color={"#fff"} opacity={0.7} />
            </TouchableOpacity>
          )}
          {ifShowInput ? (
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              style={{
                color: "white",
                opacity: 0.7,
                fontSize: 16,
              }}
              className=" w-full h-full  px-3  "
            />
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setIfShowInput(true);
              }}
              className="w-full h-full justify-center items-center"
            ></TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default SearchBar;
