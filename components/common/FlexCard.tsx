import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import { ArrowRight, Phone } from "lucide-react-native";
import { Word } from "../../types/common/Word";
import PhoneticAudio from "./PhoneticAudio";
import { BlurView } from "expo-blur";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";

interface FlexCardProps {
  word: Word;
  ifDetail: boolean;
  ifGraphic: boolean;
}

const FlexCard = ({ word, ifDetail, ifGraphic }: FlexCardProps) => {
  const style = {
    height: 132, // height: 132 for normal viewMode, 207 for detail viewMode
    borderRadius: 12,
  };
  const duration = 200; // Animation duration in milliseconds

  const sharedHeight = useSharedValue(ifDetail ? 207 : 132);
  const router = useRouter();

  useEffect(() => {
    sharedHeight.value = withTiming(ifDetail ? 207 : 132, { duration });
  }, [ifDetail]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: sharedHeight.value,
    };
  });

  // Function to navigate to definition page with word as param
  const goToDefinition = () => {
    router.navigate({
      pathname: "/(definition)",
      params: { word: word.word },
    });
  };

  if (ifGraphic) {
    return (
      <Animated.View
        className="overflow-hidden  relative"
        style={[style, animatedStyle]}
      >
        <Image
          source={{ uri: word.imgUrl }}
          style={{ width: "100%", borderRadius: 8 }}
          resizeMode="cover"
          className="absolute top-0 opacity-70 left-0 w-full h-full"
        />
        <View className="w-full h-full flex flex-col justify-start p-4 ">
          <View className="w-full flex flex-row items-center justify-between">
            <Text style={{ fontSize: 24 }} className="text-white font-semibold">
              {word.word}
            </Text>
            <TouchableOpacity className="p-2" onPress={goToDefinition}>
              <ArrowRight color={"white"} />
            </TouchableOpacity>
          </View>
          <PhoneticAudio
            phonetics={word.phonetics ?? { text: "", audioUrl: "" }}
          />
          {/* Detail View  */}
          {ifDetail && (
            <View className="flex-1 mt-2 flex flex-col gap-2">
              <View className="flex flex-row items-center justify-start gap-2 my-1">
                <View className=" bg-black p-1 rounded-sm ">
                  <Text className=" text-white">
                    {word.meanings[0].partOfSpeech}
                  </Text>
                </View>
              </View>
              {/* Definition View, glassy blurry background  */}
              <BlurView
                intensity={30}
                tint="dark"
                style={{
                  borderRadius: 12,
                  flex: 1,
                  overflow: "hidden",
                  justifyContent: "flex-start",
                }}
                className=" p-3"
              >
                <Text
                  className="text-white opacity-90"
                  numberOfLines={3}
                  ellipsizeMode="tail"
                  style={{ width: "100%" }}
                >
                  {word.meanings[0].definition}
                </Text>
              </BlurView>
            </View>
          )}
        </View>
      </Animated.View>
    );
  } else {
    return (
      <View
        className="overflow-hidden  relative"
        style={[
          style,
          {
            backgroundColor: "#262729",
            height: 79,
            borderRadius: 8,
            padding: 0,
          },
        ]}
      >
        <View className="w-full h-full flex flex-row justify-between items-center  p-4  ">
          <View className=" flex flex-col  items-center">
            <Text style={{ fontSize: 20 }} className="text-white font-semibold">
              {word.word}
            </Text>
            <PhoneticAudio
              phonetics={word.phonetics ?? { text: "", audioUrl: "" }}
            />
          </View>

          <TouchableOpacity className="p-2" onPress={goToDefinition}>
            <ArrowRight color={"white"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

export default FlexCard;
