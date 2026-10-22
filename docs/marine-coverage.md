# Marine coverage and simpler teaching regions

The dedicated marine map has 73 targets: 44 seas/oceans and 29 gulfs/straits. Lakes have a separate 33-question map. The twelve provisional additional names are no longer questions; their geometry is retained inside neighbours. Gulf of Riga is also part of the Baltic Sea.

## Absorbed regions

| Former question | Retained answer |
| --- | --- |
| Beaufort Sea | Arctic Ocean |
| Chukchi Sea | Arctic Ocean |
| East Siberian Sea | Arctic Ocean |
| Kara Sea | Arctic Ocean |
| Laptev Sea | Arctic Ocean |
| Java Sea | Indian Ocean |
| Banda Sea | Pacific Ocean |
| Sulu Sea | South China Sea |
| Celebes Sea | Pacific Ocean |
| Bismarck Sea | Pacific Ocean |
| Solomon Sea | Pacific Ocean |
| Gulf of Saint Lawrence | Atlantic Ocean |
| Gulf of Riga | Baltic Sea |

## Coastlines and inland exclusions

The original compact country map is used for both the background and offline clipping of marine answers. Only the 33 quiz lakes are drawn. Marine answer boundaries are simplified, and residual coastal water is assigned to the adjacent retained sea. The full quiz lake catalogue is explicitly excluded from the marine domain. Caspian Sea is catalogued as marine rather than a lake in the upstream reference, so the additional explicit exclusion is essential. Aral Sea and other inland lakes never select an ocean or the Black Sea.

The answer polygons already follow the compact coastlines. The client does not repeat a complex world-coast clip on each pre-clipped sea shape. Transparent sea hit paths have no enlarged shoreline stroke; narrow straits retain their visible extra markers. Separate masks remain available for older un-clipped maps, and pointer resolution never turns masked inland water into a marine answer.

