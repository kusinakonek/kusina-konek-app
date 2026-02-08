import React from 'react';
import { View, Text, ScrollView, RefreshControl, ImageBackground, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, LogOut } from 'lucide-react-native';
import { styles } from './HomeCSS/styles';
import { useHomeLogic } from './HomeJS/useHomeLogic';
import { StatsCard } from './StatsCard';
import { RecentItemsList } from '../../../src/components/RecentItemsList';

export default function HomeView() {
    const {
        dashboardData,
        refreshing,
        onRefresh,
        handleLogout,
        getUserName,
        getRecentItems,
        router
    } = useHomeLogic();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Utensils size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.appName}>KusinaKonek</Text>
                        <Text style={styles.dashboardTitle}>RECIPIENT Dashboard</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />
                }
            >
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>Hi {getUserName()}!</Text>
                    <Text style={styles.greetingSubtext}>Discover bunch of different free <Text style={styles.ulamText}>ULAM</Text>.</Text>
                </View>

                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={styles.heroTitle}>Get free foods for your family</Text>
                            <Text style={styles.heroSubtitle}>Help families in Naga City with your extra food</Text>
                        </View>
                    </ImageBackground>
                </View>

                <View style={styles.statsContainer}>
                    <StatsCard stats={dashboardData?.stats} />
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/(tabs)/action')}>
                    <Image source={require('../../../assets/MyCart.png')} style={styles.mainButtonIcon} />
                    <Text style={styles.mainButtonText}>Browse Food</Text>
                </TouchableOpacity>

                <RecentItemsList
                    items={getRecentItems()}
                    role="RECIPIENT"
                    onSeeAll={() => { }}
                />

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
