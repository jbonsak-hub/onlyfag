# Globale geografiresultater

Cloudflare Worker `onlyfag-geography-scores` bruker den separate D1-databasen med samme navn. Nettstedet fortsetter på GitHub Pages. Ingen prøvedatabase, elevkonto eller tilgangsbeskyttelse endres.

## Spill og rangering

- MapWiz: topp 10 for fullførte runder med ti spørsmål, egen liste per kategorivalg. Serveren fordeler oppgavene og tillater maks to fra samme kategori når mer enn fem kategorier er valgt. Den beregner avstand, tidsbonus og samlet tid, med eksisterende Norge-/verdensformler.
- Flagg, Hovedsteder og Flagg+Hovedstad: topp 10, egen liste per område og retning. Runde avsluttes ved første feil eller når alle oppgavene er løst.
- Kjente steder: topp 10 for «på rad», egen liste per retning. Varianten med 20 spørsmål forblir lokal uten ny konkurranseregel.
- Statle: topp 10 etter fullførte 50 stater. Serveren tildeler 100/75/50/0 poeng etter grønn/gul/oransje/rød kategori, maksimalt 5000. Feil, tidsbruk og hopp over kontrolleres; ufullførte runder kan ikke publiseres.
- Norske fylker: egen topp 10 etter fullførte 15 fylker, med samme regler som Statle og maksimalt 1500 poeng. Norsk og engelsk deler listen. Krever oppdatert Worker ved publisering; ingen databaseendring eller migrering er nødvendig.
- Kart, verdensdeler: én topp 10 per verdensdel etter at alle målene i kartet er besvart. De seks kartene omfatter til sammen 197 land uten gjentakelser og tre uttrykkelig merkede territorier: Fransk Guyana (fransk), Ny-Caledonia (fransk) og Vest-Sahara (omstridt). Samme poengregler som Statle, med maksimalt 100 poeng per mål. Fylker-valget i Kart bruker fylkenes eksisterende liste; USA-valget lenker til Statle og beholder listen der. Norsk og engelsk deler hver liste. Krever oppdatert Worker ved publisering, uten databaseendring.
- Kart, elver/fjellkjeder/vannområder: samme regler som Statle, med 100/75/50/0 poeng etter tid og feil, ubegrenset antall rettingsforsøk og 0 for hopp over. Alle mål må fullføres. Egen liste per kart og valgt kombinasjon av vannkategorier.
- Kommuner: én topp 10 per fylkeskart, med `game: "kommuner"` og fylkets tosifrede `county`, for eksempel `"39"` for Vestfold. Oslo og omegn (`"03"`) har sin egen liste for alle de 54 kommunene i dette kartet, inkludert Sør-Odal og Kongsvinger. Serveren henter nøyaktig de samme navnene som kartene; alle kommunene i valgt kart må fullføres.
- Oslo: egen topp 10 med `game: "bydeler", variant: "oslo-areas-v5"` for kartets 43 gjeldende land-, skog-, innsjø- og øyområder. Alle mål er polygoner; punktmarkører brukes ikke. Antall oppgaver og maksimal poengsum hentes fra `oslo.json`: 100/75/50/0-reglene gir maksimalt 100 poeng per mål (4300 for denne utgaven). Norsk og engelsk deler listen, som holdes adskilt fra alle fire historiske Oslo-varianter og andre quizer.
- Bufrede Oslo-sider og aktive eldre runder uten `variant` beholder de 16 tidligere målene og den opprinnelige listen med maksimalt 1600 poeng. Navnene er fastlåst i `legacy-oslo-targets.json`.
- Den tidligere utvidelsen med `variant: "oslo-28"` beholder nøyaktig sine 28 mål og sin eksisterende liste med maksimalt 2800 poeng. Navnene i `legacy-oslo-28-targets.json` kommer fra den publiserte, uforanderlige filen `oslo-00fc86a8a4bf.json`, ikke fra den nye arbeidsfilen.
- Polygonutgaven med `variant: "oslo-areas-v3"` beholder alle sine 57 mål og sin egen eksisterende liste med maksimalt 5700 poeng. Navnene i `legacy-oslo-57-targets.json` er fastlåst fra den publiserte, uforanderlige filen `oslo-fa9842cf0c7a.json`. Nye v3-runder fra bufrede sider og allerede aktive v3-runder bruker dette gamle målsettet, også når et mål er fjernet fra det gjeldende kartet.
- Den forenklede utgaven med `variant: "oslo-areas-v4"` beholder alle sine 35 mål og sin eksisterende liste med maksimalt 3500 poeng. Navnene i `legacy-oslo-35-targets.json` beholder navn og rekkefølge fra den publiserte, uforanderlige filen `oslo-8350eadb74db.json`. Aktive v4-runder kan fortsatt svare «Østre Bærum», selv om det gjeldende v5-kartet i stedet bruker egne postområder.
- Alle fem Oslo-varianter har separate resultatidentiteter. De fire historiske variantene kan fortsatt svare, fullføre og publisere aktive runder. Ingen resultater slettes eller migreres. Ukjente varianter avvises.
- Finn land: topp 10 per geografisk område. Serveren kontrollerer land, gjentakelser, hint og tidsbonus.

