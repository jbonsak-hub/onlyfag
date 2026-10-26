# Fagreview av oppgavebank og organfigur

Gjennomgått 26. oktober 2026 mot alle fem presentasjoner og `research/pedagogical-review.md`. Kun lest og vurdert `site/prototyper/ernaering/questions.js` og `diagram.js`. Ingen endringer i oppgavefilene.

## Resultat

De 60 oppgavene gir god dekning av de sentrale mekanismene. Ingen blokkerende fagfeil funnet. Fasiter og forklaringer retter de viktigste feilene og forenklingene i lysbildene: 9 av 20 essensielle aminosyrer, C=C i fettsyrekjeden, galle kontra lipase, tynntarmens vannopptak, B12-lagring, cytosol kontra mitokondrier og ATP som energioverføring. Åpne svar har modelltekst og faglige kriterier, fremfor falsk automatisk retting.

## Anbefalte endringer før ferdigstilling

1. **Legg til direkte figurspørsmål om hovedstedet for fettfordøyelsen.** Banken har figurspørsmål om hvor stivelse og protein spaltes, men fettets figurspørsmål gjelder bare hvor galle produseres. Et eget spørsmål «Velg tynntarmen, der hoveddelen av fettfordøyelsen skjer» med `answer: ['small']` dekker brukerens eksplisitte ønske om å øve på hvor ting brytes ned. Forklar at tolvfingertarmen er første del av tynntarmen.
2. **Håndter tolvfingertarm som underbegrep i figuroppgavene.** `carbs-process-breakdown`, `protein-process-breakdown` og `micro-process-water` forventer overordnet `small`, men figuren har samtidig egen `duodenum`-markør. Oppgaveteksten presiserer dette, men grensesnittet bør også unngå at en elev får et anatomisk sant sted markert feil. Deaktiver den separate duodenum-markøren i slike overordnede spørsmål, eller grupper den uttrykkelig med tynntarmen. Behold begge markører i organplasseringen.
3. **Vis sekretgangene frem til tolvfingertarmen.** Diagrammets grønne gang fra galleblæren slutter ved (291,388), mens duodenalrøret ligger lavere/til venstre. Bukspyttkjertelen har ingen synlig utførselsgang til tarmen. Koble begge til innsiden av duodenalslyngen, slik at figuren støtter læringen om hvor galle og bukspytt tilsettes. Ikke tegn dem som separate deler av matens vei.

## Mindre forbedringer dersom det er plass

- **Laktoseintoleranse:** Presentasjonene bruker dette som konkret anvendelse av enzymspesifisitet, men banken har ingen slik anvendelsesoppgave. Et kort spørsmål med «lite laktase → utilstrekkelig spalting av laktose» er verdifullt, uten medisinske råd eller befolkningsprosenter.
- **Proteinkvalitet:** Den omtales i forklaringen til plante-/dyresortering, men eleven bruker ikke begrepet. En åpen oppgave om hvordan korn og belgvekster kan utfylle hverandre vil dekke de sentrale lysbildene 13–15 i Proteiner. Gi sammensetning av essensielle aminosyrer og fordøyelighet som vurderingskriterier.
- **Laktatbegrepet:** Materialet bruker hovedsakelig «melkesyre», mens banken går rett til laktat/pyruvat/glykolyse. Dette er presist, men legg gjerne en kort forklaring av sammenhengen til kjent begrep i forklaringen, slik at endret terminologi ikke blir en skjult prøving i nytt stoff.
- **`fat-essential-families`:** Navnet alfa-linolensyre er ikke eksplisitt lært i kildenes tekst. Spørsmålet er faglig riktig, men dette er et nytt detaljnivå for nivå 1. Eventuelt spør om familiene omega-3 og omega-6, eller flytt artsnavnene til hint/forklaring.
- **Fettløselige vitaminer:** I `fat-functions` er «bidra til opptak av fettløselige vitaminer» en mer nyansert formulering enn «gjøre opptak … mulig». Forklaringen har allerede den bedre formuleringen.

## Organfigur

Alle ti pekerpunkter treffer faglig riktig organ: munn, spiserør, magesekk, lever, galleblære, bukspyttkjertel, tolvfingertarm, tynntarm, tykktarm og endetarm. Rekkefølgen i matkanalen er riktig, og lever/bukspyttkjertel/galleblære er plassert som tilknyttede organer. At størrelsesforholdene er skjematiske, står i beskrivelsen. Sekretgangene er den eneste anbefalte faglige illustrasjonsendringen.

## Grensesnittavhengig kontroll

Alle `choice`-oppgaver har fasiten først i datalisten. Motoren må stokke alternativene, ellers blir plasseringen et utilsiktet svarhint. Tilsvarende bør koblingsoppgaver stokke høyresiden og rekkefølgeoppgaver starte i en annen rekkefølge enn fasiten. Dette er ikke fagfeil i dataene, men nødvendig for at oppgavene skal fungere som øving.
