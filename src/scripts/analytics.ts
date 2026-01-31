declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
    if (import.meta.env.DEV) {
      console.debug('[Analytics]', name, params);
    }
  }
}

export function trackOutboundClick(url: string, text: string): void {
  trackEvent('outbound_click', {
    event_category: 'outbound',
    event_label: text,
    destination: url,
  });
}

export function trackFormSubmit(formName: string, subject: string): void {
  trackEvent('form_submit', {
    event_category: 'engagement',
    form_name: formName,
    subject: subject,
  });
}
