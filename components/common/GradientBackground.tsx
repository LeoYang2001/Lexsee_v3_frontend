import React from "react";
import { View, ImageBackground, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "./Logo";

const { width, height } = Dimensions.get("window");

interface GradientBackgroundProps {
  imagePath: any; // Image source (require() or uri)
  children?: React.ReactNode;
  gradientLocations?: [number, number, number, number]; // Custom gradient locations - exactly 4 values
  overlayColor?: string; // Custom overlay color
  overlayOpacity?: number; // Custom overlay opacity for top section
}

function GradientBackground({
  imagePath,
  children,
  gradientLocations = [0, 0.2, 0.6, 1], // Default: 0-20%, 20-50%, 50-100%
  overlayColor = "#080A10", // Default overlay color
  overlayOpacity = 0.5, // Default top opacity
}: GradientBackgroundProps) {
  return (
    <View style={{ flex: 1, width, height }}>
      {/* Background Image */}
      <ImageBackground
        source={imagePath}
        style={{
          position: "absolute",
          width,
          height,
        }}
        imageStyle={{
          width: "100%",
          height: "60%",
        }}
        resizeMode="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={[
          `rgba(8, 10, 16, ${overlayOpacity})`, // Top section with custom opacity
          `rgba(8, 10, 16, ${overlayOpacity})`, // Mid point
          `rgba(8, 10, 16, 1)`, // Transition to full opacity
          `rgba(8, 10, 16, 1)`, // Bottom section - full opacity
        ]}
        locations={gradientLocations} // Use dynamic locations
        style={{
          position: "absolute",
          width,
          height,
        }}
      />

      {/* Pure color background for bottom section */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width,
          height: height * (1 - gradientLocations[2]), // Dynamic bottom height based on gradient
          backgroundColor: overlayColor,
        }}
      />

      {/* Content */}
      {children}
      <View className=" absolute bottom-2 w-full   flex flex-row justify-center items-center mt-auto">
        <Logo size={60} />
      </View>
    </View>
  );
}

export default GradientBackground;
