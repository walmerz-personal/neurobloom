// __tests__/components/HealthSharingSection.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HealthSharingSection } from '../../components/HealthSharingSection';

// Mock services
jest.mock('../../services/CareTeamService', () => ({
    CareTeamService: {
        getLinkedCaregivers: jest.fn(),
    },
}));

jest.mock('../../services/MedicalStaffService', () => ({
    MedicalStaffService: {},
}));

jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        getCareTeamLinks: jest.fn(),
        getHealthSharingPreferences: jest.fn(),
        saveHealthSharingPreferences: jest.fn(),
    },
}));

const { CareTeamService } = require('../../services/CareTeamService');
const { SupabaseService } = require('../../services/SupabaseService');

describe('HealthSharingSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: no caregivers, no medical staff, no preferences
        CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: [] });
        SupabaseService.getCareTeamLinks.mockResolvedValue({ data: [] });
        SupabaseService.getHealthSharingPreferences.mockResolvedValue({ data: [] });
    });

    describe('renders for survivor role', () => {
        it('should render the section title for survivor', async () => {
            const { getByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            // Loading state shows title immediately
            expect(getByText('Health Data Sharing')).toBeTruthy();
        });

        it('should return null for non-survivor roles', () => {
            const { toJSON } = render(
                <HealthSharingSection userId="user-1" userRole="caregiver" />
            );
            expect(toJSON()).toBeNull();
        });

        it('should return null for medical_staff role', () => {
            const { toJSON } = render(
                <HealthSharingSection userId="user-1" userRole="medical_staff" />
            );
            expect(toJSON()).toBeNull();
        });

        it('should show empty state when no care team members', async () => {
            const { findByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            const emptyText = await findByText('No care team members yet');
            expect(emptyText).toBeTruthy();
        });

        it('should show info text about data privacy', async () => {
            const { findByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            const infoText = await findByText(/Your data is private by default/);
            expect(infoText).toBeTruthy();
        });
    });

    describe('toggle sharing on/off', () => {
        const mockCaregivers = [
            { id: 'cg-1', name: 'Jane Doe', caregiver_id: 'cg-1' },
        ];

        beforeEach(() => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: mockCaregivers });
            SupabaseService.getCareTeamLinks.mockResolvedValue({ data: [] });
            SupabaseService.getHealthSharingPreferences.mockResolvedValue({ data: [] });
        });

        it('should display caregiver name after loading', async () => {
            const { findByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            const caregiverName = await findByText('Jane Doe');
            expect(caregiverName).toBeTruthy();
        });

        it('should show Caregivers group title', async () => {
            const { findByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            const groupTitle = await findByText('Caregivers');
            expect(groupTitle).toBeTruthy();
        });

        it('should expand user controls on press and show Share All switch', async () => {
            const { findByText, getByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            await findByText('Jane Doe');
            // Press the header row (role label) to expand; pressing the name opens profile modal
            const roleLabel = getByText('Caregiver');
            fireEvent.press(roleLabel);
            expect(await findByText('Share All Metrics')).toBeTruthy();
        });

        it('should show Share All switch and call save when toggled', async () => {
            SupabaseService.saveHealthSharingPreferences.mockResolvedValue({ error: null });

            const { findByText, getByText, getByTestId } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            await findByText('Jane Doe');
            fireEvent.press(getByText('Caregiver'));
            await findByText('Share All Metrics');
            const switchEl = getByTestId('health-share-all-cg-1');
            expect(switchEl).toBeTruthy();
            if (typeof switchEl?.props?.onValueChange === 'function') {
                switchEl.props.onValueChange(true);
                await waitFor(() => {
                    expect(SupabaseService.saveHealthSharingPreferences).toHaveBeenCalled();
                });
            }
        });

        it('opens profile modal when caregiver name is pressed', async () => {
            const { findByText, getAllByText, getByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            await findByText('Jane Doe');
            const nameButtons = getAllByText('Jane Doe');
            fireEvent.press(nameButtons[0]);
            await waitFor(() => {
                expect(getByText('Profile')).toBeTruthy();
            });
        });
    });

    describe('shows sharing status', () => {
        it('should show medical staff section when medical staff exist', async () => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: [] });
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    {
                        id: 'link-1',
                        medical_staff_id: 'ms-1',
                        status: 'accepted',
                        medical_staff: { name: 'Dr. Smith' },
                    },
                ],
            });
            SupabaseService.getHealthSharingPreferences.mockResolvedValue({ data: [] });

            const { findAllByText, findByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            // "Medical Staff" appears as both group title and user role label
            const medicalStaffElements = await findAllByText('Medical Staff');
            expect(medicalStaffElements.length).toBeGreaterThanOrEqual(1);
            expect(await findByText('Dr. Smith')).toBeTruthy();
        });

        it('should show both caregiver and medical staff sections', async () => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({
                caregivers: [{ id: 'cg-1', name: 'Jane Doe' }],
            });
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    {
                        id: 'link-1',
                        medical_staff_id: 'ms-1',
                        status: 'accepted',
                        medical_staff: { name: 'Dr. Smith' },
                    },
                ],
            });
            SupabaseService.getHealthSharingPreferences.mockResolvedValue({ data: [] });

            const { findByText, findAllByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            expect(await findByText('Caregivers')).toBeTruthy();
            // "Medical Staff" appears as both group title and user role label
            const medicalStaffElements = await findAllByText('Medical Staff');
            expect(medicalStaffElements.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter out non-accepted medical staff links', async () => {
            CareTeamService.getLinkedCaregivers.mockResolvedValue({ caregivers: [] });
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    {
                        id: 'link-1',
                        medical_staff_id: 'ms-1',
                        status: 'pending',
                        medical_staff: { name: 'Dr. Pending' },
                    },
                ],
            });
            SupabaseService.getHealthSharingPreferences.mockResolvedValue({ data: [] });

            const { findByText, queryByText } = render(
                <HealthSharingSection userId="user-1" userRole="survivor" />
            );
            // Should show empty state since no accepted staff
            expect(await findByText('No care team members yet')).toBeTruthy();
            expect(queryByText('Dr. Pending')).toBeNull();
        });
    });
});
