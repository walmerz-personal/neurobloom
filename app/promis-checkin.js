import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PrimaryButton } from '../components/Button';
import { CustomSlider as Slider } from '../components/CustomSlider';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { PROMIS_GLOBAL10_ITEMS, scorePromis } from '../constants/promisGlobal10';

export default function PromisCheckIn() {
    const router = useRouter();
    const { user } = useAuth();
    const [responses, setResponses] = useState({ global10: 0 });
    const [saving, setSaving] = useState(false);

    const setResponse = (id, value) => setResponses((prev) => ({ ...prev, [id]: value }));

    const choiceItems = PROMIS_GLOBAL10_ITEMS.filter((i) => i.type === 'choice');
    const allAnswered = choiceItems.every((i) => responses[i.id] !== undefined);

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to save a check-in.');
            return;
        }
        if (!allAnswered) {
            Alert.alert('Almost there', 'Please answer every question before submitting.');
            return;
        }

        setSaving(true);
        try {
            const { physicalRaw, mentalRaw } = scorePromis(responses);
            const { error } = await SupabaseService.savePromisAssessment(user.id, {
                responses,
                physicalRaw,
                mentalRaw,
            });
            if (error) {
                Alert.alert('Error', 'Could not save your check-in. Please try again.');
            } else {
                Alert.alert('Thank you!', 'Your monthly health check-in has been saved.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (error) {
            console.error('Failed to save PROMIS assessment:', error);
            Alert.alert('Error', 'Could not save your check-in. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Monthly Check-In</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.intro}>
                    A few questions about your overall health recently. This helps you and your
                    care team see how you're doing over time. There are no right or wrong answers.
                </Text>

                {PROMIS_GLOBAL10_ITEMS.map((item, idx) => (
                    <View key={item.id} style={styles.card}>
                        <Text style={styles.question}>{idx + 1}. {item.question}</Text>

                        {item.type === 'choice' ? (
                            item.options.map((opt) => {
                                const selected = responses[item.id] === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.option, selected && styles.optionSelected]}
                                        onPress={() => setResponse(item.id, opt.value)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        accessibilityLabel={opt.label}
                                    >
                                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View>
                                <Text style={styles.painValue}>{responses[item.id] ?? 0} / 10</Text>
                                <Slider
                                    minimumValue={item.min}
                                    maximumValue={item.max}
                                    step={1}
                                    value={responses[item.id] ?? 0}
                                    onValueChange={(v) => setResponse(item.id, v)}
                                    accessibilityLabel="Pain, 0 to 10"
                                />
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderLabel}>{item.minLabel}</Text>
                                    <Text style={styles.sliderLabel}>{item.maxLabel}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.buttonContainer}>
                    <PrimaryButton
                        title={saving ? 'Saving...' : 'Submit Check-In'}
                        onPress={handleSubmit}
                        disabled={saving}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
    },
    backButton: { paddingVertical: 8, width: 60 },
    backText: { fontSize: 17, color: Colors.primary },
    content: { padding: 20, paddingBottom: 100 },
    intro: {
        fontFamily: 'SourceSans3_400Regular',
        fontSize: 16,
        lineHeight: 23,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
    },
    question: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 14,
        lineHeight: 23,
    },
    option: {
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        marginBottom: 8,
    },
    optionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.actionBlue,
    },
    optionText: { fontSize: 16, color: Colors.text },
    optionTextSelected: { fontWeight: '600', color: Colors.primaryDark },
    painValue: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 8,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderLabel: { fontSize: 14, color: Colors.textSecondary },
    buttonContainer: { marginTop: 8 },
});
