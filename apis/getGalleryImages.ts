export interface GalleryImageResult {
  url: string; // Changed from 'link' to match new backend
  thumb: string; // Changed from 'image.thumbnailLink'
  title: string;
  userSelected: boolean;
  sourceType: "internal" | "external";
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
