import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
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
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&locale=en_SA`;
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
  const orderIdRef = useRef<string | null>(null);
  const [serverAmount, setServerAmount] = useState<string | null>(null);

  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';

  const amount = useMemo(() => {
    if (serverAmount) return serverAmount;
    const a = Number(params?.amount || 0);
    return Number.isFinite(a) && a > 0 ? a.toFixed(2) : '0.00';
  }, [params?.amount, serverAmount]);

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

        // Create order on server for security
        const { data: session } = await supabase.auth.getSession();
        const accessToken = session?.session?.access_token || '';
        if (!accessToken) throw new Error('Missing auth');
        const createRes = await fetch(`/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ pkg: pkgId }),
        });
        if (!createRes.ok) throw new Error(await createRes.text());
        const createJson = await createRes.json();
        orderIdRef.current = String(createJson.orderID);
        if (createJson.amount) setServerAmount(String(createJson.amount));

        paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: () => {
            if (!orderIdRef.current) throw new Error('Order ID not ready');
            return orderIdRef.current;
          },
          onApprove: async (data: any) => {
            try {
              const { orderID } = data || {};
              const capRes = await fetch(`/api/paypal/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ orderID, pkg: pkgId }),
              });
              if (!capRes.ok) throw new Error(await capRes.text());
            } catch {
              // ignore; UI will navigate back to payments
            } finally {
              router.replace('/membership?tab=payments');
            }
          },
          onCancel: async () => {
            router.replace('/membership?tab=payments');
          },
          onError: async () => {
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
        <Header title="Checkout" fallbackRoute="/membership" />
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


