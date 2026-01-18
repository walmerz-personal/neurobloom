// components/CustomExerciseModal.js
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    ScrollView, 
    TextInput, 
    ActivityIndicator,
    Alert,
    Switch,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { X, Save } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

const CATEGORIES = ['Arms', 'Legs', 'Core', 'Hands'];
const MODE_TYPES = ['Solo', 'Partner'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export function CustomExerciseModal({
    visible,
    onClose,
    exercise = null, // If provided, we're editing; otherwise creating
    onSave,
    userId
}) {
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Arms');
    const [mode, setMode] = useState('Solo');
    const [time, setTime] = useState('');
    const [target, setTarget] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Beginner');
    const [instructions, setInstructions] = useState('');
    const [isSharedWithCareTeam, setIsSharedWithCareTeam] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (exercise) {
            setTitle(exercise.title || '');
            setCategory(exercise.category || 'Arms');
            setMode(exercise.mode === 'solo' ? 'Solo' : 'Partner');
            setTime(exercise.time || '');
            setTarget(exercise.target || '');
            setDescription(exercise.description || '');
            setDifficulty(exercise.difficulty || 'Beginner');
            setInstructions(
                Array.isArray(exercise.instructions) 
                    ? exercise.instructions.join('\n')
                    : exercise.instructions || ''
            );
            setIsSharedWithCareTeam(exercise.isSharedWithCareTeam || false);
        } else {
            // Reset form for new exercise
            setTitle('');
            setCategory('Arms');
            setMode('Solo');
            setTime('');
            setTarget('');
            setDescription('');
            setDifficulty('Beginner');
            setInstructions('');
            setIsSharedWithCareTeam(false);
        }
    }, [exercise, visible]);

    const handleSave = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter an exercise title.');
            return;
        }

        if (!instructions.trim()) {
            Alert.alert('Validation Error', 'Please enter exercise instructions.');
            return;
        }

        setSaving(true);

        const exerciseData = {
            title: title.trim(),
            category,
            mode: mode.toLowerCase(),
            time: time.trim() || undefined,
            target: target.trim() || undefined,
            description: description.trim() || undefined,
            difficulty,
            instructions: instructions.split('\n').filter(i => i.trim()),
            isSharedWithCareTeam,
        };

        try {
            await onSave(exerciseData, exercise?.id);
            handleClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save exercise. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setTitle('');
            setCategory('Arms');
            setMode('Solo');
            setTime('');
            setTarget('');
            setDescription('');
            setDifficulty('Beginner');
            setInstructions('');
            setIsSharedWithCareTeam(false);
            onClose();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {exercise ? 'Edit Exercise' : 'Create Custom Exercise'}
                        </Text>
                        <TouchableOpacity 
                            onPress={handleClose} 
                            style={styles.closeButton}
                            disabled={saving}
                        >
                            <X size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        <ScrollView 
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                        >
                        {/* Title */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., Shoulder Shrugs"
                                placeholderTextColor={Colors.textSecondary}
                                editable={!saving}
                                returnKeyType="next"
                                textContentType="none"
                                accessibilityLabel="Exercise title"
                            />
                        </View>

                        {/* Category */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Category *</Text>
                            <View style={styles.pickerRow}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.pickerOption,
                                            category === cat && styles.pickerOptionActive
                                        ]}
                                        onPress={() => setCategory(cat)}
                                        disabled={saving}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            category === cat && styles.pickerOptionTextActive
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Mode */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Mode *</Text>
                            <View style={styles.pickerRow}>
                                {MODE_TYPES.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.pickerOption,
                                            mode === m && styles.pickerOptionActive
                                        ]}
                                        onPress={() => setMode(m)}
                                        disabled={saving}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            mode === m && styles.pickerOptionTextActive
                                        ]}>
                                            {m === 'Solo' ? '🧍 Solo' : '🤝 Partner'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Time */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Time (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={time}
                                onChangeText={setTime}
                                placeholder="e.g., 3 min"
                                placeholderTextColor={Colors.textSecondary}
                                editable={!saving}
                            />
                        </View>

                        {/* Target */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Target Area (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={target}
                                onChangeText={setTarget}
                                placeholder="e.g., Upper Traps"
                                placeholderTextColor={Colors.textSecondary}
                                editable={!saving}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Description (optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Brief description of the exercise"
                                placeholderTextColor={Colors.textSecondary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                editable={!saving}
                            />
                        </View>

                        {/* Difficulty */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Difficulty (optional)</Text>
                            <View style={styles.pickerRow}>
                                {DIFFICULTY_LEVELS.map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.pickerOption,
                                            difficulty === diff && styles.pickerOptionActive
                                        ]}
                                        onPress={() => setDifficulty(diff)}
                                        disabled={saving}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            difficulty === diff && styles.pickerOptionTextActive
                                        ]}>
                                            {diff}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Instructions */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Instructions *</Text>
                            <Text style={styles.hint}>Enter each step on a new line</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={instructions}
                                onChangeText={setInstructions}
                                placeholder="Step 1&#10;Step 2&#10;Step 3..."
                                placeholderTextColor={Colors.textSecondary}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                editable={!saving}
                                returnKeyType="done"
                                textContentType="none"
                                accessibilityLabel="Exercise instructions"
                            />
                        </View>

                        {/* Share with care team */}
                        <View style={styles.field}>
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabelContainer}>
                                    <Text style={styles.label}>Share with Care Team</Text>
                                    <Text style={styles.hint}>
                                        Let your caregivers see this exercise
                                    </Text>
                                </View>
                                <Switch
                                    value={isSharedWithCareTeam}
                                    onValueChange={setIsSharedWithCareTeam}
                                    disabled={saving}
                                    trackColor={{ false: Colors.border, true: Colors.primary }}
                                    thumbColor="white"
                                />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Save size={20} color="white" />
                                        <Text style={styles.saveButtonText}>
                                            {exercise ? 'Update Exercise' : 'Create Exercise'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.cancelButton}
                                disabled={saving}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.text,
        marginBottom: 8,
    },
    hint: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    pickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pickerOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pickerOptionActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pickerOptionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    pickerOptionTextActive: {
        color: 'white',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchLabelContainer: {
        flex: 1,
        marginRight: 16,
    },
    actions: {
        marginTop: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        gap: 8,
        marginBottom: 12,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
});
