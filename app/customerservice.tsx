import { View, Text, TouchableOpacity, TextInput, StyleSheet, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images } from '../constants';
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { Image } from 'expo-image';
import { NavigationProp, useNavigation } from '@react-navigation/native';

// Customer Service Screen
const CustomerService = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const [messages, setMessages] = useState<any>([]);
    const [inputMessage, setInputMessage] = useState('');

    const handleInputText = (text: any) => {
        setInputMessage(text)
    };

    const renderMessage = (props: any) => {
        const { currentMessage } = props

        if (currentMessage.user._id === 1) {
            return (
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                    }}>
                    <Bubble
                        {...props}
                        wrapperStyle={{
                            right: {
                                backgroundColor: COLORS.primary,
                                marginRight: 12,
                                marginVertical: 12,
                            },
                        }}
                        textStyle={{
                            right: {
                                color: COLORS.white,
                            },
                        }}
                    />
                </View>
            )
        } else {
            return (
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}>
                    <Image
                        source={images.user1}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            marginLeft: 8,
                        }}
                    />
                    <Bubble
                        {...props}
                        wrapperStyle={{
                            left: {
                                backgroundColor: COLORS.secondary,
                                marginLeft: 12,
                            },
                        }}
                        textStyle={{
                            left: {
                                color: COLORS.white,
                            },
                        }}
                    />
                </View>
            )
        }

    }
    /***
     * Implementing chat functionnality
     */
    const submitHandler = () => {
        const message = {
            _id: Math.random().toString(36).substring(7),
            text: inputMessage,
            createdAt: new Date(),
            user: { _id: 1 },
        }
        setMessages((previousMessage: any) =>
            GiftedChat.append(previousMessage, [message])
        );

        setInputMessage("")
    }

    const renderInputToolbar = () => {
        return null;
    };
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
            <StatusBar hidden={true} />
            <View style={[styles.contentContainer, { backgroundColor: COLORS.white }]}>
                <View style={[styles.header, { backgroundColor: COLORS.white }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Image
                                source={icons.arrowLeft}
                                contentFit="contain"
                                style={[styles.headerIcon, {
                                    tintColor: COLORS.greyscale900
                                }]}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, {
                            color: COLORS.greyscale900
                        }]}>Customer Service</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                        <TouchableOpacity>
                            <Image
                                source={icons.call}
                                contentFit="contain"
                                style={[styles.headerIcon, {
                                    tintColor: COLORS.greyscale900
                                }]}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 16 }}>
                            <Image
                                source={icons.moreCircle}
                                contentFit="contain"
                                style={[styles.headerIcon, {
                                    tintColor: COLORS.greyscale900
                                }]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.chatContainer}>
                    <GiftedChat
                        messages={messages}
                        renderInputToolbar={renderInputToolbar}
                        user={{ _id: 1 }}
                        minInputToolbarHeight={0}
                        renderMessage={renderMessage}
                    />
                </View>
                <View style={[styles.inputContainer, {
                    backgroundColor: COLORS.white
                }]}>
                    <View style={[styles.inputMessageContainer, {
                        backgroundColor: COLORS.grayscale100
                    }]}>
                        <TextInput
                            style={styles.input}
                            value={inputMessage}
                            onChangeText={handleInputText}
                            placeholderTextColor={COLORS.greyscale900}
                            placeholder="Enter your message..."
                        />
                        <View style={styles.attachmentIconContainer}>
                            <TouchableOpacity>
                                <Feather name="image" size={24} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.microContainer}>
                        <MaterialCommunityIcons name="microphone" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "semiBold",
        color: COLORS.black,
        marginLeft: 22
    },
    headerIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginRight: 12,
    },
    chatContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    inputMessageContainer: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 10,
        backgroundColor: COLORS.grayscale100,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 12,
        alignItems: 'center'
    },
    attachmentIconContainer: {
        marginRight: 12,
    },
    input: {
        color: COLORS.greyscale900,
        flex: 1,
        paddingHorizontal: 10,
    },
    microContainer: {
        height: 48,
        width: 48,
        borderRadius: 49,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    }
});

export default CustomerService;