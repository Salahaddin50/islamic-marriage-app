import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/src/config/supabase';
import { COLORS } from '@/constants';

// Minimal PayPal JS SDK loader for web
function loadPayPal(clientId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not web'));
    // @ts-ignore
    if (window.paypal) return resolve((window as any).paypal);
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';

  const amount = useMemo(() => {
    const a = Number(params?.amount || 0);
    return Number.isFinite(a) && a > 0 ? a.toFixed(2) : '0.00';
  }, [params?.amount]);

  const pkgId = String(params?.pkg || '');
  const pkgName = String(params?.name || '');
  const baselinePrice = Number(params?.baseline_price || 0) || 0;
  const previousPackage = String(params?.previous_package || '') || null;

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
      try {
        const paypal = await loadPayPal(clientId);
        if (!containerRef.current) throw new Error('Container missing');
        const details = {
          type: baselinePrice > 0 && Number(amount) > baselinePrice ? 'upgrade' : 'purchase',
          previous_package: previousPackage,
          target_package: pkgId,
          baseline_price: baselinePrice,
          target_price: Number(params?.amount || 0),
          difference_paid: Number(params?.amount || 0),
          timestamp: new Date().toISOString(),
        };

        paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{ amount: { currency_code: 'USD', value: amount } }],
              application_context: { shipping_preference: 'NO_SHIPPING' },
            });
          },
          onApprove: async (_data: any, actions: any) => {
            try {
              const capture = await actions.order.capture();
              // Insert completed payment record only after approval
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not authenticated');
              await supabase
                .from('payment_records')
                .insert({
                  user_id: user.id,
                  package_name: pkgName,
                  package_type: pkgId,
                  amount: Number(amount),
                  status: 'completed',
                  payment_method: 'paypal',
                  transaction_id: String(capture?.id || ''),
                  gateway_response: capture,
                  payment_details: details,
                });
              // Optionally activate package via RPC (kept simple; UI depends on records)
            } catch (e) {
              // No DB changes on failure; user will see nothing pending
            } finally {
              router.replace('/membership?tab=payments');
            }
          },
          onCancel: async () => {
            // Do nothing in DB; user cancelled before submitting
            router.replace('/membership?tab=payments');
          },
          onError: async (err: any) => {
            // Do nothing in DB on error; avoid leaving a pending record
            router.replace('/membership?tab=payments');
          },
        }).render(containerRef.current);

        setLoading(false);
      } catch (e: any) {
        setError(e?.message || 'Checkout failed to initialize');
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, amount, pkgId, pkgName]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: COLORS.white }}>
        <Text style={{ fontFamily: 'bold', fontSize: 18, color: COLORS.greyscale900, marginBottom: 8 }}>Checkout</Text>
        <Text style={{ fontFamily: 'medium', fontSize: 14, color: COLORS.grayscale700, marginBottom: 16 }}>
          Package: {pkgName} • Amount: ${amount}
        </Text>
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
          </>
        ) : (
          <Text style={{ color: COLORS.grayscale700 }}>
            PayPal checkout is not implemented on native in this build.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}


