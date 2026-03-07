import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 16,
    },
    backButton: {
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    fixedHeader: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    logoImage: {
        width: 90,
        height: 90,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    roleHighlight: {
        color: '#00C853',
        fontWeight: '600',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#00C853',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        color: '#00C853',
        fontSize: 14,
        fontWeight: 'bold',
    },
    strengthContainer: {
        marginTop: -8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    strengthBarBg: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    strengthHints: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hintText: {
        fontSize: 11,
        color: '#999',
    },
    hintMet: {
        color: '#00C853',
        fontWeight: '600',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
        marginVertical: 4,
    },
    checkboxLabel: {
        fontSize: 14,
        marginLeft: 8,
    },
});
