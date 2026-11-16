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

## Korrigering: lesbare figurer med kontroller til høyre

Jack ønsket tydelige diagrammer nærmere den første versjonen, med litt mindre horisontal bredde og betjening i den frigjorte plassen. Den lave høydebegrensningen fra kompaktversjonen brukes derfor ikke lenger på modellfigurene. `arrangeModels` i app.js samler figurer til venstre og eksisterende kontroller/avlesninger i en høyrekolonne, uten å bytte ut elementene eller deres hendelser. Ved smalere visning legges kontrollene under for å bevare lesbar figur.

Bølgegrunnlaget er igjen inndelt i egne deler for bølgeegenskaper, tvers/langs, stående bølger og resonans. Bare tvers- og langsbølge deler en velger med to knapper. Lyd og vann er hvert sitt åpne/lukke-eksempel under bølgetypene, med egne figurer og uavhengige kontroller. Stående bølge og huske har hver sin figur. Alle 123 oppgaveidentiteter og eksisterende faglige forbedringer, inkludert ionisering og to justerbare interferensbølgelengder, er beholdt.

Kontrollert etter publisering: figuren og kontrollkolonnen ligger side om side i alle ni undertemaer på desktop, og kontrollene fungerer etter flyttingen. Lyd og vann kan åpnes uavhengig uten å bytte den opprinnelige bølgetypen. Antall buker styres i egen stående-bølgefigur. Ved 390 px legges betjening under, uten horisontal overflyt. Ingen JavaScript-feil er registrert. Datatesten kontrollerer de separate modellene, de 123 oppgavene, de 24 regnesvarene og ioniseringsterskelen.


## Visuell og faglig omarbeiding, 14. november 2026

Denne revisjonen erstatter modellvalgene og størrelsesbegrensningene beskrevet i de to foregående historiske avsnittene. Begrepene står som lister, seksjonslenkene øverst og neste-undertema-boksene er fjernet. Regnesvarene presenteres med brøkstreker og likhetstegn under hverandre gjennom en egen presentasjonsmodul; oppgavenes verdier og identiteter er beholdt.

- Bølgegrunnlaget har amplitude, uavhengig bølgelengde og bølgefart. Frekvensen avledes som v/λ. Endring av fart endrer faseutviklingen, ikke bølgelengden. Lyd og vann er fortsatt egne eksempler under tvers/langs. Resonans ligger bare under bølgefenomener.
- Bølgefenomener viser fast bølgelengde og justerbar fase for konstruktiv/destruktiv interferens, et sammenhengende bølgefelt bak en spalte, en drevet huske og Dopplereffekt med ambulanse og personer. Regnbue og prisme er selvstendige Snell-baserte illustrasjoner; originale PhET-bilder eller animasjoner er ikke kopiert.
- EM-spekteret oppgir egnede prefikser og standardform; fotonenergi i joule. Formeloversikten har større regneeksempel. RGB-figuren er ikke beskåret. Trådløs kommunikasjon har figurer for signalvei og nettverk/radioveier.
- atom-lab.js knytter atom og energinivådiagram sammen. Overganger mellom n=1–6 viser absorpsjon/emisjon og UV/synlig/IR. Eksitasjon med ett foton krever passende energi. Én atoms kaskade skilles eksplisitt fra alle mulige linjer for mange atomer.
- Stjernetemaet starter med absolutt Planck-spekter Mλ=πBλ, termisk effekt σT⁴ og automatisk tilpassing av begge akser. Kurven er ikke normalisert; aksenes tall endres. Visuelt glødelys bruker en fast komprimering av lysstyrkeområdet.
- isotope-data.js inneholder et avgrenset, kildebelagt utvalg med 44 stabile og 7 radioaktive nuklider. Ukjente kombinasjoner klassifiseres ikke som stabile. Henfallsknappen følger foretrukket gren til datter, og radioaktive kjerner rister skjematisk. Eget nuklidekart og PhETs dateringsspill er lenket.

