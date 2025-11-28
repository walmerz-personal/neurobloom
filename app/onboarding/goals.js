import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Goals() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = params.role || 'survivor';

    const [recoveryPhase, setRecoveryPhase] = useState('');
    const [goals, setGoals] = useState('');

    const handleComplete = () => {
        // Here we would save all collected data to the backend/storage
        console.log('Onboarding Complete:', {
            ...params,
            recoveryPhase,
            goals
        });
        router.push('/onboarding/completion');
    };

    const phases = [
        { id: 'acute', label: 'Just happened (0-4 weeks)' },
        { id: 'subacute', label: 'Early recovery (4 weeks - 6 months)' },
        { id: 'chronic', label: 'Long-term (6+ months)' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>Almost done!</Text>
                    <Text style={styles.subtitle}>
                        Where are you in the journey?
                    </Text>

                    <View style={styles.phaseContainer}>
                        {phases.map((phase) => (
                            <TouchableOpacity
                                key={phase.id}
                                style={[
                                    styles.phaseButton,
                                    recoveryPhase === phase.id && styles.phaseButtonSelected
                                ]}
                                onPress={() => setRecoveryPhase(phase.id)}
                            >
                                <Text style={[
                                    styles.phaseText,
                                    recoveryPhase === phase.id && styles.phaseTextSelected
                                ]}>
                                    {phase.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.subtitle, { marginTop: 24 }]}>
                        What are your main goals?
                    </Text>
                    <Text style={styles.helperText}>
                        E.g., "Walk without a cane", "Speak clearly again", "Return to work"
                    </Text>

                    <TextInput
                        style={styles.textArea}
                        placeholder="Type your goals here..."
                        placeholderTextColor={Colors.textSecondary}
                        value={goals}
                        onChangeText={setGoals}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={styles.buttonContainer}>
                        <PrimaryButton title="Complete Setup" onPress={handleComplete} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        ...Typography.title2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    helperText: {
        ...Typography.caption1,
        marginBottom: 12,
    },
    phaseContainer: {
        gap: 12,
    },
    phaseButton: {
        padding: 16,
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    phaseButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.actionBlue,
    },
    phaseText: {
        ...Typography.body,
        textAlign: 'center',
    },
    phaseTextSelected: {
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    textArea: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: Colors.text,
        minHeight: 120,
    },
    buttonContainer: {
        marginTop: 32,
        marginBottom: 40,
    },
});
