// __tests__/components/TabBar.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabBar } from '../../components/TabBar';
import { Colors } from '../../constants/Colors';

const mockUseAuth = jest.fn(() => ({ userData: { role: 'survivor' } }));
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: (...args) => mockUseAuth(...args),
}));

describe('TabBar', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        emit: jest.fn(() => ({ defaultPrevented: false })),
    };

    const createMockState = (currentIndex = 0) => ({
        index: currentIndex,
        routes: [
            { key: 'home', name: 'home' },
            { key: 'exercises', name: 'exercises' },
            { key: 'lilly', name: 'lilly' },
            { key: 'progress', name: 'progress' },
        ],
    });

    const createMockDescriptors = () => ({
        home: {
            options: {
                tabBarLabel: 'Home',
                title: 'Home',
            },
        },
        exercises: {
            options: {
                tabBarLabel: 'Exercises',
                title: 'Exercises',
            },
        },
        lilly: {
            options: {
                tabBarLabel: 'Lilly',
                title: 'Lilly',
            },
        },
        progress: {
            options: {
                tabBarLabel: 'Progress',
                title: 'Progress',
            },
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Helper to flatten styles
    const getStyle = (element) => {
        const style = element.props.style;
        return Array.isArray(style) ? Object.assign({}, ...style) : style;
    };

    describe('Rendering', () => {
        it('should render all tab items', () => {
            const state = createMockState();
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Home')).toBeTruthy();
            expect(getByText('Exercises')).toBeTruthy();
            expect(getByText('Lilly')).toBeTruthy();
            expect(getByText('Progress')).toBeTruthy();
        });

        it('should display correct icons for each route', () => {
            const state = createMockState();
            const descriptors = createMockDescriptors();

            const { getAllByTestId } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getAllByTestId('tab-icon-home')[0]).toBeTruthy();
            expect(getAllByTestId('tab-icon-exercises')[0]).toBeTruthy();
            expect(getAllByTestId('tab-icon-lilly')[0]).toBeTruthy();
            expect(getAllByTestId('tab-icon-progress')[0]).toBeTruthy();
        });

        it('should use tabBarLabel when available', () => {
            const state = createMockState();
            const descriptors = {
                home: {
                    options: {
                        tabBarLabel: 'Custom Label',
                        title: 'Home',
                    },
                },
            };

            const { getByText } = render(
                <TabBar
                    state={{ index: 0, routes: [{ key: 'home', name: 'home' }] }}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Custom Label')).toBeTruthy();
        });

        it('should fallback to title when tabBarLabel is undefined', () => {
            const state = createMockState();
            const descriptors = {
                home: {
                    options: {
                        title: 'Home Title',
                    },
                },
            };

            const { getByText } = render(
                <TabBar
                    state={{ index: 0, routes: [{ key: 'home', name: 'home' }] }}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Home Title')).toBeTruthy();
        });

        it('should fallback to route name when both label and title are undefined', () => {
            const state = createMockState();
            const descriptors = {
                home: {
                    options: {},
                },
            };

            const { getByText } = render(
                <TabBar
                    state={{ index: 0, routes: [{ key: 'home', name: 'home' }] }}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('home')).toBeTruthy();
        });
    });

    describe('Active State', () => {
        it('should highlight the active tab', () => {
            const state = createMockState(0); // Home is active
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const homeLabel = getByText('Home');
            const exercisesLabel = getByText('Exercises');

            const homeColor = getStyle(homeLabel).color;
            const exercisesColor = getStyle(exercisesLabel).color;

            expect(homeColor).toBe(Colors.primary);
            expect(exercisesColor).toBe(Colors.textSecondary);
        });

        it('should update active tab when index changes', () => {
            const state = createMockState(2); // Lilly is active
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const lillyLabel = getByText('Lilly');
            const homeLabel = getByText('Home');

            const lillyColor = getStyle(lillyLabel).color;
            const homeColor = getStyle(homeLabel).color;

            expect(lillyColor).toBe(Colors.primary);
            expect(homeColor).toBe(Colors.textSecondary);
        });

        it('should set accessibility state for focused tab', () => {
            const state = createMockState(1); // Exercises is active
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const exercisesTab = getByText('Exercises').parent.parent;
            const homeTab = getByText('Home').parent.parent;

            expect(exercisesTab.props.accessibilityState).toEqual({ selected: true });
            expect(homeTab.props.accessibilityState).toEqual({});
        });
    });

    describe('Navigation', () => {
        it('should call navigation.navigate when tab is pressed', () => {
            const state = createMockState(0); // Home is active
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            fireEvent.press(getByText('Exercises'));

            expect(mockNavigation.navigate).toHaveBeenCalledWith('exercises', undefined);
        });

        it('should not navigate when pressing the already active tab', () => {
            const state = createMockState(0); // Home is active
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            fireEvent.press(getByText('Home'));

            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });

        it('should emit tabPress event before navigating', () => {
            const state = createMockState(0);
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            fireEvent.press(getByText('Lilly'));

            expect(mockNavigation.emit).toHaveBeenCalledWith({
                type: 'tabPress',
                target: 'lilly',
                canPreventDefault: true,
            });
        });

        it('should not navigate if event is prevented', () => {
            const state = createMockState(0);
            const descriptors = createMockDescriptors();
            mockNavigation.emit.mockReturnValueOnce({ defaultPrevented: true });

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            fireEvent.press(getByText('Progress'));

            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });

        it('should handle long press event', () => {
            const state = createMockState(0);
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const exercisesTab = getByText('Exercises').parent.parent;
            fireEvent(exercisesTab, 'longPress');

            expect(mockNavigation.emit).toHaveBeenCalledWith({
                type: 'tabLongPress',
                target: 'exercises',
            });
        });
    });

    describe('Accessibility', () => {
        it('should have correct accessibility role for each tab', () => {
            const state = createMockState();
            const descriptors = createMockDescriptors();

            const { getByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const homeTab = getByText('Home').parent.parent;
            expect(homeTab.props.accessibilityRole).toBe('button');
        });

        it('should use accessibility labels from options', () => {
            const state = createMockState();
            const descriptors = {
                home: {
                    options: {
                        tabBarLabel: 'Home',
                        tabBarAccessibilityLabel: 'Navigate to Home',
                    },
                },
            };

            const { getByText } = render(
                <TabBar
                    state={{ index: 0, routes: [{ key: 'home', name: 'home' }] }}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const homeTab = getByText('Home').parent.parent;
            expect(homeTab.props.accessibilityLabel).toBe('Navigate to Home');
        });

        it('should use testID from options', () => {
            const state = createMockState();
            const descriptors = {
                home: {
                    options: {
                        tabBarLabel: 'Home',
                        tabBarTestID: 'home-tab',
                    },
                },
            };

            const { getByText } = render(
                <TabBar
                    state={{ index: 0, routes: [{ key: 'home', name: 'home' }] }}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const homeTab = getByText('Home').parent.parent;
            expect(homeTab.props.testID).toBe('home-tab');
        });
    });

    describe('Styling', () => {
        it('should have correct tab bar height', () => {
            const state = createMockState();
            const descriptors = createMockDescriptors();

            const { getByTestId } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const tabBar = getByTestId('tab-bar');
            const style = getStyle(tabBar);

            expect(style.height).toBe(88);
        });

        it('should have correct border styling', () => {
            const state = createMockState();
            const descriptors = createMockDescriptors();

            const { getByTestId } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            const tabBar = getByTestId('tab-bar');
            const style = getStyle(tabBar);

        expect(style.borderTopWidth).toBe(1);
        expect(style.borderTopColor).toBe(Colors.border);
        });
    });

    describe('Role-based tab visibility', () => {
        const stateWithResources = (currentIndex = 0) => ({
            index: currentIndex,
            routes: [
                { key: 'home', name: 'home' },
                { key: 'exercises', name: 'exercises' },
                { key: 'lilly', name: 'lilly' },
                { key: 'progress', name: 'progress' },
                { key: 'resources', name: 'resources' },
            ],
        });

        const descriptorsWithResources = () => ({
            home: { options: { title: 'Home' } },
            exercises: { options: { title: 'Exercises' } },
            lilly: { options: { title: 'Lilly' } },
            progress: { options: { title: 'Progress' } },
            resources: { options: { title: 'Resources' } },
        });

        it('shows Resources and hides Progress when role is caregiver', () => {
            mockUseAuth.mockImplementation(() => ({ userData: { role: 'caregiver' } }));
            const state = stateWithResources(4);
            const descriptors = descriptorsWithResources();

            const { getByText, queryByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Resources')).toBeTruthy();
            expect(queryByText('Progress')).toBeNull();
            mockUseAuth.mockImplementation(() => ({ userData: { role: 'survivor' } }));
        });

        it('shows Resources and hides Progress when role is medical_staff', () => {
            mockUseAuth.mockImplementation(() => ({ userData: { role: 'medical_staff' } }));
            const state = stateWithResources(4);
            const descriptors = descriptorsWithResources();

            const { getByText, queryByText } = render(
                <TabBar
                    state={state}
                    descriptors={descriptors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Resources')).toBeTruthy();
            expect(queryByText('Progress')).toBeNull();
            mockUseAuth.mockImplementation(() => ({ userData: { role: 'survivor' } }));
        });
    });
});
