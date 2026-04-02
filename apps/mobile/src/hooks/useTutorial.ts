import { useState, useCallback, useEffect, useRef, createRef } from 'react';
import { View } from 'react-native';
import { TutorialStep, isTutorialCompleted } from '../components/TutorialOverlay';
import {
    Bell,
    BarChart3,
    CookingPot,
    ClipboardList,
    User,
    Repeat,
    BarChart,
    Settings,
    LogOut,
    Folder,
    Pencil,
    MapPin,
    Check,
    Plus,
    Camera,
    Search,
    Map,
    ShoppingCart,
    Package,
} from 'lucide-react-native';
import React from 'react';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;
const icon = (Comp: IconComponent) => React.createElement(Comp, { size: 24, color: '#1a1a1a' });
const sessionTutorialShownKeys = new Set<string>();

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
    refs: Record<string, React.RefObject<View | null>>;
    getCurrentTargetRef: () => React.RefObject<View | null> | undefined;
    currentStep: number;
}

export function useTutorial({ steps, storageKey, enabled = true, delayMs = 800 }: UseTutorialOptions): UseTutorialReturn {
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const hasChecked = useRef(false);
    const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Create refs for all possible targets
    const refs = useRef<Record<string, React.RefObject<View | null>>>({});
    
    // Initialize refs for each step's target
    useEffect(() => {
        const newRefs: Record<string, React.RefObject<View | null>> = {};
        steps.forEach(step => {
            if (step.targetRefKey && !refs.current[step.targetRefKey]) {
                newRefs[step.targetRefKey] = createRef<View>();
            }
        });
        refs.current = { ...refs.current, ...newRefs };
    }, [steps]);

    // Check if tutorial should be shown
    useEffect(() => {
        if (!enabled || hasChecked.current || showTutorial || sessionTutorialShownKeys.has(storageKey)) {
            console.log('[Tutorial]', storageKey, 'check skipped:', { enabled, hasChecked: hasChecked.current });
            return;
        }

        let cancelled = false;

        const checkTutorial = async () => {
            hasChecked.current = true;
            const completed = await isTutorialCompleted(storageKey);
            console.log('[Tutorial]', storageKey, 'completed:', completed);
            if (!completed && !cancelled) {
                // Delay to allow layout to complete
                showTimerRef.current = setTimeout(() => {
                    if (cancelled) return;
                    console.log('[Tutorial]', storageKey, 'showing tutorial');
                    sessionTutorialShownKeys.add(storageKey);
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
        sessionTutorialShownKeys.add(storageKey);
        setShowTutorial(false);
    }, [storageKey]);

    // Handle tutorial skip
    const handleSkip = useCallback(() => {
        sessionTutorialShownKeys.add(storageKey);
        setShowTutorial(false);
    }, [storageKey]);
    
    // Get ref for current step
    const getCurrentTargetRef = useCallback(() => {
        const currentStepData = steps[currentStep];
        if (currentStepData?.targetRefKey) {
            return refs.current[currentStepData.targetRefKey];
        }
        return undefined;
    }, [steps, currentStep]);

    return {
        showTutorial,
        steps,
        storageKey,
        handleComplete,
        handleSkip,
        refs: refs.current,
        getCurrentTargetRef,
        currentStep,
    };
}

// Tutorial step definitions for each screen
export const DONOR_HOME_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'welcome',
        title: 'Welcome Donor 🎉',
        description: 'Thank you for joining KusinaKonek! As a donor, you can share surplus food with those in need in your community.',
        // No target for welcome screen - will be centered
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: icon(Bell),
        description: 'The notification bell shows updates about your donations, messages from recipients, and important alerts.',
        targetRefKey: 'notificationBell',
    },
    {
        id: 'stats',
        title: 'Your Impact',
        icon: icon(BarChart3),
        description: 'Track your donations! See how many items you\'ve donated, available items waiting for pickup, and your community rating.',
        targetRefKey: 'statsContainer',
    },
    {
        id: 'donate',
        title: 'Donate Food',
        icon: icon(CookingPot),
        description: 'Ready to share? Use the "Donate Food" button to list surplus food. Add details like food type, quantity, and pickup location.',
        targetRefKey: 'donateButton',
    },
    {
        id: 'recent',
        title: 'Recent Activity',
        icon: icon(ClipboardList),
        description: 'View your recent donations here. Track status, chat with recipients, and see feedback on your contributions.',
        targetRefKey: 'recentDonations',
    },
];

export const RECIPIENT_HOME_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'welcome',
        title: 'Welcome Recipient 🎉',
        description: 'KusinaKonek connects you with generous donors sharing free food in Naga City. Let\'s show you around!',
        // No target for welcome screen
    },
    {
        id: 'notifications',
        title: 'Stay Updated',
        icon: icon(Bell),
        description: 'Check notifications for new food available nearby, messages from donors, and pickup reminders.',
        targetRefKey: 'notificationBell',
    },
    {
        id: 'stats',
        title: 'Food Available',
        icon: icon(CookingPot),
        description: 'See how much food is currently available in your area - total items, servings, and nearby locations.',
        targetRefKey: 'statsCard',
    },
    {
        id: 'browse',
        title: 'Browse Food',
        icon: icon(Search),
        description: 'Tap "Browse Food" to explore all available items. Search, filter by category, and add items to your cart.',
        targetRefKey: 'browseButton',
    },
    {
        id: 'recent',
        title: 'Your Requests',
        icon: icon(ClipboardList),
        description: 'Track food you\'ve claimed. View status updates, chat with donors, and confirm when you pick up items.',
        targetRefKey: 'recentFoods',
    },
];

