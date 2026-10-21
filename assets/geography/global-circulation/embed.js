/* Lazy load the model and keep host navigation/theme independent from its styles. */
(() => {
  const section=document.getElementById('klima-sirkulasjon'),frame=document.getElementById('global-circulation-frame');if(!section||!frame)return;
  function send(){if(!frame.hasAttribute('src'))return;frame.contentWindow?.postMessage({type:'circulation-host',visible:section.classList.contains('active'),dark:document.body.classList.contains('dark-mode')},location.origin);}
  function sync(){if(section.classList.contains('active')&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;send();}
  frame.addEventListener('load',send);new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='circulation-size'&&Number.isFinite(event.data.height)){frame.style.height=Math.max(600,Math.min(2500,event.data.height))+'px';}if(event.data?.type==='circulation-back'){const target=[...document.querySelectorAll('.submenu-item')].find(item=>item.getAttribute('onclick')?.includes("'klima-fagstoff'"));if(typeof showContent==='function')showContent('klima-fagstoff',target);}});sync();
})();
