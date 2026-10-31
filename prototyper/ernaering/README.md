# Ernæring og helse

Minimalistisk øvingsmodul i eksisterende OnlyFag, tilgjengelig som modulen «Næringsstoffer og fordøyelsen» på `/naturfag.html#nutrition/all`. Den selvstendige adressen `/prototyper/ernaering.html` støttes fortsatt.

145 oppgaver, hvorav 44 med figur eller organmodell. Seks fagtemaer; figuroppgaver ligger under fagtemaet de hører til. Blandet øving står sist. Ingen installasjon eller byggesteg for nettsiden.

Pensum er de fem opprinnelige PowerPoint-presentasjonene (105 lysbilder) og de fem oppgitte arkene. Arkivets PowerPoint-tekst er hentet og kontrollert fra checkpoint `d92f59d811ee8676d93a0ea135f5c204568cf45b`, `docs/ernaering-grunnlag/`. Se fagloggene i `docs/ernaering-materiale.md` og `docs/ernaering-ndla.md`. NDLA gir oppgaveinspirasjon, men innfører ikke nye nødvendige forkunnskaper.

Kjemimodulen i `naturfag.html` er layoutreferanse: kort toppfelt, kompakt venstremeny, direkte oppgavestart, direkte temavalg uten filtermeny. Ingen presentasjonsoverskrift eller dekorativ ramme. Viktige figurer står store til høyre; valg, svarknapper og tilbakemelding står samlet til venstre. På smale skjermer legges figuren over svarene. Modellbesvarelse deler plass med elevsvaret. Varige modulpreferanser står i rotens `AGENTS.md`.

Sukkerstrukturer vises som ringer. Fettsyrer er fullt tegnet med C og H, uten forkortede gjentakelsesgrupper. Omegaoppgaven viser verken nummererte karbonatomer eller tellemetode før svaret; metoden dukker opp i fasiten. Begrepskartet har ti tomme felt og fire faste holdepunkter. Én samlet karbohydratsortering erstatter de enklere duplikatene.

Oppgavene roteres uten gjentakelser til hele utvalget er vist. De ti siste ID-ene unngås der utvalget tillater det, og samme figurfamilie unngås blant de tre siste når andre usette oppgaver finnes. Både besvarte og hoppede oppgaver teller som vist. Historikken overlever temabytte og omlasting. Små utvalg slakker først på den eldste sperren. Eksplisitt åpning fra banken og «Prøv på nytt» er tilsiktede unntak. Svaralternativer og koblingssvar stokkes uavhengig.

Anatomifiguren har klikk/tastatur, valgfri dra/slipp og en tekstliste. Prosessoppgaver grupperer tolvfingertarm med tynntarm. Riktige delsvar låses ved retting; rekkefølgepiler flytter mellom ledige plasser.

Åpne svar har modellbesvarelse og egenvurdering; de rettes aldri med nøkkelordsøk. Korte begreps-/tallsvar normaliserer mellomrom, store/små bokstaver, senkede tall, desimalkomma og oppgitt enhet.

Historikken lagres bare i nettleseren under `onlyfag.nutrition.v1`. Feil, hint og fasit gir repetisjon. Et nytt forsøk innen ti minutter etter hjelp regnes fremdeles som støttet øving. Selvstendige svar repeteres etter 1, 3, 7 og 14 dager; egenvurderte svar holdes atskilt og repeteres etter én dag. Dette er øvingshistorikk, ikke prøveresultater eller karakterer. Blokkert nettleserlagring vises i grensesnittet og hindrer ikke øving.

## Faggrunnlag

De fem nye vedleggene er gjennomgått i `docs/ernaering-materiale.md`. Alle 22 hoved-/tilleggssider i det lenkede NDLA-emnet er dokumentert i `docs/ernaering-ndla.md`, inkludert begrensninger for innebygd H5P, film og eldre simuleringer. Tegningene er egne SVG-er, ikke kopier av lærebok-/NDLA-bilder. Eldre forenklinger i kildene er presisert før de brukes som fasit.


Kildegrunnlag med alle fem presentasjoner (105 lysbilder), fagreview og spørsmålreview ligger på grenen `codex/ernaering-prototype`, checkpoint `d92f59d811ee8676d93a0ea135f5c204568cf45b`, i `docs/ernaering-grunnlag/`. Originale PowerPoint-bilder er ikke brukt. Figurene i `diagram.js` og `figures.js` er originale skjematiske SVG-er. Kilder og avgrensninger vises i sidens dialog, ikke som en permanent teorivegg.

