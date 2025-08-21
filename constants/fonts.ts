import { Platform } from 'react-native';

// Register font families for React Native Web - removed local fonts that don't exist
// Google Fonts will be loaded by _layout.tsx instead

// TikTok-style font stack - modern, clean, and trendy
export const FONTS = Platform.OS === 'web' ? {
    black: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    blackItalic: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    bold: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boldItalic: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
    extraBold: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    extraBoldItalic: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    extraLight: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    extraLightItalic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    italic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    light: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lightItalic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    medium: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mediumItalic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    regular: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    semiBold: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    semiBoldItalic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    thin: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    thinItalic: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
} : {
    // For native platforms, use system fonts until custom Playfair Display fonts are added
    black: 'System',
    blackItalic: 'System',
    bold: 'System',
    boldItalic: 'System',
    extraBold: 'System',
    extraBoldItalic: 'System',
    extraLight: 'System',
    extraLightItalic: 'System',
    italic: 'System',
    light: 'System',
    lightItalic: 'System',
    medium: 'System',
    mediumItalic: 'System',
    regular: 'System',
    semiBold: 'System',
    semiBoldItalic: 'System',
    thin: 'System',
    thinItalic: 'System'
};