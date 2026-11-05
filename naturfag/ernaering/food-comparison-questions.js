// Comparison values checked against Matvaretabellen, 1 November 2026.
// Named records: mandler, avokado-ra, laks-oppdrett-ra, goudaost,
// paprika-rod-ra, kiwi-ra, appelsin-ra, banan-ra, egg-stekt-i-fett,
// ris-basmati-kokt, potet-lagringspotet-ra and sukker-hvitt.
export const foodComparisonQuestions=[
  {
    id:'food-compare-unsaturated',topic:'fat',type:'choice',level:2,family:'food-comparison',
    title:'Sammenlign umettet fett',
    prompt:'Hvilken matvare inneholder mest umettet fett per 100 g spiselig del?',
    options:['Mandler','Avokado','Laks, rå','Goudaost'],
    optionFoods:{'Mandler':'almonds','Avokado':'avocado','Laks, rå':'salmon','Goudaost':'cheese'},
    answer:'Mandler',
    hint:'Sammenlign samme masse, ikke porsjonene som er tegnet. Tenk på både fettmengde og fettype.',
    explanation:'Mandler har mest av disse: 31,4 g enumettede og 11,4 g flerumettede fettsyrer per 100 g, til sammen 42,8 g. Avokado, laks og goudaost har mindre umettet fett per 100 g. En matvare kan inneholde både mettet og umettet fett.'
  },
  {
    id:'food-compare-vitamin-c',topic:'micro',type:'choice',level:2,family:'food-comparison',
    title:'Sammenlign vitamin C',
    prompt:'Hvilken matvare inneholder mest vitamin C per 100 g spiselig del?',
    options:['Rød paprika','Kiwi','Appelsin','Banan'],
    optionFoods:{'Rød paprika':'pepper','Kiwi':'kiwi','Appelsin':'orange','Banan':'banana'},
    answer:'Rød paprika',
    hint:'En kjent kilde til et vitamin trenger ikke være matvaren med aller mest.',
    explanation:'Rå rød paprika har 126 mg vitamin C per 100 g. Kiwi har 91 mg, appelsin 54 mg og banan 11 mg i Matvaretabellen. Appelsin inneholder vitamin C, men rå rød paprika har mer når vi sammenligner samme masse.'
  },
  {
    id:'food-compare-protein',topic:'protein',type:'choice',level:2,family:'food-comparison',
    title:'Sammenlign protein',
    prompt:'Hvilken matvare inneholder mest protein per 100 g spiselig del?',
    options:['Goudaost','Mandler','Laks, rå','Egg, stekt'],
    optionFoods:{'Goudaost':'cheese','Mandler':'almonds','Laks, rå':'salmon','Egg, stekt':'egg'},
    answer:'Goudaost',
    hint:'Alle fire inneholder protein. Spørsmålet er hvor mye det er i samme masse av hver matvare.',
    explanation:'Goudaost har 25,3 g protein per 100 g, mandler 21,2 g, rå oppdrettslaks 19,9 g og egg stekt i fett 13,9 g i Matvaretabellen. Ost er altså ikke bare fett, og mandler er heller ikke bare en fettkilde.'
  },
  {
    id:'food-compare-starch',topic:'carbs',type:'choice',level:2,family:'food-comparison',
    title:'Sammenlign stivelse',
    prompt:'Hvilket alternativ inneholder mest stivelse per 100 g spiselig del?',
    options:['Ris, kokt','Potet, rå','Banan, moden','Goudaost'],
    optionFoods:{'Ris, kokt':'rice','Potet, rå':'potato','Banan, moden':'banana','Goudaost':'cheese'},
    answer:'Ris, kokt',
    hint:'Skill mellom stivelse og sukkerarter. Legg merke til om matvaren er rå eller kokt.',
    explanation:'Kokt basmatiris har 24,9 g stivelse per 100 g, mot 15,4 g i rå lagringspotet og 4,3 g i vanlig rå banan i Matvaretabellen. Goudaost har ikke stivelse. Når bananen modner, omdannes mye av stivelsen til sukkerarter. Her sammenlignes kokt ris med rå potet og en vanlig moden banan.'
  },
  {
    id:'food-compare-polysaccharides',topic:'carbs',type:'choice',level:2,family:'food-comparison',
    title:'Polysakkarider rundt oss',
    prompt:'Hvilket alternativ inneholder ikke polysakkarider?',
    options:['Tre','Potet, rå','Hvitt sukker','Havregryn'],
    optionFoods:{'Tre':'tree','Potet, rå':'potato','Hvitt sukker':'sugar','Havregryn':'oats'},
    answer:'Hvitt sukker',
    hint:'Tenk både på cellulose og stivelse. Alle karbohydrater er ikke lange kjeder.',
    explanation:'Vanlig hvitt sukker er sukrose, et disakkarid. Treet inneholder cellulose, potet inneholder stivelse, og havregryn inneholder både stivelse og kostfiber. Cellulose og stivelse er polysakkarider. Frukt og bær kan også inneholde polysakkarider i form av kostfiber, selv om de inneholder sukkerarter.'
  }
];
