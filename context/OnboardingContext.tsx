import { useSegments } from "expo-router";
import { createContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { GuideStep } from '../types/common/GuideStep';
import { updateOnboardingStage } from "../store/slices/profileSlice";
import { useAppDispatch } from "../store/hooks";

interface OnboardingContextType {
  // Use the actual type instead of a number
  activeStep: GuideStep | null; 
  targetLayout: { x: number; y: number; width: number; height: number } | null;
  setTargetLayout: (layout: any) => void;
}

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeStep, setActiveStep] = useState<GuideStep | null>(null);
  const [targetLayout, setTargetLayout] = useState<any>(null);
  
  const onboardingStage = useSelector((state: any) => state.profile.data?.onboardingStage);
  const segments = useSegments();
  const dispatch = useAppDispatch()

  useEffect(() => {
    const path = segments.join('/');

    // Map your Page + Redux Stage to the UI activeStep
    if (onboardingStage === 'SEARCH' && path === '(home)') {
      console.log('[FROM CONTEXT]: Should trigger setActive(SEARCH)')
      setActiveStep('SEARCH');
    } 
    // trigger the next step when the user navigates to the search page
    if (onboardingStage === 'SEARCH' && path === '(home)/search') {

      // step1: setActiveStep to FIRST_WORD_SEARCHED
      setActiveStep('DEFINITION_STEP_1');
      // step2: setTargetLayout to null to hide the spotlight
      setTargetLayout(null);
      // step3: update backend without blocking UI 
      dispatch(updateOnboardingStage('DEFINITION_STEP_1'));
    return;
  }
  if (onboardingStage === 'DEFINITION_STEP_1' && path === '(definition)') {

      // step1: setActiveStep to FIRST_WORD_SEARCHED
      setActiveStep('DEFINITION_STEP_1');
      // step2: setTargetLayout to null to hide the spotlight
    return;
  }
   if (onboardingStage === 'DEFINITION_STEP_2' && path === '(definition)') {

      // step1: setActiveStep to FIRST_WORD_SEARCHED
      setActiveStep('DEFINITION_STEP_2');
      // step2: setTargetLayout to null to hide the spotlight
    return;
  }

  if (onboardingStage === 'COMPLETED') {

      // step1: setActiveStep to FIRST_WORD_SEARCHED
      setActiveStep('COMPLETED');
      // step2: setTargetLayout to null to hide the spotlight
      setTargetLayout(null);
    return;
  }
 
  }, [onboardingStage, segments]);

  return (
    <OnboardingContext.Provider value={{ activeStep, targetLayout, setTargetLayout }}>
      {children}
    </OnboardingContext.Provider>
  );
};