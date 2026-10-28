# Interaktiv modell av plategrenser

Velg **Indre krefter og landformer → Plategrenser** på geografisiden. Modulen åpnes i samme side på `geografi.html#indre-plategrenser`, i en isolert iframe som beholder figur og glider innenfor vinduet. På PC beholdes fagmenyen; på mobil gir «Geografi / Meny» veien tilbake. Fagstoffet har også en intern lenke. Den selvstendige siden `geografi/plategrenser.html` finnes fortsatt.

Modulen samler hav–kontinent-subduksjon, hav–hav-subduksjon, kontinentkollisjon, havbunnsspredning og glidegrense. Alle modeller starter på **0 %**, også når en fane velges på nytt eller Plategrenser åpnes igjen fra geografimenyen. Glideren styrer både figur og en kort, trinnavhengig forklaring. Piltastene styrer glideren; venstre/høyre, Home og End bytter mellom fokuserte faner. Avspilling kan pauses og stopper når man bytter fane, skjuler nettleserfanen eller når slutten.

Hvert stedseksempel har en parenteslenke til det samme Google My Maps-plategrensekartet som fagstoffet. Lenken åpner en ny fane med eget sentrum og zoom: Andes (−21°, −70°, zoom 5), Marianene (18°, 147,5°, zoom 6), Himalaya/Tibet (31°, 85°, zoom 5), den midtatlantiske ryggen (32°, −33°, zoom 4) og San Andreas (36,6°, −120,2°, zoom 7). De fire oppdaterte utsnittene følger brukerens referansebilder: Andes langs Peru og Chile, Marianebuen med Guam, det sentrale Nord-Atlanterhavet og California fra nord for San Francisco til sør for Los Angeles. Synlig område varierer med nettleservinduets størrelse.

Den synkende platens samplede bane, bevegelige materialmarkører og formidlingen av vann/magma bygger videre på brukerens vedlagte `Subduksjonsmodell.html`. Oppsettet er erstattet av en visning som tilpasses vinduet, med glideren under figuren og én utfyllende prosessforklaring av gangen. På smale skjermer åpnes forklaringene i et panel med Escape/lukkeknapp og tastaturfokus. De nummererte punktene åpner den tilhørende forklaringen. Lys/mørk-visning lagres lokalt, separat fra øvrige moduler.

De to subduksjonsmodellene har et skråstilt terrenglag, skyggelagte fjellsider og et voksende prism av foldede sedimenter som kan skrapes av ved gropa. Hav–hav-modellen viser flere vulkanske øyer i en skjematisk øybue. Kontinentkollisjonen viser lag som foldes og forkortes, overskyvninger, fjellrelieff og markører som beveger seg mot hverandre. Glidegrensen vises nå som et skrått 3D-utsnitt med lys- og skyggelegging, forhøyet terrengrelieff, små gårdsbygninger og skårne front-/sideflater med berglag. Hele blokkene og landskapet følger den sideveis platebevegelsen: elv og vei henger sammen ved fastlåst kontakt, bøyes under spenningsoppbygging og forskyves etter brudd. Alt følger glideren; ingen detaljer beveger seg av seg selv.

## Faglige avgrensninger

Glideren er et skjematisk utviklingsforløp uten kalibrert tidsskala. Tilbakespoling er et læringsverktøy, ikke reversert platedrift. Mantelen er hovedsakelig fast; magma ved subduksjon vises i mantelkilen, og magma ved spredning knyttes til trykkavlastning. De ulike prosessene overlapper i naturen.

Kontinentkollisjon har et eget sent trinn som viser **mulig delvis smelting av varm kontinental skorpe**, med lukkede smeltelommer og en intrusjon som kan størkne til granitt. Dette er forskjellig fra smelting i mantelkilen over en subduserende havbunnsplate. Intrusjonen er avgrenset til skorpa; det tegnes ingen magmakanal til overflaten. Smelting er ikke en automatisk følge av sammenpressing eller høyt trykk. Ingen vulkansk bue vises i dette eksemplet, men teksten presiserer at vulkanisme kan forekomme i enkelte kollisjons- og etterkollisjonsmiljøer.

