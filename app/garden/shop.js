import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { Coins, ArrowLeft } from 'lucide-react-native';

export default function ShopScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const { points: userPoints } = await SupabaseService.getUserPoints(user.id);
            setPoints(userPoints);

            const { items: shopItems } = await SupabaseService.getItems();
            setItems(shopItems || []);
        } catch (error) {
            console.error('Error fetching shop data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item) => {
        if (points < item.cost) {
            Alert.alert('Insufficient Points', `You need ${item.cost - points} more points to buy this.`);
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Buy ${item.name} for ${item.cost} points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    onPress: async () => {
                        const { success, error } = await SupabaseService.buyItem(user.id, item.id, item.cost);
                        if (success) {
                            Alert.alert('Success', `You bought a ${item.name} seed!`);
                            fetchData(); // Refresh points
                        } else {
                            Alert.alert('Error', error?.message || 'Failed to purchase item.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemIcon}>
                {/* Placeholder for item image */}
                <Text style={{ fontSize: 32 }}>🌱</Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemDuration}>Grows in {item.growth_duration_hours} hours</Text>
            </View>
            <TouchableOpacity
                style={[styles.buyButton, points < item.cost && styles.disabledButton]}
                onPress={() => handleBuy(item)}
                disabled={points < item.cost}
            >
                <Text style={styles.buyButtonText}>{item.cost}</Text>
                <Coins size={14} color={points < item.cost ? Colors.textTertiary : "white"} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seed Shop</Text>
                <View style={styles.pointsContainer}>
                    <Coins size={16} color={Colors.primary} />
                    <Text style={styles.pointsText}>{points}</Text>
                </View>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No seeds available right now.</Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceHighlight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    listContent: {
        padding: 20,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    itemIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    itemDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    itemDuration: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textTertiary,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledButton: {
        backgroundColor: Colors.border,
    },
    buyButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
