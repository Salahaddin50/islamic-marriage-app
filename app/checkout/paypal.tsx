import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/src/config/supabase';
import { COLORS } from '@/constants';
import Header from '../../components/Header';

// Minimal PayPal JS SDK loader for web
function loadPayPal(clientId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not web'));
    // @ts-ignore
    if (window.paypal) return resolve((window as any).paypal);
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&disable-funding=card,credit`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if ((window as any).paypal) resolve((window as any).paypal);
      else reject(new Error('PayPal SDK failed to load'));
    };
    script.onerror = () => reject(new Error('PayPal SDK script error'));
    document.head.appendChild(script);
  });
}

export default function PaypalCheckout() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paypalHeight, setPaypalHeight] = useState<number>(44);
  const cancelledRef = useRef(false);
  const [epointRatio, setEpointRatio] = useState<number | null>(null);
  const [epointLoading, setEpointLoading] = useState<boolean>(false);
  const securePaymentRef = useRef<any>(null);

  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
  const packageId = String(params?.package_id || '');

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        setError('PayPal checkout is available on web only in this build.');
        setLoading(false);
        return;
      }
      if (!clientId) {
        setError('Missing PayPal client ID.');
        setLoading(false);
        return;
      }
      if (!packageId) {
        setError('Package ID is required.');
        setLoading(false);
        return;
      }

      try {
        // Compute preview amount locally for header (server validates on createOrder)
        const [{ data: pkg }, { data: currentPkg } ] = await Promise.all([
          supabase.from('packages').select('name, price, epoint_currency').eq('package_id', packageId).maybeSingle(),
          supabase.from('user_packages').select('package_type').eq('is_active', true).order('activated_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        const packageName = pkg?.name || 'Package';
        const targetPrice = Number(pkg?.price || 0);
        const ratioVal = Number(pkg?.epoint_currency || 0);
        const baselineType = currentPkg?.package_type || null;
        let baselinePrice = 0;
        if (baselineType) {
          const { data: basePkg } = await supabase.from('packages').select('price').eq('package_id', baselineType).maybeSingle();
          baselinePrice = Number(basePkg?.price || 0);
        }
        const previewAmount = Math.max(targetPrice - baselinePrice, 0);
        setPaymentData({ package_name: packageName, amount: previewAmount });

        // Fetch Epoint AZN ratio for header
        try {
          const r = Number(ratioVal);
          if (r && isFinite(r) && r > 0) setEpointRatio(r);
        } catch {}

        // Load PayPal SDK and render buttons
        const paypal = await loadPayPal(clientId);
        if (!containerRef.current) throw new Error('Container missing');

        const buttons = paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Please log in to continue.');
            const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/secure-paypal-checkout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ package_id: packageId })
            });
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to create secure checkout');
            }
            const securePayment = await resp.json();
            securePaymentRef.current = securePayment;
            // Update header with authoritative amount in case preview differed
            setPaymentData({ package_name: securePayment.package_name, amount: securePayment.amount });
            return securePayment.order_id;
          },
          onApprove: async (data: any) => {
            try {
              const securePayment = securePaymentRef.current;
              if (!securePayment) throw new Error('Secure payment not initialized');
              console.log('Sending to capture:', { 
                order_id: data.orderID, 
                payment_id: securePayment.payment_id 
              });
              
              // Capture payment via secure endpoint
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error('Please log in to continue.');
              const captureResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/capture-paypal-payment`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  order_id: data.orderID, 
                  payment_id: securePayment.payment_id 
                })
              });

              if (!captureResponse.ok) {
                const errorData = await captureResponse.json();
                console.error('Capture failed:', errorData);
                throw new Error(errorData.error || 'Payment capture failed');
              }

              const captureResult = await captureResponse.json();
              console.log('Capture success:', captureResult);

              // Success - redirect to membership page with timestamp to force refresh
              router.replace(`/membership?tab=payments&t=${Date.now()}`);
            } catch (e: any) {
              setError(e.message || 'Payment processing failed');
            }
          },
          onCancel: () => {
            cancelledRef.current = true;
            (async () => {
              try {
                const { data: { session: s } } = await supabase.auth.getSession();
                const securePayment = securePaymentRef.current;
                if (s && securePayment?.payment_id) {
                  await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cancel-paypal-payment`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${s.access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ payment_id: securePayment.payment_id })
                  });
                }
              } catch {}
              router.replace('/membership?tab=payments');
            })();
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            (async () => {
              try {
                const { data: { session: s } } = await supabase.auth.getSession();
                const securePayment = securePaymentRef.current;
                if (s && securePayment?.payment_id) {
                  await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cancel-paypal-payment`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${s.access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ payment_id: securePayment.payment_id })
                  });
                }
              } catch {}
              setError('Payment failed. Please try again.');
              setTimeout(() => router.replace('/membership?tab=payments'), 1200);
            })();
          },
        });
        buttons.render(containerRef.current);

        setLoading(false);
      } catch (e: any) {
        setError(e?.message || 'Checkout failed to initialize');
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, packageId]);

  // If user navigates away/back, attempt to cancel pending payment immediately
  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (!paymentData?.payment_id) return;
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          if (cancelledRef.current) return; // already handled in onCancel
          await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cancel-paypal-payment`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payment_id: paymentData.payment_id })
          });
        } catch {}
      })();
    }
  }, [paymentData?.payment_id]);

  // Keep Epoint button the same height as PayPal button
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;
    const measure = () => {
      try {
        const rect = el.getBoundingClientRect();
        const h = Math.max(44, Math.round(rect.height));
        if (h && h !== paypalHeight) setPaypalHeight(h);
      } catch {}
    };
    measure();
    // Observe changes after PayPal renders/resizes
    const RO = (window as any).ResizeObserver;
    if (RO) {
      const ro = new RO(() => measure());
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      const id = window.setInterval(measure, 500);
      return () => window.clearInterval(id);
    }
  }, [containerRef.current]);

  const handleEpointPay = async () => {
    try {
      if (Platform.OS !== 'web') return;
      if (epointLoading) return;
      setEpointLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to continue.');
        setEpointLoading(false);
        return;
      }
      const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/secure-epoint-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ package_id: packageId })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start Epoint checkout');
      }
      const json = await resp.json();
      if (json?.redirect_url) {
        // @ts-ignore
        window.location.assign(json.redirect_url);
      } else {
        throw new Error('Epoint did not return redirect url');
      }
    } catch (e: any) {
      setError(e?.message || 'Epoint failed');
      setEpointLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: COLORS.white }}>
        <Header title="Checkout" fallbackRoute="/membership" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {paymentData && (
            <Text style={{ fontFamily: 'medium', fontSize: 14, color: COLORS.grayscale700, marginBottom: 16 }}>
              Package: {paymentData.package_name} • Amount: ${paymentData.amount.toFixed(2)}{epointRatio ? ` (AZN ${(paymentData.amount * epointRatio).toFixed(2)})` : ''}
            </Text>
          )}
          {Platform.OS === 'web' ? (
            <>
              {loading && (
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={{ marginTop: 8, color: COLORS.grayscale700 }}>Loading PayPal…</Text>
                </View>
              )}
              {error && (
                <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
              )}
              <div ref={containerRef} />
              {/* Epoint section */}
              <View style={{ marginTop: 20, alignItems: 'stretch' }}>
                <div style={{ width: '100%' }}>
                  <button onClick={handleEpointPay} disabled={epointLoading} style={{
                    width: '100%',
                    minHeight: paypalHeight,
                    backgroundColor: '#0A2540',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    cursor: epointLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: epointLoading ? 0.7 : 1
                  }}>
                    <svg width="20" height="16" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                      <rect x="1" y="1" width="22" height="16" rx="2" stroke="#ffffff" strokeWidth="2"/>
                      <rect x="3" y="5" width="18" height="2" fill="#ffffff"/>
                      <rect x="3" y="11" width="6" height="2" fill="#ffffff"/>
                    </svg>
                    <span>{epointLoading ? 'Processing…' : 'Pay with Debit/Credit card (Epoint)'}</span>
                  </button>
                </div>
              </View>
            </>
          ) : (
            <Text style={{ color: COLORS.grayscale700 }}>
              PayPal checkout is not implemented on native in this build.
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


