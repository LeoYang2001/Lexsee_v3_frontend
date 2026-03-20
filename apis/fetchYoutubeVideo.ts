const YOUTUBE_API_BASE_URL =
  "https://ap3y4fu8pk.execute-api.us-east-2.amazonaws.com";
const YOUTUBE_ROUTES = {
  videos: "/youtube-video",
  transcription: "/youtube-transcription",
};
const YOUTUBE_VIDEO_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.videos}`;
const YOUTUBE_TRANSCRIPT_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.transcription}`;

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

/**
 * Fetches a specific transcript JSON from S3 via the Lambda API.
 * @param s3Key - The key path (e.g., 'daily/2026-03-13/yt_x-XdOaZPhBw/transcript.json')
 */
export async function fetchYouTubeTranscript(
  s3Key: string,
): Promise<TranscriptSegment[]> {
  try {
    const url = new URL(YOUTUBE_TRANSCRIPT_API_URL);
    url.searchParams.append("key", s3Key);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data as TranscriptSegment[];
  } catch (error) {
    console.error("Failed to fetch transcript:", error);
    throw error;
  }
}
