# Oslo: tre kartvisninger

Oslo-quizen har tre samtidige ikoner øverst til venstre i kartflaten:
**Grønt kart**, **Fysisk kart** og **Satellittfoto**. Hver knapp har en
tekstlig tittel, tilgjengelig navn og `aria-pressed`. Kartbytte påvirker ikke
pågående runde, funn, tid, feil, stedsnavn eller utsnitt.

Den opprinnelige grønne kartvisningen og de 43 eksisterende svarpolygonene
(`oslo-areas-v5`) er uendret. Fysisk kart gjenbruker det navnefrie, lokalt lagrede terrengbildet fra før
oppdateringen med tre kartknapper: `norway-relief/oslo-35ca7392dbd0.webp`,
registrert gjennom `norway-relief.json → regions.oslo`. Det laster ingen
navneavslørende topografiske kartfliser.
Satellittfoto bruker **Esri World Imagery (WGS84)**, som kombinerer satellitt- og
flyfoto fra ulike leverandører og opptaksdatoer. Kildelenke og bildeleverandører
vises i kartflaten når fotolaget er aktivt.

## Kartkilder og registrering

- Fysisk kart: eksisterende `norway-relief.json`, `regions.oslo`, lokalt WebP-bilde
  `norway-relief/oslo-35ca7392dbd0.webp` på 4096×3955 piksler. Samme fil og
  georeferering som før trevisningsoppdateringen, uten stedsnavn.
- Foto: <https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer>.
  Offisiell Esri-kildeside: item `898f58f2ee824b3c97bae0698563a4b3`.
  Denne tjenesten leverer `TilesOnly`; den støtter ikke bildeeksport. Faktiske
  JPEG-fliser hentes som `/tile/{nivå}/{rad}/{kolonne}` på et geografisk WGS84-rutenett,
  med origo `[-180,90]` og flisbredde `180 / 2^nivå` grader. Nivå 0–22.
  Den gamle `services.arcgisonline.com/.../export`-banen brukes ikke lenger.
  Kilde: Esri, Maxar, Earthstar Geographics og GIS User Community.
- [Kartverkets vilkår](https://www.kartverket.no/api-og-data/vilkar-for-bruk).
- [World Imagery-kildeside](https://www.arcgis.com/home/item.html?id=898f58f2ee824b3c97bae0698563a4b3).

SVG-kartets `contextCrop` oppgir ETRS89/UTM33-grensene. Fysisk kart bruker
samme lokale bilde og registrering som før. Satellittfotoet tegnes i et eget
Canvas-lag bak svar-SVG-en: hver WGS84-flis omprojiseres med et 8×8 teksturnett
og GRS80/UTM33-projeksjon. Overlappende klipping og dupliserte kantpiksler
hindrer gjennomsiktige skjøter i teksturnettet. Flisene strekkes dermed ikke som rektangler mellom
ulik projeksjon. Kameraet deles med quizens SVG, mens svarenes farger, hover,
klikk/touch og tastaturmål beholder sin geometri. Fotosynlige grenser har mørk
halo og lys frontlinje. OSM-attribusjonen for eksisterende geometri beholdes.

Kartbilder lastes ved valgt lag. Inntil åtte samtidige forespørsler og høyst
120 bufrede fliser begrenser nettverk og minne. Gamle utsnitt kan ikke flytte
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
  eksisterende kart, også Oslo på det gjeninnførte navnefrie terrengbildet.
- `node --test tests/map-basemap.cjs` og
  `node scripts/build-statle-assets.cjs --check`.

Den nye offisielle WGS84-kilden er direkte kontrollert: Oslo-flisen
`/tile/15/5477/34724` svarer HTTP 200, `image/jpeg`, 21 801 byte og
`Access-Control-Allow-Origin: *`. Den inneholder faktisk flyfoto med veier og bygninger.
Uavhengige pyproj-referanser og georefererte testfliser kontrollerer pikselregistrering.
En egen opasitetskontroll finner eventuelle skjøter i teksturnettet på PC og mobil, også etter zoom.
`OSLO_REAL_PHOTO_CHECK=1 node tests/oslo-map-layers.cjs` laster ekte JPEG-fliser
og kontrollerer at de kan dekodes og tegnes i kartet uten CORS-feil.
