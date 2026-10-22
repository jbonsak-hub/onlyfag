# World rivers, lakes and marine areas

The offline builder creates 49 rivers, a separate map of 33 lakes and a map of 73 marine areas. The marine page offers seas/oceans and gulfs/straits, initially both selected. Lakes are never included there. An empty marine selection disables Start. Each page has its own server-validated ranking. The separate European water quiz has been removed.

## Sources

The user-supplied MapsforUPSC river and lake PDFs supplied the initial factual
inventories and visual references. The requested Lizard Point examples supplied
interaction references and additional names. No third-party quiz code, map
artwork, PDF image or watermark is redistributed.

Geographic vector coordinates come from Natural Earth's public-domain
[official repository](https://github.com/nvkelso/natural-earth-vector), retrieved
on 22 October 2026:

- [10m rivers and lake centerlines](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson).
- [10m lakes](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_lakes.geojson).
- [10m marine polygons](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_marine_polys.geojson).
- The original compact country geometry bundled in `core.js` supplies the background coast and country borders. The detailed 10m replacement has been removed; only the 33 quiz lakes are drawn, without thousands of incidental lakes.

The packed geographic extract in scripts/build-world-water-maps.cjs is sufficient
for a deterministic offline rebuild. No external tiles, geographic API or map
server is contacted during play. The builder emits geographic SVG paths with
three decimal places, on a 1000×540 canvas spanning 180°W–180°E, 70°S–84°N.
The southern Antarctic coast is land, and the Southern Ocean is visible south of 60°S.

## Source corrections and interpretation

- Mackenzie includes Canadian segments only. The Australian namesake is excluded
  by its coordinates, rather than silently merging equal names.
- Congo includes its upstream Lualaba sections. Matching endpoints are stitched;
  the only near-endpoint gap closed is less than 0.012 degree. No straight
  shortcut is drawn across the missing middle course.
- Yangtze retains its differently named upper sections; Mekong retains Lancang
  and Za. Existing detailed courses and lake shorelines remain vectors.
- Glomma now uses the complete NVE ELVIS main stem (620.9 km), queried on 22 October 2026 as elvenavn=Glommavassdraget, vnrnfelt=002.Z, outSR=4326. It reaches Fredrikstad (10.956666°E, 59.176492°N); the former Natural Earth course stopped inland. Its geographic line is simplified to 660 vertices. Thames, Po and Elbe are also included. Yarlung Tsangpo, Darling, Arkansas and
  Columbia are removed from this river quiz.
- Superior uses that short Norwegian display name. Mjøsa and Garda use actual
  lake polygons. Lake Tana and Lake Van are removed. Black Sea is a marine
  target only; Caspian Sea appears once, in lakes.
- East China Sea and South China Sea are used; there is no invented North China
  Sea target. Bristol Channel, St George's Channel and North Channel are omitted.
- Hormuz and Bering Strait use explicitly generalized local educational
  polygons, since the selected marine catalogue lacks individual outlines.
  These indicate the straits' locations, not legal maritime boundaries.
- Natural Earth's marine data already splits features at the date line. The
  Arctic polar cap retains its explicit 90° edge, preventing a diagonal seam.
- Marine polygons are simplified and clipped against the same compact land and quiz lake geometry during source preparation. Coastal residuals are assigned to adjacent retained seas. Broad oceans are
  drawn below smaller named seas and gulfs. Tiny lakes and narrow straits retain
  real outlines plus screen-sized markers. Overlapping visible markers resolve
  to the nearest center; invisible touch corridors cannot steal a click on a
  different visible feature. Rivers choose the nearest actual course when
  transparent hit corridors overlap.

## Game and checks

Discovery clicks show names without opening a ranked session. Rounds use the
same time/error bands as Statle: 100/75/50/0, unlimited corrective attempts and
optional skip. There are no practice/test/strict variants. Every assigned target
must be completed before publication. Norwegian and English share each list;
water category combinations have separate lists. After a completed round, the panel offers another practice round containing only targets that were not green. Previously mastered targets stay light green; the remaining targets restart white. This can be repeated until all are green. Retry rounds never create or publish an online session, and do not alter the first round's score. A full restart clears mastery and begins a fresh ordinary round. The shared engine applies this to states, counties, continents and all physical maps.

The world map fills the viewport, with a compact resizable panel floating in
the southwest ocean. Its non-interactive surfaces support dragging. The camera
keeps all geography visible at home zoom, supports wheel/pinch/pan, and never
answers on a drag. Portrait mobile preserves map proportions.

Geometry tests verify inventories, source corrections, coordinate bounds,
hint containment and reproducible builds. Browser tests make real clicks on
every target, test nested regions and small markers, drag the panel, exercise
water selections and complete a server-verified round with shared-language
ranking.


## Glomma source and attribution

Kilde: NVE, [ELVIS hovedelv service](https://kart.nve.no/enterprise/rest/services/Elvenett1/MapServer/1). The [ELVIS dataset](https://www.nve.no/kart/kartdata/vassdragsdata/elvenettverk-elvis/) is made available under [NLOD](https://www.nve.no/kart/kartdata/), with NVE attribution in the river map. Coordinates are a generalized main stem, including mathematical centerlines through lakes, not a copied image. The user’s basin illustration was used only to check the course.

## Complete marine coverage

The twelve provisional extra questions have been absorbed into neighbouring seas. Inland Caspian and Aral water is explicitly excluded. See [marine-coverage.md](marine-coverage.md) for the Scandinavian cleanup, parent assignments and tests.

## Rivers

- Mackenzie — Mackenzie
- Missouri — Missouri
- Ohio — Ohio
- Saint Lawrence — Saint Lawrence
- Colorado — Colorado
- Mississippi — Mississippi
- Rio Grande — Rio Grande
- Amazonas — Amazon
- São Francisco — São Francisco
- Paraguay — Paraguay
- Paraná — Paraná
- Uruguay — Uruguay
- Ob — Ob
- Jenisej — Yenisei
- Lena — Lena
- Volga — Volga
- Dnipro — Dnipro
- Don — Don
- Amur — Amur
- Huang He (Gule flod) — Huang He (Yellow River)
- Yangtze — Yangtze
- Indus — Indus
- Ganges — Ganges
- Brahmaputra — Brahmaputra
- Mekong — Mekong
- Niger — Niger
- Nilen — Nile
- Blå Nilen — Blue Nile
- Hvite Nilen — White Nile
- Kongo — Congo
- Zambezi — Zambezi
- Orange — Orange
- Murray — Murray
- Rhinen — Rhine
- Donau — Danube
- Loire — Loire
- Rhône — Rhône
- Tigris — Tigris
- Eufrat — Euphrates
- Syr-Darja — Syr Darya
- Amu-Darja — Amu Darya
- Senegal — Senegal
- Limpopo — Limpopo
- Yukon — Yukon
- Orinoco — Orinoco
- Glomma — Glomma
- Themsen — Thames
- Po — Po
- Elbe — Elbe

## Lakes (33)

- Store Bjørnesjø — Great Bear Lake
- Store Slavesjø — Great Slave Lake
- Athabascasjøen — Lake Athabasca
- Winnipegsjøen — Lake Winnipeg
- Superior — Lake Superior
- Michigansjøen — Lake Michigan
- Huronsjøen — Lake Huron
- Eriesjøen — Lake Erie
- Ontariosjøen — Lake Ontario
- Store Saltsjø — Great Salt Lake
- Nicaraguasjøen — Lake Nicaragua
- Maracaibosjøen — Lake Maracaibo
- Titicacasjøen — Lake Titicaca
- Vänern — Vänern
- Ladogasjøen — Lake Ladoga
- Onegasjøen — Lake Onega
- Genfersjøen — Lake Geneva
- Kaspihavet — Caspian Sea
- Aralsjøen — Aral Sea
- Balkhasjsjøen — Lake Balkhash
- Bajkalsjøen — Lake Baikal
- Qinghaisjøen — Qinghai Lake
- Dødehavet — Dead Sea
- Tsjadsjøen — Lake Chad
- Turkanasjøen — Lake Turkana
- Victoriasjøen — Lake Victoria
- Tanganyikasjøen — Lake Tanganyika
- Malawisjøen (Nyasa) — Lake Malawi (Nyasa)
- Tonlé Sap — Tonlé Sap
- Tobasjøen — Lake Toba
- Eyresjøen — Lake Eyre
- Mjøsa — Lake Mjøsa
- Gardasjøen — Lake Garda

## Marine categories

### seas (44)

- Stillehavet — Pacific Ocean
- Atlanterhavet — Atlantic Ocean
- Indiske hav — Indian Ocean
- Arktiske hav — Arctic Ocean
- Sørishavet — Southern Ocean
- Filippinerhavet — Philippine Sea
- Barentshavet — Barents Sea
- Grønlandshavet — Greenland Sea
- Beringhavet — Bering Sea
- Tasmanhavet — Tasman Sea
- Arabiske hav — Arabian Sea
- Norskehavet — Norwegian Sea
- Korallhavet — Coral Sea
- Sør-Kinahavet — South China Sea
- Sargassohavet — Sargasso Sea
- Karibiske hav — Caribbean Sea
- Okhotskhavet — Sea of Okhotsk
- Middelhavet — Mediterranean Sea
- Labradorhavet — Labrador Sea
- Japanhavet — Sea of Japan
- Øst-Kinahavet — East China Sea
- Nordsjøen — North Sea
- Arafurahavet — Arafura Sea
- Andamanhavet — Andaman Sea
- Svartehavet — Black Sea
- Gulehavet — Yellow Sea
- Østersjøen — Baltic Sea
- Rødehavet — Red Sea
- Timorhavet — Timor Sea
- Keltiske hav — Celtic Sea
- Tyrrenhavet — Tyrrhenian Sea
- Kvitsjøen — White Sea
- Det joniske hav — Ionian Sea
- Adriaterhavet — Adriatic Sea
- Egeerhavet — Aegean Sea
- Hebriderhavet — Sea of the Hebrides
- Balearhavet — Balearic Sea
- Irskesjøen — Irish Sea
- Kretahavet — Sea of Crete
- Alboransjøen — Alboran Sea
- Azovhavet — Sea of Azov
- Liguriabukta — Ligurian Sea
- Marmarahavet — Sea of Marmara
- Bab el-Mandab — Bab el Mandeb

### gulfsStraits (29)

- Baffinbukta — Baffin Bay
- Hudsonbukta — Hudson Bay
- Bengalbukta — Bay of Bengal
- Mexicogulfen — Gulf of Mexico
- Mozambikkanalen — Mozambique Channel
- Alaskabukta — Gulf of Alaska
- Guineabukta — Gulf of Guinea
- Biscayabukta — Bay of Biscay
- Carpentariabukta — Gulf of Carpentaria
- Thailandbukta — Gulf of Thailand
- Persiske gulf — Persian Gulf
- Adenbukta — Gulf of Aden
- Bottenviken — Gulf of Bothnia
- Malakkastredet — Strait of Malacca
- Californiagulfen — Gulf of California
- Den engelske kanal — English Channel
- Omanbukta — Gulf of Oman
- Skagerrak — Skagerrak
- Finskebukta — Gulf of Finland
- Kattegat — Kattegat
- Magellanstredet — Strait of Magellan
- Beringstredet — Bering Strait
- Veneziabukta — Gulf of Venice
- Hormuzstredet — Strait of Hormuz
- Doverstredet — Strait of Dover
- Dardanellene — Dardanelles
- Bosporos — Bosporus Strait
- Gibraltarstredet — Strait of Gibraltar
- Drakepassasjen — Drake Passage
