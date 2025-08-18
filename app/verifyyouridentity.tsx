import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES, illustrations } from '@/constants';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import { Image } from 'expo-image';

type Nav = {
    navigate: (value: string) => void
}

// Verify your identity screen
const VerifyYourIdentity = () => {
    const { navigate } = useNavigation<Nav>();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, {
                        color: COLORS.greyscale900
                    }]}>Let’s Verify Your Identity</Text>
                    <Text style={[styles.subtitle, {
                        color: COLORS.greyscale900
                    }]}>We want to confirm your identity before you can use our service.</Text>
                    <View style={styles.identityContainer}>
                        <Image
                            source={illustrations.identity}
                            contentFit='cover'
                            style={styles.identityImage}
                        />
                    </View>
                </ScrollView>
            </View>
            <View style={styles.bottomContainer}>
                <Button
                    title="Verify Identity"
                    filled
                    style={styles.button}
                    onPress={() => navigate("proofofresidency")}
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
    },
    identityContainer: {
        marginVertical: 72,
        alignItems: "center"
    },
    identityImage: {
        height: 350,
        width: 363
    }
})

export default VerifyYourIdentity