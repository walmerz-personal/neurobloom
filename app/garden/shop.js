import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { Coins, ArrowLeft } from 'lucide-react-native';

const BuyButton = ({ item, userPoints, onBuy }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const canBuy = userPoints >= item.cost;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const triggerSuccessAnimation = () => {
        // Sequence: Scale up, then back to normal with a bit of a bounce
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 150,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePress = () => {
        onBuy(item, triggerSuccessAnimation);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canBuy}
            activeOpacity={0.9}
        >
            <Animated.View
                style={[
                    styles.buyButton,
                    !canBuy && styles.disabledButton,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <Text style={styles.buyButtonText}>{item.cost}</Text>
                <Coins size={14} color={!canBuy ? Colors.textTertiary : "white"} />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function ShopScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [points, setPoints] = useState(0);
    const [hasPet, setHasPet] = useState(false);
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

            // Check if user already has a pet
            const { pet } = await SupabaseService.getPet(user.id);
            setHasPet(!!pet);
        } catch (error) {
            console.error('Error fetching shop data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item, onSuccessAnimation) => {
        if (points < item.cost) {
            Alert.alert('Insufficient Points', `You need ${item.cost - points} more points to buy this.`);
            return;
        }

        const isPet = item.type === 'pet';
        const itemLabel = isPet ? item.name : `${item.name} seed`;

        Alert.alert(
            'Confirm Purchase',
            `Buy ${item.name} for ${item.cost} points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    onPress: async () => {
                        let result;
                        if (isPet) {
                            result = await SupabaseService.buyPet(user.id, item.id, item.cost);
                        } else {
                            result = await SupabaseService.buyItem(user.id, item.id, item.cost);
                        }

                        if (result.success) {
                            if (onSuccessAnimation) onSuccessAnimation();
                            Alert.alert('Success', `You bought a ${itemLabel}!`);
                            fetchData(); // Refresh points and pet status
                        } else {
                            Alert.alert('Error', result.error?.message || 'Failed to purchase item.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isPet = item.type === 'pet';
        const isOwned = isPet && hasPet;
        const icon = isPet ? '🐱' : '🌱';
        const durationText = isPet
            ? `Grows to a cat in ${Math.round(item.growth_duration_hours / 24)} days`
            : `Grows in ${item.growth_duration_hours} hours`;

        return (
            <View style={[styles.itemCard, isOwned && styles.itemCardOwned]}>
                <View style={styles.itemIcon}>
                    <Text style={{ fontSize: 32 }}>{icon}</Text>
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemDuration}>{durationText}</Text>
                </View>
                {isOwned ? (
                    <View style={styles.ownedBadge}>
                        <Text style={styles.ownedText}>Owned</Text>
                    </View>
                ) : (
                    <BuyButton
                        item={item}
                        userPoints={points}
                        onBuy={handleBuy}
                    />
                )}
            </View>
        );
    };

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
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    itemCardOwned: {
        opacity: 0.7,
        backgroundColor: '#F5F5F5',
    },
    ownedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    ownedText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: 'white',
    },
});

