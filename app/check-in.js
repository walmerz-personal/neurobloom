import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PrimaryButton } from '../components/Button';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useState, useEffect } from 'react';
import { CustomSlider as Slider } from '../components/CustomSlider';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { getRecommendedExercises, getDailyPlan } from '../services/RecommendationService';
import { EXERCISES_DATA } from './(tabs)/exercises';

// Fallback shown only when the user has no plan yet (no profile / no assignments).
// IDs match real exercises so completions are meaningful even in this case.
const DEFAULT_EXERCISES = [
    { id: 'a1', label: 'Shoulder Shrugs', emoji: '💪' },
    { id: 'l1', label: 'Ankle Pumps', emoji: '🦶' },
    { id: 'c1', label: 'Trunk Rotations', emoji: '🔄' },
    { id: 'h1', label: 'Fist Clenches', emoji: '✊' },
    { id: 'l2', label: 'Seated Marching', emoji: '🚶' },
];

const CATEGORY_EMOJI = {
    Arms: '💪',
    Legs: '🦵',
    Core: '🧘',
    Hands: '✋',
    'Head & Neck': '🧠',
};

// Build the day's check-in list from the user's real plan: medical-staff
// assignments first, then AI recommendations. Deduped, real exercise IDs.
function buildPlanExercises(profile, assignments) {
    const items = [];
    const seen = new Set();
    const addById = (id) => {
        if (!id || seen.has(id)) return;
        const ex = EXERCISES_DATA.find((e) => e.id === id);
        if (!ex) return;
        seen.add(id);
        items.push({ id, label: ex.title, emoji: CATEGORY_EMOJI[ex.category] || '✅' });
    };

    (assignments || []).forEach((a) => addById(a.exercise_id));

    const { recommended } = getRecommendedExercises(profile, EXERCISES_DATA);
    getDailyPlan(recommended).forEach((ex) => addById(ex.id));

    return items;
}

