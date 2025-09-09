import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const isDesktop = SIZES.width > 1024;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    languageContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    languageSelector: {
        // No fixed width needed - will auto-size based on content
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center'
    },
    illustration: {
        height: isDesktop ? Math.min(SIZES.width * 0.5, 520) : SIZES.width * 1.1,
        width: isDesktop ? Math.min(SIZES.width * 0.5, 520) : SIZES.width * 1.1,
        position: 'absolute',
        bottom: isDesktop ? 280 : 360,
    },
    ornament: {
        position: 'absolute',
        bottom: isDesktop ? 300 : 372,
        zIndex: -99,
        width: isDesktop ? Math.min(SIZES.width * 0.3, 360) : SIZES.width * 0.7,
    },
    titleContainer: {
        marginVertical: 18,
        alignItems: 'center',
    },
    title: {
        ...FONTS.h3,
        color: COLORS.black,
        textAlign: 'center',
    },
    subTitle: {
        ...FONTS.h3,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 8,
    },
    description: {
        ...FONTS.body3,
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 16,
        maxWidth: isDesktop ? 640 : undefined,
        alignSelf: 'center',
        paddingHorizontal: isDesktop ? 24 : 0,
    },
    dotsContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        padding: 22,
        borderTopLeftRadius: SIZES.radius,
        borderTopRightRadius: SIZES.radius,
        height: isDesktop ? 300 : 360,
        width: '100%',
        maxWidth: isDesktop ? 720 : undefined,
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    nextButton: {
        width: isDesktop ? 400 : SIZES.width - 44,
        alignSelf: 'center',
        marginBottom: SIZES.padding,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        marginTop: 22,
    },
    skipButton: {
        width: isDesktop ? 400 : SIZES.width - 44,
        alignSelf: 'center',
        marginBottom: SIZES.padding,
        backgroundColor: 'transparent',
        borderColor: COLORS.primary,
    },
});

export default styles;