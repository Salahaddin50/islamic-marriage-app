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

// Responsive Login Screen
const Login = () => {
    const { navigate } = useNavigation<Nav>();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState(null);
    const [isChecked, setChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
                throw new Error(error.message);
            }

            if (data.user && data.session) {
                // Store login state if remember me is checked
                if (isChecked) {
                    console.log('Remember me enabled');
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

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                            title={isLoading ? "Logging in..." : "Login"}
                            filled
                            onPress={handleLogin}
                            style={styles.loginButton}
                            disabled={isLoading || !formState.formIsValid}
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
        borderColor: COLORS.gray6,
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
        borderTopColor: COLORS.gray7,
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