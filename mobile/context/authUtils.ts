import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const logout = async () => {
    try {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
    } catch {
        // ignore storage failures
    }   
    
    // Use expo-router to redirect to login
    router.replace('/login');
};
