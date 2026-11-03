# Landquiz: 2D-kart og 3D-globus

Landquizen har en kartbryter øverst til høyre, med 3D-globus som standard. 3D-globusen
bruker samme lokale D3 3.5.6-projeksjon og Natural Earth-landgeometrier som Globle
(`assets/geography/maplab.html`). Bibliotekets BSD-lisens følger
`assets/geography/country-globe.js`; kartdataene er fra Natural Earth (public domain).
Geometrien beholder fem desimaler. Klodens bakside klippes av projeksjonen.

Alle land starter nøytrale. Bare land som er funnet i den pågående landquizrunden,
fargelegges grønt; det brukes ingen avstandsfarger. Små stater som mangler polygon
i Globle-grunnlaget, vises med markører fra landquizens eksisterende koordinater.
2D-kartet beholder sitt eksisterende detaljerte kartgrunnlag.

Bytte av kart bevarer samme runde, tid, hint, funn, poeng og delvis skrevet svar.
Det siste riktige landet sentreres i begge visningene; ellers bevares kameraet
når man bytter. Globusen bruker sentrum av hovedlandmassen og kartets eksisterende
koordinater for små stater uten polygon. 2D-kartet beregner et eget fokusavvik slik
at også land nær datolinjen sentreres ved normal zoom. Dra for å flytte 2D-kartet
eller rotere globusen. Musehjulet zoomer; +/−-knappene er fjernet.
Tilbakestillknappen gjenoppretter utsnittet uten å endre funn eller poeng.
Regionutvalget gjelder også i globusvisningen. Spill igjen beholder kartvisningen
og starter en ny runde med tomme svar og nytt kamera.

Bygg: `node scripts/build-geography-quiz-assets.cjs`.
Kontroller: `node tests/countries-globe.cjs` og
`node tests/countries-menu-theme.cjs`. Browser-testene bruker lokal HTTP-server,
Playwright og Chromium og sender ingen prøvesvar til eksterne tjenester.

Venstrepanelet starter på 425 px på vanlige PC-skjermer og har en egen lagret bredde,
uavhengig av andre geografiquizer. Regionrundene bruker samme kompakte meny som
verdensrunden: inntasting, fremdrift, tid, handlinger, tilbakemelding og funne land.
