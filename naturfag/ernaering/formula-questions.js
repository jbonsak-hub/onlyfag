// Glucose and fructose share a formula, so this is a many-to-one sorting task.
export const formulaQuestions = [
  {
    id: 'molecule-formula-names',
    topic: 'carbs',
    type: 'sort',
    level: 2,
    family: 'molecule-formulas',
    title: 'Molekyl og formel',
    prompt: 'Dra stoffnavnene til riktig molekylformel. Flere navn kan passe til samme formel.',
    groups: ['C₆H₁₂O₆', 'C₁₂H₂₂O₁₁', 'C₃H₆O₃'],
    items: [
      {label: 'Glukose', group: 'C₆H₁₂O₆'},
      {label: 'Fruktose', group: 'C₆H₁₂O₆'},
      {label: 'Sukrose', group: 'C₁₂H₂₂O₁₁'},
      {label: 'Melkesyre', group: 'C₃H₆O₃'}
    ],
    hint: 'Begynn med antallet karbonatomer. To av stoffene har samme antall atomer av hvert grunnstoff.',
    explanation: 'Glukose og fruktose har begge molekylformelen C₆H₁₂O₆, selv om atomene er plassert ulikt. Sukrose har formelen C₁₂H₂₂O₁₁, og melkesyre har formelen C₃H₆O₃. Derfor skal to navn ligge ved C₆H₁₂O₆.'
  }
];
