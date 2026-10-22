/* Isolate the original-style tsunami layout from the geography page's styles. */
(() => {
  const section=document.getElementById('indre-tsunami'),frame=document.getElementById('tsunami-model-frame');
  if(!section||!frame)return;
  const send=()=>{
    if(frame.hasAttribute('src'))frame.contentWindow?.postMessage({type:'tsunami-model-host',visible:section.classList.contains('active')},location.origin);
  };
  function sync(){
    const open=section.classList.contains('active');
    document.body.classList.toggle('tsunami-model-open',open);
    if(open&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;
    if(open||location.hash==='#indre-tsunami'){
      const active=document.querySelector('.page-section.active');
      history.replaceState(null,'',location.pathname+location.search+(open?'#indre-tsunami':active?'#'+active.id:''));
    }
    send();
  }
  frame.addEventListener('load',send);
  new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='tsunami-model-back')return;
    const item=[...document.querySelectorAll('.submenu-item')].find(el=>el.getAttribute('onclick')?.includes("'indre-fagstoff'"));
    showContent('indre-fagstoff',item);
  });
  sync();
})();
