import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Search,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  fetchYouTubeTranscript,
  deleteYoutubeVideo,
} from "../../../../apis/fetchYoutubeVideo";
import { useAppSelector } from "../../../../store/hooks";

type PlayerMode = "horizontal" | "vertical";

interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  startTimeText: string;
}

const darkTheme = {
  background: "#18181B",
  text: "#F3F4F6",
  border: "#27272A",
  primary: "#FA541C",
  secondary: "#F59E42",
  accent: "#F3F4F6",
  card: "#232326",
  statusBar: "light-content",
};

const { width, height } = Dimensions.get("window");
const BORDER_RADIUS = Math.min(width, height) * 0.06;

export default function DailyLexseeYoutubePlayerScreen() {
  const router = useRouter();
  const profile = useAppSelector((state) => state.profile.data);
  const {
    videoId,
    title,
    transcript,
    transcriptFetchParam,
    mode: videoMode,
  } = useLocalSearchParams<{
    videoId?: string;
    title?: string;
    transcript?: string;
    transcriptFetchParam: string;
    mode?: string;
    embedUrl?: string;
  }>();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [mode] = useState<PlayerMode>("horizontal");
  const [playing, setPlaying] = useState(false);
  const [searchList, setSearchList] = useState<string[]>([]);
  const [searchedWords, setSearchedWords] = useState<string[]>([]);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  // Allow screen rotation on mount, lock on unmount
  useFocusEffect(
    React.useCallback(() => {
      // On Mount / Focus
      ScreenOrientation.unlockAsync();

      return () => {
        // On Unmount / Blur
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      };
    }, []),
  );

  const playerRef = useRef<YoutubeIframeRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const portraitScrollRef = useRef<ScrollView>(null);
  const searchListRef = useRef<FlatList<string>>(null);
  const searchListScrollRef = useRef<ScrollView>(null);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [curSegment, setCurSegment] = useState<TranscriptSegment | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptSegment[]>([]);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);

  // Fetch and parse transcript data
  useEffect(() => {
    const loadTranscript = async () => {
      try {
        // Try to parse transcript if available
        if (transcript) {
          try {
            let transcriptParsed: any;

            // Check if transcript is already parsed (object/array) or needs parsing (string)
            if (typeof transcript === "string") {
              console.log("Transcript is a string, parsing...");
              transcriptParsed = JSON.parse(transcript);
            } else if (Array.isArray(transcript)) {
              console.log("Transcript is already an array");
              transcriptParsed = transcript;
            } else if (typeof transcript === "object") {
              console.log("Transcript is already an object");
              transcriptParsed = transcript;
            }

            if (
              Array.isArray(transcriptParsed) &&
              transcriptParsed.length > 0
            ) {
              setTranscriptData(transcriptParsed);
              return;
            }
          } catch (e) {
            console.warn("Failed to parse transcript:", e);
          }
        }

        // If no transcript or parsing failed, fetch from S3
        if (transcriptFetchParam) {
          setIsFetchingTranscript(true);
          try {
            const fetchedTranscript = await fetchYouTubeTranscript(
              transcriptFetchParam as string,
            );

            setTranscriptData(fetchedTranscript);
          } catch (error) {
            console.error("Failed to fetch transcript from S3:", error);
            setTranscriptData([]);
          } finally {
            setIsFetchingTranscript(false);
          }
        } else {
          setTranscriptData([]);
        }
      } catch (error) {
        console.error("Error loading transcript:", error);
        setTranscriptData([]);
      }
    };

    loadTranscript();
  }, [transcript, transcriptFetchParam]);

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

  useEffect(() => {
    const activeSegment =
      transcriptData.find(
        (segment) =>
          currentTimeMs >= segment.startMs && currentTimeMs <= segment.endMs,
      ) || null;

    setCurSegment(activeSegment);
  }, [currentTimeMs, transcriptData]);

  useEffect(() => {
    if (searchList.length === 0 || isLandscape) return;

    requestAnimationFrame(() => {
      portraitScrollRef.current?.scrollToEnd({ animated: true });
      searchListRef.current?.scrollToEnd({ animated: true });
    });
  }, [searchList.length, isLandscape]);

  useEffect(() => {
    if (searchList.length === 0) return;

    requestAnimationFrame(() => {
      searchListScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [searchList.length, isLandscape]);

  const playerSize = useMemo(() => {
    if (isLandscape) {
      const maxWidth = Math.round((width - 36) * 0.58);
      const maxHeight = height - 42;

      const heightFromWidth = Math.round((maxWidth * 9) / 16);
      const useWidthAsBase = heightFromWidth <= maxHeight;

      const finalWidth = useWidthAsBase
        ? maxWidth
        : Math.round((maxHeight * 16) / 9);
      const finalHeight = useWidthAsBase ? heightFromWidth : maxHeight;

      return {
        width: finalWidth,
        height: finalHeight,
      };
    }

    const horizontalWidth = width - 24;
    const horizontalHeight = Math.round((horizontalWidth * 9) / 16);

    const verticalWidth = Math.round((width - 24) * 0.62);
    const verticalHeight = Math.round((verticalWidth * 16) / 9);

    return mode === "horizontal"
      ? { width: horizontalWidth, height: horizontalHeight }
      : { width: verticalWidth, height: verticalHeight };
  }, [mode, width, height, isLandscape]);

  const addWordToSearchList = (rawWord: string) => {
    const normalized = rawWord
      .replace(/[^a-zA-Z'-]/g, "")
      .trim()
      .toLowerCase();
    if (!normalized) return;

    setSearchList((prev) => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });
  };

  const renderTranscriptWords = (enableTapToAdd = false) => {
    if (transcriptData.length === 0) {
      if (isFetchingTranscript) {
        return (
          <Text
            style={{ color: darkTheme.accent, opacity: 0.72 }}
            className="text-base mt-1"
          >
            Fetching captions...
          </Text>
        );
      }
      return (
        <Text
          style={{ color: darkTheme.accent, opacity: 0.72 }}
          className="text-base mt-1"
        >
          Captions are unavailable for this video.
        </Text>
      );
    }

    if (!curSegment?.text) {
      return (
        <Text
          style={{ color: darkTheme.accent, opacity: 0.72 }}
          className="text-base mt-1"
        ></Text>
      );
    }

    return curSegment.text
      .replace(/\n/g, " ")
      .split(" ")
      .map((word, index) => (
        <TouchableOpacity
          key={`${word}-${index}`}
          activeOpacity={0.55}
          onPress={() => {
            if (!enableTapToAdd) return;
            addWordToSearchList(word);
          }}
          className="px-[1px]"
        >
          <Text
            style={{ color: darkTheme.text }}
            className="text-[16px] font-semibold leading-8"
          >
            {word}{" "}
          </Text>
        </TouchableOpacity>
      ));
  };

  const renderMissingVideo = () => (
    <View
      style={{ backgroundColor: darkTheme.card, borderColor: darkTheme.border }}
      className="border rounded-2xl p-4"
    >
      <Text
        style={{ color: darkTheme.text }}
        className="text-base font-semibold mb-1"
      >
        Missing video id
      </Text>
      <Text
        style={{ color: darkTheme.accent, opacity: 0.72 }}
        className="text-sm"
      >
        This clip does not include a valid YouTube link.
      </Text>
    </View>
  );

  const seekBySeconds = async (deltaSeconds: number) => {
    const currentSeconds = await playerRef.current?.getCurrentTime();
    if (currentSeconds === undefined) return;

    const nextSeconds = Math.max(0, currentSeconds + deltaSeconds);
    playerRef.current?.seekTo(nextSeconds, true);
    setCurrentTimeMs(nextSeconds * 1000);
  };

  const removeSearchWord = (wordToRemove: string) => {
    setSearchList((prev) => prev.filter((word) => word !== wordToRemove));
  };

  const goToDefinition = (word: string) => {
    setSearchedWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    router.push(`/(definition)?word=${encodeURIComponent(word)}`);
  };

  const handleDeleteVideo = async () => {
    const userId = profile?.userId;
    if (!userId || !videoId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    Alert.alert("Delete Video", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setIsDeletingVideo(true);
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

            console.log("[YouTube Delete] Deleting video:", title);

            const result = await deleteYoutubeVideo(userId, youtubeUrl);

            if (result.success) {
              Alert.alert("Success", result.message);
              router.back();
            } else {
              Alert.alert("Error", result.message);
            }
          } catch (error) {
            console.error("[YouTube Delete] Error:", error);
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : "Failed to delete video.",
            );
          } finally {
            setIsDeletingVideo(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View
      style={[{ backgroundColor: darkTheme.background }]}
      className="flex-1"
    >
      {/* Header - Portrait Only */}
      {!isLandscape && (
        <View className="w-full px-3 flex-row items-center justify-between pt-16 pb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft color={darkTheme.text} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={{ color: darkTheme.text }}
            className="text-base font-semibold flex-1 ml-3"
          >
            {title || "Daily Lexsee"}
          </Text>
          {videoMode === "user-uploaded" && (
            <TouchableOpacity onPress={handleDeleteVideo} className="p-2">
              <Trash2 size={20} color={darkTheme.text} opacity={0.7} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!videoId ? (
        <View className="px-3">{renderMissingVideo()}</View>
      ) : (
        <View
          style={{
            flexDirection: isLandscape ? "row" : "column",
          }}
          className="flex-1 gap-4 "
        >
          {/* Left/Top Panel - Player */}
          <View
            style={[
              {
                width: isLandscape ? playerSize.width + 16 : "100%",
              },
              !isLandscape && { paddingHorizontal: 6 },
            ]}
            className="flex flex-col  justify-start "
          >
            <View
              style={[
                isLandscape && {
                  borderColor: darkTheme.border,
                  backgroundColor: darkTheme.card,
                  borderTopLeftRadius: BORDER_RADIUS * 2,
                },
              ]}
              className={
                isLandscape
                  ? "rounded-[26px] border p-2"
                  : "  flex   justify-center items-center"
              }
            >
              <View
                className={
                  isLandscape
                    ? "overflow-hidden rounded-[22px] border"
                    : "overflow-hidden rounded-2xl border items-center"
                }
                style={[
                  {
                    borderColor: darkTheme.border,
                    backgroundColor: darkTheme.background,
                    width: playerSize.width,
                    height: playerSize.height,
                  },
                  isLandscape && { borderTopLeftRadius: BORDER_RADIUS * 2 },
                ]}
              >
                <YoutubePlayer
                  ref={playerRef}
                  height={playerSize.height}
                  width={playerSize.width}
                  play={playing}
                  videoId={videoId}
                  onChangeState={(state: string) => {
                    if (state === "playing") setPlaying(true);
                    if (state === "paused" || state === "ended")
                      setPlaying(false);
                  }}
                />
              </View>
            </View>

            {/* Controls - Show only in landscape */}
            {isLandscape && (
              <View
                style={{
                  borderColor: darkTheme.border,
                  backgroundColor: darkTheme.card,
                  borderBottomLeftRadius: BORDER_RADIUS * 2,
                }}
                className="flex-row items-center rounded-[26px]  flex-1 justify-between px-3  mt-2"
              >
                <TouchableOpacity
                  style={{
                    borderColor: darkTheme.border,
                    backgroundColor: darkTheme.background,
                  }}
                  className="rounded-xl border px-6 py-3 flex-row items-center flex-1 justify-center mr-2"
                  onPress={() => seekBySeconds(-10)}
                  activeOpacity={0.75}
                >
                  <SkipBack size={24} color={darkTheme.text} />
                  <Text
                    style={{ color: darkTheme.text }}
                    className="font-semibold ml-3 text-base"
                  >
                    10s
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    borderColor: darkTheme.border,
                    backgroundColor: darkTheme.background,
                  }}
                  className="rounded-xl border px-6 py-3 flex-row items-center flex-1 justify-center ml-2"
                  onPress={() => seekBySeconds(10)}
                  activeOpacity={0.75}
                >
                  <SkipForward size={24} color={darkTheme.text} />
                  <Text
                    style={{ color: darkTheme.text }}
                    className="font-semibold ml-3 text-base"
                  >
                    10s
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Portrait Controls and Open YouTube */}
            {!isLandscape && (
              <>
                <View
                  style={{
                    borderColor: darkTheme.border,
                    backgroundColor: darkTheme.card,
                  }}
                  className="mt-3 rounded-2xl border px-3 py-2"
                >
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      style={{
                        borderColor: darkTheme.border,
                        backgroundColor: darkTheme.background,
                      }}
                      className="rounded-xl border px-4 py-2 flex-row items-center"
                      onPress={() => seekBySeconds(-10)}
                      activeOpacity={0.75}
                    >
                      <SkipBack size={16} color={darkTheme.text} />
                      <Text
                        style={{ color: darkTheme.text }}
                        className="font-semibold ml-2"
                      >
                        10s
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        borderColor: darkTheme.border,
                        backgroundColor: darkTheme.background,
                      }}
                      className="rounded-xl border px-4 py-2 flex-row items-center"
                      onPress={() => seekBySeconds(10)}
                      activeOpacity={0.75}
                    >
                      <SkipForward size={16} color={darkTheme.text} />
                      <Text
                        style={{ color: darkTheme.text }}
                        className="font-semibold ml-2"
                      >
                        10s
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-3 ml-3 self-start"
                  onPress={() =>
                    Linking.openURL(
                      `https://www.youtube.com/watch?v=${videoId}`,
                    )
                  }
                >
                  <Text
                    style={{ color: darkTheme.primary }}
                    className="text-sm"
                  >
                    Open in YouTube
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Right/Bottom Panel - Captions & Search */}
          <View
            style={[
              {
                backgroundColor: darkTheme.card,
                margin: 6,
              },
              isLandscape
                ? {
                    borderTopRightRadius: BORDER_RADIUS * 2,
                    borderBottomRightRadius: BORDER_RADIUS * 2,
                  }
                : {
                    borderBottomLeftRadius: BORDER_RADIUS * 2,
                    borderBottomRightRadius: BORDER_RADIUS * 2,
                  },
            ]}
            className={
              isLandscape
                ? "flex-1 rounded-3xl overflow-hidden flex flex-col"
                : "flex-1 rounded-3xl overflow-hidden flex flex-col mt-3"
            }
          >
            <View
              style={{ borderBottomColor: darkTheme.border }}
              className="px-4 pt-4 pb-3 border-b"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    style={{ color: darkTheme.secondary }}
                    className="text-[12px] font-medium uppercase tracking-[1px]"
                  >
                    Live Captions
                  </Text>
                  {/* <Text
                    style={{ color: darkTheme.text }}
                    className="text-sm font-semibold mt-1"
                  >
                    {title || "Video"}
                  </Text> */}
                </View>
              </View>
            </View>

            <View className="w-full px-6">
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  maxHeight: "30%",
                  minHeight: 100,
                }}
                showsVerticalScrollIndicator={false}
              >
                {renderTranscriptWords(true)}
              </ScrollView>
            </View>

            <View className="flex-1 w-full">
              {/* Search Words Section */}
              {searchList.length > 0 && (
                <View className="flex-1 border-t border-[#4a4a4a] flex flex-col">
                  <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
                    <Text
                      style={{ color: darkTheme.accent, opacity: 0.72 }}
                      className="text-xs font-medium"
                    >
                      Selected Words
                    </Text>
                    <TouchableOpacity onPress={() => setSearchList([])}>
                      <Text
                        style={{ color: darkTheme.primary }}
                        className="text-xs font-semibold"
                      >
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    ref={searchListScrollRef}
                    className="flex-1 overflow-scroll"
                  >
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                      }}
                    >
                      {searchList.map((word) => {
                        const isSearched = searchedWords.includes(word);

                        return (
                          <TouchableOpacity
                            key={word}
                            onPress={() => goToDefinition(word)}
                            onLongPress={() => removeSearchWord(word)}
                            style={{
                              borderColor: isSearched
                                ? darkTheme.primary
                                : darkTheme.border,
                              backgroundColor: isSearched
                                ? "rgba(250, 84, 28, 0.12)"
                                : darkTheme.background,
                              width: isLandscape ? "48%" : "31.33%",
                              marginRight: "2%",
                              marginBottom: 8,
                            }}
                            className={
                              isLandscape
                                ? "rounded-lg border px-2 py-2"
                                : "rounded-xl border px-3 py-2"
                            }
                            activeOpacity={0.82}
                          >
                            <View className="flex-row items-center">
                              <Search
                                size={isLandscape ? 12 : 14}
                                color={
                                  isSearched
                                    ? darkTheme.primary
                                    : darkTheme.secondary
                                }
                              />
                              <Text
                                style={{ color: darkTheme.text }}
                                className={
                                  isLandscape
                                    ? "text-xs font-semibold ml-2 flex-1"
                                    : "text-sm font-semibold ml-2 flex-1"
                                }
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {word}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: isSearched
                                  ? darkTheme.primary
                                  : darkTheme.accent,
                                opacity: isSearched ? 1 : 0.72,
                              }}
                              className={
                                isLandscape
                                  ? "text-[10px] mt-1"
                                  : "text-[11px] mt-1"
                              }
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {isSearched
                                ? "Searched"
                                : isLandscape
                                  ? "Tap"
                                  : "Tap to search"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Delete Loading Overlay */}
      {isDeletingVideo && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: darkTheme.card,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderColor: darkTheme.border,
              borderWidth: 1,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: darkTheme.primary,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
              }}
              className="animate-spin"
            />
            <Text
              style={{ color: darkTheme.text }}
              className="text-base font-semibold mt-4"
            >
              Deleting video...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
