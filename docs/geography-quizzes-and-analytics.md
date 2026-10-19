# Geografiquizer og Cloudflare Web Analytics

De 14 variantene i Geo-quiz har egne HTML-innganger. Land- og stedstabellene, kart/koordinater, Hva varmer verden, fagstoff og fagområdenes «Test deg selv» ligger fortsatt i geografi.html. «Verdens land-quiz» og «Kjente steder på jorda» i quizoversikten er separate spill; referansesidene «Land» og «Kjente steder» er beholdt.

| Quiz | Ny adresse | Kompatible geografihasher |
| --- | --- | --- |
| Verdens land-quiz | geografi/landquiz.html | #countries / #quiz-countries |
| Hovedstadsquiz | geografi/hovedstadsquiz.html | #capitals / #quiz-capitals |
| Flaggquiz | geografi/flaggquiz.html | #flags / #quiz-flags |
| Kombiner flagg og hovedstad | geografi/flagg-og-hovedstad.html | #flagcapital / #quiz-flagcapital |
| Kjente steder på jorda | geografi/stedsquiz.html | #places / #quiz-places |
| Worldle | geografi/worldle.html | #detective2 / #quiz-detective2 |
| Statle | geografi/statle.html | #statle / #quiz-statle |
| GeoWiz | geografi/geowiz.html | #geoguessr / #quiz-geoguessr |
| GeoGuessr | geografi/geoguessr.html | #openguessr / #quiz-openguessr |
| Jeopardy | geografi/jeopardy.html | #jeopardy / #quiz-jeopardy |
| Globle | geografi/globle.html | #globle / #quiz-globle |
| Travle | geografi/travle.html | #travle / #quiz-travle |
| Tradle | geografi/tradle.html | #tradle / #quiz-tradle |
| GeoGrid | geografi/geogrid.html | #geogrid / #quiz-geogrid |

Worldle er navnet på spillet som allerede lå i repoet. Også #worldle, #wordle, #geowiz og #flaggquiz støttes. Geografi åpner kjente seksjons-ID-er og kartfaner via hash, og quiz/mode/tab/section via query. Ukjente verdier brukes ikke som navigasjonsmål. #verden-quiz åpner oversikten.

## Delt kode og lagring

CSS, den eksisterende globale geografimotoren og utvidelsene ligger i assets/geography. Innlastingsrekkefølge og globale funksjonsnavn er beholdt fordi fagoppgaver, Jeopardy, flagg og kartdata deler funksjoner. Sidene kopierer ikke spillmotoren. Kartlaboratoriet er flyttet fra en komprimert srcdoc-payload til en felles fil på samme origin. De fire kartspillene har egne HTML-verter og er sperret i kartvertens vanlige navigasjon.

Quizsidene får offentlige referansedata fra quiz-data.js i stedet for å kreve skjulte kopier av fagstofftabellene. Jeopardy beholder sine egne hovedstadsfelt. Etter endringer i referansetabellene, kjør:

    node scripts/sync-geography-quiz-data.cjs

Dette bruker Playwright og blokkerer ekstern trafikk. Eksisterende nøkler er beholdt, blant annet geoHighscoresV1, geoDarkMode og kartlab_tradle_2024_v2_*. Ingen elevdata flyttes eller migreres. Lagringen er fortsatt lokal og knyttet til samme origin; localhost viser ikke nettleserens resultater fra onlyfag.no.

## Analytics

Alle opprinnelige offentlige HTML-innganger og nye quizsider laster assets/analytics.js med det eksisterende tokenet 1b3cf01bc1c645a99f02736c18c9ab78. Dette inkluderer fysikk1, fysikk2, geografi, naturfag, begge matematikkfiler, Sifferlaboratoriet, Mandelbrot, klassekart, puggenavn, forsiden, jobb og nuklidekartet. Den delte kartfilen har også loaderen ved direkte åpning.

Loaderen oppretter maksimalt ett Cloudflare-skript, også hvis den kjøres flere ganger eller et skript allerede finnes. Interne iframe-dokumenter sporer ikke i tillegg til verten. Den publiserte forsiden hadde ett manuelt beacon-skript ved kontroll 2026-10-19, uten et ekstra automatisk injisert skript.

Hver quiz kan filtreres etter sin egen sidesti i den eksisterende Cloudflare-oversikten. Ingen ny analysetjeneste eller hostingendring er nødvendig for dette.

SPA-måling er eksplisitt slått av (spa:false). Innholdspaneler uten egen sidesti forblir samlet under fagets HTML-fil. Gjentatte vis/skjul-, hash- og replaceState-endringer teller derfor ikke som ekstra besøk på samme side. Dette følger avklaringen om å beholde Cloudflare og få oversikt per quizside. Full oppdeling av interne paneler ville kreve adresserbare sidestier med hostingstøtte eller en annen tjeneste med egendefinerte hendelser; ingen slik endring er gjort.

