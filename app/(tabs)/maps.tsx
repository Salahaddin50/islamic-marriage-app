import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, illustrations, SIZES } from '@/constants';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import WebMapFallback from '@/components/WebMapFallback';
import Button from '@/components/Button';

// Web-compatible Maps Screen
const Maps = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [modalVisible, setModalVisible] = useState(true);
  const [directionModalVisible, setDirectionModalVisible] = useState(false);

  const renderDirectionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={directionModalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setDirectionModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer,
            {
              height: 420,
              width: SIZES.width * 0.8,
              backgroundColor: COLORS.white,
            }]}>
              <View style={styles.backgroundIllustration}>
                <Image
                  source={illustrations.background}
                  resizeMode='contain'
                  style={styles.modalIllustration}
                />
                <Image
                  source={icons.location2}
                  resizeMode='contain'
                  style={styles.editPencilIcon}
                />
              </View>
              <Text style={styles.modalTitle}>You Have Arrived!</Text>
              <Text style={[styles.modalSubtitle, {
                color: COLORS.black,
              }]}>
                We have arrived at your match location.
              </Text>
              <Button
                title="Okay"
                filled
                onPress={() => {
                  setDirectionModalVisible(false)
                }}
                style={styles.successBtn}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  const renderModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer, {
              backgroundColor: COLORS.white,
            }]}>
              <View style={styles.backgroundIllustration}>
                <Image
                  source={illustrations.background}
                  resizeMode='contain'
                  style={styles.modalIllustration}
                />
                <Image
                  source={icons.location2}
                  resizeMode='contain'
                  style={styles.editPencilIcon}
                />
              </View>
              <Text style={styles.modalTitle}>Enable Location</Text>
              <Text style={[styles.modalSubtitle, {
                color: COLORS.black,
              }]}>
                We need location access to find the nearest members around you.
              </Text>
              <Button
                title="Enable location"
                filled
                onPress={() => {
                  setModalVisible(false)
                }}
                style={styles.successBtn}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false)
                }}
                textColor={COLORS.primary}
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 32,
                  backgroundColor: COLORS.tansparentPrimary,
                  borderColor: COLORS.tansparentPrimary
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <WebMapFallback
          onSearch={() => navigation.navigate('search' as never)}
          onDirectionPress={() => setDirectionModalVisible(true)}
        />
        {renderModal()}
        {renderDirectionModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 12
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.56)"
  },
  modalSubContainer: {
    height: 520,
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalIllustration: {
    height: 180,
    width: 180,
    marginVertical: 22,
    tintColor: COLORS.primary
  },
  successBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32
  },
  editPencilIcon: {
    width: 42,
    height: 42,
    tintColor: COLORS.white,
    position: "absolute",
    top: 54,
    left: 58,
  },
  backgroundIllustration: {
    height: 150,
    width: 150,
    marginVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    tintColor: COLORS.primary
  },
});

export default Maps;
