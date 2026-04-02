import React from 'react';
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
    MessageCircle,
    MessageSquareText,
    Navigation,
    Truck,
} from 'lucide-react-native';
import { TutorialStepWithTarget } from './useTutorial';

export const DONOR_HOME_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'welcome',
        title: 'Welcome Donor 🎉',
        description: 'Thank you for joining KusinaKonek! As a donor, you can share surplus food with those in need in your community.',
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: <Bell size={24} color="#1a1a1a" />,
        description: 'The notification bell shows updates about your donations, messages from recipients, and important alerts.',
        targetRefKey: 'notificationBell',
    },
    {
        id: 'stats',
        title: 'Your Impact',
        icon: <BarChart3 size={24} color="#1a1a1a" />,
        description: 'Track your donations! See how many items you\'ve donated, available items waiting for pickup, and your community rating.',
        targetRefKey: 'statsContainer',
    },
    {
        id: 'donate',
        title: 'Donate Food',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'Ready to share? Use the "Donate Food" button to list surplus food. Add details like food type, quantity, and pickup location.',
        targetRefKey: 'donateButton',
    },
    {
        id: 'recent',
        title: 'Recent Activity',
        icon: <ClipboardList size={24} color="#1a1a1a" />,
        description: 'View your recent donations here. Track status, chat with recipients, and see feedback on your contributions.',
        targetRefKey: 'recentDonations',
    },
];

export const RECIPIENT_HOME_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'welcome',
        title: 'Welcome Recipient 🎉',
        description: 'KusinaKonek connects you with generous donors sharing free food in Naga City. Let\'s show you around!',
    },
    {
        id: 'notifications',
        title: 'Stay Updated',
        icon: <Bell size={24} color="#1a1a1a" />,
        description: 'Check notifications for new food available nearby, messages from donors, and pickup reminders.',
        targetRefKey: 'notificationBell',
    },
    {
        id: 'stats',
        title: 'Food Available',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'See how much food is currently available in your area - total items, servings, and nearby locations.',
        targetRefKey: 'statsCard',
    },
    {
        id: 'browse',
        title: 'Browse Food',
        icon: <Search size={24} color="#1a1a1a" />,
        description: 'Tap "Browse Food" to explore all available items. Search, filter by category, and add items to your cart.',
        targetRefKey: 'browseButton',
    },
    {
        id: 'recent',
        title: 'Your Requests',
        icon: <ClipboardList size={24} color="#1a1a1a" />,
        description: 'Track food you\'ve claimed. View status updates, chat with donors, and confirm when you pick up items.',
        targetRefKey: 'recentFoods',
    },
];

export const RECIPIENT_POST_CLAIM_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'message-donor',
        title: 'New Feature: Chat 💬',
        icon: <MessageSquareText size={24} color="#fff" />,
        description: 'Coordinate pickup details or say thank you! Tap the message icon on the food card below to start chatting with the donor.',
        targetRefKey: 'chatButton',
    },
    {
        id: 'track-status',
        title: 'Track Your Food',
        icon: <Truck size={24} color="#1a1a1a" />,
        description: 'Keep an eye on the status of your claim. You can mark when you\'re "On the Way" so the donor knows to prepare.',
        targetRefKey: 'statusBadge',
    },
    {
        id: 'navigate',
        title: 'Easy Navigation',
        icon: <Navigation size={24} color="#1a1a1a" />,
        description: 'Need directions? Use the navigation button to open your preferred map app and find the pickup spot easily.',
        targetRefKey: 'navigateButton',
    },
];

export const DONOR_POST_CLAIM_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'message-recipient',
        title: 'New Feature: Chat 💬',
        icon: <MessageSquareText size={24} color="#fff" />,
        description: 'A recipient has claimed your food! Tap the message icon on the donation card to coordinate the pickup time and location.',
        targetRefKey: 'chatButton',
    },
    {
        id: 'manage-pickup',
        title: 'Manage Pickup',
        icon: <Package size={24} color="#1a1a1a" />,
        description: 'Wait for the recipient to arrive. They\'ll notify you when they\'re on the way. Once picked up, you can confirm the completion.',
        targetRefKey: 'activeDonation',
    },
];

