import React from 'react';
import { Image, StyleSheet } from 'react-native';

const Logo = ({ style }) => {
    return (
        <Image
            source={require('../assets/neurobloom-logo.png')}
            style={[styles.logo, style]}
            resizeMode="contain"
        />
    );
};

const styles = StyleSheet.create({
    logo: {
        width: 40,
        height: 40,
    },
});

export default Logo;
