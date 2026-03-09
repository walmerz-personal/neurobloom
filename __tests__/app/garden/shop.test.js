// __tests__/app/garden/shop.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ShopScreen from '../../../app/garden/shop';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: mockBack,
    }),
}));

describe('ShopScreen', () => {
    const mockItems = [
        {
            id: 'item-1',
            name: 'Rose',
            description: 'A beautiful rose',
            cost: 20,
            type: 'seed',
            growth_duration_hours: 24,
        },
        {
            id: 'item-2',
            name: 'Sunflower',
            description: 'A bright sunflower',
            cost: 30,
            type: 'seed',
            growth_duration_hours: 48,
        },
        {
            id: 'item-3',
            name: 'Whiskers',
            description: 'A cute kitten',
            cost: 100,
            type: 'pet',
            growth_duration_hours: 168,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'user-1' } });
        SupabaseService.getUserPoints.mockResolvedValue({ points: 50 });
        SupabaseService.getItems.mockResolvedValue({ items: mockItems });
        SupabaseService.getPet.mockResolvedValue({ pet: null });
        SupabaseService.buyItem.mockResolvedValue({ success: true });
        SupabaseService.buyPet.mockResolvedValue({ success: true });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders without crashing', async () => {
        const { toJSON } = render(<ShopScreen />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('shows header with Seed Shop title', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('Seed Shop')).toBeTruthy();
        });
    });

    it('displays user points in header', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('50')).toBeTruthy();
        });
    });

    it('displays shop items', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('Rose')).toBeTruthy();
            expect(getByText('A beautiful rose')).toBeTruthy();
            expect(getByText('Sunflower')).toBeTruthy();
            expect(getByText('Whiskers')).toBeTruthy();
        });
    });

    it('shows growth duration for seeds', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('Grows in 24 hours')).toBeTruthy();
            expect(getByText('Grows in 48 hours')).toBeTruthy();
        });
    });

    it('shows growth duration for pets in days', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('Grows to a cat in 7 days')).toBeTruthy();
        });
    });

    it('shows item costs on buy buttons', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('20')).toBeTruthy();
            expect(getByText('30')).toBeTruthy();
            expect(getByText('100')).toBeTruthy();
        });
    });

    it('shows empty state when no items', async () => {
        SupabaseService.getItems.mockResolvedValue({ items: [] });
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('No seeds available right now.')).toBeTruthy();
        });
    });

    it('shows Owned badge when user has pet', async () => {
        SupabaseService.getPet.mockResolvedValue({ pet: { id: 'pet-1' } });
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('Owned')).toBeTruthy();
        });
    });

    it('shows confirm dialog when buying an item', async () => {
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('20')).toBeTruthy();
        });

        // Press the buy button for Rose (cost 20, user has 50)
        fireEvent.press(getByText('20'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Confirm Purchase',
            'Buy Rose for 20 points?',
            expect.any(Array)
        );
    });

    it('disables buy button when insufficient points', async () => {
        SupabaseService.getUserPoints.mockResolvedValue({ points: 10 });
        const { getByText } = render(<ShopScreen />);
        await waitFor(() => {
            expect(getByText('20')).toBeTruthy();
        });

        // Buy button should be disabled (pressing it should not trigger alert)
        fireEvent.press(getByText('20'));
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('does not fetch data when user is null', async () => {
        useAuth.mockReturnValue({ user: null });
        render(<ShopScreen />);

        await waitFor(() => {
            expect(SupabaseService.getUserPoints).not.toHaveBeenCalled();
        });
    });

    it('handles fetch error gracefully', async () => {
        SupabaseService.getItems.mockRejectedValue(new Error('Network error'));
        const { toJSON } = render(<ShopScreen />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });
});
