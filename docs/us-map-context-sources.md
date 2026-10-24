# USA map: neighbouring land

`assets/geography/us-context.json` adds Canada and Mexico behind the existing
Statle state targets, with a separate Canadian outline for the Alaska inset.
The 50 state shapes, their answer names, hint positions and score catalogue are
unchanged. Neighbouring land is passive context, styled separately from water
and playable states. The viewer copies the corresponding mainland or Alaska
transform after fitting the state-only groups, so context cannot change the
camera or shrink the answer targets.

## Source geometry

The geographic source is Natural Earth's public-domain 1:10 million data,
retrieved on 22 October 2026 for the existing geography maps:

- [Admin-0 countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson), SHA-256
  `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255`.
- [Lakes](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_lakes.geojson), SHA-256
  `2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9`.
- [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/).

The links describe the upstream datasets; the checksums identify the exact
snapshots used. `scripts/build-us-context.cjs` embeds the resulting geographic
extract as gzip/base64, with its own checked SHA-256, so rebuilding does not
depend on a moving upstream branch, local caches or network access.

The extract selects `ADM0_A3=CAN` and `ADM0_A3=MEX`. Main-map geometry uses
longitude/latitude bounds `[-142, 14, -50, 84]` in west/south/east/north order.
These bounds contain the full countries, including Canada's Arctic islands
and the Mexican southern coast: the background is not cut at an artificial
northern or southern latitude near the USA viewport. Canada's Alaska context is intersected separately
with `[-142, 53, -127, 72.5]`. Lake Superior, Michigan, Huron, Erie and Ontario
are united and subtracted from the country polygons before simplification.
This retains Canada's lake shores: an administrative border through a lake is
not drawn as land. Lake island holes are retained. Geometry is simplified with
0.004-degree tolerance and preserved topology, then rounded to six geographic
decimal places. This one-time extract used Shapely 2.1.2; rebuilding the
published SVG paths uses only Node.js built-ins.

## Alignment with the existing state paths

The state asset is retained byte-for-byte, SHA-256
`6416e46fca2d99ab44d3774ecf39b96466b56e35bf2dc57b4bb669afd0a61434`.
Its coordinates were aligned against the Census geometry redistributed in
[`us-atlas@3.0.1/states-10m.json`](https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json).

The mainland uses the spherical Albers equal-area equations with parallels
29.5°/45.5°, longitude rotation 96°, centre `[-0.6, 38.7]`, scale
`983.5892427316285` and translation `[499.6372552186457, 247.90855578188942]`.
These parameters match 3,478 close Census/state vertex correspondences with a
median residual of 0.124 source SVG units. The original paths are rounded to
one decimal place and simplified independently; this is background alignment,
not a change to their boundaries. The builder implements the equations
directly and does not add D3 to the website. Geographic polygon edges are
resampled at a maximum 0.1-degree step before projection: the straight 49°N
geographic boundary must become an Albers curve, rather than a straight SVG
chord between distant endpoints.

Alaska uses the original inset's equirectangular coordinates:

```text
x = 824.0256300273641 + 4.169974327844517 × longitude
y = 770.5588802583964 − 4.169974327844517 × latitude
```

Positive longitudes are wrapped west of −180° before applying this equation.
All 626 retained Alaska vertices matched the Census reference within one source
SVG unit, with a median residual of 0.0614. Canada is drawn using the same inset
transform and clipped to that inset, independently of the mainland context.

## Offline rebuild and validation

```sh
node scripts/build-us-context.cjs
node scripts/build-us-context.cjs --check
node scripts/build-statle-assets.cjs
```

The builder checks source integrity, Canadian and Mexican land, Canadian land
beside Alaska, the five Great Lakes as water, and a point just south of the
North Dakota border. It also checks the emitted SVG on both sides of that
border, catching errors that source-only containment tests cannot detect.
Browser tests also inspect the rendered SVG and passive
pointer behaviour. Context geometry is only fetched for the USA map.
