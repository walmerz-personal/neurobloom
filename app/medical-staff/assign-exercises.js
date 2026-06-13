// app/medical-staff/assign-exercises.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { SupabaseService } from '../../services/SupabaseService';
import { ArrowLeft, CheckCircle, Circle, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomExerciseModal } from '../../components/CustomExerciseModal';

// Import EXERCISES_DATA from exercises.js (built-in exercises)
const EXERCISES_DATA = [
    { id: 'a1', category: 'Arms', mode: 'solo', title: 'Shoulder Shrugs', thumbnailColor: '#E0F2FE', description: 'Simple movement to release tension and improve shoulder mobility.' },
    { id: 'a2', category: 'Arms', mode: 'partner', title: 'Table Push', thumbnailColor: '#BAE6FD', description: 'Sliding exercise to improve reaching ability.' },
    { id: 'a3', category: 'Arms', mode: 'solo', title: 'Bicep Curls', thumbnailColor: '#7DD3FC', description: 'Strengthening exercise for the front of the upper arm.' },
    { id: 'l1', category: 'Legs', mode: 'solo', title: 'Ankle Pumps', thumbnailColor: '#FED7AA', description: 'Essential for circulation and preventing foot drop.' },
    { id: 'l2', category: 'Legs', mode: 'solo', title: 'Seated Marching', thumbnailColor: '#FDBA74', description: 'Improves hip strength and ability to lift legs.' },
    { id: 'l3', category: 'Legs', mode: 'partner', title: 'Sit-to-Stand', thumbnailColor: '#FB923C', description: 'Functional exercise to build strength for getting out of chairs.' },
    { id: 'c1', category: 'Core', mode: 'solo', title: 'Trunk Rotations', thumbnailColor: '#D1FAE5', description: 'Improves spinal mobility and ability to look around.' },
    { id: 'c2', category: 'Core', mode: 'partner', title: 'Lateral Flexion', thumbnailColor: '#A7F3D0', description: 'Helps with balance and stability.' },
    { id: 'c3', category: 'Core', mode: 'partner', title: 'Seated Balance', thumbnailColor: '#6EE7B7', description: 'Challenges your ability to maintain posture.' },
    { id: 'h1', category: 'Hands', mode: 'solo', title: 'Fist Clenches', thumbnailColor: '#E9D5FF', description: 'Basic strengthening for hand opening and closing.' },
    { id: 'h2', category: 'Hands', mode: 'partner', title: 'Towel Scrunch', thumbnailColor: '#D8B4FE', description: 'Improves fine motor control and finger strength.' },
    { id: 'h3', category: 'Hands', mode: 'solo', title: 'Thumb Touch', thumbnailColor: '#C084FC', description: 'Enhances precision and coordination of the fingers.' },
    { id: 'n1', category: 'Head & Neck', mode: 'solo', title: 'Tongue Clucking', thumbnailColor: '#FFE4E6', description: 'Positions tongue on hard palate for proper nasal and diaphragmatic breathing.' },
    { id: 'n2', category: 'Head & Neck', mode: 'solo', title: 'Controlled TMJ Rotation', thumbnailColor: '#FECDD3', description: 'Maintain tongue on palate while opening and closing jaw.' },
    { id: 'n3', category: 'Head & Neck', mode: 'solo', title: 'Mandibular Rhythmic Stabilization', thumbnailColor: '#FDA4AF', description: 'Apply resistance to jaw opening, closing, and lateral deviation.' },
    { id: 'n4', category: 'Head & Neck', mode: 'solo', title: 'Upper Cervical Distraction', thumbnailColor: '#FB7185', description: 'Upper cervical flexion with hand-collar to relieve compression.' },
    { id: 'n5', category: 'Head & Neck', mode: 'solo', title: 'Chin Tuck (Axial Extension)', thumbnailColor: '#FFE4E6', description: 'Cervical retraction to normalize forward head posture.' },
    { id: 'n6', category: 'Head & Neck', mode: 'solo', title: 'Chin Nods', thumbnailColor: '#FECDD3', description: 'Cervical retraction in trunk-flexed position for jaw alignment.' },
    { id: 'n7', category: 'Head & Neck', mode: 'solo', title: 'Nasal Breathing Practice', thumbnailColor: '#FDA4AF', description: 'Tongue on palate, lips closed; maintains normal resting jaw position.' },
    { id: 'a4', category: 'Arms', mode: 'solo', title: 'PROM Shoulder External Rotation', thumbnailColor: '#E0F2FE', description: 'Self-assisted shoulder external rotation to improve range of motion.' },
    { id: 'a5', category: 'Arms', mode: 'solo', title: 'PROM Shoulder Flexion (Self)', thumbnailColor: '#BAE6FD', description: 'Self-assisted shoulder flexion; gently raise arm upward and in front.' },
    { id: 'a6', category: 'Arms', mode: 'solo', title: 'PROM Shoulder Extension (Self)', thumbnailColor: '#7DD3FC', description: 'Sit with arm at side, elbow bent 90 deg; grasp forearm, move arm backward.' },
    { id: 'a7', category: 'Arms', mode: 'solo', title: 'PROM Elbow Flexion/Extension', thumbnailColor: '#38BDF8', description: 'Self-assisted elbow motion through available range.' },
    { id: 'a8', category: 'Arms', mode: 'solo', title: 'Shoulder Girdle Retraction', thumbnailColor: '#0EA5E9', description: 'Retraction and depression of scapulae to normalize upper quarter posture.' },
    { id: 'a9', category: 'Arms', mode: 'solo', title: 'Seated Push Up', thumbnailColor: '#0284C7', description: 'Sitting in a chair, press down with arms to lift body slightly off seat.' },
    { id: 'a10', category: 'Arms', mode: 'partner', title: 'PROM Shoulder Abduction (Partner)', thumbnailColor: '#E0F2FE', description: 'Partner moves your arm away from body through available range.' },
    { id: 'a11', category: 'Arms', mode: 'partner', title: 'PROM Shoulder Flexion (Partner)', thumbnailColor: '#BAE6FD', description: 'Partner raises and lowers your arm through available range.' },
    { id: 'a12', category: 'Arms', mode: 'partner', title: 'PROM Elbow Flex/Ext (Partner)', thumbnailColor: '#7DD3FC', description: 'Partner moves your elbow through available range of motion.' },
    { id: 'a13', category: 'Arms', mode: 'solo', title: 'Resistance Band Chest Press', thumbnailColor: '#38BDF8', description: 'Using a flat resistance band for pectoral strengthening.' },
    { id: 'a14', category: 'Arms', mode: 'solo', title: 'Resistance Band Arm Curl', thumbnailColor: '#0EA5E9', description: 'Using a flat resistance band for bicep strengthening.' },
    { id: 'a15', category: 'Arms', mode: 'solo', title: 'Resistance Band Arm Extension', thumbnailColor: '#0284C7', description: 'Using a flat resistance band for tricep strengthening.' },
    { id: 'a16', category: 'Arms', mode: 'solo', title: 'Resistance Band Shoulder Press', thumbnailColor: '#0369A1', description: 'Using a flat resistance band for deltoid strengthening.' },
    { id: 'l4', category: 'Legs', mode: 'solo', title: 'Seated Knee Extensions', thumbnailColor: '#FED7AA', description: 'Sit with feet on floor; lift foot until knee straight, then slowly lower.' },
    { id: 'l5', category: 'Legs', mode: 'solo', title: 'Seated Hip Adduction', thumbnailColor: '#FDBA74', description: 'Sitting with pillow or ball between knees, gently squeeze and hold.' },
    { id: 'l6', category: 'Legs', mode: 'solo', title: 'Side Stepping on Line', thumbnailColor: '#FB923C', description: 'Standing upright, step sideways along a line, then return.' },
    { id: 'l7', category: 'Legs', mode: 'solo', title: 'Marching with Support', thumbnailColor: '#F97316', description: 'Standing at counter or chair for support, raise knees to waist level.' },
    { id: 'l8', category: 'Legs', mode: 'solo', title: 'Heel Slides', thumbnailColor: '#EA580C', description: 'Lying on back, slide heel up to bend knee, then slide back down.' },
    { id: 'l9', category: 'Legs', mode: 'solo', title: 'Straight Leg Raise (Supine)', thumbnailColor: '#FED7AA', description: 'Lying on back, raise one straight leg upward.' },
    { id: 'l10', category: 'Legs', mode: 'solo', title: 'Heel Raises', thumbnailColor: '#FDBA74', description: 'Standing, rise up on toes then lower. Use support if needed.' },
    { id: 'l11', category: 'Legs', mode: 'solo', title: 'Standing Hamstring Curls', thumbnailColor: '#FB923C', description: 'Standing against support, bend knee to bring heel toward buttock.' },
    { id: 'l12', category: 'Legs', mode: 'partner', title: 'Prone Hamstring Curls', thumbnailColor: '#F97316', description: 'Lay on stomach, flex knee slowly; partner holds pelvis down.' },
    { id: 'l13', category: 'Legs', mode: 'solo', title: 'Hip Abduction (Supine)', thumbnailColor: '#EA580C', description: 'Lying on back, slide one leg out to the side and return.' },
    { id: 'l14', category: 'Legs', mode: 'solo', title: 'Hip Abduction (Standing)', thumbnailColor: '#FED7AA', description: 'Standing and holding support, lift one leg sideways.' },
    { id: 'l15', category: 'Legs', mode: 'solo', title: 'Hip Extension (Standing)', thumbnailColor: '#FDBA74', description: 'Standing and holding support, bring one leg slightly backward.' },
    { id: 'l16', category: 'Legs', mode: 'solo', title: 'Partial Squats', thumbnailColor: '#FB923C', description: 'Standing, perform a partial (mini) squat.' },
    { id: 'l17', category: 'Legs', mode: 'solo', title: 'Forward Lunges', thumbnailColor: '#F97316', description: 'Step forward into a lunge position.' },
    { id: 'l18', category: 'Legs', mode: 'partner', title: 'Assisted Dorsiflexion Stretch', thumbnailColor: '#EA580C', description: 'Partner pulls foot up while supporting leg to stretch calf.' },
    { id: 'l19', category: 'Legs', mode: 'partner', title: 'Hamstring Stretch (Assisted)', thumbnailColor: '#FED7AA', description: 'Lay flat; partner bends leg to 90 deg and pushes lower leg upward.' },
    { id: 'l20', category: 'Legs', mode: 'partner', title: 'Retro Gait', thumbnailColor: '#FDBA74', description: 'Walk backwards, leading with toe, rolling to flat foot.' },
    { id: 'l21', category: 'Legs', mode: 'solo', title: 'Walk on Toes', thumbnailColor: '#FB923C', description: 'Stand and walk forward on your toes.' },
    { id: 'l22', category: 'Legs', mode: 'solo', title: 'Walk on Heels', thumbnailColor: '#F97316', description: 'Stand and walk forward on your heels.' },
    { id: 'l23', category: 'Legs', mode: 'solo', title: 'Stair Walking', thumbnailColor: '#EA580C', description: 'Walk up and down stairs with proper form.' },
    { id: 'l24', category: 'Legs', mode: 'partner', title: 'Gait Training with Cane', thumbnailColor: '#C2410C', description: 'Practice walking phases with cane; pelvic tuck and weight shifting.' },
    { id: 'c4', category: 'Core', mode: 'solo', title: 'Bridging', thumbnailColor: '#D1FAE5', description: 'Lying on back, knees bent, tighten abs and glutes and raise hips.' },
    { id: 'c5', category: 'Core', mode: 'partner', title: 'Bridging Crossed Leg', thumbnailColor: '#A7F3D0', description: 'Bridging with one leg crossed; partner helps hold knee straight.' },
    { id: 'c6', category: 'Core', mode: 'partner', title: 'Single Leg Bridge', thumbnailColor: '#6EE7B7', description: 'Knees bent, extend one leg, raise hips keeping pelvis level.' },
    { id: 'c7', category: 'Core', mode: 'solo', title: 'Weight Shift - Lateral', thumbnailColor: '#34D399', description: 'Standing, slowly shift body weight side-to-side.' },
    { id: 'c8', category: 'Core', mode: 'solo', title: 'Pelvic Tilt (Standing)', thumbnailColor: '#10B981', description: 'Standing, arch low back then flatten through comfortable range.' },
    { id: 'c9', category: 'Core', mode: 'solo', title: 'Sit to Stand - Thigh Support', thumbnailColor: '#059669', description: 'Scoot to front of chair, hands on thighs, rise to standing.' },
    { id: 'c10', category: 'Core', mode: 'solo', title: 'Wobble Board Balance', thumbnailColor: '#047857', description: 'Stand on wobble board and practice balancing.' },
    { id: 'c11', category: 'Core', mode: 'solo', title: 'Weight Lift with Knee Raise', thumbnailColor: '#D1FAE5', description: 'Stand holding small weight, lift arm forward while raising knee.' },
    { id: 'c12', category: 'Core', mode: 'solo', title: 'Weight Transfer (Standing)', thumbnailColor: '#A7F3D0', description: 'Stand with legs apart; transfer weight from one leg to the other.' },
];

