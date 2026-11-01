# Oslo: tre kartvisninger

Oslo-quizen har tre samtidige ikoner øverst til venstre i kartflaten:
**Grønt kart**, **Topografisk kart** og **Satellittfoto**. Hver knapp har en
tekstlig tittel, tilgjengelig navn og `aria-pressed`. Kartbytte påvirker ikke
pågående runde, funn, tid, feil, stedsnavn eller utsnitt.

Den opprinnelige grønne kartvisningen og de 43 eksisterende svarpolygonene
(`oslo-areas-v5`) er uendret. Topografisk kart henter detaljerte offentlige
Kartverket-fliser, med samme UTM33-flisnett som i «Følg dråpen».
Satellittfoto bruker **Esri World Imagery**, som kombinerer satellitt- og
flyfoto fra ulike leverandører og opptaksdatoer. Kildelenke og bildeleverandører
vises i kartflaten når fotolaget er aktivt.

## Kartkilder og registrering

- Kartverket WMTS `topo`: <https://cache.kartverket.no/>,
  `v1/wmts/1.0.0/topo/default/utm33n/{matrix}/{row}/{col}.png`.
  Matriser 00–18, 256 piksler, oppløsning `21664 / 2^matrix` meter per piksel,
  venstre/øvre origo `[-2500000, 9045984]`, EPSG:25833.
- Foto: <https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export>.
  `bboxSR=25833`, `imageSR=25833`, `size=256,256`, `format=jpg`, `f=image`.
  Eksporten bruker samme metriske flisnett som topografisk visning. Kilde:
  Esri, Maxar, Earthstar Geographics og GIS User Community.
- [Kartverkets vilkår](https://www.kartverket.no/api-og-data/vilkar-for-bruk).
- [World Imagery-kildeside](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9).

SVG-kartets `contextCrop` oppgir de samme ETRS89/UTM33-grensene som de nye
kartbildene. Bildene plasseres metrisk i SVG-verdensrommet og deler kameraets
fulle transformasjon. De er egne HTML-bildelag bak SVG; svarenes farger,
hover, klikk/touch og tastaturmål beholder sin geometri. Fotosynlige grenser
har mørk halo og lys frontlinje. OSM-attribusjonen for eksisterende geometri
beholdes.

Kartbilder lastes ved valgt lag. Inntil åtte samtidige forespørsler og høyst
180 bufrede fliser begrenser nettverk og minne. Gamle utsnitt kan ikke flytte
runden ved sen respons. Flisfeil vises separat fra quizens tilbakemelding;
knappene virker fortsatt og samme lag kan velges på nytt for å prøve igjen.
Det gjøres ingen NGU-kall, ingen API-nøkkel legges i nettleseren og det er
ingen ny serverkomponent.

## Verifikasjon

- `node tests/oslo-map-layers.cjs`: tre synlige knapper på PC/mobil, eksakt
  metrisk bilde-/SVG-registrering, zoom, kamera/runde/stedsnavn, faktiske
  polygonklikk og touch, kilder og feilhåndtering.
- `node tests/oslo-bydeler.cjs`: 43 mål, historiske 16/28/57/35-kart, faktisk
  besvarelse, v5-resultater og tema.
- `node tests/terrain-hover-counties.cjs`: hover og tastaturkontur på tvers av
  eksisterende kart, også Oslo på ny topografisk bakgrunn.
- `node --test tests/map-basemap.cjs` og
  `node scripts/build-statle-assets.cjs --check`.

De eksterne karttjenestene er blokkert av arbeidsmiljøets nettfilter. Tester
bruker derfor eksplisitte georefererte flisfixtures og kontrollerer offentlige
URL-parametere og uavhengige UTM-landemerker; dette er ikke fremstilt som en
vellykket direkte avlesning av tjenesten. To tillatte REST-katalogadresser hos
Oslo kommunes karttjeneste ble også undersøkt, men svarte med tilkoblingstimeout.
