/* Lazy load the model and keep host navigation/theme independent from its styles. */
(() => {
  const section=document.getElementById('klima-sirkulasjon'),frame=document.getElementById('global-circulation-frame');if(!section||!frame)return;
  let contentHeight=850,previousMobile=null;
  function size(){const width=frame.getBoundingClientRect().width;const height=width>730?Math.max(320,innerHeight-Math.max(0,frame.getBoundingClientRect().top)-8):contentHeight;frame.style.height=Math.ceil(height)+'px';}
  function send(){if(!frame.hasAttribute('src'))return;size();frame.contentWindow?.postMessage({type:'circulation-host',visible:section.classList.contains('active'),dark:document.body.classList.contains('dark-mode')},location.origin);}
  function sync(){const active=section.classList.contains('active');if(active&&innerWidth<=1100&&previousMobile===null){previousMobile=document.body.classList.contains('sidebar-collapsed');document.body.classList.add('sidebar-collapsed');}if((!active||innerWidth>1100)&&previousMobile!==null){document.body.classList.toggle('sidebar-collapsed',previousMobile);previousMobile=null;}if(active&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;send();}
  frame.addEventListener('load',send);new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',sync);
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='circulation-size'&&Number.isFinite(event.data.height)){contentHeight=Math.max(320,Math.min(2500,event.data.height));size();}if(event.data?.type==='circulation-back'){const target=[...document.querySelectorAll('.submenu-item')].find(item=>item.getAttribute('onclick')?.includes("'klima-fagstoff'"));if(typeof showContent==='function')showContent('klima-fagstoff',target);}});sync();
})();
