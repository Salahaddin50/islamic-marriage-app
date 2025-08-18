import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { COLORS, SIZES } from '../constants';

interface AutoSliderProps {
  images: { uri: string }[];
}

const AutoSlider: React.FC<AutoSliderProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          animated: true,
          x: Dimensions.get('window').width * ((currentIndex + 1) % images.length),
          y: 0,
        });
      }
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex, images.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / Dimensions.get('window').width);
    setCurrentIndex(currentIndex);
  };

  const handlePaginationPress = (index: number) => {
    setCurrentIndex(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        animated: true,
        x: Dimensions.get('window').width * index,
        y: 0,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            style={styles.image}
            source={image}
            resizeMode='cover'
          />
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === currentIndex ? COLORS.primary : '#C4C4C4' },
            ]}
            onTouchStart={() => handlePaginationPress(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZES.width,
    height: SIZES.height * 0.58,
  },
  image: {
    width: SIZES.width,
    height: SIZES.height * 0.58,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
});

export default AutoSlider;