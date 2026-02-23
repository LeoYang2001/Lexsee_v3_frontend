import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ImageItem from "../../components/gallery/ImageItem";
import LoadingIndicator from "../../components/gallery/LoadingIndicator";
import EmptyState from "../../components/gallery/EmptyState";
import ErrorMessage from "../../components/gallery/ErrorMessage";
import GalleryHeader from "../../components/gallery/GalleryHeader";
import ImageSelectionModal from "../../components/gallery/ImageSelectionModal"; // New import
import FeedbackModal from "../../components/gallery/FeedbackModal";
import {
  promoteImage,
  searchGalleryImages,
  type GalleryImageResult,
} from "../../apis/getGalleryImages";

export default function GalleryPage() {
  const params = useLocalSearchParams();

  // Simplified modal states
  const [selectedImage, setSelectedImage] = useState<GalleryImageResult | null>(
    null,
  );
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);

  const [fetchedImages, setFetchedImages] = useState<GalleryImageResult[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { width, height } = Dimensions.get("window");
  const BORDER_RADIUS = Math.min(width, height) * 0.06;
  const [promotingImage, setPromotingImage] = useState(false);

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
    reset: boolean = false,
  ) => {
    if (isLoadingImages) return;

    setIsLoadingImages(true);
    setErrorMessage("");

    try {
      const result = await searchGalleryImages(word);
      setFetchedImages(result.items);
    } catch (error) {
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
  const handleImagePress = (item: GalleryImageResult) => {
    setSelectedImage(item);
    setIsSelectionModalVisible(true);
    console.log("Selected image:", JSON.stringify(item));
  };

  // Handle image selection confirmation
  const handleConfirmSelection = (item: GalleryImageResult) => {
    // 1. Immediate UI Feedback
    // Close modals and clear selection so the screen feels responsive
    setIsSelectionModalVisible(false);
    setSelectedImage(null);

    // 2. Immediate Navigation
    // Move the user back to the definition page right away
    router.back();

    // 3. Update Params on the previous screen immediately
    // We use a small timeout to ensure the router.back() transition has started
    setTimeout(() => {
      router.setParams({
        selectedImageUrl: item.url,
        fromGallery: "true",
        // Optional: you could pass a 'isSyncing' flag if you want to show a small spinner there
      });
    }, 50);

    // 4. Fire and Forget the API Call
    // We don't 'await' this. It runs in the background.
    promoteImage(currentWord, item)
      .then((response) => {
        console.log("Background promotion success:", response);
      })
      .catch((error) => {
        // Since the user has already navigated away,
        // you might want to show a silent toast or log this to an error service.
        console.error("Background promotion failed:", error);
      });
  };

  // Handle modal cancellation
  const handleCancelSelection = () => {
    setIsSelectionModalVisible(false);
    setSelectedImage(null);
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

  const renderFooter = () => {
    // 1. If still fetching initial or more images, show the spinner
    if (isLoadingImages) {
      return (
        <LoadingIndicator
          isLoading={isLoadingImages}
          text="Loading more images..."
        />
      );
    }

    // 2. If finished loading and we have images, show the "Report/Upload" trigger
    if (fetchedImages.length > 0) {
      return (
        <View
          style={{
            paddingVertical: 32,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            That's all the images we have
          </Text>
          <TouchableOpacity
            onPress={() => setIsFeedbackModalVisible(true)}
            style={{
              backgroundColor: "#1F2937",
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(228, 76, 33, 0.3)",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: "#E44C21",
                fontSize: 15,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Can't find the right image?
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 13,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Report issue or upload your own
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

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
        imageItem={selectedImage}
        onConfirm={handleConfirmSelection}
        onCancel={handleCancelSelection}
        isPromoting={promotingImage}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={isFeedbackModalVisible}
        currentWord={currentWord}
        onClose={() => setIsFeedbackModalVisible(false)}
        onReportIssue={() => {
          setIsFeedbackModalVisible(false);
          console.log("Report issue for word:", currentWord);
          // TODO: Implement report issue functionality
        }}
        onUploadImage={() => {
          setIsFeedbackModalVisible(false);
          console.log("Upload image for word:", currentWord);
          // TODO: Implement upload image functionality
        }}
      />

      {/* Header */}
      <GalleryHeader
        currentWord={currentWord}
        imageCount={fetchedImages.length}
        hasMoreImages={false}
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
            // onEndReached={handleLoadMore}
            // onEndReachedThreshold={0.5}
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
