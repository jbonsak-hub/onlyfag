// Utvalgt etter sammenligning av hele banken med oppgavesettene fra kapittel 4 og 5.
export const selectedQuestions = [
  {
    id:'selected-fat-percentage',topic:'fat',type:'fill',level:2,
    title:'Fettprosent etter masse',
    prompt:'En prøve på 5,1 g potetgull inneholder 1,6 g fett. Hvor stor prosent av massen er fett? Avrund til nærmeste hele prosent.',
    blanks:[{label:'Fettprosent',answers:['31'],unit:'%'}],
    hint:'Prosent betyr per hundre. Sammenlign massen av fett med hele prøvens masse.',
    explanation:'1,6 / 5,1 × 100 ≈ 31 %. Dette er prosent av massen, ikke prosent av energien.'
  },
  {
    id:'selected-amino-sequences',topic:'protein',type:'fill',level:3,
    title:'Hvor mange rekkefølger?',figure:'selected-amino-sequences',
    prompt:'En kort kjede skal inneholde A, B og C nøyaktig én gang hver. Kjedens start er markert, så ABC og CBA er ulike rekkefølger. Hvor mange rekkefølger er mulige? Hvor mange blir det med fire ulike aminosyrer, én av hver?',
    blanks:[{label:'Tre ulike aminosyrer',answers:['6','seks']},{label:'Fire ulike aminosyrer',answers:['24','tjuefire']}],
    hint:'Hvor mange valg har du til første plass? Hvor mange er igjen til neste plass?',
    explanation:'Med tre ulike aminosyrer blir det 3 × 2 × 1 = 6 rekkefølger. Med fire blir det 4 × 3 × 2 × 1 = 24. Dette er korte modellkjeder, ikke fullstendige proteiner; modellen viser hvor raskt antallet mulige aminosyrerekkefølger øker.'
  },
  {
    id:'selected-mineral-symbols',topic:'micro',type:'match',level:1,
    title:'Mineraler og kjemiske symboler',
    prompt:'Koble hvert kjemiske symbol til riktig mineralstoff.',
    pairs:[{left:'Fe',right:'Jern'},{left:'Ca',right:'Kalsium'},{left:'I',right:'Jod'},{left:'Na',right:'Natrium'},{left:'K',right:'Kalium'}],
    hint:'Symbolene følger internasjonale navn og ligner ikke alltid det norske navnet.',
    explanation:'Fe er jern, Ca kalsium, I jod, Na natrium og K kalium. K er altså grunnstoffet kalium her, ikke vitamin K.'
  },
  {
    id:'selected-basal-energy',topic:'energy',type:'multi',level:2,
    title:'Energi i fullstendig hvile',
    prompt:'Hvilke prosesser bidrar til kroppens basale energibruk – energibruken som holder kroppen i gang i fullstendig hvile?',
    options:['At hjertet slår.','At pustemusklene arbeider.','At cellene vedlikeholder seg selv.','At beina driver kroppen fram under en løpetur.','At musklene løfter en tung sekk.'],
    answer:['At hjertet slår.','At pustemusklene arbeider.','At cellene vedlikeholder seg selv.'],
    hint:'Hvilke oppgaver må fortsette selv når du ligger helt i ro?',
    explanation:'Basal energibruk dekker blant annet hjerteslag, pust og vedlikehold i cellene. Fysisk aktivitet kommer i tillegg. Hvile betyr derfor ikke at energibruken er null.'
  },
  {
    id:'selected-cal-kcal',topic:'energy',type:'choice',level:2,
    title:'Kalorier i dagligtale',
    prompt:'I dagligtale sier en person «2000 kalorier» om energien i en dags mat. Hen mener 2000 kcal. Hva er dette uttrykt i cal?',
    options:['2 000 000 cal','2 000 cal','2 cal','200 000 cal'],answer:'2 000 000 cal',
    hint:'Prefikset kilo betyr tusen.',
    explanation:'1 kcal = 1000 cal, så 2000 kcal = 2 000 000 cal. «Kalorier» om mat brukes ofte som kortform for kilokalorier, men kcal og cal er ulike enheter.'
  },
  {
    id:'selected-activity-rate',topic:'energy',type:'fill',level:2,
    title:'Fra energibruk per minutt til total energi',
    prompt:'I et regneeksempel bruker en person i gjennomsnitt 8 kcal per minutt på en joggetur. Hvor mye energi bruker personen på 45 minutter? Hvor lenge varer en tur som bruker 240 kcal ved samme gjennomsnitt?',
    blanks:[{label:'Energi på 45 minutter',answers:['360'],unit:'kcal'},{label:'Tid for 240 kcal',answers:['30'],unit:'min'}],
    hint:'Energibruk per minutt ganger antall minutter gir total energi. Snu regnestykket når du skal finne tiden.',
    explanation:'8 × 45 = 360 kcal. 240 / 8 = 30 minutter. Tallet er gitt for denne personen i dette eksemplet; energibruk varierer med blant annet kroppsstørrelse og intensitet.'
  },
  {
    id:'selected-dietary-guidelines',topic:'energy',type:'open',level:2,
    title:'Kostråd i praksis',
    prompt:'Foreslå fire konkrete endringer som kan gjøre en ukemeny mer i tråd med norske kostråd. Menyen har lite grønnsaker, lyst brød, mye rødt og bearbeidet kjøtt og ofte brus som tørstedrikk.',
    model:'Ta med mer grønnsaker, frukt eller bær til måltidene. Velg oftere fullkornsbrød framfor lyst brød. Bytt ut noen kjøttmåltider med fisk eller belgvekster, og begrens bearbeidet kjøtt. Bruk vann som tørstedrikk. Et variert kosthold over tid er viktigere enn å vurdere én enkelt matvare isolert.',
    checklist:['Jeg foreslår mer grønnsaker, frukt eller bær.','Jeg foreslår mer fullkorn.','Jeg foreslår fisk eller belgvekster som erstatning for noe kjøtt.','Jeg foreslår vann som tørstedrikk.'],
    hint:'Se på plantevarer, valg av korn, variasjon i middager og valg av drikke.',
    explanation:'De norske kostrådene legger vekt på variasjon, mest mat fra planteriket, grønnsaker og frukt, fullkorn, fisk og belgvekster, mindre rødt og bearbeidet kjøtt og vann som tørstedrikk.',
    referenceLink:{label:'Norske kostråd',url:'https://www.helsenorge.no/kosthold-og-ernaring/kostrad/'},
    family:'dietary-guidelines'
  }
];
