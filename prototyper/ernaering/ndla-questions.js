// Originale oppgaver med faglig inspirasjon fra NDLA. Kildeloggen ligger i docs/ernaering-ndla.md.
export const ndlaQuestions = [
  {
    id:'ndla-carbs-heating', topic:'carbs', type:'choice', level:2,
    title:'Stivelse i varmt vann',
    prompt:'Potetmel røres i kaldt vann og varmes deretter opp. Blandingen tykner. Hva forklarer dette best?',
    options:['Stivelseskorn tar opp vann og sveller ved oppvarming.','Alt stivelseprotein denaturerer.','Alle glukoseenhetene blir til cellulose.','Vannet omdannes kjemisk til fett.'],
    answer:'Stivelseskorn tar opp vann og sveller ved oppvarming.',
    hint:'Skill mellom svelling av stivelseskorn og spalting av bindingene i stivelsen.',
    explanation:'Ved gelatinisering tar stivelseskorn opp vann og mister sin ordnede struktur. Blandingen kan tykne uten at all stivelsen er spaltet til glukose.'
  },
  {
    id:'ndla-protein-nitrogen', topic:'protein', type:'choice', level:2,
    title:'Nitrogen fra aminosyrer',
    prompt:'Aminosyrer brukes som energikilde. Hvorfor må kroppen håndtere et nitrogenholdig avfallsstoff?',
    options:['Aminosyrer inneholder nitrogen som blant annet skilles ut som urea.','Alle karbonatomer blir til nitrogen under celleåndingen.','Nitrogenet lagres som glykogen.','Fordøyelsesenzymer omdanner oksygen til urea i munnen.'],
    answer:'Aminosyrer inneholder nitrogen som blant annet skilles ut som urea.',
    hint:'Se for deg aminogruppen før karbonskjelettet omsettes videre.',
    explanation:'Nitrogen må fjernes når overskudd av aminosyrer brytes ned. Leveren omdanner mye av dette nitrogenet til urea, som skilles ut gjennom nyrene.'
  },
  {
    id:'ndla-protein-enzyme-defect', topic:'protein', type:'choice', level:2,
    title:'Når en enzymreaksjon hemmes',
    prompt:'Et enzym omdanner stoff A til stoff B. En genvariant gjør enzymet svært lite aktivt. Hvilken direkte følge er mest sannsynlig hvis tilførselen av A fortsetter?',
    options:['A kan hope seg opp, mens dannelsen av B blir mindre.','B dannes raskere fordi enzymet mangler.','A og B må få samme konsentrasjon.','Alle andre enzymer mister straks funksjonen.'],
    answer:'A kan hope seg opp, mens dannelsen av B blir mindre.',
    hint:'Enzymet øker hastigheten i en bestemt reaksjon.',
    explanation:'Enzymmangel kan endre stoffmengdene i en reaksjonsvei. Fenylketonuri er et eksempel der omsetningen av aminosyren fenylalanin er påvirket. Oppgaven beskriver prinsippet, ikke diagnostikk.'
  },
  {
    id:'ndla-fat-membrane', topic:'fat', type:'choice', level:2,
    title:'To forskjellige lipider',
    prompt:'En elev setter likhetstegn mellom triglyserider og fosfolipider. Hvilken retting er best?',
    options:['Triglyserider er viktige energilagre; fosfolipider danner hovedstrukturen i cellemembraner.','Begge er proteiner med tre aminosyrer.','Bare triglyserider inneholder karbon.','Fosfolipider er vannmolekyler uten fettsyrer.'],
    answer:'Triglyserider er viktige energilagre; fosfolipider danner hovedstrukturen i cellemembraner.',
    hint:'Alle lipider har ikke helt samme oppbygning eller funksjon.',
    explanation:'Fosfolipider har en polar del og upolare fettsyrehaler. Dette gjør dem egnet til membraner. Triglyserider har tre fettsyrer bundet til glyserol og er særlig viktige som energilager.'
  },
  {
    id:'ndla-fat-fuels-together', topic:'energy', type:'choice', level:2,
    title:'Energikilder under aktivitet',
    prompt:'«Musklene kan ikke bruke fett før alt glykogenet er brukt opp.» Hva er den beste vurderingen?',
    options:['Påstanden er feil: fett og karbohydrater kan omsettes samtidig.','Påstanden er riktig ved all aktivitet.','Muskelceller kan aldri bruke fettsyrer.','Glykogen må først omdannes til kostfiber.'],
    answer:'Påstanden er feil: fett og karbohydrater kan omsettes samtidig.',
    hint:'Kroppen har flere aktive reaksjonsveier samtidig.',
    explanation:'Andelen energi fra fett og karbohydrater varierer blant annet med intensitet, varighet og tilgjengelige lagre. Det finnes ingen generell bryter som venter til alt glykogen er tomt.'
  },
  {
    id:'ndla-vitamin-coenzyme', topic:'micro', type:'choice', level:2,
    title:'Vitaminer og energiomsetning',
    prompt:'Et B-vitamin inngår i et koenzym som trengs ved energiomsetning. Hvorfor betyr ikke dette at vitaminet gir energi på samme måte som fett?',
    options:['Det hjelper reaksjonene, men regnes ikke som et energigivende næringsstoff.','Koenzymer er alltid triglyserider.','Vitaminet erstatter alle karbohydrater i maten.','Alle vitaminer omdannes direkte til glukose.'],
    answer:'Det hjelper reaksjonene, men regnes ikke som et energigivende næringsstoff.',
    hint:'Skill mellom et hjelpestoff og stoffet som brytes ned for å frigjøre energi.',
    explanation:'Flere vitaminer er forløpere til koenzymer. Behovet for slike hjelpestoffer gjør dem nødvendige, men vitaminer gir ikke kalorier slik fett, protein og karbohydrat gjør.'
  },
  {
    id:'ndla-vitamin-antioxidant', topic:'micro', type:'choice', level:2,
    title:'Fra cellefunksjon til helsepåstand',
    prompt:'Vitamin E kan virke som antioksidant. Hvilken slutning kan vi trekke av dette alene?',
    options:['Vitamin E kan beskytte cellekomponenter mot oksidasjon, men det beviser ikke at store tilskudd forebygger sykdom.','Jo større dose, desto bedre helse for alle.','Vitamin E gir mer energi enn fett.','Alle sykdommer skyldes mangel på vitamin E.'],
    answer:'Vitamin E kan beskytte cellekomponenter mot oksidasjon, men det beviser ikke at store tilskudd forebygger sykdom.',
    hint:'En kjemisk funksjon er ikke det samme som dokumentert effekt av et kosttilskudd.',
    explanation:'Det er nødvendig å skille mellom vitaminets funksjon i kroppen og helseeffekter av ekstra doser. Slike effekter må undersøkes særskilt.'
  },
  {
    id:'ndla-minerals-iodine', topic:'micro', type:'choice', level:2,
    title:'Jod og stoffskiftehormoner',
    prompt:'Hvilken sammenheng mellom et sporstoff og et hormon er riktig?',
    options:['Jod inngår i hormoner fra skjoldbruskkjertelen som regulerer stoffskiftet.','Jern bygges inn i insulin og gjør det til et vitamin.','Kalsium er energikilden i tyroksin.','Natrium erstatter alle essensielle aminosyrer.'],
    answer:'Jod inngår i hormoner fra skjoldbruskkjertelen som regulerer stoffskiftet.',
    hint:'Tenk på grunnstoffet som finnes i navnene jodid og jod.',
    explanation:'Jod er nødvendig for dannelse av blant annet tyroksin. Et sporstoff trengs i små mengder; liten mengde betyr ikke liten betydning.'
  },
  {
    id:'ndla-minerals-calcium', topic:'micro', type:'multi', level:2,
    title:'Kalsium utenfor skjelettet',
    prompt:'Hvilke prosesser krever kalsiumioner, i tillegg til oppbygging av skjelett og tenner? Velg alle riktige.',
    options:['Muskelsammentrekning','Blodets koagulasjon','Enkelte trinn i signaloverføring mellom nerveceller','Dannelse av glukose ved fotosyntese i menneskeceller'],
    answer:['Muskelsammentrekning','Blodets koagulasjon','Enkelte trinn i signaloverføring mellom nerveceller'],
    hint:'Mineralstoffer kan også ha regulerende funksjoner.',
    explanation:'Kalsium fungerer både som byggemateriale og som signalstoff i form av ioner. Menneskeceller driver ikke fotosyntese.'
  },
  {
    id:'ndla-water-ion-shell', topic:'micro', type:'choice', level:2,
    title:'Salt løst i vann',
    prompt:'Hvilken ende av vannmolekylene vender hovedsakelig inn mot et positivt natriumion når salt løses i vann?',
    options:['Oksygenenden, som har delvis negativ ladning.','Hydrogenendene, som har delvis positiv ladning.','Begge ender er positivt ladet.','Ingen: vannmolekylene spaltes alltid til hydrogen og oksygen.'],
    answer:'Oksygenenden, som har delvis negativ ladning.',
    hint:'Motsatte ladninger tiltrekker hverandre.',
    explanation:'Vann er polart. Vannmolekyler kan omgi ionene i et hydratiseringsskall. Rundt et negativt kloridion vender hydrogenendene hovedsakelig inn.'
  },
  {
    id:'ndla-water-humidity', topic:'micro', type:'choice', level:2,
    title:'Svette i fuktig luft',
    prompt:'Hvorfor kan svette kjøle mindre effektivt i svært fuktig luft enn i tørr luft ved samme temperatur?',
    options:['Mindre svette fordamper, så mindre varme overføres ved fordamping.','Svette avgir bare varme når den fryser.','Vann er ikke lenger polart i fuktig luft.','Svette må inneholde fett for å kunne kjøle.'],
    answer:'Mindre svette fordamper, så mindre varme overføres ved fordamping.',
    hint:'Det avgjørende er ikke bare at huden blir våt.',
    explanation:'Fordamping krever energi som kan tas som varme fra huden. Svette som drypper av, gir ikke den samme fordampingskjølingen.'
  },
  {
    id:'ndla-digestion-lymph', topic:'digestion', type:'choice', level:2,
    title:'Transport fra tynntarmen',
    prompt:'Hvilken sammenligning av opptatte næringsstoffer er mest presis?',
    options:['Monosakkarider går til blodet; mye langkjedet fett fraktes først i fettpartikler via lymfen.','Alt opptatt fett går som hele matbiter rett til blodet.','Aminosyrer lagres alltid i galleblæren.','Blod og lymfe bryter ned all stivelsen før opptak.'],
    answer:'Monosakkarider går til blodet; mye langkjedet fett fraktes først i fettpartikler via lymfen.',
    hint:'Tarmtotter inneholder både blodårer og lymfeårer.',
    explanation:'Etter opptak pakkes mye av det langkjedete fettet i kylomikroner i tarmcellene. Disse går via lymfen til blodet. Monosakkarider og aminosyrer går hovedsakelig direkte til blodkapillærene.'
  },
  {
    id:'ndla-metabolism-sort', topic:'energy', type:'sort', level:2,
    title:'Oppbygging og nedbryting',
    prompt:'Sorter celleprosessene. Alle er deler av stoffskiftet.',
    groups:['Oppbygging (anabolisme)','Nedbryting (katabolisme)'],
    items:[{label:'Aminosyrer settes sammen til et protein',group:'Oppbygging (anabolisme)'},{label:'Glukoseenheter settes sammen til glykogen',group:'Oppbygging (anabolisme)'},{label:'Glukose omsettes ved celleånding',group:'Nedbryting (katabolisme)'},{label:'Lagret fett spaltes til mindre bestanddeler',group:'Nedbryting (katabolisme)'}],
    hint:'Se på om større molekyler bygges eller brytes ned.',
    explanation:'Stoffskiftet omfatter begge typer prosesser. Oppbygging krever vanligvis energi; nedbryting kan overføre energi til blant annet ATP. Stoffskifte er mer enn fordøyelse.'
  },
  {
    id:'ndla-animation-conservation', topic:'carbs', type:'choice', level:2,
    title:'Kontroller en molekylanimasjon',
    prompt:'En animasjon viser to monosakkarider som danner et disakkarid og vann. Hva må være bevart fra før til etter reaksjonen?',
    options:['Antallet atomer av hvert grunnstoff.','Antallet molekyler av hver type.','Alle bindinger mellom atomene.','Formen til hvert molekyl.'],
    answer:'Antallet atomer av hvert grunnstoff.',
    hint:'Bindinger kan endres, men atomer forsvinner ikke i denne reaksjonen.',
    explanation:'En faglig modell må bevare atomene. Når vann avspaltes ved kondensasjon, skal vannets hydrogen- og oksygenatomer også være med i regnskapet.'
  },
  {
    id:'ndla-fehling-inference', topic:'carbs', type:'choice', level:2, figure:'ndla-fehling',
    title:'Tolk Fehlings test',
    prompt:'Alle prøvene er varmet med Fehlings væske. B gir mursteinsrødt bunnfall. Hva kan vi konkludere?',
    options:['B inneholder reduserende sukker; testen identifiserer ikke glukose alene.','B må være rent glukose.','A og C kan ikke inneholde noe karbohydrat.','Alle disakkarider gir negativ test.'],
    answer:'B inneholder reduserende sukker; testen identifiserer ikke glukose alene.',
    hint:'Også maltose og laktose kan gi positiv test.',
    explanation:'Fehlings test reagerer med flere reduserende sukkerarter. Vanlig sukrose gir normalt negativ test uten forutgående spalting. En negativ test utelukker derfor ikke karbohydrater.'
  },
  {
    id:'ndla-fehling-controls', topic:'carbs', type:'match', level:2,
    title:'Kontrollprøver i en sukkertest',
    prompt:'Koble kontrollprøvene til hva de hjelper oss å undersøke.',
    pairs:[{left:'Kjent glukoseløsning',right:'Om testen gir positivt utslag når reduserende sukker er til stede'},{left:'Rent vann',right:'Om utstyr eller reagenser gir falskt positivt utslag'}],
    hint:'En kontroll med kjent innhold gjør resultatet lettere å tolke.',
    explanation:'Positiv og negativ kontroll undersøker ulike feilkilder. Prøvene må behandles på samme måte som den ukjente prøven.'
  },
  {
    id:'ndla-iodine-reversible', topic:'carbs', type:'choice', level:2,
    title:'Jodfarge ved oppvarming',
    prompt:'En blåsvart stivelse–jod-blanding mister fargen ved oppvarming. Fargen kommer tilbake ved avkjøling. Hvilken slutning er best?',
    options:['Fargetapet alene viser ikke at stivelsen er spaltet til glukose.','All stivelsen ble først til glukose og så tilbake uten andre endringer.','Jodtesten påviser alle vitaminer.','Blåfargen betyr at det finnes protein.'],
    answer:'Fargetapet alene viser ikke at stivelsen er spaltet til glukose.',
    hint:'Den reversible endringen i farge er en viktig observasjon.',
    explanation:'Fargen avhenger av komplekset mellom jod og stivelsesstrukturen. Oppvarming kan endre dette uten at hele polysakkaridet er hydrolysert.'
  },
  {
    id:'ndla-biuret-observation', topic:'protein', type:'choice', level:2,
    title:'Biuret: blått eller fiolett?',
    prompt:'Etter tilsetting av kobbersulfat i basisk løsning er prøven fortsatt blå. Hvilken vurdering er riktig?',
    options:['Blåfargen alene beviser ikke protein; en positiv biuretreaksjon er fiolett.','All blåfarge er et sikkert tegn på protein.','Prøven må inneholde stivelse.','Testen måler energien i fett.'],
    answer:'Blåfargen alene beviser ikke protein; en positiv biuretreaksjon er fiolett.',
    hint:'Kobberløsningen er blå allerede før en positiv reaksjon.',
    explanation:'Biuretreaksjonen påviser peptidbindinger. En kjent proteinprøve og en vannprøve hjelper oss å skille positivt fargeomslag fra reagensets egen farge.'
  },
  {
    id:'ndla-pepsin-ph', topic:'digestion', type:'choice', level:2, figure:'ndla-pepsin',
    title:'Pepsin ved to pH-verdier',
    prompt:'Forsøket bruker like mye pepsin og eggehvite ved samme temperatur. Hva støttes av resultatene i figuren?',
    options:['Pepsin spalter raskere ved pH 2 enn ved pH 7 under disse betingelsene.','Pepsin har høyest mulig aktivitet ved akkurat pH 2 uansett temperatur.','Forskjellen skyldes at A inneholder mer pepsin enn B.','Ved pH 7 er aktiviteten nøyaktig null.'],
    answer:'Pepsin spalter raskere ved pH 2 enn ved pH 7 under disse betingelsene.',
    hint:'Hold konklusjonen til det som faktisk er sammenlignet.',
    explanation:'Pepsin er tilpasset surt miljø i magesekken. Forsøket sier ikke at alle fordøyelsesenzymer har samme pH-avhengighet.'
  },
  {
    id:'ndla-pepsin-control', topic:'digestion', type:'choice', level:2,
    title:'Undersøk effekten av temperatur',
    prompt:'Du vil teste temperaturens virkning på pepsin. Hvilket forsøksoppsett isolerer denne variabelen best?',
    options:['Lik pH, pepsinmengde og eggehvite, men ulike temperaturer.','Ulik pH og temperatur i alle glass.','Bare ett glass uten noen sammenligning.','Ulik enzymmengde og ulik størrelse på eggehvitebitene.'],
    answer:'Lik pH, pepsinmengde og eggehvite, men ulike temperaturer.',
    hint:'Endre én faktor og hold resten mest mulig likt.',
    explanation:'Kontrollerte betingelser gjør temperaturforskjellen til en rimelig forklaring på ulik reaksjonshastighet. Både pH, enzymmengde og overflate kan ellers påvirke resultatet.'
  },
  {
    id:'ndla-fat-extraction-mass', topic:'fat', type:'fill', level:2,
    title:'Beregn målt fettandel',
    prompt:'En prøve veier 20,0 g. Tom skål veier 42,0 g, og skål med tørt fettekstrakt veier 48,0 g. Anta at ekstraktet er rent fett.',
    blanks:[{label:'Masse fett (g)',answers:['6','6,0','6 g'],unit:'g'},{label:'Fett per 100 g prøve (g)',answers:['30','30,0','30 g'],unit:'g'}],
    hint:'Trekk fra skålens masse. Finn deretter andelen og gang med 100.',
    explanation:'Fettmassen er 48,0 − 42,0 = 6,0 g. Andelen blir 6,0/20,0 × 100 = 30 g fett per 100 g.'
  },
  {
    id:'ndla-fat-extraction-errors', topic:'fat', type:'match', level:2,
    title:'Feilkilder ved fettekstraksjon',
    prompt:'Koble hver feilkilde til virkningen på den beregnede fettmassen.',
    pairs:[{left:'Løsemiddel er igjen ved veiing',right:'For høy beregnet fettmasse'},{left:'En del av fettet blir igjen i matresten',right:'For lav beregnet fettmasse'}],
    hint:'Tenk på hva vekten faktisk registrerer i skålen.',
    explanation:'Rester av løsemiddel blir feilaktig regnet som fett. Ufullstendig ekstraksjon gjør at noe fett ikke kommer med i veiingen.'
  },
  {
    id:'ndla-vitamin-source-label', topic:'micro', type:'choice', level:2,
    title:'Vurder en vitaminkilde',
    prompt:'En plantedrikk brukes i stedet for melk. Hva er mest relevant når du vurderer om drikken bidrar med vitamin B12?',
    options:['Kontroller om den er tilsatt B12, og les oppgitt innhold per mengde.','Anta at alle plantedrikker naturlig har like mye B12 som melk.','Se bare på hvor søt drikken smaker.','Regn med at grønn farge viser B12-innholdet.'],
    answer:'Kontroller om den er tilsatt B12, og les oppgitt innhold per mengde.',
    hint:'Matvarens navn eller smak er ikke en næringsanalyse.',
    explanation:'Beriking varierer mellom produkter. Ved vurdering av kilder må både innhold og mengde tas med. Vanlige ufortifiserte plantevarer er ikke pålitelige B12-kilder.'
  },
  {
    id:'ndla-saliva-maltose', topic:'carbs', type:'choice', level:2,
    title:'Sukker etter amylasevirkning',
    prompt:'Stivelse behandles med spyttamylase og gir deretter positiv Fehlings test. Hvilken forklaring er tilstrekkelig?',
    options:['Det kan ha blitt dannet maltose, som er et reduserende disakkarid.','Alt stivelsen må ha blitt til glukose.','Amylase gjør jod om til protein.','En positiv test viser at det er dannet fett.'],
    answer:'Det kan ha blitt dannet maltose, som er et reduserende disakkarid.',
    hint:'Positiv Fehlings test er ikke særskilt for monosakkarider.',
    explanation:'Amylase spalter stivelse til mindre karbohydrater, blant annet maltose. En positiv test alene viser ikke at sluttproduktet utelukkende er glukose.'
  },
  {
    id:'ndla-saliva-compare', topic:'digestion', type:'choice', level:2,
    title:'Sammenlign stivelsesprøver',
    prompt:'A inneholder stivelse og vann. B inneholder like mye stivelse og aktivt spyttamylase. Etter lik tid ved samme temperatur gir A sterkere jodfarge enn B. Hva støtter dette?',
    options:['Mer av stivelsen er brutt ned i B.','B inneholdt nødvendigvis mer stivelse fra starten.','Jod påviser aminosyrer i B.','Stivelse kan ikke spaltes av enzymer.'],
    answer:'Mer av stivelsen er brutt ned i B.',
    hint:'Se etter forskjellen mellom prøvene før du tolker fargen.',
    explanation:'Når startmengde og andre betingelser er like, støtter svakere jodreaksjon at mindre stivelse gjenstår. Fargemålingen gir ikke alene identiteten til alle produktene.'
  },
  {
    id:'ndla-model-glands', topic:'digestion', type:'choice', level:2,
    title:'Rett en fordøyelsesmodell',
    prompt:'En modell lar maten gå fra magesekken gjennom leveren og videre til tynntarmen. Hvordan bør modellen endres?',
    options:['Maten skal gå til tynntarmen; leveren tilføyer galle via egne ganger.','Maten skal først gå gjennom bukspyttkjertelen.','Leveren bør tegnes som en del av spiserøret.','Tynntarmen må fjernes fordi opptak skjer bare i magesekken.'],
    answer:'Maten skal gå til tynntarmen; leveren tilføyer galle via egne ganger.',
    hint:'Skill mellom selve fordøyelseskanalen og tilknyttede kjertler.',
    explanation:'En nyttig modell må vise riktige forbindelser. Maten passerer ikke gjennom leveren, galleblæren eller bukspyttkjertelen.'
  },
  {
    id:'ndla-health-source', topic:'energy', type:'multi', level:2,
    title:'Vurder en kostholdspåstand',
    prompt:'Et innlegg hevder at én matvare «løser alle helseproblemer». Hva bør du undersøke før du godtar påstanden?',
    options:['Om påstanden støttes av flere gode studier.','Om avsenderen selger produktet.','Hvilken gruppe, mengde og helseeffekt som er undersøkt.','Om innlegget har mange likerklikk; det er tilstrekkelig bevis.'],
    answer:['Om påstanden støttes av flere gode studier.','Om avsenderen selger produktet.','Hvilken gruppe, mengde og helseeffekt som er undersøkt.'],
    hint:'Skill mellom dokumentasjon, interessekonflikter og popularitet.',
    explanation:'Ernæringspåstander må vurderes mot dokumentasjonen og hva den faktisk gjelder. Enkeltpersoners erfaringer og popularitet gir ikke alene grunnlag for universelle konklusjoner.'
  }
];
