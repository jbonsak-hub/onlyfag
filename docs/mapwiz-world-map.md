# MapWiz: fysisk verdenskart

MapWiz bruker ett fysisk verdenskart for alle spørsmål, også norske steder.
Kartet dekker 82° nord til 58,8° sør og alle lengdegrader. Den utvidede nordlige
kanten gjør at Svalbard og de øvrige 776 eksisterende oppføringene fortsatt
kan plasseres på kartet uten å flytte siktepunkter eller fjerne oppgaver.

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
Mercator-utstrekning. Bilde, hash, dimensjoner, grenser og nordlige kontrollpunkter
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
alle 776 oppføringers geografiske dekning og numerisk rundtur for Svalbard,
Jan Mayen, Galdhøpiggen og Oslo.
