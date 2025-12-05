import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Sprout, Flower, Plus } from 'lucide-react-native';

export const PlantingBox = ({ plant, onPress, disabled }) => {
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
        if (!plant) return <Plus size={24} color={Colors.textTertiary} />;

        const stage = getGrowthStage();

        switch (stage) {
            case 0: // Day 0: Tiny sprout peeking out
                return (
                    <View style={styles.plantContainer}>
                        <Sprout size={20} color="#4CAF50" style={styles.tinySprout} />
                    </View>
                );
            case 1: // Day 1: Small sprout growing
                return (
                    <View style={styles.plantContainer}>
                        <Sprout size={32} color="#66BB6A" />
                    </View>
                );
            case 2: // Day 2: Larger sprout with stems/leaves
                return (
                    <View style={styles.plantContainer}>
                        <Sprout size={44} color="#81C784" />
                    </View>
                );
            case 3: // Day 3+: Full bloom
            default:
                return (
                    <View style={styles.plantContainer}>
                        <Flower size={52} color={Colors.primary} />
                    </View>
                );
        }
    };

    // Show wood covering only on Day 0
    const showWoodCovering = () => {
        if (!plant) return false;
        const stage = getGrowthStage();
        return stage === 0;
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
                    {renderPlant()}
                </View>
                {/* Wood covering for Day 0 (newly planted) */}
                {showWoodCovering() && (
                    <View style={styles.woodCovering}>
                        <View style={styles.woodPlank} />
                        <View style={[styles.woodPlank, styles.woodPlank2]} />
                    </View>
                )}
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
        position: 'relative',
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
    plantContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tinySprout: {
        marginBottom: 10,
    },
    // Wood covering overlay (Day 0 only)
    woodCovering: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%', // Covers top portion of box
        backgroundColor: '#8D6E63',
        borderBottomWidth: 2,
        borderBottomColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    woodPlank: {
        width: '100%',
        height: 6,
        backgroundColor: '#6D4C41',
        borderRadius: 2,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: '#5D4037',
    },
    woodPlank2: {
        backgroundColor: '#795548',
        width: '90%',
    },
});
