import React, { createContext, useState, useContext, ReactNode } from 'react';

// Food item type for preset items
export interface FoodItem {
    id: string;
    name: string;
    description: string;
    image?: any; // require() for local images
}

// Form data structure
export interface DonationFormData {
    // Step 1: Food selection
    selectedFood: FoodItem | null;
    isCustomFood: boolean;

    // Step 2: Food details
    foodName: string;
    description: string;
    quantity: string;
    imageUri: string | null;

    // Step 3: Drop-off location
    locationType: 'barangay' | 'custom';
    selectedBarangay: BarangayHall | null;
    customLocation: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        barangay?: string;
    } | null;
}

export interface BarangayHall {
    id: string;
    name: string;
    address: string;
    hours: string;
    phone: string;
    latitude: number;
    longitude: number;
    description?: string;
}

// Preset barangay halls in Naga City
export const BARANGAY_HALLS: BarangayHall[] = [
    {
        id: '1',
        name: 'Barangay Abella Hall',
        address: 'Abella St, Barangay Abella, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6235,
        longitude: 123.1799,
        description: 'Situated near the commercial and residential district, with access via Abella St.',
    },
    {
        id: '2',
        name: 'Barangay Bagumbayan Norte Hall',
        address: '138 Bagumbayan Norte, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6362,
        longitude: 123.1848,
        description: 'Established in 1971, situated in the northernmost part of the city, bounded by the Municipality of Canaman. Primarily a residential area.',
    },
    {
        id: '3',
        name: 'Barangay Bagumbayan Sur Hall',
        address: 'P. Santos St, Barangay Bagumbayan Sur, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6325,
        longitude: 123.1866,
        description: 'Centrally located near the Integrated Northbound Jeepney Terminal site and major thoroughfares. Expanded to serve its high-density community.',
    },
    {
        id: '4',
        name: 'Barangay Balatas Hall',
        address: '12 Tindalo St, Barangay Balatas, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6304,
        longitude: 123.2010,
        description: 'Situated within a developing hub for modernized urban agriculture. Features a multipurpose building, training hall, and green house.',
    },
    {
        id: '5',
        name: 'Barangay Carolina Hall',
        address: 'Barangay Carolina, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6643,
        longitude: 123.2909,
        description: 'Located in one of the city\'s "upper barangays" at the foot of Mt. Isarog. Serves as a focal point for the upland community.',
    },
    {
        id: '6',
        name: 'Barangay Tabuco Hall',
        address: 'Biak na Bato St, cor Union St, Brgy Tabuco, Naga City',
        hours: '8:00 AM - 5:00 PM',
        phone: '09123456789',
        latitude: 13.6179,
        longitude: 123.1834,
        description: 'Situated in a high-traffic commercial area of CBD I, near the Naga River. A major gateway for commuters.',
    },
];

// Preset Filipino food items
export const PRESET_FOODS: FoodItem[] = [
    { id: '1', name: 'Chicken Adobo', description: 'Classic Filipino braised chicken' },
    { id: '2', name: 'Pancit Canton', description: 'Stir-fried noodles with vegetables' },
    { id: '3', name: 'Sinigang', description: 'Sour tamarind soup' },
    { id: '4', name: 'Lumpia Shanghai', description: 'Fried spring rolls' },
    { id: '5', name: 'Fried Rice', description: 'Garlic fried rice' },
    { id: '6', name: 'Menudo', description: 'Pork and liver stew' },
    { id: '7', name: 'Rice Meals', description: 'Complete rice meal with viand' },
    { id: '8', name: 'Bread & Pastries', description: 'Assorted bread and baked goods' },
];

interface DonationContextType {
    formData: DonationFormData;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    updateFormData: (data: Partial<DonationFormData>) => void;
    resetForm: () => void;
    canProceed: () => boolean;
}

const initialFormData: DonationFormData = {
    selectedFood: null,
    isCustomFood: false,
    foodName: '',
    description: '',
    quantity: '',
    imageUri: null,
    locationType: 'barangay',
    selectedBarangay: null,
    customLocation: null,
};

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export const DonationProvider = ({ children }: { children: ReactNode }) => {
    const [formData, setFormData] = useState<DonationFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);

    const updateFormData = (data: Partial<DonationFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setCurrentStep(1);
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return formData.selectedFood !== null || formData.isCustomFood;
            case 2:
                return formData.foodName.trim() !== '' && formData.quantity.trim() !== '';
            case 3:
                return (
                    (formData.locationType === 'barangay' && formData.selectedBarangay !== null) ||
                    (formData.locationType === 'custom' && formData.customLocation !== null)
                );
            default:
                return false;
        }
    };

    return (
        <DonationContext.Provider value={{
            formData,
            currentStep,
            setCurrentStep,
            updateFormData,
            resetForm,
            canProceed,
        }}>
            {children}
        </DonationContext.Provider>
    );
};

export const useDonation = () => {
    const context = useContext(DonationContext);
    if (!context) {
        throw new Error('useDonation must be used within a DonationProvider');
    }
    return context;
};
