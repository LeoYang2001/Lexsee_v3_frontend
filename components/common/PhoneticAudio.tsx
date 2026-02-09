import { View, Text, TouchableOpacity } from "react-native";
import React, { useRef, useEffect } from "react";
import { Volume2 } from "lucide-react-native";
import { Audio } from "expo-av";
import { Phonetics } from "../../types/common/Word";
import { useOnboarding } from "../../hooks/useOnboarding";

interface PhoneticAudioProps {
  phonetics: Phonetics | undefined;
  size?: number;
}

const PhoneticAudio = ({ phonetics, size = 14 }: PhoneticAudioProps) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  const { activeStep, setTargetLayout } = useOnboarding();
      const phoneticRef = useRef<View>(null);
    
   const handleLayout = () => {
  // Only measure if the "Director" says we are in the 'DEFINITION_STEP_2' stage
  if (activeStep === 'DEFINITION_STEP_2') {
    
    const tryMeasure = (retries = 5) => {
      (phoneticRef.current as any)?.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          // Check if we got valid layout data (non-zero width and height)
          const isValid = width > 0 && height > 0;

          if (isValid) {
            setTargetLayout({ x, y, width, height });
          } else if (retries > 0) {
            // If zeros, wait 100ms and try again
            setTimeout(() => tryMeasure(retries - 1), 100);
          } else {
            console.warn("Onboarding: Failed to measure DEFINITION_STEP_2 after 5 attempts.");
          }
        }
      );
    };

    tryMeasure();
  }
};
   
  useEffect(() => {
    // This component only cares about STEP_2
    if (activeStep === 'DEFINITION_STEP_2') {
      // Small delay to ensure any scrolling/layout from previous step is done
      const timer = setTimeout(() => {
        (phoneticRef.current as any)?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0) {
            setTargetLayout({ x, y, width, height });
          }
        });
      }, 150); // Delay slightly longer than the tooltip exit animation
      
      return () => clearTimeout(timer);
    }
  }, [activeStep])


  // Configure audio mode to play even in silent mode
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.warn("Error configuring audio mode:", error);
      }
    };
    
    configureAudio();
  }, []);

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
      ref={phoneticRef}
      className="flex flex-row items-center gap-2 mt-2 "
      onPress={playAudio}
      disabled={!isValidAudioUrl(phonetics?.audioUrl)}
      onLayout={handleLayout}
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
