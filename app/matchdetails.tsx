import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { COLORS, icons, images, SIZES } from '@/constants';
import AutoSlider from '@/components/AutoSlider';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

const MatchDetails = () => {

    // Slider images
    const sliderImages = [
        images.model1,
        images.model2,
        images.model3,
        images.model4
    ];

    // Array of interests
    const interests = [
        '💃🎤 Dancing & Singing',
        '🌍 Language',
        '🎬 Movie',
        '📚 Book & Novel',
        '🏛️ Architecture',
        '📸 Photography',
        '👗 Fashion',
    ];

    // render header
    const renderHeader = () => {
        const [isFavorite, setIsFavorite] = useState(false);
        const navigation = useNavigation<NavigationProp<any>>();

        return (
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}>
                    <Image
                        source={icons.back}
                        resizeMode='contain'
                        style={styles.backIcon}
                    />
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                    <TouchableOpacity
                        onPress={() => setIsFavorite(!isFavorite)}>
                        <Image
                            source={isFavorite ? icons.heart2 : icons.heart2Outline}
                            resizeMode='contain'
                            style={styles.bookmarkIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.area,
        { backgroundColor: COLORS.white }]}>
            <StatusBar hidden />
            <AutoSlider images={sliderImages} />
            {renderHeader()}
            <View style={[styles.footerContainer, {
                backgroundColor: "white",
            }]}>
                <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>2 Km</Text>
                </View>
                <Text style={[styles.fullName, {
                    color: COLORS.greyscale900,
                }]}>Jenny Wilson, 25</Text>
                <View style={styles.positionContainer}>
                    <Text style={[styles.positionText, {
                        color: COLORS.grayscale700,
                    }]}>Model</Text>
                    <View style={styles.viewView}>
                        <Text style={styles.viewText}>Sagitarius</Text>
                    </View>
                </View>
                <Text style={[styles.subtitle, {
                    color: COLORS.greyscale900,
                }]}>About</Text>
                <Text style={[styles.description, {
                    color: COLORS.grayscale700,
                }]}>Jenny is a 25-year-old model with a passion for fashion and modeling. She has worked for various brands, including Chanel, Gucci, and Versace, and has recently opened her own boutique.</Text>
                <Text style={[styles.subtitle, {
                    color: COLORS.greyscale900,
                }]}>Interest</Text>
                <View>
                    <View style={styles.buttonContainer}>
                        {interests.map((interest, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.button}>
                                <Text style={styles.buttonText}>{interest}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    headerContainer: {
        width: SIZES.width - 32,
        flexDirection: "row",
        justifyContent: "space-between",
        position: "absolute",
        top: 32,
        zIndex: 999,
        left: 16,
        right: 16
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white
    },
    sendIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white
    },
    sendIconContainer: {
        marginLeft: 8
    },
    iconContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    footerContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 24,
        backgroundColor: "white",
        borderTopRightRadius: 32,
        borderTopLeftRadius: 32,
        marginTop: -32,
        paddingVertical: 16
    },
    fullName: {
        fontSize: 28,
        fontFamily: "bold",
        color: COLORS.greyscale900,
    },
    positionText: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.grayscale700,
        marginTop: 4,
        marginRight: 16
    },
    viewView: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(150, 16, 255, 0.1)",
        borderRadius: 12
    },
    viewText: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.primary
    },
    positionContainer: {
        flexDirection: "row",
        marginTop: 16
    },
    subtitle: {
        fontSize: 18,
        fontFamily: "semiBold",
        color: COLORS.greyscale900,
        marginTop: 16
    },
    description: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.grayscale700,
        marginTop: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 12,
        marginVertical: 4,
        marginHorizontal: 4,
        alignItems: 'center'
    },
    buttonText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: 'semiBold',
    },
    distanceContainer: {
        position: 'absolute',
        top: 32,
        right: 16,
        zIndex: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 16
    },
    distanceText: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.primary
    }
})

export default MatchDetails