Review-punkter fulgt opp: fettfordøyelse på figur, tolvfingertarm som del av tynntarm, tilkoblede sekretganger, laktase, proteinkvalitet, laktatbegrep, omega-familier og nyansert formulering om vitaminopptak. Valgalternativer og koblingssvar stokkes. Rekkefølgeoppgaver starter ikke i fasitrekkefølge.

## Verifikasjon

Fra repo-roten:

```sh
node --test tests/ernaering.test.mjs
NODE_PATH=/workspace/work/nutrition-test-deps/node_modules:/workspace/shared/onlyfag-tools/node_modules node tests/ernaering-dom.cjs
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/ernaering-layout.cjs
```

DOM-testen krever `jsdom` (testet med v26; bundling med esbuild). Den kan kjøres med `NODE_PATH` til en isolert installasjon. Ingen pakkefiler eller avhengigheter trengs for selve nettsiden.

- Ren Node-test: skjema og fasiter for alle oppgaver, feil/ekstra valg, svarnormalisering, hjelpetilstand og repetisjon, stokking.
- DOM-test: alle 145 oppgaver fullføres via grensesnittets kontroller; delvis riktige svar, fasit, egenvurdering, filter, persistens, mobilmeny, utilgjengelig lagring og avgrenset nullstilling.
- Browserkontroll: alle oppgaver før svar og etter fasit ved 1366 × 768, 1280 × 720, 1024 × 768 og 390 × 844. Kontrollerer oppgave/figur/svar/knapper samlet, ingen horisontal overflyt og ingen nødvendig siderulling ved disse størrelsene med filtre og ekstralister lukket. Utvidet «Hvorfor?», tekstalternativ og oppgavebank kan rulle etter elevens eget valg. Manuell bildeinspeksjon av blant annet sukkerstrukturer, cis/trans, glyserol/fettsyre og organplassering.

Felles `assets/analytics.js` lastes én gang på siden. Elevsvar sendes ikke til noen tjeneste av øvingsmotoren.

Avgrensning etter oppdateringen: ingen oppgaver om påvisningsreaksjoner eller fettekstraksjon. Strukturfigurene bruker kjente stoffnavn og forklaringer uten Fischer-/alfa-/beta-navnsetting. Omega beskrives ved å telle fra enden motsatt syregruppen. Blandet øving står sist i temalisten.

Revisjon etter konkret pensumkontroll: Oppgavene bruker ikke esterbinding, hydrolyse, glykosidbinding, lipase, mikrovilli eller lysin som elevbegreper. Peristaltiske bevegelser er betegnelsen som brukes. Avanserte bindings-/herdingsoppgaver og spørsmål med nye fysiologiske forkunnskapskrav er fjernet. Tester kontrollerer også fravær av uønsket vokabular og typiske fasitlekkasjer før svar.

## Naturfag og siste 20 svar

`assets/naturfag-modules.js` samler kjemi og næringsstoffer i én sidemeny. Ernæringsmodulen støtter `?embedded=1&topic=<tema>&view=practice|bank`; egen sidemeny og menyknapp skjules i denne visningen. Korte, validerte meldinger synkroniserer valgt tema, visning, prosenttall og fargetema. Alle meldinger sjekker både avsenderens origin og vindu.

Rekkefølge: karbohydrater, proteiner, fett, vitaminer/mineraler/vann, fordøyelsen, energi/blodsukker og blandet øving. Rullerende prosent lagres separat som `recentResults` i den eksisterende lokale historikken. Hvert fagtema og samlet øving har et vindu på inntil 20 førstesvar. Feil førstesvar beholdes som feil etter retting; et støttet svar eller fasit teller ikke som riktig. Ufullstendige svar og hopp teller ikke, og skriveoppgaver inngår aldri. Tidligere mestringsregistreringer bevares, uten å brukes som oppdiktet svarrekkefølge. Nullstilling berører bare ernæringsmodulen.

Kildepanelet viser korte eksterne fagreferanser; det har ingen avhengighet av en bestemt lærer, klasse eller prøve. Interne faglogger over undervisningsgrunnlaget er beholdt som vedlikeholdsdokumentasjon.

Integrasjonen kontrolleres med `node tests/naturfag-modules.cjs` i tillegg til modulens eksisterende tester. Browserkontroller trenger samme lokale nettverkstilgang som de andre Playwright-testene.

Naturfag starter nå på en emnevelger med to illustrerte kort. Modullenkene beholdes som direkte innganger, og Start i den felles menyen tar eleven tilbake til emnevalget. Undermenyene deler samme fete skriftstørrelse. Filterkontrollen og tilhørende tilstand/hendelser er fjernet fra ernæringsmodulen; bankens søk og temaenes oppgaveutvalg er beholdt.
