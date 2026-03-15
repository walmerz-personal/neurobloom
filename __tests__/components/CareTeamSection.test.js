// __tests__/components/CareTeamSection.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CareTeamSection } from '../../components/CareTeamSection';
import { CareTeamService } from '../../services/CareTeamService';
import * as Clipboard from 'expo-clipboard';

// Mock CareTeamService
jest.mock('../../services/CareTeamService', () => ({
    CareTeamService: {
        getLinkedCaregivers: jest.fn(),
        getLinkedMedicalStaff: jest.fn(),
        getLinkedSurvivors: jest.fn(),
        getPendingInvitations: jest.fn(),
        createInvitation: jest.fn(),
        removeCareTeamLink: jest.fn(),
    },
}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

describe('CareTeamSection', () => {
    const defaultSurvivorProps = {
        userId: 'user-123',
        userRole: 'survivor',
        onNavigateToCaregiver: jest.fn(),
    };

    const defaultCaregiverProps = {
        userId: 'user-456',
        userRole: 'caregiver',
        onNavigateToCaregiver: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Loading state ---

    it('shows loading state while data is being fetched', () => {
        // Make the service calls hang (never resolve) so loading stays true
        CareTeamService.getLinkedCaregivers.mockReturnValue(new Promise(() => {}));
        CareTeamService.getLinkedMedicalStaff.mockReturnValue(new Promise(() => {}));
        CareTeamService.getPendingInvitations.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(
            <CareTeamSection {...defaultSurvivorProps} />
        );

        expect(getByText('My Care Team')).toBeTruthy();
    });

    // --- Survivor role ---

    describe('Survivor view', () => {
        beforeEach(() => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [],
                error: null,
            });
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({
                medicalStaff: [],
                error: null,
            });
            CareTeamService.getPendingInvitations.mockResolvedValue({
                invitations: [],
                error: null,
            });
        });

        it('renders the "My Care Team" title for survivor role', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('My Care Team')).toBeTruthy();
            });
        });

        it('shows empty state when no care team members are connected', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('No care team members connected yet')).toBeTruthy();
            });
        });

        it('shows Invite button', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('Invite')).toBeTruthy();
            });
        });

        it('navigates to connection-options when Invite is pressed', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('Invite')).toBeTruthy();
            });

            fireEvent.press(getByText('Invite'));

            expect(mockPush).toHaveBeenCalledWith('/connection-options?mode=invite');
        });

        it('renders connected caregivers', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [
                    { id: 'cg-1', name: 'Alice Smith', relationship: 'Spouse', linkId: 'link-1' },
                    { id: 'cg-2', name: 'Bob Jones', relationship: 'Friend', linkId: 'link-2' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('Alice Smith')).toBeTruthy();
                expect(getByText('Bob Jones')).toBeTruthy();
            });

            expect(getByText(/Spouse/)).toBeTruthy();
            expect(getByText(/Friend/)).toBeTruthy();
        });

        it('renders pending invitations', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getPendingInvitations.mockResolvedValue({
                invitations: [
                    { linkId: 'inv-1', code: 'ABC123' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('Pending Invitation')).toBeTruthy();
                expect(getByText('ABC123')).toBeTruthy();
            });
        });

        it('displays avatar initial from caregiver name', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [
                    { id: 'cg-1', name: 'Diana Prince', relationship: 'Friend', linkId: 'link-1' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => {
                expect(getByText('D')).toBeTruthy();
            });
        });

        it('opens profile modal when caregiver row is pressed', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [
                    { id: 'cg-1', name: 'Alice Smith', email: 'alice@example.com', relationship: 'Spouse', linkId: 'link-1' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            await waitFor(() => expect(getByText('Alice Smith')).toBeTruthy());
            fireEvent.press(getByText('Alice Smith'));
            await waitFor(() => {
                expect(getByText('Profile')).toBeTruthy();
                expect(getByText('alice@example.com')).toBeTruthy();
            });
        });

        it('closes profile modal when close is pressed', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [
                    { id: 'cg-1', name: 'Bob', relationship: 'Friend', linkId: 'link-1' },
                ],
                error: null,
            });

            const { getByText, getByTestId, queryByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );
            await waitFor(() => expect(getByText('Bob')).toBeTruthy());
            fireEvent.press(getByText('Bob'));
            await waitFor(() => expect(getByText('Profile')).toBeTruthy());
            fireEvent.press(getByTestId('care-team-profile-close'));
            await waitFor(() => {
                expect(queryByText('Profile')).toBeNull();
            });
        });

        it('calls removeCareTeamLink when Remove is confirmed for caregiver', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [
                    { id: 'cg-1', name: 'Alice', relationship: 'Spouse', linkId: 'link-1' },
                ],
                error: null,
            });
            CareTeamService.removeCareTeamLink.mockResolvedValue({ error: null });
            const alertSpy = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation((title, msg, buttons) => {
                const removeBtn = buttons?.find((b) => b.text === 'Remove');
                if (removeBtn?.onPress) removeBtn.onPress();
            });

            const { getByText, getByTestId } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );
            await waitFor(() => expect(getByText('Alice')).toBeTruthy());
            fireEvent.press(getByTestId('care-team-remove-caregiver-link-1'));
            await waitFor(() => {
                expect(CareTeamService.removeCareTeamLink).toHaveBeenCalledWith('user-123', 'link-1');
            });
            alertSpy.mockRestore();
        });

        it('calls removeCareTeamLink when Yes Cancel is confirmed for pending invitation', async () => {
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: [], error: null });
            CareTeamService.getPendingInvitations.mockResolvedValue({
                invitations: [{ linkId: 'inv-1', code: 'XYZ789' }],
                error: null,
            });
            CareTeamService.removeCareTeamLink.mockResolvedValue({ error: null });
            jest.spyOn(require('react-native').Alert, 'alert').mockImplementation((title, msg, buttons) => {
                const yesBtn = buttons?.find((b) => b.text === 'Yes, Cancel');
                if (yesBtn?.onPress) yesBtn.onPress();
            });

            const { getByText, getByTestId } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );
            await waitFor(() => expect(getByText('Pending Invitation')).toBeTruthy());
            fireEvent.press(getByTestId('care-team-cancel-invitation-inv-1'));
            await waitFor(() => {
                expect(CareTeamService.removeCareTeamLink).toHaveBeenCalledWith('user-123', 'inv-1');
            });
            require('react-native').Alert.alert.mockRestore();
        });

        it('copies invitation code to clipboard when Copy is pressed on pending row', async () => {
            jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValue();
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({ medicalStaff: [], error: null });
            CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: [], error: null });
            CareTeamService.getPendingInvitations.mockResolvedValue({
                invitations: [{ linkId: 'inv-1', code: 'ABC123' }],
                error: null,
            });
            jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

            const { getByText, getByTestId } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );
            await waitFor(() => expect(getByText('ABC123')).toBeTruthy());
            fireEvent.press(getByTestId('care-team-copy-code'));
            await waitFor(() => {
                expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123');
            });
        });
    });

    // --- Caregiver role ---

    describe('Caregiver view', () => {
        beforeEach(() => {
            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [],
                error: null,
            });
        });

        it('renders the "My Survivors" title for caregiver role', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            await waitFor(() => {
                expect(getByText('My Survivors')).toBeTruthy();
            });
        });

        it('shows empty state when no survivors are connected', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            await waitFor(() => {
                expect(
                    getByText('No survivors connected. Ask a survivor to share their invitation code with you.')
                ).toBeTruthy();
            });
        });

        it('shows Enter Invitation Code button in empty state', async () => {
            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            await waitFor(() => {
                expect(getByText('Enter Invitation Code')).toBeTruthy();
            });
        });

        it('calls onNavigateToCaregiver with accept-invitation when Enter Invitation Code is pressed', async () => {
            const mockNavigate = jest.fn();
            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} onNavigateToCaregiver={mockNavigate} />
            );

            await waitFor(() => {
                expect(getByText('Enter Invitation Code')).toBeTruthy();
            });

            fireEvent.press(getByText('Enter Invitation Code'));

            expect(mockNavigate).toHaveBeenCalledWith('accept-invitation');
        });

        it('renders connected survivors', async () => {
            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [
                    { id: 's-1', name: 'Charlie Brown', relationship: 'Parent' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            await waitFor(() => {
                expect(getByText('Charlie Brown')).toBeTruthy();
                expect(getByText('Parent')).toBeTruthy();
            });
        });

        it('calls onNavigateToCaregiver with survivor-progress when a survivor row is pressed', async () => {
            const mockNavigate = jest.fn();
            const survivor = { id: 's-1', name: 'Charlie Brown', relationship: 'Parent' };

            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [survivor],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} onNavigateToCaregiver={mockNavigate} />
            );

            await waitFor(() => {
                expect(getByText('Charlie Brown')).toBeTruthy();
            });

            fireEvent.press(getByText('Charlie Brown'));

            expect(mockNavigate).toHaveBeenCalledWith('survivor-progress', survivor);
        });

        it('shows Connect Another Survivor button when survivors exist', async () => {
            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [
                    { id: 's-1', name: 'Jane Doe', relationship: 'Spouse' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            await waitFor(() => {
                expect(getByText('Connect Another Survivor')).toBeTruthy();
            });
        });

        it('calls onNavigateToCaregiver when Connect Another Survivor is pressed', async () => {
            const mockNavigate = jest.fn();

            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [
                    { id: 's-1', name: 'Jane Doe', relationship: 'Spouse' },
                ],
                error: null,
            });

            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} onNavigateToCaregiver={mockNavigate} />
            );

            await waitFor(() => {
                expect(getByText('Connect Another Survivor')).toBeTruthy();
            });

            fireEvent.press(getByText('Connect Another Survivor'));

            expect(mockNavigate).toHaveBeenCalledWith('accept-invitation');
        });
    });

    // --- Error handling ---

    describe('Error handling', () => {
        it('handles API errors gracefully for survivor role', async () => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [],
                error: 'Some error',
            });
            CareTeamService.getLinkedMedicalStaff.mockResolvedValue({
                medicalStaff: [],
                error: 'Some error',
            });
            CareTeamService.getPendingInvitations.mockResolvedValue({
                invitations: [],
                error: 'Some error',
            });

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            // Should still render without crashing
            await waitFor(() => {
                expect(getByText('My Care Team')).toBeTruthy();
            });
        });

        it('handles API errors gracefully for caregiver role', async () => {
            CareTeamService.getLinkedSurvivors.mockResolvedValue({
                survivors: [],
                error: 'Some error',
            });

            const { getByText } = render(
                <CareTeamSection {...defaultCaregiverProps} />
            );

            // Should still render without crashing
            await waitFor(() => {
                expect(getByText('My Survivors')).toBeTruthy();
            });
        });

        it('handles exceptions in loadCareTeam', async () => {
            CareTeamService.getLinkedCaregivers.mockRejectedValue(new Error('Network error'));

            const { getByText } = render(
                <CareTeamSection {...defaultSurvivorProps} />
            );

            // Should still render without crashing (loading finishes)
            await waitFor(() => {
                expect(getByText('My Care Team')).toBeTruthy();
            });
        });
    });
});
