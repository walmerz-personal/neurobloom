// components/NudgeReceivedModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Bell, Sparkles } from 'lucide-react-native';

export function NudgeReceivedModal({
    visible,
    onClose,
    nudgesList = [],
    onDismiss
}) {
    const handleAcknowledge = async () => {
        onDismiss?.();
        onClose();
    };

    if (!nudgesList.length) return null;

    const firstNudge = nudgesList[0];
    const otherCount = nudgesList.length - 1;
    const senderName = firstNudge.sender?.name || 'Someone';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleAcknowledge}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header with Icon */}
                    <View style={styles.celebrationContainer}>
                        <View style={styles.sparkleLeft}>
                            <Sparkles size={24} color={Colors.warning} />
                        </View>
                        <View style={styles.iconBurst}>
                            <Text style={styles.nudgeEmoji}>{firstNudge.emoji || '💪'}</Text>
                        </View>
                        <View style={styles.sparkleRight}>
                            <Sparkles size={24} color={Colors.primary} />
                        </View>
                    </View>

                    <Text style={styles.title}>You've got a nudge!</Text>

                    <View style={styles.nudgeCard}>
                        <Text style={styles.fromText}>
                            <Text style={styles.senderName}>{senderName}</Text> just sent you a message:
                        </Text>
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>
                                "{firstNudge.message}"
                            </Text>
                        </View>
                    </View>

                    {otherCount > 0 && (
                        <Text style={styles.moreText}>
                            + {otherCount} more {otherCount === 1 ? 'nudge' : 'nudges'} waiting for you!
                        </Text>
                    )}

                    <Text style={styles.encouragement}>Your care team believes in you! 💙</Text>

                    <TouchableOpacity
                        style={styles.acknowledgeButton}
                        onPress={handleAcknowledge}
                    >
                        <Text style={styles.acknowledgeButtonText}>Got it! 💪</Text>
                    </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 24,
    },
    modal: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    celebrationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    sparkleLeft: {
        marginRight: 12,
        transform: [{ rotate: '-15deg' }],
    },
    sparkleRight: {
        marginLeft: 12,
        transform: [{ rotate: '15deg' }],
    },
    iconBurst: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.primary + '40',
    },
    nudgeEmoji: {
        fontSize: 40,
    },
    title: {
        fontFamily: 'SourceSans3_600SemiBold',
        fontSize: 26,
        color: Colors.primary,
        marginBottom: 20,
    },
    nudgeCard: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    fromText: {
        fontFamily: 'SourceSans3_400Regular',
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 12,
    },
    senderName: {
        fontFamily: 'SourceSans3_600SemiBold',
        color: Colors.primary,
    },
    messageContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    messageText: {
        fontFamily: 'SourceSans3_400Regular',
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    moreText: {
        fontFamily: 'SourceSans3_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
        marginBottom: 16,
    },
    encouragement: {
        fontFamily: 'SourceSans3_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    acknowledgeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    acknowledgeButtonText: {
        fontFamily: 'SourceSans3_600SemiBold',
        fontSize: 18,
        color: 'white',
    },
});
