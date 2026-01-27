import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
} from 'react-native-reanimated';
import { LinearGradient } from "expo-linear-gradient";

const Provision = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10); // Start 10 pixels lower

  useEffect(() => {
    // Smoothly fade in and slide up
    opacity.value = withTiming(1, { duration: 1000 });
    translateY.value = withTiming(0, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <LinearGradient
      colors={["#1F2734", "#131416"]}
      className="flex-1 items-center justify-cen  ter"
    >
      <View className=" w-full h-full justify-center items-center px-10">
        <Animated.View style={animatedStyle}>
          <Animated.Text 
            className="text-[#FF511B] text-3xl font-bold text-center"
          >
            Creating your profile...
          </Animated.Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

export default Provision;