import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import { useLanguage } from '../src/contexts/LanguageContext';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation, useRouter } from 'expo-router';
import { supabase } from '../src/config/supabase';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import * as SecureStore from 'expo-secure-store';
import { EmailService } from '../src/services/email.service';

// Anti-spam configuration for password reset
const MAX_RESET_ATTEMPTS = 3;
const RESET_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const RESET_ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour window for attempts

const isTestMode = false;

const initialState = {
    inputValues: {
        email: isTestMode ? 'example@gmail.com' : '',
    },
    inputValidities: {
        email: false
    },
    formIsValid: false,
}

type Nav = {
    navigate: (value: string) => void
}

// Anti-spam helper functions for password reset
const getResetStorageKey = (key: string) => `hume_reset_${key}`;

const getResetAttempts = async (): Promise<{ count: number; firstAttempt: number; lockedUntil?: number }> => {
    try {
        const data = Platform.OS === 'web' 
            ? localStorage.getItem(getResetStorageKey('attempts'))
            : await SecureStore.getItemAsync(getResetStorageKey('attempts'));
        
        return data ? JSON.parse(data) : { count: 0, firstAttempt: Date.now() };
    } catch {
        return { count: 0, firstAttempt: Date.now() };
    }
};

const setResetAttempts = async (attempts: { count: number; firstAttempt: number; lockedUntil?: number }) => {
    try {
        const data = JSON.stringify(attempts);
        if (Platform.OS === 'web') {
            localStorage.setItem(getResetStorageKey('attempts'), data);
        } else {
            await SecureStore.setItemAsync(getResetStorageKey('attempts'), data);
        }
    } catch (error) {
        console.warn('Failed to store reset attempts:', error);
    }
};

const clearResetAttempts = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(getResetStorageKey('attempts'));
        } else {
            await SecureStore.deleteItemAsync(getResetStorageKey('attempts'));
        }
    } catch (error) {
        console.warn('Failed to clear reset attempts:', error);
    }
};

