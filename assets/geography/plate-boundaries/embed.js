/* Keep the interactive model inside the geography page without sharing global styles. */
(() => {
  const section = document.getElementById('indre-plategrenser');
  const frame = document.getElementById('plate-model-frame');
  if (!section || !frame) return;
  const send = () => {
    if (!frame.hasAttribute('src')) return;
    frame.contentWindow?.postMessage({type:'plate-model-host',visible:section.classList.contains('active'),dark:document.body.classList.contains('dark-mode')}, location.origin);
  };
  function sync() {
    const open = section.classList.contains('active');
    document.body.classList.toggle('plate-model-open', open);
    if (open && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    const active = document.querySelector('.page-section.active');
    if (open || location.hash === '#indre-plategrenser') {
      const hash = open ? '#indre-plategrenser' : active ? '#' + active.id : '';
      history.replaceState(null, '', location.pathname + location.search + hash);
    }
    send();
  }
  frame.addEventListener('load', send);
  new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});
  new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'plate-model-back') return;
    const item = [...document.querySelectorAll('.submenu-item')].find(el => el.getAttribute('onclick')?.includes("'indre-fagstoff'"));
    showContent('indre-fagstoff', item);
  });
  sync();
})();
