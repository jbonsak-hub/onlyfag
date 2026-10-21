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
| MapWiz | geografi/mapwiz.html | #geoguessr / #quiz-geoguessr / #geowiz / #mapwiz |
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

## Publiseringskontroll av mappeflyttingen

PR #4 ble merget 19. oktober 2026. GitHub Pages-publiseringen lyktes, og alle 14 nye /geografi/*.html-adresser svarte HTTP 200. Ett faktisk Cloudflare-kontrollbesøk per ny quizadresse ble mottatt med HTTP 204. Dashboardet ble ikke inspisert.

## Samle adresser med og uten .html

Verten leverer både /naturfag og /naturfag.html med HTTP 200. Cloudflare grupperer etter sidesti, så den felles analytics-loaderen sender nå først HTML-adresser uten filendelse til samme adresse med .html. Dette gjelder også de nye quizsidene. /index og /index.html sendes til /, og /jobb/index(.html) til /jobb/. Vanlige mappeadresser beholdes. Ingen beacon lastes på mellomadressen. Den eksisterende geografirutingen til quizene har forrang.

Query og hash bevares i nettleseren, og lagringen har fortsatt samme opprinnelse og nøkler. Det originale Cloudflare-skriptet utelater query/hash fra rapporterte adresser. Dette bruker samme token og tjeneste, og krever ingen ny Cloudflare-konfigurasjon. Historiske tall på ulike sidestier blir ikke slått sammen av denne kodeendringen; samlingen gjelder etter publisering. Uten JavaScript blir ingen av sidene målt av denne løsningen.

Kjør node tests/analytics-canonical-paths.cjs med PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE og CF_BEACON_SOURCE som ovenfor. Testserveren etterligner vertens HTML-aliaser. Testen bruker den originale beacon-koden og fanger payloads lokalt, uten å sende besøk til Cloudflare. Den kontrollerer ett pageview på riktig felles adresse, bevart query/hash og lokal lagring, gamle quizlenker og fravær av syntetiske personopplysninger i payloads.

29 adressevarianter er verifisert med den originale beacon-koden: ett pageview per besøk på riktig kanonisk sidesti, ingen JavaScript-feil, og separat kontroll av gammel /geografi#worldle-lenke. Testen for gjentatt innlasting av analytics bruker nå riktig relativsti fra quizmappen og venter på at skriptet faktisk er lastet.

Publisert kode ble kontrollert med alle gamle HTML-, hash- og query-lenker, spillhandlinger, toppresultater, navigasjon og mobilbredde 390 px. En gjennomkjøring fikk to midlertidige HTTP 502 for scoreboards.js og highscores.js. Begge svarte HTTP 200 ved målrettet gjentest; toppresultater og riktig flaggsvar/poeng fungerte da uten side- eller ressursfeil. GeoGuessr er fortsatt avhengig av ekstern innramming; selve det eksterne spillet er ikke bekreftet. Den lokale regresjonsserveren støtter nå mappeindekser som /jobb/, slik produksjonsverten gjør.

## Statle med klikkbare delstater

### Oppdatering av CSS og JavaScript

Etter endringer i `assets/geography/statle.css` eller `statle.js`: kjør `node scripts/build-statle-assets.cjs`. Skriptet lager filer med innholdshash i `statle-assets/` og oppdaterer quizsiden og prototypen. Behold tidligere publiserte versjoner, siden eldre HTML fortsatt kan referere til dem. `--check` og geografitesten kontrollerer at referansene matcher kildekoden.

Dette hindrer at ny HTML kombineres med gamle CSS/JS-filer fra nettleser- eller Cloudflare-bufferen. Ressursene kan ellers være ferske i buffer i fire timer. `tests/statle-cache.cjs` gjenskaper blankt kart med gamle filer i en ekte nettleserbuffer og kontrollerer at nye filadresser gjenoppretter kart, spill og meny uten tømming av buffer. Testen sender ingen analytics.

