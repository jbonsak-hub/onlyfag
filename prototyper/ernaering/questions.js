// Originale øvingsoppgaver basert på lærerens fem presentasjoner.
// Åpne svar vurderes av eleven med modellsvaret og sjekklisten.
export const questions = [
  {
    id: 'digestion-enzyme', topic: 'digestion', type: 'choice', level: 1,
    title: 'Hva gjør et enzym?',
    prompt: 'Hvilken beskrivelse av et fordøyelsesenzym er riktig?',
    options: ['Det får bestemte kjemiske reaksjoner til å gå raskere uten selv å bli brukt opp.', 'Det gir fra seg energi ved å bli brukt opp i hver reaksjon.', 'Det er en syre som kan spalte alle typer næringsstoffer.', 'Det frakter næringsstoffene fra tarmen til musklene.'],
    answer: 'Det får bestemte kjemiske reaksjoner til å gå raskere uten selv å bli brukt opp.',
    hint: 'Enzymer er katalysatorer. Tenk på både reaksjonsfart og om enzymet brukes opp.',
    explanation: 'Et enzym er en biologisk katalysator. Det øker reaksjonsfarten og kan brukes om igjen. Ulike enzymer virker på bestemte stoffer, så amylase kan ikke erstatte pepsin.'
  },
  {
    id: 'digestion-surface', topic: 'digestion', type: 'choice', level: 2,
    title: 'Hvorfor har tarmen folder?',
    prompt: 'Hva er den viktigste fordelen med folder, tarmtotter og mikrovilli i tynntarmen?',
    options: ['De gir større overflate for opptak av næringsstoffer.', 'De produserer saltsyren som bryter ned maten.', 'De gjør at hele maten kan gå direkte inn i blodet.', 'De hindrer at næringsstoffene kommer i kontakt med tarmveggen.'],
    answer: 'De gir større overflate for opptak av næringsstoffer.',
    hint: 'Sammenlign et flatt ark med et stort ark som er brettet sammen.',
    explanation: 'Folder, tarmtotter og mikrovilli øker kontaktflaten mellom tarminnholdet og tarmcellene. Det gir stor kapasitet for opptak. Store matmolekyler må vanligvis først spaltes til mindre enheter.'
  },
  {
    id: 'digestion-pancreatic-juice', topic: 'digestion', type: 'multi', level: 2,
    title: 'Bukspyttets to oppgaver',
    prompt: 'Hvilke to beskrivelser passer til bukspytt som tilføres tolvfingertarmen? Velg alle riktige.',
    options: ['Det inneholder enzymer som bidrar til å spalte næringsstoffer.', 'Det inneholder hydrogenkarbonat som bidrar til å nøytralisere surt mageinnhold.', 'Det inneholder galle som produseres i bukspyttkjertelen.', 'Det gjør tarminnholdet enda surere slik at pepsin virker best.'],
    answer: ['Det inneholder enzymer som bidrar til å spalte næringsstoffer.', 'Det inneholder hydrogenkarbonat som bidrar til å nøytralisere surt mageinnhold.'],
    hint: 'Mageinnholdet er surt. Mange av enzymene i tynntarmen trenger et annet miljø.',
    explanation: 'Bukspyttkjertelen lager både fordøyelsesenzymer og en væske med hydrogenkarbonat. Hydrogenkarbonatet motvirker syren fra magesekken. Galle kommer fra leveren, ikke fra bukspyttkjertelen.'
  },
  {
    id: 'digestion-mechanical-chemical', topic: 'digestion', type: 'sort', level: 1,
    title: 'Mindre biter eller mindre molekyler?',
    prompt: 'Sorter prosessene etter om de er mekanisk bearbeiding eller kjemisk nedbryting.',
    groups: ['Mekanisk bearbeiding', 'Kjemisk nedbryting'],
    items: [{ label: 'Tennene knuser maten', group: 'Mekanisk bearbeiding' }, { label: 'Magesekken elter maten', group: 'Mekanisk bearbeiding' }, { label: 'Amylase spalter stivelse', group: 'Kjemisk nedbryting' }, { label: 'Pepsin spalter proteiner', group: 'Kjemisk nedbryting' }, { label: 'Lipase spalter fettmolekyler', group: 'Kjemisk nedbryting' }],
    hint: 'Kjemisk nedbryting endrer molekylene ved å bryte kjemiske bindinger.',
    explanation: 'Tygging og elting deler og blander maten. Enzymer bryter bindinger i næringsstoffene, slik at det dannes mindre molekyler. De mekaniske prosessene gjør samtidig maten lettere tilgjengelig for enzymene.'
  },
  {
    id: 'digestion-food-route', topic: 'digestion', type: 'order', level: 1,
    title: 'Matens vei',
    prompt: 'Sett disse delene av fordøyelseskanalen i den rekkefølgen maten passerer dem. Tolvfingertarmen er her tatt med som en egen del før resten av tynntarmen.',
    items: ['Munn', 'Spiserør', 'Magesekk', 'Tolvfingertarm', 'Resten av tynntarmen', 'Tykktarm', 'Endetarm'],
    hint: 'Begynn der du tygger. Skill mellom matens vei og organer som leverer fordøyelsesvæske.',
    explanation: 'Maten følger fordøyelseskanalen. Lever, galleblære og bukspyttkjertel tilfører stoffer til kanalen, men maten passerer ikke gjennom disse organene. Tolvfingertarmen er den første delen av tynntarmen.'
  },
  {
    id: 'digestion-stomach-contents', topic: 'digestion', type: 'fill', level: 1,
    title: 'Magesaftens innhold',
    prompt: 'Skriv navnet på syren i magesaften og enzymet som begynner å spalte proteiner i magesekken.',
    blanks: [{ label: 'Syren i magesaften', answers: ['saltsyre', 'hcl', 'hydrogenklorid'] }, { label: 'Enzymet som spalter proteiner', answers: ['pepsin'] }],
    hint: 'Syren har formelen HCl. Enzymnavnet begynner på p.',
    explanation: 'Saltsyre gir lav pH og bidrar til å denaturere proteiner og hemme mange mikroorganismer. Pepsin virker i det sure miljøet og spalter proteiner til kortere peptider. Slim beskytter mageveggen.'
  },
  {
    id: 'digestion-peristalsis', topic: 'digestion', type: 'fill', level: 1,
    title: 'Transport i spiserøret',
    prompt: 'Hva kalles bølgene av muskelsammentrekninger som skyver maten gjennom spiserøret?',
    blanks: [{ label: 'Navn på bevegelsene', answers: ['peristaltikk', 'peristaltiske bevegelser', 'peristaltiske rørsler', 'peristaltisk bevegelse'] }],
    hint: 'Maten går videre fordi muskler trekker seg sammen i bølger, ikke bare på grunn av tyngdekraften.',
    explanation: 'Peristaltikk er koordinerte bølger av muskelsammentrekninger som flytter innholdet i fordøyelseskanalen. Derfor er transporten i spiserøret mer enn at maten bare faller nedover.'
  },
  {
    id: 'digestion-enzyme-match', topic: 'digestion', type: 'match', level: 2,
    title: 'Hvilket enzym virker på hva?',
    prompt: 'Koble hvert enzym til stoffet eller stoffene det spalter.',
    pairs: [{ left: 'Amylase', right: 'Stivelse' }, { left: 'Pepsin', right: 'Proteiner i magesekken' }, { left: 'Laktase', right: 'Laktose' }, { left: 'Sukrase', right: 'Sukrose' }, { left: 'Lipase', right: 'Fettmolekyler' }],
    hint: 'Noen av enzymnavnene ligner navnet på stoffet de spalter.',
    explanation: 'Enzymene har bestemte oppgaver. Amylase virker på stivelse, mens laktase og sukrase spalter hvert sitt disakkarid. Pepsin starter proteinspaltingen i magesekken, og lipase spalter fett.'
  },
  {
    id: 'digestion-absorption-explain', topic: 'digestion', type: 'open', level: 2,
    title: 'Fordøyelse og opptak',
    prompt: 'En elev sier: «Fordøyelse betyr at maten går rett inn i blodet fra magesekken.» Forklar hva eleven blander sammen, og beskriv kort hva som skjer med et protein i maten.',
    model: 'Fordøyelse omfatter mekanisk bearbeiding og kjemisk nedbryting. Et protein spaltes først til kortere peptider i magesekken og videre til mindre enheter i tynntarmen. Aminosyrer tas opp gjennom tarmcellene og føres videre i blodet. Opptak er altså en annen prosess enn nedbryting, og hovedopptaket av næringsstoffer skjer i tynntarmen.',
    checklist: ['Jeg skiller mellom nedbryting og opptak.', 'Jeg får fram at proteiner må spaltes til mindre enheter.', 'Jeg plasserer hovedopptaket i tynntarmen og beskriver videre transport i blodet.'],
    hint: 'Følg proteinmolekylet fra stor kjede til små byggesteiner og deretter gjennom tarmveggen.',
    explanation: 'Bruk modellsvaret som støtte når du vurderer forklaringen din. Du trenger ikke bruke de samme ordene, men må skille mellom fordøyelse, opptak og transport.'
  },
  {
    id: 'digestion-process-absorption', topic: 'digestion', type: 'process', level: 1,
    title: 'Hvor tas mest næring opp?',
    prompt: 'Velg organet der hovedopptaket av monosakkarider og aminosyrer skjer.',
    answer: ['small'],
    hint: 'Se etter organet som har folder og tarmtotter.',
    explanation: 'Tynntarmen har stor overflate for opptak. Monosakkarider og aminosyrer passerer gjennom tarmcellene og går videre til blodet. Det er ikke magesekken som står for hovedopptaket.'
  },
  {
    id: 'digestion-process-pancreatic-production', topic: 'digestion', type: 'process', level: 1,
    title: 'Hvor lages bukspytt?',
    prompt: 'Velg organet som produserer bukspytt med fordøyelsesenzymer og hydrogenkarbonat.',
    answer: ['pancreas'],
    hint: 'Navnet på væsken forteller hvilket organ den kommer fra.',
    explanation: 'Bukspyttkjertelen produserer bukspytt og sender det gjennom en utførselsgang til tolvfingertarmen. Skill mellom stedet en væske produseres og stedet den virker.'
  },

  {
    id: 'carbs-photosynthesis', topic: 'carbs', type: 'choice', level: 1,
    title: 'Fra sollys til sukker',
    prompt: 'Hvilken reaksjonslikning beskriver fotosyntese? Lysenergi er nødvendig for reaksjonen.',
    options: ['6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂', 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O', 'Glukose + fruktose → sukrose + vann', 'Glyserol + tre fettsyrer → fett + vann'],
    answer: '6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂',
    hint: 'Planter bruker karbondioksid og vann og danner glukose og oksygen.',
    explanation: 'I fotosyntesen omdanner planter lysenergi til kjemisk energi i organiske stoffer. Den balanserte oversiktslikningen bruker seks karbondioksidmolekyler og seks vannmolekyler per glukosemolekyl.'
  },
  {
    id: 'carbs-cellulose', topic: 'carbs', type: 'choice', level: 2,
    title: 'Samme byggestein, ulike egenskaper',
    prompt: 'Både stivelse og cellulose er bygd av glukose. Hvorfor kan våre fordøyelsesenzymer spalte stivelse, men ikke cellulose?',
    options: ['Glukoseenhetene er bundet sammen på forskjellige måter, og enzymene våre passer ikke til bindingene i cellulose.', 'Cellulose inneholder ingen kjemiske bindinger.', 'Cellulose består av aminosyrer i stedet for glukose.', 'Stivelse er alltid vannløselig, mens cellulose alltid består av fett.'],
    answer: 'Glukoseenhetene er bundet sammen på forskjellige måter, og enzymene våre passer ikke til bindingene i cellulose.',
    hint: 'Enzymer er spesifikke. Det er ikke nok at byggesteinene er de samme.',
    explanation: 'Forskjellige bindinger mellom glukoseenhetene gir forskjellige strukturer. Vi mangler enzymet cellulase og kan derfor ikke spalte cellulose slik vi spalter stivelse. Cellulose er en type kostfiber.'
  },
  {
    id: 'carbs-fibre', topic: 'carbs', type: 'multi', level: 2,
    title: 'Kostfiber har en funksjon',
    prompt: 'Hvilke påstander om kostfiber er riktige? Velg alle riktige.',
    options: ['Cellulose er en type kostfiber.', 'Kostfiber kan bidra til volum i tarminnholdet og normal tarmfunksjon.', 'Noen typer kostfiber kan brytes ned av bakterier i tykktarmen.', 'Alle typer kostfiber spaltes til glukose av amylase i munnen.'],
    answer: ['Cellulose er en type kostfiber.', 'Kostfiber kan bidra til volum i tarminnholdet og normal tarmfunksjon.', 'Noen typer kostfiber kan brytes ned av bakterier i tykktarmen.'],
    hint: 'Skill mellom våre egne fordøyelsesenzymer og prosesser som tarmbakterier kan utføre.',
    explanation: 'Kostfiber er ikke én enkelt forbindelse. Menneskets enzymer fordøyer ikke fiber på samme måte som stivelse, men noen fibertyper fermenteres av tarmbakterier. Fiber kan også påvirke vanninnhold og volum i tarminnholdet.'
  },
  {
    id: 'carbs-classification', topic: 'carbs', type: 'sort', level: 1,
    title: 'Én, to eller mange sukkerenheter?',
    prompt: 'Sorter karbohydratene etter antall sukkerenheter.',
    groups: ['Monosakkarid', 'Disakkarid', 'Polysakkarid'],
    items: [{ label: 'Glukose', group: 'Monosakkarid' }, { label: 'Fruktose', group: 'Monosakkarid' }, { label: 'Galaktose', group: 'Monosakkarid' }, { label: 'Sukrose', group: 'Disakkarid' }, { label: 'Laktose', group: 'Disakkarid' }, { label: 'Maltose', group: 'Disakkarid' }, { label: 'Stivelse', group: 'Polysakkarid' }, { label: 'Glykogen', group: 'Polysakkarid' }, { label: 'Cellulose', group: 'Polysakkarid' }],
    hint: 'Mono betyr én, di betyr to, og poly betyr mange.',
    explanation: 'Monosakkarider er enkle sukkerenheter. Disakkarider består av to slike enheter, og polysakkarider har lange kjeder. Navnet sier noe om oppbygningen, ikke om en matvare samlet sett er «sunn» eller «usunn».'
  },
  {
    id: 'carbs-from-plant-to-blood', topic: 'carbs', type: 'order', level: 2,
    title: 'Følg karbonet fra plante til blod',
    prompt: 'Sett dette forenklede forløpet i riktig rekkefølge: fra fotosyntese til opptak av karbohydrat fra en brødskive.',
    items: ['Planten danner glukose ved fotosyntese', 'Planten setter glukose sammen til stivelse i kornet', 'Vi spiser brød som inneholder stivelsen', 'Enzymer spalter stivelsen videre til monosakkarider', 'Monosakkarider tas opp fra tynntarmen til blodet'],
    hint: 'Begynn hos planten, og avslutt etter at næringsstoffet har passert tarmveggen.',
    explanation: 'Planten bygger opp karbohydrat ved fotosyntese og kan lagre det som stivelse. Fordøyelsen vår spalter stivelsen til små sukkerenheter som kan tas opp. Oppbygning, nedbryting og opptak er ulike trinn.'
  },
  {
    id: 'carbs-condensation', topic: 'carbs', type: 'fill', level: 1,
    title: 'Bygg sukrose',
    prompt: 'Glukose og fruktose bindes sammen i en kondensasjonsreaksjon. Skriv navnet på disakkaridet og det lille molekylet som frigjøres.',
    blanks: [{ label: 'Disakkaridet som dannes', answers: ['sukrose', 'sakkarose'] }, { label: 'Det lille molekylet som frigjøres', answers: ['vann', 'h2o', 'h₂o'] }],
    hint: 'Produktet er vanlig sukker. I en kondensasjonsreaksjon spaltes et lite molekyl av.',
    explanation: 'Glukose + fruktose gir sukrose + vann. Når bindingen senere brytes ved hydrolyse, brukes vann. Sukrose er derfor ikke et monosakkarid selv om det ofte bare kalles sukker.'
  },
  {
    id: 'carbs-glucose-formula', topic: 'carbs', type: 'fill', level: 1,
    title: 'Les formelen til glukose',
    prompt: 'Glukose har molekylformelen C₆H₁₂O₆. Hvor mange atomer av hvert grunnstoff finnes i ett glukosemolekyl?',
    blanks: [{ label: 'Karbonatomer', answers: ['6', 'seks'] }, { label: 'Hydrogenatomer', answers: ['12', 'tolv'] }, { label: 'Oksygenatomer', answers: ['6', 'seks'] }],
    hint: 'Det lille tallet etter hvert grunnstoffsymbol viser antallet atomer.',
    explanation: 'Ett glukosemolekyl inneholder 6 karbonatomer, 12 hydrogenatomer og 6 oksygenatomer. Fruktose og galaktose har samme molekylformel, men atomene er ordnet forskjellig.'
  },
  {
    id: 'carbs-functions', topic: 'carbs', type: 'match', level: 1,
    title: 'Karbohydrat og funksjon',
    prompt: 'Koble hvert karbohydrat til beskrivelsen som passer best.',
    pairs: [{ left: 'Stivelse', right: 'Karbohydratlager i planter' }, { left: 'Glykogen', right: 'Karbohydratlager i lever og muskler' }, { left: 'Cellulose', right: 'Byggemateriale i plantecellevegger' }, { left: 'Laktose', right: 'Disakkarid som finnes i melk' }, { left: 'Glukose', right: 'Monosakkarid som inngår i blodsukkeret' }],
    hint: 'Tenk på hvor stoffet finnes og hvilken rolle det har der.',
    explanation: 'Stivelse og glykogen er lagringsstoffer, mens cellulose gir struktur i planter. Alle tre er polysakkarider. Laktose er melkesukker, og glukose er en viktig energikilde for cellene.'
  },
  {
    id: 'carbs-food-explain', topic: 'carbs', type: 'open', level: 2,
    title: 'Brød, sukker og fiber',
    prompt: 'En elev sier: «Alle karbohydrater er bare sukker og oppfører seg likt i kroppen.» Forklar hvorfor påstanden er for enkel. Bruk stivelse, sukrose og cellulose som eksempler.',
    model: 'Karbohydrater omfatter både små sukkermolekyler og lange kjeder. Sukrose er et disakkarid av glukose og fruktose, mens stivelse og cellulose er polysakkarider av glukose. Sukrose og stivelse kan spaltes av våre fordøyelsesenzymer, men vi mangler enzymer for å spalte cellulose. Cellulose er kostfiber og har andre funksjoner i fordøyelsen. En matvare kan dessuten inneholde flere næringsstoffer samtidig.',
    checklist: ['Jeg bruker minst to ulike typer karbohydrat i forklaringen.', 'Jeg forklarer at oppbygning og bindinger påvirker nedbrytingen.', 'Jeg får fram at cellulose er fiber og ikke fordøyes som stivelse.'],
    hint: 'Sammenlign både antall sukkerenheter og måten enhetene er bundet sammen på.',
    explanation: 'Vurder faginnholdet i svaret ditt, ikke om formuleringen er identisk med modellsvaret. Et godt svar kobler molekylenes oppbygning til hva kroppen kan gjøre med dem.'
  },
  {
    id: 'carbs-process-breakdown', topic: 'carbs', type: 'process', level: 2,
    title: 'Hvor spaltes stivelse?',
    prompt: 'Velg de to områdene der stivelse spaltes av amylase under fordøyelsen. Tynntarmen omfatter her også tolvfingertarmen.',
    answer: ['mouth', 'small'],
    hint: 'Spytt inneholder amylase. Senere tilføres ny amylase med bukspyttet.',
    explanation: 'Spaltingen begynner i munnen og fortsetter i tynntarmen, blant annet med amylase fra bukspyttkjertelen. Det sure miljøet i magesekken hemmer spyttamylasen. Videre enzymtrinn gir monosakkarider som kan tas opp.'
  },

  {
    id: 'protein-building-block', topic: 'protein', type: 'choice', level: 1,
    title: 'Hva er et protein bygd av?',
    prompt: 'Hvilke byggesteiner bindes sammen til proteiner?',
    options: ['Aminosyrer', 'Monosakkarider', 'Fettsyrer og glyserol', 'Vitaminer og mineraler'],
    answer: 'Aminosyrer',
    hint: 'Byggesteinene har en aminogruppe og en syregruppe.',
    explanation: 'Proteiner er kjeder av aminosyrer som er bundet sammen med peptidbindinger. Hvilke aminosyrer som inngår, rekkefølgen deres og foldingen av kjeden påvirker proteinets egenskaper.'
  },
  {
    id: 'protein-essential', topic: 'protein', type: 'choice', level: 1,
    title: 'Hva betyr essensiell?',
    prompt: 'Hva betyr det at en aminosyre er essensiell for mennesket?',
    options: ['Kroppen lager den ikke i tilstrekkelig mengde, så den må tilføres gjennom kosten.', 'Den finnes bare i animalske matvarer.', 'Den kan ikke inngå i enzymer.', 'Den er den eneste aminosyren som kan gi energi.'],
    answer: 'Kroppen lager den ikke i tilstrekkelig mengde, så den må tilføres gjennom kosten.',
    hint: 'Ordet handler om hva kroppen kan lage selv, ikke om hvor viktig aminosyren er.',
    explanation: 'Ni av de tjue vanlige aminosyrene regnes som essensielle for voksne. De kan finnes i både plantebaserte og animalske proteinkilder. Også de andre aminosyrene er nødvendige, men kroppen kan normalt lage dem selv.'
  },
  {
    id: 'protein-denaturation', topic: 'protein', type: 'multi', level: 2,
    title: 'Når et protein denaturerer',
    prompt: 'Hvilke beskrivelser av denaturering er riktige? Velg alle riktige.',
    options: ['Proteinets romlige form forandres.', 'Varme eller endret pH kan utløse denaturering.', 'Proteinets funksjon kan bli endret når formen endres.', 'Alle peptidbindingene blir automatisk brutt, slik at bare frie aminosyrer står igjen.'],
    answer: ['Proteinets romlige form forandres.', 'Varme eller endret pH kan utløse denaturering.', 'Proteinets funksjon kan bli endret når formen endres.'],
    hint: 'Skill mellom å endre foldingen av en kjede og å klippe kjeden i små biter.',
    explanation: 'Denaturering forandrer foldingen og kan ødelegge funksjonen til et protein. Aminosyrekjeden blir vanligvis ikke spaltet til frie aminosyrer av denatureringen alene. Enzymatisk hydrolyse bryter peptidbindinger.'
  },
  {
    id: 'protein-sources', topic: 'protein', type: 'sort', level: 1,
    title: 'Proteiner fra planter og dyr',
    prompt: 'Sorter proteinkildene etter hvor de kommer fra.',
    groups: ['Plantebasert kilde', 'Animalsk kilde'],
    items: [{ label: 'Linser', group: 'Plantebasert kilde' }, { label: 'Bønner', group: 'Plantebasert kilde' }, { label: 'Tofu av soya', group: 'Plantebasert kilde' }, { label: 'Havre', group: 'Plantebasert kilde' }, { label: 'Egg', group: 'Animalsk kilde' }, { label: 'Fisk', group: 'Animalsk kilde' }, { label: 'Melk', group: 'Animalsk kilde' }],
    hint: 'En proteinkilde trenger ikke komme fra et dyr.',
    explanation: 'Både planter og dyr gir protein. Proteinkvalitet handler blant annet om sammensetningen av essensielle aminosyrer og hvor godt proteinet fordøyes. Et variert utvalg av kilder kan utfylle hverandre.'
  },
  {
    id: 'protein-route', topic: 'protein', type: 'order', level: 2,
    title: 'Fra matprotein til kroppens protein',
    prompt: 'Sett dette forenklede forløpet i riktig rekkefølge.',
    items: ['Vi spiser mat som inneholder protein', 'Pepsin begynner å spalte proteinet i magesekken', 'Enzymer i tynntarmen spalter videre til mindre enheter', 'Aminosyrer tas opp og føres videre med blodet', 'Celler bruker aminosyrer til å bygge nye proteiner'],
    hint: 'Matens proteiner blir ikke satt uendret inn i musklene. Byggesteinene brukes på nytt.',
    explanation: 'Proteiner i maten spaltes før kroppen bruker byggesteinene. Aminosyrene kan settes sammen i nye rekkefølger til blant annet muskelproteiner, transportproteiner, enzymer og hormoner.'
  },
  {
    id: 'protein-peptide-bond', topic: 'protein', type: 'fill', level: 1,
    title: 'Bindingen i proteinkjeden',
    prompt: 'Hva kalles bindingen mellom aminosyrer i et protein, og hvilket lite molekyl brukes når denne bindingen spaltes ved hydrolyse?',
    blanks: [{ label: 'Binding mellom aminosyrer', answers: ['peptidbinding', 'peptidbindingen', 'peptidbindinger'] }, { label: 'Molekyl som brukes ved hydrolyse', answers: ['vann', 'h2o', 'h₂o'] }],
    hint: 'Hydro betyr vann. Den andre delen av ordet hydrolyse viser til spalting.',
    explanation: 'Aminosyrer bindes sammen med peptidbindinger. Ved hydrolyse brukes vann til å bryte bindingene. Fordøyelsesenzymene katalyserer slike spaltningsreaksjoner.'
  },
  {
    id: 'protein-amino-count', topic: 'protein', type: 'fill', level: 1,
    title: 'Tjue byggesteiner',
    prompt: 'Proteiner bygges vanligvis av tjue ulike aminosyrer. Hvor mange regnes som essensielle for voksne, og hvor mange av de tjue er da igjen?',
    blanks: [{ label: 'Essensielle aminosyrer', answers: ['9', 'ni'] }, { label: 'De andre aminosyrene', answers: ['11', 'elleve'] }],
    hint: 'Trekk antallet essensielle fra tjue.',
    explanation: 'Ni regnes som essensielle for voksne, og tjue minus ni er elleve. Behov og kroppens evne til å lage enkelte aminosyrer kan variere med livsfase og situasjon, men 9 av 20 er hovedinndelingen vi bruker her.'
  },
  {
    id: 'protein-functions', topic: 'protein', type: 'match', level: 1,
    title: 'Proteiner med ulike jobber',
    prompt: 'Koble hvert protein til en funksjon.',
    pairs: [{ left: 'Hemoglobin', right: 'Binder og transporterer oksygen i blodet' }, { left: 'Keratin', right: 'Gir struktur til blant annet hår og negler' }, { left: 'Amylase', right: 'Katalyserer spalting av stivelse' }, { left: 'Insulin', right: 'Hormon som bidrar til å senke blodsukkeret' }, { left: 'Kollagen', right: 'Gir styrke til bindevev' }],
    hint: 'Proteiner har flere oppgaver enn bare å bygge muskler.',
    explanation: 'Proteiner kan være byggemateriale, enzymer, transportstoffer og signalstoffer. Funksjonene avhenger av molekylenes form og kjemiske egenskaper.'
  },
  {
    id: 'protein-shape-explain', topic: 'protein', type: 'open', level: 2,
    title: 'Hvorfor betyr formen noe?',
    prompt: 'Forklar hvordan et enzym kan miste funksjonen når det varmes kraftig opp, selv om det fortsatt består av de samme aminosyrene.',
    model: 'Enzymets aminosyrekjede er foldet til en bestemt romlig form. Denne formen gir et aktivt sete der bestemte stoffer kan bindes. Kraftig oppvarming kan forstyrre bindinger og samspill som holder foldingen på plass. Da denaturerer enzymet, og det aktive setet kan endre form slik at enzymet ikke lenger virker som før. Det krever ikke at hele aminosyrekjeden er spaltet.',
    checklist: ['Jeg kobler proteinets romlige form til funksjonen.', 'Jeg forklarer at varme kan føre til denaturering.', 'Jeg skiller mellom endret folding og spalting av peptidbindinger.'],
    hint: 'Tenk på formen til det aktive setet og forskjellen på å folde ut og å klippe opp.',
    explanation: 'Et godt svar forklarer en årsakssammenheng. Det er ikke tilstrekkelig bare å skrive at «varme ødelegger protein».'
  },
  {
    id: 'protein-process-breakdown', topic: 'protein', type: 'process', level: 2,
    title: 'Hvor spaltes proteiner?',
    prompt: 'Velg de to områdene der enzymer spalter proteiner og peptider under fordøyelsen. Tynntarmen omfatter her også tolvfingertarmen.',
    answer: ['stomach', 'small'],
    hint: 'Pepsin begynner arbeidet. Andre proteaser og peptidaser fortsetter senere.',
    explanation: 'Pepsin starter proteinspaltingen i magesekken. I tynntarmen fortsetter enzymer fra bukspyttkjertelen og tarmveggen nedbrytingen, slik at små enheter kan tas opp.'
  },

  {
    id: 'fat-triglyceride', topic: 'fat', type: 'choice', level: 1,
    title: 'Bygg et fettmolekyl',
    prompt: 'Hva er ett triglyserid bygd av?',
    options: ['Ett glyserolmolekyl og tre fettsyrer', 'Tre glyserolmolekyler og én fettsyre', 'Én glukose og tre aminosyrer', 'Bare en lang kjede av glukosemolekyler'],
    answer: 'Ett glyserolmolekyl og tre fettsyrer',
    hint: 'Tri viser til antallet fettsyrer som er bundet til glyserol.',
    explanation: 'Det meste av fettet i maten er triglyserider. Glyserol har tre OH-grupper som kan danne esterbindinger til tre fettsyrer. Ved dannelsen av disse tre bindingene frigjøres tre vannmolekyler.'
  },
  {
    id: 'fat-bile-lipase', topic: 'fat', type: 'choice', level: 2,
    title: 'Galle og lipase gjør ulike jobber',
    prompt: 'Hva beskriver best samarbeidet mellom galle og lipase?',
    options: ['Galle finfordeler fettdråper, og lipase spalter fettmolekyler.', 'Galle spalter fettmolekyler, og lipase lagrer gallen.', 'Galle og lipase er to navn på samme enzym.', 'Galle gjør fett om til glukose før lipase kan virke.'],
    answer: 'Galle finfordeler fettdråper, og lipase spalter fettmolekyler.',
    hint: 'Skill mellom å dele en dråpe i mindre dråper og å bryte bindinger i molekyler.',
    explanation: 'Gallesalter emulgerer fett og gjør mer overflate tilgjengelig. Lipase er enzymet som katalyserer spaltingen. Galle er altså ikke et fettspaltende enzym.'
  },
  {
    id: 'fat-functions', topic: 'fat', type: 'multi', level: 1,
    title: 'Hva bruker kroppen fettstoffer til?',
    prompt: 'Hvilke oppgaver kan fett og andre fettstoffer ha i kroppen? Velg alle riktige.',
    options: ['Lagre og gi energi', 'Inngå i cellemembraner', 'Bidra til isolasjon og beskyttelse', 'Bidra til opptak av fettløselige vitaminer', 'Erstatte alle proteiner og mineraler kroppen trenger'],
    answer: ['Lagre og gi energi', 'Inngå i cellemembraner', 'Bidra til isolasjon og beskyttelse', 'Bidra til opptak av fettløselige vitaminer'],
    hint: 'Fettstoffer har både oppgaver i cellenes struktur og i kroppens energilagre.',
    explanation: 'Fett er energirikt og fungerer som lager, isolasjon og beskyttelse. Andre lipider, blant annet fosfolipider og kolesterol, er viktige i cellemembraner. Fett bidrar også til opptak av A-, D-, E- og K-vitamin.'
  },
  {
    id: 'fat-saturation', topic: 'fat', type: 'sort', level: 1,
    title: 'Tell dobbeltbindingene',
    prompt: 'Sorter beskrivelsene. Her teller vi dobbeltbindinger mellom karbonatomene i fettsyrekjeden.',
    groups: ['Mettet fettsyre', 'Enumettet fettsyre', 'Flerumettet fettsyre'],
    items: [{ label: 'Ingen C=C-dobbeltbindinger', group: 'Mettet fettsyre' }, { label: 'Én C=C-dobbeltbinding', group: 'Enumettet fettsyre' }, { label: 'To C=C-dobbeltbindinger', group: 'Flerumettet fettsyre' }, { label: 'Tre C=C-dobbeltbindinger', group: 'Flerumettet fettsyre' }],
    hint: 'En-umettet betyr én, og fler-umettet betyr to eller flere.',
    explanation: 'Mettet beskriver en karbonkjede uten C=C-dobbeltbindinger. Enumettede fettsyrer har én og flerumettede har flere. Syregruppens C=O-binding er ikke med i denne tellingen.'
  },
  {
    id: 'fat-digestion-route', topic: 'fat', type: 'order', level: 2,
    title: 'Følg fett fra dråpe til transport',
    prompt: 'Ordne denne forenklede hovedveien for fett med lange fettsyrer. Trinnene viser sammenhengen selv om prosessene kan overlappe i tarmen.',
    items: ['Gallesalter finfordeler fettet i tynntarmen', 'Lipase spalter fett til mindre molekyler', 'Fettprodukter tas opp i tarmcellene', 'Tarmcellene bygger opp triglyserider og pakker dem i transportpartikler', 'Transportpartiklene går via lymfen til blodet'],
    hint: 'Fett må både spaltes, tas opp og pakkes før det fraktes videre.',
    explanation: 'Lange fettsyrer og monoglyserider tas opp i tarmcellene. Der bygges triglyserider opp igjen og pakkes i kylomikroner som går til lymfen. Korte fettsyrer kan følge andre transportveier.'
  },
  {
    id: 'fat-building-numbers', topic: 'fat', type: 'fill', level: 1,
    title: 'Glyserol og tre fettsyrer',
    prompt: 'Ett glyserolmolekyl bindes til fettsyrer og danner ett triglyserid. Hvor mange fettsyrer brukes, og hvor mange vannmolekyler frigjøres ved full dannelse av de tre esterbindingene?',
    blanks: [{ label: 'Antall fettsyrer', answers: ['3', 'tre'] }, { label: 'Antall vannmolekyler', answers: ['3', 'tre'] }],
    hint: 'Hver av glyserols tre OH-grupper kan inngå i én esterbinding. Det frigjøres ett vannmolekyl per binding.',
    explanation: 'Ett glyserol + tre fettsyrer gir ett triglyserid + tre vannmolekyler. Dette er kondensasjonsreaksjoner. Ved hydrolyse av bindingene går vann inn i reaksjonen.'
  },
  {
    id: 'fat-essential-families', topic: 'fat', type: 'multi', level: 1,
    title: 'Essensielle fettsyrer',
    prompt: 'I hvilke to omega-familier finner vi fettsyrer mennesket må få gjennom kosten?',
    options: ['Omega-3', 'Omega-6', 'Omega-9'],
    answer: ['Omega-3', 'Omega-6'],
    hint: 'Kroppen kan ikke lage alle typer dobbeltbindingsmønstre selv.',
    explanation: 'Alfa-linolensyre i omega-3-familien og linolsyre i omega-6-familien er essensielle. Navnene er tilleggsinformasjon her. Det betyr ikke at hver eneste fettsyre i disse familiene må tilføres gjennom kosten.' 
  },
  {
    id: 'fat-cis-trans', topic: 'fat', type: 'match', level: 2,
    title: 'Struktur og egenskaper',
    prompt: 'Koble begrepene til riktig beskrivelse.',
    pairs: [{ left: 'Cis-dobbeltbinding', right: 'Gir vanligvis en knekk i fettsyrekjeden' }, { left: 'Trans-dobbeltbinding', right: 'Gir en rettere kjede enn tilsvarende cis-form' }, { left: 'Hydrofobt stoff', right: 'Blandes dårlig med vann' }, { left: 'Essensiell fettsyre', right: 'Må tilføres gjennom kosten' }],
    hint: 'Cis og trans beskriver geometrien rundt en dobbeltbinding. Begge formene er umettede.',
    explanation: 'En cis-knekk gjør det vanskeligere å pakke fettsyrekjedene tett. Transformen er rettere. Smeltepunkt avhenger også av blant annet kjedelengde, så «alt umettet fett er flytende» blir for kategorisk.'
  },
  {
    id: 'fat-droplets-explain', topic: 'fat', type: 'open', level: 2,
    title: 'Hvorfor hjelper mindre fettdråper?',
    prompt: 'Forklar hvorfor galle kan gjøre fettfordøyelsen mer effektiv uten selv å være et enzym. Bruk ordene overflate og lipase.',
    model: 'Gallesalter fordeler store fettdråper i mange mindre dråper. Da blir den samlede overflaten større, slik at lipase kommer til flere fettmolekyler samtidig. Lipase katalyserer spaltingen av fettmolekylenes bindinger. Galle gjør derfor fett tilgjengelig for enzymet, men er ikke selv enzymet som spalter molekylene.',
    checklist: ['Jeg beskriver finfordeling av dråper og større samlet overflate.', 'Jeg forklarer at lipase spalter fettmolekyler.', 'Jeg skiller mellom emulsjon av dråper og kjemisk spalting.'],
    hint: 'Sammenlign én stor dråpe med mange små dråper som til sammen inneholder like mye fett.',
    explanation: 'Et godt svar viser hvordan en fysisk endring kan gjøre en kjemisk reaksjon lettere. Det er ikke nok å si at «galle bryter ned fett» uten å forklare hva det betyr.'
  },
  {
    id: 'fat-process-bile', topic: 'fat', type: 'process', level: 1,
    title: 'Hvor produseres galle?',
    prompt: 'Velg organet som produserer galle. Velg produksjonsstedet, ikke lageret eller stedet der gallen virker.',
    answer: ['liver'],
    hint: 'Galleblæren lagrer galle. Et større organ lager den.',
    explanation: 'Leveren produserer galle. Galleblæren lagrer og konsentrerer den, og gallen tilføres tolvfingertarmen når den skal bidra til fettfordøyelsen.'
  },

  {
    id: 'micro-vitamin-mineral', topic: 'micro', type: 'choice', level: 1,
    title: 'Vitaminer og mineralstoffer',
    prompt: 'Hvilken påstand skiller riktig mellom vitaminer og mineralstoffer?',
    options: ['Vitaminer er organiske forbindelser, mens mineralstoffer er uorganiske næringsstoffer knyttet til bestemte grunnstoffer.', 'Vitaminer gir energi, mens mineralstoffer ikke gjør det.', 'Mineralstoffer er alltid proteiner med metall i.', 'Vitaminer trengs bare hvis man ikke spiser karbohydrater.'],
    answer: 'Vitaminer er organiske forbindelser, mens mineralstoffer er uorganiske næringsstoffer knyttet til bestemte grunnstoffer.',
    hint: 'Tenk på et vitaminmolekyl sammenlignet med kalsium, jern eller jod.',
    explanation: 'Vitaminer og mineralstoffer gir ikke energi slik fett, karbohydrat og protein gjør. De har likevel nødvendige oppgaver i blant annet stoffskifte, signalering og kroppens strukturer.'
  },
  {
    id: 'micro-b12-storage', topic: 'micro', type: 'choice', level: 2,
    title: 'Kan vannløselige vitaminer lagres?',
    prompt: 'En elev sier: «Ingen vannløselige vitaminer kan lagres i kroppen.» Hvilken rettelse er mest presis?',
    options: ['Mange lagres i begrenset grad, men B12 er et viktig unntak og kan lagres lenge.', 'Påstanden er riktig uten unntak.', 'Alle vannløselige vitaminer lagres bare i fettvev.', 'Vannløselige vitaminer er det samme som mineralstoffer.'],
    answer: 'Mange lagres i begrenset grad, men B12 er et viktig unntak og kan lagres lenge.',
    hint: 'B-vitaminene er en gruppe av flere forskjellige stoffer, og B12 skiller seg ut når det gjelder lagring.',
    explanation: 'Vannløselig beskriver løselighet, ikke at stoffet umiddelbart forsvinner fra kroppen. Kroppen kan ha betydelige lagre av B12. Hovedinndelingen i vannløselige og fettløselige vitaminer må derfor brukes med denne nyansen.'
  },
  {
    id: 'micro-water-functions', topic: 'micro', type: 'multi', level: 1,
    title: 'Vann er nødvendig uten å gi energi',
    prompt: 'Hvilke funksjoner har vann i kroppen? Velg alle riktige.',
    options: ['Være løsemiddel og transportmedium', 'Delta i hydrolyse av næringsstoffer', 'Bidra til temperaturregulering når svette fordamper', 'Frigjøre 9 kcal per gram i celleåndingen', 'Være en viktig del av cellenes innhold'],
    answer: ['Være løsemiddel og transportmedium', 'Delta i hydrolyse av næringsstoffer', 'Bidra til temperaturregulering når svette fordamper', 'Være en viktig del av cellenes innhold'],
    hint: 'At et stoff ikke gir energi, betyr ikke at kroppen kan klare seg uten det.',
    explanation: 'Vann inngår i væskene i og rundt cellene, i transport og i mange reaksjoner. Fordamping av svette tar opp varme. Vann er ikke et brennstoff som gir energi i celleåndingen.'
  },
  {
    id: 'micro-vitamin-sort', topic: 'micro', type: 'sort', level: 1,
    title: 'Vannløselig eller fettløselig?',
    prompt: 'Sorter vitaminene etter løselighet.',
    groups: ['Vannløselige', 'Fettløselige'],
    items: [{ label: 'B-vitaminene', group: 'Vannløselige' }, { label: 'Vitamin C', group: 'Vannløselige' }, { label: 'Vitamin A', group: 'Fettløselige' }, { label: 'Vitamin D', group: 'Fettløselige' }, { label: 'Vitamin E', group: 'Fettløselige' }, { label: 'Vitamin K', group: 'Fettløselige' }],
    hint: 'A, D, E og K er de fire fettløselige vitaminene.',
    explanation: 'B-vitaminene og C er vannløselige, mens A, D, E og K er fettløselige. Løselighet påvirker opptak, transport og lagring. B12 er et vannløselig vitamin som likevel kan lagres lenge.'
  },
  {
    id: 'micro-sweat-sequence', topic: 'micro', type: 'order', level: 2,
    title: 'Hvordan avkjøler svette?',
    prompt: 'Ordne årsaksforklaringen fra økt varmeproduksjon til avkjøling. Vi ser her på svette som faktisk fordamper fra huden.',
    items: ['Muskelarbeid øker varmeproduksjonen', 'Kroppen skiller ut svette på huden', 'Vann i svetten fordamper og tar opp varme fra huden', 'Varmeavgivelsen bidrar til å begrense temperaturøkningen'],
    hint: 'Selve fordampingen krever energi. Tenk på hvor denne energien tas fra.',
    explanation: 'Det er særlig fordampingen som gir avkjøling. Vann som bare drypper av, har ikke samme kjølende effekt. Vann er dermed viktig for temperaturregulering uten å gi kroppen energi som næringsbrensel.'
  },
  {
    id: 'micro-blood-bones', topic: 'micro', type: 'fill', level: 1,
    title: 'To mineralstoffer med ulike oppgaver',
    prompt: 'Hvilket mineralstoff inngår i hemoglobin, og hvilket er en viktig byggestein i skjelett og tenner?',
    blanks: [{ label: 'Mineralstoff i hemoglobin', answers: ['jern', 'fe', 'jernioner'] }, { label: 'Viktig mineralstoff i skjelett og tenner', answers: ['kalsium', 'ca', 'kalsiumioner'] }],
    hint: 'Det ene har kjemisk symbol Fe. Det andre har kjemisk symbol Ca.',
    explanation: 'Jern inngår i hemoglobinets hemgrupper og er nødvendig for oksygentransport. Kalsium inngår sammen med blant annet fosfat i mineralene som gir skjelett og tenner styrke.'
  },
  {
    id: 'micro-vitamin-d', topic: 'micro', type: 'fill', level: 1,
    title: 'Vitamin D og kalsium',
    prompt: 'Fyll inn vitaminet som bidrar til kalsiumopptak, og typen stråling fra sollys som kan sette i gang dannelsen av dette vitaminet i huden.',
    blanks: [{ label: 'Vitamin', answers: ['d', 'vitamin d', 'd-vitamin', 'd vitamin'] }, { label: 'Type stråling fra sollys', answers: ['uvb', 'uv-b', 'uvb-stråling', 'uv-b-stråling', 'ultrafiolett', 'ultrafiolett stråling', 'uv', 'uv-stråling'] }],
    hint: 'Vitaminet heter ofte «solskinnsvitaminet». Sollyset gir ikke ferdige vitaminmolekyler til huden.',
    explanation: 'Vitamin D bidrar til regulering av kalsiumopptak. UVB-stråling kan sette i gang dannelse av vitamin D i huden. Vi «får» derfor ikke vitaminmolekylene direkte fra solstrålene; kroppen danner dem fra et forstadium.'
  },
  {
    id: 'micro-function-match', topic: 'micro', type: 'match', level: 1,
    title: 'Små mengder, nødvendige oppgaver',
    prompt: 'Koble hvert næringsstoff til én relevant funksjon.',
    pairs: [{ left: 'Vitamin C', right: 'Bidrar til dannelse av bindevev og øker opptak av jern fra planter' }, { left: 'Vitamin K', right: 'Er nødvendig for normal blodlevring' }, { left: 'Vitamin B12', right: 'Er viktig for nervesystemet og dannelse av røde blodceller' }, { left: 'Jod', right: 'Inngår i skjoldbruskkjertelens hormoner' }, { left: 'Vitamin A', right: 'Har en viktig rolle i synet' }],
    hint: 'Disse næringsstoffene gir ikke energi, men bidrar i forskjellige prosesser.',
    explanation: 'Næringsstoffer kan være nødvendige selv om mengdene er små. De har forskjellige funksjoner og kan ikke uten videre erstatte hverandre.'
  },
  {
    id: 'micro-variety-explain', topic: 'micro', type: 'open', level: 2,
    title: 'Mer er ikke alltid bedre',
    prompt: 'Forklar hvorfor kroppen trenger mange forskjellige vitaminer og mineralstoffer, og hvorfor «jo mer, desto bedre» er en dårlig generell regel.',
    model: 'Vitaminer og mineralstoffer har forskjellige oppgaver, så et stort inntak av ett stoff erstatter ikke de andre. Kroppen trenger passende mengder, og for lite kan gi mangel. For mye av enkelte stoffer kan også skade. Fettløselige vitaminer kan lagres, men også vannløselige vitaminer og mineralstoffer kan være skadelige i for store mengder. Variasjon i matvarer kan bidra til å dekke ulike behov.',
    checklist: ['Jeg forklarer at stoffene har forskjellige funksjoner.', 'Jeg får fram at både mangel og overskudd kan være uheldig.', 'Jeg forklarer hvorfor variasjon kan bidra til å dekke flere behov.'],
    hint: 'Tenk på jern, kalsium, vitamin C og vitamin K: De har ikke den samme jobben.',
    explanation: 'Oppgaven gjelder faglige prinsipper om næringsstoffer. Et godt svar beskriver variasjon og passende mengder uten å gi personlige råd om tilskudd.'
  },
  {
    id: 'micro-process-water', topic: 'micro', type: 'process', level: 2,
    title: 'Hvor tas vann opp?',
    prompt: 'Velg de to tarmdelene som tar opp vann. Bruk de overordnede navnene tynntarm og tykktarm.',
    answer: ['small', 'large'],
    hint: 'Mye av vannet tas opp før restene når tykktarmen.',
    explanation: 'Mest vann tas normalt opp i tynntarmen. Tykktarmen tar opp mye av vannet som er igjen og bidrar til at avføringen blir fastere. «Vann tas bare opp i tykktarmen» er derfor feil.'
  },

  {
    id: 'energy-atp', topic: 'energy', type: 'choice', level: 1,
    title: 'Hva er ATPs rolle?',
    prompt: 'Hvilken beskrivelse av ATP er mest presis?',
    options: ['Et molekyl som overfører energi mellom reaksjoner og arbeid i cellen.', 'Kroppens viktigste energilager for flere måneder.', 'Et fordøyelsesenzym som spalter alle næringsstoffer.', 'Et vitamin som tas opp uendret fra maten.'],
    answer: 'Et molekyl som overfører energi mellom reaksjoner og arbeid i cellen.',
    hint: 'ATP dannes og brukes stadig. Tenk kortvarig energioverføring heller enn langtidslagring.',
    explanation: 'Energi fra nedbryting av næringsstoffer kan brukes til å danne ATP fra ADP og fosfat. ATP kan kobles til prosesser som krever energi, blant annet muskelarbeid og oppbygning av molekyler. Energi omdannes og overføres; den skapes ikke fra ingenting.'
  },
  {
    id: 'energy-mitochondria', topic: 'energy', type: 'choice', level: 2,
    title: 'Foregår alt i mitokondriene?',
    prompt: 'Hvilken påstand om nedbryting av glukose i menneskeceller er riktig?',
    options: ['Glykolysen foregår i cytosol, mens viktige senere trinn i aerob celleånding foregår i mitokondriene.', 'All nedbryting av glukose foregår i mitokondriene.', 'Anaerob energiomsetning krever at glukosen først går inn i leveren.', 'Celleånding er det samme som spalting av stivelse i munnen.'],
    answer: 'Glykolysen foregår i cytosol, mens viktige senere trinn i aerob celleånding foregår i mitokondriene.',
    hint: 'Det første trinnet kan foregå uten oksygen og uten å være inne i et mitokondrium.',
    explanation: 'Glykolysen finner sted i cytosol, altså cellevæsken. Hos mennesket skjer de senere trinnene i aerob omsetning av glukose i mitokondriene. Fordøyelse gjør næringsstoffene tilgjengelige; celleånding er energiomsetningen inne i cellene.'
  },
  {
    id: 'energy-fuels', topic: 'energy', type: 'multi', level: 1,
    title: 'Hvilke næringsstoffer kan gi energi?',
    prompt: 'Hvilke av disse næringsstoffene kan kroppen bruke som energikilder? Velg alle riktige.',
    options: ['Karbohydrater', 'Fett', 'Proteiner', 'Vann', 'Mineralstoffer', 'Vitaminer'],
    answer: ['Karbohydrater', 'Fett', 'Proteiner'],
    hint: 'Skill mellom energigivende næringsstoffer og stoffer som hjelper energiomsetningen uten selv å være energikilder.',
    explanation: 'Karbohydrater, fett og proteiner kan gi energi. Vitaminer, mineralstoffer og vann er nødvendige for mange prosesser, men regnes ikke som energigivende næringsstoffer. Fett og aminosyrer må ikke først omdannes til glukose for å kunne bidra i energiomsetningen.'
  },
  {
    id: 'energy-aerobic-anaerobic', topic: 'energy', type: 'sort', level: 2,
    title: 'Med og uten oksygen',
    prompt: 'Sorter beskrivelsene av aerob nedbryting av glukose og anaerob glykolyse med laktatdannelse i menneskets muskler.',
    groups: ['Aerob nedbryting', 'Anaerob glykolyse med laktatdannelse'],
    items: [{ label: 'Krever oksygen for det samlede forløpet', group: 'Aerob nedbryting' }, { label: 'Gir langt flere ATP per glukosemolekyl', group: 'Aerob nedbryting' }, { label: 'Gir karbondioksid og vann ved fullstendig nedbryting', group: 'Aerob nedbryting' }, { label: 'Kan levere ATP uten direkte bruk av oksygen', group: 'Anaerob glykolyse med laktatdannelse' }, { label: 'Gir netto to ATP per glukosemolekyl', group: 'Anaerob glykolyse med laktatdannelse' }, { label: 'Pyruvat omdannes til laktat slik at glykolysen kan fortsette', group: 'Anaerob glykolyse med laktatdannelse' }],
    hint: 'Se på oksygen, ATP-utbytte og sluttprodukter. Begge prosessene kan bidra under aktivitet.',
    explanation: 'Laktat er formen melkesyre hovedsakelig finnes i ved kroppens pH. Glykolyse betyr den første nedbrytingen av glukose i cellevæsken. Anaerob glykolyse gir rask, men lite effektiv ATP-produksjon per glukosemolekyl. Aerob nedbryting gir større utbytte. Laktat er ikke bare et avfallsstoff; det kan transporteres og brukes videre i energiomsetningen.'
  },
  {
    id: 'energy-insulin-sequence', topic: 'energy', type: 'order', level: 2,
    title: 'Etter et karbohydratholdig måltid',
    prompt: 'Sett den forenklede årsakskjeden i riktig rekkefølge. Vi følger insulinets bidrag til å regulere blodsukkeret.',
    items: ['Glukose tas opp fra tynntarmen til blodet', 'Glukosekonsentrasjonen i blodet stiger', 'Bukspyttkjertelen øker utskillelsen av insulin', 'Insulin fremmer glukoseopptak i blant annet muskel- og fettceller og lagring av glykogen', 'Disse prosessene bidrar til at blodsukkeret synker igjen'],
    hint: 'Begynn med opptak fra tarmen. Hormonet virker etter at kroppen registrerer økningen.',
    explanation: 'Insulin er et signalstoff som bidrar til å senke blodsukkeret gjennom økt opptak, bruk og lagring av glukose. Insulin spalter ikke selv glukosemolekylene og er ikke et fordøyelsesenzym.'
  },
  {
    id: 'energy-kcal-calculate', topic: 'energy', type: 'fill', level: 2,
    title: 'Sammenlign energiinnhold',
    prompt: 'Bruk de avrundede faktorene 4 kcal/g for karbohydrat og 9 kcal/g for fett. Hvor mye energi gir 10 g av hvert stoff?',
    blanks: [{ label: '10 g karbohydrat', answers: ['40', 'førti', '40 kcal'], unit: 'kcal' }, { label: '10 g fett', answers: ['90', 'nitti', '90 kcal'], unit: 'kcal' }],
    hint: 'Multipliser antall gram med energi per gram.',
    explanation: '10 × 4 = 40 kcal fra karbohydrat, og 10 × 9 = 90 kcal fra fett. Like stor masse gir ikke likt energiinnhold. Beregningen sier noe om energi, ikke alene om matvarens samlede næringsverdi.'
  },
  {
    id: 'energy-respiration-products', topic: 'energy', type: 'fill', level: 1,
    title: 'Fullfør aerob celleånding',
    prompt: 'Fullfør oversiktslikningen med stoffnavn: glukose + oksygen → ____ + ____ . Energi frigjøres og kan blant annet brukes til å danne ATP.',
    blanks: [{ label: 'Karbonholdig sluttprodukt', answers: ['karbondioksid', 'co2', 'co₂', 'karbondioksidgass'] }, { label: 'Det andre sluttproduktet', answers: ['vann', 'h2o', 'h₂o'] }],
    hint: 'Karbonatomene ender i en gass vi puster ut. Hydrogenet inngår i et svært vanlig stoff.',
    explanation: 'Den balanserte oversiktslikningen er C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O. Underveis overføres noe av energien til ATP, og noe avgis som varme. Reaksjonen består i virkeligheten av mange enzymstyrte trinn.'
  },
  {
    id: 'energy-storage-hormones', topic: 'energy', type: 'match', level: 1,
    title: 'Signal, lager eller energioverføring?',
    prompt: 'Koble hvert begrep til riktig beskrivelse.',
    pairs: [{ left: 'Insulin', right: 'Hormon som bidrar til lavere glukosekonsentrasjon i blodet' }, { left: 'Glukagon', right: 'Hormon som blant annet øker frigjøring av glukose fra leveren' }, { left: 'Glykogen', right: 'Forgrenet glukoselager i lever og muskler' }, { left: 'ATP', right: 'Molekyl for kortvarig energioverføring i celler' }, { left: 'Fettvev', right: 'Vev med store energilagre som triglyserider' }],
    hint: 'Insulin og glukagon er signalstoffer. Glykogen og fett lagrer energi på forskjellige måter.',
    explanation: 'Når blodsukkeret synker, kan glukagon stimulere leveren til å frigjøre glukose. Insulin bidrar etter et måltid til opptak og lagring. Muskelglykogen brukes lokalt i musklene, mens leveren bidrar til å holde glukose tilgjengelig i blodet.'
  },
  {
    id: 'energy-digestion-vs-respiration', topic: 'energy', type: 'open', level: 2,
    title: 'Fra brødskive til muskelarbeid',
    prompt: 'Forklar hvordan stivelse i en brødskive kan bidra til muskelarbeid. Skill mellom fordøyelse, opptak, transport og energiomsetning i cellen. Ta med ATP.',
    model: 'Fordøyelsesenzymer spalter stivelse videre til glukose. Glukose tas opp gjennom tarmveggen i tynntarmen og fraktes med blodet til blant annet musklene. I muskelcellene brytes glukose ned i energiomsetningen. Glykolysen begynner i cytosol, og ved aerob nedbryting fortsetter senere trinn i mitokondriene med bruk av oksygen. Energi overføres til ATP, som kan kobles til prosessene som får muskelen til å trekke seg sammen.',
    checklist: ['Jeg skiller mellom enzymatisk fordøyelse i tarmen og energiomsetning inne i celler.', 'Jeg beskriver opptak i tynntarmen og transport med blodet.', 'Jeg forklarer hvordan ATP knytter energiomsetningen til muskelarbeid.'],
    hint: 'Følg stoffet mellom stedene: tarm, blod og muskelcelle. Forklar deretter hva ATP gjør.',
    explanation: 'Et godt svar binder prosessene sammen uten å slå dem sammen til én prosess. Glukose «blir» ikke ATP; energi fra nedbrytingen brukes til å danne ATP fra ADP og fosfat.'
  }
];

export const sources = [
  { title: 'Lærerens presentasjoner', description: '01 Karbohydrater, 02 Proteiner, 03 Fett, 2] Fordøyelsen og Vitaminer, mineraler og vann. Oppgavene er skrevet for denne modulen, med faglige presiseringer av forenklinger i lysbildene.' },
  { title: 'NDLA: Fordøyelsessystemet', url: 'https://ndla.no/nb/r/naturfag-fd/fordoyelsessystemet/c1f4800953', description: 'Inspirasjon til figurarbeid og forklaring av prosesser.' },
  { title: 'NDLA: Oppsummeringsoppgaver om næringsstoffer', url: 'https://ndla.no/en/r/naturfag-el/oppsummeringsoppgaver-om-naringsstoffer/c846680a39', description: 'Inspirasjon til sortering, utfylling, kobling og åpne forklaringer.' },
  { title: 'NDLA: Næringsstoffer', url: 'https://ndla.no/r/ravare-produksjon-salg-og-service-rm-kos-vg2/naringsstoffer/272df498dd', description: 'Kontroll av vitamininndeling, B12 som lagringsunntak og næringsstoffenes funksjoner.' },
  { title: 'OpenStax: Chemical Digestion and Absorption', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look', description: 'Kontroll av nedbrytingsprodukter, fetttransport og vannopptak.' },
  { title: 'OpenStax: Digestive System Processes', url: 'https://openstax.org/books/biology-2e/pages/34-3-digestive-system-processes', description: 'Kontroll av galle, enzymer og hovedsted for fettnedbryting.' },
  { title: 'OpenStax: Glycolysis', url: 'https://openstax.org/books/biology-2e/pages/7-2-glycolysis', description: 'Kontroll av glykolysens plassering og ATP-utbytte.' },
  { title: 'OpenStax: Regulation of Body Processes', url: 'https://openstax.org/books/biology-2e/pages/37-3-regulation-of-body-processes', description: 'Kontroll av insulin, glukagon og regulering av blodsukker.' }
];


// Tillegg fra fagreview og originale figuroppgaver.
questions.unshift({
  id:'digestion-anatomy',topic:'digestion',type:'anatomy',level:1,
  title:'Sett navn på fordøyelsessystemet',
  prompt:'Velg et organnavn og trykk på riktig nummer i figuren. Du kan også bruke tekstlisten under figuren.',
  hint:'Følg matens vei fra munnen. Lever, galleblære og bukspyttkjertel sender væske til tarmen; maten går ikke gjennom dem.',
  explanation:'Matens vei går gjennom munn, spiserør, magesekk, tynntarm, tykktarm og endetarm. Tolvfingertarmen er første del av tynntarmen. Lever, galleblære og bukspyttkjertel er tilknyttede organer.'
});
questions.push(
 {id:'fat-process-breakdown',topic:'fat',type:'process',level:1,title:'Hvor fordøyes mest fett?',
  prompt:'Velg området der hoveddelen av fettfordøyelsen skjer.',answer:['small'],
  hint:'Galle og bukspytt tilføres den første delen av denne tarmen.',
  explanation:'Hoveddelen av fettfordøyelsen skjer i tynntarmen, inkludert tolvfingertarmen. Galle finfordeler fettdråper, mens lipase spalter triglyserider til hovedsakelig fettsyrer og monoglyserider.'},
 {id:'digestion-lactose',topic:'digestion',type:'choice',level:2,title:'Når laktase mangler',
  prompt:'En person har lite laktase i tynntarmen. Hvilken følge er mest direkte knyttet til enzymets oppgave?',
  options:['Mindre laktose spaltes til glukose og galaktose.','Alle melkeproteiner går uspalte gjennom tarmen.','Galleproduksjonen stopper.','Ingen næringsstoffer kan tas opp.'],
  answer:'Mindre laktose spaltes til glukose og galaktose.',
  hint:'Navnet på enzymet peker mot et bestemt disakkarid.',
  explanation:'Laktase spalter laktose. Ved lite laktase kan mer laktose passere videre til tykktarmen, der bakterier kan omsette den. Laktoseintoleranse er ikke det samme som allergi mot melkeproteiner.'},
 {id:'protein-quality',topic:'protein',type:'open',level:2,title:'Hvorfor kombinere korn og belgvekster?',
  prompt:'Korn har ofte relativt lite lysin. Belgvekster har gjerne mer lysin, men relativt mindre av noen andre essensielle aminosyrer. Forklar hvordan kildene kan utfylle hverandre, og hva proteinkvalitet handler om.',
  model:'Proteinkildene har ulike forhold mellom de essensielle aminosyrene. Kombinasjonen kan derfor gi en sammensetning som passer kroppens behov bedre enn én kilde alene. Proteinkvalitet handler både om denne sammensetningen og om hvor godt proteinet fordøyes og aminosyrene blir tilgjengelige. Relativt lite betyr ikke at en aminosyre er helt fraværende.',
  checklist:['Jeg forklarer hvordan ulike aminosyresammensetninger kan utfylle hverandre.','Jeg kobler essensielle aminosyrer til det kroppen må få gjennom kosten.','Jeg tar med fordøyelighet og tilgjengelighet som del av proteinkvalitet.'],
  hint:'Se på forholdet mellom byggesteinene og hvor godt kroppen kan utnytte dem.',
  explanation:'Variasjon mellom proteinkilder kan gi en bedre samlet aminosyresammensetning. Et godt svar bruker opplysningene i oppgaven og skiller mellom mengde protein og kvalitet.'},
 {id:'carbs-figure-units',topic:'carbs',type:'match',level:1,figure:'sugars',title:'Les sukkermodellene',
  prompt:'Hver sekskant står for én sukkerenhet. Koble modell A, B og C til riktig gruppe.',
  pairs:[{left:'Modell A',right:'Monosakkarid'},{left:'Modell B',right:'Disakkarid'},{left:'Modell C',right:'Polysakkarid'}],
  hint:'Tell enhetene som er bundet sammen. Prikkene i C viser at kjeden fortsetter.',
  explanation:'A viser én enhet, B to og C en lang kjede. Figurene er modeller av antall enheter, ikke fullstendige strukturformler. Sukker finnes også i andre ringformer og som åpne kjeder.'},
 {id:'protein-figure-changes',topic:'protein',type:'match',level:2,figure:'protein',title:'Brette ut eller klippe opp?',
  prompt:'Sammenlign startmodellen med A og B. Hver sirkel viser en aminosyre. Hva har skjedd i hver modell?',
  pairs:[{left:'Endring A',right:'Denaturering: endret folding, sammenhengende kjede'},{left:'Endring B',right:'Spalting: bindinger i kjeden er brutt'}],
  hint:'Følg forbindelsene mellom sirklene. Er kjeden fortsatt hel?',
  explanation:'I A er kjeden foldet ut uten at peptidbindingene er klippet. I B er kjeden delt i kortere biter. Denaturering og spalting er forskjellige endringer; enzymets funksjon kan endres allerede ved denaturering.'},
 {id:'energy-figure-share',topic:'energy',type:'fill',level:2,figure:'energy',title:'Gram er ikke energiprosent',
  prompt:'Porsjonen inneholder 12 g karbohydrat, 8 g fett og 5 g protein. Bruk 4, 9 og 4 kcal/g. Beregn total energi og prosentandelen som kommer fra fett. Avrund prosentandelen til nærmeste hele prosent.',
  blanks:[{label:'Total energi',answers:['140'],unit:'kcal'},{label:'Energi fra fett',answers:['51','51 %','51%'],unit:'%'}],
  hint:'Finn først energien fra hvert næringsstoff. Fettets energiandel er energi fra fett delt på total energi, ganger 100.',
  explanation:'Karbohydrat gir 48 kcal, fett 72 kcal og protein 20 kcal: totalt 140 kcal. Fett gir 72/140 × 100 ≈ 51 % av energien, selv om fett bare er 8/25 = 32 % av massen til disse tre næringsstoffene.'}
);
