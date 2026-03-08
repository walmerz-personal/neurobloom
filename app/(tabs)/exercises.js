import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { PlayCircle, Clock, Target, ChevronDown, ChevronUp, CheckCircle, Circle, Plus, Edit, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { CustomExerciseModal } from '../../components/CustomExerciseModal';
import { ConfettiBurst } from '../../components/ConfettiBurst';

const CATEGORIES = ['All', 'Arms', 'Legs', 'Core', 'Hands'];
const MODE_TYPES = ['All', 'Solo', 'Partner'];

const EXERCISES_DATA = [
    // Arms & Shoulders
    {
        id: 'a1',
        category: 'Arms',
        mode: 'solo', // Can do independently
        title: 'Shoulder Shrugs',
        time: '3 min',
        target: 'Upper Traps',
        description: 'Simple movement to release tension and improve shoulder mobility.',
        difficulty: 'Beginner',
        thumbnailColor: '#E0F2FE',
        instructions: [
            'Sit up straight with your feet flat on the floor.',
            'Lift your shoulders up towards your ears.',
            'Hold for 2-3 seconds.',
            'Relax and lower them back down.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'a2',
        category: 'Arms',
        mode: 'partner', // Benefits from partner assistance for guiding arm movement
        title: 'Table Push',
        time: '5 min',
        target: 'Shoulder/Elbow',
        description: 'Sliding exercise to improve reaching ability and arm extension.',
        difficulty: 'Beginner',
        thumbnailColor: '#BAE6FD',
        instructions: [
            'Sit at a table with a towel under your affected hand.',
            'Interlace your fingers or place your strong hand over the affected one.',
            'Slide your hands forward across the table, straightening your elbows.',
            'Lean forward slightly if needed.',
            'Slide back to the starting position.'
        ]
    },
    {
        id: 'a3',
        category: 'Arms',
        mode: 'solo', // Can do independently
        title: 'Bicep Curls',
        time: '5 min',
        target: 'Biceps',
        description: 'Strengthening exercise for the front of the upper arm.',
        difficulty: 'Intermediate',
        thumbnailColor: '#7DD3FC',
        instructions: [
            'Sit or stand with your arm at your side.',
            'Hold a light weight or water bottle (optional).',
            'Slowly bend your elbow, bringing your hand toward your shoulder.',
            'Slowly lower it back down.',
            'Keep your elbow tucked close to your side.'
        ]
    },

    // Legs & Mobility
    {
        id: 'l1',
        category: 'Legs',
        mode: 'solo', // Can do independently
        title: 'Ankle Pumps',
        time: '3 min',
        target: 'Calves/Shins',
        description: 'Essential for circulation and preventing foot drop.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Sit or lie down with your legs straight.',
            'Pull your toes up towards your nose.',
            'Point your toes down away from you.',
            'Repeat in a rhythmic motion.',
            'Do this for 1-2 minutes.'
        ]
    },
    {
        id: 'l2',
        category: 'Legs',
        mode: 'solo', // Can do independently
        title: 'Seated Marching',
        time: '5 min',
        target: 'Hip Flexors',
        description: 'Improves hip strength and ability to lift legs for walking.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Sit upright in a chair.',
            'Lift one knee up towards your chest as high as comfortable.',
            'Lower it slowly.',
            'Switch to the other leg.',
            'Alternate for 20 repetitions.'
        ]
    },
    {
        id: 'l3',
        category: 'Legs',
        mode: 'partner', // Benefits from partner spotting for safety
        title: 'Sit-to-Stand',
        time: '8 min',
        target: 'Full Leg',
        description: 'Functional exercise to build strength for getting out of chairs.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Sit at the edge of a sturdy chair.',
            'Lean forward slightly ("nose over toes").',
            'Push through your heels to stand up fully.',
            'Slowly lower yourself back down to the chair.',
            'Use your hands for support only if needed.'
        ]
    },

    // Core & Balance
    {
        id: 'c1',
        category: 'Core',
        mode: 'solo', // Can do independently
        title: 'Trunk Rotations',
        time: '4 min',
        target: 'Obliques',
        description: 'Improves spinal mobility and ability to look around.',
        difficulty: 'Beginner',
        thumbnailColor: '#D1FAE5',
        instructions: [
            'Sit tall in a chair, feet flat.',
            'Place your right hand on your left thigh.',
            'Gently twist your upper body to the left.',
            'Hold for 5 seconds.',
            'Return to center and repeat on the other side.'
        ]
    },
    {
        id: 'c2',
        category: 'Core',
        mode: 'partner', // Partner can help guide the stretch
        title: 'Lateral Flexion',
        time: '4 min',
        target: 'Side Core',
        description: 'Helps with balance and stability while sitting or standing.',
        difficulty: 'Beginner',
        thumbnailColor: '#A7F3D0',
        instructions: [
            'Sit tall with arms at your sides.',
            'Slowly lean to the right, reaching your hand towards the floor.',
            'Keep your buttocks firmly on the chair.',
            'Return to upright.',
            'Repeat on the left side.'
        ]
    },
    {
        id: 'c3',
        category: 'Core',
        mode: 'partner', // Benefits from partner for safety during balance work
        title: 'Seated Balance',
        time: '5 min',
        target: 'Core Stabilizers',
        description: 'Challenges your ability to maintain posture while moving.',
        difficulty: 'Intermediate',
        thumbnailColor: '#6EE7B7',
        instructions: [
            'Sit on a possibly unstable surface (like a cushion) or just sit tall.',
            'Shift your weight side to side without using hands.',
            'Shift your weight forward and backward.',
            'Try to lift one foot slightly while maintaining balance.'
        ]
    },

    // Hands & Fine Motor
    {
        id: 'h1',
        category: 'Hands',
        mode: 'solo', // Can do independently
        title: 'Fist Clenches',
        time: '3 min',
        target: 'Hand Grip',
        description: 'Basic strengthening for hand opening and closing.',
        difficulty: 'Beginner',
        thumbnailColor: '#E9D5FF',
        instructions: [
            'Rest your arm on a table.',
            'Squeeze your hand into a gentle fist.',
            'Hold for 3 seconds.',
            'Open your hand and spread your fingers wide.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'h2',
        category: 'Hands',
        mode: 'partner', // Partner can assist with passive stretching
        title: 'Towel Scrunch',
        time: '5 min',
        target: 'Finger Dexterity',
        description: 'Improves fine motor control and finger strength.',
        difficulty: 'Intermediate',
        thumbnailColor: '#D8B4FE',
        instructions: [
            'Place a small hand towel flat on the table.',
            'Place your hand palm down on the towel.',
            'Use your fingers to scrunch the towel into your palm.',
            'Release and straighten the towel out.',
            'Repeat.'
        ]
    },
    {
        id: 'h3',
        category: 'Hands',
        mode: 'solo', // Can do independently
        title: 'Thumb Touch',
        time: '4 min',
        target: 'Coordination',
        description: 'Enhances precision and coordination of the fingers.',
        difficulty: 'Advanced',
        thumbnailColor: '#C084FC',
        instructions: [
            'Hold your hand up comfortably.',
            'Touch the tip of your thumb to the tip of your index finger.',
            'Open.',
            'Touch thumb to middle finger, then ring, then pinky.',
            'Repeat the sequence.'
        ]
    },
];

