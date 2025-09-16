import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
} from "react-native-reanimated";

interface ConversationLine {
  speaker: string;
  message: string;
  tokens: string[];
}

interface ConversationItemProps {
  line: ConversationLine;
  index: number;
  highlightWord?: string;
  isTyping?: boolean; // New prop to show typing indicator
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  line,
  index,
  highlightWord,
  isTyping = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    // Animate in with delay
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  // Determine if this is Person A or Person B for styling
  const isPersonA = line.speaker === "Person A";

  // Render message with highlighted words
  const renderMessage = () => {
    if (!highlightWord) {
      return (
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            lineHeight: 22,
            opacity: isTyping ? 0.7 : 1,
          }}
        >
          {line.message}
        </Text>
      );
    }

    // Split message by the highlight word while preserving the word and spaces
    const regex = new RegExp(`(\\b${highlightWord}\\b)`, "gi");
    const parts = line.message.split(regex);

    return (
      <Text
        style={{
          color: "#fff",
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {parts.map((part, index) => {
          const isHighlighted =
            part.toLowerCase() === highlightWord.toLowerCase();
          return (
            <Text
              key={index}
              style={{
                backgroundColor: isHighlighted ? "#56362d" : "transparent",
                color: isHighlighted ? "#ea511d" : "#F9FAFB",
                fontWeight: isHighlighted ? "600" : "normal",
                borderRadius: isHighlighted ? 4 : 0,
                paddingHorizontal: isHighlighted ? 4 : 0,
                paddingVertical: isHighlighted ? 2 : 0,
              }}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: isPersonA ? "flex-start" : "flex-end",
          marginBottom: 4,
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: isPersonA ? "#2d2e31" : "#332b31",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomLeftRadius: isPersonA ? 4 : 16,
            borderBottomRightRadius: isPersonA ? 16 : 4,
          }}
        >
          {/* Speaker name */}
          {/* <Text
            style={{
              color: isPersonA ? "#9CA3AF" : "#BFDBFE",
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            {line.speaker}
          </Text> */}

          {/* Message content or typing indicator */}
          {isTyping ? <TypingIndicator /> : renderMessage()}
        </View>
      </View>
    </Animated.View>
  );
};

// Typing indicator component - now inside the message bubble
const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDots = () => {
      dot1.value = withSpring(1, { duration: 600 }, () => {
        dot1.value = withSpring(0, { duration: 600 });
      });

      dot2.value = withDelay(
        200,
        withSpring(1, { duration: 600 }, () => {
          dot2.value = withSpring(0, { duration: 600 });
        })
      );

      dot3.value = withDelay(
        400,
        withSpring(1, { duration: 600 }, () => {
          dot3.value = withSpring(0, { duration: 600 });
        })
      );
    };

    animateDots();
    const interval = setInterval(animateDots, 1800);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ scale: 0.8 + dot1.value * 0.4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ scale: 0.8 + dot2.value * 0.4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ scale: 0.8 + dot3.value * 0.4 }],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 4,
      }}
    >
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            backgroundColor: "#9CA3AF",
            borderRadius: 3,
          },
          dot1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            backgroundColor: "#9CA3AF",
            borderRadius: 3,
          },
          dot2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            backgroundColor: "#9CA3AF",
            borderRadius: 3,
          },
          dot3Style,
        ]}
      />
    </View>
  );
};

export default ConversationItem;
