# Ernæring og helse

Minimalistisk øvingsmodul i eksisterende OnlyFag, publisert på `/prototyper/ernaering.html`.

67 originale oppgaver, seks temaer og ni interaksjonstyper. Én oppgave vises om gangen. Oppgavebanken kan søkes og filtreres. Anatomifiguren har klikk/tastatur, valgfri dra/slipp og en tekstliste. Prosessoppgaver grupperer tolvfingertarm med tynntarm. Riktige delsvar låses ved retting; rekkefølgepiler flytter mellom ledige plasser.

Åpne svar har modellbesvarelse og egenvurdering; de rettes aldri med nøkkelordsøk. Korte begreps-/tallsvar normaliserer mellomrom, store/små bokstaver, senkede tall, desimalkomma og oppgitt enhet.

Historikken lagres bare i nettleseren under `onlyfag.nutrition.v1`. Feil, hint og fasit gir repetisjon. Et nytt forsøk innen ti minutter etter hjelp regnes fremdeles som støttet øving. Selvstendige svar repeteres etter 1, 3, 7 og 14 dager; egenvurderte svar holdes atskilt og repeteres etter én dag. Dette er øvingshistorikk, ikke prøveresultater eller karakterer. Blokkert nettleserlagring vises i grensesnittet og hindrer ikke øving.

## Faggrunnlag

Kildegrunnlag med alle fem presentasjoner (105 lysbilder), fagreview og spørsmålreview ligger på grenen `codex/ernaering-prototype`, checkpoint `d92f59d811ee8676d93a0ea135f5c204568cf45b`, i `docs/ernaering-grunnlag/`. Originale PowerPoint-bilder er ikke brukt. Figurene i `diagram.js` og `figures.js` er originale skjematiske SVG-er. Kilder og avgrensninger vises i sidens dialog, ikke som en permanent teorivegg.

Review-punkter fulgt opp: fettfordøyelse på figur, tolvfingertarm som del av tynntarm, tilkoblede sekretganger, laktase, proteinkvalitet, laktatbegrep, omega-familier og nyansert formulering om vitaminopptak. Valgalternativer og koblingssvar stokkes. Rekkefølgeoppgaver starter ikke i fasitrekkefølge.

## Verifikasjon

Fra repo-roten:

```sh
node --test tests/ernaering.test.mjs
node tests/ernaering-dom.cjs
```

DOM-testen krever `jsdom` (testet med v26). Den kan kjøres med `NODE_PATH` til en isolert installasjon. Ingen pakkefiler eller avhengigheter trengs for selve nettsiden.

- Ren Node-test: skjema og fasiter for alle oppgaver, feil/ekstra valg, svarnormalisering, hjelpetilstand og repetisjon, stokking.
- DOM-test: alle 67 oppgaver fullføres via grensesnittets kontroller; delvis riktige svar, fasit, egenvurdering, filter, persistens, mobilmeny, utilgjengelig lagring og avgrenset nullstilling.
- Visuell kontroll av publisert side utføres separat i skynettleseren. DOM-testen er ikke en visuell nettlesertest.

Felles `assets/analytics.js` lastes én gang på siden. Elevsvar sendes ikke til noen tjeneste av øvingsmotoren.
