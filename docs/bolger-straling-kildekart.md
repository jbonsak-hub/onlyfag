# Bølger og stråling – prototype

Plassering: `/prototyper/bolger-straling.html`. Behold siden under prototyper til Jack ber om flytting. Ingen lenke er lagt til på den ordinære naturfagsiden.

## Innhold

| Undertema | Fagstoff og modeller | Oppgaver |
| --- | --- | ---: |
| Bølger | Amplitude, frekvens, periode, bølgelengde, bølgefart; langs/tvers; stående bølger | 12 |
| Bølgefenomener | Refleksjon, absorpsjon, brytning, interferens, bøyning, resonans, dopplereffekt | 14 |
| Elektromagnetisk stråling | Spekter, fotonenergi, anvendelser, RGB | 12 |
| Stråling fra atomet | Energinivå, eksitasjon, emisjon/absorpsjon, hydrogenlinjer, nordlys | 12 |
| Stjerner og universet | Strålingskurve, temperatur, spektrallinjer, forskyvning, stjerneliv, Big Bang | 14 |
| Trådløs kommunikasjon | Sender/mottaker, binær informasjon, bærebølge, ASK/FSK, mobilnett | 12 |
| Radioaktivitet | Isotoper, henfall, reaksjoner, serier, halveringstid, C14 | 16 |
| Stråling og strålevern | Skjerming, feltavbøyning, dose, bakgrunn/radon, bruk, fisjon/fusjon | 17 |
| UV, ozon og klima | UV-typer, ozon, drivhus, albedo, energibalanse | 14 |

Totalt 123 oppgaver. Flervalg, tallkontroll og åpne forklaringer med veiledende svar. Oppgavevalg, egenvurdering, bokmerker og tekstutkast lagres lokalt. Flervalgsrekkefølge blandes deterministisk per oppgave. Modeller kjøres bare for aktivt tema, stopper i skjulte faner og tar hensyn til redusert bevegelse.

## Gjennomgåtte undervisningskilder

Alle 20 filer ble lest i fulltekst, inkludert fortsettelsen av PDF-samlingen på 40 sider. Oppgavetyper og faglig omfang er samlet, ikke duplisert.

1. Bølger og fenomener 1KDAA, 2425).pptx
2. Bølgefenomener, stasjonsundervisning.pptx
3. Bølger og stråling.pdf
4. Oppgaver til introduksjon til stråling.docx
5. Noen flervalgsoppgaver i bølger og stråling.docx
6. Radioaktivitet (1KDAA, 2025).pptx
7. Nedbrytningsserie.pptx
8. Oppgaveark - alfa, beta, gamma (2025).docx
9. Oppgaveark2, radioaktivitet.docx
10. Stafett Radioaktivitet.docx
11. Repetisjonsspørsmål, stråling og radioaktivitet.docx
12. Mulige åpneish oppgaver til radioaktivitet.docx
13. Stråling, verdensrommet (1KDAA, des24).pptx
14. Stråling3, UV, ozonlaget, drrivhuseffekten (nov18).pptx
15. Oppgaver til stråling fra atomet.docx
16. Oppgaver om universet.docx
17. Oppgave, forsøk og bruk av ioniserende stråling.docx
18. Radiation_Dose_Chart_by_Xkcd.png
19. Prøve i bølger, stråling og radioaktivitet (1KDAA, 2025).pdf
20. Prøve naturfag kap 4.1 - 4.5 (Anders).docx

Figurbegrensning: flere innebygde prøvefigurer og Word-formler er ikke tolkningsbare i tekstuttrekket. Sidemodus returnerte bildepekere, og forsøk på originalnedlasting feilet. Gamle bokstavfasiter er derfor ikke gjettet; nye selvstendige figurer og eksplisitte oppgaveverdier er laget. Dosekartet er brukt som tematisk innspill, ikke som kilde for OCR-tall.

## Faglige rettinger

- Ved brytning: frekvensen bevares; lavere fart gir kortere bølgelengde.
- Solnedgang forklares med bølgelengdeavhengig spredning, ikke bare absorpsjon av blått lys.
- Frekvens knyttes til energi per foton, ikke automatisk total intensitet. Mikrobølger inngår i radiobølgeområdet.
- Hvitt kan lages med RGB; det krever ikke alle synlige bølgelengder. Vannoverflatebølger er mer sammensatte enn den enkle tversmodellen.
- Balmer-eksempler bruker synlige 3→2, 4→2, 5→2 og 6→2; ikke alle overganger til nivå 2 er synlige.
- Temperatur bestemmer ikke stjernestørrelse alene. Universet blir gjennomsiktig når frie elektroner bindes til atomer; kvarker dannet ikke direkte atomkjerner etter tre minutter.
- UVA kan skade hud; UVB/UVC er ikke en presis universell grense mellom ikke-ioniserende og ioniserende. O₂ og O₃ bidrar til UV-skjerming.
- Alfa/beta/gamma sammenliknes med dose, sted og skjerming som kontekst; ingen kategorisk rangering av risiko eller betaenergi.
- Gamma dempes gradvis. Bly med null tykkelse virker som ingen skjerm. Halveringstid beskriver opprinnelige kjerner; henfallsproduktene forsvinner ikke.
- Pa-234m skilles fra Pa-234; gamma vises fra eksplisitt eksitert kjerne. Ba-137m-forsøk omtales ikke som betahenfall av stabilt Ba-137.
- 1 kg Th-234 med ca. 24 døgns halveringstid gir ca. 0,03 g etter ett år, ikke 30 g. Eldre doseterskler og daterte prognoser videreføres ikke.

