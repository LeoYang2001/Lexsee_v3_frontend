import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../components/common/Logo";


export default function IndexScreen() {
  
  
  // Show loading screen matching native splash style
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-center"
    >
      <View className="w-full h-full flex justify-center items-center gap-8">
        <Logo size={80} />
       
      </View>
    </LinearGradient>
  );
}
