import { Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import React from 'react';
import { COLORS } from '../constants';
import { Image } from 'expo-image';

interface HelpCenterItemProps {
    icon: string;
    title: string;
    onPress: () => void;
}

const HelpCenterItem: React.FC<HelpCenterItemProps> = ({ icon, title, onPress }) => {

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.container, {
                backgroundColor: COLORS.white
            } as StyleProp<ViewStyle>]}>
            <Image
                source={icon}
                contentFit='contain'
                style={styles.icon as StyleProp<ImageStyle>}
            />
            <Text style={[styles.title, {
                color: COLORS.black
            } as StyleProp<TextStyle>]}>{title}</Text>
        </TouchableOpacity>
    )
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        marginBottom: 12,
        height: 64,
        alignItems: 'center',
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 1
    },
    icon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary,
        marginRight: 22
    },
    title: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.black
    }
})

export default HelpCenterItem;