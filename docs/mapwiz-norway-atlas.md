# MapWiz: fysisk Norgeskart

> Historisk kartgrunnlag. MapWiz bruker nå verdenskartet for alle spørsmål,
> også norske steder. Atlaset beholdes for tidligere publiserte klienter.

Norske spørsmål i MapWiz viser fastlandet i et stort fysisk kart med egne
utsnitt for Svalbard og Jan Mayen. Kartet velges automatisk for spørsmålet,
uavhengig av om Lett, Middels eller Hjerterå er valgt. Fastlandets nord–sør-utstrekning fyller kartets
høyde. Øyutsnittene har egne målestokker og ligger i havområdet øverst til venstre.
Kartet har ingen stedsnavn som røper svarene. Det gamle, grovt oppskalerte
bredde-/lengdegradskartet er fjernet.

## Kartgrunnlag

Fastlandets detaljerte kyst, innsjøer og skyggelagte terreng kommer fra det
allerede registrerte [fylkeskartet](norway-county-relief-sources.md), med
Kartverkets høydedata (CC BY 4.0). Fysiske terrengfarger kommer fra Natural Earth
II med landdekke, skyggerelieff og vann. Øykystene kommer fra Natural Earths
1:10m administrative kartgeometri. Natural Earth-data er public domain.

- [Natural Earth raster](https://github.com/nvkelso/natural-earth-raster)
- [Natural Earth 1:10m map units](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_map_units.geojson)
- [Kartverkets vilkår](https://www.kartverket.no/api-og-data/vilkar-for-bruk)

De små geografiske fargeutsnittene og den arktiske kystgeometrien ligger som
pinnede kilder i `assets/geography/sources/mapwiz-norway/`. Hele den globale
originalrastren kopieres ikke inn i nettstedet. Kilde- og bildehash, dimensjoner,
alle projeksjonsparametere og plasseringene av utsnittene lagres i
`assets/geography/mapwiz-norway-atlas.json`.

## Koordinater og poeng

Fastlandet bruker den samme registrerte Lambert-koniske projeksjonen som
fylkeskartets terreng. Svalbard og Jan Mayen bruker hvert sitt lokale
bredde-/lengdegradsutsnitt. Runtime-funksjonene
`MapWizNorway.project(lat, lon)` og `MapWizNorway.inverse(x, y)` deler nøyaktig
samme metadata som bildebyggeren. De normaliserte x/y-koordinatene gjelder hele
atlaset. Klikk i et øyutsnitt tolkes i det utsnittets geografi, ikke som et klikk
på tilsvarende sted på fastlandet. Klikk utenfor atlaset avvises.

Offline-poeng, serverinnsendte koordinater, fasitmarkører og resultatlinjer
bruker de samme funksjonene. Eksisterende lat/lon beholdes som geografiske
data; piksler blir aldri lagret som geografiske koordinater. Svalbards siktepunkt
er korrigert fra havet ved 78° N, 20° Ø til fast land på Spitsbergen
(78.75° N, 17.5° Ø). Jan Mayens siktepunkt er presisert til
70.987° N, 8.421° V. Begge er kontrollert innenfor 1:10m-landgeometrien.

## Bygg og kontroll

Vanlig bygging er helt offline:

```sh
python scripts/build-mapwiz-norway-atlas.py
python scripts/build-mapwiz-norway-atlas.py --check
```

Ved et bevisst kildebytte kan små kildeutsnitt først regenereres fra den globale
4326-rastren og Natural Earth-geometrien:

```sh
python scripts/build-mapwiz-norway-atlas.py \
  --raster NE2_50M_LC_SR_W.tif \
  --islands ne_10m_admin_0_map_units.geojson
```

Byggeren skriver en lossless WebP med innholdshash i filnavnet, manifestet og
runtime-metadata i `geowiz.js`. Kjør deretter de vanlige geografi- og
poengdatabyggerne. `--check` validerer alle lokale kildehash, bildepikseldimensjoner
og at runtime-projeksjonen fortsatt er identisk med det genererte bildet.
Nettlesertestene kontrollerer dessuten projeksjon/rundtur for alle norske
siktepunkter, treffpoeng og markørplassering etter endring av vindusstørrelse.
