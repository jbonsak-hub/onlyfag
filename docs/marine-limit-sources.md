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
repareres topologisk og rene degenererte geometrier uten areal utelates, med
objekt-ID dokumentert i manifestet. Forenklingen lager ingen nye høyder eller
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
selvstendige siden. Alle temadata, terrengbilder, stedsnavn og skript lastes fra
OnlyFag; det gjøres ingen NGU-, ArcGIS- eller eksterne fliskall i nettleseren.

Temaflatene vises over landmasken i nettstedets eksisterende, forenklede
fylkeskart. Dette er kun en visningsmaske: nedlastet NGU-geometri er ikke klippet
eller omskrevet for å passe kystlinjen. Kyst og fylkesgrenser er et
oversiktsgrunnlag, ikke eiendomsgrenser. Georefereringen følger den samme
registrerte Lambert-projeksjonen som `norway-county-relief.json`; dokumentasjon
og kontrollpunkter finnes i `sources/norway-county-registration.json`.

Bakgrunnen gjenbruker Kartverkets lokalt lagrede terrengbilder (CC BY 4.0),
Natural Earth-geometri (public domain) og NordNordWests bearbeidede fylkesformer
(CC BY-SA 3.0 DE). Kartet krediterer geometri og lisens med lenker i kartflaten.
Kommunesøket bruker eksisterende `municipality-centres.json`, basert på
Kartverket SSR og Wikidata; det flytter kartet til kommunens administrasjonssenter.

`scripts/build-marine-background.py` lager lokalt bakgrunnsuttrekk fra de
allerede lagrede kildene. Den vikler ut Russlands antimeridiankryssing før
plan klipping, slik at østre Russland ikke lager falske flater over Norskehavet.

## Kontroller

- `node tests/marine-limit-map.cjs`: ekte lokale temaflater, referansepunkt i Oslo,
  kommunesøk/alias, zoom, forflytning, tofingerzoom, tastatur, lag, tema og ingen
  ekstern NGU-avhengighet ved 1366×768, 1024×768 og 390×844.
- `node tests/marine-limit-integration.cjs`: meny, lenker, lazy iframe,
  tema/avsendervalidering, full kartflate og mobilmeny med tastatur/fokus.
- `node scripts/build-geography-quiz-assets.cjs --check`: bekrefter at de
  eksisterende quizressursene ikke trenger nygenerering.
