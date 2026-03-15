import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Switch, Linking, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { ArrowLeft, Save, User, Calendar, Activity, Target, Mail, Trash2, Bell, Plus, X, Briefcase } from 'lucide-react-native';
import { CareTeamSection } from '../components/CareTeamSection';
import { HealthSharingSection } from '../components/HealthSharingSection';
import { NotificationService } from '../services/NotificationService';

export default function Profile() {
    const router = useRouter();
    const { user, userData, deleteAccount } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('survivor');
    const [strokeDate, setStrokeDate] = useState('');
    const [impairments, setImpairments] = useState('');
    const [affectedSide, setAffectedSide] = useState('');
    const [impairmentSeverity, setImpairmentSeverity] = useState('');
    const [goals, setGoals] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Medical staff
    const [medicalStaffRole, setMedicalStaffRole] = useState('');
    const [organization, setOrganization] = useState('');
    const [preferences, setPreferences] = useState({});

    // Notification State
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // On by default
    const [reminderTimes, setReminderTimes] = useState([
        new Date(2000, 0, 1, 8, 30),  // Default 8:30 AM
        new Date(2000, 0, 1, 12, 30), // Default 12:30 PM
    ]);
    const [showTimePickers, setShowTimePickers] = useState({});

    useEffect(() => {
        loadProfile();
        loadNotificationPrefs();
    }, [user]);

    const loadNotificationPrefs = async () => {
        const prefs = await NotificationService.loadNotificationPrefs();
        if (prefs) {
            // User has saved preferences, use them
            setNotificationsEnabled(prefs.enabled);
            
            // Load times array (migrated from old format)
            if (prefs.times && Array.isArray(prefs.times) && prefs.times.length > 0) {
                const times = prefs.times.map(({ hour, minute }) => 
                    new Date(2000, 0, 1, hour, minute)
                );
                setReminderTimes(times);
            } else if (prefs.hour !== undefined && prefs.minute !== undefined) {
                // Old format - migrate to array
                setReminderTimes([new Date(2000, 0, 1, prefs.hour, prefs.minute)]);
            } else {
                // No times found, use defaults
                setReminderTimes([
                    new Date(2000, 0, 1, 8, 30),
                    new Date(2000, 0, 1, 12, 30),
                ]);
            }
        } else {
            // First time - use defaults
            setNotificationsEnabled(true);
            setReminderTimes([
                new Date(2000, 0, 1, 8, 30),
                new Date(2000, 0, 1, 12, 30),
            ]);
        }
    };

    const loadProfile = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // Fetch basic user data (name, email)
            const { user: userData, error: userError } = await SupabaseService.getUserData(user.id);
            if (userData) {
                setName(userData.name || '');
                setEmail(userData.email || '');
                setRole(userData.role || 'survivor');
            }

            // Fetch profile data (stroke date, impairments, etc)
            const { profile, error: profileError } = await SupabaseService.getUserProfile(user.id);
            if (profile) {
                setStrokeDate(profile.stroke_date || '');
                setImpairments(Array.isArray(profile.impairments) ? profile.impairments.join(', ') : profile.impairments || '');
                setAffectedSide(profile.affected_side || '');
                setImpairmentSeverity(profile.impairment_severity || '');
                setGoals(profile.goals || '');
                setMedicalStaffRole(profile.medical_staff_role || '');
                setPreferences(profile.preferences || {});
                setOrganization((profile.preferences && profile.preferences.organization) || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            // Update User Data (Name)
            await SupabaseService.updateUserData(user.id, { name, role });

            // Update Profile Data (role-specific fields)
            const profileUpdates = {
                preferences: role === 'medical_staff' ? { ...preferences, organization: organization || undefined } : preferences,
            };
            if (role === 'survivor' || role === 'caregiver') {
                profileUpdates.strokeDate = strokeDate;
                profileUpdates.impairments = impairments.split(',').map(i => i.trim()).filter(i => i);
                profileUpdates.affectedSide = affectedSide || null;
                profileUpdates.impairmentSeverity = impairmentSeverity || null;
                profileUpdates.goals = goals;
            }
            if (role === 'medical_staff') {
                profileUpdates.medicalStaffRole = medicalStaffRole || null;
            }
            await SupabaseService.saveUserProfile(user.id, profileUpdates);

            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (value) => {
        if (value) {
            // Request permissions when enabling
            const hasPermission = await NotificationService.requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Notifications Disabled',
                    'To receive daily reminders, please enable notifications in your device Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }
            // Schedule the reminders
            const times = reminderTimes.map(time => ({
                hour: time.getHours(),
                minute: time.getMinutes()
            }));
            await NotificationService.scheduleDailyReminder(times);
            await NotificationService.saveNotificationPrefs({ enabled: true, times });
            setNotificationsEnabled(true);
        } else {
            // Cancel all reminders
            await NotificationService.cancelAllReminders();
            const times = reminderTimes.map(time => ({
                hour: time.getHours(),
                minute: time.getMinutes()
            }));
            await NotificationService.saveNotificationPrefs({ enabled: false, times });
            setNotificationsEnabled(false);
        }
    };

    const handleTimeChange = async (index, event, selectedTime) => {
        if (Platform.OS === 'android') {
            const newPickers = { ...showTimePickers };
            delete newPickers[index];
            setShowTimePickers(newPickers);
        }
        
        if (selectedTime && event.type !== 'dismissed') {
            const newTimes = [...reminderTimes];
            newTimes[index] = selectedTime;
            setReminderTimes(newTimes);
            
            if (notificationsEnabled) {
                const times = newTimes.map(time => ({
                    hour: time.getHours(),
                    minute: time.getMinutes()
                }));
                await NotificationService.scheduleDailyReminder(times);
                await NotificationService.saveNotificationPrefs({ enabled: true, times });
            }
        }
    };

    const addReminder = async () => {
        if (reminderTimes.length >= 3) {
            Alert.alert('Maximum Reminders', 'You can have up to 3 reminders per day.');
            return;
        }
        
        // Add new reminder 4 hours after the last one (default)
        const lastTime = reminderTimes[reminderTimes.length - 1];
        const newTime = new Date(lastTime);
        newTime.setHours(newTime.getHours() + 4);
        
        // If it would go past midnight, set to 6:00 PM
        if (newTime.getHours() >= 24) {
            newTime.setHours(18, 0);
        }
        
        const newTimes = [...reminderTimes, newTime];
        setReminderTimes(newTimes);
        
        if (notificationsEnabled) {
            const times = newTimes.map(time => ({
                hour: time.getHours(),
                minute: time.getMinutes()
            }));
            await NotificationService.scheduleDailyReminder(times);
            await NotificationService.saveNotificationPrefs({ enabled: true, times });
        }
    };

    const removeReminder = async (index) => {
        if (reminderTimes.length <= 1) {
            Alert.alert('Minimum Reminders', 'You must have at least 1 reminder.');
            return;
        }
        
        const newTimes = reminderTimes.filter((_, i) => i !== index);
        setReminderTimes(newTimes);
        
        // Close the time picker if it was open for this index
        const newPickers = { ...showTimePickers };
        delete newPickers[index];
        setShowTimePickers(newPickers);
        
        if (notificationsEnabled) {
            const times = newTimes.map(time => ({
                hour: time.getHours(),
                minute: time.getMinutes()
            }));
            await NotificationService.scheduleDailyReminder(times);
            await NotificationService.saveNotificationPrefs({ enabled: true, times });
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This will permanently remove all your data, including your profile, progress, conversations, and garden. This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await deleteAccount();
                            if (error) {
                                Alert.alert('Error', 'Failed to delete account. Please try again.');
                                console.error('Delete account error:', error);
                            } else {
                                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                                // User will be automatically signed out and redirected by AuthContext
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An unexpected error occurred.');
                            console.error('Delete account error:', error);
                        }
                    },
                },
            ]
        );
    };


    if (loading) {
        return (
            <ScreenWrapper>
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
                <Text style={styles.headerTitle}>About Me</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                    {saving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveText}>Save</Text>
                    )}
                </TouchableOpacity>
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
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <User size={18} color={Colors.primary} />
                            <Text style={styles.label}>Full Name</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={Colors.textTertiary}
                            returnKeyType="done"
                            textContentType="name"
                            accessibilityLabel="Full name"
                        />
                    </View>



                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <User size={18} color={Colors.primary} />
                            <Text style={styles.label}>Role</Text>
                        </View>
                        <View style={styles.roleContainerVertical}>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    role === 'survivor' && styles.roleOptionSelected
                                ]}
                                onPress={() => setRole('survivor')}
                            >
                                <Text style={[
                                    styles.roleText,
                                    role === 'survivor' && styles.roleTextSelected
                                ]}>Survivor</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    role === 'caregiver' && styles.roleOptionSelected
                                ]}
                                onPress={() => setRole('caregiver')}
                            >
                                <Text style={[
                                    styles.roleText,
                                    role === 'caregiver' && styles.roleTextSelected
                                ]}>Caregiver</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    role === 'medical_staff' && styles.roleOptionSelected
                                ]}
                                onPress={() => setRole('medical_staff')}
                            >
                                <Text style={[
                                    styles.roleText,
                                    role === 'medical_staff' && styles.roleTextSelected
                                ]}>Medical Staff</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Mail size={18} color={Colors.primary} />
                            <Text style={styles.label}>Email Address</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={email}
                            editable={false}
                        />
                        <Text style={styles.helperText}>Email cannot be changed</Text>
                    </View>
                </View>

                {/* Survivor: Recovery Journey */}
                {role === 'survivor' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recovery Journey</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Calendar size={18} color={Colors.primary} />
                            <Text style={styles.label}>Date of Stroke</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.input}
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
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Impairments / Challenges</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={impairments}
                            onChangeText={setImpairments}
                            placeholder="e.g. Right arm weakness, speech difficulty"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            returnKeyType="done"
                            textContentType="none"
                            accessibilityLabel="Impairments and challenges"
                        />
                        <Text style={styles.helperText}>Separate with commas</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Affected Side</Text>
                        </View>
                        <View style={styles.roleContainer}>
                            {[
                                { id: 'left', label: 'Left' },
                                { id: 'right', label: 'Right' },
                                { id: 'both', label: 'Both' },
                                { id: 'unknown', label: 'Not sure' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.roleOption,
                                        affectedSide === option.id && styles.roleOptionSelected
                                    ]}
                                    onPress={() => setAffectedSide(option.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        affectedSide === option.id && styles.roleTextSelected
                                    ]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Impairment Severity</Text>
                        </View>
                        <View style={styles.roleContainer}>
                            {[
                                { id: 'mild', label: 'Mild' },
                                { id: 'moderate', label: 'Moderate' },
                                { id: 'severe', label: 'Severe' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.roleOption,
                                        impairmentSeverity === option.id && styles.roleOptionSelected
                                    ]}
                                    onPress={() => setImpairmentSeverity(option.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        impairmentSeverity === option.id && styles.roleTextSelected
                                    ]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Target size={18} color={Colors.primary} />
                            <Text style={styles.label}>Recovery Goals</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={goals}
                            onChangeText={setGoals}
                            placeholder="What do you want to achieve?"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            returnKeyType="done"
                            textContentType="none"
                            accessibilityLabel="Recovery goals"
                        />
                    </View>
                </View>
                )}

                {/* Caregiver: Loved One's Recovery */}
                {role === 'caregiver' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loved One&apos;s Recovery</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Calendar size={18} color={Colors.primary} />
                            <Text style={styles.label}>Their Date of Stroke</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.input}
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
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Their Impairments / Challenges</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={impairments}
                            onChangeText={setImpairments}
                            placeholder="e.g. Right arm weakness, speech difficulty"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            returnKeyType="done"
                            textContentType="none"
                            accessibilityLabel="Their impairments and challenges"
                        />
                        <Text style={styles.helperText}>Separate with commas</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Their Affected Side</Text>
                        </View>
                        <View style={styles.roleContainer}>
                            {[
                                { id: 'left', label: 'Left' },
                                { id: 'right', label: 'Right' },
                                { id: 'both', label: 'Both' },
                                { id: 'unknown', label: 'Not sure' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.roleOption,
                                        affectedSide === option.id && styles.roleOptionSelected
                                    ]}
                                    onPress={() => setAffectedSide(option.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        affectedSide === option.id && styles.roleTextSelected
                                    ]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Activity size={18} color={Colors.primary} />
                            <Text style={styles.label}>Their Impairment Severity</Text>
                        </View>
                        <View style={styles.roleContainer}>
                            {[
                                { id: 'mild', label: 'Mild' },
                                { id: 'moderate', label: 'Moderate' },
                                { id: 'severe', label: 'Severe' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.roleOption,
                                        impairmentSeverity === option.id && styles.roleOptionSelected
                                    ]}
                                    onPress={() => setImpairmentSeverity(option.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        impairmentSeverity === option.id && styles.roleTextSelected
                                    ]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Target size={18} color={Colors.primary} />
                            <Text style={styles.label}>Their Recovery Goals</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={goals}
                            onChangeText={setGoals}
                            placeholder="What do they want to achieve?"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            returnKeyType="done"
                            textContentType="none"
                            accessibilityLabel="Their recovery goals"
                        />
                    </View>
                </View>
                )}

                {/* Medical Staff: Professional Information */}
                {role === 'medical_staff' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Information</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Briefcase size={18} color={Colors.primary} />
                            <Text style={styles.label}>Specialty</Text>
                        </View>
                        <View style={[styles.roleContainer, styles.medicalStaffRoleWrap]}>
                            {[
                                { id: 'occupational_therapist', label: 'Occupational Therapist (OT)' },
                                { id: 'speech_language_pathologist', label: 'Speech Language Pathologist (SLP)' },
                                { id: 'physical_therapist', label: 'Physical Therapist (PT)' },
                                { id: 'psychologist', label: 'Psychologist' },
                                { id: 'psychiatrist', label: 'Psychiatrist' },
                                { id: 'nurse', label: 'Nurse' },
                                { id: 'other', label: 'Other' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.roleOption,
                                        medicalStaffRole === option.id && styles.roleOptionSelected
                                    ]}
                                    onPress={() => setMedicalStaffRole(option.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        medicalStaffRole === option.id && styles.roleTextSelected
                                    ]} numberOfLines={1}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <Briefcase size={18} color={Colors.primary} />
                            <Text style={styles.label}>Organization / Practice</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={organization}
                            onChangeText={setOrganization}
                            placeholder="e.g. City General Hospital"
                            placeholderTextColor={Colors.textTertiary}
                            returnKeyType="done"
                            textContentType="organizationName"
                            accessibilityLabel="Organization or practice"
                        />
                    </View>
                </View>
                )}

                {/* Care Team Section (hidden for caregivers; same content is on home) */}
                {role !== 'caregiver' && (
                    <CareTeamSection
                        userId={user?.id}
                        userRole={role || 'survivor'}
                        onNavigateToCaregiver={(screen, data) => {
                            if (screen === 'accept-invitation') {
                                router.push('/caregiver/accept-invitation');
                            } else if (screen === 'survivor-progress' && data) {
                                router.push({
                                    pathname: '/caregiver/survivor-progress',
                                    params: { survivorId: data.id, survivorName: data.name },
                                });
                            }
                        }}
                    />
                )}

                {/* Health Data Sharing Section (Survivors only) */}
                {role === 'survivor' && (
                    <HealthSharingSection userId={user?.id} userRole={role} />
                )}

                {/* Notifications Section (Survivors only) */}
                {role === 'survivor' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.notificationCard}>
                        <View style={styles.notificationRow}>
                            <View style={styles.notificationInfo}>
                                <View style={styles.labelContainer}>
                                    <Bell size={18} color={Colors.primary} />
                                    <Text style={styles.notificationLabel}>Daily Exercise Reminder</Text>
                                </View>
                                <Text style={styles.notificationDescription}>
                                    Get a gentle reminder to do your exercises
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                                thumbColor={notificationsEnabled ? Colors.primary : '#f4f3f4'}
                            />
                        </View>

                        {notificationsEnabled && (
                            <View style={styles.timePickerSection}>
                                <Text style={styles.timeLabel}>Reminder Times</Text>
                                {reminderTimes.map((time, index) => (
                                    <View key={index} style={styles.reminderRow}>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => {
                                                setShowTimePickers({ ...showTimePickers, [index]: true });
                                            }}
                                        >
                                            <Text style={styles.timeButtonText}>
                                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        {reminderTimes.length > 1 && (
                                            <TouchableOpacity
                                                style={styles.deleteReminderButton}
                                                onPress={() => removeReminder(index)}
                                                accessibilityLabel="Remove reminder"
                                            >
                                                <X size={18} color={Colors.error || '#DC2626'} />
                                            </TouchableOpacity>
                                        )}
                                        
                                        {showTimePickers[index] && (
                                            <View style={styles.pickerContainer}>
                                                <DateTimePicker
                                                    value={time}
                                                    mode="time"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={(event, selectedTime) => handleTimeChange(index, event, selectedTime)}
                                                />
                                                {Platform.OS === 'ios' && (
                                                    <TouchableOpacity
                                                        style={styles.datePickerDone}
                                                        onPress={() => {
                                                            const newPickers = { ...showTimePickers };
                                                            delete newPickers[index];
                                                            setShowTimePickers(newPickers);
                                                        }}
                                                    >
                                                        <Text style={styles.datePickerDoneText}>Done</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                                
                                {reminderTimes.length < 3 && (
                                    <TouchableOpacity
                                        style={styles.addReminderButton}
                                        onPress={addReminder}
                                    >
                                        <Plus size={18} color={Colors.primary} />
                                        <Text style={styles.addReminderButtonText}>Add Another Reminder</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Management</Text>

                    <View style={styles.dangerZone}>
                        <Text style={styles.dangerWarning}>
                            Deleting your account is permanent and cannot be undone. All your data will be removed.
                        </Text>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteAccount}
                        >
                            <Trash2 size={20} color="white" />
                            <Text style={styles.deleteButtonText}>Delete My Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper >
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
    },
    saveButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors.primaryLight + '20',
        borderRadius: 20,
    },
    saveText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: Colors.text,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
    },
    disabledInput: {
        backgroundColor: Colors.surfaceHighlight,
        color: Colors.textSecondary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 6,
        marginLeft: 4,
    },
    dangerZone: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 12,
        padding: 16,
    },
    dangerWarning: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#991B1B',
        marginBottom: 16,
        lineHeight: 20,
    },
    deleteButton: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    medicalStaffRoleWrap: {
        flexWrap: 'wrap',
    },
    roleContainerVertical: {
        flexDirection: 'column',
        gap: 12,
    },
    roleOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    roleOptionSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    roleText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: Colors.text,
    },
    roleTextSelected: {
        color: 'white',
    },
    dateText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
    },
    datePlaceholder: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textTertiary,
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
    // Notification styles
    notificationCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
    },
    notificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationInfo: {
        flex: 1,
        marginRight: 12,
    },
    notificationLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: Colors.text,
    },
    notificationDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    timePickerSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    timeLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    timeButton: {
        flex: 1,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    timeButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.primary,
    },
    deleteReminderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerContainer: {
        width: '100%',
        marginTop: 8,
        alignItems: 'center',
    },
    addReminderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        borderRadius: 8,
        backgroundColor: Colors.primaryLight + '10',
        marginTop: 8,
    },
    addReminderButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
});
