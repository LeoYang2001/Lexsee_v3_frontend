import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingMask } from './OnboardingMask';
import { TooltipBubble } from './TooltipBubble';
import { GuideStep } from '../../types/common/GuideStep';
import { useRouter } from 'expo-router';

export const OnboardingOverlay = () => {
  const { activeStep, targetLayout } = useOnboarding();

  // Keep the guard, but the animation happens when this 
  // component is added/removed from the React tree.
  if (!activeStep || !targetLayout) return null;

  const content = getStepContent(activeStep);

  return (
    <Animated.View 
      // Fade duration in milliseconds
      entering={FadeIn.duration(800).delay(1000)} 
      exiting={FadeOut.duration(300)}
      style={StyleSheet.absoluteFill} 
      pointerEvents="box-none"
    >
      <OnboardingMask layout={targetLayout} />

      <TooltipBubble 
        text={content.text}
        layout={targetLayout}
        position={content.position}
        onNext={content.onNext}
        onSkip={()=>{}}
      />
    </Animated.View>
  );
};

// Define this at the bottom of your file
const getStepContent = (step: GuideStep) => {
  const router = useRouter();

  const steps: Record<string, { text: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; onNext: () => void }> = {
    'NEW': { 
      text: "Welcome! Search for a word to start.", 
      position: 'bottom-left',
      onNext: () => {
        router.push('(home)/search');
      },
    },
    'FIRST_WORD_SEARCHED': { 
      text: "Tap the card to see details.", 
      position: 'bottom-left',
      onNext: () => {},
    },
    // ... other steps
  };
  return steps[step];
};