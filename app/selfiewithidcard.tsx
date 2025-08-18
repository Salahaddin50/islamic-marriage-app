import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES, images } from '@/constants';
import { Image } from 'expo-image';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';

type Nav = {
    navigate: (value: string) => void
}

// Selfie with id card
const SelfieWithIdCard = () => {
    const { navigate } = useNavigation<Nav>();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, {
                        color: COLORS.greyscale900
                    }]}>Selfie with ID Card</Text>
                    <Text style={[styles.subtitle, {
                        color: COLORS.greyscale900
                    }]}>Please face the camera holding your ID card.</Text>
                    <View>
                        <Image
                            source={images.avatar}
                            contentFit='contain'
                            style={styles.avatar}
                        />
                    </View>
                </ScrollView>
            </View>
            <View style={styles.bottomContainer}>
                <Button
                    title="Retake"
                    style={{
                        width: (SIZES.width - 32) / 2 - 8,
                        borderRadius: 32,
                        backgroundColor: COLORS.tansparentPrimary,
                        borderColor: COLORS.tansparentPrimary
                    }}
                    textColor={COLORS.primary}
                />
                <Button
                    title="Continue"
                    filled
                    style={styles.continueButton}
                    onPress={() => navigate("facerecognitionwalkthrough")}
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
    avatar: {
        height: 570,
        width: SIZES.width - 32
    },
    bottomContainer: {
        position: "absolute",
        bottom: 32,
        right: 16,
        left: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        width: SIZES.width - 32,
        alignItems: "center"
    },
    skipButton: {
        width: (SIZES.width - 32) / 2 - 8,
        borderRadius: 32,
        backgroundColor: "#F5E7FF",
        borderColor: "#F5E7FF"
    },
    continueButton: {
        width: (SIZES.width - 32) / 2 - 8,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
})

export default SelfieWithIdCard