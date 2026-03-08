import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

interface BrainLoadSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  MIN_VALUE?: number;
  MAX_VALUE?: number;
}

const BrainLoadSlider: React.FC<BrainLoadSliderProps> = ({
  value,
  onValueChange,
  MIN_VALUE = 1,
  MAX_VALUE = 25,
}) => {
  const [trackWidth, setTrackWidth] = useState(200);
  const animatedWidth = useSharedValue(0);
  const lastReportedValue = useSharedValue(value);
  const HANDLE_WIDTH = 25;

  // Convert value (1-25) to pixel width (with handle offset for visibility)
  const valueToWidth = (val: number) => {
    "worklet";
    if (trackWidth === 0) return HANDLE_WIDTH;
    const ratio = (val - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    return ratio * (trackWidth - HANDLE_WIDTH) + HANDLE_WIDTH;
  };

  // Convert pixel width back to value (1-25)
  const widthToValue = (width: number) => {
    "worklet";
    if (trackWidth === 0) return MIN_VALUE;
    const ratio = (width - HANDLE_WIDTH) / (trackWidth - HANDLE_WIDTH);
    const val = ratio * (MAX_VALUE - MIN_VALUE) + MIN_VALUE;
    return Math.round(Math.max(MIN_VALUE, Math.min(MAX_VALUE, val)));
  };

  // Update slider position when value or trackWidth changes
  useEffect(() => {
    if (trackWidth > 0) {
      animatedWidth.value = withSpring(valueToWidth(value));
      lastReportedValue.value = value;
    }
  }, [value, trackWidth, MIN_VALUE, MAX_VALUE]);

  // Handle track layout measurement
  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
  };

  // Handle pan gesture on the drag handle
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startWidth: number }
  >({
    onStart: (_, ctx) => {
      ctx.startWidth = animatedWidth.value;
    },
    onActive: (event, ctx) => {
      let newWidth = ctx.startWidth + event.translationX;
      // Keep handle visible: minimum handle width for value 1, max is full track
      newWidth = Math.max(HANDLE_WIDTH, Math.min(newWidth, trackWidth));
      animatedWidth.value = newWidth;

      // Update value in real-time
      const newValue = widthToValue(newWidth);
      if (newValue !== lastReportedValue.value) {
        lastReportedValue.value = newValue;
        runOnJS(onValueChange)(newValue);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onEnd: (event) => {
      const newValue = widthToValue(animatedWidth.value);
      animatedWidth.value = withSpring(valueToWidth(newValue));
    },
  });

  const trackStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  return (
    <View
      style={{
        width: "100%",
        height: 40,
        backgroundColor: "#333",
        borderRadius: 10,
      }}
      onLayout={handleTrackLayout}
      className=" overflow-hidden"
    >
      <Animated.View
        style={[
          trackStyle,
          {
            height: 40,
            backgroundColor: "#555652",
            borderRadius: 12.5,
          },
        ]}
        className="relative overflow-hidden"
      >
        {/* drag handle */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            style={{
              width: 25,
              marginLeft: -25,
            }}
            className="h-full  flex overflow-hidden justify-center items-center absolute right-0 z-30 bg-[#555652] rounded"
          >
            <TouchableOpacity className="  absolute w-full h-full flex justify-center items-center">
              <View
                style={{
                  width: 1,
                  height: 20,
                  backgroundColor: "white",
                }}
              />
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};

export default BrainLoadSlider;
