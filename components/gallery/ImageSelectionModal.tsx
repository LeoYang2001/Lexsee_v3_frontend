import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
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
  const [showModal, setShowModal] = useState(false);
  const { width, height } = Dimensions.get("window");

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      setShowModal(true);

      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      modalOpacity.value = withTiming(1, { duration: 300 });
      imageScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      imageScale.value = withTiming(0.8, { duration: 200 }, () => {
        runOnJS(setShowModal)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const handleImagePress = () => {
    setIsImageZoomed(true);
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomed(false);
  };

  const handleConfirm = () => {
    console.log("confirm function triggered");
    onConfirm(imageUri);
  };

  const handleBackdropPress = () => {
    onCancel();
  };

  if (!showModal) return null;

  return (
    <>
      <Modal
        visible={showModal}
        transparent={true}
        animationType="none" // We handle animations manually
        statusBarTranslucent={true}
      >
        {/* Animated backdrop */}
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            },
            backdropStyle,
          ]}
        >
          <Pressable
            style={{ flex: 1, width: "100%" }}
            onPress={handleBackdropPress}
            className="absolute w-full h-full bg-transparent"
          />

          {/* Modal Content */}
          <Animated.View
            style={[
              {
                backgroundColor: "#191D24",
                borderRadius: 20,
                padding: 20,
                width: "100%",
                maxWidth: 400,
                alignItems: "center",
                position: "absolute",
              },
              modalStyle,
            ]}
          >
            {/* Animated Image Container */}
            <Animated.View
              style={[
                {
                  width: "100%",
                  aspectRatio: 16 / 9,
                  borderRadius: 20,
                  overflow: "hidden",
                  marginBottom: 20,
                },
                imageStyle,
              ]}
            >
              <TouchableOpacity
                onPress={handleImagePress}
                style={{
                  width: "100%",
                  height: "100%",
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
            </Animated.View>

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
                  backgroundColor: "#E44C21",
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
          </Animated.View>

          {/* <Pressable
            style={{ flex: 1, width: "100%", backgroundColor: "green" }}
            // onPress={handleBackdropPress}
          /> */}
        </Animated.View>
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