Kart bruker disse separate listevalgene:

| Kart | API-region | Mål | Maks poeng |
| --- | --- | ---: | ---: |
| Europa | `europe` | 47 | 4700 |
| Asia | `asia` | 47 | 4700 |
| Nord- og Mellom-Amerika | `northAmerica` | 23 | 2300 |
| Sør-Amerika | `southAmerica` | 13 | 1300 |
| Afrika | `africa` | 55 | 5500 |
| Oseania | `oceania` | 15 | 1500 |

De tre fysiske kartene bruker `game: "kart"` og `region: "rivers"`,
`"mountains"` eller `"lakes"`. Det finnes ikke lenger egne spillmåter.
Vannkartet tar `categories`, en normalisert liste av `"lakes"`, `"seas"` og
`"gulfsStraits"`; standard er bare `["lakes"]`. Tomme/ukjente kategorier avvises.
Serveren tildeler og godtar bare mål fra valget. Norsk og engelsk deler liste,
og kategoriorden påvirker ikke listeidentiteten. Gamle verdensdelslister beholdes.

| Fysisk kart | Mål | Maks poeng |
| --- | ---: | ---: |
| Verdens elver | 49 | 4900 |
| Fjellkjeder og høyland | 34 | 3400 |
| Innsjøer | 33 | 3300 |
| Hav og sjøområder | 44 | 4400 |
| Bukter og stred | 29 | 2900 |

Oppdatert Worker må publiseres sammen med nettsiden. Det kreves ingen ny
D1-tabell eller migrering. Havkartets forenklede inndeling og innlemmede navn er dokumentert i `docs/marine-coverage.md`.

Kartgruppene følger nettstedets eksisterende quizområder. Armenia, Aserbajdsjan og Georgia er lagt til Asia slik at alle 197 land er med. Russland, Tyrkia og Kypros ligger i Europa. Serverens mål er hentet fra de samme kartfilene som klienten, og byggeprosessen avviser manglende land eller gjentakelser. Territoriene er egne Kart-mål med metadata i kontinentkartene; de endrer ikke landkatalogen i Finn land eller andre spill. De fysiske kartene hentes fra `physical-maps/world-water.json` og `physical-maps/mountain-europe.json`.

Norsk og engelsk deler resultatliste. Språket styrer spørsmål og knapper. Når et fullført resultat kvalifiserer til topp 10, åpnes kallenavnvinduet automatisk. Brukeren velger fortsatt selv om resultatet skal publiseres. Vinduet viser bare «Du er på topp 10!», kallenavn og lagreknapp. En åpen resultatliste oppdateres hvert femte sekund og når fanen blir synlig igjen. Oppdateringen stopper når listen lukkes eller fanen skjules.

Tid er servermålt og inkluderer nettverksforsinkelse. Ved like poeng rangeres kortere tid foran. Gamle lokale resultater lastes ikke opp; de beholdes i nettleserlagringen, men har ingen knapp i nettlistene. Worldle, Tradle og de andre spillene uten slike resultatlister får ingen nye rangeringer i denne endringen.

## Kontroll og begrensninger

Serveren oppretter runder og kontrollerer hvert svar/klikk. Oppgavene forhåndshentes. Spillet viser lokal tilbakemelding straks, mens en ordnet kø sender svar til serveren. Sluttskjermen venter på kontrollen før et resultat kan publiseres. Ved feil i køen blir runden ikke rangert på nett; klientpoeng stoles aldri på. Nettleseren kan ikke sende inn et fritt valgt poengtall. Tilfeldige sesjonstoken finnes bare i nettleserens minne; databasen lagrer SHA-256-hash. Fullførte runder kan publiseres én gang. Revisjonskontroll hindrer parallelle svar i å telle dobbelt, og identiske forespørsler kan gjentas ved nettverksfeil.

Dette er en åpen spilltjeneste uten brukerinnlogging. Kallenavn verifiserer ikke identitet. Offentlige geografidata og automatiserte oppslag gjør tjenesten uegnet som manipulasjonssikker konkurranse med premier eller vurdering av elever. Origin-kontroll og forespørselsgrenser reduserer misbruk, men erstatter ikke identitetskontroll eller botvern. Turnstile er ikke aktivert.

