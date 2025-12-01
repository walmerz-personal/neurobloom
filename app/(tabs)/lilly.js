import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { sendMessage } from '../../services/LillyService';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function Lilly() {
    const [messages, setMessages] = useState([
        { id: 1, isLilly: true, text: "Hi! I'm Lilly. How are you feeling today?" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const scrollViewRef = useRef(null);
    const router = useRouter();
    const { user } = useAuth(); // Get authenticated user

    // Load user profile on component mount
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) {
                console.log('⚠️ Lilly Chat: No user logged in');
                return;
            }

            const { profile, error } = await SupabaseService.getUserProfile(user.id);
            if (!error && profile) {
                setUserProfile(profile);
                console.log('📱 Lilly Chat: User profile loaded from Supabase');
            } else if (error) {
                console.log('⚠️ Lilly Chat: No profile found (user may not have completed onboarding)');
            }
        };
        loadProfile();
    }, [user]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsgText = inputText.trim();
        const userMsg = { id: Date.now(), isLilly: false, text: userMsgText };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            // Pass the current history (excluding the message we just added locally, as it's not in state yet)
            // Actually, we should include the new message in history for the AI? 
            // The service takes (message, history).
            // Let's format history from 'messages' state.
            const history = messages.map(m => ({
                role: m.isLilly ? 'assistant' : 'user',
                content: m.text
            }));

            const response = await sendMessage(userMsgText, history, userProfile);

            const lillyMsg = {
                id: Date.now() + 1,
                isLilly: true,
                text: response.text,
                action: response.action
            };

            setMessages(prev => [...prev, lillyMsg]);

            // Handle actions (e.g., navigation)
            if (response.action && response.action.type === 'navigate') {
                // Add a small delay before navigating so user sees the message
                // In a real app, maybe show a button instead of auto-navigating
            }

        } catch (error) {
            console.error("Error getting response:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, isLilly: true, text: "I'm having a little trouble thinking right now. Can you try again?" }]);
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
                <Text style={styles.headerTitle}>Chat with Lilly</Text>
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
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.typingText}>Lilly is typing...</Text>
                        </View>
                    )}
                </ScrollView>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    style={styles.inputContainer}
                >
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.voiceButton}>
                            <Text style={styles.voiceIcon}>🎤</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                        />

                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <Text style={styles.sendIcon}>⬆️</Text>
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
                    <Text style={styles.avatarText}>🌸</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        ...Typography.title1,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
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
        marginBottom: 16,
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
        backgroundColor: Colors.lillyAvatarStart,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    avatarText: {
        fontSize: 18,
    },
    bubble: {
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 20,
    },
    lillyBubble: {
        backgroundColor: Colors.lillyBubble,
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: Colors.userBubble,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 17,
        lineHeight: 24,
    },
    lillyText: {
        color: Colors.text,
    },
    userText: {
        color: 'white',
    },
    inputContainer: {
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 0.5,
        borderTopColor: Colors.border,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.lillyBubble,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 17,
        color: Colors.text,
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.lillyBubble,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceIcon: {
        fontSize: 20,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendIcon: {
        fontSize: 20,
        color: 'white',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 44,
        marginBottom: 10,
    },
    typingText: {
        marginLeft: 8,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    actionButton: {
        marginTop: 10,
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    actionButtonText: {
        color: Colors.primary,
        fontWeight: '600',
    }
});