Statle på /geografi/statle.html bruker nå et kart med 50 klikkbare delstater og navnet på målstaten i spillpanelet. Fargen følger svartid og antall feil. Feilklikk viser den klikkede statens navn i omtrent ett sekund; etter to feil pulserer en ring rundt målstaten i omtrent 1,45 sekunder. Omstart, hopping over, tastatur og ekstra klikkfelt for små delstater er tilgjengelig. Eksempelrunde og all manuell/automatisk pause er fjernet; klokka går også når menyen er åpen eller fanen er skjult.

Kartet fyller vindushøyden på desktop. Fastlandet er forstørret. Alaska og Hawaii vises uten navn, med skillelinjer som ikke skjærer gjennom delstatene. Hawaii flukter nederst med Florida. På mobil ligger panelet under kartet. Kartgrunnlaget er det samme Census-grunnlaget som tidligere. Spillsvar holdes i minnet, eksisterende lokal lagring røres ikke, og siden bruker samme analytics-loader/token og sidesti som før. Andre quiz- og fagmoduler er uendret.

prototypes/statle.html deler kartkode og stil med den publiserte siden, men laster ingen analytics. tests/statle-prototype.cjs kontrollerer alle 50 delstatene gjennom en komplett runde, farger, hover, feilnavn, hint, omstart, mobil og full vindushøyde. Menyen starter lukket og åpnes over venstre del av kartet, med støtte for Escape, lukkeknapp og klikk utenfor. Statle-tittelen står øverst i venstrepanelet, og Quizoversikt-lenken er forstørret. Sett STATLE_PREVIEW_URL til den lokale siden og bruk PLAYWRIGHT_MODULE/BROWSER_EXECUTABLE ved behov. Den vanlige geography-analytics-testen dekker også den nye Statle-siden og de gamle adressene.


## Kompakte quizoppsett med Statle-palett

Globle, Worldle, Travle, Tradle, GeoGrid, MapWiz, Jeopardy, Landquiz, Flaggquiz, Hovedstadsquiz, Stedsquiz og Flagg+hovedstad deler nå `quiz-layout.css` og `quiz-layout.js`. Den tidligere topplinjen er erstattet av kompakte tema-/Quizoversikt-kontroller og en sammenfoldet geografimeny over venstre billedkant. OnlyFag-raden er fjernet fra disse quizene. På PC fyller kartspillene høyden; mobilvisningen plasserer kart/brett over kontrollene og holder svaralternativer i to kolonner. Globle beholder drag, zoom og avstandsfarger. Stedsbeskrivelser, resultatvinduer og Jeopardy bruker lyse, lesbare flater. Worldle åpner ikke mobiltastaturet automatisk.

Kart-iframe får den nye utformingen bare når det åpnes fra en av de fire selvstendige quizsidene. Kartverktøyene på geografi.html og øvrige fag beholder utformingen. Eksisterende spillfunksjoner, datasett og lagringsnøkler beholdes.

GeoWiz heter nå MapWiz på `/geografi/mapwiz.html`. `/geografi/geowiz.html`, `/geografi-geowiz.html` og tidligere hash-/query-lenker videresender dit uten et ekstra analytics-skript. Samme Cloudflare-token brukes. Historiske tall for GeoWiz-stien blir liggende på den gamle stien i Cloudflare.

Etter endringer i geografiens delte JS/CSS: kjør `node scripts/build-geography-quiz-assets.cjs`. Dette lager innholdshash-versjoner av alle direkte JS/CSS-avhengigheter for geografi.html og de 13 quizsidene. HTML peker på `assets/geography/quiz-assets/`. Kildekode redigeres utenfor denne mappen. Behold tidligere publiserte filer for eldre HTML i buffer. Statle har fortsatt sin separate, uendrede byggeprosess.