const CATEGORIES = ['All', 'Arms', 'Legs', 'Core', 'Hands', 'Head & Neck'];

export default function AssignExercises() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const params = useLocalSearchParams();
    const preSelectedSurvivorId = params.survivorId;
    const [survivors, setSurvivors] = useState([]);
    const [selectedSurvivor, setSelectedSurvivor] = useState(preSelectedSurvivorId || null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedExercises, setSelectedExercises] = useState(new Set());
    const [customExercises, setCustomExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [dueDate, setDueDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [alreadyAssigned, setAlreadyAssigned] = useState(new Set());

    useEffect(() => {
        loadSurvivors();
    }, [user]);

    useEffect(() => {
        if (selectedSurvivor && user) {
            loadCustomExercises();
            loadExistingAssignments();
        }
    }, [selectedSurvivor, user]);

    const loadSurvivors = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { survivors: linkedSurvivors, error } = await MedicalStaffService.getLinkedSurvivors(user.id);
            if (!error && linkedSurvivors) {
                setSurvivors(linkedSurvivors);
                // If pre-selected survivor is provided, use it; otherwise auto-select if only one
                if (!selectedSurvivor) {
                    if (linkedSurvivors.length === 1) {
                        setSelectedSurvivor(linkedSurvivors[0].id);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading survivors:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomExercises = async () => {
        if (!selectedSurvivor) return;
        try {
            // Load custom exercises for the selected survivor (medical staff can see them via RLS)
            const { data, error } = await SupabaseService.getCustomExercises(selectedSurvivor);
            if (!error && data) {
                setCustomExercises(data || []);
            }
        } catch (error) {
            console.error('Error loading custom exercises:', error);
        }
    };

    const loadExistingAssignments = async () => {
        if (!selectedSurvivor) return;
        try {
            const { assignments, error } = await MedicalStaffService.getAssignedExercises(selectedSurvivor, 'assigned');
            if (!error && assignments) {
                setAlreadyAssigned(new Set(assignments.map(a => a.exercise_id)));
            }
        } catch (error) {
            console.error('Error loading existing assignments:', error);
        }
    };

    const toggleExercise = (exerciseId) => {
        const newSelected = new Set(selectedExercises);
        if (newSelected.has(exerciseId)) {
            newSelected.delete(exerciseId);
        } else {
            newSelected.add(exerciseId);
        }
        setSelectedExercises(newSelected);
    };

    const handleSave = async () => {
        if (!selectedSurvivor) {
            Alert.alert('Select Patient', 'Please select a patient first.');
            return;
        }

        if (selectedExercises.size === 0) {
            Alert.alert('No Exercises Selected', 'Please select at least one exercise to assign.');
            return;
        }

        setSaving(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const exerciseId of selectedExercises) {
                // Determine if it's built-in or custom
                const isBuiltIn = EXERCISES_DATA.some(ex => ex.id === exerciseId);
                const exerciseType = isBuiltIn ? 'built_in' : 'custom';

                const { assignment, error } = await MedicalStaffService.assignExercise(
                    selectedSurvivor,
                    user.id,
                    exerciseId,
                    exerciseType,
                    dueDate || null,
                    assignmentNotes || null
                );

                if (error) {
                    errorCount++;
                    console.error('Error assigning exercise:', error);
                } else {
                    successCount++;
                }
            }

            if (successCount > 0) {
                Alert.alert('Success', `Successfully assigned ${successCount} exercise(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`);
                setSelectedExercises(new Set());
                setAssignmentNotes('');
                setDueDate(null);
                loadExistingAssignments();
                router.back();
            } else {
                Alert.alert('Error', 'Failed to assign exercises. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to assign exercises. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Merge built-in and custom exercises
    const allExercises = [
        ...EXERCISES_DATA.map(ex => ({ ...ex, isCustom: false })),
        ...customExercises.map(ex => ({ ...ex, isCustom: true }))
    ];

    const filteredExercises = allExercises.filter(ex => {
        return selectedCategory === 'All' || ex.category === selectedCategory;
    });

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assign Exercises</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assign Exercises</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton} accessibilityRole="button" accessibilityLabel="Create custom exercise">
                    <Plus size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                {/* Survivor Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Patient</Text>
                    {survivors.map((survivor) => (
                        <TouchableOpacity
                            key={survivor.id}
                            style={[
                                styles.survivorOption,
                                selectedSurvivor === survivor.id && styles.survivorOptionSelected
                            ]}
                            onPress={() => setSelectedSurvivor(survivor.id)}
                        >
                            <Text style={[
                                styles.survivorName,
                                selectedSurvivor === survivor.id && styles.survivorNameSelected
                            ]}>
                                {survivor.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Category Filter */}
                <View style={styles.section}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat && styles.categoryChipActive
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === cat && styles.categoryTextActive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Exercise List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Exercises ({selectedExercises.size} selected)</Text>
                    {filteredExercises.map((exercise) => {
                        const isSelected = selectedExercises.has(exercise.id);
                        const isAlreadyAssigned = alreadyAssigned.has(exercise.id);
                        return (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[
                                    styles.exerciseCard,
                                    isSelected && styles.exerciseCardSelected,
                                    isAlreadyAssigned && !isSelected && styles.exerciseCardDimmed
                                ]}
                                onPress={() => toggleExercise(exercise.id)}
                            >
                                <View style={[styles.thumbnail, { backgroundColor: exercise.thumbnailColor || '#E0F2FE' }]} />
                                <View style={styles.exerciseInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                                        {isAlreadyAssigned && (
                                            <View style={styles.assignedBadge}>
                                                <Text style={styles.assignedBadgeText}>Assigned</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.exerciseCategory}>{exercise.category} • {exercise.mode}</Text>
                                    {exercise.description && (
                                        <Text style={styles.exerciseDescription} numberOfLines={2}>{exercise.description}</Text>
                                    )}
                                </View>
                                {isSelected ? (
                                    <CheckCircle size={24} color={Colors.primary} />
                                ) : (
                                    <Circle size={24} color={Colors.border} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Due Date & Notes */}
                {selectedExercises.size > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Assignment Details</Text>
                        <TouchableOpacity
                            style={styles.textInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={dueDate ? styles.dateText : styles.datePlaceholder}>
                                {dueDate || 'Due date'}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dueDate ? new Date(dueDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate && event.type !== 'dismissed') {
                                        setDueDate(selectedDate.toISOString().split('T')[0]);
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
                        <TextInput
                            style={[styles.textInput, styles.notesInput]}
                            placeholder="Notes for patient (optional)"
                            placeholderTextColor={Colors.textSecondary}
                            value={assignmentNotes}
                            onChangeText={setAssignmentNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, (!selectedSurvivor || selectedExercises.size === 0 || saving) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!selectedSurvivor || selectedExercises.size === 0 || saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Assigning...' : `Assign ${selectedExercises.size} Exercise(s)`}
                    </Text>
                </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomExerciseModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={async (exerciseData, exerciseId) => {
                    if (!user) return;
                    try {
                        if (exerciseId) {
                            await SupabaseService.updateCustomExercise(exerciseId, exerciseData);
                        } else {
                            await SupabaseService.createCustomExercise(user.id, exerciseData);
                        }
                        await loadCustomExercises();
                        setModalVisible(false);
                    } catch (error) {
                        throw error;
                    }
                }}
                userId={user?.id}
                userRole={userData?.role || 'medical_staff'}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.background,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        flex: 1,
        textAlign: 'center',
    },
    createButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    section: {
        padding: 24,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
    },
    survivorOption: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    survivorOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight + '20',
    },
    survivorName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
    },
    survivorNameSelected: {
        color: Colors.primary,
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    categoryTextActive: {
        color: 'white',
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    exerciseCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight + '20',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 12,
    },
    exerciseInfo: {
        flex: 1,
        marginRight: 12,
    },
    exerciseTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    exerciseCategory: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    exerciseDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    exerciseCardDimmed: {
        opacity: 0.6,
    },
    assignedBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    assignedBadgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.primary,
    },
    textInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.text,
        marginBottom: 12,
    },
    notesInput: {
        minHeight: 80,
    },
    dateText: {
        fontSize: 15,
        color: Colors.text,
    },
    datePlaceholder: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    datePickerDone: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    datePickerDoneText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.primary,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        margin: 24,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
});
