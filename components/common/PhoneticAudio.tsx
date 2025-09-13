import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react-native";
import { useVideoPlayer, VideoPlayer } from "expo-video";
import { useEvent } from "expo";
import { Phonetics } from "../../types/common/Word";

interface PhoneticAudioProps {
  phonetics: Phonetics;
  size?: number;
}

const PhoneticAudio = ({ phonetics, size = 14 }: PhoneticAudioProps) => {
  const videoSource = phonetics.audioUrl;

  const [audioPlayer, setAudioPlayer] = useState<VideoPlayer | null>(null);

  const player = useVideoPlayer(videoSource || null, (playerInstance) => {
    // Optional: You can attach event listeners here if needed,
    // for example, to log when playback finishes or errors occur.
  });

  useEffect(() => {
    setAudioPlayer(player);
  }, []);

  return (
    <TouchableOpacity
      className="flex flex-row items-center gap-2 mt-2"
      onPress={() => {
        if (audioPlayer) {
          audioPlayer.currentTime = 0; // Reset to the beginning
          audioPlayer.play();
          console.log("play phonetics audio:", phonetics);
        } else {
          console.warn("Audio player is not initialized.");
        }
      }}
    >
      <Text style={{ color: "#fff", opacity: 0.7, fontSize: size }}>
        {phonetics.text}
      </Text>
      <View className=" flex justify-center items-center">
        <Volume2 size={size + 2} color={"#fff"} opacity={0.7} />
      </View>
    </TouchableOpacity>
  );
};

export default PhoneticAudio;
