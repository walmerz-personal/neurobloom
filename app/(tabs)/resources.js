import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { ResourceCard } from '../../components/ResourceCard';
import { ResourceDetailModal } from '../../components/ResourceDetailModal';
import { CAREGIVER_RESOURCES, MEDICAL_STAFF_RESOURCES } from '../../constants/roleResources';

export default function Resources() {
    const router = useRouter();
    const { userData } = useAuth();
    const [selectedResource, setSelectedResource] = useState(null);

    const role = userData?.role;
    const isCareTeam = role === 'caregiver' || role === 'medical_staff';

    useEffect(() => {
        if (userData != null && !isCareTeam) {
            router.replace('/(tabs)/home');
        }
    }, [userData, isCareTeam, router]);

    if (userData != null && !isCareTeam) {
        return null;
    }

    const resources = role === 'medical_staff' ? MEDICAL_STAFF_RESOURCES : CAREGIVER_RESOURCES;

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Resources</Text>
            </View>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {resources.map((resource) => (
                    <ResourceCard
                        key={resource.id}
                        title={resource.title}
                        snippet={resource.snippet}
                        onPress={() => setSelectedResource(resource)}
                    />
                ))}
            </ScrollView>
            <ResourceDetailModal
                visible={selectedResource !== null}
                onClose={() => setSelectedResource(null)}
                title={selectedResource?.title || ''}
                content={selectedResource?.content || ''}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
});
