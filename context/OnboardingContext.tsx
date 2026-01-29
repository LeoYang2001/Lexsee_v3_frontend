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
    if (onboardingStage === 'NEW' && path === '(home)') {
      console.log('[FROM CONTEXT]: Should trigger setActive(1)')
      setActiveStep('NEW');
    } else if (onboardingStage === 'FIRST_WORD_SEARCHED' && path === '(definition)') {
      setActiveStep('FIRST_WORD_SEARCHED');
    } else {
      setActiveStep(null);
    }

    // trigger the next step when the user navigates to the search page
    if (onboardingStage === 'NEW' && path === '(home)/search') {

      console.log('provider brain detect search and should update activeStep')
    // step1: setActiveStep to FIRST_WORD_SEARCHED
    setActiveStep('FIRST_WORD_SEARCHED');
    // step2: setTargetLayout to null to hide the spotlight
    setTargetLayout(null);

    // step3: update backend without blocking UI 
    dispatch(updateOnboardingStage('FIRST_WORD_SEARCHED'));
    return;
  }
  }, [onboardingStage, segments]);

  return (
    <OnboardingContext.Provider value={{ activeStep, targetLayout, setTargetLayout }}>
      {children}
    </OnboardingContext.Provider>
  );
};