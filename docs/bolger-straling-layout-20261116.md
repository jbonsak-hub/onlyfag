# Bølger og stråling – figurer og oppsett, 16. november 2026

Utgangspunkt: publisert main e1b28a09e861e067dd8868c2bd606130513a7cba.
Siden blir under /prototyper/bolger-straling.html.

## Endringer

- Absorpsjon er flyttet til EM-spekteret rett før RGB, med tilhørende begrep og eksisterende oppgave-ID.
- Hydrogenmodellen har smalere kontrollpanel, nivåvalg uten energitall, valgfri aJ-visning (av ved start) og en ΔE-knapp som åpner utregning for valgt overgang.
- Resonans har 0,1–1,0 Hz i steg på 0,1 og egenfrekvens 0,4 Hz. Friksjon/luftmotstand er på ved start, med demping 0,1. Uten demping bygger korrekt timede dytt langsomt opp utslaget; et sent snorbrudd er en skjult tegnefilmeffekt. Timing og armkontakt følger samme oscillator.
- Dobbeltspalten kan vise tidsmidlet intensitet med stasjonære maksimum/minimum og en skjermstripe. Bølgebevegelsen kan fortsatt vises. Råfeltet summerer koherente bølger fra hele åpningene.
- Praktiske eksempler samler prisme, regnbue, bølger mot strand og lekebil på teppe i ett vindu.
- Lyd og vannbølger deler ett vindu med egne figurer og faner.
- Dråpefiguren er tegnet som en stor lysveifigur med hjelperetninger og omtrent 42°; to refleksjoner og begge hele regnbuene er også vist.
- Regneeksemplene i bølgeegenskaper og EM har problemtekst og forklaring bak utvidbar løsning.

## Kontroll

Bestått:
- node tests/bolger-straling.cjs --data-only
- node tests/bolger-straling-diffraction.cjs
- node tests/bolger-straling-resonance.cjs
- 123 eksisterende oppgave-ID-er og 24 numeriske svar er bevart.
- Faktiske Edge/Playwright-skjermbilder kontrollert ved 1366 × 768 og 1280 × 720.
- Alle fire praktiske eksempler, lyd/vann og ΔE-vindu får plass uten intern scrolling ved 1280 × 720.
- Mobilbredde 390 × 844: nye vinduer har ingen horisontal overløp; ΔE-utregningen er lesbar i én kolonne.
- Kontrollert fokus tilbake ved lukking, Escape, aJ-bryter, mørk visning, uavhengig pause og normal/friksjonsfri resonans.

Nettleseren kjøres fra Node REPL med bundlet Playwright og lokal Edge. Vanlig exec-sandkasse kunne ikke starte Edge; ingen privilegier eller brukerprofiler ble endret.

Cacheversjon: 20261116-layout2.
