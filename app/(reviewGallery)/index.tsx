import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { ChevronLeft, Check, X } from "lucide-react-native";
import { router } from "expo-router";
import { handleReview } from "../../apis/getGalleryImages";

interface ReviewImage {
  imageHash: string;
  userId: string;
  status: string;
  userName: string;
  createdAt: number;
  tempUrl: string;
  word: string;
  s3Key: string;
  displayUrl: string;
  title: string;
}

const IMAGE_API_ENDPOINT = process.env.EXPO_PUBLIC_IMAGE_API_ENDPOINT;

export default function ReviewGalleryPage() {
  const theme = useTheme();
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ReviewImage | null>(null);
  const [processingHash, setProcessingHash] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const columnWidth = (screenWidth - 24) / 2;

  useEffect(() => {
    fetchPendingImages();
  }, []);

  const fetchPendingImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${IMAGE_API_ENDPOINT}/admin/pending`);
      const data = await response.json();

      // Handle both response formats:
      // 1. Direct array response
      // 2. Wrapped response with body field
      let bodyData = Array.isArray(data) ? data : data.body;

      // If body is a string, parse it
      if (typeof bodyData === "string") {
        bodyData = JSON.parse(bodyData);
      }

      setImages(bodyData || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      Alert.alert("Error", "Failed to load review images");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (image: ReviewImage) => {
    try {
      setProcessingHash(image.imageHash);

      // 1. Call the API logic
      // We pass the full image object and the 'approved' string
      await handleReview(image, "approved");

      // 2. UI Updates (Only runs if handleReview didn't throw an error)
      Alert.alert("Success", `${image.word} has been approved!`);

      setImages((prev) =>
        prev.filter((img) => img.imageHash !== image.imageHash),
      );
      setSelectedImage(null);
    } catch (error) {
      // This catches both network errors and the "Failed to process review" error
      Alert.alert("Error", "Could not reach the server or update database.");
    } finally {
      setProcessingHash(null);
    }
  };

  const handleReject = async (image: ReviewImage) => {
    try {
      setProcessingHash(image.imageHash);
      // TODO: Call rejection API endpoint
      await handleReview(image, "rejected");

      Alert.alert("Success", "Image rejected!");
      // Remove from list after rejection
      setImages((prev) =>
        prev.filter((img) => img.imageHash !== image.imageHash),
      );
      setSelectedImage(null);
    } catch (error) {
      Alert.alert("Error", "Failed to reject image");
    } finally {
      setProcessingHash(null);
    }
  };

  const renderImageCard = ({
    item,
    index,
  }: {
    item: ReviewImage;
    index: number;
  }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedImage(item);
        console.log("selectedImage:", JSON.stringify(item));
      }}
      style={{
        width: columnWidth,
        marginRight: index % 2 === 0 ? 12 : 0,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#333",
        }}
      >
        <Image
          source={{ uri: item.displayUrl }}
          style={{
            width: "100%",
            height: columnWidth,
            backgroundColor: "#2b2c2d",
          }}
        />
        <View
          style={{
            backgroundColor: "#1a1a1a",
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: "#333",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "600",
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            {item.word}
          </Text>
          <Text style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>
            by {item.userName}
          </Text>
          <Text style={{ color: "#666", fontSize: 11 }}>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className=" pt-24"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={"#fff"} size={24} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "white",
          }}
        >
          Contributed Images
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : images.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
            No pending images for review
          </Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageCard}
          keyExtractor={(item) => item.imageHash}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 24,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
        />
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
        >
          <ScrollView
            style={{ width: "100%" }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            {selectedImage && (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#333",
                }}
              >
                {/* Image Preview */}
                <Image
                  source={{ uri: selectedImage.displayUrl }}
                  style={{
                    width: "100%",
                    height: 300,
                    backgroundColor: "#2b2c2d",
                  }}
                  resizeMode="contain"
                />

                {/* Details Section */}
                <View style={{ padding: 20 }}>
                  {/* Word */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      WORD
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: "#6366f1",
                      }}
                    >
                      {selectedImage.word}
                    </Text>
                  </View>

                  {/* Contributor */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      CONTRIBUTOR
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "white",
                      }}
                    >
                      {selectedImage.userName}
                    </Text>
                  </View>

                  {/* User ID */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      USER ID
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#aaa",
                        fontFamily: "Courier New",
                      }}
                    >
                      {selectedImage.userId}
                    </Text>
                  </View>

                  {/* Submitted Date */}
                  <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      SUBMITTED
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#ddd",
                      }}
                    >
                      {new Date(selectedImage.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => handleReject(selectedImage)}
                      disabled={processingHash === selectedImage.imageHash}
                      style={{
                        flex: 1,
                        backgroundColor: "#ef4444",
                        borderRadius: 10,
                        paddingVertical: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        opacity:
                          processingHash === selectedImage.imageHash ? 0.5 : 1,
                      }}
                    >
                      <X color="white" size={20} />
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                      >
                        {processingHash === selectedImage.imageHash
                          ? "Processing..."
                          : "Reject"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleApprove(selectedImage)}
                      disabled={processingHash === selectedImage.imageHash}
                      style={{
                        flex: 1,
                        backgroundColor: "#10b981",
                        borderRadius: 10,
                        paddingVertical: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        opacity:
                          processingHash === selectedImage.imageHash ? 0.5 : 1,
                      }}
                    >
                      <Check color="white" size={20} />
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                      >
                        {processingHash === selectedImage.imageHash
                          ? "Processing..."
                          : "Approve"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    style={{
                      marginTop: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#888", fontSize: 14 }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
