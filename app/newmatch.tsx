import { View, Text, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { COLORS, SIZES } from '@/constants';
import { newMatches } from '@/data';
import MatchCard from '@/components/MatchCard';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

// New Match Screen
const NewMatch = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="New Match" />
        <View style={styles.viewContainer}>
          <FlatList
            data={newMatches}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MatchCard
                name={item.name}
                age={item.age}
                image={item.image}
                position={item.position}
                containerStyle={{
                  width: (SIZES.width - 48) / 2,
                  height: 272,
                  marginBottom: 12,
                }}
                imageStyle={{
                  width: (SIZES.width - 48) / 2,
                  height: 272,
                }}
                onPress={() => navigation.navigate("matchdetails", { userId: item.user_id || item.id })}
              />
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  )
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
  viewContainer: {
    marginVertical: 16
  }
})

export default NewMatch