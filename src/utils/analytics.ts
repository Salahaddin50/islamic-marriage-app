// Minimal web-only analytics helper for Vercel Web Analytics
// No-ops on native platforms

export type AnalyticsEvent = {
  name: string;
  props?: Record<string, any>;
};

function isWeb(): boolean {
  // Avoid importing react-native Platform here; simple runtime check
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function trackPageView(path?: string): void {
  if (!isWeb()) return;
  try {
    // Vercel Web Analytics auto-tracks page views, but we can emit a custom event for clarity
    trackEvent({ name: 'page_view', props: { path: path || window.location.pathname } });
  } catch {}
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!isWeb()) return;
  try {
    // Vercel exposes a global queue when insights script is present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.va === 'function') {
      w.va(event.name, event.props || {});
    }
  } catch {}
}


