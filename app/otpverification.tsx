import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { useLanguage } from '../src/contexts/LanguageContext';
import LanguageSelector from '../src/components/LanguageSelector';
import { COLORS } from '../constants';
import { OtpInput } from "react-native-otp-entry";
import Button from "../components/Button";
import { useNavigation } from 'expo-router';

type Nav = {
    navigate: (value: string) => void
}

// OTP Verification Screen
const OTPVerification = () => {
    const { navigate } = useNavigation<Nav>();
    const { t } = useLanguage();
    const [time, setTime] = useState(59);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);
    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title={t('auth.otp_verification.title')} />
                <ScrollView>
                    <View style={{ position: 'absolute', top: 8, right: 16 }}>
                        <LanguageSelector showLabel={false} />
                    </View>
                    <Text style={[styles.title, { color: COLORS.black }]}>
                        {t('auth.otp_verification.subtitle')} +1 111 ******99
                    </Text>
                    <OtpInput
                        numberOfDigits={4}
                        onTextChange={(text) => console.log(text)}
                        focusColor={COLORS.primary}
                        focusStickBlinkingDuration={500}
                        onFilled={(text) => console.log(`OTP is ${text}`)}
                        theme={{
                            pinCodeContainerStyle: {
                                backgroundColor: COLORS.secondaryWhite,
                                borderColor: COLORS.secondaryWhite,
                                borderWidth: .4,
                                borderRadius: 10,
                                height: 58,
                                width: 58,
                            },
                            pinCodeTextStyle: {
                                color: COLORS.black,
                            }
                        }} />
                    <View style={styles.codeContainer}>
                        <Text style={[styles.code, { color: COLORS.greyscale900 }]}>{t('auth.otp_verification.didnt_receive')}</Text>
                        <Text style={styles.time}>{`  ${time}  `}</Text>
                        <Text style={[styles.code, { color: COLORS.greyscale900 }]}>{t('auth.otp_verification.code_expires')}</Text>
                    </View>
                </ScrollView>
                <Button
                    title={t('auth.otp_verification.verify')}
                    filled
                    style={styles.button}
                    onPress={() => { navigate("createnewpassword") }}
                />
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
        padding: 16,
        backgroundColor: COLORS.white
    },
    title: {
        fontSize: 18,
        fontFamily: "medium",
        color: COLORS.greyscale900,
        textAlign: "center",
        marginVertical: 54
    },
    OTPStyle: {
        borderRadius: 8,
        height: 58,
        width: 58,
        backgroundColor: COLORS.secondaryWhite,
        borderBottomColor: "gray",
        borderBottomWidth: .4,
        borderWidth: .4,
        borderColor: "gray"
    },
    codeContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
        justifyContent: "center"
    },
    code: {
        fontSize: 18,
        fontFamily: "medium",
        color: COLORS.greyscale900,
        textAlign: "center"
    },
    time: {
        fontFamily: "medium",
        fontSize: 18,
        color: COLORS.primary
    },
    button: {
        borderRadius: 32
    }
})

export default OTPVerification