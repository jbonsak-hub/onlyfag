# Ernæring og helse

Minimalistisk øvingsmodul i eksisterende OnlyFag, publisert på `/prototyper/ernaering.html`.

173 oppgaver, hvorav 54 med figur eller organmodell. Seks fagtemaer og egen inngang til figuroppgaver. 40 nye strukturoppgaver, 38 fra de fem vedleggene, 27 med inspirasjon fra NDLA og ett begrepskart utfyller de opprinnelige 67 oppgavene. Ingen installasjon eller byggesteg for nettsiden.

Kjemimodulen i `naturfag.html` er referanse: kort toppfelt, kompakt venstremeny, direkte oppgavestart, filtre bak sekundær kontroll. Ingen presentasjonsoverskrift eller dekorativ ramme. Figur og svar vises ved siden av hverandre når bredden tillater det. Modellbesvarelse deler plass med elevsvaret. Brukerens varige modulpreferanser står i rotens `AGENTS.md`.

Oppgavene roteres uten gjentakelser til hele utvalget er vist. De ti siste ID-ene unngås der utvalget tillater det, og samme figurfamilie unngås blant de tre siste når andre usette oppgaver finnes. Både besvarte og hoppede oppgaver teller som vist. Historikken overlever temabytte, filtrering og omlasting. Små utvalg slakker først på den eldste sperren. Eksplisitt åpning fra banken og «Prøv på nytt» er tilsiktede unntak. Svaralternativer og koblingssvar stokkes uavhengig.

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
- DOM-test: alle 173 oppgaver fullføres via grensesnittets kontroller; delvis riktige svar, fasit, egenvurdering, filter, persistens, mobilmeny, utilgjengelig lagring og avgrenset nullstilling.
- Browserkontroll: alle oppgaver før svar og etter fasit ved 1366 × 768, 1280 × 720, 1024 × 768 og 390 × 844. Kontrollerer oppgave/figur/svar/knapper samlet, ingen horisontal overflyt og ingen nødvendig siderulling ved disse størrelsene med filtre og ekstralister lukket. Utvidet «Hvorfor?», tekstalternativ og oppgavebank kan rulle etter elevens eget valg. Manuell bildeinspeksjon av blant annet Fischer-projeksjoner, cis/trans, glyserol/fettsyre og organplassering.

Felles `assets/analytics.js` lastes én gang på siden. Elevsvar sendes ikke til noen tjeneste av øvingsmotoren.
