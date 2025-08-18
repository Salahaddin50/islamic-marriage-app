import { View, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { COLORS, SIZES } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import Button from '../components/Button';
import { useNavigation } from 'expo-router';
import UserAddressItem from '@/components/UserAddressItem';
import { userAddresses } from '@/data';

type Nav = {
    navigate: (value: string) => void
};

// User Address Location Screen
const Address = () => {
    const { navigate } = useNavigation<Nav>();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="Address" />
                <ScrollView
                    contentContainerStyle={{ marginVertical: 12 }}
                    showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={userAddresses}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <UserAddressItem
                                name={item.name}
                                address={item.address}
                                onPress={() => console.log("Clicked")}
                            />
                        )}
                    />
                </ScrollView>
            </View>
            <View style={styles.btnContainer}>
                <Button
                    title="Add New Address"
                    onPress={() => navigate("addnewaddress")}
                    filled
                    style={styles.btn}
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
        backgroundColor: COLORS.white,
        padding: 16
    },
    btnContainer: {
        alignItems: "center",
    },
    btn: {
        width: SIZES.width - 32,
        paddingHorizontal: 16,
        marginBottom: 16
    }
})

export default Address