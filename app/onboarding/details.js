import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Details() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = params.role || 'survivor';
    const name = params.name || '';

    const [strokeDate, setStrokeDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [impairments, setImpairments] = useState([]);
    const [medicalStaffRole, setMedicalStaffRole] = useState('');
    const [otherRole, setOtherRole] = useState('');

    const toggleImpairment = (impairment) => {
        if (impairments.includes(impairment)) {
            setImpairments(impairments.filter(i => i !== impairment));
        } else {
            setImpairments([...impairments, impairment]);
        }
    };

    const handleNext = () => {
        if (role === 'medical_staff') {
            // For medical_staff, go directly to goals (which will skip to signup)
            const finalRole = medicalStaffRole === 'other' ? otherRole : medicalStaffRole;
            router.push({
                pathname: '/onboarding/goals',
                params: { 
                    role, 
                    name, 
                    medicalStaffRole: finalRole,
                    strokeDate: '', 
                    impairments: JSON.stringify([]) 
                }
            });
        } else {
            router.push({
                pathname: '/onboarding/goals',
                params: { role, name, strokeDate, impairments: JSON.stringify(impairments) }
            });
        }
    };

    const handleSkip = () => {
        if (role === 'medical_staff') {
            // For medical_staff, still need to collect role, so don't skip
            return;
        }
        router.push({
            pathname: '/onboarding/goals',
            params: { role, name, strokeDate: '', impairments: JSON.stringify([]) }
        });
    };

    const impairmentOptions = [
        { id: 'motor', label: 'Movement / Mobility', icon: '🏃' },
        { id: 'speech', label: 'Speech / Communication', icon: '🗣️' },
        { id: 'cognitive', label: 'Memory / Thinking', icon: '🧠' },
        { id: 'vision', label: 'Vision', icon: '👁️' },
    ];

    const medicalStaffRoleOptions = [
        { id: 'occupational_therapist', label: 'Occupational Therapist (OT)' },
        { id: 'speech_language_pathologist', label: 'Speech Language Pathologist (SLP)' },
        { id: 'physical_therapist', label: 'Physical Therapist (PT)' },
        { id: 'psychologist', label: 'Psychologist' },
        { id: 'psychiatrist', label: 'Psychiatrist' },
        { id: 'nurse', label: 'Nurse' },
        { id: 'other', label: 'Other' },
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
                <Text style={styles.title}>Tell us a bit more</Text>
                
                {role === 'medical_staff' ? (
                    <>
                        <Text style={styles.subtitle}>
                            What is your role?
                        </Text>
                        <View style={styles.optionsContainer}>
                            {medicalStaffRoleOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        medicalStaffRole === option.id && styles.optionCardSelected
                                    ]}
                                    onPress={() => setMedicalStaffRole(option.id)}
                                >
                                    <Text style={[
                                        styles.optionLabel,
                                        medicalStaffRole === option.id && styles.optionLabelSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {medicalStaffRole === option.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                        {medicalStaffRole === 'other' && (
                            <View style={styles.otherInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Please specify your role"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={otherRole}
                                    onChangeText={setOtherRole}
                                    autoCapitalize="words"
                                    returnKeyType="done"
                                    textContentType="name"
                                    accessibilityLabel="Your role"
                                />
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            {role === 'survivor'
                                ? "When did you have your stroke?"
                                : "When did your loved one have their stroke?"}
                        </Text>

                        <TouchableOpacity
                            style={styles.dateInputContainer}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={strokeDate ? styles.dateText : styles.datePlaceholder}>
                                {strokeDate || 'Select date'}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={strokeDate ? new Date(strokeDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate && event.type !== 'dismissed') {
                                        const formattedDate = selectedDate.toISOString().split('T')[0];
                                        setStrokeDate(formattedDate);
                                    }
                                }}
                            />
                        )}
                        {Platform.OS === 'ios' && showDatePicker && (
                            <TouchableOpacity
                                style={styles.datePickerDone}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.datePickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={[styles.subtitle, { marginTop: 24 }]}>
                            {role === 'survivor'
                                ? "What are your main challenges?"
                                : "What are their main challenges?"}
                        </Text>

                        <View style={styles.optionsContainer}>
                            {impairmentOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        impairments.includes(option.id) && styles.optionCardSelected
                                    ]}
                                    onPress={() => toggleImpairment(option.id)}
                                >
                                    <Text style={styles.optionIcon}>{option.icon}</Text>
                                    <Text style={[
                                        styles.optionLabel,
                                        impairments.includes(option.id) && styles.optionLabelSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {impairments.includes(option.id) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <View style={styles.buttonContainer}>
                    <PrimaryButton 
                        title="Next" 
                        onPress={handleNext}
                        disabled={role === 'medical_staff' && (!medicalStaffRole || (medicalStaffRole === 'other' && !otherRole.trim()))}
                    />
                    {role !== 'medical_staff' && (
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
                    )}
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
        paddingBottom: 40,
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
        marginBottom: 16,
    },
    input: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: Colors.text,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 32,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.actionBlue,
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    optionLabel: {
        ...Typography.body,
        flex: 1,
    },
    optionLabelSelected: {
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    checkmark: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        marginTop: 24,
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
    dateInputContainer: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
    },
    dateText: {
        fontSize: 17,
        color: Colors.text,
    },
    datePlaceholder: {
        fontSize: 17,
        color: Colors.textSecondary,
    },
    datePickerDone: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    datePickerDoneText: {
        fontWeight: '600',
        fontSize: 16,
        color: Colors.primary,
    },
    otherInputContainer: {
        marginTop: 12,
        marginBottom: 32,
    },
});
