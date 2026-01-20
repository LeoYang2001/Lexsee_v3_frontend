// app/(inventory)/index.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Word } from "../../types/common/Word";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
} from "lucide-react-native";
import FlexCard from "../../components/common/FlexCard";
import GraphicToggleBtn from "../../components/inventory/GraphicToggleBtn";
import SearchBar from "../../components/inventory/SearchBar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// Helper to format date as YYYY-MM-DD
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0];
};

const InventoryScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const wordsFromDB = useSelector((state: RootState) => state.wordsList.words);

  const router = useRouter();
  const [sortAsc, setSortAsc] = useState(false);
  const [ifGraphic, setIfGraphic] = useState(false);
  const [ifDetail, setIfDetail] = useState<string | null>(null);
  const [ifInputComp, setIfInputComp] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<"review" | "master">("review");
  const [words, setWords] = useState<Word[]>(wordsFromDB);

  const TABWIDTH = 63;
  
  // Animated value for slider position
  const sliderPosition = useSharedValue(0);

  // Filter words based on filterMode
  useEffect(() => {
    if (filterMode === "review") {
      // Show words that are not mastered (status != "LEARNED")
      const reviewWords = wordsFromDB.filter(
        (word) => word.status !== "LEARNED"
      );
      setWords(reviewWords);
    } else {
      // Show mastered words (status == "LEARNED")
      const masteredWords = wordsFromDB.filter(
        (word) => word.status === "LEARNED"
      );
      setWords(masteredWords);
    }
  }, [filterMode, wordsFromDB]);

  // Animated style for the slider indicator
  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderPosition.value }, { translateY: -1.5 }],
    };
  });

  // Handle tab switch
  const handleTabSwitch = (mode: "review" | "master", tabWidth: number) => {
    setFilterMode(mode);
    sliderPosition.value = withTiming(mode === "review" ? 0 : tabWidth, {
      duration: 250,
    });
  };

  // Filter words based on search query
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) {
      return words;
    }

    const query = searchQuery.toLowerCase().trim();
    return words.filter((word) => {
      if (word.word.toLowerCase().includes(query)) return true;
    });
  }, [words, searchQuery]);

  const groupedWords = useMemo(() => {
    const groups: { [date: string]: Word[] } = {};
    filteredWords.forEach((word) => {
      const dateKey = word.timeStamp ? formatDate(word.timeStamp) : "Unknown";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(word);
    });
    // Sort dates based on sortAsc
    const sortedDates = Object.keys(groups).sort((a, b) =>
      sortAsc ? (a > b ? 1 : -1) : a < b ? 1 : -1
    );
    return sortedDates.map((date) => ({
      date,
      words: groups[date],
    }));
  }, [filteredWords, sortAsc]);

  const renderWordItem = ({ item , index}: { item: Word, index: number }) => (
    <TouchableWithoutFeedback
      onPress={() => {
        if (!ifGraphic) return;
        setIfDetail(
          ifDetail === (item.id || item.word) ? null : item.id || item.word
        );
      }}
    >
      <View className="my-2">
        <FlexCard
          word={item}
          ifGraphic={ifGraphic}
          ifDetail={ifDetail === (item.id || item.word)}
          index={index}
        />
      </View>
    </TouchableWithoutFeedback>
  );
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20 px-6">
      {/* Icon */}
      <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-6">
        <Feather
          name={searchQuery ? "search" : "book-open"}
          size={40}
          color="#6B7280"
        />
      </View>

      {/* Title */}
      <Text className="text-white text-xl font-bold mb-3 text-center">
        {searchQuery ? "No words found" : "No words in your collection"}
      </Text>

      {/* Subtitle */}
      <Text className="text-gray-400 text-base text-center leading-6 mb-6">
        {searchQuery
          ? `Try different keywords or check spelling.`
          : "Start building your vocabulary by searching and saving new words."}
      </Text>
    </View>
  );

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        setIfDetail(null);
        if (!searchQuery) setIfInputComp(false);
      }}
    >
      <View
        style={{
          backgroundColor: "#131416",
        }}
        className=" w-full h-full flex flex-col px-3 "
      >
        <StatusBar style="light" />
        {/* Header */}
        <View className="mt-16 w-full  justify-between  flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
            className={`${!ifInputComp ? "flex-1" : ""}`}
          >
            <ChevronLeft color={"#fff"} />
          </TouchableOpacity>
          {/* Filter for review & mastered words  */}
          {
            !ifInputComp && (
              <View className="flex-1 flex-row items-center justify-center">

               
                <View className="flex-row bg-transparent relative">
                  {/* Slider track */}
                  <View
                  className=" absolute flex justify-center items-center w-full h-[7px]  -bottom-[7px]"
                   >
                      <View
                      
                 style={{
                  width:2*TABWIDTH,
                  height:7,
                  backgroundColor:"#262729",
                  borderRadius:44
                }} 
                      
                      >
                         {/* Animated Slider Indicator */}
                  <Animated.View
                    style={[
                      animatedSliderStyle,
                      {
                        position: "absolute",
                        top: "50%",
                        // transform: [{ translateY: -1.5 }],
                        left: 3,
                        width: 60,
                        height: 3,
                        backgroundColor: "#fff",
                        opacity:0.5,
                        borderRadius: 33,
                      },
                    ]}
                  />
                        </View>

                    </View>
                  {/* Review Tab */}
                  <TouchableOpacity

                    onPress={() => handleTabSwitch("review", 60)}
                    className="flex justify-center items-center"
                    style={{ width: TABWIDTH, height:32}}
                  >
                    <Text
                    numberOfLines={1}
                    style={{
                      fontSize:14
                    }}
                      className={` text-white   font-semibold ${
                        filterMode === "review"
                          ? " opacity-80 "
                          : " opacity-50"
                      }`}
                    >
                      Review
                    </Text>
                  </TouchableOpacity>

                  {/* Master Tab */}
                  <TouchableOpacity
                    onPress={() => handleTabSwitch("master", 60)}
                    className="flex justify-center items-center"
                    style={{ width: TABWIDTH, height:32 }}
                  >
                     <Text
                    numberOfLines={1}
                    style={{
                      fontSize:14
                    }}
                      className={` text-white font-semibold ${
                        filterMode === "master"
                          ? " opacity-80 "
                          : " opacity-50"
                      }`}
                    >
                      Master
                    </Text>
                  </TouchableOpacity>

                 
                </View>
              </View>
            )
          }
          <View
            style={{
              height: 49,
            }}
            className=" flex-1   flex items-end  h-3"
          >
            <SearchBar
              setSearchQuery={setSearchQuery}
              searchQuery={searchQuery}
              setIfInputComp={setIfInputComp}
              ifInputComp={ifInputComp}
            />
          </View>
        </View>
        <View className="flex-row items-center justify-end gap-3 my-2">
          {/* Sort Button */}
          <TouchableOpacity
            onPress={() => setSortAsc((prev) => !prev)}
            className=" flex justify-center items-center p-2"
          >
            {!sortAsc ? (
              <ArrowDownWideNarrow color={"#fff"} opacity={0.7} />
            ) : (
              <ArrowUpNarrowWide color={"#fff"} opacity={0.7} />
            )}
          </TouchableOpacity>

          {/* Show Images Button */}
          <GraphicToggleBtn
            func={() => {
              setIfDetail(null);
              setIfGraphic((prev) => !prev);
            }}
            ifGraphic={ifGraphic}
          />
        </View>
        {/* Grouped Words List */}
        <FlatList
          className="mt-6"
          data={groupedWords}
          keyExtractor={(group) => group.date}
          renderItem={({ item: group }) => (
            <View>
              <Text className="text-gray-400 font-semibold mb-2 mt-4">
                {group.date}
              </Text>
              <FlatList
                data={group.words}
                keyExtractor={(item) => item.id || item.word}
                renderItem={renderWordItem}
                scrollEnabled={false}
              />
            </View>
          )}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Pressable>
  );
};

export default InventoryScreen;
