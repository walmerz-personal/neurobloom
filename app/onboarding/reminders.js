import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { NotificationService } from '../../services/NotificationService';
import { Bell, Plus, X } from 'lucide-react-native';

export default function Reminders() {
    const router = useRouter();
    const [reminderTimes, setReminderTimes] = useState([
        new Date(2000, 0, 1, 8, 30),  // 8:30 AM
        new Date(2000, 0, 1, 12, 30), // 12:30 PM
    ]);
    const [showTimePickers, setShowTimePickers] = useState({});
    const [loading, setLoading] = useState(false);

    const handleTimeChange = (index, event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowTimePickers({ ...showTimePickers, [index]: false });
        }
        
        if (selectedTime && event.type !== 'dismissed') {
            const newTimes = [...reminderTimes];
            newTimes[index] = selectedTime;
            setReminderTimes(newTimes);
        }
    };

    const addReminder = () => {
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
        
        setReminderTimes([...reminderTimes, newTime]);
    };

    const removeReminder = (index) => {
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
    };

    const handleContinue = async () => {
        setLoading(true);
        try {
            // Request notification permissions
            const hasPermission = await NotificationService.requestPermissions();
            
            if (!hasPermission) {
                Alert.alert(
                    'Notifications Disabled',
                    'To receive daily reminders, please enable notifications in your device Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Open Settings', 
                            onPress: () => {
                                const { Linking } = require('react-native');
                                Linking.openSettings();
                            }
                        }
                    ]
                );
                setLoading(false);
                return;
            }

            // Convert Date objects to {hour, minute} format
            const times = reminderTimes.map(time => ({
                hour: time.getHours(),
                minute: time.getMinutes()
            }));

            // Schedule reminders
            await NotificationService.scheduleDailyReminder(times);
            
            // Save preferences
            await NotificationService.saveNotificationPrefs({
                enabled: true,
                times
            });

            // Navigate to completion screen
            router.replace('/onboarding/completion');
        } catch (error) {
            console.error('Error setting up reminders:', error);
            Alert.alert('Error', 'Failed to set up reminders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        // Still request permissions but don't schedule reminders
        await NotificationService.requestPermissions();
        router.replace('/onboarding/completion');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Bell size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>Daily Exercise Reminders</Text>
                        <Text style={styles.subtitle}>
                            When would you like to be reminded to exercise?
                        </Text>
                    </View>

                    <View style={styles.remindersContainer}>
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
                                        style={styles.deleteButton}
                                        onPress={() => removeReminder(index)}
                                        accessibilityLabel="Remove reminder"
                                    >
                                        <X size={20} color={Colors.error || '#DC2626'} />
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
                                                style={styles.pickerDone}
                                                onPress={() => {
                                                    const newPickers = { ...showTimePickers };
                                                    delete newPickers[index];
                                                    setShowTimePickers(newPickers);
                                                }}
                                            >
                                                <Text style={styles.pickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}

                        {reminderTimes.length < 3 && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addReminder}
                            >
                                <Plus size={20} color={Colors.primary} />
                                <Text style={styles.addButtonText}>Add Another Reminder</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            You can always change these reminder times in your Profile settings.
                        </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <PrimaryButton
                            title={loading ? 'Setting up...' : 'Continue'}
                            onPress={handleContinue}
                            disabled={loading}
                        />
                        <TouchableOpacity 
                            style={styles.skipButton} 
                            onPress={handleSkip}
                            disabled={loading}
                        >
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 150,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        ...Typography.title2,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    remindersContainer: {
        marginBottom: 24,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    timeButton: {
        flex: 1,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeButtonText: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.primary,
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerContainer: {
        width: '100%',
        marginTop: 8,
        alignItems: 'center',
    },
    pickerDone: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    pickerDoneText: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.primary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: Colors.primaryLight + '10',
    },
    addButtonText: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.primary,
    },
    infoBox: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 32,
    },
    infoText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    buttonContainer: {
        marginTop: 8,
        marginBottom: 40,
    },
    skipButton: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    skipButtonText: {
        fontSize: 17,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
