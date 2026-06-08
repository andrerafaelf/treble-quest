<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';

  const measurementId = env.PUBLIC_GA_MEASUREMENT_ID;
  const consentKey = 'trebleQuestAnalyticsConsent';
  const consentGrantedEvent = 'treblequest:analytics-consent-granted';

  type AnalyticsWindow = Window &
    typeof globalThis & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };

  let loaded = false;
  let lastPagePath = '';

  function analyticsWindow() {
    return window as AnalyticsWindow;
  }

  function hasAnalyticsConsent() {
    return browser && window.localStorage.getItem(consentKey) === 'granted';
  }

  function trackPageView() {
    if (!browser || !loaded || !measurementId) return;

    const pagePath = `${window.location.pathname}${window.location.search}`;
    if (pagePath === lastPagePath) return;

    lastPagePath = pagePath;
    analyticsWindow().gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title
    });
  }

  function loadAnalytics() {
    if (!browser || !measurementId || loaded || !hasAnalyticsConsent()) return;

    const w = analyticsWindow();
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = (...args: unknown[]) => {
      w.dataLayer?.push(args);
    };

    w.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    w.gtag('js', new Date());
    w.gtag('config', measurementId, { send_page_view: false });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    loaded = true;
    trackPageView();
  }

  onMount(() => {
    loadAnalytics();
    window.addEventListener(consentGrantedEvent, loadAnalytics);

    return () => {
      window.removeEventListener(consentGrantedEvent, loadAnalytics);
    };
  });

  afterNavigate(() => {
    trackPageView();
  });
</script>
