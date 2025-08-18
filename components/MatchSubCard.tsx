import React from 'react';
import { Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants';

interface MatchSubCardProps {
    name: string;
    age: number;
    image: ImageSourcePropType;
    onPress?: () => void;
}

const MatchSubCard: React.FC<MatchSubCardProps> = ({ name, age, image, onPress }) => {

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <Image
                source={image}
                resizeMode='cover'
                style={styles.image}
            />
            <Text style={[styles.name, {
                color: COLORS.greyscale900,
            }]}>{name}</Text>
            <Text style={[styles.age, {
                color: COLORS.greyscale900,
            }]}>{age}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 176,
        height: 316,
        marginRight: 12
    },
    image: {
        width: 176,
        height: 212,
        borderRadius: 32,
    },
    name: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        textAlign: "center",
        marginVertical: 8
    },
    age: {
        fontSize: 16,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        textAlign: "center",
    }
});

export default MatchSubCard;
