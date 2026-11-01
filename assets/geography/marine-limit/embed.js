/* Share the Geography sidebar and theme without sharing the map's CSS. */
(() => {
  const section=document.getElementById('ytre-marin-grense'),frame=document.getElementById('marine-limit-frame');
  if(!section||!frame)return;
  const menuButton=document.getElementById('sidebar-collapse-toggle'),sidebar=document.querySelector('.sidebar');
  const mobile=matchMedia('(max-width:1000px)');
  const backdrop=document.createElement('button');
  backdrop.type='button';backdrop.className='marine-limit-menu-backdrop';backdrop.hidden=true;backdrop.tabIndex=-1;
  backdrop.setAttribute('aria-label','Lukk geografimenyen');document.body.append(backdrop);
  let mobileMenuActive=false;
  const isMobileMap=()=>section.classList.contains('active')&&mobile.matches;
  function refreshMenu(){
    const active=isMobileMap();
    if(!active)document.body.classList.remove('marine-limit-menu-open');
    const open=active&&document.body.classList.contains('marine-limit-menu-open');
    backdrop.hidden=!open;frame.inert=open;
    if(menuButton){
      if(active){
        menuButton.textContent=open?'×':'☰';
        menuButton.title=open?'Lukk geografimenyen':'Åpne geografimenyen';
        menuButton.setAttribute('aria-label',menuButton.title);menuButton.setAttribute('aria-expanded',String(open));
      }else if(mobileMenuActive&&!document.querySelector('#indre-tsunami.active,#indre-geologiske-kart.active')){
        const collapsed=document.body.classList.contains('sidebar-collapsed');
        menuButton.textContent=collapsed?'☰':'‹';menuButton.title=collapsed?'Vis venstremeny':'Minimer venstremeny';
        menuButton.setAttribute('aria-label',menuButton.title);menuButton.removeAttribute('aria-expanded');
      }
    }
    sidebar?.querySelectorAll('.menu-header,.submenu-item').forEach(item=>{
      if(open){
        if(!item.hasAttribute('data-marine-tabindex'))item.dataset.marineTabindex=item.getAttribute('tabindex')??'';
        item.tabIndex=0;
      }else if(item.hasAttribute('data-marine-tabindex')){
        const previous=item.dataset.marineTabindex;
        if(previous)item.setAttribute('tabindex',previous);else item.removeAttribute('tabindex');
        delete item.dataset.marineTabindex;
      }
    });
    mobileMenuActive=active;
  }
  function closeMenu(restoreFocus=false){
    document.body.classList.remove('marine-limit-menu-open');refreshMenu();
    if(restoreFocus&&isMobileMap())menuButton?.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    if(!isMobileMap())return;
    if(menuButton?.contains(event.target)){
      event.preventDefault();event.stopImmediatePropagation();
      document.body.classList.toggle('marine-limit-menu-open');refreshMenu();
    }else if(event.target.closest('.submenu-item'))closeMenu();
  },true);
  backdrop.addEventListener('click',()=>closeMenu(true));
  document.addEventListener('keydown',event=>{
    if(!isMobileMap()||!document.body.classList.contains('marine-limit-menu-open'))return;
    if(event.key==='Escape'){event.preventDefault();closeMenu(true);return;}
    if(['Enter',' '].includes(event.key)&&event.target.matches('.menu-header,.submenu-item')){event.preventDefault();event.target.click();return;}
    if(event.key!=='Tab')return;
    const controls=[menuButton,...sidebar.querySelectorAll('button,a,[tabindex="0"]')].filter(item=>item&&!item.disabled&&item.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  mobile.addEventListener('change',refreshMenu);
  const send=()=>{
    if(frame.hasAttribute('src'))frame.contentWindow?.postMessage({type:'marine-limit-host',visible:section.classList.contains('active'),dark:document.body.classList.contains('dark-mode')},location.origin);
  };
  function sync(){
    const open=section.classList.contains('active');
    document.body.classList.toggle('marine-limit-open',open);refreshMenu();
    if(open&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;
    if(open||location.hash==='#ytre-marin-grense'){
      const active=document.querySelector('.page-section.active');
      history.replaceState(null,'',location.pathname+location.search+(open?'#ytre-marin-grense':active?'#'+active.id:''));
    }
    send();
  }
  frame.addEventListener('load',send);
  new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});
  new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class']});
  sync();
})();
