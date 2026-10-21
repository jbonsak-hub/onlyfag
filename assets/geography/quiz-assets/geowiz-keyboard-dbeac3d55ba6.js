
(function(){
  if(window.__geoGuessrSpaceShortcutInstalled)return;
  window.__geoGuessrSpaceShortcutInstalled=true;
  window.addEventListener('keydown',function(ev){
    if(ev.code!=='Space'&&ev.key!==' ')return;
    const target=ev.target;
    if(target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)))return;
    const mode=document.getElementById('quiz-geoguessr');
    if(!mode||!mode.classList.contains('active'))return;
    const btn=document.querySelector('#geo-feedback .geo-next-button');
    if(!btn||btn.offsetParent===null)return;
    ev.preventDefault();
    btn.click();
  });
})();