## Vedlikehold og kontroll

Inngangssiden og `bolger-straling/app.js` eier navigasjon, animasjonsklokke og oppgavebank. De fire fagfilene eksporterer temaer med fagstoff, begreper, spørsmål, ressurser og monteringsfunksjoner. Ingen byggesteg eller tredjepartsbiblioteker kreves.

Kjør `node tests/bolger-straling.cjs --data-only` for dataintegritet og uavhengig kontroll av 24 regnesvar. Nettlesertesten kjører samme fil uten flagg, med `PLAYWRIGHT_MODULE` og eventuelt `BROWSER_EXECUTABLE`. Lokal nettleserstart var blokkert av Windows-miljøet ved opprettelsen; visuell test skal ikke rapporteres som bestått uten faktisk gjennomkjøring.

Etter publisering ble faktisk nettleserkontroll gjennomført på `https://onlyfag.no/prototyper/bolger-straling.html`: alle 27 kombinasjoner av tema/visning ble åpnet, samtlige fagstoff- og oppgavesider passet i 390 px bredde, og alle fagstoffsider passet i 320 px. Det ble kontrollert at modellvalg og glidere oppdaterer figurene, at riktige flervalgs- og desimalsvar gir tilbakemelding, og at mestring, bokmerker og tekstutkast overlever ny innlasting. Skipplenken bevarer valgt tema; mobilmeny åpner/lukker. Skjermbilder av hovedside, mobilside og refleksjonsmodell i mørk visning ble inspisert. Ingen JavaScript-feil ble registrert. Dette supplerer datatesten; den lokale Playwright-testen var fortsatt blokkert før nettleserstart.

Primærressurser: NASA om EM-spekter, stjerner og universet; DSA om stråling, dose og radon; WHO om UV; PhET for videre utforsking. Lenkene står under hvert tema.

## Kompakt visning og nye modeller, 14. november 2026

- Temasider har bare hovedtittel; de ekstra overskriftslinjene og ingressene er fjernet. Animasjonsfart og pauseknapp er fjernet etter ønske. Nettleserens preferanse for redusert bevegelse respekteres fortsatt.
- Diagrammer har kortere viewBox og strammere geometri, begrenset visningshøyde og samlede kontroller. Lange modellmerknader og det store kjernefeltet i halveringsmodellen ligger i åpne/lukke-felt. Temafaner følger med ved rulling.
- `wave-basics.js` eier bølgegrunnlaget. Begreper står i rader ved siden av formler, forklaring og regneeksempel. Modusvelgeren viser tversbølge, langsbølge, stående bølge, drevet/dempet huske, lyd fra membran til trommehinne og vannpartikkelbaner som avtar med dybden.
- `waves.js` eier bølgefenomener. Interferens har to uavhengige bølgelengder, startfase og tydelige enkeltbølger/sum. Med felles fart gir ulike bølgelengder ulike frekvenser og svevning. Bøyning har sammenhengende fronter med adskilte klippeområder ved spalten; figuren er en kvalitativ Huygens-modell.
- Nederst i atomtemaet finnes en modell av fotoionisering av hydrogen i grunntilstanden. Velg fotonenergi og send fotonet. Ionisering krever minst 13,6 eV; overskuddet vises som kinetisk energi. Andre eksitasjons-/spredningsprosesser og absorpsjonssannsynlighet er avgrenset eksplisitt.
- De opprinnelige 123 oppgavene og identitetene deres er beholdt. Datatesten kontrollerer også bølgesummer, bøyningsgeometri, alle seks bølgemoduser og ioniseringsterskelen.

Publisert kompaktversjon er kontrollert i nettleser. Ved 1366 × 768 ligger hele første bølgemodell innenfor skjermen (bunn ca. 741 px), med alle tre glidere innenfor 666 px. Alle modellrammer er kontrollert ved 900 × 650 (maksimal høyde ca. 471 px), og alle ni fagstoffsider uten horisontal overflyt ved 390 px. Alle seks bølgemoduser, interferensforvalgene og endring av bølgelengde er kjørt. Fotoionisering viser bundet elektron ved 2 eV og H⁺/fritt elektron ved 30 eV; datatesten kontrollerer også nøyaktig terskel. Ingen JavaScript-feil ble registrert. Ny visuell kontroll av bølgegrunnlag, interferens, bøyning, lyd og ionisering er utført.