De nye modellene er opprinnelige SVG-/canvas-illustrasjoner med oppgitte forenklinger. Atomfiguren viser energinivåmarkører, ikke klassiske elektronbaner. Risting er en visuell markør for radioaktivitet og angir ikke et forvarsel om fysisk henfall.


Kontroll i faktisk nettleser: alle ni fagstoffsider ved 1366 × 768 og alle 27 tema/visning-kombinasjoner ved 390 px er åpnet uten JavaScript-feil eller vannrett side-overflyt. Det er kontrollert at fart beholder bølgelengden, at lysmodellene viser hele figuren, at temperaturpreseter tilpasser aksene, at ett-atom/mange-atomer-modus gir forskjellige forløp, at feil fotonenergi ikke eksiterer, og at C-14-knappen gir stabilt N-14. Bøyning ved to yttertilfeller, destruktiv interferens, huskas oppbygging av utslag, ambulansemottakere, regnbue/prisme og kommunikasjonsvalg er inspisert visuelt. Etter denne runden ble noen tettstilte etiketter og grønne avlesninger ryddet opp; bølgeeksempelet kan åpnes for å bevare kompakt førsteside, og nuklidesymbolet følger kjernefiguren.


## Layout, lokale pauser og optikk, 15. november 2026

Denne revisjonen følger nye ønsker om en liten pauseknapp per animasjon. animation-clock.js gir hver modell egen lokal tid. Pause, gjenopptak, parameterendringer under pause og hendelsesstart bruker samme lokale klokke, slik at ingen modell hopper frem når den fortsetter. Statiske refleksjons-, absorpsjons-, brytnings- og RGB-figurer har ingen meningsløs pauseknapp. Lukkede detaljfelt/dialoger og skjulte faner stanser tidsutviklingen.

- Toppfanene er fjernet; venstremenyen eier visningsvalgene. Delene har større avstand. Bølgeegenskaper har fem adskilte definisjonsrader, to sentrerte formler og et regneeksempel med to kolonner. Duplisert mekanisk/EM-forklaring står nå først i EM-temaet. Etterspurte modellmerknader er fjernet.
- Spektrumbåndet fyller hele modellbredden. Under ligger bølge og avlesninger til venstre, betjening til høyre. RGB er tegnet om til en lav, bred figur med alle sirklene synlige. Atomlabens tilleggsforklaringer ligger utenfor selve animasjonsrammen.
- Huskeillustrasjonen bruker samme kontaktpunkt og kontaktstatus som kraftberegningen. Armen består av to deler med begrenset rekkevidde. Kontaktavlesningen oppdateres umiddelbart sammen med hånden og teksten i figuren.
- Brytning bruker valg av mediepar og retning, uten synlige brytningsindekser. Totalrefleksjon vises bare fra vann/glass mot luft, med vinkel opp til 90 grader. Fysikken tillater ikke totalrefleksjon i motsatt retning.
- Prisme og regnbue åpnes som ett modalvindu med én figur om gangen. Hele hovedregnbuen og sekundærregnbuen vises med riktig omvendt fargerekkefølge; én/to reflekterende strålevei og omtrentlige vinkler 40–42°/51–54° kan sammenlignes.
- Doppler beregner mottatt frekvens fra det forsinkede utsendelsespunktet. Sirenen og kildefarten er konstante; hastighetskomponenten mot mottakeren endres når kilden passerer. Lydens reisetid tas med.

Regresjoner: tests/bolger-straling.cjs --data-only og tests/bolger-straling-clock.cjs kontrollerer de 123 oppgave-ID-ene, 24 regnesvarene, selvstendige klokker, armrekkevidde, brytningsgrenser, forsinket Doppler og begge regnbuene. Faktisk nettleserkontroll brukes i tillegg for størrelse, lesbarhet, overlapping, modalvalg og kontrollplassering.

