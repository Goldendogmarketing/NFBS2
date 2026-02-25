/**
 * Lightweight analytics tracking utility.
 *
 * Currently logs to console. Swap implementation to send events
 * to Google Analytics, Plausible, PostHog, etc.
 *
 * A copy of this logic is embedded in steel-buildings.html.
 * Keep both in sync when updating.
 */

function track(event, payload) {
  const data = {
    event,
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    ...payload,
  };

  // --- Swap this section for your analytics provider ---
  if (typeof console !== 'undefined') {
    console.log('[NFBS Track]', data);
  }

  // Example: Google Analytics
  // if (typeof gtag === 'function') {
  //   gtag('event', event, payload);
  // }

  // Example: send to custom endpoint
  // navigator.sendBeacon('/api/analytics', JSON.stringify(data));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { track };
}
