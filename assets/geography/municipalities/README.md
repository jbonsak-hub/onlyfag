# Kommunequiz: kartgrunnlag

Quizene bruker lokale vektorkart og har et valgfritt lokalt terrengbilde fra
Kartverkets høydegrunnlag. Ingen eksterne karttjenester lastes under spill.
Kommunegrensene, øyene og kystlinjen følger det
lagrede kartgrunnlaget også når brukeren zoomer.

Terrengbildenes kilder, lisenser og uendrede UTM-tilpasning er dokumentert i
[`docs/norway-relief-sources.md`](../../../docs/norway-relief-sources.md).

## Kommune- og fylkesgrenser

- Opphav: **Kartverket**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Inndeling: **1. januar 2024**, med **357 kommuner i 15 fylker**, inkludert Haram.
- Kilde: Robert Hoplands bearbeiding av Kartverkets data,
  [fylker-og-kommuner](https://github.com/robhop/fylker-og-kommuner), variant **L**,
  låst til commit `ae8782500090144c2b74d6bb2a89365a7ff2236d`.
- Originalfil:
  [Kommuner-L.topojson](https://raw.githubusercontent.com/robhop/fylker-og-kommuner/ae8782500090144c2b74d6bb2a89365a7ff2236d/Kommuner-L.topojson).
- SHA-256 av den ukomprimerte originalfilen:
  `ae7933c28e07132032f8249e5befa56d6d7bbb027be024d66b48b9e42f195419`.
- Kildegeometrien inneholder 13 482 delte topologiske buer og 237 540
  koordinatpar. Polygonene er allerede klippet etter kystlinjen i kilden, slik
  at kommuneområder ute i havet ikke dekker fjorder og kystkonturer.

Bygget dekoder de delte buene, projiserer fra WGS84 til ETRS89 / UTM sone 33N
(`EPSG:25833`) og normaliserer hvert utsnitt til maksimalt 1 200 SVG-enheter.
Koordinatene avrundes til 0,01 SVG-enhet; kommunequizene forenkles ikke videre.
Dette beholder detaljene i L-varianten, men er ikke en påstand om at denne
bearbeidingen bruker nøyaktig samme generalisering som Kartverkets PDF.
Den nasjonale fylkesoversikten forenkles separat med 80 meters toleranse og
bevart polygontopologi, under en tidel av en skjermpiksel i oversiktskartet.
Dette påvirker ikke detaljnivået i kommunequizene.

## Vann og vassdrag

Det separate hydrogrunnlaget er lagret som
`sources/hydrography.geojson.gz`. Kilde, lisens og revisjon følger filens
`source`-felt og gjengis i atlasindeksen `index-v2.json`. Vannflater og elvelinjer klippes til
de spillbare kommunenes samlede landavgrensning. Visningen gir
kommunegrensene mer kontrast enn vann og vassdrag.

De innvendige kommunegrensene beregnes separat fra kystlinjen og tegnes med
en lys strek og en mørk kant over vannlaget. Elver har tynnere og svakere streker.
Land rundt quizområdet vises som et eget grått bakgrunnslag. Norsk land bruker
samme Kartverket-grunnlag; Sverige, Finland og Russland hentes fra prosjektets
lagrede [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)-geometrier
i målestokk 1:10 millioner (public domain), i `sources/neighbor-land-10m.geojson.gz`.
Kilderevisjon og kontrollsum følger filen. Bakgrunnslandet klippes til nærområdet og forenkles med 80 meter
toleranse. Dette endrer ikke de spillbare kommuneområdene.

Hydrogrunnlaget er **Kartverket N1000 Kartdata, 2025**, videreformidlet av
[Henrik Malmedals N1000-pakke](https://github.com/hmalmedal/N1000/tree/9c51b85b889366ae3a9e0b9f50a2f7b227779684)
under **CC BY 4.0**. Det inneholder 3 713 innsjøflater, 27 brede elveflater og
9 027 elve-/bekkelinjer, med alle 205 925 kildekoordinater bevart før klipping.
Dette er et oversiktskartgrunnlag i målestokk 1:1 000 000, egnet som dempet
orienteringshjelp. Det omfatter større vann og vassdrag; småvann og alle små
bekker er ikke med. Nøyaktig GML-kilde, speilrevisjon og kontrollsummer er
lagret i kildefilens metadata.

## Oslo og omegn

Fylkeslisten viser **Oslo og omegn (31)**, varianten
`oslo-surroundings-v3`. Utvalget er det publiserte 30-utvalget pluss
**Ringerike**, med hele kommunens kildegeometri, kystlinje og innsjøer.
Kartet viser alle kommunene i sin helhet; områder klippes ikke for å endre
kartformen. De andre 14 fylkesquizene og de offisielle 357 kommunene er uendret.

Den aktive indeksen er `index-v3.json`, som peker på `county-03-v3.json`.
Tidligere `index-v2.json` / `county-03-v2.json` med 30 mål og
`index.json` / `county-03.json` med 54 mål beholdes uendret. Hver utgave har
egen resultatliste, og aktive eldre runder beholder sitt opprinnelige målsett.
Gamle resultater skal ikke flyttes, nullstilles eller slettes ved publisering.
Alle tidligere publiserte ressurser beholdes.

## Reprodusere bygget

Kildene er lagret komprimert med deterministisk gzip-header. Bygget krever ikke
nettverk. Python-avhengighetene brukes bare til å bygge filene, ikke på nettsiden.

```sh
python -m pip install -r scripts/municipality-requirements.txt
python scripts/build-norway-municipality-assets.py --require-water
python scripts/build-norway-municipality-assets.py --check --require-water
```

Ved endring av utvalget i én quiz kan `--county 03` brukes for å bygge
`county-03-v3.json` og oppdatere `index-v3.json` uten å bygge de andre
fylkesquizene på nytt. `--check --county 03 --require-water` kontrollerer dette
utvalget uten å skrive filer. De frosne 54- og 30-filene skal ikke overskrives.
Endres kildegeometrien, bygges hele atlaset.

`index-v3.json` har offisielt fylkesantall, oversiktsgeometri, quiztittel,
quizantall og revisjon for hver fylkesfil. Oslo-oppføringen har i tillegg
`variant: "oslo-surroundings-v3"`. Offisielt kommuneantall og antall quizmål er
separate felt. De øvrige oppføringene peker fortsatt på de samme
`county-NN.json`-filene som før.

Hver fylkesfil inneholder quizens `viewBox`, kommunene som `states` (`n`,
kommunenummer `a`, SVG-geometri `d` og et innvendig hintpunkt `c`) og vannlagene
som `water` (`kind`, `d`), innvendige grenselinjer som `boundaries` og landet
rundt som `context`. `county-03-v3.json` har også det eksplisitte variantfeltet.
Revisjonene brukes i kartfilenes URL-er for å oppdatere nettleserens mellomlager
når kartgrunnlaget endres. Den eldre `index.json` beholder sine opprinnelige
filhenvisninger og revisjoner.
