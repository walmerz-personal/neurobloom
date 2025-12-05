import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { sendMessage } from '../../services/LillyService';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Mic, Flower2, User } from 'lucide-react-native';

export default function Lilly() {
    const [messages, setMessages] = useState([
        { id: 1, isLilly: true, text: "Hi! I'm Lilly. How are you feeling today?" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const scrollViewRef = useRef(null);
    const router = useRouter();
    const { user } = useAuth();

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

            const response = await sendMessage(userMsgText, history, userProfile);

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
                            <View style={styles.typingBubble}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
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
                            <Mic size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
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
                    <Flower2 size={20} color="white" />
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
        paddingVertical: 16,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        textAlign: 'center',
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
