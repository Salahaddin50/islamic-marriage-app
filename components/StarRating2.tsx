import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define types for props
interface StarRating2Props {
    ratings: number;
    reviews: number;
}

const StarRating2: React.FC<StarRating2Props> = (props) => {

    // This array will contain our star tags. We will include this
    // array between the view tag.
    const stars: JSX.Element[] = [];
    
    // Loop 5 times
    for (let i = 1; i <= 5; i++) {
        // Set the path to filled stars
        const name = i > props.ratings ? 'star-outline' : 'star'; // Correct icon name for filled and unfilled stars
        stars.push(<Ionicons name={name} size={15} key={i} color="orange" />);
    }

    return (
        <View style={styles.container}>
            {stars}
            <Text style={[styles.text, {
                color: '#444',
            }]}>({props.reviews})</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    text: {
        fontSize: 12,
        marginLeft: 5,
    }
});

export default StarRating2;