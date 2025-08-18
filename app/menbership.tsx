import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES, icons } from '../constants';
import { Octicons } from "@expo/vector-icons";
import { useNavigation } from 'expo-router';

interface Plan {
    id: string;
    icon: number;
    price: string;
    period: string;
    features: string[];
}

interface MembershipProps {
    navigation: {
        navigate: (screen: string) => void;
    };
}

const plans: Plan[] = [
    {
        id: "1",
        icon: icons.premium1,
        price: '$9.99',
        period: '/month',
        features: [
            'Unlimited swipes to find your perfect match.',
            'View who liked your profile.',
            'Rewind your last swipe to give it another chance.',
        ],
    },
    {
        id: "3",
        icon: icons.premium1,
        price: '$19.99',
        period: '/month',
        features: [
            'Boost your profile for higher visibility.',
            'Access to exclusive match suggestions.',
            'Enjoy priority customer support.',
        ],
    },
    {
        id: "2",
        icon: icons.premium1,
        price: '$99.99',
        period: '/year',
        features: [
            'All premium features at a discounted rate.',
            'See who liked your profile instantly.',
            'Unlimited chat with potential matches.',
        ],
    }
];

type Nav = {
    navigate: (value: string) => void
}

const Membership: React.FC<MembershipProps> = () => {
    const { navigate } = useNavigation<Nav>();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const handlePlanSelection = (plan: Plan) => {
        setSelectedPlan(plan);
    };

    const renderPlan = (planData: Plan) => {
        const { icon, price, period, features, id } = planData;

        return (
            <TouchableOpacity
                key={id}
                style={[
                    styles.btnContainer,
                    selectedPlan === planData ? styles.selectedPlan : null,
                    { backgroundColor: COLORS.white }
                ]}
                onPress={() => {
                    handlePlanSelection(planData);
                    navigate('paymentmethods');
                }}>
                <View style={{ alignItems: "center" }}>
                    <Image
                        source={icon}
                        resizeMode='contain'
                        style={styles.premiumIcon}
                    />
                    <View style={styles.priceContainer}>
                        <Text style={[styles.price, { color: COLORS.greyscale900 }]}>{price}</Text>
                        <Text style={[styles.priceMonth, { color: COLORS.grayscale700 }]}>{" "}{period}</Text>
                    </View>
                </View>
                <View style={styles.premiumItemContainer}>
                    {features.map((feature, index) => (
                        <View style={styles.premiumItem} key={index}>
                            <Octicons name="check" size={24} color={COLORS.primary} />
                            <Text style={[styles.premiumText, { color: COLORS.greyScale800 }]}>{feature}</Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.viewContainer}>
                        <Text style={styles.title}>Subscribe to Premium</Text>
                        <Text style={[styles.subtitle, { color: COLORS.greyScale800 }]}>
                            Experience high-quality workout videos with no interruptions, and without any ads.
                        </Text>
                    </View>
                    {plans.map((plan) => renderPlan(plan))}
                </ScrollView>
            </View>
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
        backgroundColor: COLORS.white,
        padding: 16,
    },
    title: {
        fontSize: 32,
        fontFamily: "bold",
        color: COLORS.primary,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.greyScale800,
        marginVertical: 16,
        textAlign: "center",
    },
    viewContainer: {
        marginVertical: 12,
    },
    btnContainer: {
        width: SIZES.width - 32,
        height: 300,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: "center",
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: "#FAFAFA",
        paddingHorizontal: 16,
    },
    selectedPlan: {
        borderColor: COLORS.primary,
    },
    premiumIcon: {
        width: 60,
        height: 60,
        tintColor: COLORS.primary,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 12,
    },
    price: {
        fontSize: 32,
        fontFamily: "bold",
        color: COLORS.greyscale900,
    },
    priceMonth: {
        fontSize: 18,
        fontFamily: "medium",
        color: COLORS.grayscale700,
    },
    premiumItemContainer: {
        marginTop: 16,
    },
    premiumItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },
    premiumText: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.greyScale800,
        marginLeft: 24,
    },
});

export default Membership;