// Short applications of the taught muscle-respiration and ATP/ADP models.
export const respirationQuestions = [
  {
    id: 'respiration-activity', topic: 'energy', type: 'sort', level: 2,
    family: 'energy-aerobic-anaerobic',
    title: 'Celleånding under aktivitet',
    prompt: 'Hvilken av de to formene for celleånding bidrar mest til ATP-produksjonen under hver aktivitet?',
    groups: ['Aerob celleånding', 'Anaerob celleånding'],
    items: [
      {label: 'Rolig joggetur i 30 minutter', group: 'Aerob celleånding'},
      {label: 'Maksimal sprint i 20 sekunder', group: 'Anaerob celleånding'},
      {label: 'Sykkeltur i jevn, rolig fart i én time', group: 'Aerob celleånding'},
      {label: 'Maksimal sykkelspurt i 30 sekunder', group: 'Anaerob celleånding'}
    ],
    hint: 'Sammenlign hvor hardt musklene arbeider, og hvor lenge aktiviteten varer.',
    explanation: 'Aerob celleånding bidrar mest ved rolig, langvarig aktivitet. Ved kortvarig, maksimal innsats bidrar anaerob celleånding mye til rask ATP-produksjon. Begge formene bidrar under aktivitet; oppgaven sammenligner hvilken av de to som bidrar mest.'
  },
  {
    id: 'respiration-atp-yield', topic: 'energy', type: 'match', level: 1,
    family: 'respiration-atp-yield',
    title: 'ATP fra ett glukosemolekyl',
    prompt: 'Koble ATP-utbyttet per glukosemolekyl til riktig prosess i musklene.',
    pairs: [
      {left: 'Omtrent 30 ATP', right: 'Aerob celleånding'},
      {left: '2 ATP', right: 'Anaerob celleånding'}
    ],
    hint: 'Hvilken prosess får mest energi ut av hvert glukosemolekyl?',
    explanation: 'Den forenklede oversikten bruker omtrent 30 ATP per glukosemolekyl ved aerob celleånding og 2 ATP ved anaerob celleånding i musklene. Det aerobe utbyttet kan variere, men er langt større enn det anaerobe. Tallene beskriver netto ATP-utbytte, ikke hvor raskt ATP dannes.'
  },
  {
    id: 'respiration-glucose-need', topic: 'energy', type: 'choice', level: 2,
    family: 'respiration-atp-yield',
    title: 'Samme behov for ATP',
    prompt: 'To muskelceller skal danne like mye ATP fra glukose. Én bruker aerob og én anaerob celleånding. Hvilken trenger mest glukose?',
    options: [
      'Den anaerobe, fordi den får mindre ATP fra hvert glukosemolekyl.',
      'Den aerobe, fordi den får mer ATP fra hvert glukosemolekyl.',
      'De trenger like mye, fordi begge bruker glukose.',
      'Ingen av dem trenger glukose når de skal danne ATP.'
    ],
    answer: 'Den anaerobe, fordi den får mindre ATP fra hvert glukosemolekyl.',
    hint: 'Sammenlign utbyttet fra ett glukosemolekyl når mengden ATP som trengs, er den samme.',
    explanation: 'Anaerob celleånding gir mindre ATP per glukosemolekyl. Derfor må mer glukose brytes ned for å danne samme mengde ATP. Med omtrent 30 ATP aerobt og 2 ATP anaerobt blir glukosebehovet omtrent 15 ganger større i denne forenklede sammenligningen.'
  },
  {
    id: 'respiration-atp-use', topic: 'energy', type: 'choice', level: 2,
    family: 'energy-atp',
    title: 'Når ATP brukes videre',
    prompt: 'En muskelcelle fortsetter å bruke ATP, men danner en kort stund ikke nytt ATP fra ADP. Hvordan endres mengdene da?',
    options: [
      'ATP minker, og ADP øker.',
      'ATP øker, og ADP minker.',
      'Både ATP og ADP øker.',
      'Mengdene av ATP og ADP endres ikke.'
    ],
    answer: 'ATP minker, og ADP øker.',
    hint: 'Hva blir ATP til når en fosfatgruppe spaltes av?',
    explanation: 'Når ATP brukes til arbeid i cellen, dannes ADP og fosfat. Uten at nytt ATP dannes fra ADP, blir det derfor mindre ATP og mer ADP i denne forenklede situasjonen. Vanligvis brukes energi fra celleåndingen til stadig å danne nytt ATP.'
  }
];
