import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { sendMessage } from '../../services/LillyService';
import { transcribeAudio } from '../../services/TranscriptionService';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { getLillyGreeting } from '../../constants/lillyGreetings';
import { EXERCISES_DATA } from './exercises';
import { Send, Mic, Flower2, User } from 'lucide-react-native';

const builtInIdToTitle = Object.fromEntries((EXERCISES_DATA || []).map((e) => [e.id, e.title]));

export default function Lilly() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [lillyContext, setLillyContext] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const scrollViewRef = useRef(null);
    const router = useRouter();
    const { user, userData } = useAuth();

    // Use the new expo-audio hook for recording
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);

    // Load user profile
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) return;
            const { profile, error } = await SupabaseService.getUserProfile(user.id);
            if (!error && profile) {
                setUserProfile(profile);
            }
        };
        loadProfile();
    }, [user]);

    // Load rich context for Lilly (today's log, recent logs, assigned exercises with readable names)
    useEffect(() => {
        const loadLillyContext = async () => {
            if (!user?.id) return;
            try {
                const [todayResult, logsResult, assignedResult, customResult] = await Promise.all([
                    SupabaseService.getTodayLog(user.id),
                    SupabaseService.getDailyLogs(user.id, 14),
                    SupabaseService.getAssignedExercises(user.id, 'assigned'),
                    SupabaseService.getCustomExercises(user.id),
                ]);
                const customList = customResult?.data ?? [];
                const customIdToTitle = Object.fromEntries(customList.map((e) => [e.id, e.title || 'Custom exercise']));
                const rawAssigned = assignedResult.error ? [] : (assignedResult.data ?? []);
                const assignedExercises = rawAssigned.map((a) => ({
                    ...a,
                    exercise_name: a.exercise_type === 'built_in'
                        ? (builtInIdToTitle[a.exercise_id] || a.exercise_id)
                        : (customIdToTitle[a.exercise_id] || 'Custom exercise'),
                }));
                setLillyContext({
                    userName: userData?.name ?? null,
                    role: userData?.role ?? 'survivor',
                    todayLog: todayResult.error ? null : todayResult.log,
                    recentLogs: logsResult.error ? [] : (logsResult.logs ?? []),
                    assignedExercises,
                });
            } catch (e) {
                setLillyContext(null);
            }
        };
        loadLillyContext();
    }, [user?.id, userData?.name, userData?.role]);

    // Check if this is the user's first interaction with Lilly
    useEffect(() => {
        const checkFirstTimeUser = async () => {
            if (!user?.id) return;

            const role = userData?.role ?? 'survivor';
            const firstName = (userData?.name && typeof userData.name === 'string') ? userData.name.trim().split(/\s+/)[0] : null;

            try {
                const storageKey = `LILLY_INTRO_SHOWN_${user.id}`;
                const hasSeenIntro = await AsyncStorage.getItem(storageKey);
                const isFirstTime = !hasSeenIntro;

                if (!hasSeenIntro) {
                    // First-time user - show full introduction
                    const introMessage = {
                        id: 1,
                        isLilly: true,
                        text: getLillyGreeting(role, true, firstName),
                    };
                    setMessages([introMessage]);

                    // Mark introduction as shown
                    await AsyncStorage.setItem(storageKey, 'true');
                    console.log('✅ Lilly introduction shown and saved to AsyncStorage');
                } else {
                    // Returning user - show simple greeting
                    const simpleGreeting = {
                        id: 1,
                        isLilly: true,
                        text: getLillyGreeting(role, false, firstName),
                    };
                    setMessages([simpleGreeting]);
                    console.log('✅ Returning user - simple greeting shown');
                }
            } catch (error) {
                console.error('❌ Error checking first-time user status:', error);
                // Fallback to simple greeting on error
                const fallbackMessage = {
                    id: 1,
                    isLilly: true,
                    text: getLillyGreeting(role, false, firstName),
                };
                setMessages([fallbackMessage]);
            }
        };

        checkFirstTimeUser();
    }, [user, userData]);

    // Request permissions on mount
    useEffect(() => {
        const requestPermissions = async () => {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            setPermissionGranted(status.granted);
            if (status.granted) {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    allowsRecording: true,
                });
            }
        };
        requestPermissions();
    }, []);

    const startRecording = async () => {
        try {
            if (!permissionGranted) {
                Alert.alert(
                    'Permission Required',
                    'Please allow microphone access to use voice input.',
                    [{ text: 'OK' }]
                );
                return;
            }

            console.log('🎤 Starting recording...');
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
            console.log('✅ Recording started');
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        try {
            console.log('🎤 Stopping recording...');

            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            console.log('✅ Recording stopped, URI:', uri);

            if (!uri) {
                console.error('❌ No audio URI after stopping recording');
                Alert.alert('Error', 'Failed to save recording. Please try again.');
                return;
            }

            setIsTranscribing(true);
            console.log('🎤 Transcribing audio...');

            const { text, error } = await transcribeAudio(uri);

            setIsTranscribing(false);

            if (error) {
                console.error('❌ Transcription failed:', error);
                Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
                return;
            }

            if (text) {
                console.log('✅ Transcription successful:', text);
                setInputText(text);
            } else {
                console.warn('⚠️ Transcription returned empty text');
                Alert.alert('Error', 'No text was transcribed from the recording. Please try again.');
            }
        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
            setIsTranscribing(false);
            Alert.alert('Error', 'Failed to process recording. Please try again.');
        }
    };

    const handleVoicePress = () => {
        if (recorderState.isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsgText = inputText.trim();
        const userMsg = { id: Date.now(), isLilly: false, text: userMsgText };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const history = messages.map(m => ({
                role: m.isLilly ? 'assistant' : 'user',
                content: m.text
            }));

            const response = await sendMessage(userMsgText, history, userProfile, lillyContext);

            // LillyService always returns a valid response object with helpful fallback messages
            // It never throws - it handles all errors internally and returns helpful messages
            const lillyMsg = {
                id: Date.now() + 1,
                isLilly: true,
                text: response.text,
                action: response.action
            };

            setMessages(prev => [...prev, lillyMsg]);

            if (response.action && response.action.type === 'navigate') {
                // Handle navigation if needed
            }

        } catch (error) {
            // This should only catch true network errors (extremely rare - usually means no internet at all)
            console.error("Critical network error in Lilly chat:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                isLilly: true,
                text: "I'm having trouble connecting right now. Please check your internet connection and try again."
            }]);
        } finally {
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleAction = (action) => {
        if (action.type === 'navigate') {
            router.push(action.target);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Chat with Lilly</Text>
                    <Image
                        source={require('../../assets/images/lilly-character.png')}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                </View>
            </View>

            <View style={styles.container}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messages}
                    contentContainerStyle={styles.messagesContent}
                >
                    {messages.map((msg) => (
                        <Message
                            key={msg.id}
                            isLilly={msg.isLilly}
                            text={msg.text}
                            action={msg.action}
                            onActionPress={() => handleAction(msg.action)}
                        />
                    ))}
                    {isTyping && (
                        <View style={styles.typingContainer}>
                            <View style={styles.typingBubble}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                            <Text style={styles.typingText}>Lilly is typing...</Text>
                        </View>
                    )}
                </ScrollView>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={styles.inputContainer}
                >
                    {isTranscribing && (
                        <View style={styles.transcribingIndicator}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.transcribingText}>Transcribing...</Text>
                        </View>
                    )}
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.voiceButton,
                                recorderState.isRecording && styles.voiceButtonRecording
                            ]}
                            onPress={handleVoicePress}
                            disabled={isTranscribing}
                        >
                            {recorderState.isRecording ? (
                                <View style={styles.recordingIndicator} />
                            ) : (
                                <Mic size={20} color={isTranscribing ? Colors.textTertiary : Colors.textSecondary} />
                            )}
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder={recorderState.isRecording ? "Recording..." : "Type a message..."}
                            placeholderTextColor={Colors.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                            editable={!recorderState.isRecording && !isTranscribing}
                            textContentType="none"
                            accessibilityLabel="Message input"
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || recorderState.isRecording || isTranscribing}
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </ScreenWrapper>
    );
}

