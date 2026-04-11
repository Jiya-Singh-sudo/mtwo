import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Recaptcha from '@/components/ui/Recaptcha';

export default function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState('');
    const recaptchaRef = React.useRef<any>(null);

    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

    const validate = () => {
        const newErrors: any = {};
        if (!username.trim()) newErrors.username = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleLogin = async () => {
    if (!validate()) return;

    if (!captchaToken) {
        Alert.alert('Verification Required', 'Please complete captcha');
        return;
    }

    setIsLoading(true);

    try {
        await login(username, password, captchaToken);
        router.replace('/');
    } catch (error) {
        setErrors({ general: 'Invalid username or password' });
    } finally {
        setIsLoading(false);
    }
    };

    const handleRecaptchaVerify = (token: string) => {
        setCaptchaToken(token);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Card style={styles.loginCard}>
                        {/* App Logo/Emblem */}
                        <View style={styles.logoContainer}>
                            <View style={styles.emblemCircle}>
                                <Ionicons name="shield-checkmark" size={40} color={colors.white} />
                            </View>
                            <Text style={styles.title}>Lok Bhavan Maharashtra</Text>
                            <Text style={styles.subtitle}>Guest Management System</Text>
                        </View>

                        {/* General Error */}
                        {errors.general && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color={colors.error} />
                                <Text style={styles.errorText}>{errors.general}</Text>
                            </View>
                        )}

                        {/* Input Fields */}
                        <Input
                            label="Username"
                            required
                            placeholder="Enter your username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            error={errors.username}
                            editable={!isLoading}
                        />

                        <View style={styles.passwordContainer}>
                            <Input
                                label="Password"
                                required
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                error={errors.password}
                                editable={!isLoading}
                            />
                            <Recaptcha
                                ref={recaptchaRef}
                                siteKey="6Ld-lncsAAAAAOc1KQ3PBx7R4mILJ8bIrJ4qxErt"
                                url="https://localhost"
                                onExecute={handleRecaptchaVerify}
                            />

                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)} 
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color={colors.muted} 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Button
                            title="Login to Dashboard"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        />

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotButton} disabled={isLoading}>
                            <Text style={styles.forgotButtonText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2026 Lok Bhavan Maharashtra</Text>
                        <Text style={styles.footerSubText}>Secured by NIC</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    loginCard: {
        padding: spacing.xl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    emblemCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.muted,
        marginTop: 4,
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorBg,
        padding: spacing.md,
        borderRadius: 8,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    errorText: {
        color: colors.error,
        ...typography.small,
        flex: 1,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: spacing.md,
        top: 36, // Align with input height
    },
    loginButton: {
        marginTop: spacing.sm,
    },
    forgotButton: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    forgotButtonText: {
        color: colors.primary,
        ...typography.label,
    },
    footer: {
        marginTop: spacing.xxl,
        alignItems: 'center',
    },
    footerText: {
        ...typography.tiny,
        color: colors.muted,
    },
    footerSubText: {
        fontSize: 10,
        color: '#AAA',
        marginTop: 2,
    },
});