// Forgot Password Screen
const ForgotPasswordEmail = () => {
    const { navigate } = useNavigation<Nav>();
    const { t } = useLanguage();
    const router = useRouter();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
    const [emailSent, setEmailSent] = useState(false);

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue
            })
        }, [dispatchFormState])

    useEffect(() => {
        if (error) {
            Alert.alert('An error occurred', error)
        }
    }, [error]);

    // Check for lockout status on component mount
    useEffect(() => {
        const checkLockoutStatus = async () => {
            const attempts = await getResetAttempts();
            const now = Date.now();
            
            if (attempts.lockedUntil && now < attempts.lockedUntil) {
                setIsLocked(true);
                setLockoutTimeRemaining(Math.ceil((attempts.lockedUntil - now) / 1000));
            } else if (attempts.lockedUntil && now >= attempts.lockedUntil) {
                // Lockout expired, clear attempts
                await clearResetAttempts();
            }
        };

        checkLockoutStatus();
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLocked && lockoutTimeRemaining > 0) {
            timer = setInterval(() => {
                setLockoutTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        clearResetAttempts();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isLocked, lockoutTimeRemaining]);

    // Handle failed reset attempt
    const handleFailedResetAttempt = async () => {
        const attempts = await getResetAttempts();
        const now = Date.now();
        
        // Reset attempts if outside the attempt window
        if (now - attempts.firstAttempt > RESET_ATTEMPT_WINDOW) {
            await setResetAttempts({ count: 1, firstAttempt: now });
            return;
        }
        
        const newCount = attempts.count + 1;
        
        if (newCount >= MAX_RESET_ATTEMPTS) {
            // Lock the account
            const lockedUntil = now + RESET_LOCKOUT_DURATION;
            await setResetAttempts({ 
                count: newCount, 
                firstAttempt: attempts.firstAttempt, 
                lockedUntil 
            });
            
            setIsLocked(true);
            setLockoutTimeRemaining(Math.ceil(RESET_LOCKOUT_DURATION / 1000));
            
            Alert.alert(
                'Password Reset Temporarily Locked',
                `Too many password reset attempts. Please wait 15 minutes before trying again.`
            );
        } else {
            // Update attempt count
            await setResetAttempts({ 
                count: newCount, 
                firstAttempt: attempts.firstAttempt 
            });
            
            const remainingAttempts = MAX_RESET_ATTEMPTS - newCount;
            if (remainingAttempts <= 1) {
                Alert.alert(
                    'Password Reset Failed',
                    `You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before password reset is temporarily locked.`
                );
            }
        }
    };

    // Handle password reset
    const handlePasswordReset = async () => {
        if (!formState.formIsValid) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // Check if user is locked out
        if (isLocked) {
            const minutes = Math.ceil(lockoutTimeRemaining / 60);
            Alert.alert(
                'Password Reset Temporarily Locked',
                `Too many password reset attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const email = formState.inputValues.email.trim().toLowerCase();

            // Send password reset email using custom email service
            const { error } = await EmailService.sendPasswordReset(email);

            if (error) {
                throw new Error(error.message);
            }

            // Successful reset request - clear failed attempts
            await clearResetAttempts();
            setEmailSent(true);

            Alert.alert(
                'Password Reset Email Sent!',
                `We've sent a password reset link to ${email}. Please check your email and follow the instructions to reset your password.`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/login')
                    }
                ]
            );

        } catch (error: any) {
            console.error('Password reset error:', error);
            
            // Handle failed attempt for anti-spam
            await handleFailedResetAttempt();
            
            // Provide specific error messages
            let errorMessage = 'Failed to send password reset email. Please try again.';
            if (error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
                errorMessage = 'Too many password reset requests. Please wait before trying again.';
            } else if (error.message.includes('network') || error.message.includes('connection')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            Alert.alert('Password Reset Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Header title={t('auth.forgot_password.email.title')} />
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={images.logo2}
                            resizeMode='contain'
                            style={styles.logo}
                        />
                    </View>

                    {/* Title Section */}
                    <Text style={styles.title}>{t('auth.forgot_password.email.title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.forgot_password.email.subtitle')}
                    </Text>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <Input
                            id="email"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['email']}
                            placeholder={t('auth.forgot_password.email.email_placeholder')}
                            placeholderTextColor={COLORS.gray}
                            icon={icons.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />

                        {/* Reset Password Button */}
                        <Button
                            title={
                                isLocked 
                                    ? `Locked (${Math.ceil(lockoutTimeRemaining / 60)}m ${lockoutTimeRemaining % 60}s)`
                                    : isLoading 
                                        ? t('common.loading')
                                        : emailSent
                                            ? t('auth.forgot_password.email.check_email')
                                            : t('auth.forgot_password.email.send_link')
                            }
                            filled
                            onPress={handlePasswordReset}
                            style={[
                                styles.resetButton,
                                isLocked && styles.lockedButton,
                                emailSent && styles.successButton
                            ]}
                            disabled={isLoading || !formState.formIsValid || isLocked || emailSent}
                        />

                        {/* Back to Login */}
                        <TouchableOpacity
                            onPress={() => router.push('/login')}
                            style={styles.backToLoginContainer}
                        >
                            <Text style={styles.backToLoginText}>{t('auth.login.already_have_account') || 'Already have an account?'} {t('auth.login.sign_in')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Sign Up Link */}
                <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>{t('auth.login.dont_have_account')} <Text style={styles.signUpText}>{t('auth.login.sign_up')}</Text></Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: getResponsiveSpacing(20),
        paddingBottom: getResponsiveSpacing(60), // Space for bottom container
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: getResponsiveSpacing(10),
        marginBottom: getResponsiveSpacing(15),
    },
    logo: {
        width: isMobileWeb() ? 80 : 100,
        height: isMobileWeb() ? 80 : 100,
        tintColor: COLORS.primary,
    },
    title: {
        fontSize: getResponsiveFontSize(28),
        fontFamily: "semiBold",
        color: COLORS.black,
        textAlign: "center",
        marginBottom: getResponsiveSpacing(4),
    },
    subtitle: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "regular",
        color: COLORS.gray,
        textAlign: "center",
        marginBottom: getResponsiveSpacing(16),
        paddingHorizontal: getResponsiveSpacing(20),
        lineHeight: getResponsiveFontSize(22),
    },
    formContainer: {
        width: '100%',
        maxWidth: isMobileWeb() ? '100%' : 400,
        alignSelf: 'center',
    },
    input: {
        marginBottom: getResponsiveSpacing(8),
    },
    resetButton: {
        marginVertical: getResponsiveSpacing(4),
        borderRadius: 30,
        height: isMobileWeb() ? 48 : 52,
    },
    lockedButton: {
        backgroundColor: COLORS.greyscale500,
        borderColor: COLORS.greyscale500,
    },
    successButton: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    backToLoginContainer: {
        alignItems: 'center',
        marginTop: getResponsiveSpacing(6),
        marginBottom: getResponsiveSpacing(2),
    },
    backToLoginText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.primary,
        textAlign: "center",
    },
    bottomContainer: {
        alignItems: 'center',
        paddingVertical: getResponsiveSpacing(20),
        paddingHorizontal: getResponsiveSpacing(20),
        borderTopWidth: 1,
        borderTopColor: COLORS.greyscale300,
        backgroundColor: COLORS.white,
    },
    bottomText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "regular",
        color: COLORS.black,
        textAlign: 'center',
    },
    signUpText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "semiBold",
        color: COLORS.primary,
    },
})

export default ForgotPasswordEmail