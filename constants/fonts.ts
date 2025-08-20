import { Platform } from 'react-native';

// Use system fonts for web to avoid loading issues, custom fonts for native
export const FONTS = Platform.OS === 'web' ? {
    black: 'system-ui',
    blackItalic: 'system-ui',
    bold: 'system-ui',
    boldItalic: 'system-ui',
    extraBold: 'system-ui',
    extraBoldItalic: 'system-ui',
    extraLight: 'system-ui',
    extraLightItalic: 'system-ui',
    italic: 'system-ui',
    light: 'system-ui',
    lightItalic: 'system-ui',
    medium: 'system-ui',
    mediumItalic: 'system-ui',
    regular: 'system-ui',
    semiBold: 'system-ui',
    semiBoldItalic: 'system-ui',
    thin: 'system-ui',
    thinItalic: 'system-ui'
} : {
    black: require("../assets/fonts/Urbanist-Black.ttf"),
    blackItalic: require("../assets/fonts/Urbanist-BlackItalic.ttf"),
    bold: require("../assets/fonts/Urbanist-Bold.ttf"),
    boldItalic: require("../assets/fonts/Urbanist-BoldItalic.ttf"),
    extraBold: require("../assets/fonts/Urbanist-ExtraBold.ttf"),
    extraBoldItalic: require("../assets/fonts/Urbanist-ExtraBoldItalic.ttf"),
    extraLight: require("../assets/fonts/Urbanist-ExtraLight.ttf"),
    extraLightItalic: require("../assets/fonts/Urbanist-ExtraLightItalic.ttf"),
    italic: require("../assets/fonts/Urbanist-Italic.ttf"),
    light: require("../assets/fonts/Urbanist-Light.ttf"),
    lightItalic: require("../assets/fonts/Urbanist-LightItalic.ttf"),
    medium: require("../assets/fonts/Urbanist-Medium.ttf"),
    mediumItalic: require("../assets/fonts/Urbanist-MediumItalic.ttf"),
    regular: require("../assets/fonts/Urbanist-Regular.ttf"),
    semiBold: require("../assets/fonts/Urbanist-SemiBold.ttf"),
    semiBoldItalic: require("../assets/fonts/Urbanist-SemiBoldItalic.ttf"),
    thin: require("../assets/fonts/Urbanist-Thin.ttf"),
    thinItalic: require("../assets/fonts/Urbanist-ThinItalic.ttf")
};