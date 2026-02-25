import React, { useState, useEffect, useCallback, use } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Text,
  Linking,
  Alert,
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
  uploadImageToS3,
  type GalleryImageResult,
} from "../../apis/getGalleryImages";
import * as ImagePicker from "expo-image-picker";
import emailjs from "@emailjs/react-native";
import { useAppSelector } from "../../store/hooks";
import { getCurrentUser } from "aws-amplify/auth";

const SERVICE_ID = "service_8m223te";
const TEMPLATE_ID = "template_2ozcmnn";
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_API_KEY;

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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { width, height } = Dimensions.get("window");
  const BORDER_RADIUS = Math.min(width, height) * 0.06;
  const [promotingImage, setPromotingImage] = useState(false);

  const [selectedLocalImage, setSelectedLocalImage] = useState<string | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const pickImage = async () => {
    // 1. Check existing permission status
    const { status, canAskAgain } =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    // 2. If not granted, ask for it
    if (status !== "granted") {
      const { status: newStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      // 3. If user denies and we can't ask again, send them to Settings
      if (newStatus !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Permission Required",
            "We need access to your photos to upload an image. Please enable it in your app settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
        }
        return;
      }
    }

    // 4. Proceed to Gallery if granted
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // 0.7-0.8 is the sweet spot for prod storage/quality
    });

    if (!result.canceled) {
      setSelectedLocalImage(result.assets[0].uri);
      console.log(" selected image:", result.assets[0].uri);
    } else {
      console.log("Image picking cancelled");
    }
  };

  const handleUpload = async () => {
    if (!selectedLocalImage) return;
    setIsUploading(true);

    return alert("under development, please check back later!");

    try {
      // 1. Execute the S3 Upload (Pre-signed URL flow)
      // const { finalUrl, imageHash } = await uploadImageToS3(
      //   currentWord,
      //   selectedLocalImage,
      // );
      // 2. Save Metadata to DynamoDB
      // We reuse your existing promoteImage function!
      // await promoteImage(currentWord, {
      //   url: finalUrl,
      //   thumb: finalUrl,
      //   title: `Community upload for ${currentWord}`,
      //   userSelected: false,
      //   imageHash: imageHash,
      //   sourceType: "user-upload",
      // });

      // 3. Success UI
      Alert.alert("Success", "Your image is now live in the gallery!");
      setIsFeedbackModalVisible(false);
      setSelectedLocalImage(null);

      // Refresh the list to show the user's new image
      fetchImagesForWord(currentWord);
    } catch (error) {
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  // Get the word parameter passed from definition page
  const currentWord = params.word as string;

  // Trigger search immediately when page loads
  useEffect(() => {
    // get user id
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };
    fetchUserId();

    if (currentWord) {
      fetchImagesForWord(currentWord);
    }
  }, [currentWord]);

  const fetchImagesForWord = async (word: string) => {
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
    promoteImage(currentWord, item, userId || "anonymous")
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

  const sendReportEmail = async () => {
    setIsReporting(true);
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        title: `${"complaint".toUpperCase()}: Image issue for word ${currentWord}`,
        name: "auto-generated",
        message: "no good image for this word",
        time: new Date().toLocaleString(),
      });
      Alert.alert(
        "Success",
        "Your report has been sent to our team. Thank you!",
      );
    } catch (error) {
      console.error("Report email error:", error);
      Alert.alert("Error", "Failed to send report. Please try again.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleReportIssue = () => {
    setIsFeedbackModalVisible(false);
    console.log("Report issue for word:", currentWord);
    // send an email to our support team with the word and context
    Alert.alert(
      "Report Issue",
      "Thank you for helping us improve! We'll send this report to our team.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: () => sendReportEmail(),
        },
      ],
    );
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
        selectedImageUri={selectedLocalImage}
        isUploading={isUploading}
        onClose={() => setIsFeedbackModalVisible(false)}
        onReportIssue={() => {
          setIsFeedbackModalVisible(false);
          console.log("Report issue for word:", currentWord);
          // send an email to our support team with the word and context
          handleReportIssue();
        }}
        onUploadImage={pickImage}
        onConfirmUpload={handleUpload}
      />

      {/* Header */}
      <GalleryHeader
        currentWord={currentWord}
        imageCount={fetchedImages.length}
        hasMoreImages={false}
        isLoading={isLoadingImages}
        onBackPress={navigateBackToWord}
        onUploadPress={() => setIsFeedbackModalVisible(true)}
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
