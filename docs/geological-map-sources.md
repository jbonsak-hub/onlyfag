# Berggrunn og løsmasser i Norge

Kartet ligger under **Indre krefter** i `geografi.html`, med egen side
`geografi/geologiske-kart.html`. Faglagene er lagret på OnlyFag, uavhengig av
NGUs kartservere. Lagene tegnes i **EPSG:25833** over samme koordinatsystem som
kartkameraet. Ingen bergartsgrenser eller løsmassetyper er beregnet fra terreng,
et kartbilde eller en språkmodell.

## Landsdekkende oversikter

Hentet fra offentlige, spørrbare NGU-speil hos Geodata 1. november 2026:

| Lag | Målestokk | Flater | Uttaksdato i data | Offentlig speil |
| --- | --- | ---: | --- | --- |
| Berggrunn N1350 | 1:1 350 000 | 4 637 | 12. januar 2026 | [BergartFlate_N1350](https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/Geologi_0000_Norge_25833_BerggrunnN1350_SHAPE/FeatureServer/3) |
| Løsmasser N1000 | 1:1 000 000 | 16 507 | 20. januar 2026 | [LosmFlate_N1000](https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/L%C3%B8smasser_Norge/FeatureServer/2) |

Speilenes to katalogkart er
[Bergarter og bergstrukturer i Norge](https://www.arcgis.com/home/item.html?id=867108889a514b8db505cd08471de183)
og [Løsmasser i Norge](https://www.arcgis.com/home/item.html?id=26508bc8b27040159de512d476bfd0a1).
Metadata med lisensvilkår er arkivert under
`assets/geography/geology/sources/`. Oppgitt lisens er NLOD. Kartets kilder viser
NGUs påkrevde kreditering:

> Inneholder data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort
> av Norges geologiske undersøkelse (NGU).

Alle sider ble hentet med `where=1=1`, `outFields=*`, `outSR=25833`,
`orderByFields=FID ASC`, `resultRecordCount=1000` og stigende `resultOffset`.
Det ble ikke brukt generalisering i spørringen. Antall og unike kilde-ID-er ble
kontrollert mot tjenestens `returnCountOnly`.

`sources/build-overviews.py` reparerer ugyldige kildepolygoner ved behov og
forenkler dem med 100 meter toleranse og bevart topologi. Avrunding er 0,1 meter.
Dette ga to reparasjoner for berggrunn og 49 for løsmasser; ingen flater ble
tomme eller fjernet. Innvendige ringer beholdes. Originalgeometrien og alle
attributter ligger i arbeidsartefaktene; nettversjonen beholder kilde-ID,
hovedkategori, beskrivelse, nominell målestokk og kildeuttaksdato.

Oversiktene leveres som deterministiske gzip-filer. Manifestet skiller mellom
komprimerte og ukomprimerte størrelser og SHA-256. Bare det valgte faglaget
trenger å lastes. N1000 er et generalisert landsdekkende kart og skal ikke
omtales som et detaljert, lokalt løsmassekart.

## Mer detaljert berggrunn

Offentlige speil hos Placepoint gir NGUs berggrunn i
[N250](https://services5.arcgis.com/G7Y9uUZA3azviLFK/arcgis/rest/services/Bergartflate_N250/FeatureServer/5)
og [N50](https://services5.arcgis.com/G7Y9uUZA3azviLFK/arcgis/rest/services/Berggrunn_N50/FeatureServer/5).
N250 inneholder 30 903 flater. N50 inneholder 101 143 flater og har ufullstendig
geografisk dekning. N250 skal tegnes under N50, med oversiktskartet under begge.
Et tomt område i N50 er ikke dokumentasjon på at en bestemt bergart mangler.

Disse spørringene bruker `outSR=25833`, `outFields=*`, sortert `OBJECTID`,
fullstendig paginering og 20 meter `maxAllowableOffset`. Råresponser, sidevise
antall og kontrollsummer oppbevares i `artifacts/geology` i arbeidsområdet.
Detaljflisene er lokale; fullstendig prosessering og størrelser er registrert
i detaljmanifestet. Uttaksdato fra hver kildeflate beholdes. En eldre kilde blir
ikke datert på nytt fordi den ble lastet ned i 2026.

Samlet N250 og N50 består av 132 046 kildeflater, fordelt på 322 lokale
gzip-fliser i et 50 km rutenett. Begge kildenes flater er beholdt; 902 ugyldige
kildegeometrier er reparert. Samlet komprimert størrelse er 25 547 883 byte,
med maksimalt 520 621 byte per flis. `scripts/build-bedrock-detail.py --download
--include-n250` henter og bygger begge kildene; `--check` kontrollerer lokale
filers størrelse, hash og alle kilde-ID-er uten nettilgang.

## Begrenset detaljuttrekk for løsmasser

Et offentlig [løsmassedeluttrekk hos Statens vegvesen](https://www.arcgis.com/home/item.html?id=6772578bd7ed493fb0b70e57f73b35d6)
supplerer den landsdekkende N1000-oversikten ved innzooming. Det opprinnelige
laget er
[Losmasse_KunRiksveg_Dissolve/0](https://services-eu1.arcgis.com/Omqj1DhF7kfdN8lE/arcgis/rest/services/Losmasse_KunRiksveg_Dissolve/FeatureServer/0).
Eierens organisasjon er kontrollert gjennom offentlig portalmetadata:
**Statens vegvesen – ArcGIS Online**, organisasjons-ID `Omqj1DhF7kfdN8lE`.

Laget består av 45 oppløste løsmassetypekategorier og dekker omtrent
112 500 km². Geometrien er ekte NGU-data, ikke en interpolasjon utenfor det
publiserte utvalget. Lagets navn viser til riksveg, mens katalogteksten sier
«Løsmasseflate, NGU 07.12.2021. Flater innefor 250m fra registrert kvikkleire.»
Katalogen er dermed ikke entydig om hvordan utvalget ble laget. Nettkartet
omtaler det som **«Begrenset detaljuttrekk (SVV)»**, uten å love en bestemt
utvalgssone, nasjonal detaljdekning eller nominell målestokk. Geometriens flater
inneholder ingen uttaksdato eller kartmålestokk, og katalogens endringsdato
9. februar 2023 brukes ikke som en oppdiktet kartleggingsdato.

Også dette laget lagres som lokale, utsnittslastede gzip-fliser i EPSG:25833.
Den generaliserte nasjonale oversikten beholdes under detaljuttrekket.
Tegnforklaringen og informasjon ved klikk oppgir forskjellen på oversikt og
deluttrekk. Se `scripts/build-superficial-detail.py` og detaljlagets indeks for
råspørring, prosessering, bevarte kategori-ID-er, filstørrelser og kontrollsummer.
Alle 45 kildeobjekter er bevart i 173 fliser, samlet 10 687 531 komprimerte byte.
29 ugyldige kildegeometrier er reparert. Spørringen generaliserer ved 20 meter;
flisbyggingen klipper deretter til 50 km-rutenettet og avrunder til én meter.

SVV-katalogpostens `licenseInfo` og `accessInformation` er tomme. Posten
utsteder derfor ikke et separat dokumentert NLOD-samtykke. NLOD-belegget som
er arkivert for kartet gjelder NGUs opprinnelige geologiske informasjon, med
de nevnte Geodata/NGU-katalogenes eksplisitte lisensopplysninger. Krediteringen
oppgir både NGU som dataopphav og Statens vegvesen som utgiver av deluttrekket;
en tom lisensrubrikk blir ikke omskrevet til en ny lisens eller en bestemt
lisensversjon.

## Klassifikasjon og farger

Berggrunnens hovedkategori er NGUs `hovedbergart`/`hovedberg`. Navnene kommer
fra kildens kodetabell, og fargene kommer fra N50-tjenestens faktiske
`drawingInfo.renderer.uniqueValueInfos`. Den samme koden har samme farge i
oversikt og detalj. Den mer presise kildebeskrivelsen `tegnforklaring` vises
ved valg av flaten.

Kildens N50-data bruker også kodene 417 og 436, som mangler både i kodetabellen
og tegnereglene til N50 og N250. Disse får en nøytral gråfarge og teksten
«Uklassifisert kode 417/436», med originalbeskrivelsen beholdt. Bergart og
kartfarge er ikke gjettet.

Løsmasseoversikten bruker `jordart` med tegnereglene fra
SVVs offentlige lag «Løsmasser aggregert/forenklet». Den arkiverte
`svv-sediments.json` dokumenterer tegneregler og NGUs kodetabell. Flere
N1000-tekstverdier har tegnfeil, blant annet «ldsmassedekke» og «bresjs». De
viste kategorinavnene følger den numeriske NGU-koden og den intakte kodetabellen.
Farger med positiv kilde-dekkevne normaliseres til full dekkevne før brukerens
egen synlighetsinnstilling brukes. Kildens null-dekkevne beholdes: de 3 871
N1000-flatene for kode 140 (bart fjell/tynt løsmassedekke) viser faglaget under,
eller bakgrunnen når bare løsmasser er valgt. At RGB-komponenten er grønn,
gjør ikke kildens fullt gjennomsiktige klasse til en ugjennomsiktig grønn flate.

For det begrensede løsmasseuttrekket beholdes de 26 faktisk oppgitte
SVV-tegnereglene. Ytterligere 19 kategorier bruker eksisterende tegneregler
fra Geodatas tilsvarende NGU-løsmasselag; proveniensen er registrert per
kategori. RGB-farger og skraveringsfarger er kildeverdier, ikke konstruerte
løsmassetyper. Under-vann-kategorien beholder kildens null dekkevne og
viser bakgrunnen. Skraverte kategorier beholder mønster og strekfarge i både
kart og tegnforklaring. Vanlig delvis gjennomsiktighet i en eldre tjeneste
normaliseres før brukerens glidebryter, slik at synlighet kan justeres én gang.

## Tilgjengelighet og bakgrunn

De anvendte ArcGIS-kildene svarte med HTTP 200 og `Access-Control-Allow-Origin: *`
ved kontrollen. Direkte NGU-vertsnavn var ikke åpnet i utviklingsmiljøets
nettverkspolicy; det er ikke en måling av NGUs oppetid. Kjøretidsvisningen
av faglagene sender ingen forespørsler til NGU eller disse datakildene.
Bakgrunnene bruker den delte kartmodulen med Kartverket-kart, Esri-relieff og
lokal reserve. Bakgrunnens synlighet og hvert faglags synlighet styres hver
for seg, slik at grenser og terreng kan sammenlignes.

## Kontroll av visningen

- `node tests/geology-map.cjs`: ekte NGU-filer, uavhengige UTM-referanser,
  kartklikk, farger, skravering, gjennomsiktige kildeklasser, hver glidebryter,
  lokal lasting og gjenoppretting etter filfeil på PC og mobil.
- `node tests/geology-integration.cjs`: fagmeny, direkte lenke, mobilmeny,
  tegnforklaring, tema og bytte mellom geologikartet og marin grense.
- `tests/bedrock-detail-data.py` og detaljbyggernes `--check`: geometri,
  kilde-ID-er, flisgrenser, filstørrelser og kontrollsummer.

Bakgrunnsregistreringen og faktiske JPEG-svar fra Esri er kontrollert separat
i marinkartets og Oslo-quizens nettlesertester. Kartverket-feil blir vist og
utløser en navngitt relieffreserve.
