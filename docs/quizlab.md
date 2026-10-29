# Quizlab

Quizlab åpnes fra **Jobb → Quizlab**, på `/jobb/quizlab.html`. Læreren velger
spillmodus, tid eller antall spørsmål, kategorier og en ledig kortadresse som
`quiz01`. Standard tid per spørsmål er **15 sekunder**; innstillingen kan endres
til 5–120 sekunder. Elevene gjennomfører quizen uten elevkonto og kan frivillig
lagre et kallenavn på quizens offentlige highscore-liste.

## Spillregler

- **Høyest riktigprosent:** en angitt samlet rundetid. Resultatlisten sorterer
  etter riktigprosent, deretter antall riktige, tid og tidspunkt.
- **Flest riktige på tid:** samme rundetid og kategoriblokker, med antall
  riktige først i rangeringen, deretter riktigprosent og tid.
- **Et fast antall spørsmål:** alle valgte kategorier får minst ett spørsmål.
  Oppgavene fordeles så jevnt som mulig, med høyst ett spørsmåls forskjell, og
  spørsmål fra samme kategori kommer samlet. Antall riktige avgjør rangeringen.

I begge tidsmodusene har hver kategoriblokk
`ceil(10 × antall minutter / antall valgte kategorier)` spørsmål. Fem minutter
og tre kategorier gir for eksempel 17 spørsmål på rad per kategori. Når alle
blokkene er gjennomført, begynner kategorirekkefølgen igjen med nye oppgaver.
Rundetiden kan gå ut midt i en blokk; antall faktisk gjennomførte spørsmål
avhenger av hvor raskt eleven svarer. En kategoris mål stokkes og brukes uten
gjentakelser til hele dens målsett er brukt.

Et spørsmål gir ett riktig eller ett feil svar. For kart er første klikk
avgjørende. MapWiz regner et svar innen 90 km som riktig, på det samme
verdenskartet som den eksisterende standardmodusen. Det er ingen tilleggspoeng
for klikkavstand eller svartid i Quizlab. Serveren styrer både rundens slutt
og fristen for hvert spørsmål. Utløpte og hoppede spørsmål teller som feil.
En tidsrunde kan ikke leveres tidlig for å beholde en høy riktigprosent.

## Moduler og data

`scripts/build-quizlab-data.cjs` lager den offentlige katalogen i
`assets/quizlab/catalog.json`, med 33 moduler:

- Flagg og hovedsteder: 197 land hver.
- MapWiz: alle 794 eksisterende mål. Ett nivå velges for denne kategorien:
  Normal (218), Vanskelig (348) eller Hjerterå (228).
- Worldle: flervalg med 168 faktiske landomriss.
- De seks verdensdelskartene, norske fylker, USAs stater og Oslo.
- Elver (gjeldende 41 mål), fjell, innsjøer, havområder samt bukter og stred.
- Ett kommunekart for hvert av de 15 fylkesvalgene. «Oslo og omegn» bruker
  det gjeldende utvalget med 31 kommuner.

Katalogens navn og mål sammenlignes med den eksisterende scoretjenestens
`data.json` under bygging. Kartmodulene refererer til de eksisterende
geometrifilene; de har ingen nye erstatningspolygoner. Kontinentkartets
merkede territorier beholdes som i den opprinnelige kartmodulen. Flagg hentes
fra de lokale filene gjennom `MapSymbols`; ingen ekstern flaggtjeneste trengs.

Worldle bruker landgeometrien som allerede ligger i `core.js`, ikke sirklene
som gjør enkelte småstater klikkbare i verdensdelskartet. Land som mangler
faktisk polygon i dette opprinnelige datasettet inngår derfor ikke i
omrissmodulen. Hele landets eksisterende geometri projiseres nordvendt og
tilpasses en egen SVG. Fastlands-Frankrike og tilleggsgeometrier for Marokko,
Kypros og Somalia følger den eksisterende Worldle-policyen. Resultatet ligger
i `assets/quizlab/silhouettes.json`.

