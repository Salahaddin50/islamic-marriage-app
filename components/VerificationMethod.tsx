import { COLORS, SIZES } from '@/constants';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface VerificationMethodProps {
    icon: any;
    name: string;
    isSelected: boolean;
    onSelect: () => void;
}

const VerificationMethod: React.FC<VerificationMethodProps> = ({ icon, name, isSelected, onSelect }) => {

    return (
        <TouchableOpacity style={[styles.container, {
            borderColor: COLORS.grayscale200,
            backgroundColor: COLORS.white
        }]} onPress={onSelect}>
            <View style={styles.iconContainer}>
                <Image source={icon} style={styles.icon} />
            </View>
            <Text style={[styles.name, {
                color: COLORS.greyscale900
            }]}>{name}</Text>
            <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <View style={styles.checkboxInner} />}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 72,
        width: SIZES.width - 32,
        borderRadius: 20,
        borderColor: COLORS.grayscale200,
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
    },
    iconContainer: {
        marginRight: 10,
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
        tintColor: COLORS.primary
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.greyscale900
    },
    checkboxContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
    },
    checkboxInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white
    },
});

export default VerificationMethod;