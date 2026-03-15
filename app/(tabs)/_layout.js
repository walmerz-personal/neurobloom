import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                }}
            />
            <Tabs.Screen
                name="exercises"
                options={{
                    title: 'Exercises',
                }}
            />
            <Tabs.Screen
                name="lilly"
                options={{
                    title: 'Lilly',
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: 'Progress',
                }}
            />
            <Tabs.Screen
                name="resources"
                options={{
                    title: 'Resources',
                }}
            />
        </Tabs>
    );
}
