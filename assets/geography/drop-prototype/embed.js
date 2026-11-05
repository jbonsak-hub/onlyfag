/* Lazy-load the watershed module while retaining the geography navigation and theme. */
(() => {
  const section = document.getElementById('ytre-vassdrag');
  const frame = document.getElementById('watershed-model-frame');
  if (!section || !frame) return;
  const send = () => {
    if (frame.hasAttribute('src')) frame.contentWindow?.postMessage({
      type: 'watershed-model-host',
      visible: section.classList.contains('active'),
      dark: document.body.classList.contains('dark-mode')
    }, location.origin);
  };
  function sync() {
    const open = section.classList.contains('active');
    document.body.classList.toggle('watershed-model-open', open);
    if (open && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    if (open || location.hash === '#ytre-vassdrag') {
      const active = document.querySelector('.page-section.active');
      history.replaceState(null, '', location.pathname + location.search + (open ? '#ytre-vassdrag' : active ? '#' + active.id : ''));
    }
    send();
  }
  frame.addEventListener('load', send);
  new MutationObserver(sync).observe(section, {attributes: true, attributeFilter: ['class']});
  new MutationObserver(send).observe(document.body, {attributes: true, attributeFilter: ['class']});
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'watershed-model-back') return;
    const item = [...document.querySelectorAll('.submenu-item')].find(el => el.getAttribute('onclick')?.includes("'ytre-fagstoff'"));
    showContent('ytre-fagstoff', item);
  });
  function openHash(){if(location.hash!=='#ytre-vassdrag')return;const item=[...document.querySelectorAll('.submenu-item')].find(el=>el.getAttribute('onclick')?.includes("'ytre-vassdrag'"));const menu=item?.parentElement;if(menu&&!menu.classList.contains('open'))toggleMenu(menu.previousElementSibling);showContent('ytre-vassdrag',item);}
  addEventListener('hashchange',openHash);
  openHash();sync();
})();
