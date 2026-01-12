import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Home, Dumbbell, MessageCircle, TrendingUp } from 'lucide-react-native';

export function TabBar({ state, descriptors, navigation }) {
    return (
        <View style={styles.tabBar} testID="tab-bar">
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                let IconComponent;
                if (route.name === 'home') IconComponent = Home;
                else if (route.name === 'exercises') IconComponent = Dumbbell;
                else if (route.name === 'lilly') IconComponent = MessageCircle;
                else if (route.name === 'progress') IconComponent = TrendingUp;

                const color = isFocused ? Colors.primary : Colors.textSecondary;

                return (
                    <TouchableOpacity
                        key={index}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabItem}
                    >
                        <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
                            <IconComponent size={24} color={color} strokeWidth={isFocused ? 2.5 : 2} testID={`tab-icon-${route.name}`} />
                        </View>
                        <Text style={[styles.label, isFocused && styles.labelFocused]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        height: 88,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 24,
        paddingTop: 12,
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    iconContainerFocused: {
        backgroundColor: Colors.primaryLight + '20', // 20% opacity
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: Colors.textSecondary,
    },
    labelFocused: {
        fontFamily: 'Inter_600SemiBold',
        color: Colors.primary,
    },
});
