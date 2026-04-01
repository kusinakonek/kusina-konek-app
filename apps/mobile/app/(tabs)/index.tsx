import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorHome from '../../src/donor/Home';
import RecipientHome from '../../src/recipient/Home';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function Home() {
    const { role, isLoggingOut } = useAuth();

    // Prevent rendering children during logout to avoid flashes
    if (isLoggingOut) return null;

    return role === 'DONOR' ? <DonorHome /> : <RecipientHome />;
}
