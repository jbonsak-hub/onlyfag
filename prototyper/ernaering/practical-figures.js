// Original meal illustrations; numerical values are explicitly example data.
export function practicalFigure(key){
 if(key!=='practical-meals')return '';
 const width=1984,height=793,cell=width/2;
 return `<figure class="mini-figure meal-comparison"><div class="meal-grid">${[0,1].map(i=>`<figure class="meal-set"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${i*cell} 0 ${cell} ${height}" role="img" aria-label="${i===0?'A: burger og en porsjon pommes frites.':'B: kylling, ris og grønnsaker, med frukt ved siden av.'}"><defs><clipPath id="meal-crop-${i}"><rect x="${i*cell}" y="0" width="${cell}" height="${height}"/></clipPath></defs><image clip-path="url(#meal-crop-${i})" href="../assets/nutrition/food/illustrated-meals.png" x="0" y="0" width="${width}" height="${height}"/></svg><figcaption><strong>${'AB'[i]}</strong> · ${i===0?'300':'600'} g · 600 kcal</figcaption></figure>`).join('')}</div><figcaption>Tallene er oppgitte eksempeldata.</figcaption></figure>`;
}
