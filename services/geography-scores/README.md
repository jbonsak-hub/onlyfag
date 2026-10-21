# Globale geografiresultater

Cloudflare Worker `onlyfag-geography-scores` bruker den separate D1-databasen med samme navn. Nettstedet fortsetter på GitHub Pages. Ingen prøvedatabase, elevkonto eller tilgangsbeskyttelse endres.

## Spill og rangering

- MapWiz: topp 10 for fullførte runder med ti spørsmål, egen liste per kategorivalg. Serveren fordeler oppgavene og tillater maks to fra samme kategori når mer enn fem kategorier er valgt. Den beregner avstand, tidsbonus og samlet tid, med eksisterende Norge-/verdensformler.
- Flagg, Hovedsteder og Flagg+Hovedstad: topp 10, egen liste per område og retning. Runde avsluttes ved første feil eller når alle oppgavene er løst.
- Kjente steder: topp 10 for «på rad», egen liste per retning. Varianten med 20 spørsmål forblir lokal uten ny konkurranseregel.
- Statle: topp 10 etter fullførte 50 stater. Serveren tildeler 100/75/50/0 poeng etter grønn/gul/oransje/rød kategori, maksimalt 5000. Feil, tidsbruk og hopp over kontrolleres; ufullførte runder kan ikke publiseres.
- Norske fylker: egen topp 10 etter fullførte 15 fylker, med samme regler som Statle og maksimalt 1500 poeng. Norsk og engelsk deler listen. Krever oppdatert Worker ved publisering; ingen databaseendring eller migrering er nødvendig.
- Finn land: topp 10 per geografisk område. Serveren kontrollerer land, gjentakelser, hint og tidsbonus.

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
4. `node scripts/build-quiz-language.cjs` og `node scripts/build-geography-quiz-assets.cjs` versjonerer nettleserressursene.
5. `wrangler deploy --config services/geography-scores/wrangler.jsonc` publiserer Worker. `wrangler d1 execute onlyfag-geography-scores --remote --file services/geography-scores/schema.sql --config services/geography-scores/wrangler.jsonc` oppretter tabeller ved førstegangsoppsett.

Wrangler 4.151.3 ble brukt ved oppsett. `RATE_SECRET` opprettes som en Worker-secret, aldri som en variabel i nettleseren. API-adressen i `assets/geography/score-service.js` er offentlig. Hvis API-et svikter, vises beskjed og runden fortsetter lokalt uten å sende inn en uverifisert score. Ved lagringsfeil på sluttskjermen kan brukeren prøve igjen innen sesjonen utløper.

Databasesletting/moderering utføres av kontoeieren i D1, med betingelser for den aktuelle resultat-ID-en. Ingen offentlig slette- eller administrasjons-API er tilgjengelig.

Ved oppgradering fra språkdelte lister kjøres `migrations/0001-shared-language-rankings.sql` mot den separate geografi-databasen etter Worker-deploy. Migreringen beholder alle poeng, kallenavn, tider og aktive runder; bare listeinndelingen endres. Den kan kjøres flere ganger.
