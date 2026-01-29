import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';


interface Props {

  text: string;

  layout: { x: number; y: number; width: number; height: number } | null;

  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  widthPercentage?: number;

  onNext: () => void;

  onSkip: () => void;

  progress?: string;

}
export const TooltipBubble = ({ 
  text, 
  layout, 
  position, 
  widthPercentage = 0.9, 
  onNext, 
  onSkip,
  progress 
}: Props) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  if (!layout) return null;

  const bubbleWidth = screenWidth * widthPercentage;
  const spacing = 16;

  const getPositionStyles = () => {
    const targetRight = layout.x + layout.width;
    const targetBottom = layout.y + layout.height;

    switch (position) {
      case 'top-left': return { bottom: screenHeight - layout.y + spacing, left: layout.x };
      case 'top-right': return { bottom: screenHeight - layout.y + spacing, left: targetRight - bubbleWidth };
      case 'bottom-left': return { top: targetBottom + spacing, left: layout.x };
      case 'bottom-right': return { top: targetBottom + spacing, left: targetRight - bubbleWidth };
      default: return { top: targetBottom + spacing, left: layout.x };
    }
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(800).delay(1000)} 
      exiting={FadeOut.duration(300)}
      style={[styles.outerWrapper, getPositionStyles(), { width: bubbleWidth }]}
    >
      {/* 1. THE GRADIENT BORDER & GLOW */}
      <LinearGradient
        colors={['#FF8C00', '#F97316', '#EA580C']} // Orange to Deep Orange gradient
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBorder}
      >
        {/* 2. THE INNER CONTENT (Background should be dark to match your image) */}
        <View style={styles.innerContainer}>
          {progress && <Text style={styles.progressText}>{progress}</Text>}

          <Text style={styles.text}>{text}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipLabel}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
              <Text style={styles.nextLabel}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    zIndex: 999,
    // The glow effect
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  gradientBorder: {
    padding: 1.5, // This thickness creates the "border"
    borderRadius: 10,
  },
  innerContainer: {
    backgroundColor: '#121212', // Dark background like your image
    borderRadius: 10, // Slightly smaller than border radius to fit inside
    padding: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF', // Light text for dark background
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  skipBtn: { paddingVertical: 8 },
  skipLabel: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextLabel: { color: 'white', fontSize: 15, fontWeight: '700' },
});