Faktisk visuell kontroll i denne revisjonen: alle ni fagstoffsider er åpnet ved 1366 × 650 og 390 px bredde uten JavaScript-feil eller vannrett side-overflyt. Pause av bølgefiguren er kontrollert mens partikkelfiguren fortsetter. Regneeksemplets to kolonner, komplett RGB (ca. 250 px høy modell), spekterets fulle innholdsbredde, eksitasjonsrammen (ca. 520 px), huskas håndkontakt, retning/totalrefleksjon og modalens primære/sekundære regnbue er inspisert. Diagrametiketter som overlappet kurver, er flyttet. Dialogen kan åpnes, bytte visning og lukkes på mobil.


## Fly, optikk og atomlaboratorium, 16. november 2026

Bølgefenomenene er delt i selvstendige implementasjoner med samme oppgavebank. flight-doppler.js bruker et fly over én mottaker, høyde 20–300 m og fart 0,05–1,00Mach. Retardert utsendelsestid og endelig kildehistorikk håndterer også nøyaktig Mach 1. Valgfri motorlyd er av ved start; WebAudio-stemmen bruker samme mottatte grunntone som figuren og stanser ved pause, skjult fane og navigasjon. Avspillingsområdet dempes uten å endre den fysiske frekvensavlesningen.

- diffraction-lab.js summerer koherent over én eller to åpninger. Åpningsbredde, bølgelengde og avstand mellom to åpninger gir bøyning og interferens i samme felt.
- resonance-swing.js bruker en sammenhengende armstilling med to armsegmenter; håndens kontaktpunkt følger huska uten tidligere posisjonshopp. En valgfri, tydelig merket tegnefilmbonus gir et overdrevet superdytt etter 8 s riktig rytme, med videre ballistisk flukt. Den ordinære pendelmodellen kan brukes med bonusen avslått.
- refraction-lab.js har uavhengige medievelgere i figurens to områder, vinkel 10–80°, bølgelengde 380–780 nm og hvitt lys. Snell og upolariserte Fresnel-effektandeler gir retning/reflektert/transmittert effekt; like medier gir ingen påvirkning. Den lille reelle fargespredningen ved én grenseflate har et tydelig merket forstørret utsnitt.
- refraction-examples.js viser strandbølger over dybdegradient og en lekebil med ett hjul som først bremses på teppet. Begge bruker sammenhengende beregnet dreining, ikke en vilkårlig tegnet rotasjon.
- Bohr-delen bruker faste hydrogennivåer i aJ, flyttbare nivåvelgere, eksitasjon/emisjon og hydrogenspekter. Modellatomene har flyttbare energier og en vedvarende fotonstrøm gjennom gjentatte kaskader. Like energiforskjeller kan gi overlappende linjer; mange atomer trengs for alle mulige veier. Presetet hydrogen bruker reelle Bohr-energiforskjeller; når nivåene endres, merkes det som tilpasset atom. Atom A/B er eksplisitt oppdiktede modeller.
- element-spectra-data.js bygger på alle 99 NIST Handbook-tabeller, med 3635 sterke synlige linjer fordelt på 93 nøytrale og 80 enkelt ioniserte grunnstoffspektre. element-spectra.js viser alle 118 grunnstoffene, men fabrikkerer ikke data for tomme/manglende tabeller. Stadiene I/II holdes atskilt, kilder lenkes per grunnstoff, og linjene er et begrenset utvalg (maks 48 per stadium).
- Sammenhengene introduseres med navn før symbolene. Synlig elektronvolt er fjernet fra fagstoff, begreper og oppgaver; atom-05 bruker nå −0,24→−0,54 aJ med svar 0,30 aJ. Stjernekurven har større høyde i samme ramme og tydeligere UV/synlig/IR-områder.

Regresjonene i bolger-straling.cjs, bolger-straling-revision.cjs og bolger-straling-clock.cjs kontrollerer oppgaveidentiteter, omregnede regnesvar, pauser, Mach1-grensen og lydens faktiske frekvensparameter, effektbevaring og like medier, dobbeltspalte, sammenhengende arm/bonus, atomnivåer og draghendelser samt NIST-referanselinjer. Lokal Edge-start er blokkert i dette miljøet; faktisk nettleserkontroll må derfor gjennomføres separat på publisert side, og lyd er foreløpig kontrollert med en AudioContext-modell fremfor lytting.
