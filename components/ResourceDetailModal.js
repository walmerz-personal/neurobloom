// components/ResourceDetailModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors } from '../constants/Colors';
import { X } from 'lucide-react-native';

/**
 * ResourceDetailModal - Full-screen modal for displaying resource content
 */
export function ResourceDetailModal({ visible, onClose, title, content }) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.contentText}>{content}</Text>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        fontSize: 18,
        color: Colors.text,
        flex: 1,
        marginRight: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    contentText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.text,
        lineHeight: 26,
    },
});

export default ResourceDetailModal;
