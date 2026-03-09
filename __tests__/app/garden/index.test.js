// __tests__/app/garden/index.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GardenScreen from '../../../app/garden/index';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');

// Mock garden components
jest.mock('../../../components/Garden/PlantingBox', () => {
    const { TouchableOpacity, Text } = require('react-native');
    return {
        PlantingBox: ({ plant, onPress, index }) => (
            <TouchableOpacity testID={`planting-box-${index}`} onPress={onPress}>
                <Text>{plant ? plant.items?.name || 'Plant' : 'Empty'}</Text>
            </TouchableOpacity>
        ),
    };
});
jest.mock('../../../components/Garden/SeedBankModal', () => {
    const { View, Text } = require('react-native');
    return {
        SeedBankModal: ({ visible }) => visible ? <View testID="seed-bank-modal"><Text>Seed Bank</Text></View> : null,
    };
});
jest.mock('../../../components/Garden/GardenKitten', () => {
    const { View } = require('react-native');
    return {
        GardenKitten: () => <View testID="garden-kitten" />,
    };
});

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
    useFocusEffect: (callback) => {
        const React = require('react');
        React.useEffect(() => {
            callback();
        }, []);
    },
}));

describe('GardenScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'user-1' } });
        SupabaseService.getUserPoints.mockResolvedValue({ points: 100 });
        SupabaseService.getInventory.mockResolvedValue({ inventory: [] });
        SupabaseService.getGardenPlants.mockResolvedValue({ plants: [] });
        SupabaseService.getPet.mockResolvedValue({ pet: null });
        SupabaseService.plantSeed.mockResolvedValue({ success: true });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders without crashing', async () => {
        const { toJSON } = render(<GardenScreen />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('shows header with NeuroBloom title', async () => {
        const { getByText } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByText('NeuroBloom')).toBeTruthy();
        });
    });

    it('displays points', async () => {
        const { getByText } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByText('Points: 100')).toBeTruthy();
        });
    });

    it('displays seed count', async () => {
        SupabaseService.getInventory.mockResolvedValue({
            inventory: [
                { item_id: '1', quantity: 3, items: { name: 'Rose' } },
                { item_id: '2', quantity: 2, items: { name: 'Tulip' } },
            ],
        });
        const { getByText } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByText('Seeds: 5')).toBeTruthy();
        });
    });

    it('renders 6 planting boxes', async () => {
        const { getByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            for (let i = 0; i < 6; i++) {
                expect(getByTestId(`planting-box-${i}`)).toBeTruthy();
            }
        });
    });

    it('shows empty planting boxes when no plants', async () => {
        const { getAllByText } = render(<GardenScreen />);
        await waitFor(() => {
            const emptyBoxes = getAllByText('Empty');
            expect(emptyBoxes.length).toBe(6);
        });
    });

    it('shows alert for no seeds when pressing empty box with no inventory', async () => {
        const { getByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByTestId('planting-box-0')).toBeTruthy();
        });

        fireEvent.press(getByTestId('planting-box-0'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'No Seeds',
            expect.stringContaining("don't have any seeds"),
            expect.any(Array)
        );
    });

    it('shows seed selection when pressing empty box with inventory', async () => {
        SupabaseService.getInventory.mockResolvedValue({
            inventory: [{ item_id: 'seed-1', quantity: 2, items: { name: 'Rose' } }],
        });
        const { getByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByTestId('planting-box-0')).toBeTruthy();
        });

        fireEvent.press(getByTestId('planting-box-0'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Choose a Seed',
            'Select which seed to plant:',
            expect.arrayContaining([
                expect.objectContaining({ text: 'Rose (2)' }),
                expect.objectContaining({ text: 'Cancel' }),
            ])
        );
    });

    it('shows plant details when pressing occupied box', async () => {
        SupabaseService.getGardenPlants.mockResolvedValue({
            plants: [{ box_index: 0, items: { name: 'Rose' } }],
        });
        const { getByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByTestId('planting-box-0')).toBeTruthy();
        });

        fireEvent.press(getByTestId('planting-box-0'));

        expect(Alert.alert).toHaveBeenCalledWith('Rose', 'This plant is growing beautifully!');
    });

    it('does not show GardenKitten when no pet', async () => {
        const { queryByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            expect(queryByTestId('garden-kitten')).toBeNull();
        });
    });

    it('shows GardenKitten when pet exists', async () => {
        SupabaseService.getPet.mockResolvedValue({ pet: { purchased_at: '2024-01-01' } });
        const { getByTestId } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByTestId('garden-kitten')).toBeTruthy();
        });
    });

    it('does not fetch data when user is null', async () => {
        useAuth.mockReturnValue({ user: null });
        render(<GardenScreen />);

        await waitFor(() => {
            expect(SupabaseService.getUserPoints).not.toHaveBeenCalled();
        });
    });

    it('handles fetch data error gracefully', async () => {
        SupabaseService.getUserPoints.mockRejectedValue(new Error('Network error'));
        const { toJSON } = render(<GardenScreen />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('navigates back when back button is pressed', async () => {
        const { getByText } = render(<GardenScreen />);
        await waitFor(() => {
            expect(getByText('NeuroBloom')).toBeTruthy();
        });
    });
});
