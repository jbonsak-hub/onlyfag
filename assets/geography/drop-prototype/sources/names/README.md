# Local river and lake names

The navigation overlay uses actual water bodies rather than ELVIS's aggregate
route names. It combines two official public sources, in EPSG:25833:

- [NVE Innsjødatabasen](https://kart.nve.no/enterprise/rest/services/Innsjodatabase2/MapServer/5): lake polygon, `vatnlnr`, official `navn`, area. This edition contains all 51,405 named lakes returned by the service across Norway, including 25,901 smaller than 0.05 km². There is no minimum area filter. Unnamed lakes are not claimed to have known names.
- [Vann-Nett river water bodies](https://kart2.miljodirektoratet.no/arcgis/rest/services/vann_nett/Vannforekomster/MapServer/0): short river-reach geometries with `Name`, `ElvID` and `WaterBodyID`. The import retains 14,354 pieces matching 193 collective or compound ELVIS routes in the five pinned regional source snapshots. Already-specific ELVIS river names remain available elsewhere.

The [Vannforekomster product sheet](https://dokument.geonorge.no/produktark/vannforekomster/14.09.2018/vannforekomster.pdf) describes the river/lake geometry and NLOD 2.0 terms. Credit NVE and Vann-Nett/Miljødirektoratet alongside the original river data.

`waterbody-names.json.gz` is a normalized offline source snapshot, not a browser
download. Its compressed SHA-256 is
`50ff1de93445bee4ed7fcee7da02a16b4c290e92235c6646c4f6d3d455b1d33d`.
`manifest.json` records all exact queries, IDs, response hashes, counts and byte
sizes. Unmodified compressed responses are retained outside the website
repository at `work/waterbody-name-research/downloads/` in the task workspace.

`scripts/fetch-waterbody-names.py PATH_TO_RAW_DOWNLOADS` reproduces the compact
source from these cached responses, checking raw hashes. A missing source
selection is fetched; use a fresh download directory for an intentional source
refresh, then review the new pin. The ordinary chunk build does not call the
network.

`scripts/build-watershed-name-labels.py` exports `annotate(snapshot)`, which
mutates projected source graph segments and returns the same snapshot. Each
segment receives `labels = [[fromFraction, toFraction, name, kind], ...]`.
Fractions follow the stored simplified river line's distance, the same measure
used by the browser. `kind` is `river` or `lake`.

Lake polygons take priority. Shoreline tolerance is
`max(2, min(20, 0.1 * sqrt(area_m2)))` metres: up to 20 metres for larger lakes,
10 metres for a 0.01 km² lake and about 3.2 metres for a 0.001 km² pond. This
accommodates the river display simplification while limiting false matches to
small ponds near a river. Source lake geometry is simplified at 10 metres;
small-water crossings remain limited by the river graph's 25-metre display
simplification.
For ambiguous collective routes, local river reaches must match the **same
official ELVIS route ID** and be within 40 metres of its geometry. No nearest
unrelated river or name point is used. River reach descriptors such as “fra…”,
“mellom…” and “nedstrøms…” are removed only while retaining the hydronym.
Collective bekkefelt/bekkfelt/sidebekker/tilløpsvassdrag names and descriptive
outlet/intake/tributary labels are rejected. Unresolved
locations use **Navnløs elv**, never a fabricated individual river name.

The compound-name audit additionally rejects Heddøla–Hjartdøla,
Hæsåna–Dikeelva, Sagelva–Fjellhammarelva, Øyåa–Nevla,
Västerdalälven–Ljøra, Röjdan–Løvhaugsåa,
Stardalselva/Votedalselva and Ulvedalselva/Vågselva. These names refer to
multiple distinct reaches. The matching Vann-Nett geometries supply, among
others, Hjartdøla, Heddøla, Nevla, Fjellhamarelva, Dikeelva, Løvhaugsåa and
Ljøra. Where Vann-Nett still supplies only the compound, the interval remains
unresolved. The source's unmodified `fullName` and `waterBodyId` are retained.
Bilingual names such as Syltefjordelva/Oardujohka and Ridelva–Riddujohka, and
single names such as Litl-Sandåa and Skas-heigre kanalen, are preserved.

The normalized graph diagnostics retain coverage counts and the exact source
pin. Name annotations change no river vertices, topology, flow direction or
outlets. Per-route spatial indexes and cached buffers keep regional builds
practical. The lake geometry uses ArcGIS ring winding to construct holes, so
islands are not filled as lake area.

## Reference checks

Independent annotation of the original eastern graph found the following
sequences along the actual directed routes:

- `002-34-3661`: Lågen, Lesjaskogsvatnet, Losna, Mjøsa, Vorma.
- `002-34-1`: Glomma/Glåma and lakes including Aursunden and Øyeren.
- `012-1-1`: Begna, Sperillen, Ådalselva, Storelva, Tyrifjorden and Drammenselva.

The Lågen/Vorma route contains approximately 191 km labeled Lågen, 105 km in
Mjøsa and 34 km labeled Vorma in this display graph. These are geometry checks,
not claims about surveyed river or shoreline lengths. Exact named intervals,
their kinds and valid continuous fraction coverage are tested in the regional
data validation.
