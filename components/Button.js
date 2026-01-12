import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const PrimaryButton = ({ title, onPress, style }) => (
    <TouchableOpacity style={[styles.primaryButton, style]} onPress={onPress} accessible={true} accessibilityRole="button">
        <Text style={styles.primaryButtonText}>{title}</Text>
    </TouchableOpacity>
);

export const SecondaryButton = ({ title, onPress, style }) => (
    <TouchableOpacity style={[styles.secondaryButton, style]} onPress={onPress} accessible={true} accessibilityRole="button">
        <Text style={styles.secondaryButtonText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    primaryButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginTop: 12,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: Colors.lillyBubble,
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
});
