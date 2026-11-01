// Original generated artwork. One shared sheet keeps style and loading consistent.
export const foodArtwork={src:'../assets/nutrition/food/illustrated-foods.png',width:1983,height:793,columns:5,rows:2};
export const foodConceptArtwork={src:'../assets/nutrition/food/illustrated-food-concepts.png',width:2172,height:724,columns:3,rows:1};
export const foodOatsArtwork={src:'../assets/nutrition/food/illustrated-oats.png',width:1254,height:1254,columns:1,rows:1};
export const foodIllustrations=Object.fromEntries([
  ['egg','Egg, stekt','Et stekt egg med eggehvite og plomme.'],
  ['salmon','Laks, rå','En rå laksefilet med lyse striper.'],
  ['cheese','Goudaost','To skiver gul goudaost.'],
  ['rice','Ris, kokt','En skål med vanlig kokt ris uten tilbehør.'],
  ['almonds','Mandler','Tre brune mandler med tydelig rillet overflate.'],
  ['avocado','Avokado','En avokado delt i to med grønt fruktkjøtt og brun stein.'],
  ['pepper','Rød paprika','En rød paprika, hel og delt, med synlige frø.'],
  ['banana','Banan','En gul banan med deler av skallet trukket ned.'],
  ['orange','Appelsin','En hel og en delt appelsin med synlige båter.'],
  ['kiwi','Kiwi','En delt kiwi med grønt fruktkjøtt og små svarte frø.']
].map(([id,name,alt],index)=>[id,{name,alt,column:index%5,row:Math.floor(index/5)}]));
Object.assign(foodIllustrations,{
  oats:{name:'Havregryn',alt:'En skål med tørre havregryn og noen flate havreflak ved siden av.',sheet:'oats',column:0,row:0},
  tree:{name:'Tre',alt:'Et grønt tre med brun stamme og synlige greiner.',sheet:'concepts',column:0,row:0},
  potato:{name:'Potet, rå',alt:'Rå poteter med brunt skall og en delt potet med lyst fruktkjøtt.',sheet:'concepts',column:1,row:0},
  sugar:{name:'Hvitt sukker',alt:'En liten haug hvitt sukker og to hvite sukkerbiter.',sheet:'concepts',column:2,row:0}
});
