import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react-native";
import { useVideoPlayer, VideoPlayer } from "expo-video";
import { useEvent } from "expo";

interface PhoneticAudioProps {
  phonetics: {
    text: string;
    audioUrl?: string;
  };
}

const PhoneticAudio = ({ phonetics }: PhoneticAudioProps) => {
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
        } else {
          console.warn("Audio player is not initialized.");
        }
      }}
    >
      <Text style={{ color: "#fff", opacity: 0.7, fontSize: 14 }}>
        {phonetics.text}
      </Text>
      <Volume2 size={16} color={"#fff"} opacity={0.7} />
    </TouchableOpacity>
  );
};

export default PhoneticAudio;
