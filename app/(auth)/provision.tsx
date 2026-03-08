import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { router } from "expo-router";

// Create an animated Lottie component if you want to use it as a Shared Element
const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

const Provision = () => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show text after a small delay so the background can load
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = async () => {
    setShowText(false); // Fade out first
    // Navigate to next page (adjust 'NextPage' to your actual route name)
    setTimeout(() => {
      router.push("/(auth)/onboarding");
    }, 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <BackgroundAnim showText={showText} />

      <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
        <View style={styles.container}></View>
      </Pressable>
    </View>
  );
};

const BackgroundAnim = ({ showText }: { showText: boolean }) => {
  const textOpacity = useSharedValue(showText ? 1 : 0);
  const textTranslateY = useSharedValue(showText ? 0 : 6);

  useEffect(() => {
    textOpacity.value = withTiming(showText ? 1 : 0, { duration: 350 });
    textTranslateY.value = withTiming(showText ? 0 : -6, { duration: 350 });
  }, [showText, textOpacity, textTranslateY]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: -1,
      }}
    >
      <Animated.View
        entering={FadeIn.delay(600)}
        pointerEvents="none"
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          },
          textAnimatedStyle,
        ]}
      >
        <Text
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Let's learn more about you
        </Text>
      </Animated.View>
      <AnimatedLottie
        sharedTransitionTag="backgroundMesh"
        source={require("../../assets/lottieAnims/mesh-gradient.json")}
        autoPlay
        loop
        resizeMode="cover"
        style={{ width: 200, height: 200 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Provision;
