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
    title:'Hvorfor kan det finnes så mange ulike proteiner?',figure:'selected-amino-sequences',
    prompt:'Hvordan kan bare 20 aminosyretyper gi en enorm variasjon av proteiner? Undersøk først en liten modell: Hvor mange rekkefølger får du med A, B og C, én av hver? Hvor mange med fire ulike aminosyrer, én av hver? Kjedens start er markert; ABC og CBA er ulike rekkefølger.',
    blanks:[{label:'Tre ulike aminosyrer',answers:['6','seks']},{label:'Fire ulike aminosyrer',answers:['24','tjuefire']}],
    hint:'Hvor mange valg har du til første plass? Hvor mange er igjen til neste plass?',
    explanation:'Tre ulike aminosyrer gir 3 × 2 × 1 = 6 rekkefølger; fire gir 4 × 3 × 2 × 1 = 24. I proteiner kan hver av de 20 aminosyretypene brukes flere ganger. En kjede med 100 aminosyrer har derfor 20¹⁰⁰ mulige rekkefølger – et tall med 131 sifre! Rekkefølgen påvirker foldingen og dermed proteinets form og funksjon. Derfor kan de samme byggesteinene gi en enorm proteinvariasjon.'
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
    title:'Godt og dårlig kosthold',
    prompt:'Hva kjennetegner et godt og et dårlig kosthold? Forklar og gi eksempler.',
    model:'Et godt kosthold er variert og gir nok energi og nødvendige næringsstoffer over tid. Det har blant annet grønnsaker, frukt og bær, fullkorn, fisk eller belgvekster, og vann som tørstedrikk. Et dårlig sammensatt kosthold er ensidig eller gir for lite eller for mye av det kroppen trenger, for eksempel lite kostfiber og mye salt eller tilsatt sukker. Det er kostholdet over tid som teller; én matvare eller ett måltid avgjør ikke alene.',
    checklist:['Jeg beskriver både et godt og et dårlig sammensatt kosthold.','Jeg forklarer betydningen av variasjon, energi og nødvendige næringsstoffer.','Jeg gir konkrete eksempler og begrunner dem.','Jeg vurderer kostholdet over tid, ikke bare én matvare.'],
    hint:'Tenk på hva kroppen trenger gjennom en hel uke, og begrunn eksemplene dine.',
    explanation:'Kosthold vurderes ut fra helheten over tid: variasjon, næringsstoffer og energi i forhold til behovet. Kostrådene gir hjelp til å velge matvarer som dekker behovene.',
    family:'dietary-guidelines'
  }
];
