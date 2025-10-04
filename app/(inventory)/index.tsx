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

// Helper to format date as YYYY-MM-DD
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0];
};

const InventoryScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const words = useSelector((state: RootState) => state.wordsList.words);

  const router = useRouter();
  const [sortAsc, setSortAsc] = useState(false);
  const [ifGraphic, setIfGraphic] = useState(false);
  const [ifDetail, setIfDetail] = useState<string | null>(null);
  const [ifInputComp, setIfInputComp] = useState<boolean>(false);

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

  const renderWordItem = ({ item }: { item: Word }) => (
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
          >
            <ChevronLeft color={"#fff"} />
          </TouchableOpacity>
          <View
            style={{
              height: 49,
            }}
            className=" flex-1  ml-6 flex items-end  h-3"
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
