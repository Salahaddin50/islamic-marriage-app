import { View, Text, StyleSheet, ImageBackground, Modal, TouchableWithoutFeedback } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, illustrations, images } from '@/constants';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import { Image } from 'expo-image';

type Nav = {
  navigate: (value: string) => void
}

const FaceRecognitionScan = () => {
  const { navigate } = useNavigation<Nav>();
  const [modalVisible, setModalVisible] = useState(false);

  const renderModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContainer]}>
            <View style={[styles.modalSubContainer, {
              backgroundColor: COLORS.secondaryWhite
            }]}>
              <Image
                source={illustrations.passwordSuccess}
                contentFit='contain'
                style={styles.modalIllustration}
              />
              <Text style={styles.modalTitle}>Congratulations!</Text>
              <Text style={[styles.modalSubtitle, {
                color: COLORS.greyscale900
              }]}>Please wait a moment, we are preparing for you...</Text>
              <Button
                title="Continue"
                filled
                onPress={() => {
                  setModalVisible(false)
                  navigate("createnewpin")
                }}
                style={{
                  width: "100%",
                  marginTop: 12
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  };

  return (
    <ImageBackground
      source={images.face}
      style={styles.backgroundImage}>
      <Image
        source={images.scanCard}
        contentFit='contain'
        style={styles.scanCardImage}
      />
      <View style={styles.viewContainer}>
        <Text style={styles.viewTitle}>100%</Text>
        <Text style={styles.viewSubtitle}>Verifying your face...</Text>
      </View>
      <View style={styles.bottomContainer}>
        <Button
          title="Skip"
          style={{
            width: (SIZES.width - 32) / 2 - 8,
            borderRadius: 32,
            backgroundColor: "#E9F0FF",
            borderColor: "#E9F0FF"
          }}
          textColor={COLORS.primary}
          onPress={() => setModalVisible(true)}
        />
        <Button
          title="Start"
          filled
          style={styles.continueButton}
          onPress={() => setModalVisible(true)}
        />
      </View>
      {renderModal()}
    </ImageBackground>
  )
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center"
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    alignItems: "center"
  },
  skipButton: {
    width: (SIZES.width - 32) / 2 - 8,
    borderRadius: 32,
    backgroundColor: "#F5E7FF",
    borderColor: "#F5E7FF"
  },
  continueButton: {
    width: (SIZES.width - 32) / 2 - 8,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  scanCardImage: {
    height: SIZES.width - 32,
    width: SIZES.width - 32
  },
  viewContainer: {
    position: "absolute",
    bottom: 124,
    right: 16,
    left: 16,
    justifyContent: "space-between",
    width: SIZES.width - 32,
    alignItems: "center"
  },
  viewTitle: {
    fontSize: 48,
    fontFamily: "bold",
    color: COLORS.white,
    marginBottom: 4
  },
  viewSubtitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.white
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
    color: COLORS.black2,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)"
  },
  modalSubContainer: {
    height: 494,
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
    marginVertical: 22
  }
})

export default FaceRecognitionScan