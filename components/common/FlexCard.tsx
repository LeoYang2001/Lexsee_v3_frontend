import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { ArrowRight, Phone } from "lucide-react-native";
import { Word } from "../../types/common/Word";
import PhoneticAudio from "./PhoneticAudio";

interface FlexCardProps {
  word: Word;
  ifDetail: boolean;
  ifGraphic: boolean;
}

const FlexCard = ({ word, ifDetail, ifGraphic }: FlexCardProps) => {
  const style = {
    height: 130,
    borderRadius: 12,
  };
  return (
    <TouchableOpacity className="overflow-hidden  relative" style={style}>
      <Image
        source={{ uri: word.imgUrl }}
        style={{ width: "100%", borderRadius: 8 }}
        resizeMode="cover"
        className="absolute top-0 opacity-70 left-0 w-full h-full"
      />
      <View className="w-full h-full flex flex-col justify-start p-4">
        <View className="w-full flex flex-row items-center justify-between">
          <Text
            style={{
              fontSize: 24,
            }}
            className="text-white font-semibold"
          >
            {word.word}
          </Text>
          <TouchableOpacity className="p-2">
            <ArrowRight color={"white"} />
          </TouchableOpacity>
        </View>
        <PhoneticAudio phonetics={word.phonetics} />
      </View>
    </TouchableOpacity>
  );
};

export default FlexCard;
