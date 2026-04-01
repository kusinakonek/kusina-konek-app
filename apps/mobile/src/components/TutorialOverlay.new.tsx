import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
} from 'react-native';
import { X, ChevronRight, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    storageKey: string;
    onComplete?: () => void;
    onSkip?: () => void;
    visible: boolean;
}

export default function TutorialOverlay({
    steps,
    storageKey,
    onComplete,
    onSkip,
    visible,
}: TutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const currentStepData = steps[currentStep];

    useEffect(() => {
        if (visible && !isVisible) {
            setIsVisible(true);
            setCurrentStep(0);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const animateOut = useCallback((callback?: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsVisible(false);
            callback?.();
        });
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            Animated.sequence([
                Animated.timing(slideAnim, {
                    toValue: -20,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            Animated.sequence([
                Animated.timing(slideAnim, {
                    toValue: 20,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleComplete = useCallback(async () => {
        try {
            await AsyncStorage.setItem(storageKey, 'true');
        } catch (error) {
            console.warn('Failed to save tutorial completion:', error);
        }
        animateOut(onComplete);
    }, [storageKey, onComplete, animateOut]);

    const handleSkip = useCallback(async () => {
        try {
            await AsyncStorage.setItem(storageKey, 'true');
        } catch (error) {
            console.warn('Failed to save tutorial skip:', error);
        }
        animateOut(onSkip);
    }, [storageKey, onSkip, animateOut]);

    if (!isVisible || steps.length === 0) return null;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleSkip}
        >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {/* Dark overlay */}
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1}
                    onPress={() => {}}
                />

                {/* Tooltip Card */}
                <Animated.View 
                    style={[
                        styles.tooltip, 
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Skip button */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={22} color="#999" />
                    </TouchableOpacity>

                    {/* Step indicator */}
                    <Text style={styles.stepIndicator}>
                        {currentStep + 1} OF {steps.length}
                    </Text>

                    {/* Title */}
                    <Text style={styles.title}>{currentStepData?.title}</Text>

                    {/* Description */}
                    <Text style={styles.description}>{currentStepData?.description}</Text>

                    {/* Navigation buttons */}
                    <View style={styles.navigationContainer}>
                        {currentStep > 0 ? (
                            <TouchableOpacity
                                style={styles.navButton}
                                onPress={handlePrevious}
                            >
                                <ChevronLeft size={18} color="#00C853" />
                                <Text style={styles.navButtonText}>Previous</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.navButtonPlaceholder} />
                        )}

                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton]}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
                            </Text>
                            {currentStep < steps.length - 1 && (
                                <ChevronRight size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Step dots */}
                    <View style={styles.dotsContainer}>
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentStep && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// Helper to check if tutorial was completed
export async function isTutorialCompleted(storageKey: string): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(storageKey);
        return value === 'true';
    } catch {
        return false;
    }
}

// Helper to reset tutorial (for testing)
export async function resetTutorial(storageKey: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(storageKey);
    } catch (error) {
        console.warn('Failed to reset tutorial:', error);
    }
}

// Reset ALL tutorials
export async function resetAllTutorials(): Promise<void> {
    try {
        const keys = Object.values(TUTORIAL_STORAGE_KEYS);
        await AsyncStorage.multiRemove(keys);
        console.log('All tutorials reset successfully');
    } catch (error) {
        console.warn('Failed to reset all tutorials:', error);
    }
}

// Storage keys for tutorials
export const TUTORIAL_STORAGE_KEYS = {
    DONOR_HOME: 'kk_tutorial_donor_home',
    RECIPIENT_HOME: 'kk_tutorial_recipient_home',
    PROFILE: 'kk_tutorial_profile',
    DONATE_FLOW: 'kk_tutorial_donate_flow',
    BROWSE_FOOD: 'kk_tutorial_browse_food',
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    tooltip: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        paddingTop: 20,
        marginHorizontal: 24,
        maxWidth: 400,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    skipButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 10,
    },
    stepIndicator: {
        fontSize: 12,
        color: '#00C853',
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        paddingRight: 32,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        marginBottom: 24,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    navButtonPlaceholder: {
        width: 100,
    },
    navButtonText: {
        fontSize: 16,
        color: '#00C853',
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#00C853',
        borderRadius: 10,
        paddingHorizontal: 24,
    },
    nextButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
    },
    activeDot: {
        width: 24,
        backgroundColor: '#00C853',
    },
});
