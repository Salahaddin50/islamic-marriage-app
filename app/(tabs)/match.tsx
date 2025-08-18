import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images } from '@/constants';
import { ScrollView } from 'react-native-virtualized-view';
import SubHeaderItem from '@/components/SubHeaderItem';
import MatchCard from '@/components/MatchCard';
import { newMatches, yourMatches } from '@/data';
import MatchSubCard from '@/components/MatchSubCard';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

// Match Screen
const Match = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  /**
    * Render header
    */
  const renderHeader = () => {
    return (
      <TouchableOpacity style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image
            source={images.logo}
            resizeMode='contain'
            style={styles.logo}
          />
          <Text style={[styles.headerTitle, {
            color: COLORS.greyscale900
          }]}>Match</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.headerIcon, {
              tintColor: COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }
  /**
   * render content
   */
  const renderContent = () => {
    return (
      <View>
        <SubHeaderItem
          title="New Match"
          onPress={() => navigation.navigate("newmatch")}
          navTitle="See All"
        />
        <FlatList
          data={newMatches}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <MatchCard
              name={item.name}
              age={item.age}
              image={item.image}
              position={item.position}
              onPress={() => navigation.navigate("matchdetails")}
            />
          )}
        />
        <SubHeaderItem
          title="Your Match"
          onPress={() => navigation.navigate("yourmatch")}
          navTitle="See All"
        />
        <FlatList
          data={yourMatches}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <MatchSubCard
              name={item.name}
              age={item.age}
              image={item.image}
              onPress={() => navigation.navigate("itsamatch")}
            />
          )}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 32
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  logo: {
    height: 32,
    width: 32,
    tintColor: COLORS.primary
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  headerIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
})

export default Match