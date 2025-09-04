import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { COLORS, SIZES, icons } from '../constants';
import { Image } from 'expo-image';
import Header from '../components/Header';
import { Octicons } from "@expo/vector-icons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '@/src/config/supabase';
import { getResponsiveSpacing } from '../utils/responsive';

interface Package {
    id: string;
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



const packages: Package[] = [
    {
        id: "premium",
        name: "Premium",
        price: 100,
        crownColor: "#6A1B9A", // Purple
        features: [
            'Lifetime subscription till marriage',
            'Arrange video call',
            'Request whatsapp number'
        ],
        isLifetime: true
    },
    {
        id: "vip_premium", 
        name: "VIP Premium",
        price: 200,
        crownColor: "#34A853", // Green
        features: [
            'All Premium Features',
            '24/7 facilitation and convincing support'
        ],
        isLifetime: true
    },
    {
        id: "golden_premium",
        name: "Golden Premium", 
        price: 500,
        crownColor: "#B8860B", // Dark Golden
        features: [
            'All VIP Premium features',
            'Just Relax, we will reach you in your whatsapp and marry you'
        ],
        isLifetime: true
    }
];

const Membership = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const layout = useWindowDimensions();
    
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'packages', title: 'Packages' },
        { key: 'payments', title: 'Payment Record' },
    ]);
    
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
                Alert.alert('Not Found', 'No payment found for this package to attach your complaint.');
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
            Alert.alert('Submitted', 'Your complaint has been submitted, we will verify and return to you');
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 2500);
        } catch (e) {
            setShowComplaintModal(false);
            Alert.alert('Error', 'Failed to submit complaint.');
        }
    };

    const openSupport = async () => {
        try {
            const phone = '966503531437';
            const text = encodeURIComponent('Assalamu Alaikum, I need full support.');
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
            Alert.alert('Error', 'Unable to open WhatsApp.');
        }
    };

    const priceById: Record<string, number> = {
        premium: 100,
        vip_premium: 200,
        golden_premium: 500,
    };

    // Helper: derive baseline price strictly from completed payments only (latest target)
    const getBaselinePrice = (): number => {
        if (currentFromPayments) {
            return priceById[currentFromPayments] || 0;
        }
        return 0;
    };

    useEffect(() => {
        loadUserMembership();
        loadPaymentRecords();
    }, []);

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

    const processPackagePurchase = async (pkg: Package, amount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const baselinePrice = getBaselinePrice();
            const baselinePackageId = currentUserPackage || (
                paymentRecords
                  .filter(r => r.status === 'completed' && !!r.packageType)
                  .sort((a,b) => (priceById[b.packageType!]||0) - (priceById[a.packageType!]||0))[0]?.packageType || null
            );

            const paymentDetails = {
                type: baselinePrice > 0 && pkg.price > baselinePrice ? 'upgrade' : 'purchase',
                previous_package: baselinePackageId,
                target_package: pkg.id,
                baseline_price: baselinePrice,
                target_price: pkg.price,
                difference_paid: amount,
                timestamp: new Date().toISOString(),
            };

            // Create a single payment record with JSON details
            const { error } = await supabase
                .from('payment_records')
                .insert({
                    user_id: user.id,
                    package_name: pkg.name,
                    package_type: pkg.id,
                    amount: amount,
                    status: 'pending',
                    payment_method: 'manual',
                    payment_details: paymentDetails,
                });

            if (!error) {
                Alert.alert('Success', 'Package purchase request submitted! We will contact you for payment.');
                await loadPaymentRecords();
                await loadUserMembership();
                setIndex(1);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process package selection.');
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
                            <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                    )}
                    {!isCurrentUI && isPending && (
                        <View style={styles.pendingBadgeRow}>
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>Pending</Text>
                            </View>
                            <TouchableOpacity onPress={() => openComplaint(pkg.id)} style={styles.pendingActionButton}>
                                <Text style={styles.pendingActionText}>Complain</Text>
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
                        Lifetime
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
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: COLORS.greyscale900 }] }>
                    Choose Your Package
                </Text>
                <Text style={[styles.tabSubtitle, { color: COLORS.grayscale700 }] }>
                    All packages are lifetime subscriptions
                </Text>
            </View>
            {packages.map(renderPackage)}
            {(currentFromPayments === 'vip_premium' || currentFromPayments === 'golden_premium') && (
                <TouchableOpacity onPress={openSupport} style={styles.supportInlineButton} activeOpacity={0.9}>
                    <MaterialCommunityIcons name="whatsapp" size={18} color={COLORS.white} />
                    <Text style={styles.supportInlineText}>Get Full Support</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    const PaymentRecordTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: COLORS.greyscale900 }]}>
                    Payment History
                </Text>
                <Text style={[styles.tabSubtitle, { color: COLORS.grayscale700 }]}>
                    Your transaction records
                </Text>
            </View>
            {paymentRecords.length > 0 ? (
                paymentRecords.map(renderPaymentRecord)
            ) : (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: COLORS.grayscale700 }]}>
                        No payment records found
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    const renderScene = SceneMap({
        packages: PackagesTab,
        payments: PaymentRecordTab,
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
                <Header title="My Membership" fallbackRoute="/(tabs)/profile" />
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    renderTabBar={renderTabBar}
                />

                {/* Floating action button for payment */}
                {index === 0 && selectedPackage && (() => {
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
                    const label = isUpgrade ? `Pay the difference $${amount}` : `Proceed for Payment $${amount}`;
                    return (
                        <TouchableOpacity
                            onPress={() => processPackagePurchase(selectedPackage, amount)}
                            style={styles.fabButton}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.fabButtonText}>{label}</Text>
                        </TouchableOpacity>
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
                            <Text style={{ fontFamily: 'bold', fontSize: 18, color: COLORS.greyscale900, marginBottom: 10 }}>Submit a Complaint</Text>
                            <Text style={{ fontFamily: 'medium', fontSize: 14, color: COLORS.grayscale700, marginBottom: 8 }}>Describe the issue with your payment:</Text>
                            <TextInput
                                value={complaintText}
                                onChangeText={setComplaintText}
                                multiline
                                placeholder="Type your message..."
                                placeholderTextColor={COLORS.grayscale700}
                                style={{ minHeight: 100, borderWidth: 1, borderColor: COLORS.grayscale200, borderRadius: 8, padding: 10, color: COLORS.greyscale900 }}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
                                <TouchableOpacity onPress={() => setShowComplaintModal(false)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.tansparentPrimary, borderWidth: 1, borderColor: COLORS.primary }}>
                                    <Text style={{ color: COLORS.primary, fontFamily: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={submitComplaint} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.primary }}>
                                    <Text style={{ color: COLORS.white, fontFamily: 'bold' }}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Support button moved inside PackagesTab */}

                {/* Success Toast */}
                {showSuccessToast && (
                    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 80, backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 5 }}>
                        <Text style={{ color: COLORS.white, fontFamily: 'bold', textAlign: 'center' }}>Your complaint has been submitted, we will verify and return to you</Text>
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
    // Floating action button
    fabButton: {
        position: 'absolute',
        left: 16, // matchdetails
        right: 16,
        bottom: 24, // matchdetails
        backgroundColor: COLORS.primary, // matchdetails primary
        height: 42, // matchdetails
        borderRadius: 10, // matchdetails
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
        elevation: 5,
    },
    fabButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'bold',
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
});

export default Membership;
