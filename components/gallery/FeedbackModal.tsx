import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { AlertCircle, Upload, X } from "lucide-react-native";

interface FeedbackModalProps {
  visible: boolean;
  currentWord: string;
  selectedImageUri?: string | null;
  isUploading?: boolean;
  onClose: () => void;
  onReportIssue: () => void;
  onUploadImage: () => void;
  onConfirmUpload?: () => void;
}

export default function FeedbackModal({
  visible,
  currentWord,
  selectedImageUri,
  isUploading,
  onClose,
  onReportIssue,
  onUploadImage,
  onConfirmUpload,
}: FeedbackModalProps) {
  const [showModal, setShowModal] = useState(false);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(500);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShowModal(true);

      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });
      modalTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalTranslateY.value = withTiming(500, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setShowModal)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      {/* Animated backdrop */}
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "flex-end",
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Modal Content - Bottom Sheet Style */}
        <Animated.View
          style={[
            {
              backgroundColor: "#191D24",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            },
            modalStyle,
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                {selectedImageUri ? "Upload your image" : "Help us improve"}
              </Text>
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                for "{currentWord}"
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Image Preview - Show if selectedImageUri exists */}
          {selectedImageUri && (
            <View
              style={{
                marginBottom: 24,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: selectedImageUri }}
                style={{
                  width: "100%",
                  height: 200,
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Options */}
          {!selectedImageUri ? (
            <View style={{ gap: 12 }}>
              {/* Report Issue Option */}
              <TouchableOpacity
                onPress={onReportIssue}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#1F2937",
                  padding: 18,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(228, 76, 33, 0.2)",
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <AlertCircle color="#EF4444" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    Report an Issue
                  </Text>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      lineHeight: 18,
                    }}
                  >
                    No appropriate picture for this word
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Upload Image Option */}
              <TouchableOpacity
                onPress={onUploadImage}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#1F2937",
                  padding: 18,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(228, 76, 33, 0.2)",
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(228, 76, 33, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Upload color="#E44C21" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    Upload Pictures
                  </Text>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      lineHeight: 18,
                    }}
                  >
                    Share your own images for this word
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {/* Action Buttons when image is selected */}
              <TouchableOpacity
                onPress={onConfirmUpload}
                disabled={isUploading}
                style={{
                  backgroundColor: "#E44C21",
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: isUploading ? 0.7 : 1,
                }}
                activeOpacity={0.8}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Confirm & Upload
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onUploadImage}
                style={{
                  backgroundColor: "#1F2937",
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(228, 76, 33, 0.3)",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: "#E44C21",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Choose Another
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
