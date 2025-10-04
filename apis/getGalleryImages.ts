export interface GalleryImageResult {
  link: string;
  title?: string;
  displayLink?: string;
  snippet?: string;
  image?: {
    contextLink?: string;
    height?: number;
    width?: number;
    byteSize?: number;
    thumbnailLink?: string;
    thumbnailHeight?: number;
    thumbnailWidth?: number;
  };
}

export interface GallerySearchResponse {
  items: GalleryImageResult[];
  hasMore: boolean;
  totalResults?: number;
  searchTime?: number;
  error?: string;
}

export const searchGalleryImages = async (
  searchWord: string,
  page: number = 1,
  resultsPerPage: number = 10
): Promise<GallerySearchResponse> => {
  try {
    const apiKey = "AIzaSyDLKsMGMoJOmf5xz6JzHHhRONt96GmMG80";
    const cx = "2121e0d2556664ff3";

    // Validate inputs
    if (!searchWord || searchWord.trim().length === 0) {
      throw new Error("Search word is required");
    }

    // Clean and encode the search word
    const cleanWord = searchWord.trim().toLowerCase();
    const urlWord = encodeURIComponent(cleanWord);

    // Calculate start index (Google Custom Search API uses 1-based indexing)
    const startIndex = Math.max(1, (page - 1) * resultsPerPage + 1);

    // Ensure resultsPerPage is within Google's limits (1-10)
    const limitedResultsPerPage = Math.min(Math.max(1, resultsPerPage), 10);

    // Build the URL with proper parameters
    const searchParams = new URLSearchParams({
      q: `the illustration of ${cleanWord}`,
      cx: cx,
      key: apiKey,
      searchType: "image",
      start: startIndex.toString(),
      num: limitedResultsPerPage.toString(),
      safe: "active",
    });

    const url = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);

      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        // Use default error message if JSON parsing fails
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "API Error");
    }

    const validImages = data.items
      ? data.items.filter((item: any) => {
          if (!item.link) return false;

          // Check for valid URL
          const isValidUrl =
            item.link.startsWith("http://") || item.link.startsWith("https://");

          // Check for common image extensions
          const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(
            item.link
          );

          return (
            isValidUrl && (hasImageExtension || item.mime?.startsWith("image/"))
          );
        })
      : [];

    return {
      items: validImages,
      hasMore: data.items ? data.items.length === limitedResultsPerPage : false,
      totalResults: data.searchInformation?.totalResults
        ? parseInt(data.searchInformation.totalResults)
        : 0,
      searchTime: data.searchInformation?.searchTime
        ? parseFloat(data.searchInformation.searchTime)
        : 0,
    };
  } catch (error) {
    console.error("Error fetching gallery images:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      items: [],
      hasMore: false,
      totalResults: 0,
      searchTime: 0,
      error: errorMessage,
    };
  }
};

// Utility function with fallback for testing
export const testImageSearch = async (word: string): Promise<boolean> => {
  try {
    const result = await searchGalleryImages(word, 1, 1);
    return result.items.length > 0 || !result.error;
  } catch (error) {
    console.error("Test search failed:", error);
    return false;
  }
};

// Mock data function for development/testing
export const getMockImages = (
  word: string,
  count: number = 15
): GallerySearchResponse => {
  const mockImages: GalleryImageResult[] = Array.from(
    { length: count },
    (_, index) => ({
      link: `https://picsum.photos/300/200?random=${word}-${index}`,
      title: `${word} illustration ${index + 1}`,
      displayLink: "example.com",
      snippet: `Beautiful illustration of ${word}`,
    })
  );

  return {
    items: mockImages,
    hasMore: count === 15,
    totalResults: count * 10,
    searchTime: 0.1,
  };
};