export default function CheckIn() {
    const router = useRouter();
    const { user } = useAuth();
    const [mood, setMood] = useState('😐');
    const [pain, setPain] = useState(3);
    const [energy, setEnergy] = useState(6);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [exerciseList, setExerciseList] = useState(DEFAULT_EXERCISES);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Load today's personalized plan (staff assignments + AI recommendations)
    // so the check-in reflects what the user was actually prescribed.
    // Falls back to DEFAULT_EXERCISES when there's no plan or on error.
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        (async () => {
            try {
                const [profileRes, assignedRes] = await Promise.all([
                    SupabaseService.getUserProfile(user.id),
                    SupabaseService.getAssignedExercises(user.id, 'assigned'),
                ]);
                if (cancelled) return;

                const planItems = buildPlanExercises(profileRes?.profile, assignedRes?.data);
                if (planItems.length > 0) setExerciseList(planItems);
            } catch (error) {
                console.error('Failed to load daily plan for check-in:', error);
                // Keep DEFAULT_EXERCISES
            }
        })();

        return () => { cancelled = true; };
    }, [user]);

    const toggleExercise = (exerciseId) => {
        if (completedExercises.includes(exerciseId)) {
            setCompletedExercises(completedExercises.filter(id => id !== exerciseId));
        } else {
            setCompletedExercises([...completedExercises, exerciseId]);
        }
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to save check-ins');
            return;
        }

        setSaving(true);

        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // 1. Fetch existing log to calculate points
            const { log: existingLog } = await SupabaseService.getTodayLog(user.id);
            const previouslyCompleted = existingLog?.exercises_completed || [];

            // 2. Save the new log
            const { data, error } = await SupabaseService.saveDailyLog(user.id, {
                logDate: today,
                mood,
                painLevel: pain,
                energyLevel: energy,
                exercisesCompleted: completedExercises,
                notes,
            });

            if (error) {
                console.error('❌ Save error:', error);
                Alert.alert('Error', 'Failed to save check-in. Please try again.');
            } else {
                console.log('✅ Check-in saved:', data);

                // 3. Calculate and award points for NEW exercises
                const newExercises = completedExercises.filter(id => !previouslyCompleted.includes(id));
                let successMessage = 'Check-in saved!';

                if (newExercises.length > 0) {
                    const pointsEarned = newExercises.length * 10;
                    const { points } = await SupabaseService.getUserPoints(user.id);
                    await SupabaseService.updateUserPoints(user.id, points + pointsEarned);
                    successMessage = `Check-in saved! You earned ${pointsEarned} points! 🌱`;
                }

                Alert.alert('Success', successMessage, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            Alert.alert('Error', 'Failed to save check-in. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Check-In</Text>
                <View style={{ width: 60 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How's your mood today?</Text>
                    <View style={styles.emojiScale}>
                        {['😄', '🙂', '😐', '😞', '😢'].map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[styles.emojiOption, mood === emoji && styles.emojiSelected]}
                                onPress={() => setMood(emoji)}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Exercises Completed Today</Text>
                    <Text style={styles.sectionSubtitle}>Check off what you've done 🎯</Text>
                    <View style={styles.exerciseList}>
                        {exerciseList.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[
                                    styles.exerciseOption,
                                    completedExercises.includes(exercise.id) && styles.exerciseCompleted
                                ]}
                                onPress={() => toggleExercise(exercise.id)}
                            >
                                <View style={styles.exerciseCheckbox}>
                                    {completedExercises.includes(exercise.id) && (
                                        <Text style={styles.checkboxCheck}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                                <Text style={[
                                    styles.exerciseLabel,
                                    completedExercises.includes(exercise.id) && styles.exerciseLabelCompleted
                                ]}>
                                    {exercise.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sectionTitle}>Pain Level</Text>
                        <Text style={styles.sliderValue}>{pain === 0 ? '😊' : pain <= 3 ? '😌' : pain <= 6 ? '😐' : '😣'} {pain}/10</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={10}
                        step={1}
                        value={pain}
                        onValueChange={setPain}
                        minimumTrackTintColor={pain <= 3 ? Colors.actionGreen : pain <= 6 ? Colors.primary : Colors.actionCoral}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={pain <= 3 ? Colors.actionGreen : pain <= 6 ? Colors.primary : Colors.actionCoral}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>😊 No pain</Text>
                        <Text style={styles.sliderLabel}>Worst pain 😣</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sectionTitle}>Energy Level</Text>
                        <Text style={styles.sliderValue}>{energy <= 3 ? '😴' : energy <= 6 ? '😐' : '⚡'} {energy}/10</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={10}
                        step={1}
                        value={energy}
                        onValueChange={setEnergy}
                        minimumTrackTintColor={energy >= 7 ? Colors.actionGreen : Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={energy >= 7 ? Colors.actionGreen : Colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>😴 Exhausted</Text>
                        <Text style={styles.sliderLabel}>Energized ⚡</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Any notes for today?</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="How are you feeling? Any wins or challenges to note?"
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        returnKeyType="done"
                        textContentType="none"
                        accessibilityLabel="Notes"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <PrimaryButton
                        title={saving ? "Saving..." : "Save Check-In"}
                        onPress={handleSave}
                        disabled={saving}
                    />
                </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    backButton: {
        paddingVertical: 8,
        width: 60,
    },
    backButtonText: {
        fontSize: 17,
        color: Colors.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 12,
        marginTop: -8,
    },
    exerciseList: {
        gap: 10,
    },
    exerciseOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    exerciseCompleted: {
        backgroundColor: '#E0F2FE',
        borderColor: Colors.primary,
    },
    exerciseCheckbox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: 'white',
    },
    checkboxCheck: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    exerciseEmoji: {
        fontSize: 22,
        marginRight: 10,
    },
    exerciseLabel: {
        fontSize: 17,
        color: Colors.text,
        flex: 1,
    },
    exerciseLabelCompleted: {
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sliderValue: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.primary,
    },
    emojiScale: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    emojiOption: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.actionBlue,
        transform: [{ scale: 1.1 }],
    },
    emojiText: {
        fontSize: 28,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    notesInput: {
        backgroundColor: Colors.lillyBubble,
        borderRadius: 12,
        padding: 14,
        fontSize: 17,
        color: Colors.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
