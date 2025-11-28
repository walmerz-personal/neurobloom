import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function RoleSelection() {
    const router = useRouter();

    const handleRoleSelect = (role) => {
        // In a real app, we would save this to state/context
        console.log('Selected role:', role);
        router.push({ pathname: '/onboarding/details', params: { role } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Who is this account for?</Text>
                <Text style={styles.subtitle}>
                    This helps us personalize your experience.
                </Text>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleRoleSelect('survivor')}
                    >
                        <Text style={styles.optionIcon}>💪</Text>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>I am a Stroke Survivor</Text>
                            <Text style={styles.optionDescription}>
                                I want to work on my recovery.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleRoleSelect('caregiver')}
                    >
                        <Text style={styles.optionIcon}>❤️</Text>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>I am a Caregiver</Text>
                            <Text style={styles.optionDescription}>
                                I am helping a loved one recover.
                            </Text>
                        </View>
                    </TouchableOpacity>
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
    },
    title: {
        ...Typography.title2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        ...Typography.headline,
        marginBottom: 4,
    },
    optionDescription: {
        ...Typography.subhead,
        color: Colors.textSecondary,
    },
});
