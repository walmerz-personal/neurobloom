import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Welcome() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/onboarding/role');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🌸</Text>
                </View>
                <Text style={styles.title}>Welcome to{'\n'}NeuroBloom</Text>
                <Text style={styles.subtitle}>
                    Your companion for stroke recovery. We're here to guide you every step of the way.
                </Text>

                <View style={styles.buttonContainer}>
                    <PrimaryButton title="Get Started" onPress={handleGetStarted} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 24,
        width: 40,
        height: 40,
        justifyContent: 'center',
        zIndex: 1,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 64,
    },
    title: {
        ...Typography.title1,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 40,
    },
});
