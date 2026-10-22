# Kartgrunnlag: Norske fylker

Quizen bruker de 15 fylkene i inndelingen som ble innført 1. januar 2024.
Brukeren bekreftet at dagens 15 fylker skulle brukes da det viste seg at den
opprinnelig foreslåtte SVG-filen viste inndelingen med 11 fylker fra 2020.

## Kilder og lisens

- Fylkesnavn og fylkesnummer er kontrollert mot [Kartverkets åpne API](https://ws.geonorge.no/kommuneinfo/v1/fylker).
- Inndelingen er beskrevet av [Kartverket](https://www.kartverket.no/om-kartverket/nyheter/eiendom/2024/januar/kommune-og-fylkesendringene-per-1.-januar-2024).
- Kartformene er bearbeidet fra **NordNordWest: «Vestland in Norway 2024.svg»**, versjonen lastet opp 1. januar 2024, kl. 15:08 UTC. [Kildeside og historikk](https://commons.wikimedia.org/wiki/File:Vestland_in_Norway_2024.svg), [opprinnelig SVG](https://upload.wikimedia.org/wikipedia/commons/b/bb/Vestland_in_Norway_2024.svg).
- Kartet og de bearbeidede kartformene i `assets/geography/sources/norway-counties-2024.svg` og `assets/geography/norway-counties.json` distribueres under [Creative Commons Attribution–ShareAlike 3.0 Germany](https://creativecommons.org/licenses/by-sa/3.0/de/), [full lisenstekst](https://creativecommons.org/licenses/by-sa/3.0/de/legalcode).

Kreditering ved visning: **Kart: NordNordWest · CC BY-SA 3.0 DE · bearbeidet**,
med lenke til kildesiden og lisensen. Dette gjelder kartgrunnlaget, ikke lisensen
til resten av nettstedets kode.

## Bearbeiding

Originalen inneholder 15 fylkesflater, deretter egne vann- og grenselag.
Fylkesflatene alene omfatter også vann utenfor kysten. Derfor er vannflatene
trukket fra hver fylkesflate med polygonklipping. Å bare kopiere de første
15 SVG-stiene ville gitt feil synlig kyst og klikkbare havområder.

Resultatet bevarer kyst, øyer, fjorder og hull for innsjøer. Tekster, andre land,
stedsmarkeringer, linjeeffekter og innfelt kart over Svalbard er fjernet.
Svalbard og Jan Mayen inngår ikke i fylkesquizen. SVG-kurver er gjort om til
polylinjer, deretter forenklet med toleranse 0,25 kildeenheter i et koordinatsystem
på 1360,629 × 1500,617. Bare øyflater mindre enn 0,5 kvadratiske kildeenheter
er utelatt. Dette er detaljer under én skjermpiksel i normal visning.
Koordinater er avrundet til tre desimaler. Verktøy ved utarbeiding:
`svg-path-parser` 1.1.0 og `polygon-clipping` 0.15.7; nettstedet laster ingen av
disse bibliotekene.

Hvert fylke har ett hintpunkt inne på den største sammenhengende landflaten,
valgt ved søk etter god avstand fra kanten. Disse punktene brukes til hint,
ikke til å avgjøre klikk. Oslo beholder sin faktiske størrelse i kartgrunnlaget.
Fylkesnavn er på norsk; navnene inneholder ikke samiske eller kvenske parallelle
navneformer i denne quizen.

## Reproduserbar lokal bygging

Den renskede og krediterte SVG-filen er den versjonerte geometrikilden.
Ingen kartdata hentes under spill eller ved vanlig bygging.

```sh
node scripts/build-norway-county-assets.cjs
node scripts/build-norway-county-assets.cjs --check
```

Byggingen validerer navn og nummer, nøyaktig 15 unike fylker, tillatte
SVG-kommandoer og at samtlige hintpunkter ligger på land innenfor riktig fylke.
Ferdig kart er i tillegg rendret og kontrollert mot den navngitte
2024-referansen; alle 15 hintpunkter er kontrollert med nettleserens
`SVGGeometryElement.isPointInFill()`.

Formatet er samme som Statle-kartets: `{n, a, d, c}`, med navn, fylkesnummer,
SVG-sti og hintpunkt. Kildekoordinatene bevares; spillmotoren tilpasser kartet
til tilgjengelig skjermplass.
