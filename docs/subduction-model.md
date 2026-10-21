# Interaktiv subduksjonsmodell

Modellen åpnes fra **Indre krefter og landformer → Subduksjonsmodell**, fra lenken etter plategrensetabellen i fagstoffet eller direkte på `geografi.html#indre-subduksjon`.

Glideren styrer et skjematisk utviklingsforløp. Havbunnsplaten forlenges ned under kontinentet, materialmarkører følger bevegelsen, og modellen viser dyphavsgrop, jordskjelvfokus, vannfrigjøring, delvis oppsmelting i mantelkilen, oppstigende magma og en voksende fjellkjede. Forklaringsknappene følger nummereringen i figuren. Spill av/pause, tilbakestilling og tre visningsvalg gjør modellen egnet både til felles gjennomgang og elevutforsking.

## Faglige avgrensninger

- Plate = jordskorpe og øverste mantel. Lagene har egne farger i tverrsnittet.
- Vannholdige mineraler i den synkende platen frigjør vannrike væsker. Tilførsel av vann senker temperaturen der oppsmelting kan begynne ved det aktuelle trykket. Delvis oppsmelting vises i den varme mantelkilen over platen; den synkende platen blir ikke tegnet som en smeltende magmakilde.
- Grunne skjelv vises nær platekontakten, mellomdype og dype fokus inne i platen. Fokusene skiller seg både i form og farge. Dybdemønsteret er kvalitativt, og figuren har ingen beregnet dybdeskala. Dype skjelv forklares ikke som friksjon langs hele plategrensen.
- Fjellkjeden skyldes både vulkanisme og sammenpressing, fortykkelse og heving av skorpa.
- Prosenttallet er posisjon i modellforløpet, ikke prosent av en virkelig kollisjon. Avstander, tykkelser og tid er ikke i målestokk. Prosessene overlapper i naturen; fokusene viser mulige plasseringer, ikke skjelv på bestemte tidspunkter.

Kildene er også lenket i elevvisningen:

- [USGS: Introduction to Subduction Zones](https://www.usgs.gov/special-topics/subduction-zone-science/science/introduction-subduction-zones-amazing-events)
- [USGS: Earthquake depths](https://www.usgs.gov/faqs/what-depth-do-earthquakes-occur-what-significance-depth)
- [Rustioni, Audétat og Keppler (2019): Experimental evidence for fluid-induced melting in subduction zones](https://www.geochemicalperspectivesletters.org/article1925/)

## Implementasjon

`assets/geography/subduction.js` tegner et vektorbasert SVG-tverrsnitt og knytter det til standard HTML-kontroller. Ingen nye pakker, eksterne biblioteker eller nettjenester brukes. `subduction.css` avgrenser stiler til modellen og dens inngangslenker. Smale figurcontainere får et tettere utsnitt, større symboler og korte betegnelser. De utfyllende forklaringene står som lesbar HTML under figuren. Både lys og mørk modus støttes.

Det er ingen automatisk avspilling eller vedvarende bakgrunnsanimasjon i modellen. Eksplisitt avspilling stopper ved pause, manuell justering, tilbakestilling, avsluttet forløp, skjult dokument eller navigasjon bort fra modellen. Endring av innstillingen for redusert bevegelse stopper pågående avspilling. Glideren kan alltid brukes direkte med mus, berøring eller tastatur.

Modellen bruker eksisterende seksjonsnavigasjon og den eksisterende analytics-loaderen. Den oppretter ingen nye sporingshendelser eller lagringsnøkler. Quizkode, quizfiler, felles geografikode og andre fagmoduler er uendret.

## Tester

Krever Node.js og Playwright med Chromium:

```sh
node tests/subduction-model.cjs
node tests/geography-analytics.cjs
```

`PLAYWRIGHT_MODULE` og `BROWSER_EXECUTABLE` kan angi en eksisterende installasjon. `SCREENSHOT_DIR` kan brukes for skjermbilder fra modelltesten. Testene sender ingen besøk til Cloudflare; den eksterne beacon-ressursen erstattes lokalt.

Modelltesten kontrollerer reversibel glider, økende platedyp, fjellvekst, oppoverrettede vannpiler, dype fokus inne i platen, forklaringer, visningsvalg, tilbakestilling, tastatur/fokus, avspilling/pause/slutt, stopp ved navigasjon, retur via samme hash, mørk modus og redusert bevegelse. Den undersøker breddene 320, 390, 600, 768, 1024 og 1440 px og bruker faktisk berøringsinndata i en mobil nettleserkontekst. Den sjekker også at intern navigasjon bare laster én analytics-instans, og at lokale ressurser og JavaScript er feilfrie.

Den eksisterende geografitesten dekker quizinnganger, gamle lenker, spillhandlinger, lokal lagring, navigasjon, mobilbredde og analytics-loaderen. Eksterne tjenester og faktiske mottak i Cloudflare-dashboardet inngår ikke i den lokale verifiseringen.
