import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MatchCardProps {
  name: string;
  age: number;
  image: ImageSourcePropType;
  position: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  backgroundStyle?: ViewStyle;
  nameStyle?: TextStyle;
  positionStyle?: TextStyle;
  viewContainerStyle?: ViewStyle;
}

const MatchCard: React.FC<MatchCardProps> = ({
  name,
  age,
  image,
  position,
  onPress,
  containerStyle,
  imageStyle,
  backgroundStyle,
  nameStyle,
  positionStyle,
  viewContainerStyle,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, containerStyle]}>
      <Image
        source={image}
        resizeMode="cover"
        style={[styles.image, imageStyle]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(150, 16, 255, 0.6)', 'rgba(150, 16, 255, 0.7)']}
        style={[styles.background, backgroundStyle]}
      >
        <View style={[styles.viewContainer, viewContainerStyle]}>
          <Text style={[styles.name, nameStyle]}>{name}, {age}</Text>
          <Text style={[styles.position, positionStyle]}>{position}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 212,
    height: 316,
    borderRadius: 32,
    marginRight: 12,
  },
  image: {
    width: 212,
    height: 316,
    borderRadius: 32,
  },
  background: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 112,
    width: '100%',
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 32,
  },
  name: {
    fontSize: 24,
    fontFamily: 'bold',
    color: 'white',
    paddingTop: 16,
    paddingLeft: 16,
  },
  position: {
    fontSize: 16,
    fontFamily: 'medium',
    color: 'white',
    paddingTop: 8,
    paddingLeft: 16,
  },
  viewContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 90,
  },
});

export default MatchCard;
