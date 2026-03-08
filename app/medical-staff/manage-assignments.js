// app/medical-staff/manage-assignments.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { ArrowLeft, CheckCircle, Circle, X, Edit2, Trash2, Calendar } from 'lucide-react-native';
import { SupabaseService } from '../../services/SupabaseService';

const EXERCISES_DATA = [
    { id: 'a1', title: 'Shoulder Shrugs', category: 'Arms' },
    { id: 'a2', title: 'Table Push', category: 'Arms' },
    { id: 'a3', title: 'Bicep Curls', category: 'Arms' },
    { id: 'l1', title: 'Ankle Pumps', category: 'Legs' },
    { id: 'l2', title: 'Seated Marching', category: 'Legs' },
    { id: 'l3', title: 'Sit-to-Stand', category: 'Legs' },
    { id: 'c1', title: 'Trunk Rotations', category: 'Core' },
    { id: 'c2', title: 'Lateral Flexion', category: 'Core' },
    { id: 'c3', title: 'Seated Balance', category: 'Core' },
    { id: 'h1', title: 'Fist Clenches', category: 'Hands' },
    { id: 'h2', title: 'Towel Scrunch', category: 'Hands' },
    { id: 'h3', title: 'Thumb Touch', category: 'Hands' },
];

const getExerciseTitle = (exerciseId, exerciseType) => {
    if (exerciseType === 'built_in') {
        const exercise = EXERCISES_DATA.find(e => e.id === exerciseId);
        return exercise ? exercise.title : exerciseId;
    }
    return 'Custom Exercise';
};

export default function ManageAssignments() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const survivorId = params.survivorId;
    const survivorName = params.survivorName || 'Patient';

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'assigned', 'completed', 'skipped'
    const [editingNotes, setEditingNotes] = useState(null);
    const [notesText, setNotesText] = useState('');

    useEffect(() => {
        if (user && survivorId) {
            loadAssignments();
        }
    }, [user, survivorId]);

    const loadAssignments = async () => {
        if (!user || !survivorId) return;
        setLoading(true);
        try {
            const { assignments: allAssignments, error } = await MedicalStaffService.getMedicalStaffAssignments(user.id);
            if (!error && allAssignments) {
                // Filter to assignments for this survivor
                const survivorAssignments = allAssignments.filter(a => a.survivor_id === survivorId);
                setAssignments(survivorAssignments);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            Alert.alert('Error', 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = (assignmentId) => {
        Alert.alert(
            'Delete Assignment',
            'Are you sure you want to delete this assignment? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { success, error } = await MedicalStaffService.removeAssignment(assignmentId);
                        if (error) {
                            Alert.alert('Error', 'Failed to delete assignment');
                        } else {
                            await loadAssignments();
                        }
                    }
                }
            ]
        );
    };

    const handleEditNotes = (assignment) => {
        setEditingNotes(assignment.id);
        setNotesText(assignment.notes || '');
    };

    const handleSaveNotes = async (assignmentId) => {
        try {
            const { error } = await SupabaseService.updateAssignmentNotes(assignmentId, notesText);
            if (error) {
                Alert.alert('Error', 'Failed to save notes. Please try again.');
            } else {
                await loadAssignments();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save notes. Please try again.');
        }
        setEditingNotes(null);
        setNotesText('');
    };

    const filteredAssignments = assignments.filter(a => {
        if (filter === 'all') return true;
        return a.status === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'assigned': return Colors.warning;
            case 'completed': return Colors.success;
            case 'skipped': return Colors.textSecondary;
            default: return Colors.textSecondary;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'assigned': return 'Assigned';
            case 'completed': return 'Completed';
            case 'skipped': return 'Skipped';
            default: return status;
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Assignments</Text>
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
                <Text style={styles.headerTitle}>Manage Assignments</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{survivorName}</Text>
                <Text style={styles.patientSubtext}>{filteredAssignments.length} assignment(s)</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {['all', 'assigned', 'completed', 'skipped'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterChipActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {filteredAssignments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {filter === 'all' 
                                ? 'No assignments yet' 
                                : `No ${filter} assignments`}
                        </Text>
                    </View>
                ) : (
                    filteredAssignments.map((assignment) => (
                        <View key={assignment.id} style={styles.assignmentCard}>
                            <View style={styles.assignmentHeader}>
                                <View style={styles.assignmentHeaderLeft}>
                                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(assignment.status) }]} />
                                    <View>
                                        <Text style={styles.exerciseId}>{getExerciseTitle(assignment.exercise_id, assignment.exercise_type)}</Text>
                                        <Text style={styles.exerciseType}>
                                            {assignment.exercise_type === 'built_in' ? 'Built-in' : 'Custom'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statusBadge}>
                                    <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
                                        {getStatusLabel(assignment.status)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.assignmentMeta}>
                                <View style={styles.metaRow}>
                                    <Calendar size={14} color={Colors.textSecondary} />
                                    <Text style={styles.metaText}>
                                        Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                                    </Text>
                                </View>
                                {assignment.due_date && (
                                    <View style={styles.metaRow}>
                                        <Calendar size={14} color={Colors.textSecondary} />
                                        <Text style={styles.metaText}>
                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {editingNotes === assignment.id ? (
                                <View style={styles.notesEditor}>
                                    <TextInput
                                        style={styles.notesInput}
                                        value={notesText}
                                        onChangeText={setNotesText}
                                        placeholder="Add notes..."
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                    <View style={styles.notesActions}>
                                        <TouchableOpacity
                                            style={styles.saveNotesButton}
                                            onPress={() => handleSaveNotes(assignment.id)}
                                        >
                                            <Text style={styles.saveNotesText}>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.cancelNotesButton}
                                            onPress={() => {
                                                setEditingNotes(null);
                                                setNotesText('');
                                            }}
                                        >
                                            <Text style={styles.cancelNotesText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    {assignment.notes && (
                                        <View style={styles.notesContainer}>
                                            <Text style={styles.notesLabel}>Notes:</Text>
                                            <Text style={styles.notesText}>{assignment.notes}</Text>
                                        </View>
                                    )}

                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => handleEditNotes(assignment)}
                                        >
                                            <Edit2 size={16} color={Colors.primary} />
                                            <Text style={styles.editButtonText}>Edit Notes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteAssignment(assignment.id)}
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientInfo: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    patientName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 4,
    },
    patientSubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    filterContainer: {
        backgroundColor: Colors.background,
        paddingVertical: 12,
    },
    filterContent: {
        paddingHorizontal: 24,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    assignmentCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    assignmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    assignmentHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    exerciseId: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 2,
    },
    exerciseType: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.surfaceHighlight,
    },
    statusText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
    },
    assignmentMeta: {
        gap: 8,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    notesContainer: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
    },
    notesLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    notesText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.text,
    },
    notesEditor: {
        marginBottom: 12,
    },
    notesInput: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
        padding: 12,
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.text,
        minHeight: 80,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 8,
    },
    notesActions: {
        flexDirection: 'row',
        gap: 8,
    },
    saveNotesButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    saveNotesText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: 'white',
    },
    cancelNotesButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
    },
    cancelNotesText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
    },
    editButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: Colors.primary,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    deleteButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#EF4444',
    },
});
