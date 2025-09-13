import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import ConversationItem from "./ConversationItem";

interface ConversationLine {
  speaker: string;
  message: string;
  tokens: string[];
}

interface ConversationViewProps {
  conversation: ConversationLine[];
  isLoading: boolean;
  isLoaded: boolean;
  highlightWord?: string;
  animationDelay?: number; // Delay between messages in ms
}

const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  isLoading,
  isLoaded,
  highlightWord,
  animationDelay = 500, // Increased from 800ms to 1500ms
}) => {
  const TYPING_SPEED = 1000;
  const [displayedConversation, setDisplayedConversation] = useState<
    ConversationLine[]
  >([]);
  const [currentTypingIndex, setCurrentTypingIndex] = useState<number | null>(
    null
  );

  // Reset when conversation changes
  useEffect(() => {
    if (isLoaded && conversation && conversation.length > 0) {
      setDisplayedConversation([]);
      setCurrentTypingIndex(null);

      // Start animation sequence
      setTimeout(() => {
        animateMessages();
      }, 300); // Small delay before starting
    }
  }, [conversation, isLoaded]);

  // Even cleaner approach using async/await:
  const animateMessages = async () => {
    if (!conversation || conversation.length === 0) return;

    for (let index = 0; index < conversation.length; index++) {
      const message = conversation[index];

      // Show typing indicator
      setCurrentTypingIndex(index);

      // Wait for typing duration
      await new Promise((resolve) => setTimeout(resolve, TYPING_SPEED));

      // Show message and clear typing
      setDisplayedConversation((prev) => [...prev, message]);
      setCurrentTypingIndex(null);

      // Wait before next message (except for last message)
      if (index < conversation.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, animationDelay));
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
          }}
        >
          <ActivityIndicator size="small" color="#E44814" />
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            Generating conversation...
          </Text>
        </View>
      </View>
    );
  }

  // No conversation data
  if (!isLoaded || !conversation || conversation.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        borderRadius: 12,
      }}
    >
      {/* Conversation Messages */}
      <View style={{ gap: 12 }}>
        {displayedConversation.map((line, index) => (
          <ConversationItem
            key={index}
            line={line}
            index={index}
            highlightWord={highlightWord}
          />
        ))}

        {/* Show typing indicator for the next message */}
        {currentTypingIndex !== null && conversation[currentTypingIndex] && (
          <ConversationItem
            key={`typing-${currentTypingIndex}`}
            line={conversation[currentTypingIndex]}
            index={currentTypingIndex}
            highlightWord={highlightWord}
            isTyping={true}
          />
        )}
      </View>
    </View>
  );
};

export default ConversationView;
