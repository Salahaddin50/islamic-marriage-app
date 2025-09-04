import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES } from '@/constants';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import ReasonZawajplusItem from '@/components/ReasonZawajplusItem';

const reasons = [
    "Find meaningful connections",
    "Meet new people near you",
    "Explore shared interests",
    "Start exciting conversations",
    "Discover potential partners",
    "Other reasons",
];

type Nav = {
    navigate: (value: string) => void
}

// Reason for using Zawajplus
const ReasonForUsingZawajplus = () => {
    const { navigate } = useNavigation<Nav>();
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

    const toggleReason = (reason: string) => {
        setSelectedReasons((prevSelectedReasons) =>
            prevSelectedReasons.includes(reason)
                ? prevSelectedReasons.filter((r) => r !== reason)
                : [...prevSelectedReasons, reason]
        );
    };

    const sendSelectedReasons = async () => {
        try {
            const response = await fetch('https://your-backend-endpoint.com/api/reasons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reasons: selectedReasons }),
            });

            if (!response.ok) {
                throw new Error('Failed to send reasons');
            }

            Alert.alert('Success', 'Selected reasons sent successfully');
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Error', 'An unknown error occurred');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, {
                        color: COLORS.greyscale900
                    }]}>Reason for Using Zawajplus</Text>
                    <Text style={[styles.subtitle, {
                        color: COLORS.greyscale900
                    }]}>We want to provide the best experience according to your needs.</Text>
                    <View style={styles.reasonContainer}>
                        {reasons.map((reason, index) => (
                            <ReasonZawajplusItem
                                key={index}
                                reason={reason}
                                isChecked={selectedReasons.includes(reason)}
                                onToggle={toggleReason}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
            <View style={styles.bottomContainer}>
                <Button
                    title="Continue"
                    filled
                    style={styles.button}
                    onPress={() => navigate("verifyyouridentity")}
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
        fontSize: 28,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        textAlign: "center",
        marginVertical: 22
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.greyscale900,
        textAlign: "center",
        paddingHorizontal: 3
    },
    reasonContainer: {
        marginVertical: 22
    },
    button: {
        marginTop: 12,
        width: SIZES.width - 32,
        borderRadius: 32
    },
    bottomContainer: {
        position: "absolute",
        bottom: 28,
        right: 0,
        left: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16
    }
})

export default ReasonForUsingZawajplus