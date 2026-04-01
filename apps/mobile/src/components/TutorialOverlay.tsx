import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { X, ChevronRight, ChevronLeft, Icon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export interface TutorialStepWithTarget extends TutorialStep {
    targetRefKey?: string;
}

interface TutorialOverlayProps {
    steps: TutorialStepWithTarget[];
    storageKey: string;
    onComplete?: () => void;
    onSkip?: () => void;
    visible: boolean;
    targetRefs?: Record<string, React.RefObject<View>>;
    onStepChange?: (step: number) => void;
}

function extractPreviewIcon(title: string): string {
    for (const char of Array.from(title)) {
        if ((char.codePointAt(0) ?? 0) > 127) {
            return char;
        }
    }
    return '•';
}

export default function TutorialOverlay({
    steps,
    storageKey,
    onComplete,
    onSkip,
    visible,
    onStepChange,
}: TutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const currentStepData = steps[currentStep];
    const currentTargetRefKey = currentStepData?.targetRefKey;

    useEffect(() => {
        if (visible && !isVisible) {
            console.log('[TutorialOverlay]', storageKey, 'animating in');
            setIsVisible(true);
            setCurrentStep(0);
            fadeAnim.setValue(0);
            slideAnim.setValue(50);

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
        } else if (!visible && isVisible) {
            // Parent forced visible to false
            setIsVisible(false);
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible, isVisible, storageKey]);

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
    }, [fadeAnim, slideAnim]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            // Animate step change
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
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            onStepChange?.(nextStep);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length, onStepChange]);

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
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            onStepChange?.(prevStep);
        }
    }, [currentStep, onStepChange]);

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

    const rawTitle = currentStepData?.title || '';
    const previewIcon = extractPreviewIcon(rawTitle);
    const previewTitle = rawTitle.replace(previewIcon, '').replace(/\s+/g, ' ').trim() || rawTitle;
    const isButtonLikeStep = (currentTargetRefKey || '').toLowerCase().includes('button');
    const isWelcomeStep = (currentStepData?.id || '').toLowerCase().includes('welcome');
    const isSmallPhone = screenWidth < 360 || screenHeight < 700;
    const isLargePhone = screenWidth >= 430 || screenHeight >= 900;
    const isShortPhone = screenHeight < 700;

    const horizontalInset = isSmallPhone ? 24 : isLargePhone ? 16 : 20;
    const availableWidth = screenWidth - horizontalInset * 2;
    const widthRatio = isSmallPhone ? 0.9 : isLargePhone ? 0.98 : 0.94;
    const cardWidth = Math.max(260, Math.min(availableWidth * widthRatio, isLargePhone ? 440 : 390));

    const maxHeightRatio = isSmallPhone ? 0.62 : isLargePhone ? 0.78 : 0.7;
    const minCardHeight = isSmallPhone ? 280 : 320;
    const verticalPadding = isSmallPhone ? 56 : 40;
    const cardMaxHeight = Math.max(
        minCardHeight,
        Math.min(screenHeight * maxHeightRatio, screenHeight - verticalPadding),
    );

    const cardPadding = isSmallPhone ? 14 : isLargePhone ? 24 : 20;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleSkip}
        >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => {}}
                />

                <Animated.View
                    style={[
                        styles.tooltip,
                        {
                            width: cardWidth,
                            maxHeight: cardMaxHeight,
                            marginHorizontal: horizontalInset,
                            padding: cardPadding,
                            paddingTop: cardPadding - 2,
                        },
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.skipButton,
                            {
                                top: Math.max(10, cardPadding - 4),
                                right: Math.max(10, cardPadding - 4),
                            },
                        ]}
                        onPress={handleSkip}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={22} color="#999" />
                    </TouchableOpacity>

                    <ScrollView
                        style={styles.tooltipScroll}
                        contentContainerStyle={[
                            styles.tooltipScrollContent,
                            isShortPhone && styles.tooltipScrollContentCompact,
                        ]}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                    >

                        <Text style={[styles.stepIndicator, isSmallPhone && styles.stepIndicatorCompact]}>
                            {currentStep + 1} OF {steps.length}
                        </Text>

                        <View style={[styles.previewContainer, isSmallPhone && styles.previewContainerCompact]}>
                            {isButtonLikeStep ? (
                                <View style={[styles.previewButton, isSmallPhone && styles.previewButtonCompact]}>
                                    <View style={[styles.previewButtonIconWrap, isSmallPhone && styles.previewButtonIconWrapCompact]}>
                                        {currentStepData.icon || <Text style={[styles.previewButtonIcon, isSmallPhone && styles.previewButtonIconCompact]}>{previewIcon}</Text>}
                                    </View>
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={[styles.previewButtonText, isSmallPhone && styles.previewButtonTextCompact]}
                                    >
                                        {previewTitle}
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.previewHeader, isSmallPhone && styles.previewHeaderCompact]}>
                                    <View style={[styles.previewIconWrap, isSmallPhone && styles.previewIconWrapCompact]}>
                                        {currentStepData.icon || <Text style={[styles.previewIcon, isSmallPhone && styles.previewIconCompact]}>{previewIcon}</Text>}
                                    </View>
                                    <Text
                                        numberOfLines={isWelcomeStep ? 1 : 2}
                                        ellipsizeMode="tail"
                                        style={[
                                            styles.previewTitle,
                                            isSmallPhone && styles.previewTitleCompact,
                                        ]}
                                    >
                                        {previewTitle}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={[
                            styles.description,
                            (isSmallPhone || isShortPhone) && styles.descriptionCompact,
                        ]}>
                            {currentStepData?.description}
                        </Text>

                        <View style={[
                            styles.navigationContainer,
                            (isSmallPhone || isShortPhone) && styles.navigationContainerCompact,
                        ]}>
                            {currentStep > 0 ? (
                                <TouchableOpacity
                                    style={[styles.navButton, (isSmallPhone || isShortPhone) && styles.navButtonCompact]}
                                    onPress={handlePrevious}
                                >
                                    <ChevronLeft size={isSmallPhone ? 16 : 18} color="#00C853" />
                                    <Text style={[styles.navButtonText, (isSmallPhone || isShortPhone) && styles.navButtonTextCompact]}>Previous</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.navButtonPlaceholder, (isSmallPhone || isShortPhone) && styles.navButtonPlaceholderCompact]} />
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    (isSmallPhone || isShortPhone) && styles.navButtonCompact,
                                    currentStep === steps.length - 1 && styles.completeButton,
                                    (isSmallPhone || isShortPhone) && currentStep === steps.length - 1 && styles.completeButtonCompact,
                                ]}
                                onPress={currentStep === steps.length - 1 ? handleComplete : handleNext}
                            >
                                <Text style={[
                                    styles.navButtonText,
                                    (isSmallPhone || isShortPhone) && styles.navButtonTextCompact,
                                    currentStep === steps.length - 1 && styles.completeButtonText,
                                ]}>
                                    {currentStep === steps.length - 1 ? 'Done' : 'Next'}
                                </Text>
                                {currentStep < steps.length - 1 && (
                                    <ChevronRight size={isSmallPhone ? 16 : 18} color="#00C853" />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.dotsContainer, isSmallPhone && styles.dotsContainerCompact]}>
                            {steps.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        isSmallPhone && styles.dotCompact,
                                        index === currentStep && styles.dotActive,
                                        isSmallPhone && index === currentStep && styles.dotActiveCompact,
                                    ]}
                                />
                            ))}
                        </View>
                    </ScrollView>
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
    DONATE_SELECT: 'kk_tutorial_donate_select',
    DONATE_DETAILS: 'kk_tutorial_donate_details',
    DONATE_LOCATION: 'kk_tutorial_donate_location',
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
        maxWidth: 460,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    tooltipScroll: {
        width: '100%',
    },
    tooltipScrollContent: {
        paddingTop: 2,
    },
    tooltipScrollContentCompact: {
        paddingTop: 0,
        paddingBottom: 4,
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
    stepIndicatorCompact: {
        fontSize: 11,
        marginBottom: 10,
    },
    previewContainer: {
        marginBottom: 16,
    },
    previewContainerCompact: {
        marginBottom: 12,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3FBF6',
        borderWidth: 1,
        borderColor: '#D8F2E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    previewHeaderCompact: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    previewIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F9EF',
        flexShrink: 0,
        marginRight: 12,
    },
    previewIconWrapCompact: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    previewIcon: {
        fontSize: 20,
    },
    previewIconCompact: {
        fontSize: 16,
    },
    previewTitle: {
        flexGrow: 0,
        flexShrink: 1,
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    previewTitleCompact: {
        fontSize: 18,
        lineHeight: 22,
        textAlign: 'center',
    },
    previewButton: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00C853',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    previewButtonCompact: {
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    previewButtonIconWrap: {
        width: 'auto',
        height: 'auto',
        borderRadius: 0,
        backgroundColor: 'transparent',
        marginRight: 8,
    },
    previewButtonIconWrapCompact: {},
    previewButtonIcon: {
        fontSize: 18,
        color: '#fff',
    },
    previewButtonIconCompact: {
        fontSize: 16,
    },
    previewButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    previewButtonTextCompact: {
        fontSize: 15,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    descriptionCompact: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    navigationContainerCompact: {
        paddingTop: 10,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    navButtonCompact: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    navButtonPlaceholder: {
        width: 90,
    },
    navButtonPlaceholderCompact: {
        width: 75,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00C853',
        marginLeft: 4,
        marginRight: 4,
    },
    navButtonTextCompact: {
        fontSize: 13,
    },
    completeButton: {
        backgroundColor: '#00C853',
        borderRadius: 10,
        paddingHorizontal: 24,
    },
    completeButtonCompact: {},
    completeButtonText: {
        color: '#fff',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    dotsContainerCompact: {
        marginTop: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
        marginHorizontal: 4,
    },
    dotCompact: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginHorizontal: 3,
    },
    dotActive: {
        backgroundColor: '#00C853',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotActiveCompact: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },
});
