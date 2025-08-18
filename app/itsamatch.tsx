import { View, Text, StyleSheet, Image } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { COLORS, images, SIZES } from '@/constants';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import Svg, { Path } from "react-native-svg";

type Nav = {
    navigate: (value: string) => void
}

interface HeartShapeProps {
    color: string;
    style?: object;
}

const HeartShape: React.FC<HeartShapeProps> = ({ color, style }) => (
    <Svg height="100" width="100" style={style}>
        <Path
            d="M60 100 C10 60, 10 10, 60 20 C110 10, 110 60, 60 100 Z"
            fill={color}
        />
    </Svg>
);

const ItsaMatch = () => {
    const { navigate } = useNavigation<Nav>();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <View style={{ marginHorizontal: 16 }}>
                    <Header title="" />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Image
                        source={images.matchCover}
                        resizeMode='contain'
                        style={styles.coverImage}
                    />
                    <View style={styles.viewContainer}>
                        <Text style={styles.title}>You Got the Match!</Text>
                        <Text style={[styles.subtitle, {
                            color: COLORS.greyScale800,
                        }]}>You both liked each other. Take charge and start a meaningful conversation.</Text>
                    </View>
                </View>
            </View>
            <Button
                title="Say Hello"
                filled
                onPress={() => { navigate("(tabs)") }}
                style={styles.nextButton}
            />
            <Button
                title="Keep Swiping"
                onPress={() => { navigate("(tabs)") }}
                textColor={COLORS.primary}
                style={styles.skipButton}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: "center"
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    nextButton: {
        width: SIZES.width - 44,
        marginBottom: SIZES.padding,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        marginTop: 22
    },
    skipButton: {
        width: SIZES.width - 44,
        marginBottom: SIZES.padding,
        backgroundColor: 'rgba(150, 16, 255, 0.1)',
        borderColor: COLORS.primary,
        borderWidth: 0
    },
    matchImageContainer: {
        flexDirection: 'row',
        marginBottom: 24
    },
    matchImage1: {
        width: (SIZES.width - 64) / 2,
        height: (SIZES.width - 64) / 2,
        borderRadius: 50,
        margin: 8
    },
    matchImage2: {
        width: (SIZES.width - 64) / 2,
        height: (SIZES.width - 64) / 2,
        borderRadius: 50,
        margin: 8
    },
    heartWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
    },
    profileImage: {
        width: 240,
        height: 240,
        borderRadius: 999,
        borderWidth: 5,
        borderColor: "#A855F7",
    },
    percentageCircle: {
        position: "absolute",
        top: "10%",
        left: "40%",
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#A855F7",
    },
    percentageText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#A855F7",
    },
    uniImage1: {
        marginRight: 50
    },
    uniImage2: {
        marginRight: -120
    },
    title: {
        fontSize: 36,
        fontFamily: "bold",
        color: COLORS.primary,
        marginBottom: 16,
        textAlign: "center"
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.greyScale800,
        marginBottom: 16,
        textAlign: "center"
    },
    viewContainer: {
        marginVertical: 100,
    },
    coverImage: {
        width: SIZES.width - 64,
        height: SIZES.width - 64,
    }
})
export default ItsaMatch