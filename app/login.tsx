// ============================================================================
// RESPONSIVE LOGIN SCREEN - HUME ISLAMIC DATING APP
// ============================================================================
// Complete login with Supabase authentication integration
// ============================================================================

import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import { supabase } from '../src/config/supabase';
import Button from '../components/Button';
import SocialButton from '../components/SocialButton';
import OrSeparator from '../components/OrSeparator';
import { useNavigation, useRouter, router } from 'expo-router';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import * as SecureStore from 'expo-secure-store';
import DesktopMobileNotice from '../components/DesktopMobileNotice';

// Anti-spam configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour window for attempts

const isTestMode = true;

const initialState = {
    inputValues: {
        email: isTestMode ? 'example@gmail.com' : '',
        password: isTestMode ? '**********' : '',
    },
    inputValidities: {
        email: false,
        password: false
    },
    formIsValid: false,
}

type Nav = {
    navigate: (value: string) => void
}

// Anti-spam helper functions
const getStorageKey = (key: string) => `hume_login_${key}`;

const getLoginAttempts = async (): Promise<{ count: number; firstAttempt: number; lockedUntil?: number }> => {
    try {
        const data = Platform.OS === 'web' 
            ? localStorage.getItem(getStorageKey('attempts'))
            : await SecureStore.getItemAsync(getStorageKey('attempts'));
        
        return data ? JSON.parse(data) : { count: 0, firstAttempt: Date.now() };
    } catch {
        return { count: 0, firstAttempt: Date.now() };
    }
};

const setLoginAttempts = async (attempts: { count: number; firstAttempt: number; lockedUntil?: number }) => {
    try {
        const data = JSON.stringify(attempts);
        if (Platform.OS === 'web') {
            localStorage.setItem(getStorageKey('attempts'), data);
        } else {
            await SecureStore.setItemAsync(getStorageKey('attempts'), data);
        }
    } catch (error) {
        console.warn('Failed to store login attempts:', error);
    }
};

const clearLoginAttempts = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(getStorageKey('attempts'));
        } else {
            await SecureStore.deleteItemAsync(getStorageKey('attempts'));
        }
    } catch (error) {
        console.warn('Failed to clear login attempts:', error);
    }
};

// Remember Me helper functions
const getRememberedCredentials = async (): Promise<{ email: string; rememberMe: boolean } | null> => {
    try {
        const data = Platform.OS === 'web'
            ? localStorage.getItem(getStorageKey('remembered'))
            : await SecureStore.getItemAsync(getStorageKey('remembered'));
        
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

const setRememberedCredentials = async (email: string, rememberMe: boolean) => {
    try {
        const data = JSON.stringify({ email, rememberMe, timestamp: Date.now() });
        if (Platform.OS === 'web') {
            localStorage.setItem(getStorageKey('remembered'), data);
        } else {
            await SecureStore.setItemAsync(getStorageKey('remembered'), data);
        }
    } catch (error) {
        console.warn('Failed to store remembered credentials:', error);
    }
};

const clearRememberedCredentials = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(getStorageKey('remembered'));
        } else {
            await SecureStore.deleteItemAsync(getStorageKey('remembered'));
        }
    } catch (error) {
        console.warn('Failed to clear remembered credentials:', error);
    }
};