Kartkreditering følger katalogens `attribution` og `attributionURL`:
[Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) er public
domain; fylkesgeometrien er tilpasset fra NordNordWest på
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Vestland_in_Norway_2024.svg)
under CC BY-SA 3.0 DE; kommunegeometrien og hydrogeografien bruker
[Kartverket](https://kartverket.no/til-lands/kart/kartdata), CC BY 4.0.
Oslo-kartet beholder Oslo kommune og
[OpenStreetMap-bidragsytere](https://www.openstreetmap.org/copyright) som
kilder. De eksisterende kildefilene og geografidokumentene beskriver
uttrekk, bearbeiding og fullstendig proveniens.

## Adresser og administrasjon

Den kanoniske elevsiden er `/quiz/?id=quiz01`. Kortadressen `/quiz01` åpner
den samme quizen gjennom nettstedets `404.html`, som sender nettleseren videre
til elevsiden. Dette er en klientomdirigering på GitHub Pages: den første
forespørselen til kortadressen har HTTP-status 404, mens den kanoniske siden
har 200. Det trengs ingen ny publisering for hver quiz som opprettes.

Oppretteren får en privat administrasjonslenke med en tilfeldig nøkkel i
URL-fragmentet. Nøkkelen blir ikke en del av HTTP-adressen eller elevlenken.
Den lagres også lokalt i oppretterens nettleser slik at egne quizer kan åpnes
igjen. Ingen innlogging er nødvendig. Alle som har denne private lenken kan
endre quizen; den må derfor oppbevares separat fra elevlenken. Serveren lagrer
bare nøkkelens SHA-256-hash. Det finnes ingen offentlig liste over
administrasjonsnøkler og ingen gjenoppretting via e-post.

Hver endring lager en ny, uforanderlig quizversjon og en egen highscore-liste.
Elevadressen beholdes. Påbegynte runder fullfører mot versjonen de startet med;
tidligere resultater slettes eller flyttes ikke. Kallenavn verifiserer ikke
identitet og bør være navn elevene selv ønsker offentliggjort.

## API og lagring

Den eksisterende `onlyfag-geography-scores`-Workeren håndterer `/quizlab/*`
etter samme Origin-kontroll og forespørselsgrenser som geografispillene:

| Forespørsel | Funksjon |
| --- | --- |
| `GET /quizlab/catalog` | Offentlig kategorimetadata |
| `POST /quizlab/quizzes` | Opprett quiz og få privat administrasjonsnøkkel |
| `GET /quizlab/quizzes/:slug` | Offentlig quizoppsett |
| `POST /quizlab/quizzes/:slug` | Ny versjon; krever administrasjonsnøkkel |
| `POST /quizlab/quizzes/:slug/sessions` | Start en serverstyrt elevrunde |
| `POST /quizlab/status` | Hent rundetilstand og behandle utløpte frister |
| `POST /quizlab/answer` | Kontroller ett svar |
| `POST /quizlab/finish` | Fullfør når runden er ferdig |
| `POST /quizlab/publish` | Lagre fullført resultat med kallenavn |
| `GET /quizlab/quizzes/:slug/scores` | Topp 10 for valgt eller gjeldende versjon |

Elevrunder bruker egne tilfeldige sesjonsnøkler. Serveren velger spørsmål,
kontrollerer svar og beregner resultatet; klienten kan ikke oppgi en fri
poengsum. Revisjonskontroll beskytter mot samtidige svar, og request-ID gjør
identiske gjentakelser trygge ved nettverksfeil. Et fullført resultat kan bare
publiseres én gang per runde.

Den additive migreringen `services/geography-scores/migrations/0002-quizlab.sql`
oppretter `quizlab_quizzes`, `quizlab_versions`, `quizlab_sessions` og
`quizlab_scores`. Den endrer ikke eksisterende geografisesjoner eller
highscore-tabeller. Utgåtte midlertidige sesjoner ryddes av samme timejobb;
quizoppsett, versjoner og publiserte resultater blir liggende.

## Lokal kontroll og utrulling

Fra repository-roten:

```sh
node scripts/build-quizlab-data.cjs
node scripts/build-quizlab-data.cjs --check
node --test tests/quizlab-api.mjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/quizlab-browser.cjs
node --test tests/geography-score-api.mjs
git diff --check
```

Byggets `--check` sammenligner katalogen og omrissfilen byte for byte med en
ny, deterministisk generering. API-testene bruker en isolert SQLite-database.
Nettlesertestene bruker lokale, avskjermede forespørsler; ingen syntetiske
elevresultater skal sendes til den offentlige tjenesten.

Ved produksjonsutrulling publiseres først kompatibel Worker, og til slutt
nettsiden via `main`. Byggeskriptet pakker den faste, additive SQL-migreringen
i `quizlab-schema.json`. Før første Quizlab-forespørsel oppretter Workeren de
nye tabellene gjennom sin eksisterende D1-binding; opprettelsen kan gjentas
og mottar ingen SQL fra klienten. En isolert database testes også fra det
gamle skjemaet. Direkte D1-administrasjon er derfor ikke nødvendig ved
utrulling. Migreringsfilen kan alternativt kjøres manuelt av databaseeieren. Den gamle `schema.sql` skal ikke kjøres
på nytt for denne funksjonen. En Worker dry-run bekrefter pakking uten å
publisere. Nettstedets HTML utruller ikke Workeren automatisk. Hvis API-et er
utilgjengelig skal brukergrensesnittet vise feilen; det må aldri hevde at en
quiz eller et resultat er lagret når bare lokal tilstand finnes.

Opprettelser begrenses til 30 per minutt per nettverksadresse. En opprettelse
har en privat klientbevart nøkkel slik at et tapt nettverkssvar kan gjentas
uten at quiz eller administrasjonslenke går tapt. Kategorivalg og nøkkelen
lagres midlertidig i lærerens nettleser fram til opprettelsen er bekreftet.
