# Regional capital data and preview labels

The six existing country-region maps retain their original IDs and target pools. No country geometry or region membership is changed. The added data covers all **200 existing map targets**: 197 country targets from the existing quiz catalogue and three already-labelled regional territories.

| Region | Targets / capital entries |
| --- | ---: |
| Europe | 47 |
| Asia | 47 |
| North and Central America, including Caribbean | 23 |
| South America | 13 |
| Africa | 55 |
| Oceania | 15 |

## Data shape

`region-capitals.json` contains `regions[region].capitals[canonicalCountry]`. Each entry has a short Norwegian `name`, an English `en`, geographic `lon`/`lat`, and projected `p: [x,y]`. `neId` identifies the source Natural Earth populated-place record where used. `marker` preserves whether the existing country map uses a small-country marker; `outsideGeometry` records whether the genuine capital point is outside the retained simplified SVG outline. `geometryDistance`, when present, is the distance in source SVG units to that retained outline.

Country identifiers remain Norwegian canonical IDs for scoring and lookup. Do not replace those IDs with translated display names. Capital names can be shown with `row.en` in English: the global names dictionary has an unrelated “Victoria” → “Lake Victoria” entry, so a generic dictionary lookup is unsuitable for the Seychelles capital.

## Sources and conventions

Short capital names generally follow the existing curated `GEO_QUIZ_DATA` country table, choosing its first listed constitutional/administrative capital where several functions are listed. The full existing convention remains in `note` when it differs from the short game name. This gives Amsterdam, Kuala Lumpur, Sri Jayawardenepura Kotte, Sucre, Porto-Novo, Mbabane and Pretoria. Ramallah remains the existing catalogue's administrative-centre convention for Palestine; the pre-existing Jerusalem/status qualifier is not converted into a new sovereignty claim.

