# World rivers, lakes and marine areas

The offline builder creates 49 rivers and a water map with 33 lakes plus 74
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

### seas (44)

- Stillehavet — Pacific Ocean
- Atlanterhavet — Atlantic Ocean
- Indiske hav — Indian Ocean
- Sørishavet — Southern Ocean
- Arktiske hav — Arctic Ocean
- Filippinerhavet — Philippine Sea
- Barentshavet — Barents Sea
- Grønlandshavet — Greenland Sea
- Tasmanhavet — Tasman Sea
- Arabiske hav — Arabian Sea
- Korallhavet — Coral Sea
- Norskehavet — Norwegian Sea
- Beringhavet — Bering Sea
- Sargassohavet — Sargasso Sea
- Sør-Kinahavet — South China Sea
- Karibiske hav — Caribbean Sea
- Okhotskhavet — Sea of Okhotsk
- Middelhavet — Mediterranean Sea
- Labradorhavet — Labrador Sea
- Japanhavet — Sea of Japan
- Nordsjøen — North Sea
- Øst-Kinahavet — East China Sea
- Arafurahavet — Arafura Sea
- Andamanhavet — Andaman Sea
- Svartehavet — Black Sea
- Rødehavet — Red Sea
- Gulehavet — Yellow Sea
- Timorhavet — Timor Sea
- Østersjøen — Baltic Sea
- Tyrrenhavet — Tyrrhenian Sea
- Keltiske hav — Celtic Sea
- Kvitsjøen — White Sea
- Det joniske hav — Ionian Sea
- Adriaterhavet — Adriatic Sea
- Egeerhavet — Aegean Sea
- Balearhavet — Balearic Sea
- Kretahavet — Sea of Crete
- Hebriderhavet — Sea of the Hebrides
- Irskesjøen — Irish Sea
- Alboransjøen — Alboran Sea
- Azovhavet — Sea of Azov
- Liguriabukta — Ligurian Sea
- Marmarahavet — Sea of Marmara
- Bab el-Mandab — Bab el Mandeb

### gulfsStraits (30)

- Bengalbukta — Bay of Bengal
- Baffinbukta — Baffin Bay
- Mexicogulfen — Gulf of Mexico
- Hudsonbukta — Hudson Bay
- Mozambikkanalen — Mozambique Channel
- Alaskabukta — Gulf of Alaska
- Guineabukta — Gulf of Guinea
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
- Rigabukta — Gulf of Riga
- Beringstredet — Bering Strait
- Veneziabukta — Gulf of Venice
- Magellanstredet — Strait of Magellan
- Hormuzstredet — Strait of Hormuz
- Doverstredet — Strait of Dover
- Dardanellene — Dardanelles
- Bosporos — Bosporus Strait
- Gibraltarstredet — Strait of Gibraltar
- Drakepassasjen — Drake Passage
