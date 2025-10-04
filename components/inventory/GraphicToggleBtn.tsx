import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Image, Type } from "lucide-react-native";

interface GraphicToggleBtnProps {
  func: () => void;
  ifGraphic: boolean;
}

const GraphicToggleBtn = ({ func, ifGraphic }: GraphicToggleBtnProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withTiming(ifGraphic ? 28 : 0, { duration: 200 }) },
      ],
    };
  });

  return (
    <TouchableOpacity
      onPress={func}
      style={{
        padding: 3,
        backgroundColor: "#262729",
      }}
      className="flex-row justify-between items-center rounded-full"
    >
      <Animated.View
        className=" absolute  flex justify-center items-center rounded-full"
        style={[
          animatedStyle,
          {
            width: 28,
            height: 28,
            backgroundColor: "#3E4042",
            left: 3,
            zIndex: 99,
          },
        ]}
      >
        {ifGraphic ? (
          <Image color={"#fff"} size={18} opacity={0.7} />
        ) : (
          <Type color={"#fff"} size={16} opacity={0.7} />
        )}
      </Animated.View>
      <View
        className=" flex justify-center items-center rounded-full"
        style={{
          width: 28,
          height: 28,
        }}
      >
        <Type color={"#38393b"} size={16} />
      </View>
      <View
        className=" flex justify-center items-center rounded-full"
        style={{
          width: 28,
          height: 28,
        }}
      >
        <Image color={"#38393b"} size={18} />
      </View>
    </TouchableOpacity>
  );
};

export default GraphicToggleBtn;
