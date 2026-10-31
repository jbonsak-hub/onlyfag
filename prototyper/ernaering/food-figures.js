import {foodPhotos} from './food-photo-data.js?v=20261031-8';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const galleries={
  'food-protein-sources':['almonds','avocado','egg','salmon','cheese'],
  'food-carb-sources':['rice','banana','orange'],
  'food-fat-sources':['almonds','avocado','salmon','cheese']
};
function credit(photo){
  return `<a href="${esc(photo.source)}" target="_blank" rel="noopener noreferrer">${esc(photo.author||'Fotograf og kilde')}</a> · <a href="${esc(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(photo.license)}</a>${photo.changes?` <span>${esc(photo.changes)}</span>`:''}`;
}
function image(photo){
  return `<img src="${esc(photo.src)}" alt="${esc(photo.alt||photo.name)}" decoding="async" width="${Number(photo.width)||640}" height="${Number(photo.height)||430}">`;
}
export function foodFigure(key){
  if(galleries[key]){
    const photos=galleries[key].map(id=>foodPhotos[id]);
    if(photos.some(photo=>!photo))return '';
    return `<figure class="mini-figure food-gallery"><div class="food-grid">${photos.map((photo,i)=>`<figure class="food-card">${image(photo)}<figcaption class="food-label"><strong>${'ABCDE'[i]}</strong> · ${esc(photo.name)}</figcaption></figure>`).join('')}</div><figcaption><details class="photo-credits"><summary>Bildekilder</summary><ul>${photos.map(photo=>`<li>${esc(photo.name)}: ${credit(photo)}</li>`).join('')}</ul></details></figcaption></figure>`;
  }
  if(!key?.startsWith('food-'))return '';
  const photo=foodPhotos[key.slice(5)];
  if(!photo)return '';
  return `<figure class="mini-figure food-photo">${image(photo)}<figcaption><strong class="food-label">${esc(photo.name)}</strong><details class="photo-credits"><summary>Bildekilde</summary>${credit(photo)}</details></figcaption></figure>`;
}
