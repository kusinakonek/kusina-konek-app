import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorHome from '../../src/donor/Home';
import RecipientHome from '../../src/recipient/Home';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function Home() {
    const { role, isLoading, user } = useAuth();

    if (isLoading || !user) {
        return <LoadingScreen message="Preparing your dashboard..." />;
    }

    return role === 'DONOR' ? <DonorHome /> : <RecipientHome />;
}
