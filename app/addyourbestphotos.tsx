import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { COLORS, FONTS, icons, SIZES } from '@/constants';
import Button from '@/components/Button';
import { useNavigation } from 'expo-router';
import { launchImagePicker } from '@/utils/ImagePickerHelper';
import axios from 'axios';

type Nav = {
  navigate: (value: string) => void;
};

const AddYourBestPhotos = () => {
  const { navigate } = useNavigation<Nav>();

  const [image1, setImage1] = useState<any>(null);
  const [image2, setImage2] = useState<any>(null);
  const [image3, setImage3] = useState<any>(null);
  const [image4, setImage4] = useState<any>(null)

  const pickImage1 = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // Set the image
      setImage1({ uri: tempUri })
    } catch (error) { }
  };

  const pickImage2 = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // Set the image
      setImage2({ uri: tempUri })
    } catch (error) { }
  };

  const pickImage3 = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // Set the image
      setImage3({ uri: tempUri })
    } catch (error) { }
  };

  const pickImage4 = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // Set the image
      setImage4({ uri: tempUri })
    } catch (error) { }
  };

  // Function to upload photos to the API
  const handleUploadPhotos = async () => {
    try {
      const formData = new FormData();

      // Helper function to convert URI to Blob
      const createFormDataItem = async (uri: string, name: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return { uri, name, type: blob.type };
      };

      if (image1) {
        const formItem = await createFormDataItem(image1.uri, 'photo1.jpg');
        formData.append('photos', formItem as unknown as Blob);
      }

      if (image2) {
        const formItem = await createFormDataItem(image2.uri, 'photo2.jpg');
        formData.append('photos', formItem as unknown as Blob);
      }

      if (image3) {
        const formItem = await createFormDataItem(image3.uri, 'photo3.jpg');
        formData.append('photos', formItem as unknown as Blob);
      }

      if (image4) {
        const formItem = await createFormDataItem(image4.uri, 'photo4.jpg');
        formData.append('photos', formItem as unknown as Blob);
      }

      const response = await axios.post('http://localhost:5000/upload-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload successful', response.data);
      navigate('createnewpin');
    } catch (error) {
      console.error('Upload failed', error);
    }
  };


  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="Add Your Best Photos" />
        <Text
          style={{
            ...FONTS.body4,
            marginTop: 16,
            color: COLORS.black,
          }}>
          Add your best photos to get a higher amount of daily matches.
        </Text>
        <View style={styles.cardView}>
          {
            image1 && image1 !== null ? (
              <Image source={image1} resizeMode='cover' style={styles.photo} />
            ) : (
              <TouchableOpacity onPress={pickImage1} style={styles.cardContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={icons.plus3}
                    resizeMode='contain'
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            )
          }

          {
            image2 && image2 !== null ? (<Image source={image2} resizeMode='cover' style={styles.photo} />) : (
              <TouchableOpacity onPress={pickImage2} style={styles.cardContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={icons.plus3}
                    resizeMode='contain'
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            )
          }
        </View>
        <View style={styles.cardView}>
          {
            image3 && image3 !== null ? (<Image source={image3} resizeMode='cover' style={styles.photo} />) : (
              <TouchableOpacity onPress={pickImage3} style={styles.cardContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={icons.plus3}
                    resizeMode='contain'
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            )
          }

          {
            image4 && image4 !== null ? (<Image source={image4} resizeMode='cover' style={styles.photo} />) : (
              <TouchableOpacity onPress={pickImage4} style={styles.cardContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={icons.plus3}
                    resizeMode='contain'
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            )
          }
        </View>
      </View>
      <Button
        title="Continue"
        filled
        style={styles.button}
        onPress={() => navigate('reasonforusinghume')}
      />
    </SafeAreaView>
  )
}

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
    height: (SIZES.width - 48) / 1.6,
    borderRadius: 32,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: (SIZES.width - 48) / 2,
    height: (SIZES.width - 48) / 1.6,
    borderRadius: 32,
  },
  iconContainer: {
    height: 36,
    width: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white,
  }
})
export default AddYourBestPhotos