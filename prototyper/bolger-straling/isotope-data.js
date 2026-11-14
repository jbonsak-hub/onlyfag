// Ground-state teaching subset, checked 2026-11-14. Stable entries are from the
// IAEA LiveChart snapshot embedded in ../../data/fysikk2/nuklidekart.html.
// Radioactive examples and preferred branches are checked against NNDC/ENSDF.
// Absence is deliberately UNKNOWN, never an inferred stability classification.
export const elements = [null,
  ['H','hydrogen'],['He','helium'],['Li','litium'],['Be','beryllium'],
  ['B','bor'],['C','karbon'],['N','nitrogen'],['O','oksygen'],['F','fluor'],
  ['Ne','neon'],['Na','natrium'],['Mg','magnesium'],['Al','aluminium'],
  ['Si','silisium'],['P','fosfor'],['S','svovel'],['Cl','klor'],['Ar','argon'],
  ['K','kalium'],['Ca','kalsium']
];

const stablePairs = [[1,0],[1,1],[2,1],[2,2],[3,3],[3,4],[4,5],[5,5],[5,6],
  [6,6],[6,7],[7,7],[7,8],[8,8],[8,9],[8,10],[9,10],[10,10],[10,11],[10,12],
  [11,12],[12,12],[12,13],[12,14],[13,14],[14,14],[14,15],[14,16],[15,16],
  [16,16],[16,17],[16,18],[16,20],[17,18],[17,20],[18,18],[18,20],[18,22],
  [19,20],[19,22],[20,20],[20,22],[20,23],[20,24]];

const entries = new Map(stablePairs.map(([z,n]) => [`${z},${n}`,{
  z,n,a:z+n,symbol:elements[z][0],name:elements[z][1],stable:true,
  source:'https://nds.iaea.org/relnsd/vcharthtml/VChartHTML.html'
}]));

const examples = [
  {z:1,n:2,halfLife:'12,32 år',mode:'beta-',daughter:[2,1],branch:'100 %',
    source:'https://www.nndc.bnl.gov/ensnds/3/H/adopted.pdf'},
  {z:4,n:3,halfLife:'53,22 døgn',mode:'ec',daughter:[3,4],branch:'100 % elektroninnfangning',
    source:'https://www.nndc.bnl.gov/ensnds/7/Be/adopted.pdf',
    note:'Kjernen fanger inn et elektron. Et proton blir et nøytron; Z minker med én og A er uendret.'},
  {z:6,n:8,halfLife:'ca. 5700 år',mode:'beta-',daughter:[7,7],branch:'100 %',
    source:'https://www.nndc.bnl.gov/ensnds/14/C/adopted.pdf',
    note:'NNDC oppgir 5700 ± 30 år. I regneeksemplene på siden bruker vi lærestoffets verdi 5730 år.'},
  {z:9,n:9,halfLife:'ca. 110 minutter',mode:'beta+',daughter:[8,10],branch:'β⁺ ca. 96,7 %; resten elektroninnfangning',
    source:'https://www.nndc.bnl.gov/nudat3/getdecaydataset.jsp?dsid=18f+bP+decay&nucleus=18O',
    note:'Et proton blir et nøytron. Et positron og et nøytrino sendes ut. Oksygen-18 er stabilt.'},
  {z:11,n:11,halfLife:'ca. 2,60 år',mode:'beta+',daughter:[10,12],branch:'β⁺ ca. 90 %; også elektroninnfangning',gammaAfter:true,
    source:'https://www.nndc.bnl.gov/nudat3/getdecaydataset.jsp?dsid=22na+ec+decay&nucleus=22NE',
    note:'Den dominerende grenen danner eksitert neon-22, som raskt sender ut gamma. Modellen viser sluttkjernen etter denne gammaovergangen.'},
  {z:15,n:17,halfLife:'ca. 14,27 døgn',mode:'beta-',daughter:[16,16],branch:'100 %',
    source:'https://www.nndc.bnl.gov/ensnds/32/P/adopted.pdf'},
  {z:19,n:21,halfLife:'ca. 1,25 milliarder år',mode:'beta-',daughter:[20,20],branch:'β⁻ ca. 89,3 %; andre grener til argon-40',
    source:'https://www.nndc.bnl.gov/ensnds/40/K/adopted.pdf',
    note:'Knappen viser den vanligste grenen: beta minus til kalsium-40. Kalium-40 kan også henfalle til argon-40, hovedsakelig ved elektroninnfangning.'}
];

for(const entry of examples) entries.set(`${entry.z},${entry.n}`,{
  ...entry,a:entry.z+entry.n,symbol:elements[entry.z][0],name:elements[entry.z][1],stable:false
});

export const isotopePresets = [[6,8],[6,6],[1,0],[1,1],[1,2],[8,8],[9,9],[11,11],[15,17],[19,21],[4,3]];

export function getIsotope(z,n){
  if(!Number.isInteger(z)||!Number.isInteger(n)||z<1||z>20||n<0||n>25)return null;
  return entries.get(`${z},${n}`)||null;
}

export function getPreferredDecay(z,n){
  const parent=getIsotope(z,n);
  if(!parent||parent.stable||!parent.daughter)return null;
  const daughter=getIsotope(...parent.daughter);
  if(!daughter)return null;
  return {parent,daughter,mode:parent.mode,gammaAfter:!!parent.gammaAfter};
}

export const verifiedIsotopes = Object.freeze([...entries.values()].map(x=>Object.freeze({...x})));
