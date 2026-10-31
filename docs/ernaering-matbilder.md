# Matbilder i ernæringsmodulen

Ti fotografier er lagret lokalt i `assets/nutrition/food/`. Ingen av bildene er KI-generert. Originalenes bakgrunn er allerede behandlet av datasettforfatterne; OnlyFag har bare konvertert filene til WebP, uten ny beskjæring, oppskalering eller endring av matvarene. Navn, alternativtekst og kreditering finnes også i `prototyper/ernaering/food-photo-data.js`.

Alle ti sluttfiler er visuelt kontrollert: matvaren er gjenkjennelig og stemmer med navnet. Eggbildet viser et **stekt egg**, ikke et rått egg. Risbildet viser **kokt basmatiris** uten synlig tilbehør. Bildet som opprinnelig var vurdert av ovnsbakte poteter, ble valgt bort fordi mulig tilsatt fett gjorde det mindre entydig.

## Rettigheter og kildegrunnlag

Fruits-360 beskriver at frukt/grønnsaker/nøtter er fotografert med et Logitech C920-kamera mens matvarene roterte foran hvit bakgrunn. Forfatter: Mihai Oltean. Lisens: CC BY-SA 4.0. Fotografiene brukes med samme lisens etter WebP-konverteringen. Kildeversjon: `d08d3d5b1abfdace697870b0f6aeee0a4edb74b4`.

Food For Machine Learning (FFML) beskriver at forfatterne tok bildene selv fra flere vinkler og satte maten på hvit bakgrunn. Forfattere: Fülöp Bettina-Elena og Cristea Ioan. Repositoryets MIT-lisens gjelder datasettet, og full lisens/kopirettsnotis følger filene i `assets/nutrition/food/LICENSES.txt`. Kildeversjon: `b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0`.

## Filoversikt

| Fil | Matvare | Fotograf | Lisens | Original |
| --- | --- | --- | --- | --- |
| `egg.webp` | Egg, stekt | Fülöp Bettina-Elena og Cristea Ioan | [MIT](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/LICENSE.txt) | [Kilde](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/images/FRIED%20EGG/01.jpg) |
| `salmon.webp` | Laks, rå | Fülöp Bettina-Elena og Cristea Ioan | [MIT](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/LICENSE.txt) | [Kilde](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/images/FRESH%20SALMON/01.jpg) |
| `cheese.webp` | Goudaost | Fülöp Bettina-Elena og Cristea Ioan | [MIT](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/LICENSE.txt) | [Kilde](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/images/GOUDA%20CHEESE%20IN%20SLICES/01.jpg) |
| `rice.webp` | Ris, kokt | Fülöp Bettina-Elena og Cristea Ioan | [MIT](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/LICENSE.txt) | [Kilde](https://github.com/cristeaioan/ffml_dataset/blob/b5b03333bdc8b7a409134ea1ee3f4aca7bcf93f0/images/BASMATI%20RICE/01.jpg) |
| `almonds.webp` | Mandler | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Almonds%201/r0_30.jpg) |
| `avocado.webp` | Avokado | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Avocado%20Green%201/r0_30.jpg) |
| `pepper.webp` | Rød paprika | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Pepper%20Red%204/r1_0.jpg) |
| `banana.webp` | Banan | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Banana%203/r0_0.jpg) |
| `orange.webp` | Appelsin | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Orange%205/r0_0.jpg) |
| `kiwi.webp` | Kiwi | Mihai Oltean / Fruits-360 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Kilde](https://github.com/fruits-360/fruits-360-original-size/blob/d08d3d5b1abfdace697870b0f6aeee0a4edb74b4/Training/Kiwi%203/r0_0.jpg) |

## Teknisk kontroll

Alle filer er faktiske WebP-bilder med korrekte dimensjoner i metadata. Bildene skal vises med `object-fit: contain` slik at gjenkjennelige deler ikke klippes. Noen originaler er mindre enn 640 piksler; disse er bevart i original oppløsning fremfor å blåses opp kunstig. Svaralternativene gjelder næringsstoffene, så navn under bildene er tilsiktet.

Wikimedia Commons-kandidater ble undersøkt, men ble ikke brukt i sluttversjonen fordi dette arbeidsmiljøet ikke kunne laste ned mediefilene fra disse domenene. Det er derfor ingen eksterne bildelenker eller avhengighet av tredjeparts bilder i oppgavevisningen.
