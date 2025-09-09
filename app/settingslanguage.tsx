import { View, Text, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-virtualized-view';
import LanguageItem from '@/components/LanguageItem';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '@/src/i18n';

const SettingsLanguage = () => {
    const { t, i18n } = useTranslation();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    useEffect(() => {
        setSelectedItem(getCurrentLanguage());
    }, []);

    const handleSelect = async (code: string) => {
        if (selectedItem === code) return;
        setSelectedItem(code);
        await changeLanguage(code);
        // ensure UI reflects new language when returning
        router.push('/(tabs)/profile');
    };

    const langs = getSupportedLanguages();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header 
                  title={t('language_page.title')} 
                  onBackPress={() => router.push('/(tabs)/profile')}
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: COLORS.black }]}>{t('language_page.languages')}</Text>
                    <View style={{ marginTop: 12 }}>
                        {langs.map(l => (
                            <LanguageItem
                                key={l.code}
                                checked={selectedItem === l.code}
                                name={`${l.nativeName} (${l.name})`}
                                onPress={() => handleSelect(l.code)}
                            />
                        ))}
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