import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableWithoutFeedback, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import Header from '../components/Header';
import { useLanguage } from '../src/contexts/LanguageContext';
import LanguageSelector from '../src/components/LanguageSelector';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation, useRouter } from 'expo-router';
import { supabase } from '../src/config/supabase';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import { z } from 'zod';

// Password validation schema
const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

const isTestMode = false;

const initialState = {
    inputValues: {
        newPassword: isTestMode ? '**********' : '',
        confirmNewPassword: isTestMode ? '**********' : '',
    },
    inputValidities: {
        newPassword: false,
        confirmNewPassword: false,
    },
    formIsValid: false,
}

type Nav = {
    navigate: (value: string) => void
};

// Create New Password Screen
const CreateNewPassword = () => {
    const { navigate } = useNavigation<Nav>();
    const { t } = useLanguage();
    const router = useRouter();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState<string>('');

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        },
        [dispatchFormState]);

    useEffect(() => {
        if (error) {
            Alert.alert('An error occurred', error)
        }
    }, [error]);

    // Check password strength and match
    useEffect(() => {
        const newPassword = formState.inputValues.newPassword;
        const confirmPassword = formState.inputValues.confirmNewPassword;

        // Check password strength
        if (newPassword) {
            const hasLower = /[a-z]/.test(newPassword);
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasNumber = /\d/.test(newPassword);
            const hasSpecial = /[@$!%*?&]/.test(newPassword);
            const isLongEnough = newPassword.length >= 8;

            const strengthCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
            
            if (strengthCount < 3) {
                setPasswordStrength('Weak');
            } else if (strengthCount < 5) {
                setPasswordStrength('Medium');
            } else {
                setPasswordStrength('Strong');
            }
        } else {
            setPasswordStrength('');
        }

        // Check if passwords match
        if (confirmPassword && newPassword) {
            setPasswordsMatch(newPassword === confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [formState.inputValues.newPassword, formState.inputValues.confirmNewPassword]);

    // Handle password reset
    const handlePasswordReset = async () => {
        const newPassword = formState.inputValues.newPassword;
        const confirmPassword = formState.inputValues.confirmNewPassword;

        // Validate passwords
        try {
            passwordSchema.parse({
                newPassword,
                confirmNewPassword: confirmPassword
            });
        } catch (validationError: any) {
            const errorMessage = validationError.errors?.[0]?.message || 'Please check your password requirements.';
            Alert.alert('Invalid Password', errorMessage);
            return;
        }

        if (!formState.formIsValid || !passwordsMatch) {
            Alert.alert('Invalid Input', 'Please ensure both passwords match and meet the requirements.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Update password using Supabase
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw new Error(error.message);
            }

            // Success - show modal
            setModalVisible(true);

        } catch (error: any) {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to reset password. Please try again.';
            if (error.message.includes('session')) {
                errorMessage = 'Your password reset session has expired. Please request a new password reset link.';
            } else if (error.message.includes('weak')) {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            Alert.alert('Password Reset Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const renderModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <TouchableWithoutFeedback
                    onPress={() => setModalVisible(false)}>
                    <View style={[styles.modalContainer]}>
                        <View style={[styles.modalSubContainer, {
                            backgroundColor: COLORS.secondaryWhite
                        }]}>
                            <Image
                                source={illustrations.passwordSuccess}
                                resizeMode='contain'
                                style={styles.modalIllustration}
                            />
                            <Text style={[styles.modalTitle, { color: COLORS.greyscale900 }]}>{t('auth.create_new_password.modal_title')}</Text>
                            <Text style={styles.modalSubtitle}>{t('auth.create_new_password.modal_subtitle')}</Text>
                            <Button
                                title={t('auth.create_new_password.continue_to_login')}
                                filled
                                onPress={() => {
                                    setModalVisible(false)
                                    router.push("/login")
                                }}
                                style={{
                                    width: "100%",
                                    marginTop: 12
                                }}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        )
    }

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Header title={t('auth.create_new_password.header_title')} />
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ position: 'absolute', top: 8, right: 16 }}>
                        <LanguageSelector showLabel={false} />
                    </View>
                    {/* Illustration Section */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={illustrations.newPassword}
                            resizeMode='contain'
                            style={styles.illustration}
                        />
                    </View>

                    {/* Title Section */}
                    <Text style={styles.title}>{t('auth.create_new_password.title')}</Text>
                    <Text style={styles.subtitle}>{t('auth.create_new_password.subtitle')}</Text>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <Input
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['newPassword']}
                            autoCapitalize="none"
                            id="newPassword"
                            placeholder={t('auth.create_new_password.new_password_placeholder')}
                            placeholderTextColor={COLORS.gray}
                            icon={icons.padlock}
                            secureTextEntry={true}
                            style={styles.input}
                        />

                        {/* Password Strength Indicator */}
                        {passwordStrength && (
                            <View style={styles.strengthContainer}>
                                <Text style={styles.strengthLabel}>{t('auth.create_new_password.strength_label')} </Text>
                                <Text style={[
                                    styles.strengthText,
                                    passwordStrength === 'Weak' && styles.weakText,
                                    passwordStrength === 'Medium' && styles.mediumText,
                                    passwordStrength === 'Strong' && styles.strongText,
                                ]}>
                                    {passwordStrength === 'Weak' ? t('auth.create_new_password.strength_weak') : passwordStrength === 'Medium' ? t('auth.create_new_password.strength_medium') : passwordStrength === 'Strong' ? t('auth.create_new_password.strength_strong') : ''}
                                </Text>
                            </View>
                        )}

                        <Input
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['confirmNewPassword']}
                            autoCapitalize="none"
                            id="confirmNewPassword"
                            placeholder={t('auth.create_new_password.confirm_new_password_placeholder')}
                            placeholderTextColor={COLORS.gray}
                            icon={icons.padlock}
                            secureTextEntry={true}
                            style={styles.input}
                        />

                        {/* Password Match Indicator */}
                        {formState.inputValues.confirmNewPassword && !passwordsMatch && (
                            <Text style={styles.errorText}>Passwords don't match</Text>
                        )}

                        {/* Password Requirements */}
                        <View style={styles.requirementsContainer}>
                            <Text style={styles.requirementsTitle}>{t('auth.create_new_password.requirements_title')}</Text>
                            <Text style={styles.requirementText}>{t('auth.create_new_password.requirement_8_chars')}</Text>
                            <Text style={styles.requirementText}>{t('auth.create_new_password.requirement_upper')}</Text>
                            <Text style={styles.requirementText}>{t('auth.create_new_password.requirement_lower')}</Text>
                            <Text style={styles.requirementText}>{t('auth.create_new_password.requirement_number')}</Text>
                            <Text style={styles.requirementText}>{t('auth.create_new_password.requirement_special')}</Text>
                        </View>

                        {/* Reset Password Button */}
                        <Button
                            title={isLoading ? t('auth.create_new_password.resetting') : t('auth.create_new_password.reset_button')}
                            filled
                            onPress={handlePasswordReset}
                            style={styles.resetButton}
                            disabled={isLoading || !formState.formIsValid || !passwordsMatch}
                        />
                    </View>
                </ScrollView>
                {renderModal()}
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
        paddingBottom: getResponsiveSpacing(40),
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: getResponsiveSpacing(10),
        marginBottom: getResponsiveSpacing(15),
    },
    illustration: {
        width: isMobileWeb() ? SIZES.width * 0.6 : SIZES.width * 0.8,
        height: isMobileWeb() ? 200 : 250,
    },
    title: {
        fontSize: getResponsiveFontSize(26),
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
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveSpacing(12),
        marginTop: getResponsiveSpacing(-4),
    },
    strengthLabel: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "regular",
        color: COLORS.gray,
    },
    strengthText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "semiBold",
    },
    weakText: {
        color: COLORS.error,
    },
    mediumText: {
        color: COLORS.warning,
    },
    strongText: {
        color: COLORS.success,
    },
    errorText: {
        fontSize: getResponsiveFontSize(12),
        fontFamily: 'regular',
        color: COLORS.error,
        marginTop: getResponsiveSpacing(-4),
        marginBottom: getResponsiveSpacing(8),
    },
    requirementsContainer: {
        backgroundColor: COLORS.greyscale100,
        padding: getResponsiveSpacing(16),
        borderRadius: 12,
        marginBottom: getResponsiveSpacing(16),
    },
    requirementsTitle: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: "semiBold",
        color: COLORS.black,
        marginBottom: getResponsiveSpacing(8),
    },
    requirementText: {
        fontSize: getResponsiveFontSize(12),
        fontFamily: "regular",
        color: COLORS.gray,
        marginBottom: getResponsiveSpacing(2),
    },
    resetButton: {
        marginVertical: getResponsiveSpacing(4),
        borderRadius: 30,
        height: isMobileWeb() ? 48 : 52,
    },
    modalTitle: {
        fontSize: getResponsiveFontSize(24),
        fontFamily: "bold",
        color: COLORS.primary,
        textAlign: "center",
        marginVertical: getResponsiveSpacing(12),
    },
    modalSubtitle: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "regular",
        color: COLORS.greyscale600,
        textAlign: "center",
        marginVertical: getResponsiveSpacing(12),
        paddingHorizontal: getResponsiveSpacing(16),
        lineHeight: getResponsiveFontSize(22),
    },
    modalContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSubContainer: {
        width: SIZES.width * 0.9,
        maxWidth: 400,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        padding: getResponsiveSpacing(16),
    },
    modalIllustration: {
        height: isMobileWeb() ? 150 : 180,
        width: isMobileWeb() ? 150 : 180,
        marginVertical: getResponsiveSpacing(22),
    }
})

export default CreateNewPassword