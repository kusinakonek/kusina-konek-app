import { View, Text, StyleSheet } from 'react-native';

export default function Action() {
    return (
        <View style={styles.container}>
            <Text>Action Page (Donate/Browse)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
