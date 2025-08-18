import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES, icons } from '@/constants';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import VerificationMethod from '@/components/VerificationMethod';

type Nav = {
  navigate: (value: string) => void
}

const ProofOfResidency = () => {
  const { navigate } = useNavigation<Nav>();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methods = [
    { icon: icons.idCard, name: 'National Identity Card' },
    { icon: icons.license, name: 'Passport' },
    { icon: icons.certificate, name: 'Driver License' },
  ];

  // fetch codes from rescountries api
  useEffect(() => {
    fetch("https://restcountries.com/v2/all")
      .then(response => response.json())
      .then(data => {
        let areaData = data.map((item: any) => {
          return {
            code: item.alpha2Code,
            item: item.name,
            callingCode: `+${item.callingCodes[0]}`,
            flag: `https://flagsapi.com/${item.alpha2Code}/flat/64.png`
          }
        });

        setAreas(areaData);
        if (areaData.length > 0) {
          let defaultData = areaData.filter((a: any) => a.code == "US");

          if (defaultData.length > 0) {
            setSelectedArea(defaultData[0])
          }
        }
      })
  }, [])

  // Render countries codes modal
  function RenderAreasCodesModal() {

    const renderItem = ({ item }: { item: any }) => {
      return (
        <TouchableOpacity
          style={{
            padding: 10,
            flexDirection: "row"
          }}
          onPress={() => {
            setSelectedArea(item),
              setModalVisible(false)
          }}>
          <Image
            source={{ uri: item.flag }}
            contentFit='contain'
            style={{
              height: 30,
              width: 30,
              marginRight: 10
            }}
          />
          <Text style={{ fontSize: 16, color: "#fff" }}>{item.item}</Text>
        </TouchableOpacity>
      )
    }
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                height: SIZES.height,
                width: SIZES.width,
                backgroundColor: COLORS.primary,
                borderRadius: 12
              }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}>
                <Ionicons name="close-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <FlatList
                data={areas}
                renderItem={renderItem}
                horizontal={false}
                keyExtractor={(item) => item.code}
                style={{
                  padding: 20,
                  marginBottom: 20
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
        <Header title="" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, {
            color: COLORS.greyscale900
          }]}>Proof of Residency</Text>
          <Text style={[styles.subtitle, {
            color: COLORS.greyscale900
          }]}>Prove you live in United States</Text>
          <View style={styles.proofContainer}>
            <Text style={[styles.proofTitle, {
              color: COLORS.greyscale900
            }]}>Nationality</Text>
            <TouchableOpacity style={[styles.proofView, {
              borderColor: COLORS.grayscale200,
              backgroundColor: COLORS.white
            }]}>
              <View style={styles.countryContainer}>
                <Image
                  source={{ uri: selectedArea?.flag }}
                  contentFit='contain'
                  style={styles.countryImage}
                />
                <Text style={[styles.countryText, {
                  color: COLORS.greyscale900,
                }]}>{selectedArea?.item}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            <Text style={[styles.proofTitle, {
              color: COLORS.greyscale900
            }]}>Choose Verification Method</Text>
            <View style={{ marginVertical: 22 }}>
              {methods.map((method) => (
                <VerificationMethod
                  key={method.name}
                  icon={method.icon}
                  name={method.name}
                  isSelected={selectedMethod === method.name}
                  onSelect={() => setSelectedMethod(method.name)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
        {RenderAreasCodesModal()}
      </View>
      <View style={styles.bottomContainer}>
        <Button
          title="Verify Identity"
          filled
          style={styles.button}
          onPress={() => navigate("photoidcard")}
        />
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
    padding: 16,
    backgroundColor: COLORS.white
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    textAlign: "center",
    marginVertical: 22
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.greyscale900,
    textAlign: "center",
    paddingHorizontal: 3
  },
  proofContainer: {
    marginVertical: 22
  },
  proofTitle: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  proofView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",
    height: 72,
    width: SIZES.width - 32,
    borderRadius: 20,
    borderColor: COLORS.grayscale200,
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 16
  },
  countryContainer: {
    flexDirection: "row",
    alignItems: 'center'
  },
  countryImage: {
    width: 32,
    height: 24
  },
  countryText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginLeft: 16
  },
  changeText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    position: "absolute",
    right: 16,
    top: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  button: {
    marginTop: 12,
    width: SIZES.width - 32,
    borderRadius: 32
  },
  bottomContainer: {
    position: "absolute",
    bottom: 28,
    right: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
});

export default ProofOfResidency