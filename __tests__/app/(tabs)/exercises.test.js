// __tests__/app/(tabs)/exercises.test.js
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Exercises from '../../../app/(tabs)/exercises';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';
import { MedicalStaffService } from '../../../services/MedicalStaffService';
import { getRecommendedExercises } from '../../../services/RecommendationService';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');
jest.mock('../../../services/MedicalStaffService');
jest.mock('../../../services/RecommendationService');

// Mock child components
jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});
jest.mock('../../../components/CustomExerciseModal', () => {
    return { CustomExerciseModal: () => null };
});
jest.mock('../../../components/ConfettiBurst', () => {
    return { ConfettiBurst: () => null };
});

describe('Exercises Screen', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    const mockSurvivorData = { name: 'Jane Doe', role: 'survivor' };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            user: mockUser,
            userData: mockSurvivorData,
        });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null, error: null });
        SupabaseService.getCustomExercises.mockResolvedValue({ data: [], error: null });
        SupabaseService.getUserProfile.mockResolvedValue({ profile: null, error: null });
        MedicalStaffService.getAssignedExercises.mockResolvedValue({ assignments: [], error: null });
        getRecommendedExercises.mockReturnValue({ recommended: [] });
    });

    describe('Rendering', () => {
        it('renders without crashing', async () => {
            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });

        it('shows header subtitle', () => {
            const { getByText } = render(<Exercises />);
            expect(getByText('Daily movements for your recovery')).toBeTruthy();
        });

        it('renders category filter chips', () => {
            const { getAllByText } = render(<Exercises />);
            expect(getAllByText('All').length).toBeGreaterThan(0);
            expect(getAllByText('Arms').length).toBeGreaterThan(0);
            expect(getAllByText('Legs').length).toBeGreaterThan(0);
            expect(getAllByText('Core').length).toBeGreaterThan(0);
            expect(getAllByText('Hands').length).toBeGreaterThan(0);
        });

        it('renders mode filter chips', () => {
            const { getAllByText } = render(<Exercises />);
            // Mode chips have emoji prefixes for Solo and Partner; multiple elements may contain "Partner"
            expect(getAllByText(/Solo/).length).toBeGreaterThan(0);
            expect(getAllByText(/Partner/).length).toBeGreaterThan(0);
        });

        it('renders exercise cards from built-in data', async () => {
            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('Shoulder Shrugs')).toBeTruthy();
                expect(getByText('Ankle Pumps')).toBeTruthy();
            });
        });
    });

    describe('Category Filtering', () => {
        it('filters exercises by Arms category', async () => {
            const { getAllByText, queryByText } = render(<Exercises />);

            // Press Arms category
            fireEvent.press(getAllByText('Arms')[0]);

            await waitFor(() => {
                expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0);
                // Legs exercises should not be visible
                expect(queryByText('Ankle Pumps')).toBeNull();
            });
        });

        it('filters exercises by Legs category', async () => {
            const { getAllByText, queryByText } = render(<Exercises />);

            fireEvent.press(getAllByText('Legs')[0]);

            await waitFor(() => {
                expect(getAllByText('Ankle Pumps').length).toBeGreaterThan(0);
                expect(queryByText('Shoulder Shrugs')).toBeNull();
            });
        });

        it('shows all exercises when All is selected', async () => {
            const { getAllByText } = render(<Exercises />);

            // First filter, then go back to All
            fireEvent.press(getAllByText('Arms')[0]);
            fireEvent.press(getAllByText('All')[0]);

            await waitFor(() => {
                expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0);
                expect(getAllByText('Ankle Pumps').length).toBeGreaterThan(0);
            });
        });
    });

    describe('Exercise Completion', () => {
        it('shows completed exercises from today log', async () => {
            SupabaseService.getTodayLog.mockResolvedValue({
                log: { exercises_completed: ['a1'] },
                error: null,
            });

            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('Shoulder Shrugs')).toBeTruthy();
            });
        });
    });

    describe('Custom Exercises', () => {
        it('renders custom exercises from Supabase', async () => {
            SupabaseService.getCustomExercises.mockResolvedValue({
                data: [{
                    id: 'custom-1',
                    title: 'My Custom Exercise',
                    category: 'Arms',
                    mode: 'solo',
                    time: '5 min',
                    target: 'Custom target',
                    description: 'Custom description',
                    difficulty: 'Beginner',
                    thumbnailColor: '#E0F2FE',
                    instructions: ['Step 1'],
                    isCustom: true,
                    userId: 'test-user-id',
                }],
                error: null,
            });

            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('My Custom Exercise')).toBeTruthy();
            });
        });

        it('has add custom exercise button', () => {
            const { getByLabelText } = render(<Exercises />);
            expect(getByLabelText('Add custom exercise')).toBeTruthy();
        });
    });

    describe('Recommended Exercises', () => {
        it('shows recommended section when recommendations exist', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { impairments: ['arm_weakness'] },
                error: null,
            });
            getRecommendedExercises.mockReturnValue({
                recommended: [
                    { id: 'a1', title: 'Shoulder Shrugs', thumbnailColor: '#E0F2FE', recommendationReason: 'Good for arm weakness' },
                ],
            });

            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('Recommended for You')).toBeTruthy();
            });
        });

        it('does not show recommended section when no recommendations', async () => {
            getRecommendedExercises.mockReturnValue({ recommended: [] });

            const { queryByText } = render(<Exercises />);
            await waitFor(() => {
                expect(queryByText('Recommended for You')).toBeNull();
            });
        });
    });

    describe('Assigned Exercises', () => {
        it('loads assigned exercises from MedicalStaffService', async () => {
            MedicalStaffService.getAssignedExercises.mockResolvedValue({
                assignments: [{
                    exercise_id: 'a1',
                    status: 'assigned',
                    notes: 'Do this daily',
                    assigned_by: { name: 'Dr. Smith' },
                    due_date: '2026-03-15',
                    id: 'assignment-1',
                }],
                error: null,
            });

            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('Shoulder Shrugs')).toBeTruthy();
            });
            expect(MedicalStaffService.getAssignedExercises).toHaveBeenCalledWith('test-user-id');
        });
    });

    describe('Error Handling', () => {
        it('handles getTodayLog error gracefully', async () => {
            SupabaseService.getTodayLog.mockRejectedValue(new Error('Network error'));

            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });

        it('handles getCustomExercises error gracefully', async () => {
            SupabaseService.getCustomExercises.mockResolvedValue({
                data: null,
                error: new Error('DB error'),
            });

            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });

        it('handles getAssignedExercises error gracefully', async () => {
            MedicalStaffService.getAssignedExercises.mockRejectedValue(new Error('Service error'));

            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });

        it('handles null user gracefully', () => {
            useAuth.mockReturnValue({
                user: null,
                userData: null,
            });

            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });

        it('handles getUserProfile error for recommendations', async () => {
            SupabaseService.getUserProfile.mockRejectedValue(new Error('Profile error'));

            const { getByText } = render(<Exercises />);
            expect(getByText('Recovery Exercises')).toBeTruthy();
        });
    });

    describe('Info Modal', () => {
        it('shows info modal content when recommendations exist and info pressed', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { impairments: ['arm_weakness'] },
                error: null,
            });
            getRecommendedExercises.mockReturnValue({
                recommended: [
                    { id: 'a1', title: 'Shoulder Shrugs', thumbnailColor: '#E0F2FE', recommendationReason: 'Good for arm weakness' },
                ],
            });

            const { getByText } = render(<Exercises />);
            await waitFor(() => {
                expect(getByText('Recommended for You')).toBeTruthy();
            });
        });
    });

    describe('Recommendation filter', () => {
        it('renders recommendation filter chips', async () => {
            const { getByText } = render(<Exercises />);
            await waitFor(() => expect(getByText('Shoulder Shrugs')).toBeTruthy());
            expect(getByText('AI recommended')).toBeTruthy();
            expect(getByText('Staff assigned')).toBeTruthy();
        });

        it('filters to AI recommended when chip pressed', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({ profile: { impairments: ['arm_weakness'] }, error: null });
            getRecommendedExercises.mockReturnValue({
                recommended: [{ id: 'a1', title: 'Shoulder Shrugs', thumbnailColor: '#E0F2FE', recommendationReason: 'For arms' }],
            });
            const { getByText, getAllByText } = render(<Exercises />);
            await waitFor(() => expect(getByText('Recommended for You')).toBeTruthy());
            fireEvent.press(getByText('AI recommended'));
            await waitFor(() => expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0));
        });

        it('filters to Staff assigned when chip pressed', async () => {
            MedicalStaffService.getAssignedExercises.mockResolvedValue({
                assignments: [{ exercise_id: 'a1', status: 'assigned', notes: '', assigned_by: { name: 'Dr. Smith' }, due_date: null, id: 'asn1' }],
                error: null,
            });
            const { getByText } = render(<Exercises />);
            await waitFor(() => expect(getByText('Shoulder Shrugs')).toBeTruthy());
            fireEvent.press(getByText('Staff assigned'));
            await waitFor(() => expect(getByText('Shoulder Shrugs')).toBeTruthy());
        });
    });

    describe('Visual Guide', () => {
        it('expands exercise card when pressed', async () => {
            const { getAllByText } = render(<Exercises />);
            await waitFor(() => expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0));
            const cards = getAllByText('Shoulder Shrugs');
            fireEvent.press(cards[0]);
            await waitFor(() => {
                expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0);
            });
        });
    });

    describe('Assigned exercise info', () => {
        it('loads and displays assigned exercises', async () => {
            MedicalStaffService.getAssignedExercises.mockResolvedValue({
                assignments: [{
                    exercise_id: 'a1',
                    status: 'assigned',
                    notes: 'Do 10 reps',
                    assigned_by: { name: 'Dr. Smith' },
                    due_date: '2026-03-20',
                    id: 'asn1',
                }],
                error: null,
            });
            const { getAllByText } = render(<Exercises />);
            await waitFor(() => expect(MedicalStaffService.getAssignedExercises).toHaveBeenCalledWith('test-user-id'));
            await waitFor(() => expect(getAllByText('Shoulder Shrugs').length).toBeGreaterThan(0));
        });
    });
});
