import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Sprout, Plus, Leaf } from 'lucide-react-native';
import { getPlantGraphic } from './PlantGraphics';

export const PlantingBox = ({ plant, onPress, disabled, index }) => {
    const isPlanted = !!plant;

    // Calculate growth stage based on days elapsed (0-3+)
    const getGrowthStage = () => {
        if (!plant) return null;

        const plantedAt = new Date(plant.planted_at);
        const now = new Date();
        const hoursElapsed = (now - plantedAt) / (1000 * 60 * 60);
        const daysElapsed = Math.floor(hoursElapsed / 24);

        return Math.min(daysElapsed, 3); // Cap at stage 3 (full bloom)
    };

    // Render plant based on growth stage
    const renderPlant = () => {
        if (!plant) return null;

        const stage = getGrowthStage();
        const plantColor = plant.items?.category === 'mindfulness' ? '#E1BEE7' : '#C8E6C9'; // Example color logic
        // We can use random colors or specific colors based on seed type in future

        switch (stage) {
            case 0: // Day 0: Tiny sprout
                return (
                    <View style={styles.plantContainer}>
                        <Sprout size={24} color="#8BC34A" fill="#8BC34A" style={styles.tinySprout} />
                    </View>
                );
            case 1: // Day 1: Small sprout
                return (
                    <View style={styles.plantContainer}>
                        <Sprout size={40} color="#66BB6A" fill="#66BB6A" />
                    </View>
                );
            case 2: // Day 2: Larger
                return (
                    <View style={styles.plantContainer}>
                        <Leaf size={50} color="#4CAF50" fill="#4CAF50" />
                    </View>
                );
            case 3: // Day 3+: Full bloom
            default:
                // Use the custom plant graphic based on plant type
                const plantName = plant.items?.name || 'Flower';
                return (
                    <View style={styles.plantContainer}>
                        {getPlantGraphic(plantName, 70)}
                    </View>
                );
        }
    };

    const getLabelText = () => {
        if (!plant) return 'Plant a Seed';
        return plant.items?.name || 'Flower';
    };

    return (
        <TouchableOpacity
            style={[styles.container, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.9}
        >
            {/* Back rim of the box (depth) */}
            <View style={styles.backRim} />

            {/* Inner Soil/Darkness */}
            <View style={styles.innerBox}>
                {renderPlant()}
            </View>

            {/* Front Face of the box */}
            <View style={styles.frontBox}>
                {/* Wood Grain details */}
                <View style={styles.plank} />
                <View style={styles.plank} />
                <View style={styles.plank} />

                {/* Label */}
                <View style={styles.labelContainer}>
                    <Text style={styles.labelText} numberOfLines={1}>
                        {getLabelText()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    container: {
        width: 110,
        height: 185,
        marginHorizontal: 4,
        justifyContent: 'flex-end',
        marginBottom: 0, // Sits on the soil
    },
    disabled: {
        opacity: 0.9,
    },
    backRim: {
        position: 'absolute',
        bottom: 60,
        left: 5,
        right: 5,
        height: 20,
        backgroundColor: '#5D4037', // Dark wood back
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    innerBox: {
        position: 'absolute',
        bottom: 65,
        left: 10,
        right: 10,
        height: 60,
        backgroundColor: '#3E2723', // Very dark inside
        zIndex: 1, // Behind front, in front of back
        alignItems: 'center',
        justifyContent: 'flex-end', // Plant grows from bottom of inside
        paddingBottom: 5,
    },
    plantContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    tinySprout: {
        marginBottom: -5,
    },
    frontBox: {
        height: 70,
        backgroundColor: '#8D6E63', // Main wood color
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#5D4037', // Darker border
        zIndex: 2, // Front
        justifyContent: 'space-between',
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    plank: {
        height: 14,
        backgroundColor: 'rgba(0,0,0,0.05)', // Subtle wood grain line
        width: '100%',
        marginBottom: 2,
        borderRadius: 2,
    },
    labelContainer: {
        position: 'absolute',
        top: '50%',
        left: '10%',
        right: '10%',
        marginTop: -10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light etch
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(93, 64, 55, 0.3)',
    },
    labelText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#3E2723', // Dark text on wood
        textAlign: 'center',
    },
});
