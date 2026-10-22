# Slik oppstår en tsunami

Modellen ligger under **Geografi → Indre krefter og landformer → Tsunami**, etter Plategrenser og før Begrepsliste. Innbyggingen åpnes på `geografi.html#indre-tsunami`; den selvstendige siden er `geografi/tsunami.html`.

Brukeren leverte `tsunamiFullscreen02B.exe`, en eldre Flash-projektor med forskning.nos animasjon «Slik oppstår en tsunami», og bilder av trinnene. Den kjørbare filen er ikke kjørt eller lagt på nettstedet. Den innebygde SWF-filen ble lest som data og de opprinnelige vektorformene, skriftenes konturer, maskene, morph-bevegelsene og tidslinjene ble hentet ut. Kildekreditering til forskning.no står synlig i modulen. Verken Flash, Ruffle, eksterne skrifter eller ActionScript trengs i nettversjonen.

## Forløp og kontroller

De elleve trinnene følger originalen: verdenskart, Indiahavet, jordskjelv, platebevegelse, snittlinje, dreining til subduksjonssnitt, fastlåsing, brudd, bølgespredning, bølgevekst mot kysten og betydningen av «tsunami». Grafikkens opprinnelige farger og animasjonsrammer er bevart. Forrige, spill dette trinnet på nytt og neste har samme plassering og sirkeluttrykk som referansen.

Hvert valgt trinn starter ved begynnelsen og animeres i originalens 25 bilder per sekund. Hovedtidslinjen stopper ved forklaringen, mens blant annet skjelvringer, piler, magma og røyk fortsetter i nestede løkker. Pause stopper begge deler. Glideren spoler deterministisk i gjeldende trinn og setter animasjonen på pause. Trinn 1 er et stillbilde uten aktiv glider. Trinnvalg og lenker som `#trinn-8` gir direkte tilgang. Redusert bevegelse starter hvert trinn pauset; avspilling kan fortsatt startes eksplisitt.

Både bytte av nettleserfane og skjuling av modulen på geografisiden pauser avspillingen. Når Tsunami åpnes igjen i geografimenyen, starter den på trinn 1. Meldinger mellom nettsiden og modellen valideres med både origin og kildevindu. Fullskjerm er tilgjengelig for undervisning.

Figuren beholder originalens bildeformat 440:251, med en eksplisitt SVG-klippemaske rundt grafikken. Originalens øvrige knapper og tekst utenfor figuren gjengis ikke. Layouten tilpasses vindushøyde, tekstlengde og mobilskjerm uten å forvrenge figurene.

## Faglige oppdateringer

Fortellingen bygger fortsatt på jordskjelvet ved Sumatra i 2004. Forklaringen bruker momentmagnitude omtrent 9,1 og skiller mellom India-plata, Burma-mikroplata og Sunda-systemet. Mantelen omtales som hovedsakelig fast bergart. De opprinnelige etikettene «Mantelen (lava)» og «Økt trykk» er erstattet med «Mantel / hovedsakelig fast» og «Delvis smelting» ved magmasystemet.

Tsunamien forklares med havbunnens raske forskyvning av vannmassene. Farten er dybdeavhengig; tilbakegang av vannet før den første bølgen er ikke et universelt varsel. Bølgevekst ved grunt vann og flere bølger omtales. Originalens former beholdes som en skjematisk illustrasjon: tid, dybde, høyde og avstand er ikke i samme målestokk. Det brede oransje feltet er en fargekode for mantelen, ikke et hav av flytende lava.

Faglig bakgrunn lenkes til NOAA i modulens informasjonsfelt. Modellen er ikke et varslingssystem eller en numerisk simulering.

## Bygging og kontroll

Runtime-koden ligger i `assets/geography/tsunami/`: `reference-data.js` inneholder de inerte dataene, `reference-renderer.js` gjengir SVG, og `model.js` styrer fortelling, trinn og avspilling. Datafilen er omtrent 1,84 MB uten komprimering og 207 kB med gzip og lastes først når modellen åpnes i geografisiden.

For å gjenskape data fra den utpakkede, ukomprimerte originalfilen:

```sh
python3 scripts/extract-tsunami-reference.py /path/to/tsunami-reference.swf
```

Den brukertilførte `.exe`-filen er ikke en byggebetingelse og distribueres ikke. Uttrekkeren avviser andre inputformater enn ukomprimert FWS. Den kopierer ikke kjørbar ActionScript til nettstedet; bare eksplisitt valgte tidslinjemetadata beholdes.

```sh
BROWSER_EXECUTABLE=/usr/bin/chromium node tests/tsunami.cjs
node scripts/export-tsunami.cjs /tmp/Tsunami.html
```

Testene dekker alle elleve trinn, reversibel spoling, de faktiske klippene for ringer/piler/magma/røyk, vedvarende løkker på hold, avspilling/pause, fem skjermstørrelser, innbygging og gjenåpning. Enfil-eksporten testes separat med bare dokumentforespørselen og uten analytics eller andre ressurser. Nettleserkontrollene er kjørt i Chromium med emulert mobilvisning; fysisk mobil og Safari er ikke kontrollert.
