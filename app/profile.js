import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Switch, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { ArrowLeft, Save, User, Calendar, Activity, Target, Mail, Trash2, Bell } from 'lucide-react-native';
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
    const [goals, setGoals] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Notification State
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // On by default
    const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 8, 30)); // Default 8:30 AM
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        loadProfile();
        loadNotificationPrefs();
    }, [user]);

    const loadNotificationPrefs = async () => {
        const prefs = await NotificationService.loadNotificationPrefs();
        if (prefs) {
            // User has saved preferences, use them
            setNotificationsEnabled(prefs.enabled);
            if (prefs.hour !== undefined && prefs.minute !== undefined) {
                setReminderTime(new Date(2000, 0, 1, prefs.hour, prefs.minute));
            }
        } else {
            // First time - enable notifications by default
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                await NotificationService.scheduleDailyReminder(8, 30);
                await NotificationService.saveNotificationPrefs({ enabled: true, hour: 8, minute: 30 });
                setNotificationsEnabled(true);
            } else {
                setNotificationsEnabled(false);
            }
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
                setGoals(profile.goals || '');
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

            // Update Profile Data
            const profileUpdates = {
                strokeDate,
                impairments: impairments.split(',').map(i => i.trim()).filter(i => i),
                goals
            };
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
            // Schedule the reminder
            const hour = reminderTime.getHours();
            const minute = reminderTime.getMinutes();
            await NotificationService.scheduleDailyReminder(hour, minute);
            await NotificationService.saveNotificationPrefs({ enabled: true, hour, minute });
            setNotificationsEnabled(true);
        } else {
            // Cancel all reminders
            await NotificationService.cancelAllReminders();
            await NotificationService.saveNotificationPrefs({ enabled: false, hour: reminderTime.getHours(), minute: reminderTime.getMinutes() });
            setNotificationsEnabled(false);
        }
    };

    const handleTimeChange = async (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedTime && event.type !== 'dismissed') {
            setReminderTime(selectedTime);
            if (notificationsEnabled) {
                const hour = selectedTime.getHours();
                const minute = selectedTime.getMinutes();
                await NotificationService.scheduleDailyReminder(hour, minute);
                await NotificationService.saveNotificationPrefs({ enabled: true, hour, minute });
            }
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

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
                        />
                    </View>



                    <View style={styles.inputGroup}>
                        <View style={styles.labelContainer}>
                            <User size={18} color={Colors.primary} />
                            <Text style={styles.label}>Role</Text>
                        </View>
                        <View style={styles.roleContainer}>
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
                        />
                        <Text style={styles.helperText}>Separate with commas</Text>
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
                        />
                    </View>
                </View>

                {/* Care Team Section */}
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

                {/* Health Data Sharing Section (Survivors only) */}
                {role === 'survivor' && (
                    <HealthSharingSection userId={user?.id} userRole={role} />
                )}

                {/* Notifications Section */}
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
                                <Text style={styles.timeLabel}>Reminder Time</Text>
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.timeButtonText}>
                                        {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={reminderTime}
                                        mode="time"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleTimeChange}
                                    />
                                )}
                                {Platform.OS === 'ios' && showTimePicker && (
                                    <TouchableOpacity
                                        style={styles.datePickerDone}
                                        onPress={() => setShowTimePicker(false)}
                                    >
                                        <Text style={styles.datePickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>

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
        marginBottom: 8,
    },
    timeButton: {
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
});
