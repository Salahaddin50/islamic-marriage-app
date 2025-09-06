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
  const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

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

        // Create order on server to prevent client tampering
        const createRes = await fetch(`${apiBase || ''}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pkg: pkgId,
            previous_package: previousPackage || undefined,
          }),
        });
        if (!createRes.ok) {
          const t = await createRes.text();
          throw new Error(`Failed to create order: ${t}`);
        }
        const createJson = await createRes.json();
        orderIdRef.current = String(createJson.orderID);
        if (createJson.amount) setServerAmount(String(createJson.amount));

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
          createOrder: () => {
            if (!orderIdRef.current) throw new Error('Order ID not ready');
            return orderIdRef.current;
          },
          onApprove: async (_data: any, actions: any) => {
            try {
              // Capture on server for security
              const oid = orderIdRef.current;
              if (!oid) throw new Error('Missing order ID');
              const capRes = await fetch(`${apiBase || ''}/api/paypal/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: oid }),
              });
              if (!capRes.ok) {
                const tj = await capRes.json().catch(() => ({}));
                throw new Error(tj?.error || 'Capture failed');
              }
              const capJson = await capRes.json();
              if (!capJson || (capJson.status !== 'COMPLETED' && capJson.status !== 'CAPTURED')) {
                throw new Error('Payment not completed');
              }

              // Insert completed payment record after secure capture
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
                  transaction_id: String(capJson?.id || ''),
                  gateway_response: capJson,
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


