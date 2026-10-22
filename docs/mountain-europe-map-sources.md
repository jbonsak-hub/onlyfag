# World mountain ranges and highlands

The historical builder filename scripts/build-mountain-europe-maps.cjs now
produces only the world mountain map: 27 mountain ranges and seven plateaus or
highland regions. Its output filename is retained for compatibility. The
separate European water module and its unused packed source have been removed.

## Sources and boundaries

Most geographic outlines are from Natural Earth's public-domain
[10m geographic region polygons](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_regions_polys.geojson),
retrieved from the official repository on 22 October 2026. The existing local
Natural Earth country snapshot supplies land and borders. These physical-region
boundaries are generalized geographic areas, not surveyed boundaries. Natural
Earth itself describes their approximate scope on its
[physical labels page](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/).

The original factual range inventory came from the requested Lizard Point
example. No quiz code or artwork was copied. Requested additions are Kunlun,
Carpathians, Apennines, Dinaric Alps and Dolomites; Rwenzori and MacDonnell are
removed. Plateaus use a lighter ochre shade with a subtle dashed edge.

Two features absent from that Natural Earth layer use explicit generalized
educational outlines:

- Dolomites: a small regional outline inside the Alps (about 11.5–12.5°E,
  46.1–46.7°N), informed by the location and extent on the
  [UNESCO Dolomites reference](https://whc.unesco.org/en/list/1237/). It represents
  the mountain region, not the boundaries of the nine protected properties.
- Iranian Plateau: a broad outline inside the Zagros, Alborz/Kopet Dagh and
  Hindu Kush margins, following the physical setting in the
  [Library of Congress country study](https://tile.loc.gov/storage-services/master/frd/frdcstdy/ir/irancountrystudy00curt_0/irancountrystudy00curt_0.pdf).

The seven highlands are Tibetan, Deccan, Iranian and Mongolian plateaus,
Altiplano, Ethiopian Highlands and Brazilian Highlands. The other six plateau
shapes use Natural Earth source coordinates. Sierra Madre combines its three
existing subrange polygons.

Larger parent areas are drawn first, so Altiplano stays visible inside the
Andes and Dolomites inside the Alps. Hint points maximize clearance from both
their own edges and any overlaid smaller area. The offline build retains a
selected coordinate snapshot; paths round to 0.01 SVG unit. The world view is
1000×540, 180°W–180°E and 70°S–84°N. No external tiles are loaded during play.

The shared Kart engine supplies discovery clicks before start, Statle scoring,
full-screen map, floating draggable/resizable panel, zoom/pan and bilingual
names. Geometry and browser tests check every actual geographic target.

## Inventory

- Brasilianske høylandet — Brazilian Highlands
- Tibetplatået — Tibetan Plateau
- Andesfjellene — Andes
- Iranske platået — Iranian Plateau
- Rocky Mountains — Rocky Mountains
- Mongolske platået — Mongolian Plateau
- Appalachene — Appalachian Mountains
- Great Dividing Range — Great Dividing Range
- Sierra Madre — Sierra Madre
- Atlasfjellene — Atlas Mountains
- Altaj — Altai Mountains
- Etiopiske høylandet — Ethiopian Highlands
- Tian Shan — Tian Shan
- Himalaya — Himalayas
- Den skandinaviske fjellkjeden — Scandinavian Mountains
- Uralfjellene — Ural Mountains
- Deccanplatået — Deccan Plateau
- Kunlun — Kunlun Mountains
- Altiplano — Altiplano
- Drakensberg — Drakensberg
- Karpatene — Carpathian Mountains
- Hindu Kush — Hindu Kush
- Zagrosfjellene — Zagros Mountains
- Alpene — Alps
- Kaukasus — Caucasus Mountains
- Øst-Ghat — Eastern Ghats
- Vest-Ghat — Western Ghats
- Dinariske alper — Dinaric Alps
- Karakorum — Karakoram
- Sierra Nevada — Sierra Nevada
- Appenninene — Apennines
- Pyreneene — Pyrenees
- Taurusfjellene — Taurus Mountains
- Dolomittene — Dolomites
