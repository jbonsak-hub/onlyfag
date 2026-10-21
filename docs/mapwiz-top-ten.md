# MapWiz topp 10

MapWiz har nå global topp 10 på startsiden og sluttskjermen. Bare fullførte runder med ti spørsmål kan lagres. Brukeren velger selv om resultatet skal publiseres, og oppgir et kallenavn. Poeng sorteres synkende, deretter total rundetid stigende. Kallenavnvinduet åpnes automatisk når resultatet kvalifiserer. Norsk og engelsk deler liste. Hvert kategorivalg har en egen liste, slik at for eksempel bare Norge ikke sammenlignes med alle kategorier.

Lokale resultater ligger fortsatt i `geoHighscoresV1`, under `mapwiz3|<sorterte kategorier>`-nøkler. Eldre lister bevares og lastes aldri opp. Lenken til lokale lister er fjernet fra grensesnittet. Nettrunder kontrolleres av Cloudflare-API-et, og bare resultater brukeren velger å publisere får et offentlig kallenavn. Det sendes ingen resultater eller kallenavn til analytics.

## Den globale listen

GitHub Pages leverer statiske filer. En felles liste krever en separat tjeneste som kan ta imot og lagre resultater. Cloudflare Web Analytics er ikke en slik tjeneste.

Et passende oppsett er en Cloudflare Worker med en D1-database, uten å flytte selve nettstedet fra GitHub Pages. Worker kan ligge på et eget API-domene eller en workers.dev-adresse. Nettleseren får bare tilgang til offentlige endepunkter, aldri Cloudflare API-nøkler.

Det er ikke nødvendig med et nytt domene eller en betalt plan for å starte. Workers og D1 har gratisnivå; faktisk trafikk avgjør om grensene senere krever en oppgradering. Se [Workers-priser](https://developers.cloudflare.com/workers/platform/pricing/) og [D1-priser](https://developers.cloudflare.com/d1/platform/pricing/). Cloudflare-innlogging eller en begrenset utrullingstilgang kan gis når tjenesten skal opprettes; passord og hemmelige nøkler skal ikke legges i GitHub eller spillfilene.

API-et kan gjenbrukes for resultatlister i de øvrige geografiquizene. Hvert spill må ha egne regler for serverkontroll og rangering. Mobil med svaralternativer bør være en egen spillvariant ved eventuell rangering mot skriveversjonen på datamaskin.

Oppsettet omfatter:

- Tilgang til riktig Cloudflare-konto med rettigheter til å opprette/publisere en Worker og en separat D1-database.
- En D1-binding til Worker og API-adresse, med tillatte nettsted-opprinnelser.
- En fast konkurranseregel: kategorivalg, kartvariant og regelversjon lagres sammen med resultatet. Nåværende lokale oppdeling kan gjenbrukes.
- Serveropprettede runder og serverberegning av poeng og tidsbonus. Nettleseren sender rundens klikk til spill-API-et; klientberegnede poeng alene er enkle å forfalske. Et slikt enkelt spill blir fortsatt ikke fullstendig beskyttet mot kartroboter eller oppslag.
- Innsendingsgrenser og eventuelt Turnstile mot spam; dette erstatter ikke kontroll av selve poengene.
- Regler for kallenavn, sletting, moderering og lagringstid. Bruk kallenavn fremfor elevnavn. Kartklikk brukes bare til kontroll av spillresultatet, aldri i analytics. Unngå unødvendig langtidslagring av klikk og nettverksidentifikatorer.

Worker og D1-databasen `onlyfag-geography-scores` er opprettet separat fra andre systemer. Prøvesystemet og analytics er uendret. Detaljer om spill, regler, lagring, drift og begrensninger finnes i [servicebeskrivelsen](../services/geography-scores/README.md).

Offisiell dokumentasjon: [D1 og Worker-binding](https://developers.cloudflare.com/d1/get-started/), [Turnstile-validering på server](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
