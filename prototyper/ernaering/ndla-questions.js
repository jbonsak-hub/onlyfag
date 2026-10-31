// Oppgaver avgrenset til undervisningsmaterialet; nye situasjoner bygger på oppgitt informasjon.
export const ndlaQuestions = [
  {
    "id": "ndla-protein-enzyme-defect",
    "topic": "protein",
    "type": "choice",
    "level": 2,
    "title": "Når en enzymreaksjon hemmes",
    "prompt": "Et enzym omdanner stoff A til stoff B. En endring gjør enzymet svært lite aktivt. Hva kan skje hvis tilførselen av A fortsetter?",
    "options": [
      "A kan hope seg opp, mens dannelsen av B blir mindre.",
      "B dannes raskere fordi enzymet mangler.",
      "A og B må få samme konsentrasjon.",
      "Alle andre enzymer mister straks funksjonen."
    ],
    "answer": "A kan hope seg opp, mens dannelsen av B blir mindre.",
    "hint": "Enzymet øker hastigheten i en bestemt reaksjon.",
    "explanation": "Når et enzym virker dårlig, kan stoffet det skal bryte ned hope seg opp. Samtidig kan det bli dannet mindre av produktet."
  },
  {
    "id": "ndla-fat-fuels-together",
    "topic": "energy",
    "type": "choice",
    "level": 2,
    "title": "Energikilder under aktivitet",
    "prompt": "«Musklene kan ikke bruke fett før alt glykogenet er brukt opp.» Hva er den beste vurderingen?",
    "options": [
      "Påstanden er feil: fett og karbohydrater kan omsettes samtidig.",
      "Påstanden er riktig ved all aktivitet.",
      "Muskelceller kan aldri bruke fettsyrer.",
      "Glykogen må først omdannes til kostfiber."
    ],
    "answer": "Påstanden er feil: fett og karbohydrater kan omsettes samtidig.",
    "hint": "Kroppen har flere aktive reaksjonsveier samtidig.",
    "explanation": "Andelen energi fra fett og karbohydrater varierer blant annet med intensitet, varighet og tilgjengelige lagre. Det finnes ingen generell bryter som venter til alt glykogen er tomt."
  },
  {
    "id": "ndla-vitamin-coenzyme",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Vitaminer og energiomsetning",
    "prompt": "En reklame hevder at en B-vitamintablett gir energi fordi B-vitaminer hjelper kroppen å utnytte næringsstoffer. Hvilken vurdering er riktig?",
    "options": [
      "Det hjelper reaksjonene, men regnes ikke som et energigivende næringsstoff.",
      "Alle B-vitaminer er triglyserider.",
      "Vitaminet erstatter alle karbohydrater i maten.",
      "Alle vitaminer omdannes direkte til glukose."
    ],
    "answer": "Det hjelper reaksjonene, men regnes ikke som et energigivende næringsstoff.",
    "hint": "Skill mellom et hjelpestoff og stoffet som brytes ned for å frigjøre energi.",
    "explanation": "Flere vitaminer trengs for at enzymene skal virke. De hjelper kroppen å utnytte energi, men gir ikke selv energi slik fett, protein og karbohydrater gjør."
  },
  {
    "id": "ndla-vitamin-antioxidant",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Fra cellefunksjon til helsepåstand",
    "prompt": "Vitamin E kan virke som antioksidant. Hvilken slutning kan vi trekke av dette alene?",
    "options": [
      "Vitamin E kan beskytte cellekomponenter mot oksidasjon, men det beviser ikke at store tilskudd forebygger sykdom.",
      "Jo større dose, desto bedre helse for alle.",
      "Vitamin E gir mer energi enn fett.",
      "Alle sykdommer skyldes mangel på vitamin E."
    ],
    "answer": "Vitamin E kan beskytte cellekomponenter mot oksidasjon, men det beviser ikke at store tilskudd forebygger sykdom.",
    "hint": "En kjemisk funksjon er ikke det samme som dokumentert effekt av et kosttilskudd.",
    "explanation": "Det er nødvendig å skille mellom vitaminets funksjon i kroppen og helseeffekter av ekstra doser. Slike effekter må undersøkes særskilt."
  },
  {
    "id": "ndla-water-humidity",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Svette i fuktig luft",
    "prompt": "Hvorfor kan svette kjøle mindre effektivt i svært fuktig luft enn i tørr luft ved samme temperatur?",
    "options": [
      "Mindre svette fordamper, så mindre varme overføres ved fordamping.",
      "Svette avgir bare varme når den fryser.",
      "Vann er ikke lenger polart i fuktig luft.",
      "Svette må inneholde fett for å kunne kjøle."
    ],
    "answer": "Mindre svette fordamper, så mindre varme overføres ved fordamping.",
    "hint": "Det avgjørende er ikke bare at huden blir våt.",
    "explanation": "Fordamping krever energi som kan tas som varme fra huden. Svette som drypper av, gir ikke den samme fordampingskjølingen."
  },
  {
    "id": "ndla-digestion-lymph",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "title": "Transport fra tynntarmen",
    "prompt": "Hvilken sammenligning av opptatte næringsstoffer er mest presis?",
    "options": [
      "Monosakkarider går til blodet; mye langkjedet fett fraktes først i fettpartikler via lymfen.",
      "Alt opptatt fett går som hele matbiter rett til blodet.",
      "Aminosyrer lagres alltid i galleblæren.",
      "Blod og lymfe bryter ned all stivelsen før opptak."
    ],
    "answer": "Monosakkarider går til blodet; mye langkjedet fett fraktes først i fettpartikler via lymfen.",
    "hint": "Tarmtotter inneholder både blodårer og lymfeårer.",
    "explanation": "Etter opptak pakkes mye av det langkjedete fettet i fettpartikler i tarmcellene. Disse går via lymfen til blodet. Monosakkarider og aminosyrer går hovedsakelig direkte til blodkapillærene."
  },
  {
    "id": "ndla-metabolism-sort",
    "topic": "energy",
    "type": "sort",
    "level": 2,
    "title": "Oppbygging og nedbryting",
    "prompt": "Sorter celleprosessene. Alle er deler av stoffskiftet.",
    "groups": [
      "Oppbygging",
      "Nedbryting"
    ],
    "items": [
      {
        "label": "Aminosyrer settes sammen til et protein",
        "group": "Oppbygging"
      },
      {
        "label": "Glukoseenheter settes sammen til glykogen",
        "group": "Oppbygging"
      },
      {
        "label": "Glukose omsettes ved celleånding",
        "group": "Nedbryting"
      },
      {
        "label": "Lagret fett spaltes til mindre bestanddeler",
        "group": "Nedbryting"
      }
    ],
    "hint": "Se på om større molekyler bygges eller brytes ned.",
    "explanation": "Stoffskiftet omfatter begge typer prosesser. Oppbygging krever vanligvis energi; nedbryting kan overføre energi til blant annet ATP. Stoffskifte er mer enn fordøyelse."
  },
  {
    "id": "ndla-animation-conservation",
    "topic": "carbs",
    "type": "choice",
    "level": 2,
    "title": "Kontroller en molekylanimasjon",
    "prompt": "En animasjon viser to monosakkarider som danner et disakkarid og vann. Hva må være bevart fra før til etter reaksjonen?",
    "options": [
      "Antallet atomer av hvert grunnstoff.",
      "Antallet molekyler av hver type.",
      "Alle bindinger mellom atomene.",
      "Formen til hvert molekyl."
    ],
    "answer": "Antallet atomer av hvert grunnstoff.",
    "hint": "Bindinger kan endres, men atomer forsvinner ikke i denne reaksjonen.",
    "explanation": "En faglig modell må bevare atomene. Når to sukkerenheter bindes sammen og vann dannes, må vannets hydrogen- og oksygenatomer også være med i regnskapet."
  },
  {
    "id": "ndla-pepsin-ph",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "figure": "ndla-pepsin",
    "title": "Pepsin ved to pH-verdier",
    "prompt": "Forsøket bruker like mye pepsin og eggehvite ved samme temperatur. Hva støttes av resultatene i figuren?",
    "options": [
      "Pepsin spalter raskere ved pH 2 enn ved pH 7 under disse betingelsene.",
      "Pepsin har høyest mulig aktivitet ved akkurat pH 2 uansett temperatur.",
      "Forskjellen skyldes at A inneholder mer pepsin enn B.",
      "Ved pH 7 er aktiviteten nøyaktig null."
    ],
    "answer": "Pepsin spalter raskere ved pH 2 enn ved pH 7 under disse betingelsene.",
    "hint": "Hold konklusjonen til det som faktisk er sammenlignet.",
    "explanation": "Pepsin er tilpasset surt miljø i magesekken. Forsøket sier ikke at alle fordøyelsesenzymer har samme pH-avhengighet."
  },
  {
    "id": "ndla-pepsin-control",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "title": "Undersøk effekten av temperatur",
    "prompt": "Du vil teste temperaturens virkning på pepsin. Hvilket forsøksoppsett isolerer denne variabelen best?",
    "options": [
      "Lik pH, pepsinmengde og eggehvite, men ulike temperaturer.",
      "Ulik pH og temperatur i alle glass.",
      "Bare ett glass uten noen sammenligning.",
      "Ulik enzymmengde og ulik størrelse på eggehvitebitene."
    ],
    "answer": "Lik pH, pepsinmengde og eggehvite, men ulike temperaturer.",
    "hint": "Endre én faktor og hold resten mest mulig likt.",
    "explanation": "Kontrollerte betingelser gjør temperaturforskjellen til en rimelig forklaring på ulik reaksjonshastighet. Både pH, enzymmengde og overflate kan ellers påvirke resultatet."
  },
  {
    "id": "ndla-vitamin-source-label",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Vurder en vitaminkilde",
    "prompt": "En plantedrikk brukes i stedet for melk. Hva er mest relevant når du vurderer om drikken bidrar med vitamin B12?",
    "options": [
      "Kontroller om den er tilsatt B12, og les oppgitt innhold per mengde.",
      "Anta at alle plantedrikker naturlig har like mye B12 som melk.",
      "Se bare på hvor søt drikken smaker.",
      "Regn med at grønn farge viser B12-innholdet."
    ],
    "answer": "Kontroller om den er tilsatt B12, og les oppgitt innhold per mengde.",
    "hint": "Matvarens navn eller smak er ikke en næringsanalyse.",
    "explanation": "Hvilke vitaminer som er tilsatt, varierer mellom produkter. Ved vurdering av kilder må både innhold og mengde tas med. Vanlige plantevarer uten tilsatt B12 er ikke pålitelige B12-kilder."
  },
  {
    "id": "ndla-model-glands",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "title": "Rett en fordøyelsesmodell",
    "prompt": "En modell lar maten gå fra magesekken gjennom leveren og videre til tynntarmen. Hvordan bør modellen endres?",
    "options": [
      "Maten skal gå til tynntarmen; leveren tilføyer galle via egne ganger.",
      "Maten skal først gå gjennom bukspyttkjertelen.",
      "Leveren bør tegnes som en del av spiserøret.",
      "Tynntarmen må fjernes fordi opptak skjer bare i magesekken."
    ],
    "answer": "Maten skal gå til tynntarmen; leveren tilføyer galle via egne ganger.",
    "hint": "Skill mellom selve fordøyelseskanalen og tilknyttede kjertler.",
    "explanation": "En nyttig modell må vise riktige forbindelser. Maten passerer ikke gjennom leveren, galleblæren eller bukspyttkjertelen."
  },
  {
    "id": "ndla-health-source",
    "topic": "energy",
    "type": "multi",
    "level": 2,
    "title": "Vurder en kostholdspåstand",
    "prompt": "Et innlegg hevder at én matvare «løser alle helseproblemer». Hva bør du undersøke før du godtar påstanden?",
    "options": [
      "Om påstanden støttes av flere gode studier.",
      "Om avsenderen selger produktet.",
      "Hvilken gruppe, mengde og helseeffekt som er undersøkt.",
      "Om innlegget har mange likerklikk; det er tilstrekkelig bevis."
    ],
    "answer": [
      "Om påstanden støttes av flere gode studier.",
      "Om avsenderen selger produktet.",
      "Hvilken gruppe, mengde og helseeffekt som er undersøkt."
    ],
    "hint": "Skill mellom dokumentasjon, interessekonflikter og popularitet.",
    "explanation": "Ernæringspåstander må vurderes mot dokumentasjonen og hva den faktisk gjelder. Enkeltpersoners erfaringer og popularitet gir ikke alene grunnlag for universelle konklusjoner."
  }
];
