import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { PlantingBox } from '../../components/Garden/PlantingBox';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Coins, ArrowLeft } from 'lucide-react-native';

export default function GardenScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [points, setPoints] = useState(0);
    const [plants, setPlants] = useState(Array(6).fill(null)); // 6 garden slots
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch Points
            const { points: userPoints } = await SupabaseService.getUserPoints(user.id);
            setPoints(userPoints);

            // 2. Fetch Plants
            const { plants: gardenPlants } = await SupabaseService.getGardenPlants(user.id);

            // Map to slots (0-5)
            const newPlants = Array(6).fill(null);
            if (gardenPlants) {
                gardenPlants.forEach(plant => {
                    if (plant.box_index >= 0 && plant.box_index < 6) {
                        newPlants[plant.box_index] = plant;
                    }
                });
            }
            setPlants(newPlants);

        } catch (error) {
            console.error('Error fetching garden data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleBoxPress = (index) => {
        const plant = plants[index];
        if (plant) {
            // View plant details (future feature)
            Alert.alert(plant.items?.name || 'Plant', 'This plant is growing beautifully!');
        } else {
            // Plant a seed
            // For now, just navigate to shop or show alert
            Alert.alert(
                'Empty Plot',
                'Would you like to plant a seed here?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Shop', onPress: () => router.push('/garden/shop') }
                ]
            );
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.pointsContainer}>
                        <Coins size={20} color={Colors.primary} />
                        <Text style={styles.pointsText}>{points} Points</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => router.push('/garden/shop')}
                >
                    <ShoppingBag size={20} color="white" />
                    <Text style={styles.shopButtonText}>Seed Shop</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.gardenContainer}>
                {/* Sky Background */}
                <View style={styles.sky}>
                    <Text style={styles.gardenTitle}>My Peace Garden</Text>
                    <Text style={styles.gardenSubtitle}>Watch your progress bloom</Text>
                </View>

                {/* Garden Area */}
                <View style={styles.ground}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {plants.map((plant, index) => (
                            <PlantingBox
                                key={index}
                                plant={plant}
                                onPress={() => handleBoxPress(index)}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surfaceHighlight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pointsText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    shopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    shopButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    gardenContainer: {
        flex: 1,
        backgroundColor: '#E3F2FD', // Light sky blue
    },
    sky: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    gardenTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#1565C0', // Darker blue
        marginBottom: 8,
    },
    gardenSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#546E7A',
    },
    ground: {
        height: 180,
        backgroundColor: '#5D4037', // Dark brown soil
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignItems: 'flex-end', // Align boxes to bottom of scroll view
        paddingBottom: 10,
    },
});
