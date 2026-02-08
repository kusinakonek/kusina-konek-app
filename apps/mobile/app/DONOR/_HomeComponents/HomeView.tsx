import React from 'react';
import { View, Text, ScrollView, RefreshControl, ImageBackground, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, LogOut, Plus } from 'lucide-react-native';
import { styles } from './HomeCSS/styles';
import { useHomeLogic } from './HomeJS/useHomeLogic';
import { DashboardStats } from '../../../src/components/DashboardStats';
import { RecentItemsList } from '../../../src/components/RecentItemsList';

export default function HomeView() {
    const {
        refreshing,
        onRefresh,
        handleLogout,
        getStats,
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
                        <Text style={styles.dashboardTitle}>Donor Dashboard</Text>
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
                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={styles.heroTitle}>Share Your Blessings Today</Text>
                            <Text style={styles.heroSubtitle}>Help families in Naga City with your extra food</Text>
                        </View>
                    </ImageBackground>
                </View>

                <View style={styles.statsContainer}>
                    <DashboardStats stats={getStats()} />
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/(tabs)/action')}>
                    <Plus size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>Donate Food</Text>
                </TouchableOpacity>

                <RecentItemsList
                    items={getRecentItems()}
                    role="DONOR"
                    onSeeAll={() => { }}
                />

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
