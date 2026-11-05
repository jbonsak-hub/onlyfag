import {foodIllustrations,foodArtwork,foodConceptArtwork,foodOatsArtwork} from './food-illustrations.js?v=20261101-3';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const galleries={
  'food-protein-sources':['almonds','avocado','egg','salmon','cheese'],
  'food-carb-sources':['rice','banana','orange'],
  'food-fat-sources':['almonds','avocado','salmon','cheese']
};
export function foodArtworkSVG(id){
  const food=foodIllustrations[id];if(!food)return '';
  const sheet=food.sheet==='concepts'?foodConceptArtwork:food.sheet==='oats'?foodOatsArtwork:foodArtwork,w=sheet.width/sheet.columns,h=sheet.height/sheet.rows;
  return `<svg class="food-art" data-food="${esc(id)}" xmlns="http://www.w3.org/2000/svg" viewBox="${food.column*w} ${food.row*h} ${w} ${h}" role="img" aria-label="${esc(food.alt)}"><image href="${esc(sheet.src)}" x="0" y="0" width="${sheet.width}" height="${sheet.height}"/></svg>`;
}
export function foodFigure(key){
  if(galleries[key])return `<figure class="mini-figure food-gallery"><div class="food-grid">${galleries[key].map((id,i)=>`<figure class="food-card">${foodArtworkSVG(id)}<figcaption class="food-label"><strong>${'ABCDE'[i]}</strong> · ${esc(foodIllustrations[id].name)}</figcaption></figure>`).join('')}</div></figure>`;
  if(!key?.startsWith('food-'))return '';
  const id=key.slice(5),food=foodIllustrations[id];if(!food)return '';
  return `<figure class="mini-figure food-illustration">${foodArtworkSVG(id)}<figcaption class="food-label">${esc(food.name)}</figcaption></figure>`;
}
