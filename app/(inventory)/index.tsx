// app/(inventory)/index.tsx
import React, { useState, useMemo, useEffect, use } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  
  TouchableWithoutFeedback,
  Dimensions,
  
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
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";

const { width: windowWidth } = Dimensions.get("window");

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


  const [reviewedWords, setReviewedWords] = useState<Word[]>([]);
  const [masteredWords, setMasteredWords] = useState<Word[]>([]);

  // Width of each tab for the slider calculation
    const sliderPosition = useSharedValue(0);

  const reviewedTabStyle = useAnimatedStyle(() => {
  return {
    opacity: interpolate(
      sliderPosition.value,
      [0, 60],    // When slider is at 0 (Review) vs 60 (Master)
      [0.8, 0.5], // Opacity goes from 0.8 down to 0.5
      Extrapolate.CLAMP
    ),
  };
});

const masterTabStyle = useAnimatedStyle(() => {
  return {
    opacity: interpolate(
      sliderPosition.value,
      [0, 60],
      [0.5, 0.8], // Master does the opposite (fades in)
      Extrapolate.CLAMP
    ),
  };
});

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderPosition.value }, { translateY: -1.5 }],
  }));
  

  const TABWIDTH = 63;
  
  // Animated value for slider position

  // Filter words based on filterMode
  useEffect(() => {
      // Show words that are not mastered (status != "LEARNED")
      const reviewWords = wordsFromDB.filter(
        (word) => word.status !== "LEARNED"
      );
      setReviewedWords(reviewWords);
      // Show mastered words (status == "LEARNED")
      const masteredWords = wordsFromDB.filter(
        (word) => word.status === "LEARNED"
      );
      setMasteredWords(masteredWords);
  }, [ wordsFromDB]);

  
 
  // Filter words based on search query
  const filteredWords_reviewed = useMemo(() => {
    if (!searchQuery.trim()) {
      return reviewedWords;
    }

    const query = searchQuery.toLowerCase().trim();
    return reviewedWords.filter((word) => {
      if (word.word.toLowerCase().includes(query)) return true;
    });
  }, [reviewedWords, searchQuery]);

    const filteredWords_mastered = useMemo(() => {
    if (!searchQuery.trim()) {
      return masteredWords;
    }

    const query = searchQuery.toLowerCase().trim();
    return masteredWords.filter((word) => {
      if (word.word.toLowerCase().includes(query)) return true;
    });
  }, [masteredWords, searchQuery]);

  const groupedWords_reviewed = useMemo(() => {
    const groups: { [date: string]: Word[] } = {};
    filteredWords_reviewed.forEach((word) => {
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
  }, [filteredWords_reviewed, sortAsc]);
    const groupedWords_mastered = useMemo(() => {
    const groups: { [date: string]: Word[] } = {};
    filteredWords_mastered.forEach((word) => {
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
  }, [filteredWords_mastered, sortAsc]);

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
    <View
      style={{ flex: 1 }}
     
    >
      <View
        style={{
          backgroundColor: "#131416",
        }}
        className=" w-full h-full flex flex-col "
      >
        <StatusBar style="light" />
        {/* Header */}
        <View className="mt-16 w-full  justify-between  px-3  flex-row items-center">
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
                  className=" absolute flex justify-center items-center w-full h-[7px] overflow-hidden  -bottom-[7px]"
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
                      animatedContainerStyle,
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
                  <View

                    className="flex justify-center items-center overflow-x-hidden"
                    style={{ width: TABWIDTH, height:32}}
                  >
                    <Animated.Text
                    numberOfLines={1}
                    style={[{
                      fontSize:14
                    }, reviewedTabStyle]}
                      className={` text-white   font-semibold `}
                    >
                      Review
                    </Animated.Text>
                  </View>

                  {/* Master Tab */}
                  <View
                    className="flex justify-center items-center"
                    style={{ width: TABWIDTH, height:32 }}
                  >
                     <Animated.Text
                    numberOfLines={1}
                    style={[{
                      fontSize:14,
                    }, masterTabStyle]}
                      className={` text-white font-semibold `}
                    >
                      Master
                    </Animated.Text>
                  </View>

                 
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
        <View className="flex-row items-center  px-3 justify-end gap-3 my-2">
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ScrollView
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => {
              setIfDetail(null);
              if (!searchQuery) setIfInputComp(false);
              
            }}
            onScroll={(e) => {
            // This keeps your top slider in sync with the swipe!
            const offset = e.nativeEvent.contentOffset.x;
            sliderPosition.value = (offset / windowWidth) * 60; // 60 is the width of each tab
          }}
          
            scrollEventThrottle={16}
            // This ensures it doesn't drift if you swipe diagonally
            directionalLockEnabled={true} 
          >
            <View className='flex-1 justify-center items-center px-3' style={{ width: windowWidth }}>
                <FlatList
              className="mt-6  w-full relative  "
              data={groupedWords_reviewed}
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

            <View className='flex-1 justify-center items-center' style={{ width: windowWidth }}>
             <FlatList
              className="mt-6  w-full relative  "
              data={groupedWords_mastered}
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
          </ScrollView>
          </GestureHandlerRootView>
      </View>
    </View>
  );
};

export default InventoryScreen;
