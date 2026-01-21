// components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire app
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console for debugging
        console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            We're sorry, but something unexpected happened while loading this screen.
                        </Text>
                        {__DEV__ && this.state.error && (
                            <Text style={styles.errorText}>
                                {this.state.error.toString()}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleReset}
                        >
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        ...Typography.title1,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorText: {
        ...Typography.caption,
        color: Colors.error,
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    buttonText: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        color: 'white',
    },
});