function Message({ isLilly, text, action, onActionPress }) {
    return (
        <View style={[styles.messageRow, isLilly ? styles.lillyRow : styles.userRow]}>
            {isLilly && (
                <View style={styles.avatar}>
                    <Image
                        source={require('../../assets/images/lilly-character.png')}
                        style={{ width: '100%', height: '100%', borderRadius: 18 }}
                        resizeMode="cover"
                    />
                </View>
            )}
            <View style={[styles.bubble, isLilly ? styles.lillyBubble : styles.userBubble]}>
                <Text style={[styles.messageText, isLilly ? styles.lillyText : styles.userText]}>
                    {text}
                </Text>
                {action && action.type === 'navigate' && (
                    <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
                        <Text style={styles.actionButtonText}>
                            Go to {action.target.charAt(0).toUpperCase() + action.target.slice(1)}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        textAlign: 'center',
    },
    headerImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Colors.background,
    },
    messages: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 40,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    lillyRow: {
        justifyContent: 'flex-start',
        marginRight: 40,
    },
    userRow: {
        justifyContent: 'flex-end',
        marginLeft: 40,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        maxWidth: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    lillyBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 24,
    },
    lillyText: {
        color: Colors.text,
    },
    userText: {
        color: 'white',
    },
    inputContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
        maxHeight: 100,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceButtonRecording: {
        backgroundColor: '#FEE2E2',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
    },
    transcribingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    transcribingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.textTertiary,
        shadowOpacity: 0,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 48,
        marginBottom: 10,
    },
    typingBubble: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    typingText: {
        fontFamily: 'Inter_400Regular',
        color: Colors.textSecondary,
        fontSize: 13,
    },
    actionButton: {
        marginTop: 12,
        backgroundColor: Colors.surfaceHighlight,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionButtonText: {
        fontFamily: 'Inter_600SemiBold',
        color: Colors.primary,
        fontSize: 14,
    }
});
