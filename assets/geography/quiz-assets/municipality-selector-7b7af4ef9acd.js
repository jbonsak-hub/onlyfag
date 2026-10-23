/* County overview for the municipality quiz. Game rules live in statle.js. */
(() => {
  'use strict';
  const section=document.getElementById('municipality-selection');
  const map=document.getElementById('municipality-map');
  const list=document.getElementById('municipality-list');
  const message=document.getElementById('municipality-loading');
  const game=document.getElementById('kart-game');
  if(!section||!map||!list||!game)return;
  const ns='http://www.w3.org/2000/svg';
  const paths=new Map(),buttons=new Map();
  let selected=null,hovered=null;
  function highlight(code){
    for(const [key,path] of paths)path.classList.toggle('is-highlighted',key===code);
    for(const [key,button] of buttons)button.classList.toggle('is-highlighted',key===code);
  }
  function showGame(code){
    selected=String(code);section.hidden=true;game.hidden=false;
    document.body.dataset.municipalityView='game';
    window.dispatchEvent(new Event('resize'));
  }
  function showOverview(){
    game.hidden=true;section.hidden=false;
    document.body.dataset.municipalityView='overview';
    highlight(null);
    (buttons.get(selected)||section.querySelector('h1')).focus({preventScroll:true});
    window.dispatchEvent(new Event('resize'));
  }
  function choose(code){
    window.dispatchEvent(new CustomEvent('municipality-select',{detail:{code}}));
  }
  function bindHighlight(element,code){
    element.addEventListener('pointerenter',()=>{hovered=code;highlight(code);});
    element.addEventListener('pointerleave',()=>{hovered=null;highlight(document.activeElement?.dataset.county||null);});
    element.addEventListener('focus',()=>highlight(code));
    element.addEventListener('blur',()=>highlight(hovered));
    element.addEventListener('click',()=>choose(code));
  }
  window.addEventListener('municipality-select',event=>showGame(event.detail.code));
  window.addEventListener('municipality-game-ready',event=>showGame(event.detail.code));
  window.addEventListener('municipality-back',showOverview);
  window.MunicipalitySelector={showGame,showOverview};
  async function load(){
    try{
      const response=await fetch('../assets/geography/municipalities/index-v3.json?v=e9a18ad9083d');
      if(!response.ok)throw Error('Missing municipality index');
      const index=await response.json();
      if(!Array.isArray(index.counties)||index.counties.length!==15)throw Error('Incomplete county index');
      const counties=index.counties.slice().sort((a,b)=>a.name.localeCompare(b.name,'nb'));
      if(!index.viewBox||index.counties.some(county=>!county.overview?.d)){
        const fallback=await fetch('../assets/geography/norway-counties.json');
        if(!fallback.ok)throw Error('Missing county overview');
        const geometry=await fallback.json();
        for(const county of counties){const shape=geometry.find(row=>row.a===county.code);if(!county.overview&&shape)county.overview={d:shape.d,c:shape.c};}
        // Existing county paths have one shared SVG coordinate system.
        if(!index.viewBox){
          const source=await fetch('../assets/geography/sources/norway-counties-2024.svg');
          const svg=await source.text(),view=svg.match(/\bviewBox="([^"]+)"/);
          if(!source.ok||!view)throw Error('Missing county view box');
          index.viewBox=view[1].split(/\s+/).map(Number);
        }
      }
      if(index.viewBox.length!==4||!index.viewBox.every(Number.isFinite)||index.viewBox[2]<=0||index.viewBox[3]<=0)throw Error('Invalid county view box');
      map.setAttribute('viewBox',index.viewBox.join(' '));
      const shapes=document.createElementNS(ns,'g');shapes.setAttribute('fill-rule','evenodd');
      list.replaceChildren();paths.clear();buttons.clear();
      for(const county of counties){
        const code=String(county.code),displayName=county.quizTitle||county.name,displayCount=county.quizCount??county.count;
        const label=`${displayName} (${displayCount})`;
        if(!county.overview?.d||!Number.isInteger(county.count)||county.count<1)throw Error('Missing county geometry or count');
        const path=document.createElementNS(ns,'path');
        path.setAttribute('d',county.overview.d);path.setAttribute('class','municipality-county');
        path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label);
        path.dataset.county=code;
        const title=document.createElementNS(ns,'title');title.textContent=label;path.append(title);
        path.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(code);}});
        bindHighlight(path,code);paths.set(code,path);shapes.append(path);
        const item=document.createElement('li'),button=document.createElement('button');
        button.type='button';button.className='municipality-county-option';button.dataset.county=code;
        const name=document.createElement('span');name.textContent=displayName;
        const count=document.createElement('span');count.className='municipality-count';count.textContent=`(${displayCount})`;
        button.append(name,count);button.setAttribute('aria-label',label);bindHighlight(button,code);
        buttons.set(code,button);item.append(button);list.append(item);
      }
      map.replaceChildren(shapes);message.hidden=true;
      section.classList.add('is-loaded');
      window.dispatchEvent(new CustomEvent('municipality-index-ready',{detail:index}));
    }catch(error){
      message.textContent='Kartet kunne ikke lastes.';
      const retry=document.createElement('button');retry.type='button';retry.className='municipality-retry';retry.textContent='Prøv igjen';
      retry.addEventListener('click',()=>{message.textContent='Laster kart …';load();});message.append(retry);
    }
  }
  load();
})();
