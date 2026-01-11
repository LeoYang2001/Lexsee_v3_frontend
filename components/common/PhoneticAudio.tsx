import { View, Text, TouchableOpacity } from "react-native";
import React, { useRef, useEffect } from "react";
import { Volume2 } from "lucide-react-native";
import { Audio } from "expo-av";
import { Phonetics } from "../../types/common/Word";

interface PhoneticAudioProps {
  phonetics: Phonetics | undefined;
  size?: number;
}

const PhoneticAudio = ({ phonetics, size = 14 }: PhoneticAudioProps) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound on unmount or when audio URL changes
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((err) => {
          console.warn("Error unloading sound:", err);
        });
      }
    };
  }, [phonetics?.audioUrl]);

  // Validate audio URL
  const isValidAudioUrl = (url: string | undefined): boolean => {
    if (!url || typeof url !== "string") return false;
    
    // Check for HTTPS (iOS ATS requirement)
    if (!url.startsWith("https://")) {
      console.warn("Audio URL must use HTTPS:", url);
      return false;
    }
    
    // Check for unsupported formats (.ogg not supported on iOS)
    if (url.toLowerCase().endsWith(".ogg")) {
      console.warn("OGG format not supported on iOS:", url);
      return false;
    }
    
    return true;
  };

  const playAudio = async () => {
    try {
      const audioUrl = phonetics?.audioUrl;

      // Validate URL before attempting playback
      if (!isValidAudioUrl(audioUrl)) {
        console.warn("Invalid or unsupported audio URL:", audioUrl);
        return;
      }

      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Create and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl! },
        { shouldPlay: true },
        (status) => {
          // Optional: Handle playback status updates
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch((err) => {
              console.warn("Error unloading finished sound:", err);
            });
          }
        }
      );

      soundRef.current = sound;
      console.log("Playing phonetics audio:", phonetics);
    } catch (error) {
      console.error("Error playing audio:", error);
      // Clean up on error
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    }
  };

  return (
    <TouchableOpacity
      className="flex flex-row items-center gap-2 mt-2"
      onPress={playAudio}
      disabled={!isValidAudioUrl(phonetics?.audioUrl)}
    >
      <Text style={{ color: "#fff", opacity: 0.7, fontSize: size }}>
        {phonetics?.text}
      </Text>
      <View className=" flex justify-center items-center">
        <Volume2 size={size + 2} color={"#fff"} opacity={0.7} />
      </View>
    </TouchableOpacity>
  );
};

export default PhoneticAudio;
