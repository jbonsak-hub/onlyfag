/* One Cloudflare instance per top-level document, shared across Onlyfag. */
(function () {
  if (window.top !== window.self || window.__onlyfagRedirecting || window.__onlyfagAnalytics) return;
  window.__onlyfagAnalytics = true;
  if (document.querySelector('script[src*="static.cloudflareinsights.com/beacon.min.js"]') || window.__cfBeacon) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  // Internal panels have no distinct pathname. Do not count each hash/answer change
  // as another visit to the same page. Quiz HTML pages are measured separately.
  script.setAttribute('data-cf-beacon', JSON.stringify({token:'1b3cf01bc1c645a99f02736c18c9ab78', spa:false}));
  document.head.appendChild(script);
})();
