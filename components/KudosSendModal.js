// components/KudosSendModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Heart, Send } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { KudosService } from '../services/KudosService';

export function KudosSendModal({
    visible,
    onClose,
    caregiverId,
    survivorId,
    survivorName,
    itemType,
    itemValue,
    itemDate,
    onSuccess
}) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendKudos = async () => {
        setSending(true);
        const { error } = await KudosService.sendKudos(
            caregiverId,
            survivorId,
            itemType,
            itemValue,
            itemDate
        );
        setSending(false);

        if (!error) {
            setSent(true);
            setTimeout(() => {
                setSent(false);
                onSuccess?.();
                onClose();
            }, 1500);
        }
    };

    const handleClose = () => {
        setSent(false);
        onClose();
    };

    const label = KudosService.getItemTypeLabel(itemType);
    const emoji = KudosService.getItemTypeEmoji(itemType);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {!sent ? (
                        <>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
                                <X size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.heartContainer}>
                                <Heart size={48} color={Colors.bloomMagenta} fill={Colors.bloomMagenta} />
                            </View>

                            <Text style={styles.title}>Send Kudos! 💜</Text>

                            <Text style={styles.message}>
                                Encourage {survivorName?.split(' ')[0] || 'them'} for their
                            </Text>

                            <View style={styles.achievementBadge}>
                                <Text style={styles.achievementEmoji}>{emoji}</Text>
                                <Text style={styles.achievementText}>
                                    {itemValue ? `${itemValue} ` : ''}{label}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendKudos}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Send size={20} color="white" />
                                        <Text style={styles.sendButtonText}>Send Kudos</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.successContainer}>
                            <Text style={styles.successEmoji}>🎉</Text>
                            <Text style={styles.successText}>Kudos Sent!</Text>
                            <Text style={styles.successSubtext}>
                                {survivorName?.split(' ')[0] || 'They'} will see this next time they open the app
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 24,
    },
    modal: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    heartContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.bloomMagenta + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginBottom: 8,
    },
    message: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    achievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceHighlight,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 24,
        gap: 8,
    },
    achievementEmoji: {
        fontSize: 24,
    },
    achievementText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.primary,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.bloomMagenta,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        gap: 8,
    },
    sendButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
    cancelButton: {
        marginTop: 16,
        padding: 8,
    },
    cancelText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    successText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginBottom: 8,
    },
    successSubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
