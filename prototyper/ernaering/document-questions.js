// Oppgaver avgrenset til undervisningsmaterialet; nye situasjoner bygger på oppgitt informasjon.
export const documentQuestions = [
  {
    "id": "doc-boiled-enzyme",
    "topic": "protein",
    "type": "choice",
    "level": 2,
    "title": "Oppvarmet enzym",
    "prompt": "Like stivelsesprøver får enten ferskt spytt eller spytt som først er kokt og deretter avkjølt. Bare ferskt spytt spalter stivelsen raskt. Hva forklarer forskjellen?",
    "hint": "Begge prøvene er avkjølt før sammenligningen. Hva kan forkokingen ha gjort med enzymets tredimensjonale struktur?",
    "explanation": "Sterk varme kan denaturere enzymproteinet. Avkjøling gjenoppretter ikke nødvendigvis den opprinnelige formen og aktiviteten. Samme temperatur under sammenligningen isolerer effekten av forkokingen.",
    "options": [
      "Kokingen har endret amylasens form slik at enzymaktiviteten er redusert.",
      "Det avkjølte spyttet mangler alle grunnstoffer.",
      "Kokingen har gjort amylase om til mer aktiv enzymer som spalter fett.",
      "Stivelse kan bare spaltes når den selv er levende."
    ],
    "answer": "Kokingen har endret amylasens form slik at enzymaktiviteten er redusert.",
    "family": "foodtests"
  },
  {
    "id": "doc-food-carbs",
    "topic": "carbs",
    "type": "match",
    "level": 1,
    "title": "Karbohydrater i mat",
    "prompt": "Koble matvaren til et karakteristisk karbohydrat.",
    "hint": "Tenk på plantens energilager, melkesukker, vanlig sukker og materialet som gir planteceller støtte.",
    "explanation": "Matvarer inneholder ofte flere karbohydrater. Poteter er rike på stivelse; melk inneholder laktose; vanlig bordsukker er sukrose; cellulose er en del av plantecellevegger.",
    "pairs": [
      {
        "left": "Potet",
        "right": "Stivelse"
      },
      {
        "left": "Vanlig melk",
        "right": "Laktose"
      },
      {
        "left": "Bordsukker",
        "right": "Sukrose"
      },
      {
        "left": "Plantecellevegg",
        "right": "Cellulose"
      }
    ]
  },
  {
    "id": "doc-surplus-carbs",
    "topic": "energy",
    "type": "choice",
    "level": 2,
    "title": "Overskudd av karbohydrater",
    "prompt": "Hva kan skje når tilførselen av energi fra karbohydrater over tid overstiger energiforbruket?",
    "hint": "Kroppen har både et begrenset karbohydratlager og et større energilager. Skill dette fra konsentrasjonen i blodet.",
    "explanation": "Lever og muskler har begrenset plass til glykogen. Ved vedvarende energioverskudd kan fettlagrene øke; dette avhenger av den samlede energibalansen, ikke bare ett næringsstoff.",
    "options": [
      "Glykogenlagre kan fylles, og energioverskudd kan bidra til økt fettlagring.",
      "Alt overskudd blir liggende som glukose i blodet uten regulering.",
      "Alle karbohydrater skilles uforandret ut i urinen.",
      "Karbohydratene kan bare lagres som cellulose."
    ],
    "answer": "Glykogenlagre kan fylles, og energioverskudd kan bidra til økt fettlagring."
  },
  {
    "id": "doc-hydrolysis-water",
    "topic": "carbs",
    "type": "open",
    "level": 2,
    "title": "Vann under fordøyelsen",
    "prompt": "En elev sier: «Vann bare løser opp maten. Det deltar ikke når store næringsstoffer deles opp.» Forklar hva som mangler i påstanden.",
    "hint": "Tenk på vannets oppgaver ved spalting, transport og temperaturregulering.",
    "explanation": "Sammenlign begrunnelsen din med modellsvaret. Andre presise formuleringer er like gode.",
    "model": "Vann er et løsemiddel og bidrar til transport, men trengs også når store næringsstoffer spaltes til mindre deler. Vann inngår i selve reaksjonene. Enzymer får disse reaksjonene til å gå raskere. Derfor er det ikke nok å beskrive vann som noe maten bare ligger i.",
    "checklist": [
      "Jeg nevner at vann har flere oppgaver.",
      "Jeg får fram at vann trengs når store næringsstoffer spaltes.",
      "Jeg skiller vannets rolle fra enzymenes rolle."
    ]
  },
  {
    "id": "doc-essential-word",
    "topic": "protein",
    "type": "choice",
    "level": 2,
    "title": "Essensielle aminosyrer",
    "prompt": "En oppgaveliste bruker uttrykket «essensielle proteiner». Hvilket utsagn presiserer begrepet riktig?",
    "hint": "Skill mellom hele proteiner og byggesteinene deres.",
    "explanation": "Kroppen bygger sine egne proteiner fra aminosyrer. Ni aminosyrer regnes som essensielle for voksne fordi kroppen ikke lager tilstrekkelig av dem selv. Et variert kosthold kan dekke behovet.",
    "options": [
      "Det er bestemte aminosyrer som er essensielle og må tilføres i kosten.",
      "Alle proteiner må komme ferdige fra animalsk mat.",
      "Essensiell betyr at kroppen produserer ekstra mye av stoffet.",
      "Essensielle aminosyrer gir ingen energi og inngår ikke i proteiner."
    ],
    "answer": "Det er bestemte aminosyrer som er essensielle og må tilføres i kosten."
  },
  {
    "id": "doc-enzyme-temperature",
    "topic": "protein",
    "type": "choice",
    "level": 2,
    "title": "Enzymer og temperatur",
    "prompt": "En eldre begrepsliste sier at enzymer får reaksjoner til å gå raskere «ved 37 °C». Hva er mest presist?",
    "hint": "Sammenlign et menneskelig fordøyelsesenzym med enzymer i organismer som lever i kaldt eller svært varmt miljø.",
    "explanation": "Enzymer har ulike optimale betingelser. Reaksjonsfarten endres med temperatur, og sterk varme kan denaturere proteinet. 37 °C er ingen universell grense for enzymer.",
    "options": [
      "Enzymer virker innenfor ulike temperatur- og pH-områder; mange menneskelige enzymer fungerer godt nær kroppstemperaturen.",
      "Alle enzymer virker bare ved nøyaktig 37 °C.",
      "Enzymer finnes bare hos mennesker.",
      "Enzymer brukes opp så snart temperaturen endres."
    ],
    "answer": "Enzymer virker innenfor ulike temperatur- og pH-områder; mange menneskelige enzymer fungerer godt nær kroppstemperaturen."
  },
  {
    "id": "doc-nitrogen",
    "topic": "protein",
    "type": "multi",
    "level": 2,
    "title": "Grunnstoffer i proteiner",
    "prompt": "Hvilke påstander er riktige? Velg alle riktige.",
    "hint": "Se for deg en aminosyre: hvilke grunnstoffer finnes i aminogruppen, og hvilke kan finnes i sidegruppen?",
    "explanation": "Aminosyrer inneholder nitrogen i aminogruppen. Noen aminosyrer inneholder også svovel. Proteiner skiller seg derfor fra den vanlige oversikten over karbohydrater og fett, som består av karbon, hydrogen og oksygen.",
    "options": [
      "Proteiner inneholder nitrogen i tillegg til karbon, hydrogen og oksygen.",
      "Noen aminosyrer inneholder også svovel.",
      "Alle proteiner består bare av karbon og hydrogen.",
      "Aminogruppen er en forklaring på at aminosyrer inneholder nitrogen."
    ],
    "answer": [
      "Proteiner inneholder nitrogen i tillegg til karbon, hydrogen og oksygen.",
      "Noen aminosyrer inneholder også svovel.",
      "Aminogruppen er en forklaring på at aminosyrer inneholder nitrogen."
    ]
  },
  {
    "id": "doc-rancidity",
    "topic": "fat",
    "type": "choice",
    "level": 2,
    "title": "Harskning",
    "prompt": "En matolje får etter lagring en ubehagelig lukt. Hvilken forklaring på oksidativ harskning er riktig?",
    "hint": "Tenk på oksygen, dobbeltbindinger og nye stoffer.",
    "explanation": "Ved oksidativ harskning dannes produkter som kan gi vond lukt og smak. Umettede fettsyrer er særlig utsatt; varme, lys og oksygen kan fremme prosessen.",
    "options": [
      "Oksygen reagerer med fettstoffer og danner blant annet luktende nedbrytingsprodukter.",
      "Alle fettsyrene blir til aminosyrer.",
      "Oljen tar opp vann og blir automatisk et protein.",
      "Fettet mister alle dobbeltbindinger uten noen kjemisk reaksjon."
    ],
    "answer": "Oksygen reagerer med fettstoffer og danner blant annet luktende nedbrytingsprodukter."
  },
  {
    "id": "doc-oil-storage",
    "topic": "fat",
    "type": "multi",
    "level": 2,
    "title": "Oppbevaring av olje",
    "prompt": "Hvilke tiltak kan bremse oksidativ harskning? Velg alle riktige.",
    "hint": "Hvilke omgivelser gir kjemiske reaksjoner mer fart eller gir fettet bedre tilgang til oksygen?",
    "explanation": "Lys, varme og tilgang på oksygen kan fremme oksidasjon. Kjølig og mørk lagring i lukket beholder kan derfor forlenge holdbarheten.",
    "options": [
      "Oppbevare oljen mørkt.",
      "Begrense kontakten med luft.",
      "Unngå unødig varme.",
      "La en åpen flaske stå varmt i sollys."
    ],
    "answer": [
      "Oppbevare oljen mørkt.",
      "Begrense kontakten med luft.",
      "Unngå unødig varme."
    ],
    "family": "rancidity"
  },
  {
    "id": "doc-hardening",
    "topic": "fat",
    "type": "choice",
    "level": 2,
    "title": "Herding av fett",
    "prompt": "Hva kan skje med fettet når planteolje herdes?",
    "hint": "Sammenlign egenskapene til mettet og umettet fett.",
    "explanation": "Ved herding kan fett med umettede fettsyrer bli fastere. Delvis herding kan også danne transfett. Det er denne sammenhengen mellom struktur og egenskaper som er viktig her.",
    "options": [
      "Noe umettet fett blir mer mettet, og fettet kan bli fastere.",
      "Alt fett blir til aminosyrer.",
      "Glyserol blir til glukose.",
      "Alle enkeltbindinger blir til dobbeltbindinger."
    ],
    "answer": "Noe umettet fett blir mer mettet, og fettet kan bli fastere."
  },
  {
    "id": "doc-cholesterol-role",
    "topic": "fat",
    "type": "choice",
    "level": 2,
    "title": "Kolesterol",
    "prompt": "Hvilket utsagn om kolesterol er mest presist?",
    "hint": "Skill mellom molekylets normale funksjoner og risiko knyttet til mengden i blodet.",
    "explanation": "Kolesterol er et nødvendig fettstoff som kroppen også lager selv. Mengden og fordelingen i blodets transportpartikler er relevant for helse; stoffet er ikke i seg selv bare «gift».",
    "options": [
      "Det inngår i cellemembraner og er utgangspunkt for blant annet steroidhormoner og gallesyrer.",
      "Det er bare et avfallsstoff som kroppen aldri trenger.",
      "Det er et protein som spalter fett i tarmen.",
      "Det er det samme som alle omega-3-fettsyrer."
    ],
    "answer": "Det inngår i cellemembraner og er utgangspunkt for blant annet steroidhormoner og gallesyrer."
  },
  {
    "id": "doc-ldl-replacement",
    "topic": "fat",
    "type": "choice",
    "level": 2,
    "title": "Fettkvalitet",
    "prompt": "Hvorfor kan det være gunstig å erstatte noe mettet fett med umettet fett?",
    "hint": "Skill mellom energiinnhold og virkningen av fettkvalitet.",
    "explanation": "Det er viktig hva mettet fett erstattes med. Å bytte noe mettet fett mot umettet fett kan bedre blodets innhold av fettstoffer. Begge gir omtrent like mye energi per gram.",
    "options": [
      "Det kan gi et gunstigere kolesterolnivå i blodet og redusere risikoen for hjerte- og karsykdom.",
      "Umettet fett har ingen energi.",
      "Alt umettet fett spaltes uten enzymer.",
      "Mettet fett inneholder alltid transfettsyrer."
    ],
    "answer": "Det kan gi et gunstigere kolesterolnivå i blodet og redusere risikoen for hjerte- og karsykdom."
  },
  {
    "id": "doc-essential-fat-sources",
    "topic": "fat",
    "type": "match",
    "level": 2,
    "title": "Fett i matvarer",
    "prompt": "Koble hver beskrivelse til en passende matvare.",
    "hint": "Se etter forskjellen mellom plantekilder, fisk og smør.",
    "explanation": "Valnøtter og fet fisk kan bidra med omega-3-fettsyrer. Rapsolje har mye umettet fett, mens smør har en høyere andel mettet fett. Matvarene inneholder flere typer fett; beskrivelsene peker på viktige forskjeller.",
    "pairs": [
      {
        "left": "Plantebasert kilde til omega-3",
        "right": "Valnøtter"
      },
      {
        "left": "Animalsk kilde til omega-3",
        "right": "Fet fisk"
      },
      {
        "left": "Mye umettet fett",
        "right": "Rapsolje"
      },
      {
        "left": "Mye mettet fett",
        "right": "Smør"
      }
    ]
  },
  {
    "id": "doc-ascorbic",
    "topic": "micro",
    "type": "fill",
    "level": 1,
    "title": "Askorbinsyre",
    "prompt": "Hvilket vitamin er askorbinsyre, og hvilken løselighetsgruppe tilhører det?",
    "hint": "Tenk på vitaminet som forbindes med skjørbuk og sitrusfrukter, og hvilken væske det løser seg i.",
    "explanation": "Askorbinsyre er vitamin C og er vannløselig. Vitaminet trengs blant annet i dannelsen av normalt bindevev.",
    "blanks": [
      {
        "label": "Vitamin",
        "answers": [
          "C",
          "vitamin C",
          "C-vitamin"
        ]
      },
      {
        "label": "Løselighet",
        "answers": [
          "vannløselig",
          "vannløselige vitaminer",
          "vann"
        ]
      }
    ]
  },
  {
    "id": "doc-d-sources",
    "topic": "micro",
    "type": "multi",
    "level": 1,
    "title": "Kilder til vitamin D",
    "prompt": "Hvilke kan bidra til vitamin D hos mennesker? Velg alle riktige.",
    "hint": "Vitaminet kan både tilføres utenfra og dannes i kroppen under bestemte forhold. Vurder hvert alternativ separat.",
    "explanation": "Vitamin D kan dannes i huden ved sollys og tilføres gjennom blant annet fet fisk og berikede matvarer. Hudproduksjonen varierer med årstid, breddegrad og andre forhold; oppgaven er ikke en anbefaling om soling.",
    "options": [
      "Dannelse i huden når den utsettes for tilstrekkelig sollys.",
      "Fet fisk.",
      "Matvarer tilsatt vitamin D.",
      "At kroppen omdanner vitamin C til vitamin D."
    ],
    "answer": [
      "Dannelse i huden når den utsettes for tilstrekkelig sollys.",
      "Fet fisk.",
      "Matvarer tilsatt vitamin D."
    ]
  },
  {
    "id": "doc-trace-meaning",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Mineral eller sporstoff",
    "prompt": "Hva skiller sporstoffer fra mineralstoffer som kalsium i denne inndelingen?",
    "hint": "Ordet «spor» handler om hvor mye som trengs, ikke om hvor viktig stoffet er.",
    "explanation": "Mineralstoffer omfatter uorganiske grunnstoffer kroppen trenger. Sporstoffer er betegnelsen på dem som trengs i små mengder, som jern, jod og selen. En bestemt mengdegrense er en lærebokkonvensjon, ikke en universell biologisk terskel.",
    "options": [
      "Sporstoffer trengs vanligvis i mindre mengder, men kan være like nødvendige.",
      "Sporstoffer er alltid organiske vitaminer.",
      "Sporstoffer gir mer energi per gram.",
      "Sporstoffer har ingen funksjon i menneskekroppen."
    ],
    "answer": "Sporstoffer trengs vanligvis i mindre mengder, men kan være like nødvendige."
  },
  {
    "id": "doc-micronutrient-sources",
    "topic": "micro",
    "type": "match",
    "level": 2,
    "title": "Funksjon og kilde",
    "prompt": "Koble næringsstoffet til en relevant funksjon og matkilde.",
    "hint": "Tenk på hemoglobin, skjoldbruskkjertel, knokler og bindevev. Hvilket stoff passer til hver funksjon?",
    "explanation": "Jern er nødvendig i hemoglobin; jod inngår i stoffskiftehormoner; kalsium er viktig i skjelettet; vitamin C er nødvendig for normalt bindevev. Matvarene er eksempler, ikke de eneste kildene.",
    "pairs": [
      {
        "left": "Jern",
        "right": "Oksygentransport; kjøtt og belgvekster"
      },
      {
        "left": "Jod",
        "right": "Stoffskiftehormoner; hvit fisk og melk"
      },
      {
        "left": "Kalsium",
        "right": "Skjelett; melk og kalsiumberikede plantedrikker"
      },
      {
        "left": "Vitamin C",
        "right": "Bindevev; frukt, bær og grønnsaker"
      }
    ]
  },
  {
    "id": "doc-iron-anemia",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Jernmangel",
    "prompt": "Hvordan kan jernmangel som fører til blodmangel gi redusert utholdenhet?",
    "hint": "Følg oksygenet fra lungene til en arbeidende muskel. Hvilket jernholdig protein frakter det?",
    "explanation": "Jern inngår i hemoglobin. Jernmangel kan gi mindre hemoglobin, slik at blodet frakter mindre oksygen. Tretthet alene kan ha mange årsaker og er ikke nok til å fastslå jernmangel.",
    "options": [
      "Mindre hemoglobin kan redusere blodets kapasitet til å transportere oksygen.",
      "Alle muskelceller mister straks mitokondriene.",
      "Jernet er selve energikilden i ATP.",
      "Jernmangel gjør at alt blodsukker forsvinner."
    ],
    "answer": "Mindre hemoglobin kan redusere blodets kapasitet til å transportere oksygen."
  },
  {
    "id": "doc-upper-limit",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Kroppens tålegrense",
    "prompt": "En elev tar flere høydosetilskudd med samme mineral. Hvilket utsagn er riktig?",
    "hint": "Skill mellom å dekke behovet og å overskride tålegrensen.",
    "explanation": "Kroppen har både behov og tålegrenser. Mat og ulike tilskudd kan bidra til samme stoff. «Naturlig» og «nødvendig» betyr ikke at større dose alltid er bedre.",
    "options": [
      "Et nødvendig stoff kan være skadelig når samlet dose blir for høy.",
      "Et nødvendig stoff er alltid ufarlig uansett dose.",
      "Mineraler kan ikke tas opp fra tabletter.",
      "Alle tilskudd gir ekstra energi."
    ],
    "answer": "Et nødvendig stoff kan være skadelig når samlet dose blir for høy."
  },
  {
    "id": "doc-antioxidant",
    "topic": "micro",
    "type": "choice",
    "level": 2,
    "title": "Antioksidanter",
    "prompt": "Hvilken beskrivelse av en antioksidant er mest presis?",
    "hint": "Del ordet i «anti» og «oksidant». Vurder en kjemisk funksjon uten å anta at en høy dose alltid gir helsegevinst.",
    "explanation": "Antioksidanter kan inngå i kroppens vern mot oksidativ skade. Det betyr ikke at høye doser antioksidanttilskudd gir bedre helse eller beskytter mot alle sykdommer.",
    "options": [
      "Et stoff som kan motvirke oksidasjon, blant annet ved å reagere med reaktive forbindelser.",
      "Et stoff som gjør at cellene ikke lenger trenger oksygen.",
      "Et enzym som alltid omdanner fett til protein.",
      "Et stoff som med sikkerhet forebygger alle sykdommer i høye doser."
    ],
    "answer": "Et stoff som kan motvirke oksidasjon, blant annet ved å reagere med reaktive forbindelser."
  },
  {
    "id": "doc-water-location",
    "topic": "micro",
    "type": "multi",
    "level": 1,
    "title": "Hvor er vann hovedbestanddelen?",
    "prompt": "Hvor er vann vanligvis hovedbestanddelen? Velg alle riktige.",
    "hint": "Ikke glem at også et materiale som virker fast, kan inneholde mest vann.",
    "explanation": "Alle fem består vanligvis hovedsakelig av vann. Også normal avføring inneholder mye vann, ofte rundt tre firedeler av massen. Andelen varierer, blant annet med tarmfunksjon og væskebalanse.",
    "options": [
      "Avføring",
      "Svette",
      "Blod",
      "Spytt",
      "Urin"
    ],
    "answer": [
      "Avføring",
      "Svette",
      "Blod",
      "Spytt",
      "Urin"
    ]
  },
  {
    "id": "doc-fluid-balance",
    "topic": "micro",
    "type": "open",
    "level": 2,
    "title": "Vann ved fysisk aktivitet",
    "prompt": "To elever trener like lenge, men den ene svetter mye mer. Hvorfor er ett fast antall liter drikke ikke nødvendigvis riktig for begge?",
    "hint": "Sammenlign vann som kommer inn gjennom både mat og drikke, med vann som forlater kroppen.",
    "explanation": "Sammenlign begrunnelsen din med modellsvaret. Andre presise formuleringer er like gode.",
    "model": "Behovet påvirkes av svettetap, temperatur, aktivitetsnivå, kroppsstørrelse og vann fra maten. Den som taper mer vann ved svette trenger vanligvis mer væske. Væskeinntak må ses sammen med tap; svært stort inntak uten tilsvarende behov er heller ikke gunstig.",
    "checklist": [
      "Jeg knytter økt behov til væsketap.",
      "Jeg nevner at mat også bidrar med vann.",
      "Jeg forklarer hvorfor behovet varierer mellom personer og situasjoner."
    ]
  },
  {
    "id": "doc-energy-100g",
    "topic": "energy",
    "type": "fill",
    "level": 2,
    "title": "Energi per 100 gram",
    "prompt": "En matvare inneholder 20 g fett, 20 g karbohydrat og 5 g protein per 100 g. Bruk 37 kJ/g for fett og 17 kJ/g for karbohydrat og protein. Regn ut energi per 100 g.",
    "hint": "Beregn energien fra hvert næringsstoff og legg sammen.",
    "explanation": "20 × 37 + 20 × 17 + 5 × 17 = 740 + 340 + 85 = 1165 kJ. Dette er en beregning med de oppgitte, avrundede energifaktorene.",
    "blanks": [
      {
        "label": "Energi per 100 g",
        "answers": [
          "1165"
        ],
        "unit": "kJ"
      }
    ]
  },
  {
    "id": "doc-energy-portion",
    "topic": "energy",
    "type": "fill",
    "level": 2,
    "title": "Energi i porsjonen",
    "prompt": "En matvare gir 1165 kJ per 100 g. Hvor mye energi gir en porsjon på 40 g?",
    "hint": "Finn hvor stor del 40 g er av 100 g.",
    "explanation": "40 g er 0,40 av 100 g. 1165 kJ × 0,40 = 466 kJ.",
    "blanks": [
      {
        "label": "Energi i 40 g",
        "answers": [
          "466"
        ],
        "unit": "kJ"
      }
    ],
    "family": "energy-calculation"
  },
  {
    "id": "doc-energy-units",
    "topic": "energy",
    "type": "fill",
    "level": 2,
    "title": "Kilokalorier og kilojoule",
    "prompt": "En etikett oppgir 250 kcal. Bruk 1 kcal = 4,184 kJ. Hvor mange kJ tilsvarer dette?",
    "hint": "Multipliser antall kcal med 4,184.",
    "explanation": "250 × 4,184 = 1046 kJ. I omtale av mat brukes «kalorier» ofte om kilokalorier (kcal), ikke enkeltkalorier (cal).",
    "blanks": [
      {
        "label": "Energi",
        "answers": [
          "1046"
        ],
        "unit": "kJ"
      }
    ],
    "family": "energy-calculation"
  },
  {
    "id": "doc-empty-calories",
    "topic": "energy",
    "type": "choice",
    "level": 2,
    "title": "Tomme kalorier",
    "prompt": "Hva betyr uttrykket «tomme kalorier» vanligvis?",
    "hint": "Sammenlign mengden energi med hvor mye vitaminer, mineraler og andre nødvendige næringsstoffer maten gir.",
    "explanation": "Uttrykket beskriver lav næringstetthet, ikke at energien er ubrukelig. Et variert kosthold må både dekke energibehovet og gi nok essensielle næringsstoffer.",
    "options": [
      "Mat eller drikke som gir mye energi i forhold til innholdet av nødvendige næringsstoffer.",
      "Energi som ikke kan brukes av kroppen.",
      "Et stoff som ikke inneholder kjemiske bindinger.",
      "Vannløselige vitaminer uten vann."
    ],
    "answer": "Mat eller drikke som gir mye energi i forhold til innholdet av nødvendige næringsstoffer."
  },
  {
    "id": "doc-atp-recharge",
    "topic": "energy",
    "family": "energy-atp",
    "type": "choice",
    "level": 2,
    "title": "ATP og ADP",
    "prompt": "Hvilket utsagn forklarer sammenligningen mellom ATP og et oppladbart batteri?",
    "hint": "Følg både energitilførselen og fosfatgruppen.",
    "explanation": "ATP er et kortvarig system for energioverføring. Når ATP spaltes til ADP og fosfat, kan energi overføres til arbeid i cellen. Glykogen og fett er mer langsiktige energilagre.",
    "options": [
      "Energi fra celleånding kan brukes til å danne ATP fra ADP og fosfat; ATP kan så drive energikrevende prosesser.",
      "ATP lagres for hele livet og kan bare brukes én gang.",
      "ADP blir til ATP uten at det krever energitilførsel.",
      "ATP er det samme som kroppens fettlager."
    ],
    "answer": "Energi fra celleånding kan brukes til å danne ATP fra ADP og fosfat; ATP kan så drive energikrevende prosesser."
  },
  {
    "id": "doc-muscle-liver-glycogen",
    "topic": "energy",
    "type": "choice",
    "level": 2,
    "title": "To glykogenlagre",
    "prompt": "Hva er en viktig forskjell mellom glykogen i lever og i muskler?",
    "hint": "Tenk på hvem lageret først og fremst forsyner: hele kroppen via blodet, eller den arbeidende muskelen.",
    "explanation": "Begge lagrer glukoseenheter som glykogen. Leveren kan frigjøre glukose til blodet, mens muskler hovedsakelig bruker sitt glykogen til eget energibehov.",
    "options": [
      "Leveren kan bidra til å holde blodsukkeret oppe; muskelglykogen brukes hovedsakelig i muskelen selv.",
      "Bare musklene kan lagre glykogen.",
      "Leverglykogen er bygd av aminosyrer.",
      "Muskelglykogen går uforandret over i blodet."
    ],
    "answer": "Leveren kan bidra til å holde blodsukkeret oppe; muskelglykogen brukes hovedsakelig i muskelen selv."
  },
  {
    "id": "doc-diabetes-types",
    "topic": "energy",
    "type": "match",
    "level": 2,
    "title": "Type 1 og type 2",
    "prompt": "Koble beskrivelsene til riktig tilstand.",
    "hint": "Skill mangel på produksjon fra nedsatt virkning i målcellene.",
    "explanation": "Ved type 1-diabetes lager kroppen for lite insulin. Ved type 2-diabetes reagerer cellene dårligere på insulinet, og etter hvert kan produksjonen også bli for liten. Begge kan gi for høyt blodsukker.",
    "pairs": [
      {
        "left": "Kroppen lager for lite insulin",
        "right": "Typisk type 1"
      },
      {
        "left": "Cellene reagerer dårligere på insulin",
        "right": "Typisk type 2"
      }
    ]
  },
  {
    "id": "doc-lactate",
    "topic": "energy",
    "family": "energy-aerobic-anaerobic",
    "type": "fill",
    "level": 1,
    "title": "Et stoff ved hardt muskelarbeid",
    "prompt": "Hvilket stoff dannes når musklene bryter ned glukose ved anaerob celleånding?",
    "blanks": [{"label": "Stoff", "answers": ["melkesyre", "laktat"]}],
    "hint": "Stoffet forbindes med kortvarig, hardt muskelarbeid.",
    "explanation": "Stoffet kalles ofte melkesyre. Det dannes ved anaerob nedbryting av glukose i musklene. Ubehag under hardt arbeid har flere årsaker; melkesyre som blir liggende i musklene, er ikke årsaken til stølhet dagen etter."
  },
  {
    "id": "doc-portal-route",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "title": "Transport fra tarmen",
    "prompt": "Hva beskriver vanlig transport av monosakkarider og aminosyrer etter opptak fra tynntarmen?",
    "hint": "Tenk på leverens rolle etter at næringsstoffene er tatt opp.",
    "explanation": "Monosakkarider og aminosyrer tas opp i blodet og fraktes til leveren. Mye av fettet går først via lymfen og deretter til blodet. Næringsstoffene kan så transporteres til cellene som bruker dem.",
    "options": [
      "Med blodet til leveren før videre fordeling.",
      "Som hele matbiter direkte til hjernen.",
      "Gjennom spiserøret til musklene.",
      "Gjennom gallegangen inn i galleblæren."
    ],
    "answer": "Med blodet til leveren før videre fordeling."
  },
  {
    "id": "doc-liver-functions",
    "topic": "digestion",
    "type": "multi",
    "level": 2,
    "title": "Leverens oppgaver",
    "prompt": "Hvilke oppgaver har leveren? Velg alle riktige.",
    "hint": "Skill mellom lever, galleblære og bukspyttkjertel, og mellom hormoner og fordøyelsesenzymer.",
    "explanation": "Leveren produserer galle, lagrer glykogen og har mange oppgaver i stoffskiftet. Insulin er et hormon fra bukspyttkjertelen, ikke et fordøyelsesenzym fra leveren.",
    "options": [
      "Produserer galle.",
      "Lagrer glukoseenheter som glykogen.",
      "Omsetter mange næringsstoffer og fremmede stoffer.",
      "Produserer insulin som sitt viktigste fordøyelsesenzym."
    ],
    "answer": [
      "Produserer galle.",
      "Lagrer glukoseenheter som glykogen.",
      "Omsetter mange næringsstoffer og fremmede stoffer."
    ]
  },
  {
    "id": "doc-colon",
    "topic": "digestion",
    "type": "choice",
    "level": 2,
    "title": "Tykktarmen",
    "prompt": "Hva er en viktig oppgave for tykktarmen?",
    "hint": "Hva er igjen etter at mesteparten av nærings- og vannopptaket i tynntarmen er ferdig?",
    "explanation": "Det meste av vannopptaket skjer i tynntarmen, men tykktarmen tar opp mer vann og salter. Dette bidrar til at avføringen får en fastere form. Tarmbakterier kan bryte ned noen typer fiber.",
    "options": [
      "Ta opp resterende vann og salter og bidra til å forme avføringen.",
      "Ta opp alt vann kroppen får i seg.",
      "Produsere pepsin til magesekken.",
      "Spalte alt cellulose til glukose med menneskelige enzymer."
    ],
    "answer": "Ta opp resterende vann og salter og bidra til å forme avføringen."
  },
  {
    "id": "doc-duodenum-cooperation",
    "topic": "digestion",
    "type": "open",
    "level": 2,
    "title": "Tolvfingertarmen",
    "prompt": "Surt mageinnhold med fett kommer til tolvfingertarmen. Forklar rollene til det basiske stoffet i bukspyttet, galle og fordøyelsesenzymer.",
    "hint": "Ta én rolle om gangen: pH, størrelsen på fettdråper og bindingene inne i fettmolekylene.",
    "explanation": "Sammenlign begrunnelsen din med modellsvaret. Andre presise formuleringer er like gode.",
    "model": "Det basiske stoffet i bukspyttet bidrar til å nøytralisere syren, slik at miljøet passer bedre for enzymene. Galle fordeler store fettdråper i mindre dråper og gir større samlet overflate. Enzymer spalter fettmolekylene til mindre deler. Galle er ikke selv et fettspaltende enzym.",
    "checklist": [
      "Jeg forklarer hvorfor syren nøytraliseres.",
      "Jeg knytter galle til finfordeling og større samlet overflate.",
      "Jeg skiller enzymenes spalting fra gallens virkning."
    ]
  }
];
