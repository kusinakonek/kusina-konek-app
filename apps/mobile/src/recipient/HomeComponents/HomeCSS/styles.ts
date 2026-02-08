import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    logoIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#00C853',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    appName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    dashboardTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5'
    },
    scrollContent: {
        padding: 20
    },
    greetingContainer: {
        marginBottom: 20
    },
    greetingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4
    },
    greetingSubtext: {
        fontSize: 14,
        color: '#666'
    },
    ulamText: {
        color: '#00C853',
        fontWeight: '600'
    },
    heroContainer: {
        height: 180,
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        backgroundColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6
    },
    heroImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end'
    },
    heroOverlay: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.95)'
    },
    statsContainer: {
        marginBottom: 24
    },
    recipientStatsCard: {
        backgroundColor: '#E3F2FD',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#BBDEFB',
        shadowColor: '#2962FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    recipientStatsIconContainer: {
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recipientStatsContent: {
        flex: 1
    },
    recipientStatsValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4
    },
    recipientStatsLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10
    },
    recipientStatsMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    recipientStatsMetaText: {
        fontSize: 13,
        color: '#555',
        marginLeft: 2
    },
    recipientStatsMetaDot: {
        fontSize: 13,
        color: '#999',
        marginHorizontal: 4
    },
    mainButton: {
        flexDirection: 'row',
        backgroundColor: '#00C853',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8
    },
    mainButtonIcon: {
        width: 28,
        height: 28,
        tintColor: '#fff',
    },
});
