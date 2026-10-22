# World rivers, lakes and marine areas

The offline builder creates 49 rivers and a water map with 33 lakes plus 86
marine areas. Lake, sea/ocean and gulf/strait categories are independently
selectable before a round; lakes are selected initially. An empty selection
disables Start. Selection changes the visible targets, complete round and
server-validated leaderboard together. Pacific and Atlantic each combine their
northern and southern source polygons into one target. The separate European
water quiz has been removed.

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
- The existing local country/coastline snapshot in core.js supplies the shared background.

The packed geographic extract in scripts/build-world-water-maps.cjs is sufficient
for a deterministic offline rebuild. No external tiles, geographic API or map
server is contacted during play. The builder emits geographic SVG paths with
three decimal places, on a 1000×540 canvas spanning 180°W–180°E, 70°S–84°N.
Antarctica is omitted; the Southern Ocean is visible south of 60°S.

## Source corrections and interpretation

- Mackenzie includes Canadian segments only. The Australian namesake is excluded
  by its coordinates, rather than silently merging equal names.
- Congo includes its upstream Lualaba sections. Matching endpoints are stitched;
  the only near-endpoint gap closed is less than 0.012 degree. No straight
  shortcut is drawn across the missing middle course.
- Yangtze retains its differently named upper sections; Mekong retains Lancang
  and Za. Existing detailed courses and lake shorelines remain vectors.
- Glomma, Thames, Po and Elbe are added. Yarlung Tsangpo, Darling, Arkansas and
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
- Marine polygons are clipped against land in the browser. Broad oceans are
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
water category combinations have separate lists.

The world map fills the viewport, with a compact resizable panel floating in
the southwest ocean. Its non-interactive surfaces support dragging. The camera
keeps all geography visible at home zoom, supports wheel/pinch/pan, and never
answers on a drag. Portrait mobile preserves map proportions.

Geometry tests verify inventories, source corrections, coordinate bounds,
hint containment and reproducible builds. Browser tests make real clicks on
every target, test nested regions and small markers, drag the panel, exercise
water selections and complete a server-verified round with shared-language
ranking.

## Complete marine coverage

The 86 marine targets now cover all visible ocean water. Formerly unselected
Natural Earth sea, gulf and channel polygons are unioned into their nearest
logical retained target; the packed snapshot also records every source-to-parent
assignment. Small residual coastal gaps use an ocean-basin catchment beneath
named seas. The coastal residual is derived from sea-connected water in the rendered
country coastlines, after excluding inland lakes. The basin divides follow
continental interiors, the Indonesian arc,
Cape Agulhas, 70°N and 60°S; they are fallback classification, not legal
maritime boundaries. These polygons are clipped against land and an independent
lake-exclusion clip. The southern Antarctic coastline is shown as land so its
interior cannot become Southern Ocean. The other map modules keep their framing.

Named additions and all assignments are in [marine-coverage.md](marine-coverage.md).
Content hashes in built map-data URLs ensure a new question list cannot use an
older cached map. Checks sample 21,600 positions, every geographic target and
20 former coastal gaps. A raster audit checks offshore water separately from unasked inland lakes.

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

## Water categories

### lakes (33)

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

### seas (55)

- Stillehavet — Pacific Ocean
- Indiske hav — Indian Ocean
- Atlanterhavet — Atlantic Ocean
- Sørishavet — Southern Ocean
- Arktiske hav — Arctic Ocean
- Filippinerhavet — Philippine Sea
- Barentshavet — Barents Sea
- Grønlandshavet — Greenland Sea
- Beringhavet — Bering Sea
- Tasmanhavet — Tasman Sea
- Arabiske hav — Arabian Sea
- Norskehavet — Norwegian Sea
- Korallhavet — Coral Sea
- Karahavet — Kara Sea
- Sør-Kinahavet — South China Sea
- Sargassohavet — Sargasso Sea
- Karibiske hav — Caribbean Sea
- Okhotskhavet — Sea of Okhotsk
- Østsibirhavet — East Siberian Sea
- Laptevhavet — Laptev Sea
- Middelhavet — Mediterranean Sea
- Labradorhavet — Labrador Sea
- Beauforthavet — Beaufort Sea
- Japanhavet — Sea of Japan
- Bandasjøen — Banda Sea
- Tsjuktsjerhavet — Chukchi Sea
- Øst-Kinahavet — East China Sea
- Nordsjøen — North Sea
- Javasjøen — Java Sea
- Arafurahavet — Arafura Sea
- Salomonsjøen — Solomon Sea
- Andamanhavet — Andaman Sea
- Svartehavet — Black Sea
- Gulehavet — Yellow Sea
- Rødehavet — Red Sea
- Celebessjøen — Celebes Sea
- Sulusjøen — Sulu Sea
- Timorhavet — Timor Sea
- Østersjøen — Baltic Sea
- Bismarcksjøen — Bismarck Sea
- Keltiske hav — Celtic Sea
- Tyrrenhavet — Tyrrhenian Sea
- Kvitsjøen — White Sea
- Det joniske hav — Ionian Sea
- Adriaterhavet — Adriatic Sea
- Egeerhavet — Aegean Sea
- Hebriderhavet — Sea of the Hebrides
- Irskesjøen — Irish Sea
- Balearhavet — Balearic Sea
- Kretahavet — Sea of Crete
- Alboransjøen — Alboran Sea
- Azovhavet — Sea of Azov
- Liguriabukta — Ligurian Sea
- Marmarahavet — Sea of Marmara
- Bab el-Mandab — Bab el Mandeb

### gulfsStraits (31)

- Baffinbukta — Baffin Bay
- Hudsonbukta — Hudson Bay
- Bengalbukta — Bay of Bengal
- Mexicogulfen — Gulf of Mexico
- Mozambikkanalen — Mozambique Channel
- Alaskabukta — Gulf of Alaska
- Guineabukta — Gulf of Guinea
- Saint Lawrence-bukta — Gulf of Saint Lawrence
- Biscayabukta — Bay of Biscay
- Thailandbukta — Gulf of Thailand
- Carpentariabukta — Gulf of Carpentaria
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
- Rigabukta — Gulf of Riga
- Beringstredet — Bering Strait
- Veneziabukta — Gulf of Venice
- Hormuzstredet — Strait of Hormuz
- Doverstredet — Strait of Dover
- Dardanellene — Dardanelles
- Bosporos — Bosporus Strait
- Gibraltarstredet — Strait of Gibraltar
- Drakepassasjen — Drake Passage
