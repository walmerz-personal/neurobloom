// components/ResourceCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { ChevronRight, BookOpen } from 'lucide-react-native';

/**
 * ResourceCard - Simple card for displaying a resource article
 * Props: title, snippet, onPress
 */
export function ResourceCard({ title, snippet, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.iconContainer}>
                <BookOpen size={20} color={Colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.snippet} numberOfLines={2}>{snippet}</Text>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
        marginBottom: 4,
    },
    snippet: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});

export default ResourceCard;
