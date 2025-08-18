import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { COLORS, SIZES, icons } from '@/constants';
import { markers } from '@/data/mapData';
import { Ionicons } from '@expo/vector-icons';
import { getResponsiveWidth, getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '@/utils/responsive';

const CARD_HEIGHT = 112;
const CARD_WIDTH = getResponsiveWidth(85);

interface WebMapFallbackProps {
  onSearch?: () => void;
  onDirectionPress?: () => void;
}

const WebMapFallback: React.FC<WebMapFallbackProps> = ({ onSearch, onDirectionPress }) => {
  const [isFavourite, setIsFavourite] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Web Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <Text style={styles.mapTitle}>🗺️ Interactive Map</Text>
          <Text style={styles.mapSubtitle}>
            Maps functionality is available on mobile devices
          </Text>
          <Text style={styles.mapDescription}>
            In the mobile app, you can view nearby matches on an interactive map,
            see their locations, and navigate to meet them.
          </Text>
          
          {/* Sample location pins */}
          <View style={styles.pinContainer}>
            {[1, 2, 3, 4].map((pin) => (
              <View key={pin} style={[styles.pin, { 
                left: `${20 + pin * 15}%`, 
                top: `${30 + pin * 10}%` 
              }]}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Search Box */}
      <View style={[styles.searchBox, { backgroundColor: COLORS.white }]}>
        <Text style={styles.searchPlaceholder}>Search names, locations...</Text>
        <TouchableOpacity
          onPress={onDirectionPress}
          style={styles.searchButton}>
          <Ionicons name="search" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Cards Scroll View */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {markers.map((marker, index) => (
          <View style={[styles.card, { backgroundColor: COLORS.white }]} key={index}>
            <Image
              source={marker.image}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => setIsFavourite(!isFavourite)}
              style={styles.heartButton}
            >
              <Ionicons 
                name={isFavourite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavourite ? COLORS.red : COLORS.black} 
              />
            </TouchableOpacity>
            <View style={styles.textContent}>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: COLORS.black }]}>
                {marker.name}
              </Text>
              <Text style={styles.interestText}>
                {marker.interests?.join(", ") || "Interests not specified"}
              </Text>
              <Text numberOfLines={1} style={[styles.cardDescription, { color: "#444" }]}>
                {marker.description}
              </Text>
              <Text style={styles.price}>{marker.location}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapContent: {
    alignItems: 'center',
    padding: getResponsiveSpacing(20),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    maxWidth: isMobileWeb() ? getResponsiveWidth(90) : 400,
    margin: getResponsiveSpacing(20),
  },
  mapTitle: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: 'bold',
    color: COLORS.primary,
    marginBottom: getResponsiveSpacing(10),
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: getResponsiveSpacing(15),
    textAlign: 'center',
  },
  mapDescription: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(20),
  },
  pinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pin: {
    position: 'absolute',
    zIndex: 10,
  },
  searchBox: {
    position: 'absolute',
    marginTop: Platform.OS === 'ios' ? 8 : 20,
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: isMobileWeb() ? '95%' : '90%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 25,
    padding: getResponsiveSpacing(10),
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    top: isMobileWeb() ? 42 : 52,
    height: isMobileWeb() ? 45 : 50,
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'medium',
    color: '#999',
    fontSize: 16,
  },
  searchButton: {
    width: 58,
    height: 50,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    marginRight: -10,
  },
  scrollView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  card: {
    elevation: 2,
    backgroundColor: '#FFF',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: 0.3,
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: 'hidden',
    marginBottom: 92,
    flexDirection: 'row',
    borderRadius: 10,
    paddingHorizontal: 10,
    zIndex: 99999,
  },
  cardImage: {
    width: 92,
    height: 92,
    alignSelf: 'center',
    borderRadius: 15,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  textContent: {
    flex: 2,
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'bold',
    marginBottom: 7,
    color: COLORS.black,
  },
  cardDescription: {
    fontSize: 12,
    color: '#444',
    marginTop: 12,
  },
  price: {
    fontSize: 14,
    fontFamily: 'bold',
    color: COLORS.red,
    marginTop: 6,
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'medium',
    color: COLORS.greeen,
    marginTop: 4,
  },
});

export default WebMapFallback;
