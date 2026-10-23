# Kommunequiz: kartgrunnlag

Quizene bruker lokale vektorkart. Ingen kartbilder, navneetiketter eller eksterne
karttjenester lastes under spill. Kommunegrensene, øyene og kystlinjen følger det
lagrede kartgrunnlaget også når brukeren zoomer.

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

Fylkeslisten viser nå **Oslo og omegn (30)**, varianten
`oslo-surroundings-v2`. Utvalget er et mer samlet område rundt Oslo, hentet
utelukkende fra den tidligere quizens 54 kommuner. Ytterlaget er redusert i
alle retninger, særlig mot nordøst. Kommunene er fortsatt hele, med de lagrede
kommunegrensene, kystlinjene og øyene; ingen kommune klippes eller får endret
geometri for å gjøre kartformen jevnere.

De 30 kommunene er **Asker, Aurskog-Høland, Bærum, Drammen, Enebakk, Frogn,
Gjerdrum, Hole, Holmestrand, Indre Østfold, Jevnaker, Lier, Lillestrøm, Lunner,
Lørenskog, Modum, Moss, Nannestad, Nes, Nesodden, Nittedal, Nordre Follo, Oslo,
Rælingen, Skiptvet, Ullensaker, Vestby, Våler, Ås og Øvre Eiker**. Våler her er
Våler i Østfold, ikke Våler i Innlandet.

Følgende 24 tidligere mål er tatt ut:

- Nord og nordøst: Gran, Hurdal, Eidsvoll, Nord-Odal, Sør-Odal og Kongsvinger.
- Vest og nordvest: Flå, Ringerike, Krødsherad, Sigdal og Kongsberg.
- Det ytre laget mot sør og sørøst: Horten, Tønsberg, Sandefjord, Færder,
  Larvik, Råde, Rakkestad, Marker, Aremark, Sarpsborg, Fredrikstad, Hvaler og
  Halden.

Hole, Jevnaker og Lunner gir fortsatt en nordvestlig omegn rundt Oslo.
Ringerikes lange nordlige utstrekning er utelatt, mens Aurskog-Høland beholdes
som en del av den østlige Akershus-omegnen. I UTM-projeksjonen er kartets
ytterramme redusert fra omtrent **188,8 × 201,5 km** til **129,0 × 124,2 km**,
omtrent 58 prosent mindre rammeareal. De beholdte kommunene har en sammenhengende
kjede av felles landegrenser; vanlige øykomponenter beholdes som i kilden.

Dette endrer quizutvalget, ikke den offisielle fylkesinndelingen. Oslo fylke har
fortsatt én kommune, og det nasjonale grunnlaget har fortsatt **357 kommuner i
15 fylker**. De andre **14 fylkesquizene er uendret** og følger fylkesgrensene.

Den aktive indeksen er `index-v2.json`, som peker på `county-03-v2.json` med
30 mål og varianten `oslo-surroundings-v2`. De tidligere filene `index.json`
og `county-03.json` beholdes uendret for mellomlagrede sider med 54 mål.
54-utvalget er frosset og har en separat resultatliste fra det nye 30-utvalget.
Historiske resultater og aktive eldre økter skal ikke flyttes, nullstilles eller
slettes ved publisering. Alle tidligere publiserte ressurser beholdes.

## Reprodusere bygget

Kildene er lagret komprimert med deterministisk gzip-header. Bygget krever ikke
nettverk. Python-avhengighetene brukes bare til å bygge filene, ikke på nettsiden.

```sh
python -m pip install -r scripts/municipality-requirements.txt
python scripts/build-norway-municipality-assets.py --require-water
python scripts/build-norway-municipality-assets.py --check --require-water
```

Ved endring av utvalget i én quiz kan `--county 03` brukes for å bygge
`county-03-v2.json` og oppdatere `index-v2.json` uten å bygge de andre
fylkesquizene på nytt. `--check --county 03 --require-water` kontrollerer dette
utvalget uten å skrive filer. De frosne 54-filene skal ikke overskrives.
Endres kildegeometrien, bygges hele atlaset.

`index-v2.json` har offisielt fylkesantall, oversiktsgeometri, quiztittel,
quizantall og revisjon for hver fylkesfil. Oslo-oppføringen har i tillegg
`variant: "oslo-surroundings-v2"`. Offisielt kommuneantall og antall quizmål er
separate felt. De øvrige oppføringene peker fortsatt på de samme
`county-NN.json`-filene som før.

Hver fylkesfil inneholder quizens `viewBox`, kommunene som `states` (`n`,
kommunenummer `a`, SVG-geometri `d` og et innvendig hintpunkt `c`) og vannlagene
som `water` (`kind`, `d`), innvendige grenselinjer som `boundaries` og landet
rundt som `context`. `county-03-v2.json` har også det eksplisitte variantfeltet.
Revisjonene brukes i kartfilenes URL-er for å oppdatere nettleserens mellomlager
når kartgrunnlaget endres. Den eldre `index.json` beholder sine opprinnelige
filhenvisninger og revisjoner.
