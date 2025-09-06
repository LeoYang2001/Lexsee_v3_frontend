import React from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  Image,
  StatusBar,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { X } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface ImageZoomModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  showCloseHint?: boolean;
  backgroundColor?: string;
  overlayOpacity?: number;
}

export default function ImageZoomModal({
  visible,
  imageUri,
  onClose,
  showCloseHint = true,
  backgroundColor = "rgba(0, 0, 0, 0.95)",
  overlayOpacity = 0.9,
}: ImageZoomModalProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar
        backgroundColor={`rgba(0,0,0,${overlayOpacity})`}
        barStyle="light-content"
      />

      {/* Use TouchableWithoutFeedback for the background */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: backgroundColor,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Close button */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              zIndex: 10,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 20,
              padding: 8,
            }}
            onPress={onClose}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Image container */}
          <View
            style={{
              width: screenWidth - 40,
              height: screenHeight - 120,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Transparent overlay on top of image that triggers close */}
            <TouchableWithoutFeedback onPress={onClose}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "transparent",
                  zIndex: 5,
                }}
              />
            </TouchableWithoutFeedback>
          </View>

          {/* Tap to close hint */}
          {showCloseHint && (
            <Animated.View
              entering={FadeIn.delay(500).duration(300)}
              style={{
                position: "absolute",
                bottom: 50,
                alignSelf: "center",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 14,
                  opacity: 0.8,
                  textAlign: "center",
                }}
              >
                Tap anywhere to close
              </Text>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
