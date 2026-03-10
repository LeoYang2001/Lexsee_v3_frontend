import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { useLocalSearchParams, useRouter } from "expo-router";

type PlayerMode = "horizontal" | "vertical";

interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  startTimeText: string;
}

const { width: windowWidth } = Dimensions.get("window");

export default function DailyLexseeYoutubePlayerScreen() {
  const router = useRouter();
  const { videoId, title, transcript } = useLocalSearchParams<{
    videoId?: string;
    title?: string;
    transcript?: string;
  }>();
  const [mode, setMode] = useState<PlayerMode>("horizontal");
  const [playing, setPlaying] = useState(false);

  const playerRef = useRef<YoutubeIframeRef>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const transcriptData: TranscriptSegment[] = useMemo(() => {
    if (!transcript) return [];
    try {
      return JSON.parse(transcript as string);
    } catch {
      return [];
    }
  }, [transcript]);

  // Polling logic
  useEffect(() => {
    let interval: any;

    if (playing) {
      interval = setInterval(async () => {
        const time = await playerRef.current?.getCurrentTime();
        if (time !== undefined) {
          // YouTube returns seconds, convert to Ms to match your data
          setCurrentTimeMs(time * 1000);
        }
      }, 500); // 500ms is usually enough for transcripts
    } else {
      clearInterval(interval!);
    }

    return () => clearInterval(interval);
  }, [playing]);

  const playerSize = useMemo(() => {
    const horizontalWidth = windowWidth - 24;
    const horizontalHeight = Math.round((horizontalWidth * 9) / 16) + 28;

    const verticalWidth = Math.round((windowWidth - 24) * 0.62);
    const verticalHeight = Math.round((verticalWidth * 16) / 9);

    return mode === "horizontal"
      ? { width: horizontalWidth, height: horizontalHeight }
      : { width: verticalWidth, height: verticalHeight };
  }, [mode]);

  return (
    <View className="flex-1 bg-[#0F1115] pt-16 px-3">
      <View className="flex-row items-center justify-between mb-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-3 py-2 rounded-lg bg-[#1F2530]"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold">Back</Text>
        </TouchableOpacity>

        <Text className="text-white text-base font-semibold">
          YouTube Player
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.youtube.com/")}
          className="px-3 py-2 rounded-lg bg-[#1F2530]"
          activeOpacity={0.85}
        >
          <Text className="text-[#FA541C] font-semibold">YouTube</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-white text-xl font-semibold mb-1" numberOfLines={2}>
        {title || "Clip"}
      </Text>

      {!videoId ? (
        <View className="bg-[#171A21] border border-[#272C36] rounded-2xl p-4">
          <Text className="text-white text-base font-semibold mb-1">
            Missing video id
          </Text>
          <Text className="text-[#A9B0BC] text-sm">
            This clip does not include a valid YouTube link.
          </Text>
        </View>
      ) : (
        <View className="items-center">
          <View
            className="overflow-hidden rounded-2xl border border-[#272C36] bg-black"
            style={{
              width: playerSize.width,
              height: playerSize.height,
            }}
          >
            <YoutubePlayer
              ref={playerRef}
              height={playerSize.height}
              width={playerSize.width}
              play={playing}
              videoId={videoId}
              onChangeState={(state: string) => {
                if (state === "playing") setPlaying(true);
                if (state === "paused" || state === "ended") setPlaying(false);
              }}
            />
          </View>
          <ScrollView ref={scrollRef} className="...">
            {transcriptData.map((segment, index) => {
              // Check if this segment is currently active
              const isActive =
                currentTimeMs >= segment.startMs &&
                currentTimeMs <= segment.endMs;

              return (
                <View
                  key={index}
                  className={`mb-3 p-2 rounded-lg ${isActive ? "bg-[#FA541C20] border-l-2 border-[#FA541C]" : ""}`}
                >
                  <Text className="text-[#FA541C] text-xs font-semibold">
                    {segment.startTimeText}
                  </Text>
                  <Text
                    className={`text-sm leading-6 ${isActive ? "text-white font-bold" : "text-[#E5E7EB]"}`}
                  >
                    {segment.text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