Verifisering: `node tests/geography-layout.cjs` og `node tests/geography-analytics.cjs` med samme Playwright-variabler som over. Layouttesten dekker oppstart/spill i 1366×643, 390×844, 360×740 og 844×390; fullhøydekart, alle ni GeoGrid-ruter, meny/retur, lesbare stedsbeskrivelser, svaralternativer, landkart uten overlapp over svarfelt, MapWiz-kartklikk uten klikkgjennomgang fra HUD, Jeopardy-spørsmål/fasit/poeng og GeoGrid-inntasting med viewport 390×480 som tilnærming til tastaturplass. `LAYOUT_SCREENSHOTS` kan angi en mappe for visuell kontroll. Analytics-testen bruker lokalt fangede payloads fra det originale beaconet. Ingen testtrafikk sendes til Cloudflare.

Mobilkontroll er utført i emulerte Chromium/Edge-visninger, ikke på fysisk iPhone/Android eller Safari. Eksterne Worldle-bilder og Cloudflare-dashboardets mottak kontrolleres ikke av den lokale testen. Ingen backend, elevdata eller tilgangsbeskyttelse er endret.


### Tettere standardvisning ved 100 % zoom

Kontroller, oppsett og forsøksrader er fortettet videre. Globle har hvit bakgrunn utenfor kloden i lys modus og svart i mørk modus, mens havfargen beholdes. Gjett, Vis fasit og Nytt land ligger på samme linje. Forsøksrader er normalt 23 px høye, og bare listen ruller når den er full. Forklaringen og avstandshjelpen ligger samlet i én lukket «Slik fungerer det» nederst. Samme prinsipp med mindre kontroller og samlet hjelp brukes i de øvrige oppdaterte quizene. Mobil beholder lesbare inntastingsfelt og egne trykkflater.

GeoGuessr-innrammingen har bare to flytende kontroller: Meny og Quizoversikt. Selve det eksterne spillet er uendret. Quizoversikten har mindre kort, forhåndsvisninger og tekst ved vanlig nettleserzoom; dette er separat stil som ikke endrer fagseksjonene.

Layouttesten kontrollerer også minst 20 ekte Globle-gjetninger, én linje for alle tre handlingsknappene, synlig retur uten rulling av kontrollpanelet, begge bakgrunnsfarger, samlet hjelpetekst, GeoGuessr-innramming uten topplinje og kompakte oversiktskort. `geography-layout.cjs` dekker fortsatt fire skjermstørrelser og mobilspill. Ingen CSS-zoom brukes.


### Venstrepaneler, romslige spørsmål og resultatvisning

Alle lokale spill har nå kontrollpanelet til venstre på PC, med integrert Meny-knapp. Geografimenyen åpnes over dette panelet og kan lukkes med Lukk, Escape eller klikk utenfor. På mobil ligger panelet over spørsmålene eller under kartet. GeoGuessrs to navigasjonsknapper er samlet til venstre; det eksterne spillet fyller fortsatt vinduet. Statle har tittelen «Statle» uten OnlyFag-logo.

Flaggquiz, hovedsteder, flagg/hovedstad og kjente steder bruker høyere svarbokser og romslige spørsmålskort. Resultatboksen og toppresultater flyttes til spillpanelet etter et feil svar. Tilbakemelding, score, toppresultater og sekundærtekst i lys modus har mørkere farger. Jeopardy-ruter som er spilt, får skravering, tydelig ramme, gjennomstreking og «✓ Valgt», samt tilgjengelig valgt-status.

Globle avviser tomme svar og mellomrom både fra Gjett-knappen og Enter. Bare startknappen legger inn det første tilfeldige landet. Endringen ligger i den delte kartfilens Globle-funksjon. Byggeskriptet legger en innholdshash som v-parameter på de fire quizenes maplab-iframe, slik at oppdatert spillkode hentes ved ny publisering.

Testene dekker også venstrepaneler, integrert meny og lukking, høyere svaralternativer, resultatplassering og minst 4,5:1 kontrast for tilbakemeldinger/resultattekster i lys modus. Statle-testen gjennomfører en hel runde med alle 50 delstater og kontrollerer ny tittel og plassering; cache-testen bekrefter at eldre buffer ikke hindrer riktig lasting.
