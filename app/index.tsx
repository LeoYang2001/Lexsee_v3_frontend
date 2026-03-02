import React from "react";
import { ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

export default function IndexScreen() {
  // Show loading screen matching native splash style
  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-center"
    >
      <View className="w-full h-full flex justify-center items-center gap-8">
        <View
          style={{
            width: 30,
            height: 30,
          }}
        >
          <LottieView
            source={require("../assets/lottieAnims/loading.json")}
            autoPlay
            loop
            resizeMode="cover" // Ensures it fills the screen area
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          />
        </View>
      </View>
    </LinearGradient>
  );
}