export const PROFILE_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'profile',
        title: 'Your Profile',
        icon: <User size={24} color="#1a1a1a" />,
        description: 'This is your profile page where you can view and manage your account information.',
        targetRefKey: 'profileHeader',
    },
    {
        id: 'role-switch',
        title: 'Switch Roles',
        icon: <Repeat size={24} color="#1a1a1a" />,
        description: 'You can be both a donor AND recipient! Tap your role badge to switch between modes anytime.',
        targetRefKey: 'roleBadge',
    },
    {
        id: 'stats',
        title: 'Your Statistics',
        icon: <BarChart size={24} color="#1a1a1a" />,
        description: 'View your activity stats - donations made or received, your community rating, and more.',
        targetRefKey: 'profileStats',
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: <Settings size={24} color="#1a1a1a" />,
        description: 'Access app settings including dark mode, notification preferences, and account options.',
        targetRefKey: 'settingsButton',
    },
    {
        id: 'logout',
        title: 'Sign Out',
        icon: <LogOut size={24} color="#1a1a1a" />,
        description: 'Use this button to log out of your account. Your data is safely saved for next time!',
        targetRefKey: 'logoutButton',
    },
];

export const BROWSE_FOOD_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'intro',
        title: 'Browse Available Food',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'Find free food shared by generous donors in your community. All items shown are currently available.',
    },
    {
        id: 'search',
        title: 'Search & Filter',
        icon: <Search size={24} color="#1a1a1a" />,
        description: 'Use the search bar to find specific items. Filter by category, distance, or availability.',
    },
    {
        id: 'food-map',
        title: 'Food Map',
        icon: <Map size={24} color="#1a1a1a" />,
        description: 'Tap the map button in the header to view food listings by location and quickly find nearby donations.',
        targetRefKey: 'mapButton',
    },
    {
        id: 'food-card',
        title: 'Food Items',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'Each card shows food details: name, donor, pickup location, and expiry time. Tap to see more.',
    },
    {
        id: 'add-to-cart',
        title: 'Add to Cart',
        icon: <ShoppingCart size={24} color="#1a1a1a" />,
        description: 'Found something you need? Tap "Add to Cart" to claim it. You can add multiple items.',
        targetRefKey: 'addToCartButton',
    },
    {
        id: 'checkout',
        title: 'Checkout & Pickup',
        icon: <Package size={24} color="#1a1a1a" />,
        description: 'Go to your cart to checkout. You\'ll receive pickup instructions and can chat with donors.',
        targetRefKey: 'checkoutButton',
    },
];

export const DONATE_FLOW_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'intro',
        title: 'Donate Food',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'You\'re about to list food for donation. This helps reduce food waste and feeds those in need.',
    },
    {
        id: 'category',
        title: 'Choose Category',
        icon: <Folder size={24} color="#1a1a1a" />,
        description: 'Select the type of food you\'re donating: Cooked Meals, Ingredients, Canned Goods, or Beverages.',
    },
    {
        id: 'details',
        title: 'Add Details',
        icon: <Pencil size={24} color="#1a1a1a" />,
        description: 'Provide information about your donation: name, description, quantity, expiry time, and optional photos.',
    },
    {
        id: 'location',
        title: 'Set Pickup Location',
        icon: <MapPin size={24} color="#1a1a1a" />,
        description: 'Choose where recipients can pick up the food. Use your current location or enter a custom address.',
    },
    {
        id: 'submit',
        title: 'Submit Donation',
        icon: <Check size={24} color="#1a1a1a" />,
        description: 'Review your listing and submit. Recipients nearby will be notified about your generous donation!',
    },
];

export const DONATE_SELECT_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'select-food',
        title: 'Select Food',
        icon: <CookingPot size={24} color="#1a1a1a" />,
        description: 'Pick a food item from the preset list or choose a custom item to start your donation.',
    },
    {
        id: 'custom-item',
        title: 'Custom Item',
        icon: <Plus size={24} color="#1a1a1a" />,
        description: 'Tap Custom Item when your donation is not listed in the preset options.',
        targetRefKey: 'customButton',
    },
];

export const DONATE_DETAILS_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'food-details',
        title: 'Add Food Details',
        icon: <Pencil size={24} color="#1a1a1a" />,
        description: 'Enter the food name, quantity, and availability so recipients know what they can claim.',
    },
    {
        id: 'food-photo',
        title: 'Take Food Photo',
        icon: <Camera size={24} color="#1a1a1a" />,
        description: 'Capture a clear photo of the actual food. A photo is required before you can continue.',
        targetRefKey: 'cameraButton',
    },
];

export const DONATE_LOCATION_STEPS: TutorialStepWithTarget[] = [
    {
        id: 'pickup-location',
        title: 'Set Pickup Location',
        icon: <MapPin size={24} color="#1a1a1a" />,
        description: 'Choose a barangay hall or pin a custom location where recipients can pick up your donation.',
    },
    {
        id: 'submit-donation',
        title: 'Submit Donation',
        icon: <Check size={24} color="#1a1a1a" />,
        description: 'Review your details and tap Confirm & Submit Donation to publish this listing.',
        targetRefKey: 'submitButton',
    },
];
