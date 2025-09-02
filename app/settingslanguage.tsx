import { View, Text, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-virtualized-view';
import LanguageItem from '@/components/LanguageItem';

const SettingsLanguage = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCheckboxPress = (itemTitle: any) => {
        if (selectedItem === itemTitle) {
            // If the clicked item is already selected, deselect it
            setSelectedItem(null);
        } else {
            // Otherwise, select the clicked item
            setSelectedItem(itemTitle);
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header 
                  title="Language & Region" 
                  onBackPress={() => router.push('/(tabs)/profile')}
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: COLORS.black }]}>Languages</Text>
                    <View style={{ marginTop: 12 }}>
                        <LanguageItem
                            checked={selectedItem === 'English'}
                            name="English"
                            onPress={() => handleCheckboxPress('English')}
                        />
                        <LanguageItem
                            checked={selectedItem === 'Russian'}
                            name="Russian"
                            onPress={() => handleCheckboxPress('Russian')}
                        />
                        <LanguageItem
                            checked={selectedItem === 'Arabic'}
                            name="Arabic"
                            onPress={() => handleCheckboxPress('Arabic')}
                        />
                    </View>
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
        padding: 16
    },
    title: {
        fontSize: 20,
        fontFamily: "bold",
        color: COLORS.black,
        marginVertical: 16
    }
})

export default SettingsLanguage