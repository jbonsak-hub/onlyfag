# Municipality administrative-centre rounds

The optional municipality round asks for the administrative centre and still
accepts the corresponding municipality as the map answer. It uses the same
357 municipalities as the existing atlas. The compact Oslo-and-surroundings
quiz reuses its current 31-municipality subset, so the 15 county views contain
387 targets in total. No target geometry, historical pool or previous score is
changed by this dataset.

`assets/geography/municipality-centres.json` has one `centres` dictionary per
`county-XX`, indexed by the existing canonical municipality name. The row stores
the current municipality code, public centre name, longitude/latitude, projected
`p`, coordinate source and provenance. A genuine shared seat has `locations`
with both points; the combined question name uses both names.

## Sources and disambiguation

The pinned source snapshot is
`assets/geography/municipalities/sources/municipality-centres-2026.json.gz`,
checked on **25 October 2026**. It contains the complete query, raw Wikidata
bindings and every Kartverket response used. The generated atlas includes the
snapshot's SHA-256. No request to these services is made by the game.

- Seat identity starts with [Wikidata](https://www.wikidata.org/) `P36`, joined
  to the municipality's `P2504` code **and current canonical name**. Codes were
  reused by dissolved municipalities, so a code-only join would incorrectly
  assign historical seats to Narvik, Rana, Hå and several other municipalities.
  Multilingual names are matched through the atlas's existing official aliases.
  Wikidata's structured facts are [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing).
- Coordinates are refined against [Kartverket's SSR API](https://ws.geonorge.no/stedsnavn/v1/)
  using the documented `knr` filter. Each returned record is also checked against
  its own `kommuner[*].kommunenummer`. Only current, same-place settlement or
  town-hall points are accepted; a homonymous bridge, farm, island or peninsula
  is not substituted for a settlement. All SSR URLs and place IDs are retained.
  See the official
  [API guide](https://www.kartverket.no/api-og-data/stedsnavndata/brukarrettleiing-stadnamn-api/)
  and [service/license record](https://data.norge.no/nb/data-services/01daa020-ce6a-39c7-9458-b2141b6bd12b/soketjeneste-for-stedsnavn).
- Primary municipal and government checks for merged municipalities, shared
  seats and naming aliases are pinned in
  `municipalities/sources/municipality-centre-primary-checks.json`. Each affected
  generated row links its primary sources. Postal addresses, secondary service
  offices and the largest town are not automatically treated as the seat.

The current Kommuneinfo API and administrative WFS expose a polygon interior
point, not a named administrative centre. Those arbitrary interior points are
not used for this mode.

### Shared seats and same-name places

**Kinn** retains both **Florø / Måløy**. Its municipal
[merger agreement](https://nyekinn.kommune.custompublish.com/intensjonsavtala.460774.no.html)
assigns shared centre functions. **Nærøysund** retains both **Kolvereid / Rørvik**,
as described in its adopted
[land-use plan](https://www.naroysund.kommune.no/_f/p5/ia87b8088-7d4f-4c0e-88bc-b1f5d5103904/v01_planbeskrivelse_kpa_naroysund-datert-19102023.pdf).
Each municipality remains one question with both locations shown.

Møre og Romsdal contains two centres named **Aure**. Their question labels are
explicitly **Aure (Aure)** and **Aure (Sykkylven)**. The `name` field preserves
the place name and `promptName` supplies the contextual question text.

Municipal public names can differ from SSR's registered settlement spelling:
for example Midtbygda / Meråker, Leinesfjord / Leinesfjorden and Vossevangen /
Vossavangen. Both identity and coordinate spelling are retained for audit.
Where a suitable same-place SSR settlement entry is unavailable, the row retains
the explicitly identified Wikidata place coordinate. There are **373 SSR points
and 16 place-coordinate fallbacks across the 389 mapped locations**, with the
source named on every location. Examples include Enebakk, Giske and Osen. They
never fall back to a municipality or homonymous landform centroid. A coastal point can fall
just outside the atlas's generalized shoreline; its actual source position and
distance are recorded instead of moving it inland.

## Projection and validation

The offline builder reconstructs the exact existing county `Canvas` from the
pinned Kartverket-derived municipality topology, using **EPSG:25833**. Every
centre is transformed from longitude/latitude into that unchanged fit. The
current `index-v3.json` determines the county files, including
`county-03-v3.json`; cached older maps are left untouched.

With the existing municipality Python dependencies installed:

```text
python scripts/build-municipality-centres.py
python scripts/build-municipality-centres.py --check
python tests/municipality-centres.py
```

Checks cover all 357 identities, 387 view targets and 389 location points;
historical-code isolation; shared seats; contextual Aure questions; exact UTM
and canvas projection; source references; own municipality geometry; and an SSR
regression that rejects a same-named place returned from another municipality.
