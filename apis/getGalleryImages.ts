export interface GalleryImageResult {
  url: string;
  thumb: string;
  title: string;
  userSelected: boolean;
  sourceType: "internal" | "external" | "user-upload"; // Added to differentiate sources
  votes?: number;
  imageHash?: string; // Added for tracking image uniqueness
}

export interface GallerySearchResponse {
  items: GalleryImageResult[];
  word: string;
  count: number;
  error?: string;
}

export const searchGalleryImages = async (
  searchWord: string,
): Promise<GallerySearchResponse> => {
  try {
    if (!searchWord || searchWord.trim().length === 0) {
      throw new Error("Search word is required");
    }

    const cleanWord = `${searchWord.trim().toLowerCase()}`;

    // Your new API Gateway URL
    const baseUrl =
      "https://fgpcgs7s1i.execute-api.us-east-2.amazonaws.com/search";
    const url = `${baseUrl}?q=${encodeURIComponent(cleanWord)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();

    console.log("data:", JSON.stringify(data));
    // Map the backend 'images' array to our 'items' interface
    return {
      items: data.images || [],
      word: data.word || cleanWord,
      count: data.count || 0,
    };
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return {
      items: [],
      word: searchWord,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const promoteImage = async (word: string, image: GalleryImageResult) => {
  try {
    const response = await fetch(
      "https://fgpcgs7s1i.execute-api.us-east-2.amazonaws.com/select",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          imageUrl: image.url, // Original web URL
          title: image.title,
          source: image.sourceType,
          imageHash: image.imageHash,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to promote image");
    }

    const data = await response.json();

    // Returns { url: "cloudfront_url", newVoteCount: X }
    return data;
  } catch (error) {
    console.error("Selection Error:", error);
    throw error;
  }
};

// apis/uploadUserImage.ts

interface UploadResponse {
  uploadUrl: string;
  finalUrl: string;
  imageHash: string;
}

export const uploadImageToS3 = async (
  word: string,
  localUri: string,
): Promise<{ finalUrl: string; imageHash: string }> => {
  try {
    // 1. Get Pre-signed URL from Lambda
    const ticketResponse = await fetch(
      "https://fgpcgs7s1i.execute-api.us-east-2.amazonaws.com/select",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getUploadUrl",
          word,
        }),
      },
    );

    if (!ticketResponse.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, finalUrl, imageHash }: UploadResponse =
      await ticketResponse.json();

    // 2. Convert URI to Blob
    const imgFetch = await fetch(localUri);
    const blob = await imgFetch.blob();

    // 3. PUT directly to S3
    const s3Response = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "image/jpeg" },
    });

    if (!s3Response.ok) throw new Error("S3 upload failed");

    return { finalUrl, imageHash };
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error;
  }
};