Det er 120 nye runder per ti minutter og 2400 API-kall per minutt per offentlig nettverksadresse, slik at en skoleklasse kan dele samme adresse. Begrensningsnøkler er saltede hasher, ikke rå IP-adresser. Utgåtte nøkler og sesjoner slettes hver time. Sesjoner utløper etter to timer og blir normalt slettet innen tre timer; de inneholder midlertidig spilltilstand. Publiserte kallenavn, poeng, tid og spillvariant lagres til de slettes av eieren. Det finnes ingen e-post-/elevregistrering.

Ingen spilldata, kallenavn eller token sendes til Web Analytics. API-et har ingen applikasjonslogging av forespørsler eller svar. Cloudflare behandler nettverkstrafikken som leverandør. Kontoautentisering og serverhemmeligheter finnes ikke i repoet.

## Oppdatering og tester

1. `node scripts/build-geography-score-data.cjs` bygger serverens offentlige referansedata fra eksisterende geografikilder. `--check` verifiserer at de er oppdatert. Øk regelversjonen ved endringer som gjør resultater usammenlignbare.
2. `node --test tests/geography-score-api.mjs` tester reglene og API-et mot en isolert SQLite-database (Node 24).
3. `node tests/geography-online-browser.cjs` tester spill, to nettlesere, språk, mobil, lokale lister og offline-fallback mot en isolert database. Krever Playwright og eventuell `BROWSER_EXECUTABLE`.
   `node tests/kart-online.cjs` tester komplette kontinent-/fylkesrunder, separate kartlister, automatisk kallenavnvindu og bytte av kart mens en nettøkt opprettes.
4. `node scripts/build-quiz-language.cjs` og `node scripts/build-geography-quiz-assets.cjs` versjonerer nettleserressursene.
5. `wrangler deploy --config services/geography-scores/wrangler.jsonc` publiserer Worker. `wrangler d1 execute onlyfag-geography-scores --remote --file services/geography-scores/schema.sql --config services/geography-scores/wrangler.jsonc` oppretter tabeller ved førstegangsoppsett.

Wrangler 4.151.3 ble brukt ved oppsett. `RATE_SECRET` opprettes som en Worker-secret, aldri som en variabel i nettleseren. API-adressen i `assets/geography/score-service.js` er offentlig. Hvis API-et svikter, vises beskjed og runden fortsetter lokalt uten å sende inn en uverifisert score. Ved lagringsfeil på sluttskjermen kan brukeren prøve igjen innen sesjonen utløper.

For fylker og Kart skal referansedata bygges og Worker publiseres før de nye nettlistene brukes på nettstedet. Denne utvidelsen krever verken endring av databaseskjemaet eller en migrering; eksisterende Statle-, fylkes- og andre resultater beholder listeidentiteten sin. Det er ikke nødvendig å kjøre `schema.sql` på nytt.

Det samme gjelder nye kommune- og bydelslister, inkludert det gjeldende Oslo-kartet (`oslo-areas-v5`). Denne utgaven krever ingen ny tabell eller databasemigrering; de historiske 16-/28-/57-/35-målslistene og aktive rundene beholdes. Kjør `node scripts/build-geography-score-data.cjs`, `node --test tests/geography-score-api.mjs` og `BROWSER_EXECUTABLE=/usr/bin/chromium node tests/local-maps-online.cjs`, og publiser deretter Worker med kommandoen ovenfor. Det ligger ingen automatisk Worker-utrulling i repoet. GitHub Pages-publisering av HTML/JavaScript oppdaterer ikke Worker. Uten oppdatert Worker avviser API-et de nye spillkonfigurasjonene, klienten gir beskjed om manglende nettrangering og lar runden fortsette lokalt. Den hevder aldri at et uverifisert resultat er lagret.

Databasesletting/moderering utføres av kontoeieren i D1, med betingelser for den aktuelle resultat-ID-en. Ingen offentlig slette- eller administrasjons-API er tilgjengelig.

Ved oppgradering fra språkdelte lister kjøres `migrations/0001-shared-language-rankings.sql` mot den separate geografi-databasen etter Worker-deploy. Migreringen beholder alle poeng, kallenavn, tider og aktive runder; bare listeinndelingen endres. Den kan kjøres flere ganger.

Innsjøer og hav er egne Kart-valg. Innsjøer bruker fortsatt region=lakes med standardkategorien lakes. Hav bruker region=seas, med kategoriene seas/gulfsStraits. Eldre kombinasjoner av region=lakes beholdes i API-et for kompatibilitet med publiserte klienter. Kontinentvis øving i elver/fjell/innsjøer sender ingen API-kall og gir ingen rangering.