Spredning vises som et skråstilt utsnitt av havbunnen med tverrsnitt i front. Ryggen bygger seg gradvis opp, en sentral riftdal blir synlig, og normalforkastninger/rygger/søkk følger den nydannede havbunnen utover. Samme materialmarkører kan følges på hver side; ingen markører pakkes rundt til midten igjen. Fargeforskjeller viser relativ alder/avkjøling, ikke magnetiske striper. Dette er en forenklet langsomt spredende rygg; raskt spredende rygger trenger ikke ha en tydelig riftdal. Vannet er skjult for å vise topografien.

Transformmodellen holder veikontakten samlet under fastlåsing, før den viser forskyvning etter brudd. Det skrå perspektivet endrer bare visningen; tykkelsen er konstant og det er ingen vertikal platebevegelse i dette eksemplet. Sideflatene er kanter på modellutsnittet, ikke åpne rifter eller stup i terrenget. Skjelvsymbolene er mulige fokus, ikke en prognose.

Bakgrunn: [USGS – Understanding plate motions](https://pubs.usgs.gov/gip/dynamic/understanding.html). Modellens informasjonsfelt gir eksempel og avgrensning for hver plategrense.

Kontroll av mekanismen for smelting i kontinental skorpe: [J. Vanardois, Water-Melt-PT.jl – Scientific Background](https://github.com/jvanardo/Water-Melt-PT.jl#scientific-background). Den tilgjengelige fagmodellen beskriver vannfrigjøring og delvis smelting i heterogen kontinental skorpe, med MAGEMin som termodynamisk motor. Den er bakgrunn for muligheten for smelting, ikke en beregning av denne figurens temperatur, tid, smeltemengde eller sannsynlighet for vulkanutbrudd. Direkte forespørsler til USGS og litteratursøk i Europe PMC var blokkert av miljøets nettfilter ved denne kontrollen; de er ikke fremstilt som gjennomført litteraturgjennomgang.

## Kjøring og kontroll

Fra repository-roten:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/plate-boundaries.cjs
```

Testen starter sin egen HTTP-server og blokkerer eksterne forespørsler. Den kontrollerer alle fem modeller, forklaring i begge gliderretninger, ulike geologiske kjennetegn, synlige 3D-flater og forskyvning langs den projiserte transformaksen uten åpning på tvers, avspilling/pause/reset, faner med tastatur, mobilpanel, tema, innlenking fra geografi og synlig glider uten siderulling i fem skjermstørrelser. Sett `PLATE_SCREENSHOTS` til en mappe for skjermbilder. Fysisk mobil og Safari er ikke kontrollert av Chromium-testene.

JS/CSS og innbyggingen (`embed.js`, `embed.css`) ligger i `assets/geography/plate-boundaries/`, atskilt fra quizbyggene. `subduction-art.js` og `collision-transform-art.js` tegner de fire tilhørende modellene, mens `model.js` styrer tilstand, glider, tekst og havbunnsspredning. Innbyggingen laster modellen ved første åpning, samkjører tema med geografisiden og stopper avspilling når seksjonen skjules. Meldinger valideres med både origin og kildevindu. Endringer krever ingen regenerering av geografiquizenes versjonerte ressurser. Nettutgaven bruker nettstedets eksisterende analytics-loader, som ikke laster et ekstra beacon i iframe; den eksporterte enkeltfilen inkluderer alle tegneskriptene og gjør ingen analytics-kall.

## Én HTML-fil

```sh
node scripts/export-plate-boundaries.cjs /tmp/Plategrenser.html
```

Eksporten pakker inn stil og JavaScript uten andre lokale avhengigheter. Den kan åpnes direkte fra filsystemet uten server eller nettverk. Tilbake-lenken går da til geografisiden på onlyfag.no. Ikke velg nettstedets kildefil som eksportmål.
