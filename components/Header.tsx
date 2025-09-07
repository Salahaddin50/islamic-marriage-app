import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageSourcePropType, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SIZES, COLORS, icons } from '../constants';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb, safeGoBack } from '../utils/responsive';

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    fallbackRoute?: string;
    rightIcon?: ImageSourcePropType;
    onRightPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    title = "", 
    showBackButton = true, 
    onBackPress,
    fallbackRoute = '/(tabs)',
    rightIcon,
    onRightPress,
}) => {
    const navigation = useNavigation<NavigationProp<any>>();
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            safeGoBack(navigation, router, fallbackRoute);
        }
    };

    return (
        <View style={styles.headerWrapper}>
            <View style={[styles.container, {
                backgroundColor: COLORS.white
            }]}>
                {showBackButton && (
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Image
                            source={icons.arrowBack as ImageSourcePropType}
                            contentFit='contain'
                            style={[styles.backIcon, {
                                tintColor: COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                )}
                {title && (
                    <Text style={[styles.title, { color: COLORS.greyscale900 }]}>{title}</Text>
                )}
                {!!rightIcon && (
                    <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
                        <Image
                            source={rightIcon}
                            contentFit='contain'
                            style={[styles.rightIcon, { tintColor: COLORS.greyscale900 }]}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerWrapper: {
        backgroundColor: COLORS.white,
        marginBottom: getResponsiveSpacing(20), // Gap after the header row
    } as ViewStyle,
    container: {
        backgroundColor: COLORS.white,
        width: SIZES.width - 32,
        flexDirection: "row",
        alignItems: "center",
    } as ViewStyle,
    backButton: {
        marginRight: getResponsiveSpacing(16),
        padding: getResponsiveSpacing(4), // Add touch area
    } as ViewStyle,
    backIcon: {
        width: isMobileWeb() ? 20 : 24, // Match Profile page sizing
        height: isMobileWeb() ? 20 : 24, // Match Profile page sizing
        tintColor: COLORS.greyscale900,
    } as ImageStyle,
    title: {
        fontSize: getResponsiveFontSize(22), // Use responsive font size
        fontFamily: "bold",
        color: COLORS.black,
    } as TextStyle,
    rightButton: {
        padding: getResponsiveSpacing(4),
        marginLeft: 'auto',
    } as ViewStyle,
    rightIcon: {
        width: isMobileWeb() ? 20 : 24,
        height: isMobileWeb() ? 20 : 24,
    } as ImageStyle,
});

export default Header;