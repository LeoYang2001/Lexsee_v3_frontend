import { GuideStep } from "./GuideStep";

export interface StepConfig {
  text: string;
  desc?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onNext?: () => void;
  icon?: React.ReactNode;
}