import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, FlatList, TextInput, LayoutAnimation, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { faqKeywords, faqs } from '../data';
import { ScrollView as VirtualizedScrollView } from 'react-native-virtualized-view';
import { supabase } from '@/src/config/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import HelpCenterItem from '@/components/HelpCenterItem';
import { safeGoBack } from '../utils/responsive';
import { SupportTeamService } from '../src/services/support-team.service';
import { useTranslation } from 'react-i18next';

interface KeywordItemProps {
    item: {
        id: string;
        name: string;
    };
    onPress: (id: string) => void;
    selected: boolean;
}

// Define the types for the route and focused props
interface TabRoute {
    key: string;
    title: string;
}

interface RenderLabelProps {
    route: TabRoute;
    focused: boolean;
}

const toKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const faqsRoute = () => {
    const { t } = useTranslation();
    const [selectedKeywords, setSelectedKeywords] = useState<any>([]);
    const [expanded, setExpanded] = useState(-1);
    const [searchText, setSearchText] = useState('');

    const handleKeywordPress = (id: any) => {
        setSelectedKeywords((prevSelectedKeywords: any) => {
            const selectedKeyword = faqKeywords.find((keyword) => keyword.id === id);

            if (!selectedKeyword) {
                // Handle the case where the keyword with the provided id is not found
                return prevSelectedKeywords;
            }

            if (prevSelectedKeywords.includes(selectedKeyword.name)) {
                return prevSelectedKeywords.filter((keyword: any) => keyword !== selectedKeyword.name);
            } else {
                return [...prevSelectedKeywords, selectedKeyword.name];
            }
        });
    };

    const KeywordItem: React.FC<KeywordItemProps> = ({ item, onPress, selected }) => {
        const key = `help_center.keywords.${toKey(item.name)}`;
        const translated = t(key);
        const display = translated === key ? item.name : translated;
        return (
            <TouchableOpacity style={{
                paddingHorizontal: 14,
                marginHorizontal: 5,
                borderRadius: 21,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: COLORS.primary,
                borderWidth: 1,
                backgroundColor: selected ? COLORS.primary : "transparent",
            }} onPress={() => onPress(item.id)}>
                <Text style={{ color: selected ? COLORS.white : COLORS.primary }}>
                    {display}
                </Text>
            </TouchableOpacity>
        );
    };

    const toggleExpand = (index: any) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prevExpanded) => (prevExpanded === index ? -1 : index));
    };
    return (
        <View>
            <View style={{ marginVertical: 16 }}>
                <FlatList
                    data={faqKeywords}
                    horizontal
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <KeywordItem
                            item={item}
                            onPress={handleKeywordPress}
                            selected={selectedKeywords.includes(item.name)}
                        />
                    )}
                />
            </View>
            <View
                style={[
                    styles.searchBar,
                    {
                        backgroundColor: COLORS.grayscale100,
                    },
                ]}>
                <TouchableOpacity>
                    <Image
                        source={icons.search}
                        contentFit="contain"
                        style={[
                            styles.searchIcon,
                            {
                                tintColor: COLORS.grayscale400,
                            },
                        ]}
                    />
                </TouchableOpacity>
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: COLORS.grayscale400,
                        },
                    ]}
                    placeholder={t('help_center.search_placeholder')}
                    placeholderTextColor={COLORS.grayscale400}
                    value={searchText}
                    onChangeText={(text) => setSearchText(text)}
                />
            </View>
            <VirtualizedScrollView
                showsVerticalScrollIndicator={false}
                style={{ marginVertical: 22 }}>
                {faqs
                    .filter((faq) => {
                        if (selectedKeywords.length === 0) return true;
                        return (
                            faq.type &&
                            selectedKeywords.includes(faq.type)
                        );
                    })
                    .filter((faq) =>
                        faq.question.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((faq, index) => {
                        const faqKey = `help_center.faqs.${toKey(faq.question)}`;
                        const q = t(`${faqKey}.question`);
                        const a = t(`${faqKey}.answer`);
                        const displayQ = q === `${faqKey}.question` ? faq.question : q;
                        const displayA = a === `${faqKey}.answer` ? faq.answer : a;
                        return (
                            <View key={index} style={[styles.faqContainer, {
                                backgroundColor: COLORS.grayscale100,
                            }]}>
                                <TouchableOpacity
                                    onPress={() => toggleExpand(index)}
                                    activeOpacity={0.8}>
                                    <View style={styles.questionContainer}>
                                        <Text style={[styles.question, {
                                            color: COLORS.black,
                                        }]}>{displayQ}</Text>
                                        <Text style={[styles.icon, {
                                            color: COLORS.black,
                                        }]}
                                        >
                                            {expanded === index ? '-' : '+'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {expanded === index && (
                                    <Text style={[styles.answer, {
                                        color: COLORS.gray2
                                    }]}>{displayA}</Text>
                                )}
                            </View>
                        );
                    })}
            </VirtualizedScrollView>
        </View>
    );
};

