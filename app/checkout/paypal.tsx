import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/src/config/supabase';
import { COLORS } from '@/constants';
import Header from '../../components/Header';

// Force fresh PayPal SDK loader for web
function loadPayPal(clientId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not web'));
    
    // Check if PayPal is already loaded and working
    // @ts-ignore
    if ((window as any).paypal && (window as any).paypal.Buttons) {
      // @ts-ignore
      return resolve((window as any).paypal);
    }
    
    // Aggressive cleanup of PayPal instances
    // @ts-ignore
    delete (window as any).paypal;
    // @ts-ignore
    delete (window as any).PAYPAL;
    
    // Remove ALL PayPal-related scripts and elements
    const existingScripts = document.querySelectorAll('script[src*="paypal"]');
    existingScripts.forEach(script => script.remove());
    
    // Clear any PayPal containers
    const paypalContainers = document.querySelectorAll('[id*="paypal"], [class*="paypal"]');
    paypalContainers.forEach(container => {
      if (container.id !== 'paypal-buttons-container') {
        container.remove();
      }
    });
    
    // Wait a moment for cleanup
    setTimeout(() => {
      const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons&disable-funding=credit,card,paylater,venmo&locale=en_US`;
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if ((window as any).paypal) resolve((window as any).paypal);
        else reject(new Error('PayPal SDK failed to load'));
      };
      script.onerror = () => reject(new Error('PayPal SDK script error'));
      document.head.appendChild(script);
    }, 100);
  });
}

export default function PaypalCheckout() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cancelledRef = useRef(false);

  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
  const packageId = String(params?.package_id || '');

  useEffect(() => {
    // Suppress PayPal SCF errors from old cached SDK
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('scf_') || message.includes('xo-card-fields')) {
        return; // Suppress SCF errors
      }
      originalError.apply(console, args);
    };

    (async () => {
      if (Platform.OS !== 'web') {
        setError('PayPal checkout is available on web only in this build.');
        setLoading(false);
        return;
      }
      if (!clientId) {
        setError('Missing PayPal client ID. Please add EXPO_PUBLIC_PAYPAL_CLIENT_ID to your .env file.');
        setLoading(false);
        return;
      }
      
      // Validate Client ID format
      if (!clientId.startsWith('A') || clientId.length < 50) {
        setError('Invalid PayPal Client ID format. Please check your EXPO_PUBLIC_PAYPAL_CLIENT_ID.');
        setLoading(false);
        return;
      }
      if (!packageId) {
        setError('Package ID is required.');
        setLoading(false);
        return;
      }

      try {
        // Create secure payment via Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please log in to continue.');
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/secure-paypal-checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ package_id: packageId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Edge Function Error:', errorData);
          console.error('Response Status:', response.status);
          console.error('Package ID:', packageId);
          throw new Error(errorData.error || 'Failed to create secure checkout');
        }

        const securePayment = await response.json();
        setPaymentData(securePayment);

        // Redirect-only checkout to avoid Fastlane/Card Fields in unsupported regions
        if (securePayment?.approval_url) {
          try {
            window.location.assign(securePayment.approval_url);
            setLoading(false);
            return;
          } catch {}
        }

        // Load PayPal SDK and render buttons (fallback if redirect not possible)
        const paypal = await loadPayPal(clientId);
        if (!containerRef.current) throw new Error('Container missing');

        // Create container for PayPal buttons only
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'paypal-buttons-container';

        const buttons = paypal.Buttons({
          style: { 
            layout: 'vertical', 
            color: 'gold', 
            shape: 'rect', 
            label: 'pay',
            tagline: false,
            height: 50
          },
          createOrder: () => {
            return securePayment.order_id;
          },
          onApprove: async (data: any) => {
            try {
              console.log('PayPal onApprove data:', data);
              console.log('Secure payment data:', securePayment);
              console.log('Sending to capture:', { 
                order_id: data.orderID, 
                payment_id: securePayment.payment_id 
              });
              
              // Capture payment via secure endpoint
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
        
        // Render PayPal buttons
        containerRef.current.appendChild(buttonsContainer);
        buttons.render(buttonsContainer);

        // Add informational message about PayPal-only payment
        const infoDiv = document.createElement('div');
        infoDiv.style.marginTop = '20px';
        infoDiv.style.padding = '15px';
        infoDiv.style.backgroundColor = '#fff3cd';
        infoDiv.style.border = '1px solid #ffeaa7';
        infoDiv.style.borderRadius = '8px';
        infoDiv.innerHTML = `
          <div style="margin: 0; color: #856404; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              💳 <strong>Payment Method:</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              ✅ <strong>PayPal Account</strong> - Secure payment processing
            </p>
            <p style="margin: 0; font-size: 12px; font-style: italic;">
              Note: Direct card payments are not available in your region. PayPal account required.
            </p>
          </div>
        `;
        containerRef.current.appendChild(infoDiv);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: COLORS.white }}>
        <Header title="Checkout" fallbackRoute="/membership" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {paymentData && (
            <Text style={{ fontFamily: 'medium', fontSize: 14, color: COLORS.grayscale700, marginBottom: 16 }}>
              Package: {paymentData.package_name} • Amount: ${paymentData.amount.toFixed(2)}
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


