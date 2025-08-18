import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { COLORS, icons, illustrations } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

// Photo Id Card
const PhotoIdCard = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <SafeAreaView style={[styles.area, {
      backgroundColor: "#1F222A"
    }]}>
      <View style={[styles.container, {
        backgroundColor: "#1F222A"
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            contentFit='contain'
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Photo ID Card</Text>
          <Text style={styles.subtitle}>Please point the camera at the ID card</Text>
          <View style={styles.scanView}>
            <View style={[styles.scanContainer, {
              backgroundColor: COLORS.white
            }]}>
              <Image
                source={illustrations.card}
                contentFit='contain'
                style={styles.cardImage}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.btn}>
          <Image
            source={icons.image2}
            contentFit='contain'
            style={styles.btnIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("selfiewithidcard")}
          style={styles.cameraBtn}>
          <Image
            source={icons.camera}
            contentFit='contain'
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn}>
          <Image
            source={icons.folder2}
            contentFit='contain'
            style={styles.btnIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: "#1F222A"
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1F222A"
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginVertical: 22
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.white,
    textAlign: "center",
    paddingHorizontal: 3
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
    tintColor: COLORS.white
  },
  scanView: {
    alignItems: "center",
    marginVertical: 64
  },
  scanContainer: {
    width: 332,
    height: 332,
    borderRadius: 32,
    backgroundColor: COLORS.white
  },
  cardImage: {
    width: 340,
    height: 340,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 28,
    right: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 64
  },
  btn: {
    height: 56,
    width: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.grayscale100
  },
  btnIcon: {
    height: 20,
    width: 20,
    tintColor: COLORS.primary
  },
  cameraBtn: {
    height: 108,
    width: 108,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    height: 44,
    width: 44,
    tintColor: COLORS.white
  }
})

export default PhotoIdCard