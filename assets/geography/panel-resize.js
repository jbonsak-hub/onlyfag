/* Presentation preference only; no game state or analytics events. */
(() => {
  const key = 'onlyfag-geography-panel-width';
  window.OnlyfagPanelResize = ({document: doc = document, defaultWidth = 280, active = () => true} = {}) => {
    const win = doc.defaultView, body = doc.body;
    const existing = doc.querySelector('.quiz-panel-resizer');
    if (existing) return existing.resizeController;
    let preferred = defaultWidth, pending = 0;
    try { const saved = Number(win.localStorage.getItem(key)); if (saved >= 220 && saved <= 480) preferred = saved; } catch (_) {}
    const style = doc.createElement('style');
    style.textContent = `.quiz-panel-resizer{position:fixed;z-index:10030;top:0;bottom:0;left:calc(var(--q-panel) - 4px);width:9px;padding:0;border:0;background:transparent;cursor:col-resize;touch-action:none;user-select:none}.quiz-panel-resizer::after{content:'';position:absolute;left:3px;top:calc(50% - 22px);width:3px;height:44px;border-radius:3px;background:#789686;opacity:.55}.quiz-panel-resizer:hover::after,.quiz-panel-resizer:focus-visible::after{opacity:1;background:#245845}.quiz-panel-resizer:focus-visible{outline:2px solid #8aa77c;outline-offset:-2px}.quiz-panel-resizer[hidden]{display:none!important}body.quiz-panel-dragging,body.quiz-panel-dragging *{cursor:col-resize!important;user-select:none!important}@media(max-width:700px){.quiz-panel-resizer{display:none!important}}`;
    doc.head.append(style);
    const handle = doc.createElement('div');
    handle.className = 'quiz-panel-resizer'; handle.tabIndex = 0;
    handle.setAttribute('role','separator'); handle.setAttribute('aria-orientation','vertical');
    handle.setAttribute('aria-label','Bredde på spillpanelet');
    handle.title = 'Dra for å justere bredden · piltaster · dobbeltklikk for å tilbakestille';
    body.append(handle);
    const maximum = () => Math.min(480, Math.max(220, win.innerWidth - 420));
    function refresh() {
      const width = Math.round(Math.max(220, Math.min(maximum(), preferred)));
      handle.hidden = win.innerWidth <= 700 || !active();
      const value = width + 'px';
      if (body.style.getPropertyValue('--q-panel') !== value) {
        body.style.setProperty('--q-panel',value);
        win.cancelAnimationFrame(pending);
        pending = win.requestAnimationFrame(() => win.dispatchEvent(new win.Event('resize')));
      }
      const panel = doc.querySelector('.quiz-frame-nav')?.parentElement ||
        doc.querySelector('.game-panel,.worldle-side,.country-map-side,.country-map-bottom-bar,.quiz-status-panel,#jeopardy-shell.playing .jeopardy-side') ||
        doc.querySelector('.quiz-control-rail');
      if (panel && !handle.hidden) handle.style.left = (panel.getBoundingClientRect().right - 4) + 'px';
      handle.setAttribute('aria-valuemin','220'); handle.setAttribute('aria-valuemax',String(maximum()));
      handle.setAttribute('aria-valuenow',String(width));
    }
    function set(value) {
      preferred = Math.round(Math.max(220,Math.min(maximum(),value)));
      try {win.localStorage.setItem(key,String(preferred));} catch (_) {}
      refresh();
    }
    let drag = null;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      drag = {id:event.pointerId,x:event.clientX,width:Number(handle.getAttribute('aria-valuenow'))};
      handle.setPointerCapture(event.pointerId); body.classList.add('quiz-panel-dragging');
    });
    handle.addEventListener('pointermove', event => {
      if (drag && event.pointerId === drag.id) {event.stopPropagation();set(drag.width + event.clientX - drag.x);}
    });
    const end = event => {
      if (!drag || event.pointerId !== drag.id) return;
      event.stopPropagation(); drag = null; body.classList.remove('quiz-panel-dragging');
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    };
    handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    handle.addEventListener('lostpointercapture',()=>{drag=null;body.classList.remove('quiz-panel-dragging');});
    handle.addEventListener('click',event=>event.stopPropagation());
    handle.addEventListener('dblclick',event=>{event.stopPropagation();set(defaultWidth);});
    handle.addEventListener('keydown',event=>{
      if (!['ArrowLeft','ArrowRight','Home'].includes(event.key)) return;
      event.preventDefault();event.stopPropagation();
      set(event.key === 'Home' ? defaultWidth : Number(handle.getAttribute('aria-valuenow')) + (event.key === 'ArrowLeft' ? -16 : 16));
    });
    win.addEventListener('resize',refresh);
    handle.resizeController = {refresh}; refresh(); return handle.resizeController;
  };
  if (document.querySelector('.game-panel')) window.OnlyfagPanelResize({defaultWidth:260});
})();
