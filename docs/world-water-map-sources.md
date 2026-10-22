# World rivers and lakes click maps

`assets/geography/physical-maps/world-water.json` contains 49 river targets and
33 lake targets. The two maps share one vector country background, with separate
river and lake targets. No external map server is needed during a round.

## References and provenance

The user supplied **Major-Rivers-of-the-World.pdf** and
**Major-Lakes-of-the-World.pdf**, both maps by MapsforUPSC. Their complete first
pages were rendered and inspected as feature inventories and visual references:
36 named rivers, and 33 named lakes. Their PDF artwork, label placement,
watermarks and title designs are not redistributed. The maps in this module are
new SVG paths drawn from public geographic data.

The requested [Lizard Point world rivers quiz](https://lizardpoint.com/geography/world-rivers-quiz.php)
was inspected to understand the interaction and identify useful additional
major rivers. Its public question-name file can be read, but neither its
JavaScript nor its map artwork is copied. Its 13 extra rivers relative to the
PDF inventory are Rhine, Danube, Loire, Rhone, Tigris, Euphrates, Syr Darya,
Amu Darya, Senegal, Limpopo, Columbia, Yukon, and Orinoco.

Actual geographic coordinates come from Natural Earth's public-domain vectors,
retrieved from the project's official repository on 2026-10-22:

- [10m rivers and lake centerlines, official GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson),
  described on the [Natural Earth download page](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/).
- [10m lakes, official GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_lakes.geojson),
  described on the [Natural Earth download page](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/).
- [10m marine polygons, official GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_marine_polys.geojson)
  supply Caspian Sea and Maracaibo, absent from the lakes layer.
- Countries and coastlines use the same local Natural Earth snapshot already
  embedded in `assets/geography/core.js`, avoiding another copy of world data.

Natural Earth's [terms of use](https://www.naturalearthdata.com/about/terms-of-use/)
place its vector and raster data in the public domain. The hydrography pages
describe their basic 10m layers as version 5.0.0. The embedded selected snapshot,
rather than an unpinned current download, is the rebuild input.

## Geographic and display decisions

- Both maps use the same equirectangular window: longitude -180 to 180,
  latitude -58 to 80, mapped to `viewBox="0 0 1000 590"`. Antarctica is absent.
  Coordinates stay vector geometry at every supported zoom level.
- The country background is shared at the document's top-level `background`.
  Each region has a `viewBox`, bilingual title and `states` with `n`, `en`, `d`,
  `c`, `kind`, and `hitWidth`. A lake also has `marker` when its projected area is
  below 20 square map units. These small dark dots make very small water bodies
  visible without replacing their true outlines.
- `d` contains open stroked river paths or closed filled lake polygons, including
  islands as holes. Lake fills require `fill-rule="evenodd"`. `c` is on the
  actual target: a mid-course point for rivers or an interior point for lakes.
  The transparent click stroke is wider than the visible water geometry.
- Countries remain pale; water targets are intended to render in dark navy,
  visibly distinct from the lighter ocean. Names are not baked into the SVG.
- Natural Earth's named sections are combined to show the full Yangtze
  (Tuotuo, Tongtian, Jinsha, Chang Jiang, Yangtze) and Mekong
  (Za, Lancang, Mekong), rather than only their downstream English-named parts.
- The PDF asks for Yarlung Tsangpo separately from Brahmaputra, and for Nile,
  Blue Nile, and White Nile separately. Their respective named reaches remain
  separate answer targets. Main Nile starts at the Blue/White Nile confluence.
- Natural Earth river number 36 calls both the upper Paraguay and lower Parana
  `Parana`. These are separated at their actual confluence near
  58.605 W, 27.315 S. Parana number 99 supplies the eastern upper course.
- Natural Earth's Saint Lawrence line ends near Montreal. A generalized authored
  centerline follows the mapped estuary through Quebec and downstream to about
  68.04 W, 48.59 N. It is a geographic connector, not a copied reference-map line.
- North and South Aral Sea form one Aral Sea answer; North and South Lake Eyre
  form one Lake Eyre answer. Both Dead Sea polygons belong to one answer.
  Lake Superior includes Whitefish Bay. Lake Maracaibo is retained because the
  user's lake reference includes this coastal lagoon.
- Water levels and shorelines are the source dataset's generalized snapshot.
  They are geographic learning shapes, not a current water-level measurement.

## Offline rebuild and checks

Run `node scripts/build-world-water-maps.cjs` to rebuild, or append `--check`
to verify committed output. The script keeps a gzip-compressed snapshot of only
the selected hydrographic coordinates. No download or Node dependency is
required. Geographic simplification remains below a pixel even at the UI's
maximum zoom, and emitted SVG coordinates retain three decimal places.

The builder validates unique bilingual target names, nonempty finite paths,
in-map target points, and the complete expected 49/33 inventories. Browser
verification additionally checks each river point with `isPointInStroke` and
each lake point with `isPointInFill`, and both rendered maps were reviewed.


## World rivers inventory

| Norwegian | English |
| --- | --- |
| Mackenzie | Mackenzie |
| Missouri | Missouri |
| Arkansas | Arkansas |
| Ohio | Ohio |
| Saint Lawrence | Saint Lawrence |
| Colorado | Colorado |
| Mississippi | Mississippi |
| Rio Grande | Rio Grande |
| Amazonas | Amazon |
| São Francisco | São Francisco |
| Paraguay | Paraguay |
| Paraná | Paraná |
| Uruguay | Uruguay |
| Ob | Ob |
| Jenisej | Yenisei |
| Lena | Lena |
| Volga | Volga |
| Dnipro | Dnipro |
| Don | Don |
| Amur | Amur |
| Yarlung Tsangpo | Yarlung Tsangpo |
| Huang He (Gule flod) | Huang He (Yellow River) |
| Yangtze | Yangtze |
| Indus | Indus |
| Ganges | Ganges |
| Brahmaputra | Brahmaputra |
| Mekong | Mekong |
| Niger | Niger |
| Nilen | Nile |
| Blå Nilen | Blue Nile |
| Hvite Nilen | White Nile |
| Kongo | Congo |
| Zambezi | Zambezi |
| Orange | Orange |
| Darling | Darling |
| Murray | Murray |
| Rhinen | Rhine |
| Donau | Danube |
| Loire | Loire |
| Rhône | Rhône |
| Tigris | Tigris |
| Eufrat | Euphrates |
| Syr-Darja | Syr Darya |
| Amu-Darja | Amu Darya |
| Senegal | Senegal |
| Limpopo | Limpopo |
| Columbia | Columbia |
| Yukon | Yukon |
| Orinoco | Orinoco |

## World lakes inventory

| Norwegian | English |
| --- | --- |
| Store Bjørnesjø | Great Bear Lake |
| Store Slavesjø | Great Slave Lake |
| Athabascasjøen | Lake Athabasca |
| Winnipegsjøen | Lake Winnipeg |
| Øvresjøen (Superior) | Lake Superior |
| Michigansjøen | Lake Michigan |
| Huronsjøen | Lake Huron |
| Eriesjøen | Lake Erie |
| Ontariosjøen | Lake Ontario |
| Store Saltsjø | Great Salt Lake |
| Nicaraguasjøen | Lake Nicaragua |
| Maracaibosjøen | Lake Maracaibo |
| Titicacasjøen | Lake Titicaca |
| Vänern | Vänern |
| Ladogasjøen | Lake Ladoga |
| Onegasjøen | Lake Onega |
| Genfersjøen | Lake Geneva |
| Kaspihavet | Caspian Sea |
| Aralsjøen | Aral Sea |
| Balkhasjsjøen | Lake Balkhash |
| Bajkalsjøen | Lake Baikal |
| Qinghaisjøen | Qinghai Lake |
| Vansjøen (Tyrkia) | Lake Van |
| Dødehavet | Dead Sea |
| Tsjadsjøen | Lake Chad |
| Tanasjøen | Lake Tana |
| Turkanasjøen | Lake Turkana |
| Victoriasjøen | Lake Victoria |
| Tanganyikasjøen | Lake Tanganyika |
| Malawisjøen (Nyasa) | Lake Malawi (Nyasa) |
| Tonlé Sap | Tonlé Sap |
| Tobasjøen | Lake Toba |
| Eyresjøen | Lake Eyre |
