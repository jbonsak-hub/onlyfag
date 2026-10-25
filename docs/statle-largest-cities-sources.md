# Statle largest cities: sources and definition

Verified 25 October 2026. The new advanced mode uses the most populous **city/place within each state**, not metropolitan-area population or land area. The population reference is the U.S. Census Bureau's **Vintage 2025, July 1, 2025 resident population estimates**, released in May 2026. This was the latest completed national city/town estimate vintage at verification.

## Population and place identity

- [Census City and Town Population Totals: 2020–2025](https://www.census.gov/data/datasets/time-series/demo/popest/2020s-total-cities-and-towns.html).
- [National SUB-IP-EST2025-POP workbook](https://www2.census.gov/programs-surveys/popest/tables/2020-2025/cities/totals/SUB-IP-EST2025-POP.xlsx). All rows were grouped by state and the maximum of the **2025** column selected; all 50 states were checked.
- [2025 Census Gazetteer documentation](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2025.html) and [national place Gazetteer](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_place_national.zip). Every selected official place name was joined to its state's Gazetteer record to retain the Census GEOID.

Consolidated cities use the Census city/balance entry: Anchorage municipality, Indianapolis city (balance), Louisville/Jefferson County metro government (balance), and Nashville-Davidson metropolitan government (balance). The short game labels are Anchorage, Indianapolis, Louisville and Nashville. These are not metro-area rankings. Hawaii has no separately incorporated municipalities; the national Census workbook includes **Urban Honolulu CDP**, which is used and labelled **Honolulu**. Its population is not that of the City and County of Honolulu / the whole island of Oahu. "New York city" is labelled "New York City".

The less obvious current winners were explicitly checked: Alabama **Huntsville** (233,627), South Carolina **Charleston** (159,423), Tennessee **Nashville** (721,074), West Virginia **Charleston** (46,117), and Kentucky **Louisville** (641,962).

## Geographic city points

Coordinates use [Natural Earth's 1:10m Populated Places, version 5.1.2](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) ([GeoJSON source](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson)). Every point was matched by city name, US country code **and state**, avoiding the Huntsville in Texas, the Burlington in Iowa, or the other Charleston. These are city point locations, rather than the sometimes distant representative centroids of large administrative city territories. **Natural Earth population fields were not used for city ranking.** Natural Earth data are [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

Kansas City uses the matching **Missouri Census Gazetteer internal point** (GEOID 2938000) instead of Natural Earth's approximate point immediately beside the Kansas/Missouri line. Both refer to Kansas City, Missouri; the chosen official city point falls more clearly within Missouri's retained geometry.

`lon`/`lat` are geographic city points. `p` is that same point projected into the original, unchanged `us-states.json` coordinates. Mainland and Alaska projection parameters are in [us-map-context-sources.md](us-map-context-sources.md); Hawaii uses the fitted equirectangular transform in [statle-capitals.md](statle-capitals.md). A ray-casting and edge-distance check confirmed that **all 50 projected city points lie inside their own state path**, including Alaska and Hawaii. Coastal or river-border cities naturally remain close to a state edge; do not move their dots to a state centre. State-name labels should be placed independently, and city-name labels anchored to their own dots with clear separation.

The previous `us-capitals.json` is retained for cached versions and is not modified by this change.

## Checked city list

| State | Game city label | 2025 population | Census place GEOID |
| --- | --- | ---: | --- |
| Alabama | Huntsville | 233,627 | 0137000 |
| Alaska | Anchorage | 287,155 | 0203000 |
| Arizona | Phoenix | 1,665,481 | 0455000 |
| Arkansas | Little Rock | 206,427 | 0541000 |
| California | Los Angeles | 3,869,089 | 0644000 |
| Colorado | Denver | 740,613 | 0820000 |
| Connecticut | Bridgeport | 152,273 | 0908000 |
| Delaware | Wilmington | 73,512 | 1077580 |
| Florida | Jacksonville | 1,017,689 | 1235000 |
| Georgia | Atlanta | 529,110 | 1304000 |
| Hawaii | Honolulu | 341,868 | 1571550 |
| Idaho | Boise | 238,429 | 1608830 |
| Illinois | Chicago | 2,731,585 | 1714000 |
| Indiana | Indianapolis | 901,116 | 1836003 |
| Iowa | Des Moines | 212,086 | 1921000 |
| Kansas | Wichita | 400,987 | 2079000 |
| Kentucky | Louisville | 641,962 | 2148006 |
| Louisiana | New Orleans | 362,154 | 2255000 |
| Maine | Portland | 69,911 | 2360545 |
| Maryland | Baltimore | 569,997 | 2404000 |
| Massachusetts | Boston | 672,973 | 2507000 |
| Michigan | Detroit | 649,095 | 2622000 |
| Minnesota | Minneapolis | 430,324 | 2743000 |
| Mississippi | Jackson | 141,196 | 2836000 |
| Missouri | Kansas City | 521,220 | 2938000 |
| Montana | Billings | 121,239 | 3006550 |
| Nebraska | Omaha | 488,797 | 3137000 |
| Nevada | Las Vegas | 679,817 | 3240000 |
| New Hampshire | Manchester | 116,818 | 3345140 |
| New Jersey | Newark | 323,808 | 3451000 |
| New Mexico | Albuquerque | 556,588 | 3502000 |
| New York | New York City | 8,584,629 | 3651000 |
| North Carolina | Charlotte | 964,784 | 3712000 |
| North Dakota | Fargo | 136,275 | 3825700 |
| Ohio | Columbus | 938,396 | 3918000 |
| Oklahoma | Oklahoma City | 719,849 | 4055000 |
| Oregon | Portland | 635,109 | 4159000 |
| Pennsylvania | Philadelphia | 1,574,281 | 4260000 |
| Rhode Island | Providence | 195,310 | 4459000 |
| South Carolina | Charleston | 159,423 | 4513330 |
| South Dakota | Sioux Falls | 213,748 | 4659020 |
| Tennessee | Nashville | 721,074 | 4752006 |
| Texas | Houston | 2,397,315 | 4835000 |
| Utah | Salt Lake City | 218,428 | 4967000 |
| Vermont | Burlington | 44,019 | 5010675 |
| Virginia | Virginia Beach | 453,737 | 5182000 |
| Washington | Seattle | 784,777 | 5363000 |
| West Virginia | Charleston | 46,117 | 5414600 |
| Wisconsin | Milwaukee | 562,407 | 5553000 |
| Wyoming | Cheyenne | 66,507 | 5613900 |

## Exact source snapshots

- `largest-city-pop2025.xlsx`: SHA-256 `4fba1979e5901c6212b010b5c2b470935880a80a89ef7821045b0bc3bec70472`.
- `largest-city-gaz2025.zip`: SHA-256 `49644173a453469d9bd77fb7a493b027f87567e209edaf2078aac7543ac2ee29`.
- `largest-city-places-ne.geojson`: SHA-256 `fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f`.


## Label placement and interactions

The state-name preview uses uppercase state labels fitted wholly inside each state's largest land component, with outside callouts for the eight small northeastern states and Hawaii. City labels are independent, smaller, violet, and linked to their actual points. Rectangle placement clears every city point and every other text rectangle. State labels use central interior candidates and measured browser font widths. City labels prefer nearby positions; West Virginia's Charleston is explicitly checked to avoid a remote label over Pennsylvania.

`statle-label-layout.js` is a pure geometry helper prepended to the immutable Statle bundle. Final browser layouts are cached separately with/without cities. `Vis navn` still ends at game start; advanced rounds retain regular scoring. City dots are passive overlays over the exact state paths, preventing overlapping hit circles from confusing New York City and Newark. Their close dot sizes also adapt to their separation.

## Physical-map performance

The physical map now loads `us-relief-raster.json` and three transparent WebP images with baked river, coast and inset masks. Mainland remains **2600×1900**, Alaska **900×650**, Hawaii **600×420**. Lossless encoding preserves the previous decoded terrain pixels apart from the river overlay. This removes 63,166 live clipping vertices and live SVG rivers, and hides the original detailed neighbour context while the physical map is active. The original assets remain for cached clients.

Camera input is batched to one SVG update per animation frame, avoids unchanged viewBox writes, and does not rewrite marker transforms during pan-only movement. Tests cover reset and responsive camera behaviour. No browser FPS figure is claimed; the evidence is the reduced runtime geometry, coalesced writes, and preserved raster dimensions/pixels.

Validation: `node tests/statle-city-data.cjs`, `node tests/statle-label-layout.cjs`, `node --test tests/map-zoom-frame.cjs tests/geography-score-api.mjs`, and `python scripts/check-statle-relief-raster.py`, plus asset build checks. Browser QA checked all 100 measured label rectangles against each other and all 50 point circles, correct/wrong advanced answers, label removal, cancel, map switching, zoom/reset, 390×700 mobile and the county map.
