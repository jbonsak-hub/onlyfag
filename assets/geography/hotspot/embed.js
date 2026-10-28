/* Lazy-load the prototype while retaining the geography navigation and theme. */
(() => {
  const section = document.getElementById('indre-hotspot');
  const frame = document.getElementById('hotspot-model-frame');
  if (!section || !frame) return;
  const send = () => {
    if (frame.hasAttribute('src')) frame.contentWindow?.postMessage({
      type: 'hotspot-model-host',
      visible: section.classList.contains('active'),
      dark: document.body.classList.contains('dark-mode')
    }, location.origin);
  };
  function sync() {
    const open = section.classList.contains('active');
    document.body.classList.toggle('hotspot-model-open', open);
    if (open && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    if (open || location.hash === '#indre-hotspot') {
      const active = document.querySelector('.page-section.active');
      history.replaceState(null, '', location.pathname + location.search + (open ? '#indre-hotspot' : active ? '#' + active.id : ''));
    }
    send();
  }
  frame.addEventListener('load', send);
  new MutationObserver(sync).observe(section, {attributes: true, attributeFilter: ['class']});
  new MutationObserver(send).observe(document.body, {attributes: true, attributeFilter: ['class']});
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'hotspot-model-back') return;
    const item = [...document.querySelectorAll('.submenu-item')].find(el => el.getAttribute('onclick')?.includes("'indre-fagstoff'"));
    showContent('indre-fagstoff', item);
  });
  sync();
})();
