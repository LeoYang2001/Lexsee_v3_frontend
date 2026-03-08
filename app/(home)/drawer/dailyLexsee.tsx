import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/routers";

export default function DailyLexseeScreen() {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View className="flex-1 bg-[#191D24] pt-20 px-6">
      <TouchableOpacity
        className="ml-auto mb-4 p-2"
        onPress={openDrawer}
        activeOpacity={0.7}
      >
        <View style={{ width: 18 }} className="w-8 flex gap-1">
          <View style={{ height: 2 }} className="bg-white w-full" />
          <View style={{ height: 2 }} className="bg-white w-full" />
        </View>
      </TouchableOpacity>

      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-3xl font-bold">Daily Lexsee</Text>
        <Text className="text-gray-400 text-base mt-2">Coming soon</Text>
      </View>
    </View>
  );
}
