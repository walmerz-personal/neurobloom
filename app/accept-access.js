// app/accept-access.js
// This file handles the deep link neurobloom://accept-access?token=...
// It redirects to the accept-access-request screen with the token
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AcceptAccessRedirect() {
    const params = useLocalSearchParams();
    const token = params?.token;

    // Redirect to the accept-access-request screen with the token parameter
    if (token) {
        return <Redirect href={`/accept-access-request?token=${token}`} />;
    }

    // If no token, redirect to home
    return <Redirect href="/(tabs)/home" />;
}
