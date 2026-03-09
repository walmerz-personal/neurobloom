import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Goals() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = params.role || 'survivor';
    const name = params.name || '';

    const [recoveryPhase, setRecoveryPhase] = useState('');
    const [goals, setGoals] = useState('');

    // For medical_staff, skip directly to signup
    useEffect(() => {
        if (role === 'medical_staff') {
            const medicalStaffRole = params.medicalStaffRole || '';
            const impairments = params.impairments ? JSON.parse(params.impairments) : [];
            router.push({
                pathname: '/auth/signup',
                params: {
                    name,
                    role,
                    medicalStaffRole,
                    strokeDate: '',
                    impairments: JSON.stringify([]),
                    affectedSide: '',
                    impairmentSeverity: '',
                    recoveryPhase: '',
                    goals: ''
                }
            });
        }
    }, [role]);

    const handleComplete = () => {
        // Navigate to account creation with all onboarding data
        const impairments = params.impairments ? JSON.parse(params.impairments) : [];

        router.push({
            pathname: '/auth/signup',
            params: {
                name,
                role,
                strokeDate: params.strokeDate || '',
                impairments: JSON.stringify(impairments),
                affectedSide: params.affectedSide || '',
                impairmentSeverity: params.impairmentSeverity || '',
                recoveryPhase,
                goals
            }
        });
    };

    const handleSkip = () => {
        // Still go to signup, just with empty recovery phase and goals
        const impairments = params.impairments ? JSON.parse(params.impairments) : [];

        router.push({
            pathname: '/auth/signup',
            params: {
                name,
                role,
                strokeDate: params.strokeDate || '',
                impairments: JSON.stringify(impairments),
                affectedSide: params.affectedSide || '',
                impairmentSeverity: params.impairmentSeverity || '',
                recoveryPhase: '',
                goals: ''
            }
        });
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
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    {role !== 'medical_staff' && (
                        <>
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
                                returnKeyType="done"
                                textContentType="none"
                                accessibilityLabel="Recovery goals"
                            />
                        </>
                    )}

                    <View style={styles.buttonContainer}>
                        <PrimaryButton title="Complete Setup" onPress={handleComplete} />
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
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
        paddingBottom: 150,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
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
    skipButton: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    skipButtonText: {
        fontSize: 17,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