Most city points come from [Natural Earth 1:10m Populated Places 5.1.2](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) ([publisher GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson)), matched by country ISO code and city name/alias. Coordinate snapshot SHA-256: `fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f`. Natural Earth data are [public domain](https://www.naturalearthdata.com/about/terms-of-use/). This file does not use Natural Earth's old capital-status flags to decide a current capital.

Verified current/special cases on 25 October 2026:

- **Equatorial Guinea: Ciudad de la Paz.** The [Equatorial Guinea government's announcement of 2 January 2026](https://www.guineaecuatorialpress.com/index.php/noticias/el_presidente_de_la_republica_proclama_la_ciudad_de_la_paz_como_capital_de_la_republica_de_guinea_ecuatorial_con_la_firma_de_un_decreto_ley) declares the new capital. This corrects the old Malabo convention in the new regional-capital data. Its city coordinate is [Wikidata Q1140136](https://www.wikidata.org/wiki/Q1140136), 1°35′30″N, 10°49′20″E. Existing unrelated country-quiz tables are not modified by this data file.
- **Indonesia: Jakarta.** The [Constitutional Court's May 2026 explanation](https://en.mkri.id/news/details/2026-05-12/Capital_Relocation_Depends_on_Issuance_of_Presidential_Decree) and [Nusantara Capital Authority's July 2026 update](https://ikn.go.id/id/posts/pembangunan-tahap-ii-ikn-terus-berjalan-otorita-ikn-lakukan-evaluasi-berkala) support retaining Jakarta while the political-capital transition targets 2028.
- **Palau: Ngerulmud**, confirmed by [Palau's government forum site](https://55piflm.gov.pw/about). **Nauru: Yaren**, as the government-seat / de-facto convention; [UNCTAD's country profile](https://dgff2021.unctad.org/wp-content/uploads/pdf/Dgff2021_Cp_520.pdf) explains that Nauru has no official capital. Their coordinates are from the [UNEP Pacific project implementation report, page 73](https://open.unep.org/docs/gef/PIR/10267_PIR_UNEP_2024_GEF_CW.10267.ISLANDS_Pacific.pdf): Ngerulmud 7.5006, 134.6242; Yaren −0.5477, 166.9208.
- The existing territory targets use **Cayenne**, **Nouméa**, and **El Aaiún / Laayoune** as their administrative centres. [France's government register identifies Cayenne as regional chef-lieu](https://www.banatic.interieur.gouv.fr/commune/97302-Cayenne). [MINURSO identifies Laayoune as the main city in Western Sahara](https://minurso.unmissions.org/en/about-minurso); the target's existing “omstridt” designation remains, and inclusion does not assert sovereignty.

## Projection and click targets

Points use exactly the same spherical Lambert azimuthal equal-area projection, longitude normalization across the Pacific date line, and fitted 900×650 coordinate system as the existing country paths. The regional centre/crop and exact fit parameters are recorded in `region-relief.json`; they come from the unchanged in-memory country-map builder. Capital coordinates are projected from real city locations, not moved to a country's hint/label centre.

The simplified map omits 29 microstate/island outlines. Some retained coastal cities also differ from the simplified coastline by less than one source SVG unit. Nassau and Port Vila sit on islands omitted from the retained country outline. Capital dots therefore need explicit country hit targets for marker/outside-geometry entries, rather than relying solely on the land path beneath them. Close points such as Rome/Vatican City or Kinshasa/Brazzaville should use adapted hit radii and zoom, not overlapping oversized hit circles.

## Preview layout API

`RegionLabelLayout.layout({states, capitalData, showCapitals, countryName, capitalName, measure, fontSize, cityFontSize, dotRadius, bounds, project})` returns `{stateLabels, cityLabels, issues}`. The output uses the same label shape as `StatleLabelLayout`: canonical `state`, displayed `lines`, `x`, first-line baseline `y`, `fontSize`, `anchor`, measured `box`, and optional `leader` plus `callout`.

- Default projection is identity because regional state paths and `p` already use the same viewBox. Optional `project(state,p)` supports another caller transform.
- `countryName(name,state)` / alias `stateName` controls displayed country text. `capitalName(name,row,state)` controls displayed capital text. Neither changes canonical output IDs.
- `showCapitals: false` returns country labels only. Country-only layout also works without capital data.
- Default bounds leave an 8-unit margin within 900×650. The caller may supply measured browser text widths; fallback widths are conservative.
- Country labels are uppercase, centrally fitted inside their own largest land component. Dense edge sampling keeps every text-box edge inside land. Small-country labels use explicit nearby callouts.
- Capital labels are placed independently near their true dots, with short leaders where needed. Every text rectangle clears every capital dot and every other text rectangle. All country **and** capital leaders should be rendered, behind text and dots.
- Projected geometry is cached. Typical Node checks take about 30–500 ms per full region and should run on preview choices, not during answer animation.

Validation:

```sh
node tests/region-capitals.cjs
node tests/region-label-layout.cjs
```

The tests verify all 200 identities and exact capital/terrain projection alignment, finite viewport coordinates, documented simplified-coast exceptions, current and territory conventions, and every region's Norwegian/English layouts. All 200 country plus 200 capital labels are present under conservative font widths, with zero text overlap or dot coverage. Country-only previews also retain every target.


## Integration and rendering

All six country regions use the Statle-style menu: 260px default panel, ready instruction below the region title, pre-start name preview, hidden colour legend until play, lower leaderboard button and Cancel returning to ready. Country regions have `Avansert - hovedsteder`; Statle retains its largest-city variant. Names disappear on start and do not change normal ranking eligibility.

`map-basemap.js` puts decoded terrain in HTML image layers outside the answer SVG. The background and foreground have separate compositor hints. Only painted camera changes/resize update the background CSS matrix; answers never mutate terrain sources or image nodes. Existing full-resolution Statle images and the six new2700x1950 regional images are retained. `ClickMapZoom.subscribe()` synchronizes both layers without a frame of camera drift. Region reset cancels stale loads and clears the old backdrop.

Country capital dots are explicit, non-overlapping hit targets at their real projected locations, including coastal points, microstates and omitted islands. Quiz/feedback country IDs remain canonical. Capitals such as Victoria use their contextual `.en` rather than unrelated global place-name aliases. New `variant: "capitals"` rankings are separate for every region; existing country rankings and legacy strict normalization are unchanged. No database migration is needed.

Browser checks covered correct/wrong capital feedback on all6 regions,200 country labels+200 capital labels with0 measured overlaps or covered dots, reset/cancel, country-only preview, English, a390x700 mobile frame, layer isolation, stable image sources during answers, and county-map compatibility. SVG images are0 in physical mode; Statle has3 HTML terrain images and each region has1.
