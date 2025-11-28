import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Details() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = params.role || 'survivor';

    const [strokeDate, setStrokeDate] = useState('');
    const [impairments, setImpairments] = useState([]);

    const toggleImpairment = (impairment) => {
        if (impairments.includes(impairment)) {
            setImpairments(impairments.filter(i => i !== impairment));
        } else {
            setImpairments([...impairments, impairment]);
        }
    };

    const handleNext = () => {
        router.push({
            pathname: '/onboarding/goals',
            params: { role, strokeDate, impairments: JSON.stringify(impairments) }
        });
    };

    const impairmentOptions = [
        { id: 'motor', label: 'Movement / Mobility', icon: '🏃' },
        { id: 'speech', label: 'Speech / Communication', icon: '🗣️' },
        { id: 'cognitive', label: 'Memory / Thinking', icon: '🧠' },
        { id: 'vision', label: 'Vision', icon: '👁️' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Tell us a bit more</Text>
                <Text style={styles.subtitle}>
                    {role === 'survivor'
                        ? "When did you have your stroke?"
                        : "When did your loved one have their stroke?"}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={Colors.textSecondary}
                    value={strokeDate}
                    onChangeText={setStrokeDate}
                    keyboardType="numeric"
                />

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

                <View style={styles.buttonContainer}>
                    <PrimaryButton title="Next" onPress={handleNext} />
                </View>
            </ScrollView>
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
});
