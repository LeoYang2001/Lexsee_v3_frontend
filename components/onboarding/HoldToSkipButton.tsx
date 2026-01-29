import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';

interface HoldButtonProps {
  onComplete: () => void;
  duration?: number; // Dynamic duration in ms
}

export const HoldToSkipButton = ({ onComplete, duration = 1700 }: HoldButtonProps) => {
  const progress = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handlePressIn = () => {
    // Start filling the bar
    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished) {
        // Trigger the skip function on the main thread
        runOnJS(onComplete)();
      }
    });
  };

  const handlePressOut = () => {
    // If they let go before 'finished', reset to 0
    if (progress.value < 1) {
      progress.value = withTiming(0, { duration: 300 });
    }
  };

  return (
    <View
    pointerEvents="auto"
    style={{
      width:100,
      height:40,
      borderRadius:10,
    }}
    className="absolute right-[10%] bottom-[5%] border border-[#FF8C00] items-center  overflow-hidden">
      {/* Background Track */}
        <View className='h-full top-0 left-0   w-full ' style={styles.track}>
          {/* Filling Progress Bar */}
          <Animated.View style={[styles.fill, animatedProgressStyle]} />
        </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        className=' absolute  w-full h-full flex justify-center items-center'
      >
        <Text className=' opacity-80 text-sm' style={{  color: 'white'}}>Hold to Skip</Text>
        
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
  },
  track: {
    borderRadius: 10,
    backgroundColor:"rgba(0,0,0,0.76) ",
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#F97316', // Matches your orange theme
  },
});