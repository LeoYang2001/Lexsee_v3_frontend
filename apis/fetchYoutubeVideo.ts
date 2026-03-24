const YOUTUBE_API_BASE_URL =
  "https://ap3y4fu8pk.execute-api.us-east-2.amazonaws.com";
const YOUTUBE_ROUTES = {
  videos: "/youtube-video",
  transcription: "/youtube-transcription",
  upload: "/youtube-upload",
  fetchByUid: "/get-youtube-by-uid",
};
const YOUTUBE_VIDEO_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.videos}`;
const YOUTUBE_TRANSCRIPT_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.transcription}`;
const YOUTUBE_MANAGE_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.upload}`;
const YOUTUBE_FETCHBYUID_API_URL = `${YOUTUBE_API_BASE_URL}${YOUTUBE_ROUTES.fetchByUid}`;

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

/**
 * Adds a new YouTube video to the user's LexSee library.
 * Returns the full metadata and transcript on success.
 */
export const uploadYoutubeVideo = async (
  userId: string,
  youtubeUrl: string,
): Promise<YouTubeVideoResponse | null> => {
  try {
    console.log(`[YouTube API] Uploading/Adding video: ${youtubeUrl}`);

    const response = await fetch(YOUTUBE_MANAGE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        youtubeUrl,
        action: "ADD",
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to upload video.");
    }

    // Format the response data to match YouTubeVideoResponse interface
    const formattedData: YouTubeVideoResponse = {
      isActive: result.data.isActive ?? true,
      date: result.data.createdAt
        ? new Date(result.data.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      transcriptS3Key: result.data.s3Key || "",
      mode: "user-uploaded",
      createdAt: result.data.createdAt || new Date().toISOString(),
      videoId: result.data.videoId,
      channelTitle: result.data.channelTitle || "Your Upload",
      thumbnailUrl: result.data.thumbnail || "",
      embedUrl: `https://www.youtube.com/embed/${result.data.videoId}`,
      title: result.data.title,
      contentId: result.data.videoId,
      transcript: (result.data.transcript || []).map((seg: any) => ({
        startMs: seg.start_ms || 0,
        endMs: seg.end_ms || 0,
        text: seg.snippet || "",
        startTimeText: seg.start_time_text || "",
      })),
    };

    return formattedData;
  } catch (error) {
    console.error("[YouTube API] Upload Error:", error);
    throw error; // Rethrow so the UI can show an alert (e.g., "No Transcripts Found")
  }
};

/**
 * Removes a YouTube video from the user's LexSee library.
 * Deletes both the DynamoDB record and the S3 transcript file.
 */
export const deleteYoutubeVideo = async (
  userId: string,
  youtubeUrl: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`[YouTube API] Requesting deletion for video: ${youtubeUrl}`);

    const response = await fetch(YOUTUBE_MANAGE_API_URL, {
      method: "POST", // We use POST to send the body with the DELETE action
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        youtubeUrl,
        action: "DELETE",
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete video.");
    }

    console.log(`[YouTube API] Deletion successful: ${result.message}`);
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("[YouTube API] Delete Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred during deletion.",
    };
  }
};

/**
 * Fetches all YouTube videos and transcripts saved by a specific user.
 */
export const fetchUserYoutubeLibrary = async (
  userId: string,
): Promise<YouTubeVideoResponse[]> => {
  try {
    const url = `${YOUTUBE_FETCHBYUID_API_URL}?userId=${userId}`;
    console.log(`[YouTube API] Fetching library for user: ${userId}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`[YouTube API] Fetch failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.library) {
      console.log(`[YouTube API] Found ${result.count} videos in library.`);

      // Map API response to YouTubeVideoResponse interface
      const mappedVideos: YouTubeVideoResponse[] = result.library.map(
        (item: any) => ({
          isActive: true, // Default to active
          date: item.createdAt
            ? new Date(item.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          transcriptS3Key: item.s3Key || "",
          mode: "user-uploaded",
          createdAt: item.createdAt || new Date().toISOString(),
          videoId: item.videoId,
          channelTitle: item.channelTitle || "Your Upload",
          thumbnailUrl: item.thumbnail || "",
          embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
          title: item.title,
          contentId: item.videoId, // Use videoId as contentId
          transcript: (item.transcript || []).map((seg: any) => ({
            startMs: seg.start_ms || 0,
            endMs: seg.end_ms || 0,
            text: seg.snippet || "",
            startTimeText: seg.start_time_text || "",
          })),
        }),
      );

      return mappedVideos;
    }

    return [];
  } catch (error) {
    console.error("[YouTube API] Fetch Library Error:", error);
    return []; // Return empty array to prevent UI mapping errors
  }
};
