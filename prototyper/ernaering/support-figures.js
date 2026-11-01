import {digestiveSVG, organs} from './diagram.js?v=20261101-3';

// Reuse the anatomy model so location, proportions and colours stay familiar.
// These are support illustrations, separate from questions testing organ location.
export const supportFigures = {
  'digestion-surface':'support-villi',
  'digestion-stomach-contents':'support-organ-stomach',
  'digestion-peristalsis':'support-organ-esophagus',
  'digestion-pancreatic-juice':'support-organ-pancreas-duodenum',
  'digestion-lactose':'support-organ-small',
  'doc-liver-functions':'support-organ-liver',
  'doc-colon':'support-organ-large',
  'doc-duodenum-cooperation':'support-organ-duodenum-pancreas-liver',
  'doc-muscle-liver-glycogen':'support-organ-liver',
  'doc-portal-route':'support-villi',
  'ndla-digestion-lymph':'support-villi',
  'ndla-model-glands':'support-digestive-overview',
  'fat-bile-lipase':'applied-fat-processes',
  'fat-droplets-explain':'support-fat-droplets'
};
function anatomy(selected){
  const labels=selected.map(id=>organs.find(organ=>organ.id===id)?.label).filter(Boolean);
  const description=labels.length?'Fordøyelsessystemet. Markert: '+labels.join(', ')+'.':'Fordøyelsessystemet uten navn eller nummer på organene.';
  let svg=digestiveSVG()
    .replace('viewBox="0 0 640 690"','viewBox="145 15 355 655"')
    .replace('class="digestive-svg"','class="digestive-svg support-anatomy'+(selected.length?' has-highlight':'')+'"')
    .replace(/<title id="digestive-title">[\s\S]*?<\/title>/,'<title id="digestive-title">'+description+'</title>')
    .replace(/<desc id="digestive-desc">[\s\S]*?<\/desc>/,'<desc id="digestive-desc">Skjematisk frontvisning. Figuren viser plassering og sammenheng, ikke riktige størrelsesforhold.</desc>')
    .replace(/<g class="map-leaders"[\s\S]*?<\/g>/,'')
    .replace(/<g class="map-marker"[\s\S]*?<\/g>/g,'');
  for(const id of selected)svg=svg.replace('class="organ organ-'+id+'"','class="organ organ-'+id+' highlighted"');
  return `<figure class="mini-figure support-figure">${svg}<figcaption>${labels.length?labels.join(' · '):'Fordøyelsessystemet'}</figcaption></figure>`;
}
function villi(){
  // An enlarged section of the small-intestinal wall; no untaught microscopic labels.
  const bumps='M35 195 L35 148 C35 126 40 125 46 126 L46 77 C46 40 78 40 78 77 L78 126 C78 137 91 137 91 126 L91 62 C91 20 128 20 128 62 L128 126 C128 137 141 137 141 126 L141 77 C141 40 173 40 173 77 L173 126 C173 137 186 137 186 126 L186 62 C186 20 223 20 223 62 L223 126 C223 137 236 137 236 126 L236 77 C236 40 268 40 268 77 L268 126 C276 126 283 128 283 148 L283 195 Z';
  const circulation=[62,110,157,205,252].map((x,i)=>{
    const top=i%2?53:67;
    return `<path d="M${x-4} 181 V${top+21} Q${x-4} ${top+4} ${x+4} ${top+6} V181" fill="none" stroke="#cf7769" stroke-width="3"/><path d="M${x+4} 181 V${top+23}" fill="none" stroke="#659aab" stroke-width="2"/><path d="M${x} 194 V${top+17}" fill="none" stroke="#7a9c60" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  return `<figure class="mini-figure support-figure villi-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 255" role="img" aria-label="Forstørret, skjematisk utsnitt av tynntarmens vegg. Fem fingerformede tarmtotter stikker ut fra veggen. Røde og blå linjer viser blodårer, og grønne linjer viser lymfeårer inne i vevet."><g font-family="system-ui,sans-serif"><path d="${bumps}" fill="#f4dfcc" stroke="#bb9275" stroke-width="2.5"/>${circulation}<path d="M36 181H282" fill="none" stroke="#cf7769" stroke-width="4"/><path d="M36 187H282" fill="none" stroke="#659aab" stroke-width="3"/><path d="M38 217H55" stroke="#cf7769" stroke-width="3"/><text x="62" y="222" font-size="17" fill="#40584c">Blodårer</text><path d="M181 217H198" stroke="#7a9c60" stroke-width="3"/><text x="205" y="222" font-size="17" fill="#40584c">Lymfeårer</text><text x="160" y="246" text-anchor="middle" font-size="17" fill="#40584c">Tarmtotter · forstørret utsnitt</text></g></svg></figure>`;
}
function droplets(){
  const molecule=(x,y)=>`<path d="M${x} ${y-9}v18m0-16h13m-13 7h13m-13 7h13" fill="none" stroke="#477762" stroke-width="2.5" stroke-linecap="round"/>`;
  const points=[[50,75],[78,62],[107,75],[50,111],[78,119],[107,111]];
  const after=[[273,65],[319,65],[365,65],[273,116],[319,116],[365,116]];
  return `<figure class="mini-figure support-figure droplets-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 170" role="img" aria-label="Før: én stor fettdråpe med seks hele fettmolekyler. Etter: seks mindre dråper med ett helt fettmolekyl i hver. Ingen av fettmolekylene er delt opp."><text x="84" y="25" font-size="20" text-anchor="middle" fill="#40584c">Før</text><text x="319" y="25" font-size="20" text-anchor="middle" fill="#40584c">Etter</text><circle cx="84" cy="92" r="58" fill="#fbf0d9" stroke="#c6a56c" stroke-width="2"/>${points.map(([x,y])=>molecule(x,y)).join('')}<path d="M162 92h61m-9-7 9 7-9 7" fill="none" stroke="#40584c" stroke-width="2"/>${after.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="21" fill="#fbf0d9" stroke="#c6a56c" stroke-width="2"/>`+molecule(x-6,y)).join('')}</svg></figure>`;
}
export function supportFigure(key){
  if(key==='support-villi')return villi();
  if(key==='support-fat-droplets')return droplets();
  if(key==='support-digestive-overview')return anatomy([]);
  if(key?.startsWith('support-organ-'))return anatomy(key.slice(14).split('-'));
  return '';
}
