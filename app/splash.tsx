import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, Text } from "react-native";
import Logo from "../components/common/Logo";

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 w-full  flex items-center justify-center "
    >
      <View className="text-5xl flex justify-center items-center border h-full w-full   font-bold text-white tracking-wider">
        <Logo size={88} />
      </View>
    </LinearGradient>
  );
}
