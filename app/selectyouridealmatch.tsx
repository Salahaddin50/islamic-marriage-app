import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, icons, SIZES } from '@/constants';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';

type Nav = {
  navigate: (value: string) => void;
};

const SelectYourIdealMatch = () => {
  const { navigate } = useNavigation<Nav>();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleCardPress = (card: string) => {
    setSelectedCard(card);
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="Select Your Ideal Match" />
        <Text
          style={{
            ...FONTS.body4,
            marginTop: 16,
            color: COLORS.black,
          }}>
          What are you hoping to find on the Zawajplus Dating App.
        </Text>

        <View style={styles.cardView}>
          <TouchableOpacity
            style={[
              styles.cardContainer,
              selectedCard === 'Love' && styles.selectedCard,
            ]}
            onPress={() => handleCardPress('Love')}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.love}
                resizeMode="contain"
                style={styles.icon}
              />
            </View>
            <Text style={[styles.iconText, {
              color: COLORS.greyscale900,
            }]}>Love</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardContainer,
              selectedCard === 'Friends' && styles.selectedCard,
            ]}
            onPress={() => handleCardPress('Friends')}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.friends2}
                resizeMode="contain"
                style={styles.icon}
              />
            </View>
            <Text style={[styles.iconText, {
              color: COLORS.greyscale900,
            }]}>Friends</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardView}>
          <TouchableOpacity
            style={[
              styles.cardContainer,
              selectedCard === 'Fling' && styles.selectedCard,
            ]}
            onPress={() => handleCardPress('Fling')}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.shoppingBag}
                resizeMode="contain"
                style={styles.icon}
              />
            </View>
            <Text style={[styles.iconText, {
              color: COLORS.greyscale900,
            }]}>Fling</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardContainer,
              selectedCard === 'Business' && styles.selectedCard,
            ]}
            onPress={() => handleCardPress('Business')}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.business}
                resizeMode="contain"
                style={styles.icon}
              />
            </View>
            <Text style={[styles.iconText, {
              color: COLORS.greyscale900,
            }]}>Business</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Button
        title="Continue"
        filled
        style={styles.button}
        onPress={() => navigate('addyourbestphotos')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  button: {
    marginVertical: 22,
    position: 'absolute',
    bottom: 22,
    width: SIZES.width - 32,
    borderRadius: 32,
    right: 16,
    left: 16,
  },
  cardView: {
    marginTop: 20,
    flexDirection: 'row',
    width: SIZES.width - 32,
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (SIZES.width - 48) / 2,
    height: (SIZES.width - 48) / 2,
    borderRadius: 32,
    borderColor: COLORS.grayscale200,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  iconContainer: {
    height: 64,
    width: 64,
    backgroundColor: 'rgba(150, 16, 255, .1)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: 24,
    width: 24,
    tintColor: COLORS.primary,
  },
  iconText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginTop: 8,
  },
});

export default SelectYourIdealMatch;