export default function Exercises() {
    const { user, userData } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedMode, setSelectedMode] = useState('All');
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customExercises, setCustomExercises] = useState([]);
    const [assignedExercises, setAssignedExercises] = useState(new Map());
    const [modalVisible, setModalVisible] = useState(false);
    const [exerciseToEdit, setExerciseToEdit] = useState(null);

    useEffect(() => {
        if (user) {
            fetchCompletedExercises();
            fetchCustomExercises();
            fetchAssignedExercises();
        }
    }, [user]);

    const fetchCompletedExercises = async () => {
        try {
            const { log, error } = await SupabaseService.getTodayLog(user.id);
            if (log && log.exercises_completed) {
                setCompletedExercises(log.exercises_completed);
            } else {
                setCompletedExercises([]);
            }
        } catch (error) {
            console.error('Error fetching completed exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomExercises = async () => {
        if (!user) return;
        try {
            const { data, error } = await SupabaseService.getCustomExercises(user.id);
            if (error) {
                console.error('Error fetching custom exercises:', error);
                return;
            }
            setCustomExercises(data || []);
        } catch (error) {
            console.error('Error fetching custom exercises:', error);
        }
    };

    const fetchAssignedExercises = async () => {
        if (!user) return;
        try {
            const { assignments, error } = await MedicalStaffService.getAssignedExercises(user.id);
            if (error) {
                console.error('Error fetching assigned exercises:', error);
                return;
            }
            const activeAssignments = (assignments || []).filter(a => a.status === 'assigned');
            const assignmentMap = new Map();
            activeAssignments.forEach(a => {
                assignmentMap.set(a.exercise_id, {
                    notes: a.notes,
                    assignerName: a.assigned_by?.name || 'Your care team',
                    dueDate: a.due_date,
                    id: a.id,
                });
            });
            setAssignedExercises(assignmentMap);
        } catch (error) {
            console.error('Error fetching assigned exercises:', error);
        }
    };

    const toggleCompletion = async (exerciseId) => {
        if (!user) {
            // Should not happen in normal flow if protected, but safe guard
            console.warn('User not logged in, cannot toggle completion');
            return;
        }

        // Optimistic update
        const isCompleted = completedExercises.includes(exerciseId);
        let newCompleted = [];

        if (isCompleted) {
            newCompleted = completedExercises.filter(id => id !== exerciseId);
        } else {
            newCompleted = [...completedExercises, exerciseId];
        }

        setCompletedExercises(newCompleted);

        // API call
        const { error } = await SupabaseService.toggleExerciseCompletion(user.id, exerciseId);

        if (error) {
            // Revert on error
            console.error('Error toggling completion:', error);
            setCompletedExercises(completedExercises);
            alert('Failed to update status. Please try again.');
        } else {
            // If this was an assigned exercise, update assignment status
            if (!isCompleted && assignedExercises.has(exerciseId)) {
                // Find the assignment and update its status
                const { assignments } = await MedicalStaffService.getAssignedExercises(user.id);
                const assignment = assignments?.find(a => a.exercise_id === exerciseId && a.status === 'assigned');
                if (assignment) {
                    await MedicalStaffService.updateAssignment(assignment.id, { status: 'completed' });
                    await fetchAssignedExercises(); // Refresh assignments
                }
            }

            // Success! If we just completed it (was not completed before), award points
            if (!isCompleted) {
                const { points } = await SupabaseService.getUserPoints(user.id);
                await SupabaseService.updateUserPoints(user.id, points + 10);
                Alert.alert('Great Job!', 'You earned 10 points! 🌱');
            }
        }
    };

    // Merge built-in and custom exercises
    const allExercises = [
        ...EXERCISES_DATA.map(ex => ({ ...ex, isCustom: false })),
        ...customExercises
    ];

    const filteredExercises = allExercises.filter(ex => {
        const categoryMatch = selectedCategory === 'All' || ex.category === selectedCategory;
        const modeMatch = selectedMode === 'All' || ex.mode === selectedMode.toLowerCase();
        return categoryMatch && modeMatch;
    });

    const handleSaveExercise = async (exerciseData, exerciseId) => {
        if (!user) return;

        try {
            if (exerciseId) {
                // Update existing exercise
                const { error } = await SupabaseService.updateCustomExercise(exerciseId, exerciseData);
                if (error) throw error;
            } else {
                // Create new exercise
                const { error } = await SupabaseService.createCustomExercise(user.id, exerciseData);
                if (error) throw error;
            }
            // Refresh custom exercises
            await fetchCustomExercises();
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteExercise = (exerciseId) => {
        Alert.alert(
            'Delete Exercise',
            'Are you sure you want to delete this custom exercise? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await SupabaseService.deleteCustomExercise(exerciseId);
                        if (error) {
                            Alert.alert('Error', 'Failed to delete exercise. Please try again.');
                        } else {
                            await fetchCustomExercises();
                            // Also remove from completed exercises if it was completed
                            if (completedExercises.includes(exerciseId)) {
                                await toggleCompletion(exerciseId);
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleEditExercise = (exercise) => {
        setExerciseToEdit(exercise);
        setModalVisible(true);
    };

    const handleOpenCreateModal = () => {
        setExerciseToEdit(null);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setExerciseToEdit(null);
    };

    const toggleExpand = (id) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Recovery Exercises</Text>
                        <Text style={styles.headerSubtitle}>Daily movements for your recovery</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenCreateModal}
                        accessibilityLabel="Add custom exercise"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
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

            <View style={styles.modeContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeContent}
                >
                    {MODE_TYPES.map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.modeChip,
                                selectedMode === mode && styles.modeChipActive
                            ]}
                            onPress={() => setSelectedMode(mode)}
                        >
                            <Text style={[
                                styles.modeText,
                                selectedMode === mode && styles.modeTextActive
                            ]}>
                                {mode === 'Solo' ? '🧍 Solo' : mode === 'Partner' ? '🤝 Partner' : mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {filteredExercises.map((exercise) => {
                    const isAssigned = assignedExercises.has(exercise.id);
                    const assignmentDetails = assignedExercises.get(exercise.id);
                    const isShared = exercise.isCustom && exercise.userId !== user?.id;
                    return (
                        <ExerciseCard
                            key={exercise.id}
                            data={exercise}
                            isExpanded={expandedCardId === exercise.id}
                            isCompleted={completedExercises.includes(exercise.id)}
                            isCustom={exercise.isCustom}
                            isAssigned={isAssigned}
                            assignmentDetails={assignmentDetails}
                            isShared={isShared}
                            onPress={() => toggleExpand(exercise.id)}
                            onToggleComplete={() => toggleCompletion(exercise.id)}
                            onEdit={exercise.isCustom && !isShared ? () => handleEditExercise(exercise) : undefined}
                            onDelete={exercise.isCustom && !isShared ? () => handleDeleteExercise(exercise.id) : undefined}
                        />
                    );
                })}
                <View style={styles.footerSpacer} />
            </ScrollView>

            <CustomExerciseModal
                visible={modalVisible}
                onClose={handleCloseModal}
                exercise={exerciseToEdit}
                onSave={handleSaveExercise}
                userId={user?.id}
                userRole={userData?.role || 'survivor'}
            />
        </ScreenWrapper>
    );
}

function ExerciseCard({ data, isExpanded, isCompleted, isCustom, isAssigned, assignmentDetails, isShared, onPress, onToggleComplete, onEdit, onDelete }) {
    const [showConfetti, setShowConfetti] = useState(false);

    const handleToggleComplete = (e) => {
        e.stopPropagation();

        // Only celebrate when completing, not un-completing
        if (!isCompleted) {
            // Trigger haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Trigger confetti animation
            setShowConfetti(true);
        }

        onToggleComplete();
    };

    const handleConfettiComplete = () => {
        setShowConfetti(false);
    };

    return (
        <TouchableOpacity
            style={[styles.card, isExpanded && styles.cardExpanded, isCustom && styles.cardCustom, isAssigned && styles.cardAssigned]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.thumbnail, { backgroundColor: data.thumbnailColor }]}>
                <PlayCircle size={40} color={Colors.text} style={{ opacity: 0.6 }} />
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                        {data.category}{isCustom ? ' • Custom' : ''}{isAssigned ? ' • Assigned' : ''}
                    </Text>
                </View>

                <View style={styles.topLeftActions}>
                    {isCustom && onEdit && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            accessibilityLabel="Edit exercise"
                        >
                            <Edit size={18} color={Colors.text} />
                        </TouchableOpacity>
                    )}
                    {isCustom && onDelete && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            accessibilityLabel="Delete exercise"
                        >
                            <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.checkboxWrapper}>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={handleToggleComplete}
                        >
                            {isCompleted ? (
                                <CheckCircle size={28} color={Colors.primary} fill="white" />
                            ) : (
                                <Circle size={28} color="rgba(0,0,0,0.3)" fill="rgba(255,255,255,0.8)" />
                            )}
                        </TouchableOpacity>
                        <ConfettiBurst
                            trigger={showConfetti}
                            onComplete={handleConfettiComplete}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{data.title}</Text>
                    {isExpanded ?
                        <ChevronUp size={20} color={Colors.textSecondary} /> :
                        <ChevronDown size={20} color={Colors.textSecondary} />
                    }
                </View>

                <View style={styles.meta}>
                    {data.time && (
                        <View style={styles.metaItem}>
                            <Clock size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{data.time}</Text>
                        </View>
                    )}
                    {data.target && (
                        <View style={styles.metaItem}>
                            <Target size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{data.target}</Text>
                        </View>
                    )}
                    {data.difficulty && (
                        <View style={[styles.difficultyBadge,
                        data.difficulty === 'Beginner' ? styles.diffEasy :
                            data.difficulty === 'Intermediate' ? styles.diffMed : styles.diffHard
                        ]}>
                            <Text style={styles.difficultyText}>{data.difficulty}</Text>
                        </View>
                    )}
                </View>

                {isShared && data.creatorName && (
                    <Text style={styles.sharedBy}>
                        Shared by {data.creatorName}
                    </Text>
                )}

                {isAssigned && assignmentDetails && (
                    <View style={styles.assignmentInfo}>
                        <Text style={styles.assignedBy}>
                            Assigned by {assignmentDetails.assignerName}
                        </Text>
                        {assignmentDetails.notes && (
                            <Text style={styles.assignmentNotes}>
                                "{assignmentDetails.notes}"
                            </Text>
                        )}
                        {assignmentDetails.dueDate && (
                            <Text style={styles.assignmentDueDate}>
                                Due: {new Date(assignmentDetails.dueDate).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                )}

                {data.description && (
                    <Text style={styles.description}>{data.description}</Text>
                )}

                {isExpanded && (
                    <View style={styles.instructionsContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.instructionsTitle}>How to do it:</Text>
                        {data.instructions.map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: Colors.background,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryContainer: {
        backgroundColor: Colors.background,
        paddingBottom: 16,
    },
    categoryContent: {
        paddingHorizontal: 24,
        gap: 12,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
    modeContainer: {
        backgroundColor: Colors.background,
        paddingBottom: 12,
    },
    modeContent: {
        paddingHorizontal: 24,
        gap: 10,
    },
    modeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    modeChipActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    modeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    modeTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 8,
    },
    footerSpacer: {
        height: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardExpanded: {
        borderColor: Colors.primary,
        shadowOpacity: 0.1,
    },
    cardCustom: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    cardAssigned: {
        borderTopWidth: 3,
        borderTopColor: Colors.success,
    },
    thumbnail: {
        width: '100%',
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    categoryBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    categoryBadgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: Colors.text,
    },
    topLeftActions: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    checkboxWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    checkboxContainer: {
        // Checkbox is positioned within topLeftActions flex container
    },
    info: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        flex: 1,
        marginRight: 12,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    diffEasy: { backgroundColor: '#DCFCE7' },
    diffMed: { backgroundColor: '#FEF9C3' },
    diffHard: { backgroundColor: '#FEE2E2' },
    difficultyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
        color: Colors.text,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    sharedBy: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.primary,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    assignmentInfo: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    assignedBy: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#059669',
        marginBottom: 4,
    },
    assignmentNotes: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.text,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    assignmentDueDate: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    instructionsContainer: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 20,
    },
    instructionsTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 12,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingRight: 10,
    },
    stepNumber: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.primary,
        width: 28,
    },
    stepText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.text,
        lineHeight: 24,
        flex: 1,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
});

