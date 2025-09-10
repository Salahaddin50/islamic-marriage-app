import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { COLORS, SIZES, icons } from '../constants';
import { Image } from 'expo-image';
import Header from '../components/Header';
import Button from '../components/Button';
import { Octicons } from "@expo/vector-icons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '@/src/config/supabase';
import { getResponsiveSpacing } from '../utils/responsive';
import { SupportTeamService } from '../src/services/support-team.service';
import { useTranslation } from 'react-i18next';

interface Package {
    id: string;
    type?: string;
    name: string;
    price: number;
    originalPrice?: number;
    crownColor: string;
    features: string[];
    isLifetime: boolean;
}

interface PaymentRecord {
    id: string;
    packageName: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
    packageType?: string;
    paymentDetails?: any;
    createdAt?: string;
    updatedAt?: string;
}

const Membership = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<NavigationProp<any>>();
    const params = useLocalSearchParams();
    const layout = useWindowDimensions();
    
    const [index, setIndex] = useState(0);
    const [routes, setRoutes] = useState([
        { key: 'packages', title: t('membership.tabs.packages') },
        { key: 'payments', title: t('membership.tabs.payments') },
        { key: 'contact', title: t('membership.tabs.contact') },
    ]);

    useEffect(() => {
        setRoutes([
            { key: 'packages', title: t('membership.tabs.packages') },
            { key: 'payments', title: t('membership.tabs.payments') },
            { key: 'contact', title: t('membership.tabs.contact') },
        ]);
    }, [t]);
    
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [currentUserPackage, setCurrentUserPackage] = useState<string | null>(null);
    const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
    const [pendingPackageTypes, setPendingPackageTypes] = useState<Set<string>>(new Set());
    const [currentFromPayments, setCurrentFromPayments] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Complaint modal state
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintText, setComplaintText] = useState('');
    const [complaintForPackage, setComplaintForPackage] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [profileSupportMalePhone, setProfileSupportMalePhone] = useState<string | null>(null);
    const [paymentSupportPhone, setPaymentSupportPhone] = useState<string | null>(null);

    const openComplaint = (pkgId: string) => {
        setComplaintForPackage(pkgId);
        setComplaintText('');
        setShowComplaintModal(true);
    };

    const submitComplaint = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !complaintForPackage || !complaintText.trim()) {
                setShowComplaintModal(false);
                return;
            }

            // Prefer the latest PENDING record for this specific package
            let targetRow: any = null;
            const { data: pendingRows, error: pendErr } = await supabase
              .from('payment_records')
              .select('id, complaints')
              .eq('user_id', user.id)
              .eq('package_type', complaintForPackage)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(1);
            if (!pendErr && Array.isArray(pendingRows) && pendingRows.length > 0) {
                targetRow = pendingRows[0];
            }

            // Fallback: latest record for this package (any status)
            if (!targetRow) {
                const { data: latestRows, error: latestErr } = await supabase
                  .from('payment_records')
                  .select('id, complaints')
                  .eq('user_id', user.id)
                  .eq('package_type', complaintForPackage)
                  .order('created_at', { ascending: false })
                  .limit(1);
                if (!latestErr && Array.isArray(latestRows) && latestRows.length > 0) {
                    targetRow = latestRows[0];
                }
            }

            if (!targetRow?.id) {
                setShowComplaintModal(false);
                Alert.alert(t('membership.alerts.not_found_title'), t('membership.alerts.not_found_body'));
                return;
            }

            const complaintItem = {
                package_type: complaintForPackage,
                message: complaintText.trim(),
                created_at: new Date().toISOString(),
            };

            const existing = Array.isArray(targetRow.complaints) ? targetRow.complaints : [];
            const next = [...existing, complaintItem];

            const { error: upErr } = await supabase
              .from('payment_records')
              .update({ complaints: next })
              .eq('id', targetRow.id);
            if (upErr) throw upErr;

            setShowComplaintModal(false);
            setComplaintText('');
            setComplaintForPackage(null);
            loadPaymentRecords();
            Alert.alert(t('membership.alerts.submitted_title'), t('membership.alerts.submitted_body'));
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 2500);
        } catch (e) {
            setShowComplaintModal(false);
            Alert.alert(t('membership.alerts.error_title'), t('membership.alerts.submit_error'));
        }
    };

    const openSupport = async () => {
        try {
            // Use Profile Support (m) phone from database, fallback to hardcoded
            const phone = profileSupportMalePhone || '966503531437';
            const text = encodeURIComponent(t('membership.support.profile_support_text'));
            const whatsappUrl = `whatsapp://send?phone=${phone}&text=${text}`;
            const webUrl = `https://wa.me/${phone}?text=${text}`;
            // Try native scheme first
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (e) {
            Alert.alert(t('membership.alerts.error_title'), t('membership.alerts.whatsapp_error'));
        }
    };

    const openPaymentSupport = async () => {
        try {
            // Use Payment Support phone from database, fallback to hardcoded
            const phone = paymentSupportPhone || '966503531437';
            const text = encodeURIComponent(t('membership.support.payment_support_text'));
            const whatsappUrl = `whatsapp://send?phone=${phone}&text=${text}`;
            const webUrl = `https://wa.me/${phone}?text=${text}`;
            // Try native scheme first
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (e) {
            Alert.alert(t('membership.alerts.error_title'), t('membership.alerts.whatsapp_error'));
        }
    };

    // Helper: derive baseline price strictly from completed payments only (latest target)
    const getBaselinePrice = (): number => {
        if (currentFromPayments) {
            const pkg = packages.find(p => p.id === currentFromPayments);
            return pkg?.price || 0;
        }
        return 0;
    };

    useEffect(() => {
        loadPackages();
        loadUserMembership();
        loadPaymentRecords();
        loadSupportPhones();
    }, []);

    // Reload packages/features when language changes
    useEffect(() => {
        loadPackages();
    }, [i18n.language]);

    const refreshMembershipPage = async () => {
        try {
            setLoading(true);
            setSelectedPackage(null);
            await loadPackages();
            await loadUserMembership();
            await loadPaymentRecords();
            await loadSupportPhones();
        } finally {
            setLoading(false);
        }
    };

    const loadSupportPhones = async () => {
        const profilePhone = await SupportTeamService.getProfileSupportMaleWhatsApp();
        setProfileSupportMalePhone(profilePhone);
        
        const paymentPhone = await SupportTeamService.getPaymentSupportWhatsApp();
        setPaymentSupportPhone(paymentPhone);
    };

    const loadPackages = async () => {
        try {
            const rawLang = typeof i18n?.language === 'string' ? i18n.language : 'en';
            const lang = (rawLang || 'en').toLowerCase().split('-')[0];
            
            // Fetch packages and features in parallel
            const [pkgRes, featRes] = await Promise.all([
                supabase
                    .from('packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order'),
                supabase
                    .from('package_features')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order')
            ]);

            if (pkgRes.error) throw pkgRes.error;
            if (featRes.error) {
                // If features table not present, proceed with packages only
                console.log('package_features not available or query failed:', featRes.error?.message);
            }

            const featuresByType: Record<string, string[]> = {};
            const featuresRows: any[] = Array.isArray(featRes.data) ? featRes.data : [];
            
            for (const row of featuresRows) {
                const typeKey = row.package_type || row.package || row.type;
                if (!typeKey) continue;
                
                let ft = row.feature_translations;
                if (typeof ft === 'string') {
                    try { ft = JSON.parse(ft); } catch {}
                }
                
                // Better translation resolution with fallbacks
                let translatedName = row.feature_name; // Default fallback
                if (ft && typeof ft === 'object') {
                    translatedName = ft[lang] || ft['en'] || row.feature_name;
                }
                
                if (!featuresByType[typeKey]) featuresByType[typeKey] = [];
                if (translatedName) featuresByType[typeKey].push(`${translatedName}`);
            }

            if (pkgRes.data) {
                const formattedPackages: Package[] = pkgRes.data.map((pkg: any) => {
                    // Try multiple ways to match package type with features
                    const typeVal = pkg.package_type || pkg.type || pkg.id || pkg.package_id;
                    const pkgName = (pkg.name || '').toLowerCase();
                    
                    // Map package names to feature types
                    let featureTypeKey = typeVal;
                    if (pkgName.includes('golden') && pkgName.includes('premium')) {
                        featureTypeKey = 'golden_premium';
                    } else if (pkgName.includes('vip') && pkgName.includes('premium')) {
                        featureTypeKey = 'vip_premium';
                    } else if (pkgName.includes('premium')) {
                        featureTypeKey = 'premium';
                    }
                    
                    const baseFeatures: string[] = Array.isArray(pkg.features) ? pkg.features : [];
                    const translatedFeatures = featuresByType[featureTypeKey] && featuresByType[featureTypeKey].length > 0 ? featuresByType[featureTypeKey] : baseFeatures;
                    
                    let nt = pkg.name_translations;
                    if (typeof nt === 'string') {
                        try { nt = JSON.parse(nt); } catch {}
                    }
                    
                    // Better package name translation resolution
                    let localizedName = pkg.name; // Default fallback
                    if (nt && typeof nt === 'object') {
                        localizedName = nt[lang] || nt['en'] || pkg.name;
                    }
                    
                    return {
                        id: pkg.package_id,
                        type: pkg.package_type,
                        name: localizedName,
                        price: Number(pkg.price),
                        crownColor: pkg.crown_color,
                        features: translatedFeatures,
                        isLifetime: pkg.is_lifetime || true,
                    } as Package;
                });
                setPackages(formattedPackages);
            }
        } catch (error) {
            console.log('Error loading packages:', error);
            // Fallback to empty array - will show error state
            setPackages([]);
        }
    };

    // If navigated with ?tab=payments, switch to payments tab
    useEffect(() => {
        try {
            if (typeof params?.tab === 'string' && params.tab.toLowerCase() === 'payments') {
                setIndex(1);
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.tab]);

    useEffect(() => {
        let channel: any;
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                channel = supabase
                    .channel(`membership-realtime-${user.id}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'payment_records',
                        filter: `user_id=eq.${user.id}`,
                    }, () => {
                        loadPaymentRecords();
                    })
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'user_packages',
                        filter: `user_id=eq.${user.id}`,
                    }, () => {
                        loadUserMembership();
                    })
                    .subscribe();
            } catch {}
        })();
        return () => {
            try {
                if (channel) supabase.removeChannel(channel);
            } catch {}
        };
    }, []);

    // Refresh when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            loadUserMembership();
            loadPaymentRecords();
        }, [])
    );

    const loadUserMembership = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_packages')
                .select('package_type, is_active')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle();

            if (data) {
                setCurrentUserPackage(data.package_type);
            } else {
                setCurrentUserPackage(null);
            }
        } catch (error) {
            console.log('Error loading user membership:', error);
        }
    };

    const loadPaymentRecords = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('payment_records')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                const formattedRecords: PaymentRecord[] = data.map(record => ({
                    id: record.id,
                    packageName: record.package_name,
                    amount: record.amount,
                    date: new Date(record.created_at).toLocaleDateString(),
                    status: record.status,
                    packageType: record.package_type,
                    paymentDetails: record.payment_details,
                    createdAt: record.created_at,
                    updatedAt: record.updated_at,
                }));
                setPaymentRecords(formattedRecords);
                // Track pending packages
                const pending = new Set<string>();
                for (const r of data) {
                    if (r.status === 'pending' && r.package_type) pending.add(r.package_type);
                }
                setPendingPackageTypes(pending);

                // Helper: safe parse timestamp
                const parseTs = (v?: string) => (v ? Date.parse(v) : 0);

                // Derive current package from completed payment details
                const completed = formattedRecords.filter(r => r.status === 'completed');
                let latestTarget: { pkg: string | null; ts: number } = { pkg: null, ts: 0 };
                for (const rec of completed) {
                    if (Array.isArray(rec.paymentDetails) && rec.paymentDetails.length > 0) {
                        let newest = rec.paymentDetails[0];
                        for (const ev of rec.paymentDetails) {
                            const t = parseTs(ev?.timestamp) || parseTs(rec.updatedAt) || parseTs(rec.createdAt);
                            const tNewest = parseTs(newest?.timestamp) || parseTs(rec.updatedAt) || parseTs(rec.createdAt);
                            if (t > tNewest) newest = ev;
                        }
                        const target = newest?.target_package || rec.packageType || null;
                        const ts = parseTs(newest?.timestamp) || parseTs(rec.updatedAt) || parseTs(rec.createdAt);
                        if (target && ts >= latestTarget.ts) {
                            latestTarget = { pkg: target, ts };
                        }
                    } else {
                        const target = rec.packageType || null;
                        const ts = parseTs(rec.updatedAt) || parseTs(rec.createdAt);
                        if (target && ts >= latestTarget.ts) {
                            latestTarget = { pkg: target, ts };
                        }
                    }
                }
                setCurrentFromPayments(latestTarget.pkg);
            }
        } catch (error) {
            console.log('Error loading payment records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePackageSelection = async (pkg: Package) => {
        // Only select the package; show action button instead of immediate alert
        setSelectedPackage(pkg);
    };

    const processPackagePurchase = async (pkg: Package) => {
        try {
            // Use secure server-side validation - only pass package ID
            router.push(`/checkout/paypal?package_id=${encodeURIComponent(pkg.id)}`);
        } catch (error) {
            Alert.alert(t('membership.alerts.error_title'), t('membership.alerts.checkout_error'));
        }
    };

    const renderPackage = (pkg: Package) => {
        const baselinePrice = getBaselinePrice();
        const hasCompletedForPkg = paymentRecords.some(r => r.status === 'completed' && (
            (Array.isArray(r.paymentDetails) && r.paymentDetails.some((ev: any) => ev?.target_package === pkg.id)) || r.packageType === pkg.id
        ));
        const isCurrentUI = (currentFromPayments === pkg.id && hasCompletedForPkg);
        const isPending = pendingPackageTypes.has(pkg.id);

        const isDowngrade = baselinePrice > 0 && pkg.price <= baselinePrice && !isCurrentUI;
        const canUpgrade = baselinePrice > 0 && pkg.price > baselinePrice;
        const isSelected = selectedPackage?.id === pkg.id;
        const upgradePrice = Math.max(pkg.price - baselinePrice, 0);
        const isSelectedBySystem = isCurrentUI || isPending;

        return (
            <TouchableOpacity
                key={pkg.id}
                style={[
                    styles.packageContainer,
                    isCurrentUI && styles.currentPackage,
                    (isDowngrade || isPending) && styles.disabledPackage,
                    (!isCurrentUI && !isDowngrade && !isPending && isSelected) && [styles.selectedPackage, { borderColor: pkg.crownColor }],
                    { backgroundColor: COLORS.white }
                ]}
                onPress={() => {
                    if (!isCurrentUI && !isDowngrade && !isPending) setSelectedPackage(pkg);
                }}
                disabled={isCurrentUI || isDowngrade}
            >
                <View style={styles.packageHeader}>
                    <Image
                        source={icons.crown2}
                        contentFit='contain'
                        style={[styles.crownIcon, { tintColor: pkg.crownColor }]}
                    />
                    <Text style={[styles.packageName, { color: pkg.crownColor }]}>
                        {pkg.name}
                    </Text>
                    {isCurrentUI && (
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>{t('membership.packages.current')}</Text>
                        </View>
                    )}
                    {!isCurrentUI && isPending && (
                        <View style={styles.pendingBadgeRow}>
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>{t('membership.packages.pending')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openComplaint(pkg.id)} style={styles.pendingActionButton}>
                                <Text style={styles.pendingActionText}>{t('membership.packages.complain')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {isSelectedBySystem && (
                        <></>
                    )}
                </View>
                
                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: COLORS.greyscale900 }]}>
                        ${pkg.price}
                    </Text>
                    <Text style={[styles.priceLabel, { color: COLORS.grayscale700 }]}>
                        {t('membership.packages.lifetime')}
                    </Text>
                </View>

                <View style={styles.featuresContainer}>
                    {pkg.features.map((feature, index) => (
                        <View style={styles.featureItem} key={index}>
                            <Image source={icons.heart2} contentFit='contain' style={styles.featureHeart} />
                            <Text style={[styles.featureText, { color: COLORS.greyScale800 }]}>
                                {feature}
                            </Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    const renderPaymentRecord = (record: PaymentRecord) => (
        <View key={record.id} style={styles.paymentRecord}>
            <View style={styles.paymentInfo}>
                <Text style={[styles.paymentPackage, { color: COLORS.greyscale900 }]}>
                    {record.packageName}
                </Text>
                <Text style={[styles.paymentDate, { color: COLORS.grayscale700 }]}>
                    {record.date}
                </Text>
            </View>
            <View style={styles.paymentAmount}>
                <Text style={[styles.amount, { color: COLORS.greyscale900 }]}>
                    ${record.amount}
                </Text>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: record.status === 'completed' ? COLORS.primary : 
                      record.status === 'pending' ? '#FFA500' : '#FF4444' }
                ]}>
                    <Text style={styles.statusText}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                </View>
            </View>
        </View>
    );

    const PackagesTab = () => (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: COLORS.greyscale900 }] }>
                    {t('membership.packages_tab.title')}
                </Text>
                <Text style={[styles.tabSubtitle, { color: COLORS.grayscale700 }] }>
                    {t('membership.packages_tab.subtitle')}
                </Text>
            </View>
            {packages.map(renderPackage)}
            {(currentFromPayments === 'vip_premium' || currentFromPayments === 'golden_premium') && (
                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                    <Button title={t('membership.packages_tab.get_full_support')} filled onPress={openSupport} style={styles.bigButtonPurple} />
                </View>
            )}
        </ScrollView>
    );

    const PaymentRecordTab = () => (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: COLORS.greyscale900 }] }>
                    {t('membership.payments_tab.title')}
                </Text>
                <Text style={[styles.tabSubtitle, { color: COLORS.grayscale700 }] }>
                    {t('membership.payments_tab.subtitle')}
                </Text>
            </View>
            {paymentRecords.length > 0 ? (
                paymentRecords.map(renderPaymentRecord)
            ) : (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: COLORS.grayscale700 }] }>
                        {t('membership.payments_tab.empty')}
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    const ContactUsTab = () => (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.contactContainer}>
                <View style={styles.contactIconContainer}>
                    <Image 
                        source={icons.whatsapp2} 
                        contentFit="contain" 
                        style={styles.contactIcon}
                    />
                </View>
                
                <Text style={[styles.contactTitle, { color: COLORS.greyscale900 }]}> 
                    {t('membership.contact_tab.need_payment_help')}
                </Text>
                
                <Text style={[styles.contactMessage, { color: COLORS.grayscale700 }]}> 
                    {t('membership.contact_tab.message')}
                </Text>
                
                <View style={styles.contactFeatures}>
                    <View style={styles.contactFeature}>
                        <Image source={icons.check} contentFit="contain" style={styles.featureIcon} />
                        <Text style={[styles.contactFeatureText, { color: COLORS.grayscale700 }]}> 
                            {t('membership.contact_tab.features.instant_support')}
                        </Text>
                    </View>
                    <View style={styles.contactFeature}>
                        <Image source={icons.check} contentFit="contain" style={styles.featureIcon} />
                        <Text style={[styles.contactFeatureText, { color: COLORS.grayscale700 }]}> 
                            {t('membership.contact_tab.features.issue_resolution')}
                        </Text>
                    </View>
                    <View style={styles.contactFeature}>
                        <Image source={icons.check} contentFit="contain" style={styles.featureIcon} />
                        <Text style={[styles.contactFeatureText, { color: COLORS.grayscale700 }]}> 
                            {t('membership.contact_tab.features.professional_assistance')}
                        </Text>
                    </View>
                </View>

                <Button 
                    title={t('membership.contact_tab.contact_payment_support')} 
                    filled 
                    onPress={openPaymentSupport}
                    style={styles.contactButton}
                />
                
                <Text style={[styles.contactNote, { color: COLORS.greyscale600 }]}> 
                    {t('membership.contact_tab.note')}
                </Text>
            </View>
        </ScrollView>
    );

    const renderScene = SceneMap({
        packages: PackagesTab,
        payments: PaymentRecordTab,
        contact: ContactUsTab,
    });

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: COLORS.primary }}
            style={{ backgroundColor: COLORS.white }}
            activeColor={COLORS.primary}
            inactiveColor={COLORS.greyscale900}
        />
    );



    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
            <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
                <Header 
                    title={t('membership.header_title')} 
                    fallbackRoute="/(tabs)/profile" 
                    rightIcon={icons.refresh}
                    onRightPress={refreshMembershipPage}
                />
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    renderTabBar={renderTabBar}
                />

                {/* Floating action button for payment */}
                {index === 0 && selectedPackage && (() => {
                    // If any package is pending, do not allow upgrades/payments
                    if (pendingPackageTypes.size > 0) return null;
                    const baselinePrice = getBaselinePrice();
                    const hasCompletedForSelected = paymentRecords.some(r => r.status === 'completed' && (
                        (Array.isArray(r.paymentDetails) && r.paymentDetails.some((ev: any) => ev?.target_package === selectedPackage.id)) || r.packageType === selectedPackage.id
                    ));
                    const selectedIsCurrentUI = (currentFromPayments === selectedPackage.id && hasCompletedForSelected);
                    const isDowngrade = baselinePrice > 0 && selectedPackage.price <= baselinePrice && !selectedIsCurrentUI;
                    const isPending = pendingPackageTypes.has(selectedPackage.id);
                    if (selectedIsCurrentUI || isDowngrade || isPending) return null;
                    const isUpgrade = baselinePrice > 0 && selectedPackage.price > baselinePrice;
                    const amount = isUpgrade ? (selectedPackage.price - baselinePrice) : selectedPackage.price;
                    const label = isUpgrade ? t('membership.packages_tab.pay_difference', { amount }) : t('membership.packages_tab.proceed_payment', { amount });
                    return (
                        <View style={styles.fabButtonWrapper}>
                            <Button title={label} filled onPress={() => processPackagePurchase(selectedPackage)} style={styles.bigButton} />
                        </View>
                    );
                })()}

                {/* Complaint Modal */}
                <Modal
                    visible={showComplaintModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowComplaintModal(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: Math.min(420, SIZES.width - 32), backgroundColor: COLORS.white, borderRadius: 12, padding: 16 }}>
                            <Text style={{ fontFamily: 'bold', fontSize: 18, color: COLORS.greyscale900, marginBottom: 10 }}>{t('membership.complaint_modal.title')}</Text>
                            <Text style={{ fontFamily: 'medium', fontSize: 14, color: COLORS.grayscale700, marginBottom: 8 }}>{t('membership.complaint_modal.describe')}</Text>
                            <TextInput
                                value={complaintText}
                                onChangeText={setComplaintText}
                                multiline
                                placeholder={t('membership.complaint_modal.placeholder')}
                                placeholderTextColor={COLORS.grayscale700}
                                style={{ minHeight: 100, borderWidth: 1, borderColor: COLORS.grayscale200, borderRadius: 8, padding: 10, color: COLORS.greyscale900 }}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
                                <TouchableOpacity onPress={() => setShowComplaintModal(false)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.tansparentPrimary, borderWidth: 1, borderColor: COLORS.primary }}>
                                    <Text style={{ color: COLORS.primary, fontFamily: 'bold' }}>{t('membership.complaint_modal.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={submitComplaint} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.primary }}>
                                    <Text style={{ color: COLORS.white, fontFamily: 'bold' }}>{t('membership.complaint_modal.submit')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Success Toast */}
                {showSuccessToast && (
                    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 80, backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 5 }}>
                        <Text style={{ color: COLORS.white, fontFamily: 'bold', textAlign: 'center' }}>{t('membership.alerts.submitted_body')}</Text>
                    </View>
                )}

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
        padding: getResponsiveSpacing(16),
    },
    tabContent: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    tabContentContainer: {
        paddingBottom: getResponsiveSpacing(180), // extra space for floating FAB and safe areas
    },
    tabHeader: {
        padding: getResponsiveSpacing(8),
        alignItems: 'center',
    },
    tabTitle: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        textAlign: 'center',
        marginBottom: 4,
    },
    tabSubtitle: {
        fontSize: 12,
        fontFamily: 'medium',
        color: COLORS.grayscale700,
        textAlign: 'center',
        marginBottom: 8,
    },
    packageContainer: {
        marginHorizontal: 8,
        marginBottom: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    currentPackage: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(106, 27, 154, 0.06)',
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9, // was 8
    },
    crownIcon: {
        width: 26, // was 24 (~+8%)
        height: 26,
        marginRight: 9,
    },
    packageName: {
        fontSize: 20, // was 18 (~+11%)
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        flex: 1,
    },
    currentBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    currentBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontFamily: 'bold',
    },
    pendingBadge: {
        backgroundColor: '#FFA500',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginLeft: 0,
    },
    pendingBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontFamily: 'bold',
    },
    pendingBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    pendingActionButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: COLORS.tansparentPrimary,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    pendingActionText: {
        color: COLORS.primary,
        fontFamily: 'bold',
        fontSize: 12,
    },
    // Visual highlight for selected (eligible) package
    selectedPackage: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderWidth: 2,
    },
    // Disabled (downgrade) styling
    disabledPackage: {
        opacity: 0.5,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 9, // was 8
    },
    price: {
        fontSize: 24, // was 22 (~+9%)
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginRight: 7,
    },
    priceLabel: {
        fontSize: 13, // was 12 (~+8%)
        fontFamily: 'medium',
        color: COLORS.grayscale700,
    },
    featuresContainer: {
        marginBottom: 5, // was 4
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7, // was 6
    },
    featureHeart: {
        width: 12,
        height: 12,
        tintColor: COLORS.primary,
        marginRight: 8,
        borderRadius: 2,
    },
    featureText: {
        fontSize: 15, // was 14 (~+7%)
        fontFamily: 'medium',
        color: COLORS.greyScale800,
        flex: 1,
    },
    fabButtonWrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
    },
    bigButton: {
        height: 52,
        borderRadius: 25,
    },
    supportInlineButton: {
        marginTop: 12,
        marginHorizontal: 16,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#6A1B9A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
        elevation: 5,
    },
    bigButtonPurple: {
        height: 52,
        borderRadius: 25,
        backgroundColor: '#6A1B9A',
        borderColor: '#6A1B9A',
    },
    supportInlineText: {
        color: COLORS.white,
        fontFamily: 'bold',
        fontSize: 16,
    },
    paymentRecord: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    paymentInfo: {
        flex: 1,
    },
    paymentPackage: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginBottom: 4,
    },
    paymentDate: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.grayscale700,
    },
    paymentAmount: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.grayscale700,
    },
    // Complaint Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginBottom: 15,
    },
    modalTextInput: {
        width: '100%',
        height: 100,
        borderColor: COLORS.greyscale300,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        textAlignVertical: 'top',
    },
    modalButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'bold',
    },
    // Contact Us Tab Styles
    contactContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: getResponsiveSpacing(24),
        paddingVertical: getResponsiveSpacing(40),
    },
    contactIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: getResponsiveSpacing(24),
    },
    contactIcon: {
        width: 40,
        height: 40,
        tintColor: COLORS.primary,
    },
    contactTitle: {
        fontSize: 24,
        fontFamily: 'bold',
        textAlign: 'center',
        marginBottom: getResponsiveSpacing(16),
    },
    contactMessage: {
        fontSize: 16,
        fontFamily: 'regular',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: getResponsiveSpacing(32),
    },
    contactFeatures: {
        width: '100%',
        marginBottom: getResponsiveSpacing(32),
    },
    contactFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveSpacing(12),
    },
    featureIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.primary,
        marginRight: getResponsiveSpacing(12),
    },
    contactFeatureText: {
        fontSize: 14,
        fontFamily: 'medium',
        flex: 1,
    },
    contactButton: {
        width: '100%',
        marginBottom: getResponsiveSpacing(16),
        backgroundColor: COLORS.primary,
    },
    contactNote: {
        fontSize: 12,
        fontFamily: 'regular',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default Membership;
