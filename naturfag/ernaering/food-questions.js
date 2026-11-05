// Photo-based nutrient questions, checked against Matvaretabellen on 2026-10-31.
// Distractors are absent constituents, not nutrients present in smaller amounts.
export const foodQuestions = [
  {
    "id": "food-nutrients-egg",
    "topic": "protein",
    "type": "multi",
    "level": 1,
    "family": "food-nutrients",
    "figure": "food-egg",
    "title": "Næringsstoffer i stekt egg",
    "prompt": "Hvilke av disse næringsstoffene finnes i det stekte egget?",
    "options": [
      "Proteiner",
      "Fett",
      "Vitamin B12",
      "Stivelse",
      "Kostfiber",
      "Vitamin C"
    ],
    "answer": [
      "Proteiner",
      "Fett",
      "Vitamin B12"
    ],
    "hint": "Tenk på både eggehviten og eggeplommen, og skill mellom plante- og dyrekilder.",
    "explanation": "Et helt egg gir både protein og fett, og inneholder vitamin B12. Steking i fett tilfører enda mer fett. Egget inneholder ikke stivelse eller kostfiber, og Matvaretabellen oppgir ikke vitamin C i stekt egg."
  },
  {
    "id": "food-nutrients-salmon",
    "topic": "protein",
    "type": "multi",
    "level": 1,
    "family": "food-nutrients",
    "figure": "food-salmon",
    "title": "Næringsstoffer i laks",
    "prompt": "Hvilke av disse næringsstoffene finnes i laksen? Huk av for alle riktige.",
    "options": [
      "Proteiner",
      "Fett",
      "Vitamin D",
      "Stivelse",
      "Kostfiber",
      "Vitamin C"
    ],
    "answer": [
      "Proteiner",
      "Fett",
      "Vitamin D"
    ],
    "hint": "Laks er en fet fisk. Tenk også på hvilke vitaminer fisk kan bidra med.",
    "explanation": "Laks inneholder protein, fett og vitamin D. Fettet gjør ikke fisken til en ren fettkilde; den gir flere næringsstoffer samtidig. Laks inneholder ikke stivelse eller kostfiber, og Matvaretabellen oppgir ikke vitamin C i rå laks."
  },
  {
    "id": "food-nutrients-cheese",
    "topic": "micro",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-cheese",
    "title": "Næringsstoffer i goudaost",
    "prompt": "Hvilke av disse næringsstoffene finnes i goudaosten?",
    "options": [
      "Proteiner",
      "Fett",
      "Kalsium",
      "Vitamin B12",
      "Stivelse",
      "Kostfiber"
    ],
    "answer": [
      "Proteiner",
      "Fett",
      "Kalsium",
      "Vitamin B12"
    ],
    "hint": "Tenk på at ost er laget av melk, men ikke har samme sammensetning som melk.",
    "explanation": "Goudaost inneholder protein, fett, kalsium og vitamin B12. Den gir altså både energigivende næringsstoffer, vitaminer og mineralstoffer. Den inneholder ikke stivelse eller kostfiber."
  },
  {
    "id": "food-nutrients-rice",
    "topic": "carbs",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-rice",
    "title": "Næringsstoffer i kokt ris",
    "prompt": "Hvilke av disse stoffene finnes i risen som bare er kokt i vann?",
    "options": [
      "Stivelse",
      "Proteiner",
      "Kostfiber",
      "Vann",
      "Laktose",
      "Vitamin B12"
    ],
    "answer": [
      "Stivelse",
      "Proteiner",
      "Kostfiber",
      "Vann"
    ],
    "hint": "Tenk på både det riskornet inneholdt, og det risen tok opp under kokingen.",
    "explanation": "Kokt ris inneholder stivelse, noe protein og mye vann som er tatt opp under kokingen. Hvit ris inneholder også en liten mengde kostfiber, men er ikke en fiberrik matvare. Ris som bare er kokt i vann, inneholder ikke laktose eller vitamin B12."
  },
  {
    "id": "food-nutrients-almonds",
    "topic": "fat",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-almonds",
    "title": "Næringsstoffer i mandler",
    "prompt": "Hvilke av disse næringsstoffene finnes i vanlige mandler?",
    "options": [
      "Fett",
      "Proteiner",
      "Kostfiber",
      "Vitamin E",
      "Vitamin B12",
      "Kolesterol"
    ],
    "answer": [
      "Fett",
      "Proteiner",
      "Kostfiber",
      "Vitamin E"
    ],
    "hint": "Mandler er frø. Mye fett betyr ikke at de er uten andre næringsstoffer.",
    "explanation": "Mandler inneholder fett, protein, kostfiber og vitamin E. Mesteparten av fettet er umettet. Matvaretabellen oppgir ikke kolesterol i mandler, og de inneholder ikke vitamin B12."
  },
  {
    "id": "food-nutrients-avocado",
    "topic": "fat",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-avocado",
    "title": "Næringsstoffer i avokado",
    "prompt": "Hvilke av disse næringsstoffene finnes i avokadoen?",
    "options": [
      "Fett",
      "Proteiner",
      "Kostfiber",
      "Vitamin E",
      "Vitamin B12",
      "Vitamin D"
    ],
    "answer": [
      "Fett",
      "Proteiner",
      "Kostfiber",
      "Vitamin E"
    ],
    "hint": "Ikke alle frukter har samme fordeling av næringsstoffer. Tenk også på fettløselige vitaminer.",
    "explanation": "Avokado inneholder mye fett sammenlignet med mange andre frukter. Den inneholder også noe protein, kostfiber og vitamin E. Vanlig avokado inneholder ikke vitamin B12 eller vitamin D."
  },
  {
    "id": "food-nutrients-pepper",
    "topic": "micro",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-pepper",
    "title": "Næringsstoffer i rød paprika",
    "prompt": "Hvilke av disse næringsstoffene finnes i rå, rød paprika?",
    "options": [
      "Vitamin C",
      "Karbohydrater",
      "Kostfiber",
      "Stivelse",
      "Vitamin B12",
      "Vitamin D"
    ],
    "answer": [
      "Vitamin C",
      "Karbohydrater",
      "Kostfiber"
    ],
    "hint": "Alle karbohydrater er ikke stivelse. Tenk på forskjellen mellom sukkerarter og stivelse.",
    "explanation": "Rød paprika inneholder vitamin C, karbohydrater i form av sukkerarter og kostfiber. Matvaretabellen oppgir ikke stivelse i rå, rød paprika. Den inneholder heller ikke vitamin B12 eller vitamin D."
  },
  {
    "id": "food-nutrients-banana",
    "topic": "carbs",
    "type": "multi",
    "level": 1,
    "family": "food-nutrients",
    "figure": "food-banana",
    "title": "Næringsstoffer i banan",
    "prompt": "Hvilke av disse næringsstoffene finnes i den vanlige, rå bananen?",
    "options": [
      "Sukkerarter",
      "Kostfiber",
      "Mineralstoffer",
      "Laktose",
      "Vitamin B12",
      "Vitamin D"
    ],
    "answer": [
      "Sukkerarter",
      "Kostfiber",
      "Mineralstoffer"
    ],
    "hint": "Frukt har naturlige sukkerarter. Tenk også på det som ikke gir energi.",
    "explanation": "Banan inneholder naturlige sukkerarter, kostfiber og mineralstoffer. Innholdet av ulike karbohydrater endres når bananen modner. Vanlig banan inneholder ikke laktose, vitamin B12 eller vitamin D."
  },
  {
    "id": "food-nutrients-orange",
    "topic": "micro",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-orange",
    "title": "Næringsstoffer i appelsin",
    "prompt": "Hvilke av disse næringsstoffene finnes i den rå appelsinen?",
    "options": [
      "Vitamin C",
      "Karbohydrater",
      "Kostfiber",
      "Vann",
      "Vitamin B12",
      "Vitamin D"
    ],
    "answer": [
      "Vitamin C",
      "Karbohydrater",
      "Kostfiber",
      "Vann"
    ],
    "hint": "Tenk på mer enn det ene vitaminet appelsiner er kjent for.",
    "explanation": "Appelsin inneholder vitamin C, karbohydrater i form av sukkerarter, kostfiber og mye vann. Kostfiberet finnes i frukten selv, så en hel appelsin og et glass juice er ikke det samme. Appelsin inneholder ikke vitamin B12 eller vitamin D."
  },
  {
    "id": "food-nutrients-kiwi",
    "topic": "micro",
    "type": "multi",
    "level": 2,
    "family": "food-nutrients",
    "figure": "food-kiwi",
    "title": "Næringsstoffer i kiwi",
    "prompt": "Hvilke av disse næringsstoffene finnes i den rå kiwien?",
    "options": [
      "Vitamin C",
      "Vitamin E",
      "Kostfiber",
      "Vitamin B12",
      "Vitamin D",
      "Laktose"
    ],
    "answer": [
      "Vitamin C",
      "Vitamin E",
      "Kostfiber"
    ],
    "hint": "Frukt kan inneholde både vannløselige og fettløselige vitaminer.",
    "explanation": "Kiwi inneholder vitamin C, vitamin E og kostfiber. Et fettløselig vitamin finnes ikke bare i matvarer med mye fett. Vanlig kiwi inneholder ikke vitamin B12, vitamin D eller laktose."
  }
];
