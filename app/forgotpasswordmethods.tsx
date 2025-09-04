import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useNavigation } from 'expo-router';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

type Nav = {
    navigate: (value: string) => void
};

// Forgot Password Methods
const ForgotPasswordMethods = () => {
    const { navigate } = useNavigation<Nav>();
    const [selectedMethod, setSelectedMethod] = useState('email'); // Default to email since SMS is disabled

    const handleMethodPress = (method: any) => {
        // Only allow email selection, SMS is disabled
        if (method === 'email') {
            setSelectedMethod(method);
        }
    };
    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="Forgot Password" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.passwordContainer}>
                        <Image
                            source={illustrations.password}
                            resizeMode='contain'
                            style={styles.password}
                        />
                    </View>
                    <Text style={[styles.title, {
                        color: COLORS.greyscale900
                    }]}>Select which contact details
                        should we use to reset your password</Text>
                    <View
                        style={[
                            styles.methodContainer,
                            styles.disabledMethodContainer,
                        ]}>
                        <View style={[styles.iconContainer, styles.disabledIconContainer]}>
                            <Image
                                source={icons.chat}
                                resizeMode='contain'
                                style={[styles.icon, styles.disabledIcon]} />
                        </View>
                        <View style={styles.methodContent}>
                            <View style={styles.methodTextContainer}>
                                <Text style={[styles.methodTitle, styles.disabledMethodTitle]}>via SMS:</Text>
                                <Text style={[styles.methodSubtitle, styles.disabledMethodSubtitle]}>+1 111 ******99</Text>
                            </View>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>Will be activated soon</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.methodContainer,
                            selectedMethod === 'email' && { borderColor: COLORS.primary, borderWidth: 2 }, // Customize the border color for Email
                        ]}
                        onPress={() => handleMethodPress('email')}
                    >
                        <View style={styles.iconContainer}>
                            <Image
                                source={icons.email}
                                resizeMode='contain'
                                style={styles.icon} />
                        </View>
                        <View>
                            <Text style={styles.methodTitle}>via Email:</Text>
                            <Text style={[styles.methodSubtitle, {
                                color: COLORS.black
                            }]}>and***ley@yourdomain.com</Text>
                        </View>
                    </TouchableOpacity>
                    <Button
                        title="Continue"
                        filled
                        style={styles.button}
                        onPress={() => navigate('forgotpasswordemail')}
                        disabled={selectedMethod !== 'email'}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16
    },
    password: {
        width: 276,
        height: 250
    },
    passwordContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 32
    },
    title: {
        fontSize: 18,
        fontFamily: "medium",
        color: COLORS.greyscale900
    },
    methodContainer: {
        width: SIZES.width - 32,
        height: 112,
        borderRadius: 32,
        borderColor: "gray",
        borderWidth: .3,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 22
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.tansparentPrimary,
        marginHorizontal: 16
    },
    icon: {
        width: 32,
        height: 32,
        tintColor: COLORS.primary
    },
    methodTitle: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.greyscale600
    },
    methodSubtitle: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.black,
        marginTop: 12
    },
    button: {
        borderRadius: 32,
        marginVertical: 22
    },
    disabledMethodContainer: {
        opacity: 0.6,
        backgroundColor: COLORS.greyscale100,
        borderColor: COLORS.greyscale300,
    },
    disabledIconContainer: {
        backgroundColor: COLORS.greyscale200,
    },
    disabledIcon: {
        tintColor: COLORS.greyscale500,
    },
    disabledMethodTitle: {
        color: COLORS.greyscale500,
    },
    disabledMethodSubtitle: {
        color: COLORS.greyscale400,
    },
    methodContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: getResponsiveSpacing(16),
    },
    methodTextContainer: {
        flex: 1,
    },
    comingSoonBadge: {
        backgroundColor: COLORS.warning,
        paddingHorizontal: getResponsiveSpacing(8),
        paddingVertical: getResponsiveSpacing(4),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    comingSoonText: {
        fontSize: getResponsiveFontSize(10),
        fontFamily: 'semiBold',
        color: COLORS.white,
        textAlign: 'center',
    },
})

export default ForgotPasswordMethods