Integrasjonen leser ingen skjemaer, elevnavn, kandidatkoder, svar eller lagringsinnhold. Det finnes ingen egendefinerte analytics-hendelser. Cloudflare-beaconet som ble kontrollert (versjon 2026.10.1) fjerner query, hash og eventuell URL-brukerinformasjon fra location og referrer i payloaden. Offentlige sidestier og standard nettleser- og ytelsesdata sendes av Cloudflare.

Kilder: [Cloudflare SPA-måling](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/) og [FAQ om query og hendelser](https://developers.cloudflare.com/web-analytics/faq/).

## Verifisering

Krever Node.js og Playwright med Chromium:

    node tests/geography-analytics.cjs

PLAYWRIGHT_MODULE og BROWSER_EXECUTABLE kan angi en eksisterende installasjon. CF_BEACON_SOURCE kan peke på en lokalt hentet original av det offentlige Cloudflare-skriptet; ellers brukes et minimalt testskript. Scriptet fanger analytics lokalt og sender ingen testbesøk til Cloudflare.

Kontrollert i headless Chromium/Edge, på desktop og 390 × 844:

- Alle 14 quizinnganger og menylenker, retur, nettleserens tilbakeknapp og lenkealiaser.
- Land, kjente steder, koordinater, befolkningspyramider og Hva varmer verden på geografisiden.
- Start og spørsmål i land-, hovedstads-, flagg-, kombinasjons- og stedsquiz; riktig flaggsvar gir poeng; toppresultater vises etter omlasting.
- Alle Jeopardy-kategorier produserer fem spørsmål; brett, spørsmål og fasit fungerer.
- Riktig Worldle-svar, Statle-validering, GeoWiz-kartklikk og grunnhandlinger i Globle, Travle, Tradle og GeoGrid.
- Tilgjengelig retur og ingen horisontal sideoverflyt på mobil. Lange oppsett starter øverst.
- Én beacon-instans per inngang, også ved gjentatt loader. Med originalt beacon ble faktiske payloads fanget lokalt. Syntetiske navn, kandidatkoder og svar i lagring/query/hash forekom ikke i payloads.

Begrensninger ved den lokale regresjonstesten: servermottak og synlighet i Cloudflare-dashboardet kontrolleres ikke. Analytics-endepunktet og øvrige eksterne tjenester blokkeres i regresjonstesten. GeoGuessr-innrammingen og Worldles satellittbilder er bevart, men eksterne leverandørers tilgjengelighet er ikke ende-til-ende-verifisert. Puggenavn sin PDF.js-avhengighet erstattes med et minimalt oppstartsobjekt i analytics-testen; PDF-import og elevfiler inngår ikke i testen. Prøvesystem, backend, tilgangsbeskyttelse og databaser er ikke endret.

## Publiseringskontroll av PR #3 – 19. oktober 2026

PR #3 ble merget og publisert. De tidligere geografi-*.html-inngangene svarte HTTP 200 på onlyfag.no. Cloudflare svarte HTTP 204 på ett kontrollbesøk per quiz, med riktig token og sidesti. Dashboardet ble ikke inspisert. Den senere flyttingen til /geografi/ er en egen oppfølging beskrevet nedenfor.

Regresjonstesten bruker lokalt fangede payloads og sender ikke testtrafikk til Cloudflare. Den kontrollerer ett eventType 1 per quizadresse, riktig token, ingen ekstra beacon fra kart-iframe, gamle lenker, spillhandlinger og mobilvisning. Navigasjon og interaksjon har separate tidsgrenser for å tåle kald nettleseroppstart.

## Korte quizadresser under /geografi/

Alle 14 quizinnganger er flyttet til geografi-mappen, for eksempel /geografi/worldle.html, /geografi/geowiz.html og /geografi/flaggquiz.html. Fag- og quizoversikten ligger fortsatt i /geografi.html. De tidligere publiserte geografi-*.html-adressene er små videresendingssider som bevarer query og hash, med en lenke og noscript-reserve. De laster ingen analytics. Gamle hash- og query-lenker fra geografisiden åpner også de nye adressene.

Relativstier til felles kode, kart-iframe, hovedside og geografisiden er tilpasset mappeplasseringen. Opprinnelse og lagringsnøkler er uendret. Cloudflare får de nye sidestiene; historiske tall for gamle sidestier blir liggende i eksisterende statistikk. Tester dekker alle 14 gamle HTML-adresser i tillegg til øvrig quiz-, navigasjons-, mobil- og analytics-kontroll.
