import { useState, useCallback, useEffect, useRef, createRef } from 'react';
import { View } from 'react-native';
import { TutorialStep, isTutorialCompleted } from '../components/TutorialOverlay';
import React from 'react';

export interface TutorialStepWithTarget extends TutorialStep {
    targetRefKey?: string; // Key to identify which ref to use
}

interface UseTutorialOptions {
    steps: TutorialStepWithTarget[];
    storageKey: string;
    enabled?: boolean;
    delayMs?: number;
}

interface UseTutorialReturn {
    showTutorial: boolean;
    steps: TutorialStepWithTarget[];
    storageKey: string;
    handleComplete: () => void;
    handleSkip: () => void;
    refs: Record<string, React.RefObject<any>>;
    getCurrentTargetRef: () => React.RefObject<any> | undefined;
    currentStep: number;
}

export function useTutorial({ steps = [], storageKey, enabled = true, delayMs = 800 }: UseTutorialOptions): UseTutorialReturn {
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const hasChecked = useRef(false);
    const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Create refs for all possible targets
    const refs = useRef<Record<string, React.RefObject<any>>>({});
    
    // Initialize refs for each step's target
    useEffect(() => {
        const newRefs: Record<string, React.RefObject<any>> = {};
        if (steps && steps.length > 0) {
            steps.forEach(step => {
                if (step.targetRefKey && !refs.current[step.targetRefKey]) {
                    newRefs[step.targetRefKey] = createRef<any>();
                }
            });
        }
        refs.current = { ...refs.current, ...newRefs };
    }, [steps]);

    // Check if tutorial should be shown
    useEffect(() => {
        if (!enabled || hasChecked.current || showTutorial) {
            return;
        }

        let cancelled = false;

        const checkTutorial = async () => {
            hasChecked.current = true;
            const completed = await isTutorialCompleted(storageKey);
            if (!completed && !cancelled) {
                // Delay to allow layout to complete
                showTimerRef.current = setTimeout(() => {
                    if (cancelled) return;
                    setShowTutorial(prev => (prev ? prev : true));
                }, delayMs);
            }
        };

        checkTutorial();

        return () => {
            cancelled = true;
            if (showTimerRef.current) {
                clearTimeout(showTimerRef.current);
                showTimerRef.current = null;
            }
        };
    }, [storageKey, delayMs, enabled, showTutorial]);

    // Handle tutorial completion
    const handleComplete = useCallback(() => {
        setShowTutorial(false);
    }, []);

    // Handle tutorial skip
    const handleSkip = useCallback(() => {
        setShowTutorial(false);
    }, []);
    
    // Get ref for current step
    const getCurrentTargetRef = useCallback(() => {
        if (!steps || steps.length === 0) return undefined;
        const currentStepData = steps[currentStep];
        if (currentStepData?.targetRefKey) {
            return refs.current[currentStepData.targetRefKey];
        }
        return undefined;
    }, [steps, currentStep]);

    return {
        showTutorial,
        steps: steps || [],
        storageKey,
        handleComplete,
        handleSkip,
        refs: refs.current,
        getCurrentTargetRef,
        currentStep,
    };
}
