# Google Earth-lag for indre krefter

De fire brukertilførte KMZ-filene distribueres uendret under `assets/geography/google-earth/`. Filnavnene er gjort korte og nettvennlige; innholdet er byteidentisk med vedleggene. Alle arkivenes CRC-kontroller passerer.

| Nedlastingsfil | Innhold | Størrelse |
| --- | --- | ---: |
| `plategrenser.kmz` | Plategrenser, mindre plater/forkastningssoner og bevegelsespiler | 328 667 byte |
| `vulkaner-holocen.kmz` | 1 432 vulkanpunkter fra holocen-datasettet | 526 400 byte |
| `jordskjelv-m5-1994-2023.kmz` | 50 798 jordskjelvpunkter, magnitude 5,0 og høyere, fargekodet etter dybde | 4 556 701 byte |
| `age-of-lithosphere.kmz` | Alderskart for både kontinental- og havbunnsskorpe, med tegnforklaringer og plategrenser | 10 823 538 byte |

Jordskjelvfilens mapper dekker **1. januar 1994 til 31. desember 2023**. Dette er kontrollert i KML-innholdet, og ikke bare ut fra vedleggets filnavn. Perioden er derfor 1994–2023, selv om bestillingsteksten ett sted oppga 1994–2003. Alderskartet inneholder både `Age Continent` og havbunnens isokroner/alderskonturer.

Kildelenkene som fulgte vedleggene:

- Plategrenser: [EarthRef ERDA 1367](https://earthref.org/ERDA/1367/).
- Vulkaner, jordskjelv og alder: [SERC – Google Earth examples 49004](https://serc.carleton.edu/sp/library/google_earth/examples/49004.html).

Vulkanfilen bruker et eksternt Google-ikon. Jordskjelvfilen bruker eksterne USGS-ikoner og en USGS-tegnforklaring for dybde. Selve punktene og egenskapene ligger i KMZ-filene; de er ingen løpende jordskjelvfeed. Plategrense- og aldersfilenes bilder er pakket i arkivene. Avanserte lag og store punktmengder kan kreve Google Earth Pro fremfor nettutgaven.

## Innebygd Google-kart

Brukerens Google My Maps-kart med ID `105PobuL643Yr0Gh5O478-RHzWksbtCc` er bygget inn rett over punkt 5 i fagstoffet for indre krefter. Iframe bruker Googles `/maps/d/embed`-visning; lenken «Åpne større kart» bruker `/maps/d/viewer`. Eierens redigeringsadresse og kontoindeks er ikke brukt på nettsiden. Kartet lastes sent med `loading="lazy"` og har en responsiv ramme. Onlyfag-rammen følger mørk modus; Googles kartinnhold beholder Googles egne farger og kreditering.

Kartet må være offentlig tilgjengelig uten innlogging. En redigeringsadresse med `usp=sharing` bekrefter ikke delingsinnstillingen. Skymiljøets proxy blokkerte direkte kontroll mot Google; anonym tilgang og innholdet i selve kartet er derfor ikke verifisert. Nettlesertesten bruker tydelig merket testinnhold i Google-rammen og kontrollerer adresse, plassering og layout, ikke Googles tilgjengelighet.

Kartet har en tegnforklaring til høyre på store skjermer og under kartet på små skjermer. Fargene er kontrollert i KMZ-filens `LineStyle` og objektbeskrivelser: grønn (`#55ff00`) = spredningssone, rød (`#ff0000`) = glidegrense, blå (`#0070ff` og `#005ce6`) = kollisjonssone, hvit = øvrige grenser (`Other`). KML-farger er lagret som AABBGGRR og må leses i riktig rekkefølge.

SHA-256:

```text
ae88ca74813bebb5da0c120f6d9661dd04bef8f52c705bec315094b755af5f76  plategrenser.kmz
7bcc207b0d987f75464795418e0a16ade2ac51b11655bfaabd4a2212c5ed3b3a  vulkaner-holocen.kmz
d27b566ad6468be2687be58ee69e542030d989f3cbd8ee936e32bb166d270cb9  jordskjelv-m5-1994-2023.kmz
6d70f5a41756cfaa707ca35dc6944256607440217b893c11b1a81de2373e84de  age-of-lithosphere.kmz
```