// Responsive Login Screen
const Login = () => {
    const { navigate } = useNavigation<Nav>();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState<string | null>(null);
    const [isChecked, setChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        }, [dispatchFormState]);

    useEffect(() => {
        if (error) {
            Alert.alert('An error occurred', error)
        }
    }, [error]);

    // Check for lockout status and load remembered credentials on component mount
    useEffect(() => {
        const initializeLogin = async () => {
            // Check lockout status
            const attempts = await getLoginAttempts();
            const now = Date.now();
            
            if (attempts.lockedUntil && now < attempts.lockedUntil) {
                setIsLocked(true);
                setLockoutTimeRemaining(Math.ceil((attempts.lockedUntil - now) / 1000));
            } else if (attempts.lockedUntil && now >= attempts.lockedUntil) {
                // Lockout expired, clear attempts
                await clearLoginAttempts();
            }

            // Load remembered credentials
            const remembered = await getRememberedCredentials();
            if (remembered && remembered.rememberMe) {
                setChecked(true);
                // Pre-fill email if remembered
                dispatchFormState({
                    inputId: 'email',
                    validationResult: validateInput('email', remembered.email),
                    inputValue: remembered.email,
                });
            }
        };

        initializeLogin();
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLocked && lockoutTimeRemaining > 0) {
            timer = setInterval(() => {
                setLockoutTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        clearLoginAttempts();
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

    // Google authentication
    const googleAuthHandler = async () => {
        setIsLoading(true);
        try {
            console.log("Starting Google Authentication for Islamic Dating");
            
            // Start Google OAuth with Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            // The redirect will handle the rest of the flow
            console.log('Google OAuth initiated successfully');
            
        } catch (error: any) {
            console.error('Google auth error:', error);
            Alert.alert(
                'Google Login Failed', 
                error.message || 'Unable to connect to Google. Please try again or use email/password login.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!formState.formIsValid) {
            Alert.alert('Invalid Form', 'Please fill in all fields correctly.');
            return;
        }

        // Check if user is locked out
        if (isLocked) {
            const minutes = Math.ceil(lockoutTimeRemaining / 60);
            Alert.alert(
                'Account Temporarily Locked',
                `Too many failed login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const email = formState.inputValues.email;
            const password = formState.inputValues.password;

            // Direct Supabase auth login
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Handle failed login attempt
                await handleFailedLoginAttempt();
                
                // Provide specific error messages
                let errorMessage = 'Login failed. Please try again.';
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please check your email and click the confirmation link before logging in.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
                }
                
                throw new Error(errorMessage);
            }

            if (data.user && data.session) {
                // Successful login - clear failed attempts
                await clearLoginAttempts();
                
                // Handle Remember Me functionality
                if (isChecked) {
                    await setRememberedCredentials(email, true);
                } else {
                    await clearRememberedCredentials();
                }

                // Check if user has profile
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('user_id', data.user.id)
                    .maybeSingle();

                if (profileError) {
                    console.warn('Profile check error:', profileError);
                }

                // Redirect based on profile existence
                if (profile) {
                    // Has profile - go to main app
                    // Mark filters to reset on next home load
                    try {
                        if (Platform.OS === 'web') {
                            localStorage.setItem('hume_reset_filters_on_login', '1');
                        } else {
                            await SecureStore.setItemAsync('hume_reset_filters_on_login', '1');
                        }
                    } catch {}
                    router.replace('/(tabs)/home');
                } else {
                    // No profile - go to profile setup
                    router.replace('/profile-setup');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
            setError(errorMessage);
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFailedLoginAttempt = async () => {
        const attempts = await getLoginAttempts();
        const now = Date.now();
        
        // Reset attempts if outside the attempt window
        if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
            await setLoginAttempts({ count: 1, firstAttempt: now });
            return;
        }
        
        const newCount = attempts.count + 1;
        
        if (newCount >= MAX_LOGIN_ATTEMPTS) {
            // Lock the account
            const lockedUntil = now + LOCKOUT_DURATION;
            await setLoginAttempts({ 
                count: newCount, 
                firstAttempt: attempts.firstAttempt, 
                lockedUntil 
            });
            
            setIsLocked(true);
            setLockoutTimeRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
            
            Alert.alert(
                'Account Temporarily Locked',
                `Too many failed login attempts. Your account has been locked for 15 minutes for security purposes.`
            );
        } else {
            // Update attempt count
            await setLoginAttempts({ 
                count: newCount, 
                firstAttempt: attempts.firstAttempt 
            });
            
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - newCount;
            if (remainingAttempts <= 2) {
                Alert.alert(
                    'Login Failed',
                    `Invalid credentials. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before your account is temporarily locked.`
                );
            }
        }
    };

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <DesktopMobileNotice />
                <Header title="" showBackButton={false} />
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
                    <Text style={styles.title}>Login to Your Account</Text>
                    <Text style={styles.subtitle}>
                        Welcome back to the Islamic community
                    </Text>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <Input
                            id="email"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['email']}
                            placeholder="Email Address"
                            placeholderTextColor={COLORS.gray}
                            icon={icons.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                        
                        <Input
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['password']}
                            autoCapitalize="none"
                            id="password"
                            placeholder="Password"
                            placeholderTextColor={COLORS.gray}
                            icon={icons.padlock}
                            secureTextEntry={true}
                            style={styles.input}
                        />

                        {/* Remember Me */}
                        <View style={styles.checkBoxContainer}>
                            <TouchableOpacity 
                                style={styles.checkboxRow}
                                onPress={() => setChecked(!isChecked)}
                            >
                                <Checkbox
                                    style={styles.checkbox}
                                    value={isChecked}
                                    color={isChecked ? COLORS.primary : COLORS.gray}
                                    onValueChange={setChecked}
                                />
                                <Text style={styles.checkboxText}>Remember me</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Button
                            title={
                                isLocked 
                                    ? `Locked (${Math.ceil(lockoutTimeRemaining / 60)}m ${lockoutTimeRemaining % 60}s)`
                                    : isLoading 
                                        ? "Logging in..." 
                                        : "Login"
                            }
                            filled
                            onPress={handleLogin}
                            style={[
                                styles.loginButton,
                                isLocked && styles.lockedButton
                            ]}
                            disabled={isLoading || !formState.formIsValid || isLocked}
                        />

                        {/* Forgot Password */}
                        <TouchableOpacity
                            onPress={() => navigate("forgotpasswordmethods")}
                            style={styles.forgotPasswordContainer}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Google OAuth Section */}
                    <View style={styles.oauthContainer}>
                        <OrSeparator text="or continue with" />
                        
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={googleAuthHandler}
                        >
                            <Image 
                                source={icons.google} 
                                style={styles.googleIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Sign Up Link */}
                <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>
                        Don't have an account?{' '}
                        <TouchableOpacity onPress={() => navigate("signup")}>
                            <Text style={styles.signUpText}>Sign Up</Text>
                        </TouchableOpacity>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Responsive Styles
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
    },
    formContainer: {
        width: '100%',
        maxWidth: isMobileWeb() ? '100%' : 400,
        alignSelf: 'center',
    },
    input: {
        marginBottom: getResponsiveSpacing(8),
    },
    checkBoxContainer: {
        marginVertical: getResponsiveSpacing(12),
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: getResponsiveSpacing(12),
        height: isMobileWeb() ? 18 : 20,
        width: isMobileWeb() ? 18 : 20,
        borderRadius: 4,
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    checkboxText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "regular",
        color: COLORS.black,
    },
    loginButton: {
        marginVertical: getResponsiveSpacing(4),
        borderRadius: 30,
        height: isMobileWeb() ? 48 : 52,
    },
    lockedButton: {
        backgroundColor: COLORS.greyscale500,
        borderColor: COLORS.greyscale500,
    },
    forgotPasswordContainer: {
        alignItems: 'center',
        marginTop: getResponsiveSpacing(6),
        marginBottom: getResponsiveSpacing(2),
    },
    forgotPasswordText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.primary,
        textAlign: "center",
    },
    oauthContainer: {
        width: '100%',
        maxWidth: isMobileWeb() ? '100%' : 400,
        alignSelf: 'center',
        marginTop: getResponsiveSpacing(2),
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.greyscale300,
        borderRadius: 30,
        paddingVertical: getResponsiveSpacing(12),
        paddingHorizontal: getResponsiveSpacing(20),
        marginTop: getResponsiveSpacing(2),
        height: isMobileWeb() ? 48 : 52,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    googleIcon: {
        width: isMobileWeb() ? 20 : 24,
        height: isMobileWeb() ? 20 : 24,
        marginRight: getResponsiveSpacing(12),
    },
    googleButtonText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.black,
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
});

export default Login;