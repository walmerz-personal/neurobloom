// app/medical-staff/assign-exercises.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { SupabaseService } from '../../services/SupabaseService';
import { ArrowLeft, CheckCircle, Circle, Plus } from 'lucide-react-native';
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
];

const CATEGORIES = ['All', 'Arms', 'Legs', 'Core', 'Hands'];

export default function AssignExercises() {
    const router = useRouter();
    const { user } = useAuth();
    const [survivors, setSurvivors] = useState([]);
    const [selectedSurvivor, setSelectedSurvivor] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedExercises, setSelectedExercises] = useState(new Set());
    const [customExercises, setCustomExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadSurvivors();
    }, [user]);

    useEffect(() => {
        if (selectedSurvivor && user) {
            loadCustomExercises();
        }
    }, [selectedSurvivor, user]);

    const loadSurvivors = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { survivors: linkedSurvivors, error } = await MedicalStaffService.getLinkedSurvivors(user.id);
            if (!error && linkedSurvivors) {
                setSurvivors(linkedSurvivors);
                if (linkedSurvivors.length === 1) {
                    setSelectedSurvivor(linkedSurvivors[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading survivors:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomExercises = async () => {
        if (!user) return;
        try {
            const { data, error } = await SupabaseService.getCustomExercises(user.id);
            if (!error && data) {
                setCustomExercises(data || []);
            }
        } catch (error) {
            console.error('Error loading custom exercises:', error);
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
                    exerciseType
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
                    <Plus size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
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
                        return (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
                                onPress={() => toggleExercise(exercise.id)}
                            >
                                <View style={[styles.thumbnail, { backgroundColor: exercise.thumbnailColor || '#E0F2FE' }]} />
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
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
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    exerciseDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
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
