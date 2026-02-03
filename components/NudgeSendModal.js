// components/NudgeSendModal.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { X, Send } from 'lucide-react-native';
import { NudgeService } from '../services/NudgeService';

export function NudgeSendModal({
    visible,
    onClose,
    senderId,
    senderName,
    survivorId,
    survivorName,
    onNudgeSent,
}) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    const MAX_MESSAGE_LENGTH = 150;

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setCustomMessage(''); // Clear custom message when selecting a template
    };

    const handleCustomMessageChange = (text) => {
        if (text.length <= MAX_MESSAGE_LENGTH) {
            setCustomMessage(text);
            setSelectedTemplate(null); // Clear template selection when typing custom message
        }
    };

    const handleSendNudge = async () => {
        // Determine which message to send
        const message = selectedTemplate ? selectedTemplate.message : customMessage.trim();
        const emoji = selectedTemplate ? selectedTemplate.emoji : '💪';

        if (!message) {
            Alert.alert('Error', 'Please select a template or write a custom message.');
            return;
        }

        setSending(true);

        try {
            const nudgeData = {
                type: selectedTemplate ? 'template' : 'custom',
                templateId: selectedTemplate?.id || null,
                message,
                emoji,
            };

            const { success, error } = await NudgeService.sendNudge(
                senderId,
                senderName,
                survivorId,
                nudgeData
            );

            if (success) {
                Alert.alert(
                    'Nudge Sent! 🌟',
                    `Your nudge was sent to ${survivorName}. They'll receive a notification shortly.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Reset and close
                                setSelectedTemplate(null);
                                setCustomMessage('');
                                onClose();
                                if (onNudgeSent) {
                                    onNudgeSent();
                                }
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', error || 'Failed to send nudge. Please try again.');
            }
        } catch (error) {
            console.error('Error sending nudge:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const canSend = (selectedTemplate !== null || customMessage.trim().length > 0) && !sending;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Send Nudge</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Subtitle */}
                        <Text style={styles.subtitle}>
                            Send a gentle reminder to {survivorName} to help them stay on track.
                        </Text>

                        {/* Template Options */}
                        <Text style={styles.sectionTitle}>Choose a Message</Text>
                        {NudgeService.NUDGE_TEMPLATES.map((template) => (
                            <TouchableOpacity
                                key={template.id}
                                style={[
                                    styles.templateCard,
                                    selectedTemplate?.id === template.id && styles.templateCardSelected,
                                ]}
                                onPress={() => handleTemplateSelect(template)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.templateEmoji}>{template.emoji}</Text>
                                <Text
                                    style={[
                                        styles.templateMessage,
                                        selectedTemplate?.id === template.id && styles.templateMessageSelected,
                                    ]}
                                >
                                    {template.message}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Custom Message Option */}
                        <Text style={styles.sectionTitle}>Or Write Your Own</Text>
                        <View style={styles.customMessageContainer}>
                            <TextInput
                                style={styles.customMessageInput}
                                placeholder="Type your custom nudge message here..."
                                placeholderTextColor={Colors.textSecondary}
                                value={customMessage}
                                onChangeText={handleCustomMessageChange}
                                multiline
                                maxLength={MAX_MESSAGE_LENGTH}
                                textAlignVertical="top"
                            />
                            <Text style={styles.characterCount}>
                                {customMessage.length}/{MAX_MESSAGE_LENGTH}
                            </Text>
                        </View>

                        {/* Preview */}
                        {(selectedTemplate || customMessage.trim()) && (
                            <View style={styles.previewSection}>
                                <Text style={styles.previewLabel}>Preview:</Text>
                                <View style={styles.previewCard}>
                                    <Text style={styles.previewTitle}>
                                        Nudge from {senderName}{' '}
                                        {selectedTemplate ? selectedTemplate.emoji : '💪'}
                                    </Text>
                                    <Text style={styles.previewMessage}>
                                        {selectedTemplate ? selectedTemplate.message : customMessage}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Send Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                            onPress={handleSendNudge}
                            disabled={!canSend}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Send size={20} color="white" />
                                    <Text style={styles.sendButtonText}>Send Nudge</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 12,
        marginTop: 8,
    },
    templateCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    templateCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    templateEmoji: {
        fontSize: 24,
    },
    templateMessage: {
        ...Typography.body,
        color: Colors.text,
        flex: 1,
    },
    templateMessageSelected: {
        fontFamily: 'Inter_600SemiBold',
    },
    customMessageContainer: {
        marginBottom: 16,
    },
    customMessageInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.text,
        minHeight: 100,
    },
    characterCount: {
        ...Typography.caption1,
        color: Colors.textSecondary,
        textAlign: 'right',
        marginTop: 4,
    },
    previewSection: {
        marginTop: 24,
        marginBottom: 16,
    },
    previewLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    previewCard: {
        backgroundColor: Colors.primary + '15',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    previewTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
        marginBottom: 8,
    },
    previewMessage: {
        ...Typography.body,
        color: Colors.text,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    sendButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.textSecondary,
        opacity: 0.5,
    },
    sendButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
});
