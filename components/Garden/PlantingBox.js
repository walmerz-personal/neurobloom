import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Sprout, Flower, TreeDeciduous, Plus } from 'lucide-react-native';

export const PlantingBox = ({ plant, onPress, disabled }) => {
    const isPlanted = !!plant;

    // Determine growth stage icon
    const getPlantIcon = () => {
        if (!plant) return <Plus size={24} color={Colors.textTertiary} />;

        // Simple logic for now: check duration vs time elapsed
        // In a real app, we'd calculate this more precisely
        const plantedAt = new Date(plant.planted_at);
        const now = new Date();
        const hoursElapsed = (now - plantedAt) / (1000 * 60 * 60);
        const duration = plant.items?.growth_duration_hours || 24;
        const progress = Math.min(hoursElapsed / duration, 1);

        if (progress < 0.3) return <Sprout size={32} color={Colors.success} />;
        if (progress < 0.8) return <Sprout size={40} color={Colors.success} />; // Bigger sprout
        return <Flower size={48} color={Colors.primary} />; // Bloom
    };

    return (
        <TouchableOpacity
            style={[styles.container, isPlanted ? styles.planted : styles.empty]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <View style={styles.boxFront}>
                <View style={styles.soil}>
                    {getPlantIcon()}
                </View>
            </View>
            <View style={styles.boxLip} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 100,
        marginHorizontal: 8,
        justifyContent: 'flex-end',
    },
    empty: {
        opacity: 0.8,
    },
    planted: {
        opacity: 1,
    },
    boxFront: {
        height: 80,
        backgroundColor: '#8D6E63', // Wood color
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#5D4037',
        overflow: 'hidden',
        justifyContent: 'flex-start', // Align soil to top/middle
    },
    soil: {
        height: '100%',
        backgroundColor: '#3E2723', // Dark soil
        marginTop: 10, // Soil level
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    boxLip: {
        position: 'absolute',
        top: 20, // Lip of the box
        left: -2,
        right: -2,
        height: 12,
        backgroundColor: '#A1887F',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#5D4037',
    },
});
