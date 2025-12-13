// components/KudosReceivedModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { KudosService } from '../services/KudosService';
import { Heart, Sparkles } from 'lucide-react-native';

export function KudosReceivedModal({
    visible,
    onClose,
    kudosList = [],
    onDismiss
}) {
    const handleCelebrate = async () => {
        onDismiss?.();
        onClose();
    };

    if (!kudosList.length) return null;

    const firstKudos = kudosList[0];
    const otherCount = kudosList.length - 1;
    const caregiverName = firstKudos.caregiver?.name?.split(' ')[0] || 'Someone';
    const label = KudosService.getItemTypeLabel(firstKudos.item_type);
    const emoji = KudosService.getItemTypeEmoji(firstKudos.item_type);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleCelebrate}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Celebration Header */}
                    <View style={styles.celebrationContainer}>
                        <View style={styles.sparkleLeft}>
                            <Sparkles size={24} color={Colors.warning} />
                        </View>
                        <View style={styles.heartBurst}>
                            <Heart size={48} color={Colors.bloomMagenta} fill={Colors.bloomMagenta} />
                        </View>
                        <View style={styles.sparkleRight}>
                            <Sparkles size={24} color={Colors.bloomMagenta} />
                        </View>
                    </View>

                    <Text style={styles.title}>You got a Kudos! 🎉</Text>

                    <View style={styles.kudosCard}>
                        <Text style={styles.fromText}>
                            <Text style={styles.caregiverName}>{caregiverName}</Text> sent you encouragement for your
                        </Text>
                        <View style={styles.achievementRow}>
                            <Text style={styles.achievementEmoji}>{emoji}</Text>
                            <Text style={styles.achievementText}>
                                {firstKudos.item_value ? `${firstKudos.item_value} ` : ''}{label}!
                            </Text>
                        </View>
                    </View>

                    {otherCount > 0 && (
                        <Text style={styles.moreText}>
                            + {otherCount} more kudos waiting for you!
                        </Text>
                    )}

                    <Text style={styles.encouragement}>Keep up the amazing work! 💪</Text>

                    <TouchableOpacity
                        style={styles.celebrateButton}
                        onPress={handleCelebrate}
                    >
                        <Text style={styles.celebrateButtonText}>Celebrate! ✨</Text>
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
    heartBurst: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.bloomMagenta + '20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.bloomMagenta + '40',
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 26,
        color: Colors.primary,
        marginBottom: 20,
    },
    kudosCard: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    fromText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 24,
    },
    caregiverName: {
        fontFamily: 'Inter_700Bold',
        color: Colors.bloomMagenta,
    },
    achievementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    achievementEmoji: {
        fontSize: 28,
    },
    achievementText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.primary,
    },
    moreText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.bloomMagenta,
        marginBottom: 16,
    },
    encouragement: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    celebrateButton: {
        backgroundColor: Colors.bloomMagenta,
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.bloomMagenta,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    celebrateButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: 'white',
    },
});
