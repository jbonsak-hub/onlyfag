/* The reference list is presentation only; game pools and identifiers are separate. */
(() => {
 const search=document.getElementById('catalog-search'),count=document.getElementById('catalog-count'),empty=document.getElementById('catalog-empty');
 const sections=[...document.querySelectorAll('[data-catalog-topic]')].map(section=>({section,rows:[...section.querySelectorAll('tbody tr')]}));
 const labels={no:{title:'Kjente steder',intro:'Oppslagsliste med korte forklaringer.',search:'Finn et sted',placeholder:'Søk i navn og forklaringer',empty:'Ingen steder passer søket.',count:(shown,total)=>`${shown} av ${total} steder`,theme:'Bytt mellom lys og mørk modus'},en:{title:'Famous places',intro:'A reference list with short descriptions.',search:'Find a place',placeholder:'Search names and descriptions',empty:'No places match your search.',count:(shown,total)=>`${shown} of ${total} places`,theme:'Switch between light and dark mode'}};
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 function filter(){
  const term=normalize(search.value).trim();let shown=0,total=0;
  for(const {section,rows}of sections){let visible=0;for(const row of rows){total++;row.hidden=!!term&&!normalize(row.textContent).includes(term);if(!row.hidden){shown++;visible++;}}section.hidden=!visible;}
  const language=window.QuizLanguage?.language==='en'?'en':'no';count.textContent=labels[language].count(shown,total);empty.hidden=shown>0;
 }
 function applyLanguage(){
  const language=window.QuizLanguage?.language==='en'?'en':'no',copy=labels[language];
  document.querySelectorAll('[data-catalog-label]').forEach(element=>element.textContent=copy[element.dataset.catalogLabel]);
  search.placeholder=copy.placeholder;document.title=copy.title+' – MapWiz – Onlyfag';
  document.querySelector('.quiz-page-theme').setAttribute('aria-label',copy.theme);filter();
 }
 const theme=document.querySelector('.quiz-page-theme');
 document.body.classList.toggle('dark-mode',document.documentElement.dataset.theme==='dark');
 theme.onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';document.body.classList.toggle('dark-mode',dark);try{localStorage.setItem('geoDarkMode',dark?'1':'0');}catch(_){}};
 search.addEventListener('input',filter);
 addEventListener('quiz-language-change',()=>queueMicrotask(applyLanguage));
 applyLanguage();
})();