Around Scandinavia, Skagerrak and Kattegat retain their familiar extents. The Danish belts are part of the Baltic Sea, and unasked Åland/Kvarken subdivisions are continuous with the Baltic/Bothnian regions. Gulf of Bothnia and Gulf of Finland remain named questions. Boundaries crossing open water are generalized educational divisions, not maritime jurisdiction boundaries. [EU Baltic overview](https://maritime-spatial-planning.ec.europa.eu/sea-basins/baltic-sea-0) and [Finnish Baltic geography](https://itameri.fi/en/learn-and-study/characteristics-of-the-baltic-sea/geography/) inform the regional grouping.

SVG paths retain 0.001-unit vertices using compact relative segments. Built map URLs include the content hash, avoiding cached old question inventories. The Worker must be deployed with the matching reference data before publishing the frontend. Existing lists remain stored; no D1 schema migration is needed. The lakes-only board retains its existing identity; the separate marine page has its own region/configuration.

## Checks

Independent 21,600-position offshore reference; all 189 physical target centers; 26 coastal/open-water clicks including the Danish belts and Bothnia; inland Caspian/Aral exclusions; complete server-verified rounds and mobile zoom. See tests/physical-map-geometry.cjs, tests/marine-coverage-browser.cjs and tests/physical-map-browser.cjs.

## Catalogue-to-parent assignments

| Source region | Quiz answer |
| --- | --- |
| Great Barrier Reef | Coral Sea |
| Weddell Sea | Southern Ocean |
| Luzon Strait | Philippine Sea |
| Scotia Sea | Southern Ocean |
| Bristol Channel | Celtic Sea |
| Inner Seas | Sea of the Hebrides |
| Bahía de Campeche | Gulf of Mexico |
| Laccadive Sea | Indian Ocean |
| Bellingshausen Sea | Southern Ocean |
| Amundsen Sea | Southern Ocean |
| Davis Strait | Baffin Bay |
| Great Australian Bight | Indian Ocean |
| James Bay | Hudson Bay |
| Hudson Strait | Hudson Bay |
| Gulf of Honduras | Caribbean Sea |
| Golfe du Lion | Mediterranean Sea |
| Straits of Florida | Gulf of Mexico |
| Bay of Plenty | Pacific Ocean |
| The North Western Passages | Arctic Ocean |
| Queen Charlotte Sound | Pacific Ocean |
| Molucca Sea | Pacific Ocean |
| Gulf of Tonkin | South China Sea |
| Bay of Fundy | Atlantic Ocean |
| Río de la Plata | Atlantic Ocean |
| Strait of Singapore | South China Sea |
| Makassar Strait | Indian Ocean |
| Ceram Sea | Pacific Ocean |
| Inner Sea | Sea of Japan |
| Taiwan Strait | South China Sea |
| Cook Inlet | Gulf of Alaska |
| Bristol Bay | Bering Sea |
| Melville Bay | Baffin Bay |
| Gulf of Maine | Atlantic Ocean |
| Chesapeake Bay | Atlantic Ocean |
| Golfo San Jorge | Atlantic Ocean |
| Gulf of Mannar | Bay of Bengal |
| Shelikhova Gulf | Sea of Okhotsk |
| Bo Hai | Yellow Sea |
| Gulf of Kutch | Arabian Sea |
| Golfo de Panamá | Pacific Ocean |
| Amundsen Gulf | Arctic Ocean |
| Viscount Melville Sound | Arctic Ocean |
| Ungava Bay | Labrador Sea |
| Great Barrier Reef | Coral Sea |
| Yucatan Channel | Caribbean Sea |
| Lincoln Sea | Arctic Ocean |
| Bass Strait | Tasman Sea |
| Franklin Bay | Arctic Ocean |
| Dixon Entrance | Pacific Ocean |
| M'Clure Strait | Arctic Ocean |
| Boca Grande | Atlantic Ocean |
| Baía de Marajó | Atlantic Ocean |
| Golfo San Matías | Atlantic Ocean |
| Golfo Corcovado | Pacific Ocean |
| Wrigley Gulf | Southern Ocean |
| Sulzberger Bay | Southern Ocean |
| Ronne Entrance | Southern Ocean |
| Bransfield Strait | Southern Ocean |
| McMurdo Sound | Southern Ocean |
| Baía de São Marcos | Atlantic Ocean |
| Cumberland Sound | Labrador Sea |
| Frobisher Bay | Labrador Sea |
| Disko Bay | Baffin Bay |
| Hamilton Inlet | Labrador Sea |
| Storfjorden | Barents Sea |
| Vestfjorden | Norwegian Sea |
| Karskiye Strait | Arctic Ocean |
| Vil'kitskogo Strait | Arctic Ocean |
| Sognefjorden | North Sea |
| Trondheimsfjorden | Norwegian Sea |
| Gulf of Khambhät | Arabian Sea |
| Palk Strait | Bay of Bengal |
| Kronotskiy Gulf | Pacific Ocean |
| Uda Bay | Sea of Okhotsk |
| Uchiura Bay | Pacific Ocean |
| Tsugaru Strait | Sea of Japan |
| Tatar Strait | Sea of Japan |
| Shark Bay | Indian Ocean |
| Gulf of Gabès | Mediterranean Sea |
| Mackenzie Bay | Arctic Ocean |
| Norton Sound | Bering Sea |
| Kotzebue Sound | Arctic Ocean |
| Gulf of Boothia | Arctic Ocean |
| Kane Basin | Baffin Bay |
| Foxe Basin | Hudson Bay |
| Golfo de Tehuantepec | Pacific Ocean |
| Golfo de Guayaquil | Pacific Ocean |
| Gulf of Masira | Arabian Sea |
| Gulf of Yana | Arctic Ocean |
| Dmitriy Laptev Strait | Arctic Ocean |
| La Pérouse Strait | Sea of Japan |
| East Korea Bay | Sea of Japan |
| Qiongzhou Strait | South China Sea |
| Cook Strait | Pacific Ocean |
| Torres Strait | Arafura Sea |
| Geographe Bay | Indian Ocean |
| Gulf of Papua | Coral Sea |
| Gulf of Olen‘k | Arctic Ocean |
| Waddenzee | North Sea |
| Gulf of Sidra | Mediterranean Sea |
| Bight of Benin | Gulf of Guinea |
| Bight of Biafra | Gulf of Guinea |
| Strait of Belle Isle | Labrador Sea |
| Prince William Sound | Gulf of Alaska |
| Bahía Blanca | Atlantic Ocean |
| Golfo de Penas | Pacific Ocean |
| Bahía Grande | Atlantic Ocean |
| Marguerite Bay | Southern Ocean |
| Prydz Bay | Southern Ocean |
| Vincennes Bay | Southern Ocean |
| Porpoise Bay | Southern Ocean |
| Davis Sea | Southern Ocean |
| Lützow-Holm Bay | Southern Ocean |
| Antongila Bay | Indian Ocean |
| Hangzhou Bay | East China Sea |
| Karaginskiy Gulf | Bering Sea |
| Gulf of Kamchatka | Pacific Ocean |
| Gulf St. Vincent | Indian Ocean |
| Golfo de Urabá | Caribbean Sea |
| Baia de Maputo | Mozambique Channel |
| St. Helena Bay | Atlantic Ocean |
| Boknafjorden | North Sea |
| Joseph Bonaparte Gulf | Timor Sea |
| Gulf of Martaban | Andaman Sea |
| Gulf of Sakhalin | Sea of Okhotsk |
| Kangertittivaq | Greenland Sea |
| Saint Lawrence River | Atlantic Ocean |
| Chaun Bay | Arctic Ocean |
| Khatanga Gulf | Arctic Ocean |
| Garabogaz Bay | Black Sea |
| Gulf of Suez | Red Sea |
| Gulf of Ob | Arctic Ocean |
| Yenisey Gulf | Arctic Ocean |
| Gulf of Aqaba | Red Sea |
| Denmark Strait | Greenland Sea |
| Massachusetts Bay | Atlantic Ocean |
| Delaware Bay | Atlantic Ocean |
| Long Island Sound | Atlantic Ocean |
| Albemarle Sound | Atlantic Ocean |
| Pamlico Sound | Atlantic Ocean |
| Smith Sound | Pacific Ocean |
| Queen Charlotte Strait | Pacific Ocean |
| Baird Inlet | Bering Sea |
| Husky Lakes | Arctic Ocean |
| Lake Pontchartrain | Gulf of Mexico |
| Stettiner Haff | Baltic Sea |
| Darnley Bay | Arctic Ocean |
| Prince of Wales Strait | Arctic Ocean |
| Minto Inlet | Arctic Ocean |
| Richard Collinson Inlet | Arctic Ocean |
| Prince ALbert Sound | Arctic Ocean |
| Liddon Gulf | Arctic Ocean |
| Wynniatt Bay | Arctic Ocean |
| Hadley Bay | Arctic Ocean |
| Bathurst Inlet | Arctic Ocean |
| Goldsmith Channel | Arctic Ocean |
| Sherman Basin | Arctic Ocean |
| Wager Bay | Hudson Bay |
| Fury and Hecla Strait | Hudson Bay |
| Jones Sound | Baffin Bay |
| Eclipse Sound | Baffin Bay |
| Hall Basin | Arctic Ocean |
| Uummannaq Fjord | Baffin Bay |
| Peacock Sound | Southern Ocean |
| George VI Sound | Southern Ocean |
| Seno de Skyring | Pacific Ocean |
| Seno Otway | Strait of Magellan |
| Bay Inútil | Strait of Magellan |
| Lagoa dos Patos | Atlantic Ocean |
| Amazon River | Atlantic Ocean |
| Bras d'Or Lake | Atlantic Ocean |
| Kaliningrad | Baltic Sea |
| Matochkin Shar Strait | Arctic Ocean |
| Ozero Mogotoyevo | Arctic Ocean |
| Guba Gusinaya | Arctic Ocean |
| Bali Sea | Indian Ocean |
| Davao Gulf | Philippine Sea |
| Halmahera Sea | Pacific Ocean |
| Selat Bali | Indian Ocean |
| Gulf of Tomini | Pacific Ocean |
| Flores Sea | Pacific Ocean |
| Sibuyan Sea | South China Sea |
| Selat Dampier | Pacific Ocean |
| Gulf of Buli | Pacific Ocean |
| Gulf of Kau | Pacific Ocean |
| Bohol Sea | South China Sea |
| Surigao Strait | Philippine Sea |
| Ragay Gulf | Philippine Sea |
| Samar Sea | Philippine Sea |
| Tayabas Bay | Philippine Sea |
| Leyte Gulf | Philippine Sea |
| Visayan Sea | South China Sea |
| Savu Sea | Indian Ocean |
| Hecate Strait | Pacific Ocean |
| Cordova Bay | Pacific Ocean |
| Murchison Sound | Baffin Bay |
| Robeson Channel | Arctic Ocean |
| Kennedy Channel | Arctic Ocean |
| Canal Perigoso | Atlantic Ocean |
| Canal do Sul | Atlantic Ocean |
| Canal do Norte | Atlantic Ocean |
| Øresund | Baltic Sea |
| Mecklenburger Bucht | Baltic Sea |
| San Francisco Bay | Pacific Ocean |
| Monterey Bay | Pacific Ocean |
| Yangtze River | East China Sea |
| Columbia River | Pacific Ocean |
| Salish Sea | Pacific Ocean |
| Gulf of Anadyr' | Bering Sea |
| Ross Sea | Southern Ocean |
| Korea Strait | East China Sea |
| North Channel | Irish Sea |
| St. George’s Channel | Irish Sea |
