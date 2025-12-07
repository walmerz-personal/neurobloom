import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { PlantingBox } from '../../components/Garden/PlantingBox';
import { SupabaseService } from '../../services/SupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Coins, ArrowLeft, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function GardenScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [points, setPoints] = useState(0);
    const [plants, setPlants] = useState(Array(6).fill(null)); // 6 garden slots
    const [inventory, setInventory] = useState([]); // User's seed inventory
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch Points
            const { points: userPoints } = await SupabaseService.getUserPoints(user.id);
            setPoints(userPoints);

            // 2. Fetch Inventory
            const { inventory: userInventory } = await SupabaseService.getInventory(user.id);
            setInventory(userInventory || []);

            // 3. Fetch Plants
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

    const handleBoxPress = (index) => {
        const plant = plants[index];
        if (plant) {
            // View plant details (future feature)
            Alert.alert(plant.items?.name || 'Plant', 'This plant is growing beautifully!');
        } else {
            // Show inventory to plant a seed
            if (inventory.length === 0) {
                Alert.alert(
                    'No Seeds',
                    'You don\'t have any seeds to plant. Visit the shop to buy some!',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Go to Shop', onPress: () => router.push('/garden/shop') }
                    ]
                );
            } else {
                // Show seed selection dialog
                const buttons = inventory.map(item => ({
                    text: `${item.items.name} (${item.quantity})`,
                    onPress: () => handlePlantSeed(item.item_id, index)
                }));
                buttons.push({ text: 'Cancel', style: 'cancel' });

                Alert.alert('Choose a Seed', 'Select which seed to plant:', buttons);
            }
        }
    };

    const handlePlantSeed = async (itemId, boxIndex) => {
        const { success, error } = await SupabaseService.plantSeed(user.id, itemId, boxIndex);
        if (success) {
            Alert.alert('Success', 'Your seed has been planted! 🌱');
            fetchData(); // Refresh the garden
        } else {
            Alert.alert('Error', error?.message || 'Failed to plant seed.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Sky Background */}
            <LinearGradient
                colors={['#D1C4E9', '#F3E5F5', '#FFF3E0']} // Purple -> Pink -> Orange/Peach
                style={styles.sky}
            >
                {/* Header */}
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color="#5D4037" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>NeuroBloom</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => router.push('/garden/shop')}
                        >
                            {/*           <ShoppingBag size={24} color="#5D4037" /> */}
                        </TouchableOpacity>
                    </View>

                    {/* Stats Pills */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statPill}>
                            <Leaf size={16} color="#8D6E63" fill="#8D6E63" />
                            <Text style={styles.statText}>Seeds: {inventory.reduce((acc, curr) => acc + curr.quantity, 0)}</Text>
                        </View>
                        <View style={styles.statPill}>
                            <Coins size={16} color="#FFD54F" fill="#FFD54F" />
                            <Text style={styles.statText}>Points: {points}</Text>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Hills Background Layers */}
                <View style={styles.hillsContainer}>
                    <View style={[styles.hill, styles.hillBack]} />
                    <View style={[styles.hill, styles.hillFront]} />
                </View>

            </LinearGradient>

            {/* Garden Area (Soil) */}
            <View style={styles.ground}>
                {/* Soil Textures/Details could go here */}

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    style={styles.scrollView}
                >
                    <View style={styles.paddingStart} />
                    {plants.map((plant, index) => (
                        <PlantingBox
                            key={index}
                            plant={plant}
                            onPress={() => handleBoxPress(index)}
                            index={index}
                        />
                    ))}
                    <View style={styles.paddingEnd} />
                </ScrollView>
            </View>

            {/* Bottom Navigation Placeholder (Visual only, actual nav handled by Tabs) */}
            {/* The tab bar covers the bottom, so we just need ensure soil goes down enough */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF3E0',
    },
    sky: {
        flex: 1,
        width: '100%',
    },
    safeArea: {
        width: '100%',
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Centered title, but we need buttons on sides potentially
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold', // Assuming this font exists from previous analysis
        fontSize: 24,
        color: '#2E1A16', // Dark Brown
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    backButton: {
        padding: 8,
    },
    shopButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 10,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#4E342E',
    },

    // Hills
    hillsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200, // Height of hills area
        zIndex: 0,
    },
    hill: {
        position: 'absolute',
        bottom: -50, // Push down slightly
        width: width * 1.5,
        height: 200,
        borderTopLeftRadius: 300,
        borderTopRightRadius: 300,
    },
    hillBack: {
        backgroundColor: 'rgba(126, 87, 194, 0.3)', // Purpleish
        left: -100,
        bottom: 20,
        transform: [{ scaleX: 1.5 }],
    },
    hillFront: {
        backgroundColor: 'rgba(149, 117, 205, 0.4)', // Lighter purple
        right: -50,
        bottom: 0,
        transform: [{ scaleX: 1.2 }],
    },

    // Ground
    ground: {
        height: 300, // Fixed height for soil area
        backgroundColor: '#4E342E', // Dark Brown Soil
        borderTopWidth: 8,
        borderTopColor: '#5D4037', // Slightly lighter top edge
        width: '100%',
        justifyContent: 'flex-start', // Plants sit on top of soil? No, they sit IN soil line.
        // Actually, in the image, the boxes SIT ON the soil line.
        // So the scrollview should be overlapping the sky/ground boundary.
        // Let's adjust.
        zIndex: 1,
    },
    // We want the ScrollView to float over the boundary of Sky/Ground
    scrollView: {
        marginTop: -60, // Pull up to overlap sky
        paddingTop: 0,
    },
    scrollContent: {
        alignItems: 'flex-end', // Align items to bottom of scroll area
        paddingBottom: 40, // Space from bottom
    },
    paddingStart: { width: 20 },
    paddingEnd: { width: 20 },
});
