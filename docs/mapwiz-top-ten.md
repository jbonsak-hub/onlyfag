# MapWiz topp 10

Den nye MapWiz-versjonen har lokal topp 10 på startsiden og sluttskjermen. Bare fullførte runder med ti spørsmål kan lagres. Brukeren velger selv om resultatet skal lagres, og oppgir et kallenavn. Poeng sorteres synkende, deretter total rundetid stigende. Hvert kategorivalg har en egen liste, slik at for eksempel bare Norge ikke sammenlignes med alle kategorier.

Resultatene lagres i den eksisterende `geoHighscoresV1`-lagringen, under nye `mapwiz3|<sorterte kategorier>`-nøkler. Eldre lister bevares. De blandes ikke med den nye varianten fordi utvalg og spilleregler er endret. Det sendes ingen resultater eller kallenavn til analytics eller noen server.

## En global liste

GitHub Pages leverer statiske filer. En felles liste krever en separat tjeneste som kan ta imot og lagre resultater. Cloudflare Web Analytics er ikke en slik tjeneste.

Et passende oppsett er en Cloudflare Worker med en D1-database, uten å flytte selve nettstedet fra GitHub Pages. Worker kan ligge på et eget API-domene eller en workers.dev-adresse. Nettleseren får bare tilgang til offentlige endepunkter, aldri Cloudflare API-nøkler.

Det som må konfigureres før en global liste kan aktiveres:

- Tilgang til riktig Cloudflare-konto med rettigheter til å opprette/publisere en Worker og en separat D1-database.
- En D1-binding til Worker og API-adresse, med tillatte nettsted-opprinnelser.
- En fast konkurranseregel: kategorivalg, kartvariant og regelversjon lagres sammen med resultatet. Nåværende lokale oppdeling kan gjenbrukes.
- Serveropprettede runder og serverberegning av poeng og tidsbonus. Nettleseren sender rundens klikk til spill-API-et; klientberegnede poeng alene er enkle å forfalske. Et slikt enkelt spill blir fortsatt ikke fullstendig beskyttet mot kartroboter eller oppslag.
- Innsendingsgrenser og eventuelt Turnstile mot spam; dette erstatter ikke kontroll av selve poengene.
- Regler for kallenavn, sletting, moderering og lagringstid. Bruk kallenavn fremfor elevnavn. Kartklikk brukes bare til kontroll av spillresultatet, aldri i analytics. Unngå unødvendig langtidslagring av klikk og nettverksidentifikatorer.

Denne endringen oppretter ingen skytjenester og endrer ikke prøvesystemet eller analytics.

Offisiell dokumentasjon: [D1 og Worker-binding](https://developers.cloudflare.com/d1/get-started/), [Turnstile-validering på server](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
