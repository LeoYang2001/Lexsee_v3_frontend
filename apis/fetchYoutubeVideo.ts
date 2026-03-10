const YOUTUBE_VIDEO_API_URL =
  "https://ap3y4fu8pk.execute-api.us-east-2.amazonaws.com/youtube-video";

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  startTimeText: string;
}

export interface YouTubeVideoResponse {
  isActive: boolean;
  date: string;
  transcriptS3Key: string;
  mode: string;
  createdAt: string;
  videoId: string;
  channelTitle: string;
  thumbnailUrl: string;
  embedUrl: string;
  title: string;
  contentId: string;
  transcript: TranscriptSegment[];
}

export interface YouTubeVideoMetadata {
  date: string;
  contentId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  embedUrl: string;
  mode: string;
  isActive: boolean;
  transcriptS3Key: string; // Used to fetch details later
  transcript?: TranscriptSegment[];
}

// The API now returns an array of metadata
export type YouTubeVideoListResponse = YouTubeVideoMetadata[];

export const fetchYoutubeVideos = async (
  date?: string, // Optional: filter by date if needed
): Promise<YouTubeVideoListResponse> => {
  try {
    const url = date
      ? `${YOUTUBE_VIDEO_API_URL}?date=${date}`
      : YOUTUBE_VIDEO_API_URL;

    console.log(`[YouTube API] Fetching videos. URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `[YouTube API] ${response.status} ${response.statusText}`,
      );
    }

    const data: YouTubeVideoListResponse = await response.json();
    console.log(`[YouTube API] Fetched ${data.length} videos successfully.`);
    return data;
  } catch (error) {
    console.error("[YouTube API] Error:", error);
    return []; // Return empty array on error to prevent UI crashes
  }
};
