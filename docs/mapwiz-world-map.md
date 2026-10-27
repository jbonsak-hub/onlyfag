# MapWiz: fysisk verdenskart

MapWiz bruker ett fysisk verdenskart for alle spørsmål, også norske steder.
Kartets fulle bildeflate dekker 81° nord til 84° sør og alle lengdegrader.
Nordkanten ligger like nord for Svalbard. Standardutsnittet er 81° nord til
58,8° sør, lagret som `initialView` i manifestet, og fyller spillområdet.
Den øvrige sørlige bildeflaten kan nås ved å flytte eller zoome kartet.
Alle 794 oppføringer, inkludert Arktis, Antarktis og Dronning Mauds land,
ligger innenfor det fulle kartet. Arktis har siktepunkt 80° nord, 0° øst,
innenfor den beskårne nordkanten.

## Kartgrunnlag og projeksjon

Den navnefrie fysiske rastren kommer fra [Natural Earth II med landdekke,
skyggerelieff og vann](https://github.com/nvkelso/natural-earth-raster/tree/master/50m_rasters/NE2_50M_LC_SR_W).
Natural Earth-data er public domain. Rasterens equirektangulære original er
10800 × 5400 piksler. Et kompakt, geografisk uendret kildebilde på 5400 × 2700
piksler er pinnet i `assets/geography/sources/mapwiz-world/`, sammen med
originalens hash, kildehenvisning, geografiske grenser og kodingsinnstillinger.
Den store TIFF-filen ligger ikke i nettstedet.

`scripts/build-mapwiz-world-map.py` projiserer kildebildet til Mercator.
Hver utpiksel samles ved sin inverse Mercator-posisjon og bilineær prøving av
kilderastren. Bredde er 3840 piksler; høyden følger kartets faktiske
Mercator-utstrekning. Fargemetning er økt med faktor 1,55 og kontrast med 1,22,
med lysstyrke 0,90. WebP-kvalitet 84 gir et bilde på omtrent 1,06 MB, mot 2,31 MB
for den tidligere kvalitet 93-filen. Disse faste bildeinnstillingene er lagret i manifestet,
og endrer ikke georeferansen. Bilde, hash, dimensjoner, grenser og nordlige kontrollpunkter
lagres i `assets/geography/mapwiz-world-map.json`. Klienten skal bruke akkurat
manifestets `top` og `bottom` for klikk og fasit.

## Bygg og kontroll

Vanlig bygging og kontroll krever bare de pinnede lokale kildene, Pillow og NumPy:

```sh
python scripts/build-mapwiz-world-map.py
python scripts/build-mapwiz-world-map.py --check
```

Ved bevisst bytte av originalkilde kan det kompakte kildebildet regenereres:

```sh
python scripts/build-mapwiz-world-map.py --source-raster NE2_50M_LC_SR_W.tif
```

Kontrollen validerer kilde- og bildehash, pikseldimensjoner, projeksjonsgrenser,
alle 794 oppføringers geografiske dekning, standardutsnitt og fargeinnstillinger,
samt numerisk rundtur for Svalbard, Jan Mayen, Galdhøpiggen, Oslo, Arktis,
Antarktis og Dronning Mauds land.

## Detaljerte vannflater

Det samme relieffbildet brukes fortsatt. Et separat SVG-bilde legger til alle
1 355 innsjøobjekter fra Natural Earth 10m og 194 hovedelveløp (skalarang 0–4).
Vannlaget bruker nøyaktig de samme Mercator-grensene og samme bildeflate som
relieffet. Begge skaleres og flyttes sammen; vannlaget fanger ingen pekere eller
klikk. Øyringer bruker `evenodd`, slik at land på øyer ikke fylles med vann.
Tørre/periodiske innsjøflater tegnes svakere. Kartet har ingen stedsnavn.

De komprimerte, pinnede GeoJSON-kildene ligger ved siden av rasterkilden.
`water-source.json` inneholder originalhash, hash for lokal kilde, opphav,
lisens og objekttall. Natural Earth er public domain. Bygget trenger ingen
nettverkstjeneste. `scripts/mapwiz_water.py` blir brukt av kartbyggeren og
forenkler geometrien med høyst 0,09 kartpiksler før koordinater avrundes.
Det tilsvarer under 0,6 kartpiksler selv ved seks ganger zoom.

SVG-laget er omtrent 1,34 MB før HTTP-komprimering / 466 kB med gzip. Det
lastes som ett cachebart bilde, uten tusenvis av DOM-elementer eller nye
kartforespørsler ved zoom og panorering. SVG-ens layout holdes fast, mens et
komposittlag skaleres med transformasjoner; dette hindrer ny rasterisering av
alle vannkonturene for hvert musehjulsteg. Mørk modus behandler både relieff og
vannlag. `hydrology` i kartmanifestet inneholder bildeadresse, hash, størrelse,
kildehash og 22 navngitte innsjøkontroller, blant annet alle fem Great Lakes,
Bajkal, Titicaca, Vänern og de store østafrikanske sjøene.

`--check` kontrollerer også vannlagets hash, projeksjonsflate, samtlige
innsjøobjekter og navngitte kontroller. `tests/mapwiz-water.cjs` kontrollerer at
laget er lastet og på plass under zoom, lar et ekte innsjøklikk gi riktig
poengsum, gjenbrukes mellom spørsmål og fungerer på mobil og i mørk modus.


Kartbildet og vannlaget forhåndslastes som bilder fra `<head>` på begge
MapWiz-sidene. `build-mapwiz-prototype.cjs` holder adressene i synk med manifestet,
slik at nedlastingen starter mens menyen vises. De tidligere kartfilene beholdes
for klienter som fortsatt har gamle dokumenter i hurtigbufferen.

Zoom med musehjul, berøring og panorering er beholdt; kartet har ingen synlige
zoomknapper. Mørk modus demper begge kartlag med lysstyrke 0,38 og beholder
kontrasten i spørsmål og markører.
