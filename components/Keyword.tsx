import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from "react-native";
import { COLORS } from "../constants";

interface KeywordProps {
    label: string;
    selected: boolean;
    onPress: (event: GestureResponderEvent) => void;
}

const Keyword: React.FC<KeywordProps> = ({ label, selected, onPress }) => {
    return (
        <TouchableOpacity
            style={[
                styles.keyword,
                {
                    backgroundColor: selected ? COLORS.primary : "transparent",
                    borderWidth: 1,
                    borderColor: COLORS.primary,
                },
            ]}
            onPress={onPress}>
            <Text
                style={{
                    color: selected ? "#ffffff" : COLORS.primary,
                    fontSize: 16,
                    fontFamily: "semiBold",
                }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    keyword: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        margin: 5,
        borderRadius: 9999,
        width: "auto",
    },
});

export default Keyword;