import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X } from 'lucide-react-native';


export function SeedBankModal({ visible, onClose, inventory }) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>

                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Seed Bank</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#5D4037" />
                        </TouchableOpacity>
                    </View>

                    {inventory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No seeds yet!</Text>
                            <Text style={styles.emptySubText}>Visit the shop to get some seeds.</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                            {inventory.map((item, index) => (
                                <View key={index} style={styles.itemContainer}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.items.name}</Text>
                                        <Text style={styles.itemDescription}>{item.items.description}</Text>
                                    </View>
                                    <View style={styles.quantityBadge}>
                                        <Text style={styles.quantityText}>x{item.quantity}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        maxHeight: '70%',
        backgroundColor: '#FFF8E1', // Light cream background
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 4,
        borderColor: '#8D6E63',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#4E342E',
    },
    closeButton: {
        padding: 4,
    },
    list: {
        width: '100%',
    },
    listContent: {
        gap: 12,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D7CCC8',
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#3E2723',
        marginBottom: 4,
    },
    itemDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#795548',
    },
    quantityBadge: {
        backgroundColor: '#8D6E63', // Matches the seed icon color
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    quantityText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#5D4037',
        marginBottom: 8,
    },
    emptySubText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#795548',
        textAlign: 'center',
    },
});
