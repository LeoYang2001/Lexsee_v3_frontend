import { useContext } from 'react';
import { OnboardingContext } from '../context/OnboardingContext';
import { useAppDispatch } from '../store/hooks';
import { updateOnboardingStage } from '../store/slices/profileSlice';
import { GuideStep } from '../types/common/GuideStep';

export const useOnboarding = () => {
  
  // 1. Hook into the "Director" (Context)
  const context = useContext(OnboardingContext);

  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  // Destructure the values from Context
  const { activeStep, targetLayout, setTargetLayout } = context;


  return { 
    activeStep, 
    targetLayout, 
    setTargetLayout
  };
};