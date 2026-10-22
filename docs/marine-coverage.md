# Marine answer coverage

The water map contains 33 lakes, 55 seas/oceans and 31 gulfs/straits. Selecting
both marine groups fills the complete visible ocean with usable answer geometry.
This is a geometry repair, not a background-colour change. Lake and land areas
are excluded with intersecting SVG clips; geometry hit resolution applies the
same exclusions, preventing an invisible ocean catchment from stealing a lake's
enlarged touch target.

## Twelve added targets

- Beauforthavet — Beaufort Sea
- Tsjuktsjerhavet — Chukchi Sea
- Østsibirhavet — East Siberian Sea
- Karahavet — Kara Sea
- Laptevhavet — Laptev Sea
- Javasjøen — Java Sea
- Bandasjøen — Banda Sea
- Sulusjøen — Sulu Sea
- Celebessjøen — Celebes Sea
- Bismarcksjøen — Bismarck Sea
- Salomonsjøen — Solomon Sea
- Saint Lawrence-bukta — Gulf of Saint Lawrence

Names were checked against Norwegian geographic usage, including
[Artsdatabanken's Arctic description](https://www2.artsdatabanken.no/faktaark/Faktaark212.pdf),
[SNL's ocean catalogue](https://snl.no/.temaside/verdenshav),
[Bandasjøen](https://snl.no/Bandasj%C3%B8en),
[Sulusjøen](https://snl.no/Sulusj%C3%B8en),
[Saint Lawrence-bukta](https://snl.no/Saint_Lawrence-bukta) and
[the University of Copenhagen's Norwegian Bismarcksjøen label](https://hum.ku.dk/kunst-paa-tors/verden-i-korrekt-maalestok/).
No text or artwork from these references is redistributed.

## Geographic transformation

The original Natural Earth 10m marine snapshot supplies detailed shores and
regional extents. Missing named source regions are attached to a retained
logical parent. Explicit decisions take precedence over nearest-boundary
assignment, especially around the Canadian archipelago and Indonesia. For
example, Campeche belongs to Mexico, Tonkin to South China, Bohai to Yellow
Sea, Bristol Channel to Celtic Sea, and the two removed Irish channels to
Irish Sea. The latter two reuse their previous local geographic extents.

The unioned result is embedded in the builder's geographic snapshot, together
with the auditable assignment table below. The normal offline build needs only
Node built-ins; no geographic service or boolean library runs in the browser.
The source transformation used polygon union/difference operations to remove
shared internal edges. The five great oceans receive only the residual left outside the complete
source catalogue that is connected to sea water in the rendered coastlines.
All Natural Earth inland lakes are excluded before deciding connectivity.
Conventional basin catchments classify this coastal residual behind named
sea areas. Source catalogue coordinates remain the authority
where an actual named region exists.

The southern Antarctic coast is drawn as land in this map, because a complete
marine catchment must not label Antarctica as water. Inland quiz lakes are
clipped separately from country polygons. Screen-space hit resolution also
checks these masks: SVG isPointInFill alone ignores clipping.

Built map JSON requests carry the content hash of the corresponding dataset.
Updated HTML and code therefore do not reuse an older cached target inventory.
The server data is rebuilt from the same file; Norwegian and English retain
their shared category-specific rankings. Old scores are preserved and the
maximum for a full water selection grows with the twelve additional targets.
No D1 schema change is required. Deploy the Worker with the matching frontend.

## Verification

- Dense independent geometry grid: 21,600 positions across the whole world view.
- Real geographic clicks on all 202 physical-map targets.
- Twenty open-water and former coastal-hole clicks; land/Caspian/Victoria
  remain excluded when lakes are off.
- Full verified rounds, category-specific server pools and shared language.
- Raster audit of the 1350×627 marine canvas, distinguishing inland water.
- Content-versioned JSON request checked against the map's SHA-256 digest.

## Source-to-parent assignments

| Source region | Quiz answer |
| --- | --- |
| Albemarle Sound | Atlanterhavet |
| Amazon River | Atlanterhavet |
| Amundsen Gulf | Beauforthavet |
| Amundsen Sea | Sørishavet |
| Antongila Bay | Indiske hav |
| Bahía Blanca | Atlanterhavet |
| Bahía de Campeche | Mexicogulfen |
| Bahía Grande | Atlanterhavet |
| Baia de Maputo | Mozambikkanalen |
| Baía de Marajó | Atlanterhavet |
| Baía de São Marcos | Atlanterhavet |
| Baird Inlet | Beringhavet |
| Bali Sea | Javasjøen |
| Bass Strait | Tasmanhavet |
| Bathurst Inlet | Arktiske hav |
| Bay Inútil | Magellanstredet |
| Bay of Fundy | Atlanterhavet |
| Bay of Plenty | Stillehavet |
| Bellingshausen Sea | Sørishavet |
| Bight of Benin | Guineabukta |
| Bight of Biafra | Guineabukta |
| Bo Hai | Gulehavet |
| Boca Grande | Atlanterhavet |
| Bohol Sea | Sulusjøen |
| Boknafjorden | Nordsjøen |
| Bransfield Strait | Sørishavet |
| Bras d'Or Lake | Atlanterhavet |
| Bristol Bay | Beringhavet |
| Bristol Channel | Keltiske hav |
| Canal do Norte | Atlanterhavet |
| Canal do Sul | Atlanterhavet |
| Canal Perigoso | Atlanterhavet |
| Ceram Sea | Bandasjøen |
| Chaun Bay | Østsibirhavet |
| Chesapeake Bay | Atlanterhavet |
| Columbia River | Stillehavet |
| Cook Inlet | Alaskabukta |
| Cook Strait | Stillehavet |
| Cordova Bay | Stillehavet |
| Cumberland Sound | Labradorhavet |
| Darnley Bay | Beauforthavet |
| Davao Gulf | Filippinerhavet |
| Davis Sea | Sørishavet |
| Davis Strait | Baffinbukta |
| Delaware Bay | Atlanterhavet |
| Denmark Strait | Grønlandshavet |
| Disko Bay | Baffinbukta |
| Dixon Entrance | Stillehavet |
| Dmitriy Laptev Strait | Østsibirhavet |
| East Korea Bay | Japanhavet |
| Eclipse Sound | Baffinbukta |
| Flores Sea | Bandasjøen |
| Foxe Basin | Hudsonbukta |
| Franklin Bay | Beauforthavet |
| Frobisher Bay | Labradorhavet |
| Fury and Hecla Strait | Hudsonbukta |
| Garabogaz Bay | Svartehavet |
| Geographe Bay | Indiske hav |
| George VI Sound | Sørishavet |
| Goldsmith Channel | Arktiske hav |
| Golfe du Lion | Middelhavet |
| Golfo Corcovado | Stillehavet |
| Golfo de Guayaquil | Stillehavet |
| Golfo de Panamá | Stillehavet |
| Golfo de Penas | Stillehavet |
| Golfo de Tehuantepec | Stillehavet |
| Golfo de Urabá | Karibiske hav |
| Golfo San Jorge | Atlanterhavet |
| Golfo San Matías | Atlanterhavet |
| Great Australian Bight | Indiske hav |
| Great Barrier Reef | Korallhavet |
| Guba Gusinaya | Østsibirhavet |
| Gulf of Anadyr' | Beringhavet |
| Gulf of Aqaba | Rødehavet |
| Gulf of Boothia | Arktiske hav |
| Gulf of Buli | Stillehavet |
| Gulf of Gabès | Middelhavet |
| Gulf of Honduras | Karibiske hav |
| Gulf of Kamchatka | Stillehavet |
| Gulf of Kau | Stillehavet |
| Gulf of Khambhät | Arabiske hav |
| Gulf of Kutch | Arabiske hav |
| Gulf of Maine | Atlanterhavet |
| Gulf of Mannar | Bengalbukta |
| Gulf of Martaban | Andamanhavet |
| Gulf of Masira | Arabiske hav |
| Gulf of Ob | Karahavet |
| Gulf of Olen‘k | Laptevhavet |
| Gulf of Papua | Korallhavet |
| Gulf of Sakhalin | Okhotskhavet |
| Gulf of Sidra | Middelhavet |
| Gulf of Suez | Rødehavet |
| Gulf of Tomini | Stillehavet |
| Gulf of Tonkin | Sør-Kinahavet |
| Gulf of Yana | Laptevhavet |
| Gulf St. Vincent | Indiske hav |
| Hadley Bay | Arktiske hav |
| Hall Basin | Arktiske hav |
| Halmahera Sea | Stillehavet |
| Hamilton Inlet | Labradorhavet |
| Hangzhou Bay | Øst-Kinahavet |
| Hecate Strait | Stillehavet |
| Hudson Strait | Hudsonbukta |
| Husky Lakes | Beauforthavet |
| Inner Sea | Japanhavet |
| Inner Seas | Hebriderhavet |
| James Bay | Hudsonbukta |
| Jones Sound | Baffinbukta |
| Joseph Bonaparte Gulf | Timorhavet |
| Kaliningrad | Østersjøen |
| Kane Basin | Baffinbukta |
| Kangertittivaq | Grønlandshavet |
| Karaginskiy Gulf | Beringhavet |
| Karskiye Strait | Karahavet |
| Kennedy Channel | Arktiske hav |
| Khatanga Gulf | Laptevhavet |
| Korea Strait | Øst-Kinahavet |
| Kotzebue Sound | Tsjuktsjerhavet |
| Kronotskiy Gulf | Stillehavet |
| La Pérouse Strait | Japanhavet |
| Laccadive Sea | Indiske hav |
| Lagoa dos Patos | Atlanterhavet |
| Lake Pontchartrain | Mexicogulfen |
| Leyte Gulf | Filippinerhavet |
| Liddon Gulf | Arktiske hav |
| Lincoln Sea | Arktiske hav |
| Long Island Sound | Atlanterhavet |
| Luzon Strait | Filippinerhavet |
| Lützow-Holm Bay | Sørishavet |
| M'Clure Strait | Arktiske hav |
| Mackenzie Bay | Beauforthavet |
| Makassar Strait | Javasjøen |
| Marguerite Bay | Sørishavet |
| Massachusetts Bay | Atlanterhavet |
| Matochkin Shar Strait | Karahavet |
| McMurdo Sound | Sørishavet |
| Mecklenburger Bucht | Østersjøen |
| Melville Bay | Baffinbukta |
| Minto Inlet | Beauforthavet |
| Molucca Sea | Stillehavet |
| Monterey Bay | Stillehavet |
| Murchison Sound | Baffinbukta |
| North Channel | Irskesjøen |
| Norton Sound | Beringhavet |
| Ozero Mogotoyevo | Østsibirhavet |
| Palk Strait | Bengalbukta |
| Pamlico Sound | Atlanterhavet |
| Peacock Sound | Sørishavet |
| Porpoise Bay | Sørishavet |
| Prince ALbert Sound | Arktiske hav |
| Prince of Wales Strait | Arktiske hav |
| Prince William Sound | Alaskabukta |
| Prydz Bay | Sørishavet |
| Qiongzhou Strait | Sør-Kinahavet |
| Queen Charlotte Sound | Stillehavet |
| Queen Charlotte Strait | Stillehavet |
| Ragay Gulf | Filippinerhavet |
| Richard Collinson Inlet | Beauforthavet |
| Río de la Plata | Atlanterhavet |
| Robeson Channel | Arktiske hav |
| Ronne Entrance | Sørishavet |
| Ross Sea | Sørishavet |
| Saint Lawrence River | Saint Lawrence-bukta |
| Salish Sea | Stillehavet |
| Samar Sea | Filippinerhavet |
| San Francisco Bay | Stillehavet |
| Savu Sea | Indiske hav |
| Scotia Sea | Sørishavet |
| Selat Bali | Javasjøen |
| Selat Dampier | Stillehavet |
| Seno de Skyring | Stillehavet |
| Seno Otway | Magellanstredet |
| Shark Bay | Indiske hav |
| Shelikhova Gulf | Okhotskhavet |
| Sherman Basin | Arktiske hav |
| Sibuyan Sea | Sulusjøen |
| Smith Sound | Stillehavet |
| Sognefjorden | Nordsjøen |
| St. George’s Channel | Irskesjøen |
| St. Helena Bay | Atlanterhavet |
| Stettiner Haff | Østersjøen |
| Storfjorden | Barentshavet |
| Strait of Belle Isle | Labradorhavet |
| Strait of Singapore | Sør-Kinahavet |
| Straits of Florida | Mexicogulfen |
| Sulzberger Bay | Sørishavet |
| Surigao Strait | Filippinerhavet |
| Taiwan Strait | Sør-Kinahavet |
| Tatar Strait | Japanhavet |
| Tayabas Bay | Filippinerhavet |
| The North Western Passages | Arktiske hav |
| Torres Strait | Arafurahavet |
| Trondheimsfjorden | Norskehavet |
| Tsugaru Strait | Japanhavet |
| Uchiura Bay | Stillehavet |
| Uda Bay | Okhotskhavet |
| Ungava Bay | Labradorhavet |
| Uummannaq Fjord | Baffinbukta |
| Vestfjorden | Norskehavet |
| Vil'kitskogo Strait | Karahavet |
| Vincennes Bay | Sørishavet |
| Visayan Sea | Sulusjøen |
| Viscount Melville Sound | Arktiske hav |
| Waddenzee | Nordsjøen |
| Wager Bay | Hudsonbukta |
| Weddell Sea | Sørishavet |
| Wrigley Gulf | Sørishavet |
| Wynniatt Bay | Arktiske hav |
| Yangtze River | Øst-Kinahavet |
| Yenisey Gulf | Karahavet |
| Yucatan Channel | Karibiske hav |
| Øresund | Østersjøen |
