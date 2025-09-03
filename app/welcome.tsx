// ============================================================================
// RESPONSIVE WELCOME SCREEN - HUME ISLAMIC DATING APP
// ============================================================================
// Mobile-first responsive welcome page with Islamic branding
// ============================================================================

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, icons, images } from "../constants";
import SocialButtonV2 from "../components/SocialButtonV2";
import { useNavigation } from "expo-router";
import { getResponsiveFontSize, getResponsiveSpacing, getResponsiveWidth, isMobileWeb } from "../utils/responsive";
import { supabase } from "../src/config/supabase";
import DesktopMobileNotice from "../components/DesktopMobileNotice";

type Nav = {
    navigate: (value: string) => void
}

// Responsive Welcome Screen
const Welcome = () => {
    const { navigate } = useNavigation<Nav>();

    // Handle Google Sign In with Supabase - INSTANT redirect
    const handleGoogleSignIn = async () => {
        try {
            // Use Supabase Google OAuth directly - no loading state needed
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: Platform.OS === 'web' 
                        ? `${window.location.origin}/auth/callback`
                        : 'com.hume.dating://auth/callback'
                }
            });
            
            if (error) {
                throw error;
            }
            
            // For web, redirect happens automatically and instantly
            // For mobile, OAuth flow will handle the redirect
            
        } catch (error: any) {
            console.error('Google Sign In Error:', error);
            
            // Show user-friendly error message only on actual errors
            Alert.alert(
                "Authentication Failed", 
                error.message || "Failed to sign in with Google. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <DesktopMobileNotice />
                {/* Main Content */}
                <View style={styles.contentContainer}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Image 
                            source={images.logo2} 
                            resizeMode="contain" 
                            style={styles.logo} 
                        />
                    </View>

                    {/* Title Section */}
                    <Text style={styles.title}>Assalamu Aleykoum</Text>
                    <Text style={styles.subtitle}>
                        A dedicated platform for those seeking to live the blessed Sunnah of polygamy. All female profiles are verified and Walis are notified for complete transparency.
                    </Text>

                    {/* Social Buttons Section */}
                    <View style={styles.socialButtonsContainer}>
                        {/* Google OAuth - Instant Redirect */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleSignIn}
                        >
                            <Image 
                                source={icons.google} 
                                style={styles.socialIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Email Registration */}
                        <TouchableOpacity
                            style={styles.emailButton}
                            onPress={() => navigate("signup")}
                        >
                            <Image 
                                source={icons.email2} 
                                style={styles.socialIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.emailButtonText}>Continue with Email</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <TouchableOpacity onPress={() => navigate("login")}>
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </Text>
                    </View>
                </View>

                {/* Terms and Privacy */}
                <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>
                        By continuing, you accept our{' '}
                        <TouchableOpacity onPress={() => navigate("settingsprivacypolicy")}>
                            <Text style={styles.bottomLink}>Terms of Use</Text>
                        </TouchableOpacity>
                        {' '}and{' '}
                        <TouchableOpacity onPress={() => navigate("settingsprivacypolicy")}>
                            <Text style={styles.bottomLink}>Privacy Policy</Text>
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
    contentContainer: {
        flex: 1,
        paddingHorizontal: getResponsiveSpacing(24),
        alignItems: "center",
        justifyContent: "center",
        maxWidth: isMobileWeb() ? '100%' : 400,
        alignSelf: 'center',
        width: '100%',
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: getResponsiveSpacing(32),
    },
    logo: {
        width: isMobileWeb() ? 80 : 90,
        height: isMobileWeb() ? 80 : 90,
        tintColor: COLORS.primary,
    },
    title: {
        fontSize: getResponsiveFontSize(32),
        fontFamily: "bold",
        color: COLORS.black,
        textAlign: "center",
        marginBottom: getResponsiveSpacing(12),
    },
    subtitle: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "regular",
        color: COLORS.gray,
        textAlign: "center",
        paddingHorizontal: getResponsiveSpacing(20),
        marginBottom: getResponsiveSpacing(40),
        lineHeight: getResponsiveFontSize(22),
    },
    socialButtonsContainer: {
        width: '100%',
        marginBottom: getResponsiveSpacing(32),
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.gray6,
        borderRadius: 30,
        paddingVertical: getResponsiveSpacing(16),
        paddingHorizontal: getResponsiveSpacing(20),
        marginBottom: getResponsiveSpacing(16),
        height: isMobileWeb() ? 52 : 56,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 30,
        paddingVertical: getResponsiveSpacing(16),
        paddingHorizontal: getResponsiveSpacing(20),
        height: isMobileWeb() ? 52 : 56,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    socialIcon: {
        width: isMobileWeb() ? 20 : 24,
        height: isMobileWeb() ? 20 : 24,
        marginRight: getResponsiveSpacing(12),
    },
    googleButtonText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.black,
    },
    emailButtonText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.white,
    },
    loginContainer: {
        alignItems: 'center',
    },
    loginText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "regular",
        color: COLORS.black,
        textAlign: 'center',
    },
    loginLink: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "semiBold",
        color: COLORS.primary,
    },
    bottomContainer: {
        paddingHorizontal: getResponsiveSpacing(24),
        paddingVertical: getResponsiveSpacing(20),
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.gray7,
    },
    bottomText: {
        fontSize: getResponsiveFontSize(12),
        fontFamily: "regular",
        color: COLORS.gray,
        textAlign: "center",
        lineHeight: getResponsiveFontSize(16),
    },
    bottomLink: {
        fontSize: getResponsiveFontSize(12),
        fontFamily: "medium",
        color: COLORS.primary,
        textDecorationLine: "underline",
    },
});

export default Welcome;