import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Pressable,
} from "react-native";
import ImageZoomModal from "../common/ImageZoomModal";

interface ImageSelectionModalProps {
  visible: boolean;
  imageUri: string;
  currentWord: string;
  onConfirm: (imageUri: string) => void;
  onCancel: () => void;
}

export default function ImageSelectionModal({
  visible,
  imageUri,
  currentWord,
  onConfirm,
  onCancel,
}: ImageSelectionModalProps) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const { width, height } = Dimensions.get("window");

  const handleImagePress = () => {
    setIsImageZoomed(true);
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomed(false);
  };

  const handleConfirm = () => {
    onConfirm(imageUri);
  };

  const handleBackdropPress = () => {
    onCancel();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        {/* Black backdrop with opacity */}
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={handleBackdropPress}
        >
          {/* Modal Content */}
          <Pressable
            style={{
              backgroundColor: "#1F2937",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 400,
              alignItems: "center",
            }}
            onPress={() => {}} // Prevent backdrop press when touching modal content
          >
            {/* Word Title */}
            <Text
              style={{
                color: "#F59E0B",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {currentWord}
            </Text>

            {/* Image Container */}
            <TouchableOpacity
              onPress={handleImagePress}
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 20,
                borderWidth: 2,
                borderColor: "#3B82F6",
              }}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Title */}
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "600",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Select this picture?
            </Text>

            {/* Description */}
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 14,
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Confirm to use this photo for word{"\n"}memorization? Changes can
              be made later.
            </Text>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                gap: 12,
              }}
            >
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  backgroundColor: "#374151",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#D1D5DB",
                    fontSize: 16,
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  backgroundColor: "#E44814",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={isImageZoomed}
        imageUri={imageUri}
        onClose={handleCloseImageZoom}
        showCloseHint={true}
        backgroundColor="rgba(0, 0, 0, 0.95)"
        overlayOpacity={0.9}
      />
    </>
  );
}
