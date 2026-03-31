import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_completed';

export type OnboardingStep = 
  | 'welcome'
  | 'dashboard'
  | 'donor-donate'
  | 'donor-active'
  | 'recipient-browse'
  | 'recipient-cart'
  | 'profile'
  | 'complete';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep | null;
  isActive: boolean;
  completedSteps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep | null) => void;
  loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingComplete: false,
  currentStep: null,
  isActive: false,
  completedSteps: [],
  startOnboarding: () => {},
  nextStep: () => {},
  skipOnboarding: () => {},
  completeOnboarding: () => {},
  setCurrentStep: () => {},
  loading: true,
});

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  // Load onboarding completion status from storage
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(completed === 'true');
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStep('welcome');
    setCompletedSteps([]);
  };

  const nextStep = () => {
    if (!currentStep) return;

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step (will be set by the screen navigation)
    setCurrentStep(null);
  };

  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboardingComplete(true);
      setIsActive(false);
      setCurrentStep(null);
      setCompletedSteps([]);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboardingComplete(true);
      setIsActive(false);
      setCurrentStep(null);
      setCompletedSteps([]);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const value: OnboardingContextType = {
    isOnboardingComplete,
    currentStep,
    isActive,
    completedSteps,
    startOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    setCurrentStep,
    loading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