export const PROFILE_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'profile',
        title: 'Your Profile',
        icon: icon(User),
        description: 'This is your profile page where you can view and manage your account information.',
        targetRefKey: 'profileHeader',
    },
    {
        id: 'role-switch',
        title: 'Switch Roles',
        icon: icon(Repeat),
        description: 'You can be both a donor AND recipient! Tap your role badge to switch between modes anytime.',
        targetRefKey: 'roleBadge',
    },
    {
        id: 'stats',
        title: 'Your Statistics',
        icon: icon(BarChart),
        description: 'View your activity stats - donations made or received, your community rating, and more.',
        targetRefKey: 'profileStats',
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: icon(Settings),
        description: 'Access app settings including dark mode, notification preferences, and account options.',
        targetRefKey: 'settingsButton',
    },
    {
        id: 'logout',
        title: 'Sign Out',
        icon: icon(LogOut),
        description: 'Use this button to log out of your account. Your data is safely saved for next time!',
        targetRefKey: 'logoutButton',
    },
];

export const DONATE_FLOW_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'intro',
        title: 'Donate Food',
        icon: icon(CookingPot),
        description: 'You\'re about to list food for donation. This helps reduce food waste and feeds those in need.',
    },
    {
        id: 'category',
        title: 'Choose Category',
        icon: icon(Folder),
        description: 'Select the type of food you\'re donating: Cooked Meals, Ingredients, Canned Goods, or Beverages.',
    },
    {
        id: 'details',
        title: 'Add Details',
        icon: icon(Pencil),
        description: 'Provide information about your donation: name, description, quantity, expiry time, and optional photos.',
    },
    {
        id: 'location',
        title: 'Set Pickup Location',
        icon: icon(MapPin),
        description: 'Choose where recipients can pick up the food. Use your current location or enter a custom address.',
    },
    {
        id: 'submit',
        title: 'Submit Donation',
        icon: icon(Check),
        description: 'Review your listing and submit. Recipients nearby will be notified about your generous donation!',
    },
];

export const DONATE_SELECT_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'select-food',
        title: 'Select Food',
        icon: icon(CookingPot),
        description: 'Pick a food item from the preset list or choose a custom item to start your donation.',
    },
    {
        id: 'custom-item',
        title: 'Custom Item',
        icon: icon(Plus),
        description: 'Tap Custom Item when your donation is not listed in the preset options.',
        targetRefKey: 'customButton',
    },
];

export const DONATE_DETAILS_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'food-details',
        title: 'Add Food Details',
        icon: icon(Pencil),
        description: 'Enter the food name, quantity, and availability so recipients know what they can claim.',
    },
    {
        id: 'food-photo',
        title: 'Take Food Photo',
        icon: icon(Camera),
        description: 'Capture a clear photo of the actual food. A photo is required before you can continue.',
        targetRefKey: 'cameraButton',
    },
];

export const DONATE_LOCATION_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'pickup-location',
        title: 'Set Pickup Location',
        icon: icon(MapPin),
        description: 'Choose a barangay hall or pin a custom location where recipients can pick up your donation.',
    },
    {
        id: 'submit-donation',
        title: 'Submit Donation',
        icon: icon(Check),
        description: 'Review your details and tap Confirm & Submit Donation to publish this listing.',
        targetRefKey: 'submitButton',
    },
];

export const BROWSE_FOOD_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'intro',
        title: 'Browse Available Food',
        icon: icon(CookingPot),
        description: 'Find free food shared by generous donors in your community. All items shown are currently available.',
    },
    {
        id: 'search',
        title: 'Search & Filter',
        icon: icon(Search),
        description: 'Use the search bar to find specific items. Filter by category, distance, or availability.',
    },
    {
        id: 'food-map',
        title: 'Food Map',
        icon: icon(Map),
        description: 'Tap the map button in the header to view food listings by location and quickly find nearby donations.',
        targetRefKey: 'mapButton',
    },
    {
        id: 'food-card',
        title: 'Food Items',
        icon: icon(CookingPot),
        description: 'Each card shows food details: name, donor, pickup location, and expiry time. Tap to see more.',
    },
    {
        id: 'add-to-cart',
        title: 'Add to Cart',
        icon: icon(ShoppingCart),
        description: 'Found something you need? Tap "Add to Cart" to claim it. You can add multiple items.',
        targetRefKey: 'addToCartButton',
    },
    {
        id: 'checkout',
        title: 'Checkout & Pickup',
        icon: icon(Package),
        description: 'Go to your cart to checkout. You\'ll receive pickup instructions and can chat with donors.',
        targetRefKey: 'checkoutButton',
    },
];
