# Map quiz symbols

Map prompts display the national flag for countries, the state flag for US
states, and the official coat of arms for Norwegian municipalities and counties.
Symbols are educational identifiers; their display does not imply endorsement
by any public authority.

## Norwegian county and municipal arms

The local SVG source collection is
[aprestmo/norske-fylkes-kommunevaapen](https://github.com/aprestmo/norske-fylkes-kommunevaapen).
The downloaded master-branch archive has SHA-256
`5fa443e8f3c152d750fa17abdc4263a620d8afb123ead41e662eab85897be942`.

The collection contains 18 county SVGs and 470 municipality SVGs, including
historical administrative units. Only codes used by the current quiz datasets
are selected: all 15 present-day counties and all 357 current municipalities
have a matching SVG. The Oslo-surroundings quiz repeats municipalities already
present in their own county files; those repetitions reuse the same symbol.

Source filenames are numeric administrative codes without leading zeroes:
`fylker/3.svg` is Oslo county, and `kommuner/301.svg` is Oslo municipality.
The loader must retain the complete code internally when matching the map data,
then normalize it only when looking up the asset filename. This prevents county
and municipality codes from being confused.

The collection README identifies these files as Norwegian county and municipal
arms. The downloaded archive contains no `LICENSE` file or explicit broad
copyright license, and the SVG files inspected contain no creator, source or
license metadata beyond SVG namespace declarations. Consequently this project
does **not** describe the collection as CC0, CC BY or another license that its
publisher did not supply. Public coats of arms may also have rules governing
use as official insignia; they are shown here solely as recognisable geography
quiz illustrations. Keep this source attribution with distributed assets.

## Country flags

Country SVGs come from
[hampusborgos/country-flags](https://github.com/hampusborgos/country-flags),
whose README identifies Wikimedia Commons as its original source and describes
the flag artwork as public domain. Its package metadata declares license `PD`.
Files use lower-case ISO 3166-1 alpha-2 codes; Kosovo uses the established
user-assigned `xk` code. The archive used here has SHA-256
`30d3c2dc19000b82ff9654d85177b1b2976969d2e75b692694bc9585bc7e3fb2`.

## US state flags

The state-flag design source is
[lynnandtonic/usflags.design](https://github.com/lynnandtonic/usflags.design).
Its README describes research from state laws, state offices, historical
societies and vexillologists. Source compositions and proportions are retained;
flags are educational illustrations and are not official site branding.
The downloaded source archive has SHA-256
`d722df369b9dea30e82bcff85f506e74a7369a9b1ef996d28467eb92f8bee473`.
