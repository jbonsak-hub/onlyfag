// Original visual tasks using the taught ring structures and nutrition vocabulary.
export const structureQuestions = [
  {
    "id": "structure-glucose",
    "topic": "carbs",
    "figure": "sugar-rings",
    "title": "Tre ringformede sukkerarter",
    "prompt": "Glukose, fruktose og galaktose er vist med navn. Hvilken gruppe tilhører alle tre?",
    "hint": "Hvert molekyl er én sukkerenhet.",
    "explanation": "Alle tre er monosakkarider. Disakkarider består av to sammenbundne monosakkarider; polysakkarider består av mange.",
    "level": 2,
    "type": "choice",
    "options": [
      "Monosakkarider",
      "Disakkarider",
      "Polysakkarider",
      "Aminosyrer"
    ],
    "answer": "Monosakkarider",
    "family": "sugar-rings"
  },
  {
    "id": "structure-galactose",
    "topic": "carbs",
    "figure": "pair-glucose-galactose",
    "title": "Sammenlign to sukkerarter",
    "prompt": "Hva viser ringstrukturene når du sammenligner glukose og galaktose?",
    "hint": "Sammenlign OH-gruppene ved den venstre delen av hver ring.",
    "explanation": "Glukose og galaktose har begge sumformelen C₆H₁₂O₆. Én OH-gruppe peker ulikt i de viste ringstrukturene. Samme sumformel betyr derfor ikke at molekylene er helt like.",
    "level": 2,
    "type": "choice",
    "options": [
      "De har samme antall atomer, men én OH-gruppe er plassert annerledes.",
      "Galaktose har dobbelt så mange karbonatomer som glukose.",
      "Glukose inneholder nitrogen, mens galaktose ikke gjør det.",
      "De har helt lik struktur i figuren."
    ],
    "answer": "De har samme antall atomer, men én OH-gruppe er plassert annerledes.",
    "family": "sugar-rings"
  },
  {
    "id": "structure-hexose",
    "topic": "carbs",
    "figure": "sugar-rings",
    "title": "Samme sumformel",
    "prompt": "Glukose, fruktose og galaktose har alle sumformelen C₆H₁₂O₆. Hvilke utsagn følger av denne opplysningen?",
    "hint": "Skill mellom hva en sumformel viser og hva en strukturformel viser.",
    "explanation": "Sumformelen oppgir antallet atomer av hvert grunnstoff. Stoffene kan likevel ha ulik plassering av atomene og dermed ulike egenskaper.",
    "level": 2,
    "type": "multi",
    "options": [
      "De har like mange atomer av hvert grunnstoff.",
      "De må ha helt lik struktur.",
      "Formelen alene viser ikke hvordan atomene er plassert.",
      "Fruktose har flere karbonatomer enn glukose."
    ],
    "answer": [
      "De har like mange atomer av hvert grunnstoff.",
      "Formelen alene viser ikke hvordan atomene er plassert."
    ],
    "family": "sugar-rings"
  },
  {
    "id": "structure-carbon-count",
    "topic": "carbs",
    "figure": "single-fructose-ring",
    "title": "Tell atomer i ringform",
    "prompt": "Hvor mange karbonatomer og oksygenatomer inneholder fruktosemolekylet (B)?",
    "hint": "Tell C og O både i ringen og i gruppene utenfor ringen.",
    "explanation": "Fruktose har fire C-atomer og ett O-atom i ringen. To CH₂OH-grupper gir to C-atomer til. De fem OH-gruppene og ringens O gir seks O-atomer i alt.",
    "level": 2,
    "type": "fill",
    "blanks": [
      {
        "label": "Karbonatomer",
        "answers": [
          "6"
        ]
      },
      {
        "label": "Oksygenatomer",
        "answers": [
          "6"
        ]
      }
    ],
    "family": "sugar-rings"
  },
  {
    "id": "structure-fischer-food",
    "topic": "carbs",
    "figure": "sugar-rings",
    "title": "Byggesteiner i disakkarider",
    "prompt": "A er glukose, B fruktose og C galaktose. Koble kombinasjonen til disakkaridet.",
    "hint": "Maltose dannes fra stivelse. Melkesukker inneholder galaktose.",
    "explanation": "Maltose består av to glukoseenheter, sukrose av glukose og fruktose, og laktose av glukose og galaktose. I hvert tilfelle er enhetene kjemisk bundet sammen.",
    "level": 2,
    "type": "match",
    "pairs": [
      {
        "left": "A + A",
        "right": "Maltose"
      },
      {
        "left": "A + B",
        "right": "Sukrose"
      },
      {
        "left": "A + C",
        "right": "Laktose"
      }
    ],
    "family": "sugar-rings"
  },
  {
    "id": "structure-ring-claim",
    "topic": "carbs",
    "figure": "carb-rings",
    "title": "Hva kan modellen vise?",
    "prompt": "En elev sier at A må være glukose fordi det bare er én ring. Hvilken vurdering er mest presis?",
    "hint": "Skiller modellen mellom hvordan OH-gruppene er plassert?",
    "explanation": "Antall sukkerenheter er vist, men detaljene som skiller bestemte monosakkarider er utelatt. Enkle symbolmodeller gir ikke alle strukturdetaljer.",
    "level": 2,
    "type": "choice",
    "options": [
      "Én ring viser én enhet her, men identifiserer ikke alene hvilken sukkerart det er.",
      "Alle molekyler med én ring er glukose.",
      "Glukose kan aldri ha ringform.",
      "Ringer finnes bare i polysakkarider."
    ],
    "answer": "Én ring viser én enhet her, men identifiserer ikke alene hvilken sukkerart det er."
  },
  {
    "id": "structure-disaccharide",
    "topic": "carbs",
    "figure": "carb-rings",
    "title": "Velg riktig molekylgruppe",
    "prompt": "Hvilken modell kan representere sukrose uten at alle atomene er tegnet?",
    "hint": "Sukrose består av to bundne monosakkarider.",
    "explanation": "B har to sammenbundne sukkerenheter og kan representere et disakkarid. En fullstendig sukrosestruktur må også vise at enhetene er glukose og fruktose og hvordan de er bundet.",
    "level": 2,
    "type": "choice",
    "options": [
      "A",
      "B",
      "C"
    ],
    "answer": "B"
  },
  {
    "id": "structure-glycosidic-water",
    "topic": "carbs",
    "figure": "glycosidic",
    "title": "Spalting av et sukkerstoff",
    "prompt": "Hvilken beskrivelse passer til endringen fra venstre mot høyre?",
    "hint": "Se på om ringene er bundet sammen før og etter.",
    "explanation": "Bindingen mellom sukkerenhetene spaltes. Vann inngår i spaltingen. Fordøyelsen bryter større næringsstoffer ned til mindre deler som kan tas opp.",
    "level": 2,
    "type": "choice",
    "options": [
      "To sammenbundne sukkerenheter blir skilt fra hverandre.",
      "To aminosyrer blir til et protein.",
      "Én sukkerenhet blir til en fettsyre.",
      "To frie sukkerenheter blir bundet sammen."
    ],
    "answer": "To sammenbundne sukkerenheter blir skilt fra hverandre."
  },
  {
    "id": "structure-poly-identity",
    "topic": "carbs",
    "figure": "polysaccharides",
    "title": "Knytt stoff til funksjon",
    "prompt": "Modellene har navn. Koble hvert stoff til riktig funksjon.",
    "hint": "Skill mellom energilagre i planter og dyr, og byggemateriale i planteceller.",
    "explanation": "Stivelse er plantenes glukoselager. Glykogen lagres i lever og muskler. Cellulose er byggemateriale i plantecellevegger og fungerer som kostfiber i maten vår. Stivelse kan ha både rette og forgrenede kjeder; A viser en forgrenet kjede.",
    "level": 2,
    "type": "match",
    "pairs": [
      {
        "left": "A: Stivelse",
        "right": "Lagrer glukose i planter"
      },
      {
        "left": "B: Glykogen",
        "right": "Lagrer glukose i lever og muskler"
      },
      {
        "left": "C: Cellulose",
        "right": "Gir støtte i plantecellevegger"
      }
    ]
  },
  {
    "id": "structure-cellulose-enzyme",
    "topic": "carbs",
    "figure": "polysaccharides",
    "title": "Samme byggestein, ulik fordøyelse",
    "prompt": "Alle modellene er bygd av glukose. Hvorfor fordøyer mennesker ikke cellulose (C) slik vi fordøyer stivelse (A)?",
    "hint": "Det er ikke nok at byggesteinen er den samme; enzymet må også passe til bindingene.",
    "explanation": "Menneskets fordøyelsesenzymer kan spalte bindingene i stivelse, men ikke bindingene i cellulose. Cellulose er kostfiber. Noe kostfiber kan omsettes av bakterier i tykktarmen.",
    "level": 2,
    "type": "choice",
    "options": [
      "Vi mangler fordøyelsesenzymer som kan spalte bindingene i cellulose.",
      "Cellulose inneholder ikke kjemiske bindinger.",
      "Glukose i cellulose har ingen karbonatomer.",
      "Cellulose tas opp som hele kjeder i blodet."
    ],
    "answer": "Vi mangler fordøyelsesenzymer som kan spalte bindingene i cellulose."
  },
  {
    "id": "structure-poly-storage",
    "topic": "carbs",
    "figure": "polysaccharides",
    "title": "Lagring og støtte",
    "prompt": "Hvilke koblinger er riktige?",
    "hint": "Skill mellom lagringsformene og glukosen som transporteres i blodet.",
    "explanation": "Stivelse lagrer glukose i planter. Glykogen lagres særlig i lever og muskler. Cellulose har en strukturell rolle i planter; blodet transporterer glukose, ikke store mengder glykogen.",
    "level": 2,
    "type": "multi",
    "options": [
      "Stivelse – lagring i planter.",
      "Glykogen – lagring i lever og muskler.",
      "Cellulose – viktig del av plantecellevegger.",
      "Glykogen – hovedstoffet i blodet."
    ],
    "answer": [
      "Stivelse – lagring i planter.",
      "Glykogen – lagring i lever og muskler.",
      "Cellulose – viktig del av plantecellevegger."
    ]
  },
  {
    "id": "structure-poly-explain",
    "topic": "carbs",
    "figure": "polysaccharides",
    "title": "Forklar struktur og funksjon",
    "prompt": "Stivelse, glykogen og cellulose er alle bygd av glukose. Forklar hvorfor de likevel har ulike funksjoner og ikke fordøyes likt.",
    "hint": "Tenk på både hvordan enhetene er bundet sammen og hvilke enzymer kroppen har.",
    "explanation": "Samme byggestein kan settes sammen på ulike måter og gi stoffer med ulike egenskaper.",
    "level": 2,
    "type": "open",
    "model": "Glukoseenhetene er bundet sammen på ulike måter. Stivelse lagrer glukose i planter, og glykogen lagrer glukose i lever og muskler. Cellulose danner sterke kjeder i plantecellevegger. Fordøyelsesenzymer må passe til bindingene. Våre enzymer spalter stivelse, men ikke cellulose, som fungerer som kostfiber.",
    "checklist": [
      "Jeg skiller glukoselagre fra byggemateriale i planter.",
      "Jeg forklarer at glukoseenhetene er bundet sammen på ulike måter.",
      "Jeg knytter fordøyelsen til hvilke bindinger enzymene kan spalte."
    ]
  },
  {
    "id": "structure-amino-groups",
    "topic": "protein",
    "figure": "amino",
    "title": "Grupper i en aminosyre",
    "prompt": "Koble bokstavene til riktig del av molekylet.",
    "hint": "Se etter nitrogen, COOH og den delen som bare er merket R.",
    "explanation": "En aminosyre har aminogruppe og syregruppe på samme sentrale karbon. R-gruppen varierer mellom aminosyrene. Tegningen viser nøytral form; i kroppen finnes ofte ladede former.",
    "level": 2,
    "type": "match",
    "pairs": [
      {
        "left": "A",
        "right": "Aminogruppe"
      },
      {
        "left": "B",
        "right": "Syregruppe (COOH)"
      },
      {
        "left": "C",
        "right": "Variabel sidegruppe"
      }
    ]
  },
  {
    "id": "structure-amino-nitrogen",
    "topic": "protein",
    "figure": "amino",
    "title": "Hvilket grunnstoff skiller gruppen?",
    "prompt": "Hvilket grunnstoff i gruppe A er et tydelig kjennetegn ved aminosyren sammenlignet med vanlige sukkerarter?",
    "hint": "Gruppe A er H₂N. Hvilken bokstav står for et annet grunnstoff enn C, H og O?",
    "explanation": "Aminogruppen inneholder nitrogen. Vanlige karbohydrater består av karbon, hydrogen og oksygen. Noen aminosyrer inneholder også svovel i R-gruppen.",
    "level": 2,
    "type": "choice",
    "options": [
      "Nitrogen",
      "Oksygen",
      "Hydrogen",
      "Karbon"
    ],
    "answer": "Nitrogen"
  },
  {
    "id": "structure-amino-r",
    "topic": "protein",
    "figure": "amino",
    "title": "Hva varierer mellom aminosyrer?",
    "prompt": "To aminosyrer har like aminogrupper og syregrupper, men ulike R-grupper. Hva kan derfor være forskjellig?",
    "hint": "Sammenlign den felles oppbygningen med delen som er merket R.",
    "explanation": "Ulike aminosyrer har ulike sidegrupper. Det påvirker egenskapene deres og hvordan proteiner folder seg.",
    "level": 2,
    "type": "choice",
    "options": [
      "Aminosyrene kan få ulike egenskaper fordi R-gruppene er forskjellige.",
      "R er alltid et jernatom.",
      "Alle aminosyrer har identisk R-gruppe.",
      "R er en ekstra aminosyre som alltid bindes utenpå."
    ],
    "answer": "Aminosyrene kan få ulike egenskaper fordi R-gruppene er forskjellige."
  },
  {
    "id": "structure-amino-central",
    "topic": "protein",
    "figure": "amino",
    "title": "Finn det sentrale karbonet",
    "prompt": "Hvilke fire grupper er bundet til det sentrale karbonet merket CH?",
    "hint": "H i CH er det fjerde atomet/gruppen selv om det ikke har en egen strek.",
    "explanation": "Det sentrale karbonet i en aminosyre er bundet til aminogruppen, syregruppen, et hydrogen og R. I én av aminosyrene er R også hydrogen.",
    "level": 2,
    "type": "choice",
    "options": [
      "NH₂, COOH, H og R",
      "NH₂, COOH og to OH-grupper",
      "Tre fettsyrer og ett glukosemolekyl",
      "Fire identiske R-grupper"
    ],
    "answer": "NH₂, COOH, H og R"
  },
  {
    "id": "structure-peptide-bond",
    "topic": "protein",
    "figure": "dipeptide",
    "title": "Bindingen i et peptid",
    "prompt": "Hvilken bindingstype er markert X?",
    "hint": "Hvilken type byggesteiner er satt sammen i kjeden?",
    "explanation": "Peptidbindinger binder aminosyrer sammen. I figuren går binding X mellom et C-atom i syregruppen fra én aminosyre og et N-atom fra den andre.",
    "level": 2,
    "type": "choice",
    "options": [
      "Peptidbinding",
      "En binding mellom to sukkerarter",
      "En binding mellom glyserol og en fettsyre",
      "En binding mellom to fettsyrer"
    ],
    "answer": "Peptidbinding"
  },
  {
    "id": "structure-peptide-count",
    "topic": "protein",
    "figure": "dipeptide",
    "title": "Tell aminosyreenheter",
    "prompt": "Hvor mange aminosyreenheter og peptidbindinger er vist i denne kjeden?",
    "hint": "Finn gjentakelsen av sentralt karbon og se hvor to enheter er koblet.",
    "explanation": "Molekylet består av to aminosyrer som er bundet sammen med én peptidbinding. En lineær kjede med n aminosyrer har n − 1 peptidbindinger.",
    "level": 2,
    "type": "fill",
    "blanks": [
      {
        "label": "Aminosyreenheter",
        "answers": [
          "2"
        ]
      },
      {
        "label": "Peptidbindinger",
        "answers": [
          "1"
        ]
      }
    ]
  },
  {
    "id": "structure-peptide-hydrolysis",
    "topic": "protein",
    "figure": "dipeptide",
    "title": "Spalting av to aminosyrer",
    "prompt": "Hva blir sluttproduktene når kjeden spaltes ved X?",
    "hint": "Se hvilke byggesteiner som er bundet sammen.",
    "explanation": "Når peptidbindingen spaltes, frigjøres to aminosyrer. Proteiner brytes ned til mindre kjeder og videre til aminosyrer.",
    "level": 2,
    "type": "choice",
    "options": [
      "To aminosyrer",
      "To fettsyrer",
      "Ett monosakkarid og glyserol",
      "Ett protein med flere aminosyrer enn før"
    ],
    "answer": "To aminosyrer"
  },
  {
    "id": "structure-denaturation-bond",
    "topic": "protein",
    "figure": "protein",
    "title": "Hva viser A?",
    "prompt": "Hvilket utsagn beskriver endringen fra Start til A best?",
    "hint": "Følg hele kjeden og tell forbindelsene mellom sirklene.",
    "explanation": "A viser en forenklet denaturering: formen endres uten at kjeden klippes i denne modellen. B viser brudd i kjeden. Endret folding kan ødelegge enzymfunksjonen.",
    "level": 2,
    "type": "choice",
    "options": [
      "Foldingen endres, men antallet peptidbindinger i kjeden er bevart.",
      "Alle peptidbindingene er spaltet til frie aminosyrer.",
      "A har fått nye sukkerenheter.",
      "A er omdannet til et triglyserid."
    ],
    "answer": "Foldingen endres, men antallet peptidbindinger i kjeden er bevart."
  },
  {
    "id": "structure-protein-change",
    "topic": "protein",
    "figure": "protein",
    "title": "Denaturering og spalting",
    "prompt": "Hvilke utsagn er riktige om modellene?",
    "hint": "Skill proteinets tredimensjonale form fra selve rekkefølgen av bundne aminosyrer.",
    "explanation": "Denaturering endrer proteinets form. Spalting bryter bindingene mellom aminosyrene. Magesyre kan endre formen, mens pepsin spalter bindinger i proteinet.",
    "level": 2,
    "type": "multi",
    "options": [
      "Varme eller lav pH kan bidra til endring A.",
      "Endring A kan redusere enzymaktivitet uten å frigjøre aminosyrer.",
      "Endring B innebærer at bindinger i kjeden er brutt.",
      "A og B viser alltid nøyaktig samme kjemiske prosess."
    ],
    "answer": [
      "Varme eller lav pH kan bidra til endring A.",
      "Endring A kan redusere enzymaktivitet uten å frigjøre aminosyrer.",
      "Endring B innebærer at bindinger i kjeden er brutt."
    ]
  },
  {
    "id": "structure-glycerol-acid",
    "topic": "fat",
    "figure": "glycerol-acid",
    "title": "Les to strukturformler",
    "prompt": "Koble A og B til stofftype.",
    "hint": "Sammenlign antall karbonatomer og OH-grupper i A med den lengre kjeden i B.",
    "explanation": "A er glyserol: tre karbonatomer og tre OH-grupper. B er en fettsyre med sju karbonatomer og en syregruppe. Glyserol og fettsyrer er byggesteiner i triglyserider.",
    "level": 2,
    "type": "match",
    "pairs": [
      {
        "left": "A",
        "right": "Glyserol: alkohol med tre OH-grupper"
      },
      {
        "left": "B",
        "right": "Fettsyre: lang karbonkjede med COOH"
      }
    ],
    "family": "fat-saturation"
  },
  {
    "id": "structure-acid-saturation",
    "topic": "fat",
    "figure": "glycerol-acid",
    "title": "Beskriv en fettsyre",
    "prompt": "Hvordan vil du beskrive fettsyren B?",
    "hint": "Se etter bindingene mellom karbonatomene i kjeden.",
    "explanation": "B er mettet: alle bindingene mellom karbonatomene er enkeltbindinger. C=O i syregruppen gjør ikke fettsyren umettet. Det er C=C i karbonkjeden som avgjør dette.",
    "level": 2,
    "type": "choice",
    "options": [
      "Mettet",
      "Enumettet",
      "Flerumettet",
      "Umulig å avgjøre ut fra strukturen"
    ],
    "answer": "Mettet",
    "family": "fat-saturation"
  },
  {
    "id": "structure-acid-carbon-count",
    "topic": "fat",
    "figure": "glycerol-acid",
    "title": "Hvor lang er fettsyren?",
    "prompt": "Hvor mange karbonatomer inneholder fettsyren B totalt?",
    "hint": "Tell alle C-atomer, også det som er bundet til to O-atomer ved syreenden.",
    "explanation": "Fettsyren som er tegnet, inneholder sju C-atomer. Karbonet i syregruppen er også en del av fettsyren.",
    "level": 2,
    "type": "fill",
    "blanks": [
      {
        "label": "Karbonatomer",
        "answers": [
          "7"
        ]
      }
    ],
    "family": "fat-saturation"
  },
  {
    "id": "structure-tri-hydrolysis",
    "topic": "fat",
    "figure": "triglyceride",
    "title": "Byggesteinene i fett",
    "prompt": "Når dette triglyseridet spaltes helt til byggesteinene, hvor mange glyserolmolekyler og fettsyremolekyler dannes?",
    "hint": "Se etter én felles del til venstre og kjedene som er koblet til den.",
    "explanation": "Et triglyserid er satt sammen av ett glyserolmolekyl og tre fettsyrer. Figuren viser én felles del til venstre som er knyttet til tre fettsyrekjeder.",
    "level": 2,
    "type": "fill",
    "blanks": [
      {
        "label": "Glyserolmolekyler",
        "answers": [
          "1"
        ]
      },
      {
        "label": "Fettsyremolekyler",
        "answers": [
          "3"
        ]
      }
    ]
  },
  {
    "id": "structure-mono-unsaturated",
    "topic": "fat",
    "figure": "fat-chains",
    "title": "Sammenlign bindingene i kjeden",
    "prompt": "Hvordan vil du beskrive fettsyren B?",
    "hint": "Se på bindingene mellom C-atomene i B.",
    "explanation": "B har én dobbeltbinding mellom to C-atomer i kjeden og er enumettet. Mettede fettsyrer har ingen slike bindinger; flerumettede har flere.",
    "level": 2,
    "type": "choice",
    "options": [
      "Mettet",
      "Enumettet",
      "Flerumettet",
      "Umulig å avgjøre ut fra strukturen"
    ],
    "answer": "Enumettet",
    "family": "fat-saturation"
  },
  {
    "id": "structure-chain-melting",
    "topic": "fat",
    "figure": "fat-chains",
    "title": "Struktur og smelting",
    "prompt": "Sammenlign de to fettsyrene med samme kjedelengde. Hva kan en cis-form i en umettet kjede vanligvis føre til?",
    "hint": "Tenk på hvordan rette og bøyde kjeder kan ligge inntil hverandre.",
    "explanation": "Cis-form gir ofte en knekk som gjør tett pakking vanskeligere. Det senker vanligvis smeltepunktet når kjedelengden ellers er omtrent lik.",
    "level": 2,
    "type": "choice",
    "options": [
      "Kjedene pakkes mindre tett, og fettet får ofte lavere smeltepunkt.",
      "Kjedene blir aminosyrer som bygger proteiner.",
      "Fettsyren blir fullstendig vannløselig.",
      "Umettede fettsyrer får alltid høyere smeltepunkt enn mettede."
    ],
    "answer": "Kjedene pakkes mindre tett, og fettet får ofte lavere smeltepunkt.",
    "family": "fat-saturation"
  },
  {
    "id": "structure-cis-identify",
    "topic": "fat",
    "figure": "cis-trans",
    "title": "Cis eller trans?",
    "prompt": "Hvilken av de to fettsyrene er vist i cis-form?",
    "hint": "Se hvordan de to delene av karbonkjeden ligger ved C=C.",
    "explanation": "I A ligger kjededelene på samme side av C=C: cis. I B ligger kjededelene på hver sin side: trans.",
    "level": 2,
    "type": "choice",
    "options": [
      "A",
      "B",
      "Begge",
      "Ingen"
    ],
    "answer": "A"
  },
  {
    "id": "structure-trans-not-saturated",
    "topic": "fat",
    "figure": "cis-trans",
    "title": "Vurder struktur og betegnelse",
    "prompt": "Hvilke utsagn om B er riktige?",
    "hint": "Skill mellom antallet dobbeltbindinger og hvordan kjeden er plassert ved en slik binding.",
    "explanation": "B er en umettet fettsyre i trans-form. At kjeden er rettere, gjør den ikke mettet; det finnes fortsatt en C=C-binding.",
    "level": 2,
    "type": "multi",
    "options": [
      "B er vist i trans-form.",
      "B er umettet.",
      "B er mettet fordi kjeden er rettere.",
      "Cis og trans sier noe om plasseringen av kjededelene ved C=C."
    ],
    "answer": [
      "B er vist i trans-form.",
      "B er umettet.",
      "Cis og trans sier noe om plasseringen av kjededelene ved C=C."
    ]
  },
  {
    "id": "structure-omega-family",
    "topic": "fat",
    "figure": "omega",
    "title": "Finn omegafettsyren",
    "prompt": "Hvilken omegafettsyre er vist i figuren?",
    "hint": "Begynn på motsatt side av molekylet fra syregruppen.",
    "explanation": "Dette er en omega-3-fettsyre: tell C-atomene fra enden motsatt syregruppen. Den første dobbeltbindingen er mellom det tredje og fjerde C-atomet.",
    "level": 2,
    "type": "choice",
    "options": [
      "Omega-3-fettsyre",
      "Omega-6-fettsyre",
      "Omega-9-fettsyre",
      "Omega-2-fettsyre"
    ],
    "answer": "Omega-3-fettsyre"
  },
  {
    "id": "structure-hydrolysis-water",
    "topic": "protein",
    "figure": "hydrolysis-count",
    "title": "Fra kjede til aminosyrer",
    "prompt": "Hvor mange aminosyrer frigjøres når hele kjeden deles opp, og hvor mange peptidbindinger må brytes?",
    "hint": "Tell sirklene og forbindelsene mellom dem.",
    "explanation": "Fem aminosyrer er bundet sammen med fire peptidbindinger. Når alle fire bindingene spaltes, er de fem aminosyrene skilt fra hverandre.",
    "level": 2,
    "type": "fill",
    "blanks": [
      {
        "label": "Aminosyrer",
        "answers": [
          "5"
        ]
      },
      {
        "label": "Peptidbindinger",
        "answers": [
          "4"
        ]
      }
    ]
  },
  {
    "id": "structure-acid-deciding-bond",
    "topic": "fat",
    "type": "choice",
    "level": 2,
    "figure": "fat-bonds",
    "family": "fat-saturation",
    "title": "Hvilken binding teller?",
    "prompt": "Hvilken av de markerte bindingene gjør fettsyren umettet?",
    "options": [
      "X",
      "Y",
      "Begge",
      "Ingen av dem"
    ],
    "answer": "X",
    "hint": "Se etter hva slags atomer bindingene forbinder.",
    "explanation": "X er en dobbeltbinding mellom to karbonatomer (C=C). Den gjør fettsyren umettet. Y er C=O i syregruppen; denne finnes også i mettede fettsyrer."
  }
];

structureQuestions.find(q=>q.id==='structure-omega-family').explainOnReveal=true;
