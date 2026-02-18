import { StyleSheet, Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useOnboarding } from "../../hooks/useOnboarding";
import { OnboardingMask } from "./OnboardingMask";
import { TooltipBubble } from "./TooltipBubble";
import { GuideStep } from "../../types/common/GuideStep";
import { useRouter } from "expo-router";
import { StepConfig } from "../../types/common/StepConfig";
import { Pointer } from "lucide-react-native";
import { HoldToSkipButton } from "./HoldToSkipButton";
import { useAppDispatch } from "../../store/hooks";
import { updateOnboardingStage } from "../../store/slices/profileSlice";

const isValidLayout = (layout: any) => {
  return layout && layout.width > 0 && layout.height > 0;
};

export const OnboardingOverlay = () => {
  const { activeStep, targetLayout, setTargetLayout } = useOnboarding();
  const dispatch = useAppDispatch();
  const router = useRouter();

  if (!isValidLayout(targetLayout)) {
    return null;
  }
  // Keep the guard, but the animation happens when this
  // component is added/removed from the React tree.
  if (!activeStep || !targetLayout) return null;

  const contentConfig: StepConfig = getStepContent(
    activeStep,
    dispatch,
    router,
    setTargetLayout,
  );

  const handleSkip = () => {
    // Handle the skip action, e.g., move to the next step or exit onboarding
    dispatch(updateOnboardingStage("COMPLETED"));
  };

  return (
    <Animated.View
      // Fade duration in milliseconds
      entering={FadeIn.duration(800).delay(1000)}
      exiting={FadeOut.duration(300)}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <OnboardingMask layout={targetLayout} />

      <TooltipBubble layout={targetLayout} contentConfig={contentConfig} />
      <HoldToSkipButton onComplete={handleSkip} />
    </Animated.View>
  );
};

// Define this at the bottom of your file
const getStepContent = (
  step: GuideStep,
  dispatch: any,
  router: any,
  setTargetLayout?: any,
) => {
  const handleSkipFromDef1ToDef2 = () => {
    console.log("Skipping from DEFINITION_STEP_1 to DEFINITION_STEP_2");
    setTargetLayout(null);
    dispatch(updateOnboardingStage("DEFINITION_STEP_2"));
  };

  const steps: Record<string, StepConfig> = {
    SEARCH: {
      text: "Welcome! Search for a word to start.",
      desc: "How to learn with Lexsee 1/4",
      position: "bottom-left",
      icon: <Pointer size={28} color={"white"} />,
    },
    DEFINITION_STEP_1: {
      text: "Scroll to see the definition.",
      position: "bottom-left",
      onNext: handleSkipFromDef1ToDef2,
      desc: "How to learn with Lexsee 1/4",
    },
    DEFINITION_STEP_2: {
      text: "PHONETICS",
      position: "bottom-left",
      onNext: () => {
        dispatch(updateOnboardingStage("COMPLETED"));
      },
      desc: "How to learn with Lexsee 1/4",
    },
    // ... other steps
  };
  return steps[step];
};
