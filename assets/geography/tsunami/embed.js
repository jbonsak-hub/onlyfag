/* Isolate the tsunami layout while sharing the geography page's theme. */
(() => {
  const section=document.getElementById('indre-tsunami'),frame=document.getElementById('tsunami-model-frame');
  if(!section||!frame)return;
  const menuButton=document.getElementById('sidebar-collapse-toggle');
  const mobile=matchMedia('(max-width:1000px)');
  const backdrop=document.createElement('div');
  backdrop.className='tsunami-menu-backdrop';
  backdrop.hidden=true;backdrop.setAttribute('aria-hidden','true');
  document.body.append(backdrop);
  let mobileMenuActive=false;
  const isMobileModel=()=>section.classList.contains('active')&&mobile.matches;
  function refreshMenu(){
    const active=isMobileModel();
    if(!active)document.body.classList.remove('tsunami-menu-open');
    const open=active&&document.body.classList.contains('tsunami-menu-open');
    backdrop.hidden=!open;
    if(menuButton){
      if(active){
        menuButton.textContent=open?'×':'☰';
        menuButton.title=open?'Lukk geografimenyen':'Åpne geografimenyen';
        menuButton.setAttribute('aria-label',menuButton.title);
        menuButton.setAttribute('aria-expanded',String(open));
      }else if(mobileMenuActive){
        const collapsed=document.body.classList.contains('sidebar-collapsed');
        menuButton.textContent=collapsed?'☰':'‹';
        menuButton.title=collapsed?'Vis venstremeny':'Minimer venstremeny';
        menuButton.setAttribute('aria-label',menuButton.title);
        menuButton.removeAttribute('aria-expanded');
      }
    }
    mobileMenuActive=active;
  }
  function closeMenu(restoreFocus=false){
    document.body.classList.remove('tsunami-menu-open');refreshMenu();
    if(restoreFocus&&isMobileModel())menuButton?.focus({preventScroll:true});
  }
  // The existing collapse control opens a temporary overlay on mobile. Capture
  // its click before the desktop handler, leaving the saved sidebar preference
  // and its normal behaviour elsewhere on the geography page unchanged.
  document.addEventListener('click',event=>{
    if(!isMobileModel())return;
    if(menuButton?.contains(event.target)){
      event.preventDefault();event.stopImmediatePropagation();
      document.body.classList.toggle('tsunami-menu-open');refreshMenu();
    }else if(event.target.closest('.submenu-item'))closeMenu();
  },true);
  backdrop.addEventListener('click',()=>closeMenu(true));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.body.classList.contains('tsunami-menu-open'))closeMenu(true);
  });
  mobile.addEventListener('change',refreshMenu);
  const send=()=>{
    if(frame.hasAttribute('src'))frame.contentWindow?.postMessage({type:'tsunami-model-host',visible:section.classList.contains('active'),dark:document.body.classList.contains('dark-mode')},location.origin);
  };
  function sync(){
    const open=section.classList.contains('active');
    document.body.classList.toggle('tsunami-model-open',open);
    refreshMenu();
    if(open&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;
    if(open||location.hash==='#indre-tsunami'){
      const active=document.querySelector('.page-section.active');
      history.replaceState(null,'',location.pathname+location.search+(open?'#indre-tsunami':active?'#'+active.id:''));
    }
    send();
  }
  frame.addEventListener('load',send);
  new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});
  new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class']});
  sync();
})();
