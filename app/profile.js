import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { ArrowLeft, Save, User, Calendar, Activity, Target, Mail, Trash2 } from 'lucide-react-native';

export default function Profile() {
    const router = useRouter();
    const { user, deleteAccount } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [strokeDate, setStrokeDate] = useState('');
    const [impairments, setImpairments] = useState('');
    const [goals, setGoals] = useState('');

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // Fetch basic user data (name, email)
            const { user: userData, error: userError } = await SupabaseService.getUserData(user.id);
            if (userData) {
                setName(userData.name || '');
                setEmail(userData.email || '');
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
            await SupabaseService.updateUserData(user.id, { name });

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
                        <TextInput
                            style={styles.input}
                            value={strokeDate}
                            onChangeText={setStrokeDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Colors.textTertiary}
                        />
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
        </ScreenWrapper>
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
});
