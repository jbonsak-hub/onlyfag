# Milanković prototype: scientific data and conventions

Prepared 24 October 2026 for `prototyper/milankovitch.html`. All time-series data is served from this repository; the browser makes no external data or library requests. This is a teaching prototype, not a climate projection model.

## Astronomical parameters

The compact `milankovitch-data.json` contains **901 consecutive records**, one every 1,000 years from **−800 to +100 kyr relative to 1950 CE**. Negative values mean the past. Time zero means 1950, not the date on the user's computer.

The records come from the **Berger (1978) astronomical solution** distributed by NOAA NCEI in the [Orbital Variations and Insolation Database](https://www.ncei.noaa.gov/pub/data/paleo/climate_forcing/orbital_variations/insolation/). Files `bein1.dat` through `bein8.dat` supply the past; `bein11.dat` supplies the future. The same solution is used on both sides of zero. The [NOAA readme](https://www.ncei.noaa.gov/pub/data/paleo/climate_forcing/orbital_variations/insolation/readme_insolation.txt) recommends this solution at the reference date and explains the distinction from the 1991 solution. This prototype does not present the older solution as a newly fitted or high-precision ephemeris.

Only the orbital parameters are extracted; the source's precomputed calendar-month/June-21 insolation values are **not** used. Compact column order is:

1. `kyrFrom1950`: time in thousands of years relative to 1950.
2. `eccentricity`: dimensionless orbital eccentricity.
3. `solarLongitudeOfPerihelionDeg`: solar ecliptic longitude at perihelion, degrees.
4. `obliquityDeg`: axial tilt relative to the orbital normal, degrees.

**The longitude convention matters.** NOAA's `omega` is converted using `(omega + 180) % 360`, as its readme directs. Solar longitude 0° is northern spring equinox; 90° northern summer solstice; 270° northern winter solstice. At 1950 the compact record is `[0, 0.016724, 282.04, 23.446]`: perihelion is near northern winter, not summer. Between native records, eccentricity and tilt are linearly interpolated; longitude follows the shorter circular arc. These are interpolation choices, not extra observations.

The manual experiment uses the deliberately rounded modern reference `e=0.0167`, tilt `23.44°`, perihelion solar longitude `282.9°`. Its reset button says “Dagens nære bane”; it is not presented as a dated high-precision ephemeris. Historical and future chapters use the actual data instead of these rounded values.

Berger, A. L. (1978). *Long-Term Variations of Daily Insolation and Quaternary Climatic Changes*. Journal of the Atmospheric Sciences, 35, 2362–2367. [DOI: 10.1175/1520-0469(1978)035&lt;2362:LTVODI&gt;2.0.CO;2](https://doi.org/10.1175/1520-0469(1978)035%3C2362:LTVODI%3E2.0.CO;2).

## Paleoclimate proxy

The file also contains the native **701 LR04 stack records** at ages 0–800 kyr, extracted from [NOAA's Lisiecki and Raymo (2005) file](https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/lisiecki2005/lisiecki2005.txt). The sampling interval changes within this range; the prototype preserves the native samples rather than inventing uniformly sampled measurements. Column order is `kyrFrom1950`, benthic δ¹⁸O in per mil, and the source's reported standard error in per mil. Source age is negated to share the orbital time axis. The graph joins the native points; the cursor readout linearly interpolates between them. The error values are preserved in the compact file but not drawn as a confidence band.

LR04 stacks benthic oxygen-isotope records from 57 globally distributed sediment cores. Higher δ¹⁸O generally indicates more global land ice and/or colder deep ocean. It is **not a direct temperature record** and is not an isolated ice-volume measurement. Its age model is partially astronomically tuned; therefore its visual alignment with orbital forcing is **not independent evidence by itself**. This limitation is stated both beside the chart and in the page's sources. No LR04 curve is extended into the future.

Reference anchors retained without modification: 20 kyr BP = 4.99‰; 125 kyr BP = 3.14‰; reference age 0 = 3.23‰. One native reported error is zero (600 kyr BP); it is preserved rather than replaced with a made-up uncertainty.

Lisiecki, L. E. & Raymo, M. E. (2005). *A Pliocene-Pleistocene stack of 57 globally distributed benthic δ¹⁸O records*. Paleoceanography, 20, PA1003. [DOI: 10.1029/2004PA001071](https://doi.org/10.1029/2004PA001071).

## Calculation and visual model

The gold line and large numerical readout are **daily mean top-of-atmosphere insolation at latitude 65° N at fixed solar longitude 90°**. This is northern summer solstice, rather than a fixed June-21 calendar date. Units are W/m². The solar constant is held at 1361 W/m² and semimajor axis at 1 AU.

For latitude φ, tilt ε, solar longitude λ, perihelion solar longitude ϖ, and eccentricity e:

```
δ = asin(sin(ε) sin(λ))
H₀ = acos(−tan(φ) tan(δ)), with polar day/night clamping
r/a = (1−e²) / (1+e cos(λ−ϖ))
Q = S₀ / (π (r/a)²) × [H₀ sin(φ) sin(δ) + cos(φ) cos(δ) sin(H₀)]
Global annual mean = S₀ / (4 sqrt(1−e²))
```

At the rounded modern reference, Q65 = **477.949382746 W/m²**. With the same tilt and a circular orbit, Q65 = **493.622917311 W/m²**. Precession cannot change Q in a circular orbit. Increasing tilt increases this northern summer readout; moving perihelion into northern summer increases it. The global annual mean depends only weakly on eccentricity and not on tilt or precession in this model.

The orbit picture enlarges eccentricity **×10** by default, explicitly labeled; “Vis virkelig baneform” removes that enlargement. All energy calculations always use the true eccentricity. Body sizes use their own display scale. Diagram angles consistently identify northern summer and winter and the position of perihelion. The axial-tilt diagram is a meridional schematic at northern summer solstice, with parallel solar rays, a lit hemisphere, the axis, and an illuminated point at 65° N. Its highlighted patch is qualitative; no climate quantity is inferred from its displayed size.

The model does not solve an ice sheet, carbon cycle, atmospheric absorption, albedo, or global temperature. The historical comparison teaches forcing, delayed responses, and feedbacks. The future chapter shows only astronomical forcing, without synthesizing future ice or temperature values and without guessing a date for the next glaciation.

## Context and future climate

The page distinguishes approximate eccentricity rhythms near 100 and 405 kyr, obliquity near 41 kyr, and **climatic precession** near 19–23 kyr. The latter combines changes in axis direction with changes in the orbital orientation; it is not mislabeled as the roughly 26 kyr axial-precession period alone.

Context is supported by NASA's [Milankovitch cycles explanation](https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/) and [why those cycles cannot explain current warming](https://science.nasa.gov/science-research/earth-science/why-milankovitch-orbital-cycles-cant-explain-earths-current-warming/). Orbital forcing acts over tens of thousands of years and cannot offset rapid current warming from human greenhouse-gas emissions. Future glacial timing also depends on long-term atmospheric CO₂; it cannot be read from a summer-insolation curve alone.

## Rebuilding the compact data

The adjacent `milankovitch-data-build.cjs` is an offline builder. Put the nine orbital source files and `lisiecki2005.txt` into one directory. It checks their pinned SHA-256 digests before parsing, then writes the compact JSON. For example:

```
node assets/astronomy-prototypes/milankovitch-data-build.cjs C:/path/to/downloaded-sources
```

The exact download URLs are the orbital database base URL above plus each filename below, and the full LR04 URL above. Original byte counts and hashes are also embedded in `milankovitch-data.json`.

| Source file | Bytes | SHA-256 |
|---|---:|---|
| bein1.dat | 147864 | 333d9f2aad399ca8342d381c6c1db0fe9f48957bad1fa96b80c426ed9eed2877 |
| bein2.dat | 147864 | 592659e32a6702de45fe6fa60816b2d8f254ef4d4ade05a808837eae7692abb9 |
| bein3.dat | 147864 | 0f9ed39d9ccec48350812b6e20578bc6295ea0dd92702ed3c9f5e9b109a19c54 |
| bein4.dat | 147864 | 3afe5f249903753de4d0a2e7409502006ab25bc44e3e527453a1c672918f5524 |
| bein5.dat | 147864 | 1963902ded999e415760c4d8329fdd2701962aa6aaee8d38fbbe85df43dcba84 |
| bein6.dat | 147864 | 99b80fa4c2055c3ebf047ef55d05a82a79e4743b996f0f88d1a2434f84702e3c |
| bein7.dat | 147864 | 55e4300fe8e7ea6c365b81f043af748b3238777f67284644465a08ee5bc645d4 |
| bein8.dat | 147864 | e4c0e784836586c3bfc0afb7c714d6652fff65a256641ab2505c71c7dd6afb04 |
| bein11.dat | 147864 | 1c1820ba369cf6194017800f4d1ff1081c1e9d73ed77418a3c2cbf0679eb4919 |
| lisiecki2005.txt | 409959 | 973a52d988da04333c98c3fc0cb51babac2fa9bb1c05d42de3d6df726d96b6fc |

## Validation

`tests/astronomy-milankovitch.cjs` checks pinned data structure and reference values, analytical daily insolation against an independent numerical rotation integration, global annual mean against a numerical Kepler orbit average, physical invariants, accessible controls, animation pause, local data failure, and horizontal overflow at desktop/390/320 px. Set `BASE_URL`, `PLAYWRIGHT_MODULE`, and `BROWSER_EXECUTABLE` for the local test environment. Screenshots and reports are written outside the published repository by default.
