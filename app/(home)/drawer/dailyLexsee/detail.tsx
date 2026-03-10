import React from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { DrawerActions } from "@react-navigation/routers";
import { DAILY_LEXSEE_DISCOVER, DiscoverCategory } from "./dailyLexsee.mock";

export default function DailyLexseeDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();

  const selectedCategory = DAILY_LEXSEE_DISCOVER.find(
    (item) => item.id === category,
  ) as DiscoverCategory | undefined;

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const openSource = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Link Error", "Unable to open this link.");
      return;
    }
    await Linking.openURL(url);
  };

  if (!selectedCategory) {
    return (
      <View className="flex-1 bg-[#0F1115] pt-20 px-5 items-center justify-center">
        <Text className="text-white text-xl font-semibold mb-2">
          Category not found
        </Text>
        <TouchableOpacity
          className="px-4 py-2 rounded-lg bg-[#FA541C]"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F1115] pt-16 px-5">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          className="py-4 px-3"
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <View style={{ width: 18 }} className="w-8 flex gap-1">
            <View style={{ height: 2 }} className="bg-white w-full" />
            <View style={{ height: 2 }} className="bg-white w-full" />
          </View>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold">
          {selectedCategory.emoji} {selectedCategory.label}
        </Text>

        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <Text className="text-[#FA541C] font-semibold">Back</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-[#A9B0BC] text-base mb-5">
        {selectedCategory.subtitle}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {selectedCategory.items.map((item, idx) => (
          <View key={item.id} className="mb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openSource(item.sourceUrl)}
              className="bg-[#171A21] rounded-2xl border border-[#272C36] overflow-hidden"
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: "100%", height: 150 }}
                resizeMode="cover"
              />
              <View className="p-4">
                <Text className="text-white text-lg font-semibold mb-1">
                  {item.title}
                </Text>
                <Text className="text-[#FA541C] text-sm font-semibold">
                  {item.duration}
                </Text>
              </View>
            </TouchableOpacity>

            {idx < selectedCategory.items.length - 1 && (
              <View className="h-[1px] bg-[#2A2E38] mt-4" />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
