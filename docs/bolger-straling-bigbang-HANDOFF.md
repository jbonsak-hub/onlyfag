# Bølger og stråling – videre arbeid 16. november 2026

Utgangspunkt: main cb55d1bcc2009d8e91f7cf45ed660197ea4d92cd.
Siden skal bli under /prototyper/bolger-straling.html. Ikke flytt til ordinær naturfagside.

## Autoriserte endringer som skal fullføres

- Doppler: fjern den gule hjelpelinjen. Bølgefrontene brer seg for intenst utover og skal vises i et roligere tempo. Bevar sammenhengen mellom bølgeutbredelse og kildebevegelse (senk modellens tidsfart samlet fremfor å endre fysikken eller Mach-tallet). Bevar valg av flyhøyde/fart og lyd som er av ved start.
- Grunnstoffenes emisjonsspektre: krymp og tilpass oversikten slik at alle grunnstoffene og de sentrale kontrollene er synlige i ett skjermbilde uten scrolling.
- Universets utvikling: lag en tidslinje med glider fra et varmt, tett tidlig univers gjennom avkjøling; vis kvarker, protoner/nøytroner, kjerner, atomer, stjerner og galakser. Vis temperatur og tidspunkt. Ikke framstill Big Bang som en eksplosjon fra et sentrum ut i et ytre tomrom.
- Tre spor etter Big Bang skal ha hver sin pedagogiske animasjon:
  1. Rødforskyvning: gjenbruk eller videreutvikle galaksespredningen fra delen over; bind økende avstand og romutvidelse tydelig til lengre lysbølgelengder/observerte spektrallinjer.
  2. Bakgrunnsstråling: vis det kjente målte himmelkartet, med kilde og meningsfull tekst om fargene. Koble en interaktiv visualisering til universets utvikling, fra da det ble gjennomsiktig til dagens mikrobølgestråling.
  3. Grunnstoffordeling: vis omtrentlige andeler av hydrogen og helium med tydelig angitt mengdetype, og forklar visuelt koblingen til kjernedannelse i det tidlige universet. Skill opprinnelig fordeling fra tyngre stoffer som dannes senere i stjerner.
- Bevar separate animasjoner, lesbar figurhøyde, kontroller til høyre, luft mellom delene, begreper som liste og kompakte pauseknapper inni det grå figurområdet. Ingen ny toppstripe med fagstoff/oppgavebank/begreper.
- Kontroller visuelt før publisering; sjekk også at kontroller og animasjonsklokker virker.

## Berørte filer

prototyper/bolger-straling/cosmos-environment.js (nåværende universdel)
prototyper/bolger-straling/flight-doppler.js
prototyper/bolger-straling/element-spectra.js
prototyper/bolger-straling/app.js og nye selvstendige hjelpemoduler ved behov
prototyper/bolger-straling.html (cacheversjon)
tests/bolger-straling*.cjs (eksisterende relevante kontroller)

Følg CONTRACT.md. Bruk etterprøvbare primærkilder til kosmologi og ekte bakgrunnsstrålingskart. Sjekk at eventuelle nye kildefiler er koblet inn i siden og eventuelle sjekkskript. Ikke publiser lokale samtale-/gjenfinningsdata eller logger.

## Implementering klargjort i skyen

Alle punktene over er implementert i denne arbeidsgrenen. Nye hjelpemoduler: cosmology-timeline.js og bigbang-evidence.js. Tidligere ce-expansion/ce-epochs er erstattet; rødforskyvning ligger som eget spor.

Kontroll: de eksisterende revisjonskontrollene samt nye kosmologikontroller er kjørt som V8-JavaScript med prosjektets faktiske DOM-fixture og tilpasset modulinnlasting, siden lokal Node/Playwright ble utilgjengelig da PC-en ble slått av. Elleve kontrollgrupper bestod, inkludert at pauseknappen overlever full utskifting av SVG-innhold. Dette er kontroll av fysikk, kontroller og uavhengige klokker, ikke visuell nettleserkontroll.


## Kontroll og siste status

Elleve kontrollgrupper har bestått. De omfatter styring, fysikk, uavhengig pause, pauseknapp som tåler full SVG-opptegning, og at CMB-kartets bildeelement ikke byttes ut for hver ramme.

Publisert under /prototyper/bolger-straling.html. Cacheversjon app/cosmos/bigbang-evidence 20261116-bigbang3; øvrige nye hjelpemoduler 20261116-bigbang1.

Den andre nettlesersjekken bekreftet ny tidslinje og alle tre spor i DOM, samt at spekteroversikten med 118 grunnstoffer og valgte linjer fikk plass uten scrolling i det tilgjengelige vinduet (omtrent1173×786). Grunnstoffvalg og spektraldata ble kontrollert i nettleseren. Nettleserverktøyet leverte ikke faktiske skjermbilder og ga utilstrekkelig bekreftelse av enkelte animerte tilstander. Full visuell QA ved1366×768/1280×720 gjenstår; ikke presenter DOM-kontrollene som en fullstendig visuell godkjenning.

Planck-kartet bruker en ekte, kildeverifisert ESA WebP-bildefil med kreditering og lenke til originalen. Bildeelementet holdes nå stabilt mens resten av CMB-modellen animeres. Det eksterne bildet er ikke lagret lokalt; bytt eventuelt til lokal kopi senere når vanlig kjøremiljø er tilgjengelig.

Ingen videre brukeravklaring trengs for kravene her. Fortsett visuell kontroll og forbedringer når et fullverdig nettlesermiljø er tilgjengelig. Siden skal fortsatt bli under prototyper.
