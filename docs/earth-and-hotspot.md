# Jordas lag og hotspot-vulkanisme

Jordfiguren ligger ved siden av «1. Jordas oppbygning» i `geografi.html#indre-fagstoff`. Den er et eget, interaktivt SVG-utsnitt. Informasjonsfeltet «Valgt lag i figuren» ligger nederst i venstre kolonne, under beskrivelsesboksen. På mobil ligger feltet rett under figuren. Pek, trykk eller fokuser et lag for å lese den korte forklaringen. Tab flytter mellom lagene; piltaster, Home og End kan også brukes. På smale skjermer stables tekst og figur.

Figuren skiller jordskorpe, øvre og nedre mantel, ytre og indre kjerne. Egne markører viser litosfære og astenosfære, som er en inndeling etter mekaniske egenskaper. Mantelen og astenosfæren er hovedsakelig faste. Dybdene 660, 2 890, 5 150 og 6 371 km er omtrentlige. De ytterste lagene er tegnet tykkere for lesbarhet. Temperaturer er utelatt. Fagkilder ligger i figurens foldbare kildefelt; CSS og JavaScript ligger i `assets/geography/earth-layers/`.

Hotspotmodellen ligger i `prototyper/hotspot.html`, med inngang fra prototypeoversikten og **Indre krefter og landformer → Hotspot-vulkanisme**, rett under Plategrenser i geografimenyen. Menyvalget viser prototypen i en iframe på `geografi.html#indre-hotspot`. Selve figuren og tidskontrollene skal passe i vinduet, mens utfyllende informasjon kan rulles i sidepanelet. Innbyggingen lastes ved første åpning, deler geografisidens tema og sender synlighet til modellen. Meldinger validerer både avsenderens origin og vindu.

Punkt 4, «Platetektonikk», fyller hele bredden av fagstoffet med to tekstspalter på større skjermer og én på mobil. Hotspotmodellen har en kompakt topp uten slagordet. Lenken «Hawaii (se på kart)» åpner det samme plategrensekartet som de andre stedseksemplene, sentrert på 22° N, 158,5° V med zoom 6, etter brukerens referansebilde.

Glideren viser et skjematisk utviklingsforløp med Stillehavsplata i bevegelse mot nordvest over et relativt stasjonært varmepunkt. En oppstrømming av varmt, hovedsakelig fast mantelmateriale gir delvis smelting nær toppen. Det er ikke en sammenhengende søyle av magma fra dyp mantel. Nye vulkaner vokser fra havbunnen; eldre vulkaner følger plata bort fra varmepunktet. Én kort forklaring følger forløpet. Tilbakespoling er et pedagogisk verktøy, ikke en prosess som skjer i naturen.

Tid, avstander, øyformer, vekst og erosjon er forenklet. Øyene består av flere vulkaner med overlappende aktivitet. De oppgitte aldersintervallene gjelder omtrentlige lavastrømmer fra hovedoppbyggingen, ikke siste utbrudd. Maui omtales derfor ikke som utdødd. Ingen framtidig øy eller dato er forutsagt.

Hovedkilder: [USGS – hotspot](https://www.usgs.gov/faqs/what-a-hotspot-and-how-do-you-know-its-there), [USGS – Hawaiian volcano evolution](https://www.usgs.gov/observatories/hvo/evolution-hawaiian-volcanoes), [USGS – Hawaii og øyalder](https://pubs.usgs.gov/gip/hawaii/page12.html), [USGS – fast mantel](https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma) og [BGS – jordas oppbygning](https://www.bgs.ac.uk/discovering-geology/earth-hazards/earthquakes/what-causes-earthquakes/).

## Kontroll

`BROWSER_EXECUTABLE=/usr/bin/chromium node tests/earth-hotspot.cjs` starter en lokal HTTP-server og blokkerer eksterne forespørsler. Testen kontrollerer interaksjon med alle jordlag, platebevegelse over et fast varmepunkt, vekst og tilbakespoling, avspilling, tastatur, tema, mobilpanel og navigasjon. Både selvstendig og innbygd hotspotmodell kontrolleres uten siderulling i fem skjermstørrelser fra 360 × 640 til 1366 × 646, inkludert kort landskap. `EARTH_HOTSPOT_SCREENSHOTS` kan settes til en mappe for skjermbilder. Fysisk mobil og Safari er ikke testet.
