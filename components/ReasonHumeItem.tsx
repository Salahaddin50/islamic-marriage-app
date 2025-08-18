import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { COLORS, SIZES } from '@/constants';

interface ReasonHumeItemProps {
    reason: string;
    isChecked: boolean;
    onToggle: (reason: string) => void;
}

const ReasonHumeItem: React.FC<ReasonHumeItemProps> = ({ reason, isChecked, onToggle }) => {

    return (
        <TouchableOpacity style={[styles.container, {
            borderColor: COLORS.grayscale200,
            backgroundColor: COLORS.white
        }]} onPress={() => onToggle(reason)}>
            <Checkbox
                value={isChecked}
                onValueChange={() => onToggle(reason)}
                style={[styles.checkbox, {
                    borderColor: COLORS.primary
                }]}
                color={isChecked ? COLORS.primary : undefined}
            />
            <Text style={[styles.reasonText, {
                color: COLORS.greyscale900,
            }]}>{reason}</Text>
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
        marginVertical: 6,
        paddingHorizontal: 16
    },
    checkbox: {
        marginRight: 10,
        borderRadius: 6,
        height: 20,
        width: 20
    },
    reasonText: {
        fontSize: 16,
        fontFamily: "semiBold",
    },
});

export default ReasonHumeItem