const tutorialRoute = () => {
    const { t } = useTranslation();
    const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
    
    useEffect(() => {
        const fetchUserGender = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // Get user profile to determine gender
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('gender')
                    .eq('user_id', user.id)
                    .single();
                    
                if (profile?.gender) {
                    setUserGender(profile.gender.toLowerCase() === 'female' ? 'female' : 'male');
                }
            } catch (error) {
                console.error('Error fetching user gender:', error);
            }
        };
        
        fetchUserGender();
    }, []);
    
    return (
        <ScrollView style={styles.tutorialContainer}>
            <View style={styles.tutorialContent}>
                <Text style={styles.tutorialTitle}>{t('help_center.tutorial.title')}</Text>
                
                {userGender === 'male' ? (
                    <>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.male.step1')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.male.step2')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.male.step3')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.male.step4')}</Text>
                        
                        <Text style={styles.tutorialNotesTitle}>{t('help_center.tutorial.male.notes_title')}</Text>
                        <Text style={styles.tutorialNote}>{t('help_center.tutorial.male.note1')}</Text>
                        <Text style={styles.tutorialNote}>{t('help_center.tutorial.male.note2')}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.female.step1')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.female.step2')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.female.step3')}</Text>
                        <Text style={styles.tutorialStep}>{t('help_center.tutorial.female.step4')}</Text>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const contactUsRoute = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigationProp<any>>();
    const [customerSupportPhone, setCustomerSupportPhone] = useState<string | null>(null);
    const [customerSupportEmail, setCustomerSupportEmail] = useState<string | null>(null);

    useEffect(() => {
        // Load customer support WhatsApp number from database
        const loadCustomerSupport = async () => {
            const [phone, email] = await Promise.all([
                SupportTeamService.getCustomerSupportWhatsApp(),
                SupportTeamService.getCustomerSupportEmail(),
            ]);
            setCustomerSupportPhone(phone);
            setCustomerSupportEmail(email);
        };
        loadCustomerSupport();
    }, []);

    const handleEmail = () => {
        const email = customerSupportEmail || 'asim.mammadov82@outlook.com';
        const subject = encodeURIComponent(t('help_center.support_email_subject'));
        const mailto = `mailto:${email}?subject=${subject}`;
        try {
            // @ts-ignore
            require('react-native').Linking.openURL(mailto);
        } catch (e) {}
    };
    
    const handleWhatsApp = () => {
        if (!customerSupportPhone) {
            // Fallback to hardcoded number if DB is not available
            const phone = '966503531437';
            const url = `https://wa.me/${phone}`;
            try {
                // @ts-ignore
                require('react-native').Linking.openURL(url);
            } catch (e) {}
            return;
        }
        
        // Using wa.me works across platforms
        const url = `https://wa.me/${customerSupportPhone}`;
        try {
            // @ts-ignore
            require('react-native').Linking.openURL(url);
        } catch (e) {}
    };

    return (
        <View style={[styles.routeContainer, {
            backgroundColor: COLORS.tertiaryWhite
        }]}> 
            <HelpCenterItem
                icon={icons.headset}
                title={t('help_center.contact_us')}
                onPress={handleEmail}
            />
            <HelpCenterItem
                icon={icons.whatsapp}
                title={t('help_center.whatsapp')}
                onPress={handleWhatsApp}
            />
        </View>
    )
}
const renderScene = SceneMap({
    first: faqsRoute,
    second: contactUsRoute,
    third: tutorialRoute,
});

// Settings help Center Screen
const SettingsHelpCenter = () => {
    const { t } = useTranslation();
    const layout = useWindowDimensions();

    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
        { key: 'third', title: t('help_center.tab_tutorial') },
        { key: 'first', title: t('help_center.tab_faq') },
        { key: 'second', title: t('help_center.tab_contact') },
    ]);

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            indicatorStyle={{
                backgroundColor: COLORS.primary,
            }}
            activeColor={COLORS.primary}
            inactiveColor={COLORS.greyscale900}
            style={{
                backgroundColor: COLORS.white,
            }}
            renderLabel={({ route, focused }: RenderLabelProps) => (
                <Text style={[{
                    color: focused ? COLORS.primary : 'gray',
                    fontSize: 16,
                    fontFamily: "bold"
                }]}>
                    {route.title}
                </Text>
            )}
        />
    )
    /**
     * render header
     */
    const renderHeader = () => {
        const navigation = useNavigation<NavigationProp<any>>();

        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => safeGoBack(navigation, router, '/(tabs)/profile')}>
                        <Image
                            source={icons.arrowBack}
                            contentFit='contain'
                            style={[styles.backIcon, {
                                tintColor: COLORS.greyscale900
                            }]} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: COLORS.greyscale900
                    }]}>{t('help_center.header_title')}</Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        contentFit='contain'
                        style={[styles.moreIcon, {
                            tintColor: COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
            <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
                {renderHeader()}
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    renderTabBar={renderTabBar}
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
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
        marginRight: 16
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.black
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    routeContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingVertical: 22
    },
    searchBar: {
        width: SIZES.width - 32,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.grayscale100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    searchIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.grayscale400
    },
    input: {
        flex: 1,
        color: COLORS.grayscale400,
        marginHorizontal: 12
    },
    faqContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    questionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    question: {
        flex: 1,
        fontSize: 16,
        fontFamily: "semiBold",
        color: '#333',
    },
    icon: {
        fontSize: 18,
        color: COLORS.gray2,
    },
    answer: {
        fontSize: 14,
        marginTop: 10,
        paddingHorizontal: 16,
        paddingBottom: 10,
        fontFamily: "regular",
        color: COLORS.gray2,
    },
    tutorialContainer: {
        flex: 1,
        padding: 16,
    },
    tutorialContent: {
        backgroundColor: COLORS.grayscale100,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    tutorialTitle: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.black,
        marginBottom: 16,
    },
    tutorialStep: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.black,
        marginBottom: 12,
        paddingLeft: 8,
    },
    tutorialNotesTitle: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.black,
        marginTop: 16,
        marginBottom: 8,
    },
    tutorialNote: {
        fontSize: 15,
        fontFamily: "regular",
        color: COLORS.gray2,
        marginBottom: 8,
        paddingLeft: 8,
    }
})

export default SettingsHelpCenter