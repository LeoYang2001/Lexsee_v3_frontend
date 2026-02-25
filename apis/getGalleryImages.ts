export interface GalleryImageResult {
  url: string;
  thumb: string;
  title: string;
  userSelected: boolean;
  sourceType: "internal" | "external" | "user-upload"; // Added to differentiate sources
  votes?: number;
  voter_ids?: string[]; // Track which users have voted
  imageHash?: string; // Added for tracking image uniqueness
  contributorId?: string;
  contributorName?: string;
  userName?: string;
  createdAt?: number;
  status?: string;
}

export interface GallerySearchResponse {
  items: GalleryImageResult[];
  word: string;
  count: number;
  error?: string;
}

const IMAGE_API_ENDPOINT = process.env.EXPO_PUBLIC_IMAGE_API_ENDPOINT;

export const searchGalleryImages = async (
  searchWord: string,
): Promise<GallerySearchResponse> => {
  try {
    if (!searchWord || searchWord.trim().length === 0) {
      throw new Error("Search word is required");
    }

    const cleanWord = `${searchWord.trim().toLowerCase()}`;

    // Your new API Gateway URL
    const baseUrl = `${IMAGE_API_ENDPOINT}/search`;
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

    console.log("get all image data:", JSON.stringify(data));

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

export const promoteImage = async (
  word: string,
  image: GalleryImageResult,
  userId: string,
) => {
  try {
    const response = await fetch(`${IMAGE_API_ENDPOINT}/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        word: word,
        imageUrl: image.url,
        title: image.title,
        source: image.sourceType,
        imageHash: image.imageHash,
        userId: userId, // Pass the UID here
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to promote image");
    }

    const data = await response.json();

    // Data now returns: { url, imageHash, voteCount, voter_ids, hasVoted }
    return data;
  } catch (error) {
    console.error("Selection Error:", error);
    throw error;
  }
};

// apis/uploadImageToReviewQueue.ts
interface UploadInitResponse {
  uploadUrl: string;
  imageHash: string;
}

export const uploadImageToReviewQueue = async (
  word: string,
  userId: string,
  userName: string,
  localUri: string,
): Promise<{ imageHash: string }> => {
  try {
    // 1. Get Pre-signed URL from the new dedicated endpoint
    const ticketResponse = await fetch(
      `${IMAGE_API_ENDPOINT}/upload-init`, // New Endpoint
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          userId,
          userName, // Now tracking the contributor
        }),
      },
    );

    if (!ticketResponse.ok) throw new Error("Failed to get upload ticket");

    const { uploadUrl, imageHash }: UploadInitResponse =
      await ticketResponse.json();

    // 2. Convert URI to Blob
    // In React Native, this fetch(localUri) works for local file paths
    const imgFetch = await fetch(localUri);
    const blob = await imgFetch.blob();

    // 3. PUT directly to S3 Review Bucket
    const s3Response = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": "image/jpeg", // Must match Lambda exactly
      },
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error("S3 Error Body:", errorText);
      throw new Error("S3 upload failed");
    }

    return { imageHash };
  } catch (error) {
    console.error("User Upload Error:", error);
    throw error;
  }
};

export const fetchUserUploads = async (userId: string, word = "") => {
  try {
    // 1. Construct the URL with the userId
    let url = `${IMAGE_API_ENDPOINT}/user-uploads?userId=${userId}`;

    // 2. Add the word filter only if a word is provided
    if (word && word.trim().length > 0) {
      url += `&word=${encodeURIComponent(word.trim().toLowerCase())}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Failed to fetch uploads`);
    }

    const data = await response.json();

    // Returns the array of images: { word, imageHash, status, displayUrl, etc. }
    return data.images || [];
  } catch (error) {
    console.error("Fetch User Uploads Error:", error);
    return [];
  }
};

export const handleReview = async (
  imageItem: any,
  decision: "approved" | "rejected",
) => {
  const API_URL = `${IMAGE_API_ENDPOINT}/admin/review`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: imageItem.userId,
        word: imageItem.word,
        decision: decision, // 'approved' or 'rejected'
      }),
    });

    if (!response.ok) throw new Error("Failed to process review");

    const result = await response.json();
    console.log("Success:", result.message);

    // TODO: Update your local state here to remove or update the UI card
  } catch (error) {
    console.error("Review Error:", error);
    alert("Error processing review. Check console.");
  }
};
