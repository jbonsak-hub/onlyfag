export function vindalooSolution(transition, drawing) {
  if (!transition) return '';
  const {from, to, energyAJ, frequencyHz, wavelengthNM} = transition;
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < 1 || from <= to) return '';
  if (![energyAJ, frequencyHz, wavelengthNM].every(value => Number.isFinite(value) && value > 0)) return '';

  const {fmt, hydrogenEnergy} = drawing;
  const upper = fmt(hydrogenEnergy(from), 4);
  const lower = fmt(hydrogenEnergy(to), 4);
  const [coefficient, exponent] = frequencyHz.toExponential(3).split('e');

  return `<div class="hs-solution-note">Med flere sifre enn i diagrammet</div>
    <div>ΔE = E<sub>${from}</sub> − E<sub>${to}</sub></div>
    <div>≈ [${upper} − (${lower})]&nbsp;aJ</div>
    <div>≈ <strong>${fmt(energyAJ, 3)}&nbsp;aJ</strong></div>
    <div>f = ΔE/h ≈ <strong>${fmt(Number(coefficient), 3)} · 10<sup>${Number(exponent)}</sup>&nbsp;Hz</strong></div>
    <div>λ = c/f ≈ <strong>${fmt(wavelengthNM, 1)}&nbsp;nm</strong></div>`;
}
