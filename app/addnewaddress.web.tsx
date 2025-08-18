import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useRef, useEffect, useReducer, useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, SIZES, COLORS, FONTS } from '../constants';
import RBSheet from 'react-native-raw-bottom-sheet';
import { commonStyles } from '../styles/CommonStyles.js';
import Input from '../components/Input';
import { validateInput } from '../utils/actions/formActions';
import { reducer } from '../utils/reducers/formReducers';
import Button from '../components/Button';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';
import { Image } from 'expo-image';
import { NavigationProp } from '@react-navigation/native';

const initialState = {
    inputValues: {
        address: '',
        street: '',
        postalCode: '',
        appartment: '',
    },
    inputValidities: {
        address: false,
        street: false,
        postalCode: false,
        appartment: false,
    },
    formIsValid: false,
}

type Nav = {
    navigate: (value: string) => void
}

const AddNewAddress = () => {
    const bottomSheetRef = useRef<any>(null);
    const { navigate } = useNavigation<Nav>();
    const [formState, dispatchFormState] = useReducer(reducer, initialState)

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        }, [dispatchFormState])

    useEffect(() => {
        bottomSheetRef.current?.open();
    }, [])

    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigate("address" as any)}>
                    <Image
                        source={icons.back}
                        contentFit='contain'
                        style={{
                            width: 24,
                            height: 24,
                            tintColor: COLORS.black
                        }}
                    />
                </TouchableOpacity>
                <Text style={{ ...FONTS.body3 }}>Add New Address</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={[commonStyles.area, { backgroundColor: COLORS.white }]}>
            <View style={[commonStyles.container, { backgroundColor: COLORS.white }]}>
                <StatusBar style="dark" />
                {renderHeader()}
                
                {/* Web Map Placeholder */}
                <View style={[styles.map, styles.webMapPlaceholder]}>
                    <View style={styles.webMapContent}>
                        <Text style={styles.webMapTitle}>📍 Address Selection</Text>
                        <Text style={styles.webMapSubtitle}>
                            Map functionality is available on mobile devices
                        </Text>
                        <TouchableOpacity
                            onPress={() => bottomSheetRef.current.open()}
                            style={styles.webAddressButton}>
                            <Text style={styles.webAddressButtonText}>Add Address Manually</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <RBSheet
                    ref={bottomSheetRef}
                    height={500}
                    openDuration={250}
                    closeOnPressMask={false}
                    customStyles={{
                        wrapper: {
                            backgroundColor: 'transparent',
                        },
                        draggableIcon: {
                            backgroundColor: COLORS.greyscale300,
                        },
                        container: {
                            borderTopRightRadius: 32,
                            borderTopLeftRadius: 32,
                            height: 500,
                            backgroundColor: COLORS.white,
                        }
                    }}
                >
                    <Text style={[styles.bottomTitle, {
                        color: COLORS.greyscale900
                    }]}>Address Details</Text>
                    <View style={styles.separateLine} />

                    <View style={styles.selectedCancelContainer}>
                        <TouchableOpacity
                            onPress={() => bottomSheetRef.current.close()}
                        >
                            <Text style={[styles.cancelButton, {
                                color: COLORS.greyscale700
                            }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (formState.formIsValid) {
                                    bottomSheetRef.current.close()
                                    navigate("address" as any)
                                } else {
                                    Alert.alert("Error", "Please fill all the fields")
                                }
                            }}
                        >
                            <Text style={styles.selectedButton}>Save</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginVertical: 32 }}>
                        <Input
                            id="address"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['address']}
                            placeholder="Address"
                            placeholderTextColor={COLORS.black}
                        />
                        <Input
                            id="street"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['street']}
                            placeholder="Street"
                            placeholderTextColor={COLORS.black}
                        />
                        <Input
                            id="postalCode"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['postalCode']}
                            placeholder="Postal Code"
                            placeholderTextColor={COLORS.black}
                        />
                        <Input
                            id="appartment"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['appartment']}
                            placeholder="Apartment"
                            placeholderTextColor={COLORS.black}
                        />
                    </View>
                </RBSheet>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    map: {
        height: '100%',
        zIndex: 1,
    },
    headerContainer: {
        flexDirection: "row",
        width: SIZES.width - 32,
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
    },
    bottomTitle: {
        fontSize: 24,
        fontFamily: "semiBold",
        color: COLORS.black,
        textAlign: "center",
        marginTop: 12
    },
    separateLine: {
        height: .4,
        width: SIZES.width - 32,
        backgroundColor: COLORS.greyscale300,
        marginVertical: 12,
        marginHorizontal: 16
    },
    selectedCancelContainer: {
        marginHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cancelButton: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.greyscale700,
    },
    selectedButton: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary
    },
    webMapPlaceholder: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webMapContent: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        maxWidth: 300,
        margin: 20,
    },
    webMapTitle: {
        fontSize: 24,
        fontFamily: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    webMapSubtitle: {
        fontSize: 16,
        fontFamily: 'regular',
        color: COLORS.gray,
        marginBottom: 20,
        textAlign: 'center',
    },
    webAddressButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    webAddressButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'semiBold',
    },
})

export default AddNewAddress
