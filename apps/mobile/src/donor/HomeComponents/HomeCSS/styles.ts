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
});
