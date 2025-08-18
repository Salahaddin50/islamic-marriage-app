import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, FONTS } from "../constants";
import Button from "../components/Button";
import Keyword from "@/components/Keyword";
import { useNavigation } from "expo-router";
import { interests } from "@/data";

type Nav = {
    navigate: (value: string) => void
}

// Interests Screen component
const SelectYourInterests = () => {
    const { navigate } = useNavigation<Nav>();
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter((selected) => selected !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <View>
                    <TouchableOpacity onPress={() => navigate("selectyouridealmatch")}>
                        <Text style={styles.skip}>Skip</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ marginVertical: 22 }}>
                        <Text
                            style={[
                                styles.title,
                                { color: COLORS.black },
                            ]}
                        >
                            Select Topic, Start
                        </Text>
                        <Text
                            style={[
                                styles.title,
                                { color: COLORS.black },
                            ]}
                        >
                            Matching
                        </Text>
                        <Text
                            style={{
                                ...FONTS.body4,
                                marginTop: 16,
                                color: COLORS.black,
                            }}
                        >
                            Choose your interests and get the bestrecommendations.
                            Don't worry, you can always change it later.
                        </Text>
                    </View>
                    <View style={styles.keywordContainer}>
                        {interests.map((topic) => (
                            <Keyword
                                key={topic}
                                label={topic}
                                selected={selectedTopics.includes(topic)}
                                onPress={() => toggleTopic(topic)}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
            <Button
                title="Continue"
                filled
                style={styles.button}
                onPress={() => navigate("selectyouridealmatch")}
            />
        </SafeAreaView>
    );
};

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
    skip: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary,
        textAlign: "right",
    },
    title: {
        fontSize: 30,
        fontFamily: "bold",
        color: COLORS.black,
    },
    keywordContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 84,
    },
    button: {
        marginVertical: 22,
        position: "absolute",
        bottom: 22,
        width: SIZES.width - 32,
        borderRadius: 32,
        right: 16,
        left: 16,
    },
});

export default SelectYourInterests