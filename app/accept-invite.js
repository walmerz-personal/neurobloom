// app/accept-invite.js
// This file handles the deep link neurobloom://accept-invite?token=...
// It redirects to the caregiver accept-survivor-invite screen with the token
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AcceptInviteRedirect() {
    const params = useLocalSearchParams();
    const token = params?.token;
    
    // Redirect to the caregiver accept screen with the token parameter
    if (token) {
        return <Redirect href={`/caregiver/accept-survivor-invite?token=${token}`} />;
    }
    
    // If no token, redirect to home
    return <Redirect href="/(tabs)/home" />;
}
