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
Mercator-utstrekning. Fargemetning er økt med faktor 1,35 og kontrast med 1,12,
med lysstyrke 0,98. Disse faste bildeinnstillingene er lagret i manifestet,
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
