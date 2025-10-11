import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../theme/ThemeContext";
import ImageItem from "../../components/gallery/ImageItem";
import LoadingIndicator from "../../components/gallery/LoadingIndicator";
import EmptyState from "../../components/gallery/EmptyState";
import ErrorMessage from "../../components/gallery/ErrorMessage";
import GalleryHeader from "../../components/gallery/GalleryHeader";
import ImageSelectionModal from "../../components/gallery/ImageSelectionModal"; // New import
import {
  searchGalleryImages,
  getMockImages,
  type GalleryImageResult,
} from "../../apis/getGalleryImages";

export default function GalleryPage() {
  const theme = useTheme();
  const params = useLocalSearchParams();

  // Simplified modal states
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);

  const [fetchedImages, setFetchedImages] = useState<GalleryImageResult[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { width, height } = Dimensions.get("window");
  const BORDER_RADIUS = Math.min(width, height) * 0.06;

  // Get the word parameter passed from definition page
  const currentWord = params.word as string;

  // Trigger search immediately when page loads
  useEffect(() => {
    if (currentWord) {
      fetchImagesForWord(currentWord, 1, true);
    }
  }, [currentWord]);

  const fetchImagesForWord = async (
    word: string,
    page: number,
    reset: boolean = false
  ) => {
    if (isLoadingImages) return;

    setIsLoadingImages(true);
    setErrorMessage("");

    try {
      const result = await searchGalleryImages(word, page, 15);

      if (result.error) {
        setErrorMessage(result.error);

        // Fallback to mock data for development
        const mockResult = getMockImages(word, 15);

        if (reset) {
          setFetchedImages(mockResult.items);
          setCurrentPage(1);
        } else {
          setFetchedImages((prev) => [...prev, ...mockResult.items]);
        }

        setHasMoreImages(mockResult.hasMore);
        setCurrentPage(page);
        return;
      }

      if (reset) {
        setFetchedImages(result.items);
        setCurrentPage(1);
      } else {
        setFetchedImages((prev) => [...prev, ...result.items]);
      }

      setHasMoreImages(result.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching images:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load images"
      );
      setHasMoreImages(false);

      // Fallback to mock data
      const mockResult = getMockImages(word, 15);
      if (reset) {
        setFetchedImages(mockResult.items);
      }
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (hasMoreImages && !isLoadingImages && currentWord) {
      fetchImagesForWord(currentWord, currentPage + 1, false);
    }
  }, [hasMoreImages, isLoadingImages, currentWord, currentPage]);

  // Simplified image press handler
  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setIsSelectionModalVisible(true);
  };

  // Handle image selection confirmation
  const handleConfirmSelection = (imageUri: string) => {
    setIsSelectionModalVisible(false);
    setSelectedImage("");

    // Navigate back to definition page with the selected image URL
    router.back();

    // Use router.setParams to pass the image URL back
    setTimeout(() => {
      router.setParams({
        selectedImageUrl: imageUri,
        fromGallery: "true",
      });
    }, 100);
  };

  // Handle modal cancellation
  const handleCancelSelection = () => {
    setIsSelectionModalVisible(false);
    setSelectedImage("");
  };

  const navigateBackToWord = () => {
    router.back();
  };

  const renderImageItem = ({
    item,
    index,
  }: {
    item: GalleryImageResult;
    index: number;
  }) => (
    <ImageItem
      item={item}
      index={index}
      onPress={handleImagePress} // Simplified - just passes imageUri
    />
  );

  const renderFooter = () => (
    <LoadingIndicator
      isLoading={isLoadingImages}
      text="Loading more images..."
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      isLoading={isLoadingImages}
      currentWord={currentWord}
      onBackPress={navigateBackToWord}
    />
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#191D24",
      }}
    >
      {/* Simplified Image Selection Modal */}
      <ImageSelectionModal
        visible={isSelectionModalVisible}
        imageUri={selectedImage}
        currentWord={currentWord || "Unknown"}
        onConfirm={handleConfirmSelection}
        onCancel={handleCancelSelection}
      />

      {/* Header */}
      <GalleryHeader
        currentWord={currentWord}
        imageCount={fetchedImages.length}
        hasMoreImages={hasMoreImages}
        isLoading={isLoadingImages}
        onBackPress={navigateBackToWord}
        borderRadius={BORDER_RADIUS}
      />

      {/* Error Message */}
      <ErrorMessage error={errorMessage} showMockDataMessage={true} />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {!currentWord ? (
          <EmptyState
            isLoading={false}
            currentWord="No word selected"
            onBackPress={navigateBackToWord}
          />
        ) : fetchedImages.length === 0 && !isLoadingImages ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={fetchedImages}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `image-${index}`}
            numColumns={2}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 8,
              paddingBottom: 20,
            }}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={isLoadingImages ? null : renderEmptyState}
          />
        )}
      </View>
    </View>
  );
}
