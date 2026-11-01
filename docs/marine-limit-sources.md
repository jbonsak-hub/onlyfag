# Marin grense: lokale kartdata

Kartlaget viser **NGUs modellerte areal under marin grense** i Norge. Det er
ikke en terskel beregnet fra dagens høydekurver, ikke et kart over marine
avsetninger, og ikke et kart over kvikkleire. Marin grense er det høyeste
havnivået etter istiden på det enkelte stedet. Nivået varierer geografisk.

## Data og tilgjengelighet

- Opprinnelig produsent: **Norges geologiske undersøkelse (NGU)**.
- Originaldatasett i Geonorge: `cf8ccec7-9505-4d84-94a9-eac9c69971d3`.
- Direkte originaltjeneste: <https://geo.ngu.no/api/features/maringrense/collections?f=json>.
- Nedlastingsspeil: **Geodata AS**, offentlig ArcGIS Online-item
  [`c14552c7456249fcb06b1b1ea1c2bf3d`](https://www.arcgis.com/home/item.html?id=c14552c7456249fcb06b1b1ea1c2bf3d).
  Itemets offisielle beskrivelse sier «Områder under marin grense. Kilde: NGU».
- Det konkrete laget heter `MarinGrenseFlate_under`, lagnummer 20 i
  <https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/MarinGrenseFlate_under/FeatureServer>.
- Speilet inneholder 2 868 kildeobjekter. Alle har `annetKvTema = 2`, beskrivelsen
  «Areal under marin grense» og `datauttaksdato = 1705968000000`, **23. januar 2024**.
  Den nyere datoen på ArcGIS-itemet er ikke brukt som dato for selve NGU-dataene.
- Hentet til OnlyFag **1. november 2026**. Kartet henter ingen NGU- eller
  ArcGIS-tjeneste i nettleseren; visningsdataene ligger lokalt i nettstedet.

## Lisens og dokumentasjon

NGUs originale OGC-API oppgir **Norsk lisens for offentlige data (NLOD 2.0)**,
med merknad om kompatibilitet med CC-BY-4.0. Lisenslenken er
<https://data.norge.no/nlod/en/2.0/>. Påkrevd kildehenvisning er NGU, med
opplysning om at OnlyFags visningsgeometri er forenklet.

Lisensen er dokumentert i `assets/geography/marine-limit/sources/ngu-collections-20260607.json`.
Dette er en offentlig arkivert originalrespons fra NGUs API, hentet fra
<https://github.com/trymhaak/open-apis/blob/main/raw/ngu/2026-06-07/marin-grense-ogc-collections.json>.
NGUs originalhost kunne ikke nås innenfor oppgavens nettverkspolicy. Arkivet
brukes kun som belegg for originalens lagskjema og lisens; selve kartgeometrien
kommer fra det dokumenterte NGU-speilet hos Geodata AS.

Service-, lag- og itemmetadata fra nedlastingsspeilet er bevart i samme
`sources/`-mappe. `manifest.json` dokumenterer kildeparametere, koordinatsystem,
SHA-256 for hver av de tre råresponsene, antall og lokal behandling.

## Visningsgeometri og presisjon

`data/under-marine-limit.geojson` er WGS84 (EPSG:4326). Geometrien er forenklet
med topologibevarende Douglas–Peucker på **50 meter i EPSG:25833** før
omprojisering. Koordinater avrundes til fem desimaler; ugyldig kildegeometri
repareres topologisk og rene degenererte geometrier uten areal i dette
servergeneraliserte uttrekket utelates, med objekt-ID dokumentert i manifestet.
Objekt 1846 er gyldig i det senere native-uttrekket og inngår i detaljlaget. Forenklingen lager ingen nye høyder eller
antatte forbindelser mellom registreringer.

Flatekanter kan inkludere kystlinje og administrative/tekniske avgrensninger;
de skal derfor ikke markedsføres som nøyaktige, observerte marin-grense-linjer.
NGUs originale API har egne samlinger for grenselinjer (`maringrense`) og
observasjonspunkter (`maringrensepkt`); disse lagene inngår ikke i denne kopien.
Hjelpelag som `fiktivdelelinje` er heller ikke marin grense.

Et område under marin grense er ikke dermed dekket av marin leire. Omvendt
skal fravær av markering ikke brukes til å fastslå lokale grunnforhold.
Kartet er et generalisert undervisningskart.

## Reprodusering

Tre paginerte REST-spørringer er dokumentert i manifestets `requestParameters`.
De uendrede svarene er beholdt under `/workspace/artifacts/marine-limit/raw/`
i arbeidsmiljøet, uten å legge 110 MB rådata i nettstedets Git-repository.
Nettstedets kjøring trenger kun den lokale GeoJSON-filen.

Med de dokumenterte råresponsene på disk:

```sh
PYTHONPATH=/workspace/shared/municipality-python-deps \
  python3 assets/geography/marine-limit/sources/build-data.py \
  --raw /workspace/artifacts/marine-limit/raw
```

## Nettvisning og kartbakgrunn

Kartet åpnes fra **Geografi → Ytre krefter og landformer → Marin grense**,
`geografi.html#ytre-marin-grense`. `geografi/marin-grense.html` er den
selvstendige siden.

Marin-grense-flatene, stedsnavn og skript lastes fra OnlyFag. Det gjøres ingen
NGU- eller ArcGIS-kall for temadata mens kartet brukes. Kartbakgrunnen bruker
offentlige flistjenester med geografisk registrering i UTM33:

- **Topografisk kart**: Kartverket WMTS `topo`.
- **Turkart**: Kartverket WMTS `toporaster`.
- **Terrengrelieff**: [Esri World Hillshade WGS84](https://www.arcgis.com/home/item.html?id=abb42430fb5e4841b0d92eec3882946a).
- **Enkelt reservekart**: lokal, generalisert bakgrunn for bruk uten kartfliser.

Kartverkets WMTS i UTM33 har origo `[-2500000,9045984]`, 256-pikselfliser og
oppløsning `21664 / 2^nivå` meter per piksel. Nivå 0–18 hentes med numeriske matrise-ID-er uten nullutfylling fra
`https://cache.kartverket.no/v1/wmts/1.0.0/{lag}/default/utm33n/{nivå}/{rad}/{kolonne}.png`.
Terrengrelieff hentes fra
`https://whi.maptiles.arcgis.com/arcgis/rest/services/World_Hillshade/MapServer`.
Dette er et WGS84-flisrutenett (EPSG:4326), med origo `[-180,90]`, 256 piksler,
oppløsning `0.703125 / 2^nivå` grader og `2^(nivå+1)` kolonner. Den delte
`wgs84-raster.js` omprojiserer hvert bilde med et 8×8 teksturnett til UTM33.
Ved feil på Kartverket vises dette relieffet automatisk med en uttrykkelig
statusmelding. Lagvelgeren beholder ønsket Kartverket-lag; nytt valg prøver igjen.
Ingen vilkårlig flis erstatter en mislykket flis fra et annet område.
Bakgrunnsfeil påvirker ikke kommunesøk eller de lokale NGU-temadataene.

Kamera, kartfliser og temaflater bruker nå ekte **ETRS89 / UTM sone 33N
(EPSG:25833)**. `projection.js` bruker GRS80 og en sjetteordens Krüger-utvikling,
kontrollert mot uavhengige pyproj-referanser. NGU-data klippes ikke lenger mot
den grove fylkesmasken. Lagbytte og justering av temalagets synlighet beholder
utsnittet. NGU-flatene tegnes i en mellomflate og blandes med bakgrunnen én gang.

Kommunesøket bruker eksisterende `municipality-centres.json`, basert på
Kartverket SSR og Wikidata; det flytter kartet til kommunens administrasjonssenter.
Reservekartet bruker Natural Earth (public domain) og NordNordWests
bearbeidede fylkesformer (CC BY-SA 3.0 DE). Det er uttrykkelig et enkelt
reservekart, og brukes ikke som dokumentasjon av detaljnivået i Kartverkets fliser.

## Detaljert lokalt NGU-lag

Ved nærmere zoom erstattes oversiktsflatene gradvis av lokale detaljfliser.
Native geometrier er hentet uten serverparameteren `maxAllowableOffset`,
forenklet med 5 meter toleranse før klipping og delt i projiserte ruter.
Dette er visningsforenkling, ikke en påstand om at NGUs kilde er oppmålt med
5 meters nøyaktighet. Koordinatene i detaljflisene er **EPSG:25833 i meter**,
ikke RFC 7946-lengde-/breddegrader. Opphav, kildedato og flisindeks er dokumentert
i `data/detail/index.json` og tilhørende detaljmanifest. Ingen høydekurver er
konstruert fra flatekantene. Originalresponsene beholdes utenfor nettstedets Git.

Detaljlaget har 201 lokalt lagrede ruter, omtrent 19,7 MB totalt, og bevarer
alle 2 868 kilde-ID-er. Den største ruten er under 0,7 MB. Native-uttrekkets
10 962 084 koordinatpunkter er forenklet til 909 601 før ruteinndeling.
Objekt 1846, som falt bort som degenerert etter speilets 25 meters
servergeneralisering i oversiktsuttrekket, er beholdt i detaljene. Kildedatoen
er fortsatt 23. januar 2024, uavhengig av datoen dataene ble lastet ned.

## Kontroller

- `node tests/marine-limit-map.cjs`: lokale temaflater, uavhengige UTM-referanser, georefererte fliskontroller,
  kommunesøk/alias, zoom, forflytning, tofingerzoom, tastatur, lag, tema og ingen
  ekstern NGU-avhengighet ved 1366×768, 1024×768 og 390×844.
- `node tests/marine-limit-integration.cjs`: meny, lenker, lazy iframe,
  tema/avsendervalidering, full kartflate og mobilmeny med tastatur/fokus.
- `node scripts/build-geography-quiz-assets.cjs --check`: bekrefter at de
  eksisterende quizressursene ikke trenger nygenerering.

Utviklingsmiljøets nettfilter blokkerte direkte kall til cache.kartverket.no.
WMTS-kontrakten er kontrollert mot Kartverkets egen nibas-frontend: nivået
bruker `z.toString()`, ikke `padStart(2)`. Georefererte kontrollfliser verifiserer
registrering, nivå 0–9, feiltilstand og bytte til reserve. Dette er ikke en
påstand om direkte verifisert tilgjengelighet hos Kartverket.

Esris faktiske World Hillshade-tjeneste er testet med HTTP 200, JPEG-bildedata og
`Access-Control-Allow-Origin: *`. `MARINE_LIVE=1 node tests/marine-limit-map.cjs`
henter ekte fliser og kontrollerer at de tegnes i nettleseren. Lokal kartvisning
og geologiske temadata avhenger ikke av NGUs servere.
