import {universeTimelineHtml, mountUniverseTimeline} from './cosmology-timeline.js?v=20261116-bigbang1';
import {bigBangEvidenceHtml, mountBigBangEvidence} from './bigbang-evidence.js?v=20261116-bigbang3';

const ceSvg = (label, contents, height = 300) => `<svg viewBox="0 0 760 ${height}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${contents}</svg>`;

const ceStyles = `<style>
.ce-widget svg{display:block;width:100%;height:auto;overflow:visible;background:var(--bg,#f6f8fb);border-radius:14px}
.ce-widget svg text{font-family:inherit;fill:var(--ink,#172b43);font-size:15px}
.ce-widget svg .ce-axis{stroke:#8b9aac;stroke-width:1}
.ce-widget svg .ce-faint{fill:var(--muted,#5d6e81);font-size:13px}
.ce-widget svg .ce-label{font-size:16px;font-weight:650}
.ce-widget .ce-value{font-weight:700;color:var(--green,#3369a4)}
.ce-widget .readout{display:block}
.ce-widget .ce-readout-row{display:block;margin:6px 0}
.ce-widget .ce-readout-row>span{display:block;color:var(--muted);font-size:11px}
.ce-widget .ce-readout-row>strong{display:block;color:var(--green);font-size:14px;font-weight:650}
.ce-blackbody-model .ce-bb-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.ce-blackbody-model .ce-bb-actions button:last-child{grid-column:1/-1}
.ce-blackbody-model .ce-auto-label{display:flex!important;align-items:center;gap:7px}
.ce-blackbody-model .ce-auto-label input{width:auto;flex-basis:auto;margin:0}
.ce-definitions{display:block!important;margin:12px 0}
.ce-definitions .concept{display:block;background:none;border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none;padding:9px 0}
.ce-definitions dt{font-size:13px;font-weight:650;color:var(--ink);margin:0 0 3px}
.ce-definitions dd{font-size:12px;margin:0;line-height:1.65}
.ce-definitions dd p{margin:0 0 4px}
.ce-bb-example{font-size:12px}
.ce-bb-example .calc-lines{margin:12px 0}
@media(max-width:1100px){.topic-page .ce-blackbody-model .model-panel .readout{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ce-blackbody-model .ce-bb-actions{grid-template-columns:1fr 1fr 1fr}.ce-blackbody-model .ce-bb-actions button:last-child{grid-column:auto}}
@media(max-width:520px){.topic-page .ce-blackbody-model .model-panel .readout{grid-template-columns:1fr}.ce-blackbody-model .ce-bb-actions{grid-template-columns:1fr 1fr}.ce-blackbody-model .ce-bb-actions button:last-child{grid-column:1/-1}}
.ce-widget .controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));align-items:end;gap:8px 16px;margin:8px 0;padding:8px 0}
.ce-widget .controls>.control{display:flex;flex-wrap:wrap;align-items:center;gap:3px 6px;min-width:0;max-width:none}
.ce-widget .control input,.ce-widget .control select{flex-basis:100%;margin:2px 0}
.ce-model-details{margin-top:8px;color:var(--muted,#5d6e81);font-size:11px}
.ce-model-details summary{cursor:pointer;width:fit-content;color:var(--green,#3369a4)}
.ce-model-details .model-note{margin:7px 0 0}
.ce-choice-row{display:flex;gap:.5rem;flex-wrap:wrap;margin:.8rem 0}
.ce-choice-row button{font:inherit;padding:.5rem .75rem;border:1px solid var(--line,#bacbd9);border-radius:9px;background:transparent;color:inherit;cursor:pointer}
.ce-choice-row button[aria-pressed="true"]{background:var(--green-soft,#e0edf8);border-color:var(--green,#4f81ad);color:var(--green,#183b62)}
.ce-timeline-description{padding:.8rem 1rem;border-left:3px solid #7395ba;background:rgba(108,145,182,.08);min-height:4.5rem}
.ce-star-stages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem;margin:.8rem 0}
.ce-star-stages div{padding:.8rem;border:1px solid var(--line,#d7e1ea);border-radius:12px}
.ce-star-stages strong{display:block;margin-bottom:.25rem}
.ce-life{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.ce-life article{padding:1rem;border-radius:13px;background:rgba(108,145,182,.08)}
.ce-life h4{margin:0 0 .5rem}
.ce-life p{margin:.35rem 0}
.ce-keyline{font-size:1.05rem;margin:.75rem 0}
@media(max-width:600px){.ce-life,.ce-star-stages{grid-template-columns:1fr}.ce-widget svg text{font-size:16px}.ce-widget svg .ce-faint{font-size:14px}}
</style>`;

// Keep model assumptions available without pushing the controls off screen.
const ceCompactSections = sections => sections.map(section => ({
  ...section,
  body: section.body.replace(/<p class="model-note">((?:Noen utvalgte|Skjematisk utsnitt|Skjematisk modell|Hele jorda)[\s\S]*?)<\/p>/g, (_, text) => {
    const summary = text.startsWith('Noen utvalgte') ? 'Om spektrallinjene og forskyvningen'
      : text.startsWith('Skjematisk utsnitt') ? 'Forenklinger i universmodellen'
      : text.startsWith('Hele jorda') ? 'Om energimodellen' : 'Skjematisk modell · forutsetninger';
    return `<details class="ce-model-details"><summary>${summary}</summary><p class="model-note">${text}</p></details>`;
  }).replace(/<div class="(?:concept-grid|ce-life)">([\s\S]*?)<\/div>/g, (_, inner) => `<dl class="concept-grid ce-definitions">${inner.replace(/<article(?: class="concept")?><h4>([\s\S]*?)<\/h4>([\s\S]*?)<\/article>/g, (match, term, definition) => `<div class="concept"><dt>${term}</dt><dd>${definition}</dd></div>`)}</dl>`)
}));

const ceFrac = (num, den) => `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
const ceReadoutRow = (label, value) => `<span class="ce-readout-row"><span>${label}</span><strong>${value}</strong></span>`;

const ceSigma = 5.670374419e-8;
const ceWien = 2897.771955;
const ceNiceUpper = value => {
  const decade = 10 ** Math.floor(Math.log10(value));
  const relative = value / decade;
  return (relative <= 1 ? 1 : relative <= 2 ? 2 : relative <= 3 ? 3 : relative <= 5 ? 5 : 10) * decade;
};

/** Physical surface emission: Mλ = πBλ, in W m⁻² µm⁻¹. */
export const blackbodyPhysics = Object.freeze({
  spectralExitance(wavelengthUm, temperature) {
    if (!(wavelengthUm > 0 && temperature > 0)) return 0;
    const wavelength = wavelengthUm * 1e-6;
    const h = 6.62607015e-34, c = 299792458, k = 1.380649e-23;
    const exponent = h * c / (wavelength * k * temperature);
    if (exponent > 700) return 0;
    return 2 * Math.PI * h * c * c / (wavelength ** 5 * Math.expm1(exponent)) * 1e-6;
  },
  totalExitance: temperature => ceSigma * temperature ** 4,
  peakWavelength: temperature => ceWien / temperature,
  visibleExitance(temperature) {
    let result = 0;
    const count = 120, step = .4 / count;
    for (let i = 0; i <= count; i++) {
      result += (i === 0 || i === count ? 1 : i % 2 ? 4 : 2) * blackbodyPhysics.spectralExitance(.38 + i * step, temperature);
    }
    return result * step / 3;
  },
  adaptiveLimits(current, temperature, force = false) {
    const peak = ceWien / temperature;
    const height = blackbodyPhysics.spectralExitance(peak, temperature) / 1e6;
    const xFraction = peak / current.xMax, yFraction = height / current.yMax;
    return {
      xMax: force || xFraction < .12 || xFraction > .65 ? ceNiceUpper(peak * 4.2) : current.xMax,
      yMax: force || yFraction < .2 || yFraction > .86 ? ceNiceUpper(height * 1.4) : current.yMax
    };
  },
  easing(current, target, dt) {
    const fraction = 1 - Math.exp(-Math.min(.1, Math.max(0, dt)) / .24);
    return Math.exp(Math.log(current) + (Math.log(target) - Math.log(current)) * fraction);
  }
});

const ceBlackbodyModel = `<div class="model ce-widget ce-blackbody-model" id="ce-blackbody-model"><h4>Temperatur endrer både kurvens topp og areal</h4><div id="ce-blackbody"></div><div class="controls"><label class="control" for="ce-temperature">Temperatur: <output id="ce-temperature-value" class="ce-value">5800 K</output><input id="ce-temperature" type="range" min="250" max="15000" value="5800" step="1"></label><label class="control" for="ce-temperature-preset">Sammenlikn kilder<select id="ce-temperature-preset"><option value="">Velg temperatur</option><option value="288">Jordoverflate · 288 K</option><option value="310">Menneskekropp · 310 K</option><option value="2800">Glødetråd · 2800 K</option><option value="5800" selected>Sola · 5800 K</option><option value="9900">Sirius A · 9900 K</option><option value="15000">Varm stjerne · 15 000 K</option></select></label><label class="control ce-auto-label" for="ce-auto-scale"><input id="ce-auto-scale" type="checkbox" checked>Automatisk skala</label><div class="ce-bb-actions"><button type="button" id="ce-bb-zoom-in">Zoom inn</button><button type="button" id="ce-bb-zoom-out">Zoom ut</button><button type="button" id="ce-bb-fit">Tilpass aksene</button></div></div><div id="ce-blackbody-readout" class="readout" aria-live="polite"></div><p id="ce-axes-status" class="model-note"></p><details class="ce-model-details ce-bb-example"><summary>Se beregningen og modellens forutsetninger</summary><div id="ce-blackbody-calculation" class="calc-lines"></div><p>Kurven beregnes med Plancks strålingslov. Den viser spektral utstråling fra en ideell svart overflate, M<sub>λ</sub> = πB<sub>λ</sub>. Arealet under hele kurven er den samlede effekten per overflateareal, σT⁴.</p><p>Kurven er <strong>ikke normalisert</strong>. Automatisk skala flytter aksenes tall; lik høyde på skjermen betyr derfor ikke lik effekt. Slå av automatisk skala for å sammenlikne temperaturer i samme utsnitt.</p><p>Kildene har samme tegnede størrelse. Egenutstrålt synlig lys bestemmer lysstyrken i figuren, med fast komprimering av skjermens store lysområde. Fargen er veiledende. Kalde objekter stråler i IR selv om de ikke gløder synlig; reflektert lys er ikke vist. Presetene er omtrentlige temperaturer, og virkelige overflater er ikke perfekte svarte strålere.</p></details></div>`;

const universeSections = [
  {
    title: 'Temperatur og strålingskurve',
    body: `${ceStyles}${ceBlackbodyModel}<p class="key">Varmere overflate gir kortere toppbølgelengde og større samlet utstråling per kvadratmeter. Legg merke til tallene på aksene når skalaen endres.</p>`
  },
  {
    title: 'Stjerner: masse bestemmer livsløpet',
    body: `<div class="concept-grid"><article class="concept"><h4>En stjerne lager energi ved fusjon</h4><p>I hovedserien smelter hydrogenkjerner sammen til helium. Litt av massen omdannes til energi. Tyngdekraften trekker innover; trykket fra varm gass og stråling virker utover.</p></article><article class="concept"><h4>En galakse er et stjernesystem</h4><p>Sola er én av Melkeveiens hundrevis av milliarder stjerner. Et <strong>lysår er en avstand</strong>: så langt lys går på ett år. Når vi ser langt ut, ser vi også tilbake i tid.</p></article></div><div class="ce-life"><article><h4>Stjerner med masse omtrent som sola</h4><p>Gassky → hovedseriestjerne → rød kjempe → gasslag støtes ut → <strong>hvit dverg</strong>.</p><p>Den hvite dvergen er en varm rest som gradvis kjøles. Sola blir ikke en supernova.</p></article><article><h4>Massive stjerner</h4><p>Gassky → hovedseriestjerne → superkjempe → mange ender i <strong>supernova</strong>.</p><p>Den kollapsede kjernen kan bli en <strong>nøytronstjerne eller et sort hull</strong>. Slutten avhenger blant annet av massen og massetapet.</p></article></div><p class="model-note">Forenklet oversikt. Massive stjerner lever vanligvis kortere fordi de bruker brenselet mye raskere. En rød stjerne kan være svært stor selv om overflaten er kjøligere enn på en blå stjerne.</p>`
  },
  {
    title: 'Lys avslører temperatur, grunnstoffer og bevegelse',
    body: `<div class="concept-grid"><article class="concept"><h4>Kurvens topp → temperatur</h4><p>Varmere overflate gir kortere toppbølgelengde. Blåhvite stjerner er varmere enn røde. Toppbølgelengden alene forteller ikke stjernens størrelse.</p></article><article class="concept"><h4>Linjemønster → grunnstoffer</h4><p>Atomer absorberer og sender ut bestemte bølgelengder. Mørke absorpsjonslinjer i stjernelyset viser hvilke grunnstoffer som finnes i gassen lyset har passert.</p></article><article class="concept"><h4>Linjenes forskyvning → bevegelse</h4><p>Ved lokal bevegelse <strong>fra oss</strong> blir bølgelengdene lengre: rødforskyvning. <strong>Mot oss</strong> gir kortere bølgelengder: blåforskyvning.</p></article></div><div class="model ce-widget"><h4>Samme fingeravtrykk, ny plassering</h4><div id="ce-lines"></div><div class="controls"><label class="control" for="ce-element">Grunnstoff<select id="ce-element"><option value="hydrogen">Hydrogen</option><option value="helium">Helium</option></select></label><label class="control" for="ce-shift">Spektral forskyvning z: <output id="ce-shift-value" class="ce-value">0,000</output><input id="ce-shift" type="range" min="-60" max="120" value="0" step="2"></label></div><p id="ce-lines-readout" class="readout"></p><p class="model-note">Noen utvalgte synlige linjer er vist. λ<sub>observert</sub> = (1 + z) · λ<sub>referanse</sub>. Her styrer du forskyvningen direkte, ikke en hastighet. For fjerne galakser skyldes mye av rødforskyvningen at rommet har utvidet seg mens lyset reiste.</p></div>`
  },
  {
    title: 'Et univers som utvider seg og kjøles ned',
    body: `<p class="key">Big Bang-modellen beskriver hvordan et tidlig, varmt og tett univers utvider seg og kjøles ned. Følg hvordan nye partikler og systemer kan dannes når forholdene endrer seg.</p>${universeTimelineHtml}`
  },
  {
    title: 'Tre spor etter Big Bang',
    body: bigBangEvidenceHtml
  }
];

const atmosphereSections = [
  {
    title: 'UV og ozon: et filter for innkommende stråling',
    body: `${ceStyles}<div class="concept-grid"><article class="concept"><h4>UVA</h4><p>Lengst bølgelengde av UV-typene. Når i stor grad bakken og trenger dypere ned i huden. Bidrar til hudaldring og hudskader.</p></article><article class="concept"><h4>UVB</h4><p>Kortere bølgelengde og mer energi per foton enn UVA. Det meste filtreres i atmosfæren. Viktig årsak til solbrenthet; bidrar også til dannelse av vitamin D.</p></article><article class="concept"><h4>UVC</h4><p>Kortest bølgelengde og mest energi per foton av de tre. UVC fra sola stoppes av oksygen og ozon i atmosfæren.</p></article></div><p class="key">Ozon er O<sub>3</sub>. Ozonlaget i stratosfæren absorberer UV. Et «ozonhull» er kraftig, sesongvis uttynning, særlig over Antarktis.</p><p>Ozon dannes og brytes ned naturlig. Klor fra blant annet KFK kan øke nedbrytningen. Internasjonale begrensninger på slike stoffer beskytter ozonlaget.</p>`
  },
  {
    title: 'Ozon og drivhusgasser gjør ulike jobber',
    body: `<div class="model ce-widget"><h4>Følg strålingens vei</h4><div id="ce-pathways"></div><div class="controls"><label class="control" for="ce-uv">UV-type<select id="ce-uv"><option value="UVA">UVA</option><option value="UVB" selected>UVB</option><option value="UVC">UVC</option></select></label><label class="control" for="ce-ozone">Ozon i stratosfæren: <output id="ce-ozone-value" class="ce-value">Vanlig mengde</output><input id="ce-ozone" type="range" min="0" max="100" value="100" step="10"></label><label class="control" for="ce-greenhouse">Absorpsjon av utgående IR: <output id="ce-greenhouse-value" class="ce-value">Middels</output><input id="ce-greenhouse" type="range" min="0" max="100" value="50" step="10"></label></div><p id="ce-pathways-readout" class="readout"></p><p class="model-note">Skjematisk modell: antall prikker og pilenes styrke viser sammenhenger, ikke målte transmisjoner eller en bestemt CO₂-mengde. IR-slideren gjelder ett absorpsjonsbånd ved uendret overflatetemperatur. Atmosfæren sender IR i alle retninger, ikke bare langs pilene.</p></div><div class="concept-grid"><article class="concept"><h4>Naturlig drivhuseffekt</h4><p>Bakken absorberer solstråling og sender ut infrarød varmestråling. Drivhusgasser absorberer deler av denne strålingen og sender IR videre i alle retninger, også nedover.</p></article><article class="concept"><h4>Forsterket drivhuseffekt</h4><p>Mer CO₂ og andre drivhusgasser endrer strålingsbalansen. Ved samme temperatur slipper mindre energi ut til verdensrommet. Jorda varmes til utstrålingen igjen balanserer den absorberte solenergien.</p></article></div><p class="model-note">Ozonlaget er ikke et lokk som holder på varme. Ozonlaget beskytter mot UV; drivhuseffekten handler først og fremst om jordas utgående IR. Ozon er samtidig selv en drivhusgass.</p>`
  },
  {
    title: 'Energibalanse og albedo',
    body: `<p class="key">Absorbert solenergi = utgående varmestråling → stabil middeltemperatur. Mer inn enn ut → oppvarming. Mer ut enn inn → avkjøling.</p><div class="model ce-widget"><h4>Bygg en strålingsbalanse</h4><div id="ce-budget"></div><div class="controls"><label class="control" for="ce-albedo">Albedo: <output id="ce-albedo-value" class="ce-value">30 %</output><input id="ce-albedo" type="range" min="10" max="70" value="30" step="1"></label><label class="control" for="ce-outgoing">Utgående varmestråling: <output id="ce-outgoing-value" class="ce-value">238 W/m²</output><input id="ce-outgoing" type="range" min="100" max="330" value="238" step="1"></label></div><p id="ce-budget-readout" class="readout" aria-live="polite"></p><p class="model-note">Hele jorda mottar i gjennomsnitt omtrent 340 W/m² fra sola øverst i atmosfæren. Her endrer du refleksjon og utgående stråling uavhengig. Modellen beregner energioverskudd, ikke en framtidig temperatur. Virkelig klima har skyer, hav og mange tilbakekoblinger.</p></div><div class="concept-grid"><article class="concept"><h4>Albedo = andelen som reflekteres</h4><p>Lys snø og is reflekterer mye. Mørkt hav absorberer mer. Mindre is kan derfor gi mer oppvarming og enda mer issmelting: en <strong>positiv tilbakekobling</strong>.</p></article><article class="concept"><h4>Flere påvirkninger</h4><p>Drivhusgasser, skyer, aerosoler og vulkanutbrudd påvirker balansen. Solaktivitet og jordas bane varierer også, på ulike tidsskalaer.</p></article></div>`
  },
  {
    title: 'Fra stråling til konsekvenser',
    body: `<div class="concept-grid"><article class="concept"><h4>UV har både nytte og skadevirkninger</h4><p>Noe UVB bidrar til vitamin D. For mye UV skader hud og øyne og øker risikoen for hudkreft. Brunfarge er en beskyttelsesreaksjon, ikke et tegn på at UV er ufarlig.</p></article><article class="concept"><h4>Et varmere hav tar større plass</h4><p>Havnivået øker når sjøvann varmes og utvider seg, og når landis smelter og tilfører vann. Smelting av flytende sjøis gir svært liten direkte havnivåendring.</p></article><article class="concept"><h4>Klima er mer enn middeltemperatur</h4><p>Oppvarming endrer blant annet nedbør, ekstremhendelser, naturmiljø og isdekke. Hvor store endringene blir, avhenger av utslipp og klimasystemets respons.</p></article></div>`
  }
];

const universeQuestions = [
  {id:'ce-u-01',type:'mcq',level:'Start',prompt:'Hva er et lysår?',choices:['Tiden lyset bruker fra sola til jorda','Avstanden lys tilbakelegger på ett år','Alderen til en stjerne','Hastigheten til lyset i et vakuum'],correct:1,answer:'Et lysår er en <strong>avstand</strong>, omtrent 9,46 billioner kilometer. Lysets reisetid gjør samtidig at vi ser fjerne objekter slik de var tidligere.'},
  {id:'ce-u-02',type:'open',level:'Start',prompt:'Forklar forskjellen på en stjerne og en galakse. Bruk sola og Melkeveien som eksempler.',hint:'Hva produserer lys, og hva er en samling av mange slike objekter?',answer:'Sola er en stjerne: en varm kule av gass/plasma som i hovedserien lager energi ved fusjon. Melkeveien er galaksen sola tilhører: et gravitasjonsbundet system av svært mange stjerner, gass, støv og mørk materie.'},
  {id:'ce-u-03',type:'mcq',level:'Start',prompt:'Hva er hovedkilden til solas energi nå?',choices:['Forbrenning av hydrogen med oksygen','Kjernespalting av uran','Fusjon der hydrogenkjerner bygger helium','Reflektert lys fra andre stjerner'],correct:2,answer:'Hydrogenkjerner fusjonerer til helium i solas indre. Litt av massen omdannes til energi. Dette er en kjernereaksjon, ikke vanlig forbrenning.'},
  {id:'ce-u-04',type:'open',level:'Bruk',prompt:'En elev sier: «Alle stjerner eksploderer og blir sorte hull.» Rett påstanden og beskriv to ulike hovedforløp.',answer:'Stjerner omtrent som sola blir røde kjemper, støter fra seg ytre lag og etterlater en hvit dverg. Massive stjerner kan ende i supernova og etterlate en nøytronstjerne eller et sort hull. Startmasse og massetap er avgjørende.'},
  {id:'ce-u-05',type:'mcq',level:'Bruk',prompt:'Stjerne A har toppbølgelengde 400 nm; stjerne B har toppbølgelengde 900 nm. Hva kan vi konkludere?',choices:['A har varmere overflate enn B','A er nødvendigvis større enn B','B har varmere overflate enn A','B må være nærmere jorda'],correct:0,answer:'Kortere toppbølgelengde betyr høyere overflatetemperatur. Kurvens topp alene avgjør verken stjernens størrelse eller avstand.'},
  {id:'ce-u-06',type:'number',level:'Bruk',prompt:'For en tilnærmet svart stråler er λ<sub>topp</sub> · T ≈ 2 898 000 nm·K. En stjerne har T = 6000 K. Finn toppbølgelengden i nm.',value:483,tolerance:2,unit:'nm',hint:'Del konstanten på temperaturen.',answer:`<div class="calc-lines"><div class="calc-row"><span class="calc-lhs">λ<sub>topp</sub></span><span class="calc-eq">=</span><span class="calc-rhs">${ceFrac('2 898 000 nm·K','6000 K')}</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">=</span><span class="calc-rhs"><strong>483 nm</strong></span></div></div>Stjernen sender likevel ut mange bølgelengder; fargen er ikke bare fargen ved toppen.`},
  {id:'ce-u-07',type:'open',level:'Bruk',prompt:'Hvorfor kan mørke linjer i et stjernespekter brukes til å finne grunnstoffer i stjernens atmosfære?',answer:'Atomene i gassen absorberer bestemte fotonenergier som passer til energiforskjellene mellom tillatte nivåer. Det gir mørke linjer ved bestemte bølgelengder. Hvert grunnstoff har et karakteristisk mønster som kan sammenliknes med laboratoriemålinger.'},
  {id:'ce-u-08',type:'mcq',level:'Bruk',prompt:'I et laboratoriemønster ligger en linje ved 486 nm. I et fjernt objekts spekter ligger samme linje ved 510 nm. Hva viser dette?',choices:['Grunnstoffet er blitt et annet grunnstoff','Blåforskyvning','Rødforskyvning','At objektet nødvendigvis er varmere'],correct:2,answer:'510 nm er lengre bølgelengde enn 486 nm: rødforskyvning. Hele linjemønsterets forskyvning brukes til å skille dette fra et annet grunnstoff.'},
  {id:'ce-u-09',type:'number',level:'Bruk',prompt:'Bruk λ<sub>observert</sub> = (1 + z) · λ<sub>referanse</sub>. En hydrogenlinje har referansebølgelengde 656 nm og rødforskyvning z = 0,10. Finn observert bølgelengde.',value:721.6,tolerance:1,unit:'nm',hint:'z = 0,10 betyr at bølgelengden øker med 10 %.',answer:'λ<sub>observert</sub> = 1,10 · 656 nm = <strong>721,6 nm</strong>. Grunnstoffets linjer er flyttet samlet mot lengre bølgelengder.'},
  {id:'ce-u-10',type:'open',level:'Utfordring',prompt:'«De røde stjernene er på vei bort fra oss, og de blå er på vei mot oss.» Hvorfor kan vi ikke bruke stjernens samlede farge på denne måten?',answer:'Stjernens samlede farge avhenger sterkt av overflatetemperaturen og kan også påvirkes av støv. Bevegelse bestemmes ved å sammenlikne <strong>plasseringen til kjente spektrallinjer</strong> med laboratoriets linjer. En naturlig blå stjerne kan ha et rødforskjøvet linjemønster.'},
  {id:'ce-u-11',type:'mcq',level:'Start',prompt:'Hva skjedde omtrent 380 000 år etter Big Bang?',choices:['Solsystemet ble dannet','Universet ble kaldt nok til at nøytrale atomer kunne dannes og lyset kunne reise langt','De første protonene ble til jern','Alle galakser sluttet å bevege seg'],correct:1,answer:'Elektroner ble bundet til atomkjerner. Dermed ble det langt færre frie elektroner som spredte lyset. Universet ble gjennomsiktig; vi observerer den gamle strålingen som kosmisk bakgrunnsstråling.'},
  {id:'ce-u-12',type:'open',level:'Bruk',prompt:'Nevn tre observasjoner som støtter Big Bang-modellen, og forklar kort hva hver av dem viser.',answer:'<strong>Rødforskyvning:</strong> På store skalaer utvider universet seg. <strong>Kosmisk bakgrunnsstråling:</strong> Gammelt, avkjølt lys passer med et varmt tidlig univers. <strong>Lette grunnstoffer:</strong> Mengdene hydrogen og helium samsvarer med kjernedannelse i den tidlige varme fasen.'},
  {id:'ce-u-13',type:'open',level:'Utfordring',prompt:'Bakgrunnsstrålingen ble sendt ut da universet var omtrent 3000 K. Hvorfor observeres den i dag som kald mikrobølgestråling?',answer:'Universet har utvidet seg mens fotonene har reist. Bølgelengdene er strukket og energien per foton er blitt lavere. Hele strålingsspekteret er rødforskjøvet og svarer i dag til omtrent 2,7 K.'},
  {id:'ce-u-14',type:'open',level:'Utfordring',prompt:'I en modell øker universets skalafaktor fra 1 til 2. Hva skjer med avstanden mellom fjerne, ubundne galaksegrupper og med bølgelengden til lys som reiser gjennom universet? Hva skjer med jordas størrelse?',answer:'I den forenklede modellen dobles galakseavstandene og lysets bølgelengde. Jorda dobles ikke. Elektromagnetiske og gravitasjonelle bindinger holder lokale systemer sammen; de følger ikke universets utvidelse på denne måten.'}
];

const atmosphereQuestions = [
  {id:'ce-a-01',type:'mcq',level:'Start',prompt:'Hvilken rekkefølge viser økende energi per UV-foton?',choices:['UVC → UVB → UVA','UVA → UVB → UVC','UVB → UVC → UVA','Alle UV-fotoner har samme energi'],correct:1,answer:'UVA har lengst bølgelengde og lavest fotonenergi, UVC kortest bølgelengde og høyest energi. Kortere λ betyr høyere f og E = hf.'},
  {id:'ce-a-02',type:'open',level:'Start',prompt:'Hva er ozon, og hvorfor har ozon i stratosfæren betydning for livet på jorda?',answer:'Ozon er O<sub>3</sub>: molekyler med tre oksygenatomer. Ozon absorberer mye skadelig UV, særlig UVB. Oksygen og ozon stopper solas UVC før den når bakken.'},
  {id:'ce-a-03',type:'mcq',level:'Bruk',prompt:'Hva betyr «ozonhull»?',choices:['Et område helt uten atmosfære','Et permanent hull i et fast ozonskall','Kraftig, sesongvis uttynning av ozonlaget','Et område med ekstra mye CO₂'],correct:2,answer:'Det er sterkt reduserte ozonmengder, særlig i den antarktiske våren. Ozonlaget er en del av atmosfæren, ikke et fast skall med et fysisk hull.'},
  {id:'ce-a-04',type:'open',level:'Bruk',prompt:'En elev sier: «UVA er ufarlig, for det er UVB som gir solbrenthet.» Vurder påstanden.',answer:'Påstanden er feil. UVB er en viktig årsak til solbrenthet, men UVA kan også skade huden, bidrar til hudaldring og øker risikoen for hudkreft. At UV har lavere fotonenergi betyr ikke at det er ufarlig.'},
  {id:'ce-a-05',type:'open',level:'Bruk',prompt:'Forklar kort hvordan sollys kan bidra både til vitamin D og til helseskade.',answer:'UVB bidrar til vitamin D-dannelse i huden. For stor UV-eksponering kan skade DNA, gi solbrenthet og øke risikoen for hudkreft. Skadevirkninger gjelder både sol og kunstige UV-kilder.'},
  {id:'ce-a-06',type:'mcq',level:'Start',prompt:'Hvilken beskrivelse treffer den naturlige drivhuseffekten best?',choices:['Atmosfæren produserer ekstra energi','Ozonlaget reflekterer all varme tilbake til jorda','Drivhusgasser absorberer deler av jordas IR-stråling og sender IR i alle retninger','CO₂ stopper alt synlig sollys'],correct:2,answer:'Bakken absorberer solenergi og sender ut IR. Drivhusgasser absorberer bestemte deler av IR-spekteret og emitterer IR i alle retninger. Energi skapes ikke i prosessen.'},
  {id:'ce-a-07',type:'open',level:'Bruk',prompt:'Forklar forskjellen mellom ozonlagets beskyttelse og drivhuseffekten. Ta med retningen og typen stråling.',answer:'Ozonlaget absorberer mye <strong>innkommende UV fra sola</strong>. Drivhuseffekten handler om absorpsjon og emisjon av <strong>utgående infrarød varmestråling fra jorda</strong>. De beskriver ulike strålingsprosesser, selv om ozon også er en drivhusgass.'},
  {id:'ce-a-08',type:'number',level:'Bruk',prompt:'Jorda mottar i en enkel global middelmodell 340 W/m² solstråling. Albedoen er 30 %. Hvor mye solenergi absorberes?',value:238,tolerance:1,unit:'W/m²',hint:'70 % absorberes når 30 % reflekteres.',answer:'Absorbert = 340 · (1 − 0,30) = <strong>238 W/m²</strong>. Resten, 102 W/m², reflekteres.'},
  {id:'ce-a-09',type:'number',level:'Bruk',prompt:'Absorbert solstråling er 238 W/m². Utgående varmestråling er 230 W/m². Hvor stort er energioverskuddet per kvadratmeter?',value:8,tolerance:.1,unit:'W/m²',hint:'Energioverskudd per sekund og areal = inn − ut.',answer:'238 − 230 = <strong>8 W/m²</strong>. Jordsystemet får da tilført energi. Dette er ikke nok informasjon til å beregne en bestemt temperaturøkning.'},
  {id:'ce-a-10',type:'mcq',level:'Bruk',prompt:'Hva skjer i utgangspunktet når lys is erstattes av mørkt hav, dersom alt annet er likt?',choices:['Albedoen øker og mindre solenergi absorberes','Albedoen synker og mer solenergi absorberes','Solstrålingen endres til UV','Ingen energiendring, siden bare fargen endres'],correct:1,answer:'Mørkt hav reflekterer mindre enn lys is. Mer solenergi absorberes. Det kan forsterke oppvarming og issmelting: en positiv tilbakekobling.'},
  {id:'ce-a-11',type:'open',level:'Utfordring',prompt:'Forklar hvorfor mer CO₂ kan gi oppvarming selv om solas innstråling er uendret. Begynn med en jord i strålingsbalanse.',answer:'Mer CO₂ øker atmosfærens absorpsjon i deler av IR-spekteret. Ved uendret temperatur blir mindre energi sendt ut til verdensrommet. Innstrålingen er da større enn utstrålingen. Jordsystemet varmes og utstrålingen øker til en ny balanse kan oppstå.'},
  {id:'ce-a-12',type:'open',level:'Bruk',prompt:'Gi to hovedforklaringer på at global oppvarming gir høyere havnivå. Hvorfor gir flytende sjøis en mye mindre direkte effekt?',answer:'Varmere sjøvann utvider seg, og smelting av landis tilfører vann til havet. Flytende sjøis fortrenger allerede omtrent den vannmengden den gir fra seg når den smelter. Derfor er den direkte havnivåeffekten svært liten.'},
  {id:'ce-a-13',type:'open',level:'Utfordring',prompt:'En modell viser at økt albedo kan balansere redusert varmetap. Kan dette alene brukes som bevis for at en bestemt klimamanipulasjon er trygg? Begrunn med modellens begrensninger.',answer:'Nei. En energibalanse viser bare ett gjennomsnittlig forhold mellom inn og ut. Den beskriver ikke regionale temperaturer, nedbør, ozon, økosystemer, havkjemi eller mange tilbakekoblinger. En balansert global energisum er ikke tilstrekkelig for å avgjøre alle konsekvenser.'},
  {id:'ce-a-14',type:'mcq',level:'Bruk',prompt:'Hva betyr positiv tilbakekobling i «mindre is → mer absorbert solenergi → varmere → mindre is»?',choices:['At utviklingen er ønskelig','At en endring forsterker seg selv','At temperaturen alltid øker lineært','At energien skapes av isen'],correct:1,answer:'«Positiv» betyr at den opprinnelige endringen forsterkes. Det betyr ikke at utviklingen er god, og det sier ikke at økningen må være lineær.'}
];

function mountUniverse(root, api) {
  const $ = s => root.querySelector(s);
  const temp = $('#ce-temperature');
  const shift = $('#ce-shift');
  const element = $('#ce-element');
  const lineSets = {hydrogen:[410.2,434.0,486.1,656.3],helium:[402.6,447.1,501.6,587.6,667.8]};
  const fmt = (n,d=0) => Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d,maximumFractionDigits:d});
  const autoScale = $('#ce-auto-scale'), preset = $('#ce-temperature-preset');
  const blackbodyScope='#ce-blackbody';
  const axes = {xMax:3,yMax:100};
  let axesTarget = {...axes}, lastBlackbodyTime = null, blackbodyDirty = true;
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const powerText = (value, extra = '') => {
    const scale = value >= 1e6 ? 1e6 : value >= 1e3 ? 1e3 : 1;
    const prefix = scale === 1e6 ? 'MW' : scale === 1e3 ? 'kW' : 'W';
    return `${fmt(value / scale, value / scale < 10 ? 2 : 1)} ${prefix} m<sup>−2</sup>${extra}`;
  };
  const superscript = value => String(value).replace(/[0-9-]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻');
  const axisNumber = value => {
    if (!value) return '0';
    if (value < .001 || value >= 10000) {
      const exponent = Math.floor(Math.log10(value));
      return `${fmt(value / 10 ** exponent,1)}·10${superscript(exponent)}`;
    }
    return fmt(value,value<1?3:value<10?2:1);
  };
  const sourceColor = temperature => {
    const stops = [[1000,[255,18,0]],[2000,[255,92,18]],[3000,[255,145,70]],[4000,[255,188,128]],[5800,[255,235,211]],[7000,[233,239,255]],[10000,[199,218,255]],[15000,[174,201,255]]];
    const index = stops.findIndex(([t])=>t>=temperature);
    if(index<=0)return stops[0][1];
    const [low,lower]=stops[index-1], [high,upper]=stops[index];
    const fraction=(temperature-low)/(high-low);
    return lower.map((n,i)=>Math.round(n+(upper[i]-n)*fraction));
  };
  const visibleMaximum = blackbodyPhysics.visibleExitance(15000);
  function updateBlackbodyTarget(force = false) {
    const T = Math.min(15000,Math.max(250,+temp.value || 5800));
    temp.value=String(T);
    if(autoScale.checked)axesTarget=blackbodyPhysics.adaptiveLimits(axesTarget,T,force);
    if(api.isPaused(blackbodyScope)){axes.xMax=axesTarget.xMax;axes.yMax=axesTarget.yMax;}
    blackbodyDirty=true;
    $('#ce-temperature-value').textContent=`${fmt(T)} K`;
    const peak=blackbodyPhysics.peakWavelength(T), spectralPeak=blackbodyPhysics.spectralExitance(peak,T), total=blackbodyPhysics.totalExitance(T);
    $('#ce-blackbody-readout').innerHTML=ceReadoutRow('Toppbølgelengde',`${fmt(peak*1000)} nm`)+ceReadoutRow('Spektral topp',powerText(spectralPeak,' µm<sup>−1</sup>'))+ceReadoutRow('Samlet utstråling',powerText(total));
    $('#ce-blackbody-calculation').innerHTML=`<div class="calc-row"><span class="calc-lhs">λ<sub>maks</sub></span><span class="calc-eq">=</span><span class="calc-rhs">${ceFrac('2,898 · 10⁶ nm·K',`${fmt(T)} K`)}</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">≈</span><span class="calc-rhs">${fmt(2898000/T)} nm</span></div><div class="calc-row"><span class="calc-lhs">${ceFrac('P','A')}</span><span class="calc-eq">=</span><span class="calc-rhs">σT⁴</span></div><div class="calc-row"><span class="calc-lhs"></span><span class="calc-eq">≈</span><span class="calc-rhs">${powerText(total)}</span></div>`;
  }
  function blackbody(t=0) {
    const dt=lastBlackbodyTime===null||api.isPaused(blackbodyScope)?0:Math.max(0,Math.min(.1,t-lastBlackbodyTime));
    lastBlackbodyTime=t;
    const moving=Math.abs(Math.log(axes.xMax/axesTarget.xMax))+Math.abs(Math.log(axes.yMax/axesTarget.yMax))>.0005;
    if(!blackbodyDirty&&!moving)return;
    if(reducedMotion||!moving){axes.xMax=axesTarget.xMax;axes.yMax=axesTarget.yMax;}
    else{axes.xMax=blackbodyPhysics.easing(axes.xMax,axesTarget.xMax,dt);axes.yMax=blackbodyPhysics.easing(axes.yMax,axesTarget.yMax,dt);}
    const T=+temp.value, peak=blackbodyPhysics.peakWavelength(T), peakMW=blackbodyPhysics.spectralExitance(peak,T)/1e6;
    const left=88,right=716,top=82,bottom=322;
    const x=value=>left+value/axes.xMax*(right-left);
    const y=value=>Math.max(-5000,bottom-value/axes.yMax*(bottom-top));
    const samples=[0,peak,...Array.from({length:521},(_,i)=>axes.xMax*i/520),...Array.from({length:200},(_,i)=>.001*Math.pow(Math.max(1,axes.xMax/.001),i/199))].filter(n=>n<=axes.xMax).sort((a,b)=>a-b);
    const curve=samples.map((nm,i)=>`${i?'L':'M'}${x(nm).toFixed(2)},${y(blackbodyPhysics.spectralExitance(nm,T)/1e6).toFixed(2)}`).join(' ');
    const tickX=Array.from({length:6},(_,i)=>axes.xMax*i/5),tickY=Array.from({length:6},(_,i)=>axes.yMax*i/5);
    const visibleLeft=Math.min(right,x(.38)),visibleRight=Math.min(right,x(.78));
    const bandWidths={uv:visibleLeft-left,visible:Math.max(0,visibleRight-visibleLeft),ir:right-visibleRight};
    const bandState=width=>width<.1?'utenfor':width<48?'smalt':'';
    const legendChip=(xx,width,label,range,state,fill)=>`<rect x="${xx}" y="43" width="${width}" height="31" rx="5" fill="${fill}"/><text x="${xx+width/2}" y="56" text-anchor="middle" style="fill:#263e3b;font-size:13px;font-weight:650">${label}${state?' · '+state:''}</text><text x="${xx+width/2}" y="69" text-anchor="middle" style="fill:#40534e;font-size:10.5px">${range}</text>`;
    const regionLegend=legendChip(88,120,'UV','λ &lt; 380 nm',bandState(bandWidths.uv),'#ddd1ed')+legendChip(214,182,'Synlig','380–780 nm',bandState(bandWidths.visible),'#d9eddf')+legendChip(402,133,'IR','λ &gt; 780 nm',bandState(bandWidths.ir),'#eedcc7');
    const regionLabels=[{left,width:bandWidths.uv,label:'UV'},{left:visibleLeft,width:bandWidths.visible,label:'Synlig'},{left:visibleRight,width:bandWidths.ir,label:'IR'}].filter(b=>b.width>=48).map(b=>`<text x="${b.left+b.width/2}" y="${top+19}" text-anchor="middle" style="fill:#e7eaf0;font-size:14px;font-weight:600">${b.label}</text>`).join('');
    const visible=blackbodyPhysics.visibleExitance(T);
    const brightness=Math.log1p(visible/1000)/Math.log1p(visibleMaximum/1000);
    const rgb=sourceColor(T).map(n=>Math.round(n*Math.pow(brightness,.58)));
    const glow=sourceColor(T).join(',');
    const peakVisible=peak<=axes.xMax&&peakMW<=axes.yMax;
    $('#ce-blackbody').innerHTML=ceSvg('Fysisk Planck-kurve med absolutte akseskalaer, synlig lysbånd og temperaturavhengig lysstyrke',`<defs><clipPath id="ce-bb-clip"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath><linearGradient id="ce-visible"><stop stop-color="#8d4bcd"/><stop offset=".23" stop-color="#4977e6"/><stop offset=".44" stop-color="#53bc89"/><stop offset=".65" stop-color="#f4d864"/><stop offset="1" stop-color="#de7467"/></linearGradient><radialGradient id="ce-source-glow"><stop stop-color="rgb(${glow})" stop-opacity="${brightness*.75}"/><stop offset="1" stop-color="rgb(${glow})" stop-opacity="0"/></radialGradient></defs><text class="ce-label" x="88" y="21">Spektral utstråling</text><text class="ce-faint" x="88" y="38">Absolutt effekt · ${autoScale.checked?'automatisk skala':'låste akser'}</text>${regionLegend}<rect x="540" y="3" width="110" height="67" rx="10" fill="#101a25"/><text x="595" y="17" text-anchor="middle" style="fill:#d7e0e7;font-size:12px">Egenutstrålt lys</text><circle cx="595" cy="43" r="${17+14*brightness}" fill="url(#ce-source-glow)"/><circle cx="595" cy="41" r="14" fill="rgb(${rgb.join(',')})" stroke="#8b9aaa" stroke-width=".7"/><text x="595" y="64" text-anchor="middle" style="fill:#d7e0e7;font-size:10.5px">${T<1000?'Ingen synlig glød':'Samme størrelse'}</text><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="#101a25"/><g clip-path="url(#ce-bb-clip)"><rect x="${left}" y="${top}" width="${bandWidths.uv}" height="${bottom-top}" fill="#70508f" opacity=".25"/><rect x="${visibleRight}" y="${top}" width="${bandWidths.ir}" height="${bottom-top}" fill="#a36f47" opacity=".22"/><rect x="${visibleLeft}" y="${top}" width="${Math.max(0,visibleRight-visibleLeft)}" height="${bottom-top}" fill="url(#ce-visible)" opacity=".22"/>${tickX.map(n=>`<path d="M${x(n)} ${top}V${bottom}" stroke="#506071" stroke-width=".7" opacity=".42"/>`).join('')}${tickY.map(n=>`<path d="M${left} ${y(n)}H${right}" stroke="#506071" stroke-width=".7" opacity=".42"/>`).join('')}<path d="M${left} ${bottom} ${curve.replace(/^M/,'L')} L${right} ${bottom}Z" fill="#e6a15b" fill-opacity=".11"/><path d="${curve}" fill="none" stroke="#eeaa62" stroke-width="3"/><path d="M${x(peak)} ${top}V${bottom}" stroke="#e2d8c9" stroke-dasharray="4 5" opacity=".65"/>${peakVisible?`<circle cx="${x(peak)}" cy="${y(peakMW)}" r="4.5" fill="#ffcc8a"/>`:''}${regionLabels}</g><path d="M${left} ${top}V${bottom}H${right}" stroke="#8192a4" fill="none"/>${tickX.map(n=>`<path d="M${x(n)} ${bottom}v5" stroke="#8192a4"/><text class="ce-faint" x="${x(n)}" y="347" text-anchor="middle">${axisNumber(n)}</text>`).join('')}${tickY.map(n=>`<text class="ce-faint" x="77" y="${y(n)+4}" text-anchor="end">${axisNumber(n)}</text>`).join('')}<text x="402" y="373" text-anchor="middle">Bølgelengde (µm)</text><text class="ce-faint" x="24" y="202" text-anchor="middle" transform="rotate(-90 24 202)">MW m⁻² µm⁻¹</text>`,380);
    $('#ce-axes-status').textContent=`${autoScale.checked?(moving?'Aksene tilpasses mykt. ':'Skalaen tilpasses automatisk. '):'Aksene er låst. '}${peakVisible?'':'Toppen er utenfor utsnittet. '}Endret akseskala betyr ikke samme utstrålte effekt. 1 µm = 1000 nm.`;
    blackbodyDirty=false;
  }
  function spectra() {
    const z = +shift.value/1000, lines = lineSets[element.value];
    const x = nm => 70+(nm-350)/450*630;
    const gradient = `<defs><linearGradient id="ce-lines-gradient"><stop stop-color="#93a6b9"/><stop offset=".066" stop-color="#93a6b9"/><stop offset=".067" stop-color="#9a5db5"/><stop offset=".222" stop-color="#5282c5"/><stop offset=".333" stop-color="#65ac95"/><stop offset=".511" stop-color="#e9cf74"/><stop offset=".6" stop-color="#df9b74"/><stop offset=".955" stop-color="#c06b70"/><stop offset=".956" stop-color="#93a6b9"/><stop offset="1" stop-color="#93a6b9"/></linearGradient></defs>`;
    $('#ce-lines').innerHTML = ceSvg('Referanse og observert absorpsjonsspekter med valgfri rødforskyvning',`${gradient}<text class="ce-label" x="70" y="22">Referanse i laboratoriet</text><rect x="70" y="34" width="630" height="38" rx="6" fill="url(#ce-lines-gradient)"/>${lines.map(n=>`<path d="M${x(n)} 34v38" stroke="#183149" stroke-width="3"/>`).join('')}<text class="ce-label" x="70" y="101">Observert spekter</text><rect x="70" y="113" width="630" height="38" rx="6" fill="url(#ce-lines-gradient)"/>${lines.map(n=>`<path d="M${x(n*(1+z))} 113v38" stroke="#183149" stroke-width="3"/>`).join('')}${[350,400,500,600,700,800].map(n=>`<text class="ce-faint" x="${x(n)}" y="176" text-anchor="middle">${n}</text>`).join('')}<text x="390" y="202" text-anchor="middle">Bølgelengde (nm)</text>`,214);
    $('#ce-shift-value').textContent=fmt(z,3);
    const direction = z>0?'Rødforskyvning (lengre bølger)':z<0?'Blåforskyvning (kortere bølger)':'Ingen forskyvning';
    $('#ce-lines-readout').innerHTML = ceReadoutRow('Forskyvning',direction)+ceReadoutRow('Første linje',`${fmt(lines[0],1)} nm → ${fmt(lines[0]*(1+z),1)} nm`)+ceReadoutRow('Grunnstoff',element.value==='hydrogen'?'Hydrogen':'Helium');
  }
  temp.addEventListener('input',()=>{preset.value=['288','310','2800','5800','9900','15000'].includes(temp.value)?temp.value:'';updateBlackbodyTarget();api.repaint(blackbodyScope);});
  preset.addEventListener('change',()=>{if(preset.value){temp.value=preset.value;updateBlackbodyTarget();api.repaint(blackbodyScope);}});
  autoScale.addEventListener('change',()=>{if(autoScale.checked)updateBlackbodyTarget(true);else{axesTarget={...axes};blackbodyDirty=true;}api.repaint(blackbodyScope);});
  const zoom=factor=>{autoScale.checked=false;axesTarget={xMax:Math.max(.05,Math.min(500,axes.xMax*factor)),yMax:Math.max(1e-9,Math.min(1e7,axes.yMax*factor))};if(api.isPaused(blackbodyScope)){axes.xMax=axesTarget.xMax;axes.yMax=axesTarget.yMax;}blackbodyDirty=true;api.repaint(blackbodyScope);};
  $('#ce-bb-zoom-in').addEventListener('click',()=>zoom(.5));
  $('#ce-bb-zoom-out').addEventListener('click',()=>zoom(2));
  $('#ce-bb-fit').addEventListener('click',()=>{autoScale.checked=true;updateBlackbodyTarget(true);api.repaint(blackbodyScope);});
  [shift,element].forEach(el=>el.addEventListener('input',spectra));
  updateBlackbodyTarget();spectra();
  const disposeBlackbody=api.onFrame(blackbody,blackbodyScope);
  const disposeTimeline=mountUniverseTimeline(root,api);
  const disposeEvidence=mountBigBangEvidence(root,api);
  return ()=>{disposeBlackbody?.();disposeTimeline?.();disposeEvidence?.();};
}

function mountAtmosphere(root,api){
  const $=s=>root.querySelector(s), uv=$('#ce-uv'),ozone=$('#ce-ozone'),greenhouse=$('#ce-greenhouse'),albedo=$('#ce-albedo'),outgoing=$('#ce-outgoing');
  const pathwaysScope='#ce-pathways';
  const fmt=n=>Number(n).toLocaleString('nb-NO',{maximumFractionDigits:1});
  function pathways(t){
    const kind=uv.value,oz=+ozone.value/100,gh=+greenhouse.value/100;
    const passing=kind==='UVA'?7:kind==='UVC'?0:Math.round(7-6*oz);
    const uvX=i=>65+i*34;
    const photons=Array.from({length:8},(_,i)=>{const y=52+((t*32+i*21)%156),stopped=i>=passing;return y<112||!stopped?`<circle cx="${uvX(i)}" cy="${y}" r="3.5" fill="#9c76bd" opacity=".85"/>`:`<circle cx="${uvX(i)}" cy="${116+(i%2)*5}" r="${3+Math.sin(t*4+i)}" fill="#9c76bd" opacity=".3"/>`;}).join('');
    const irDots=Array.from({length:7},(_,i)=>{const absorbed=i<Math.round(gh*7),phase=(t*.3+i/7)%1;const x=470+i*26;let y=212-phase*158;if(absorbed&&y<118&&i%2===0)y=118+(118-y);return `<circle cx="${x}" cy="${y}" r="3.6" fill="#ce8069"/>`;}).join('');
    const arrow='<path d="M-5 5L0 0L5 5" fill="none" stroke="currentColor" stroke-width="2"/>';
    $('#ce-pathways').innerHTML=ceSvg('Sammenlikning: UV filtreres av oksygen og ozon, mens drivhusgasser absorberer jordas infrarøde stråling',`<path d="M380 18V249" stroke="#c9d6e2" stroke-dasharray="4 6"/><text class="ce-label" x="190" y="25" text-anchor="middle">Inn fra sola: ${kind}</text><text class="ce-label" x="570" y="25" text-anchor="middle">Ut fra jorda: infrarødt</text><rect x="33" y="105" width="314" height="26" rx="13" fill="#9d83bc" opacity="${.1+.2*oz}"/><rect x="414" y="105" width="314" height="26" rx="13" fill="#d29a78" opacity="${.08+.22*gh}"/><text x="190" y="97" text-anchor="middle">O₂ + O₃ i atmosfæren</text><text x="570" y="97" text-anchor="middle">Drivhusgasser</text><path d="M33 218H347M414 218H728" stroke="#879d91" stroke-width="9"/><text x="190" y="244" text-anchor="middle">Jordoverflaten</text><text x="570" y="244" text-anchor="middle">Jordoverflaten</text>${Array.from({length:8},(_,i)=>`<path d="M${uvX(i)} 51V${i<passing?208:108}" stroke="#a886c4" opacity=".3" stroke-width="2"/>`).join('')}${photons}<path d="M450 49V207" stroke="#d4ac53" stroke-width="3" opacity=".7"/><text class="ce-faint" x="423" y="66" text-anchor="middle">Sollys</text><path d="M479 208V55M635 208V55" stroke="#ce8069" stroke-width="2" opacity="${1-gh*.7}"/><path d="M558 207V121Q594 118 594 200" fill="none" stroke="#ce8069" stroke-width="3" opacity="${.1+gh*.8}"/>${irDots}<g transform="translate(479 52)" style="color:#ce8069">${arrow}</g><g transform="translate(594 204) rotate(180)" style="color:#ce8069;opacity:${gh}">${arrow}</g><path d="M630 170H660" stroke="#ac978e"/><text class="ce-faint" x="668" y="165">IR også</text><text class="ce-faint" x="668" y="183">nedover</text>`,258);
    $('#ce-ozone-value').textContent=oz>.8?'Vanlig mengde':oz>.3?'Redusert mengde':'Sterkt redusert mengde';
    $('#ce-greenhouse-value').textContent=gh>.7?'Høy':gh>.3?'Middels':'Lav';
    const uvText=kind==='UVA'?'Det meste av UVA passerer ozonlaget.':kind==='UVC'?'UVC filtreres av oksygen og ozon.':oz>.7?'Mye UVB absorberes av ozonlaget.':'Mindre ozon → mer UVB gjennom.';
    $('#ce-pathways-readout').innerHTML=ceReadoutRow(kind,uvText)+ceReadoutRow('Infrarød stråling','Mer absorpsjon → mer IR også tilbake mot bakken.');
  }
  function budget(){
    const a=+albedo.value/100,out=+outgoing.value,absorbed=340*(1-a),reflected=340*a,net=absorbed-out;
    const bars=[['Solstråling inn',340,'#d8b35c'],['Reflektert',reflected,'#93a6b9'],['Absorbert',absorbed,'#6e9fb0'],['Varmestråling ut',out,'#cc8d79']];
    $('#ce-budget').innerHTML=ceSvg('Global strålingsbalanse: innkommende, reflektert, absorbert og utgående energi',`${bars.map(([label,v,c],i)=>`<text x="25" y="${42+i*42}" class="ce-label">${label}</text><rect x="205" y="${24+i*42}" width="${v/340*410}" height="25" rx="6" fill="${c}"/><text x="${Math.max(255,220+v/340*410)}" y="${42+i*42}">${fmt(v)} W/m²</text>`).join('')}<text class="ce-faint" x="205" y="208">Absorbert = innkommende · (1 − albedo)</text>`,221);
    $('#ce-albedo-value').textContent=`${fmt(a*100)} %`;
    $('#ce-outgoing-value').textContent=`${fmt(out)} W/m²`;
    const state=Math.abs(net)<.1?'Balanse: ingen netto energiendring.':net>0?'Energioverskudd → oppvarming.':'Energiunderskudd → avkjøling.';
    $('#ce-budget-readout').innerHTML=ceReadoutRow('Netto energistrøm',`${net>0?'+':''}${fmt(net)} W m<sup>−2</sup>`)+ceReadoutRow('Temperaturutvikling',state);
  }
  [uv,ozone,greenhouse].forEach(el=>el.addEventListener('input',()=>api.repaint(pathwaysScope)));
  [albedo,outgoing].forEach(el=>el.addEventListener('input',budget));
  budget();api.onFrame(pathways,pathwaysScope);
}

export const topics=[
  {id:'universet',title:'Stjerner og universet',kicker:'Lys som budbringer',summary:'Les stjernelys: temperatur, grunnstoffer og bevegelse. Følg stjerneliv og sporene etter et varmt, ungt univers.',sections:ceCompactSections(universeSections),terms:[
    {term:'Fusjon',definition:'Lette atomkjerner bindes sammen til tyngre kjerner. I stjerner kan dette frigjøre energi.'},
    {term:'Lysår',definition:'Avstanden lys tilbakelegger på ett år, omtrent 9,46 billioner kilometer.'},
    {term:'Galakse',definition:'Et gravitasjonsbundet system av stjerner, gass, støv og mørk materie.'},
    {term:'Hvit dverg',definition:'En tett, varm stjernerest etter en stjerne med lav eller middels masse. Den kjøles etter hvert som den stråler ut energi.'},
    {term:'Supernova',definition:'En svært kraftig stjerneeksplosjon. En mulig årsak er kjernekollaps i en massiv stjerne.'},
    {term:'Nøytronstjerne',definition:'En svært tett stjernerest som hovedsakelig består av nøytronrikt stoff.'},
    {term:'Sort hull',definition:'Et område i romtiden med en hendelseshorisont som ingenting, heller ikke lys, kan unnslippe innenfra.'},
    {term:'Absorpsjonsspekter',definition:'Et kontinuerlig spekter med mørke linjer der gass har absorbert bestemte bølgelengder.'},
    {term:'Rødforskyvning',definition:'At et kjent linjemønster observeres ved lengre bølgelengder. Kan blant annet skyldes bevegelse fra oss eller universets utvidelse.'},
    {term:'Kosmisk bakgrunnsstråling',definition:'Gammelt lys fra da universet ble gjennomsiktig omtrent 380 000 år etter Big Bang. Observeres nå hovedsakelig som mikrobølger.'}
  ],questions:universeQuestions,resources:[{label:'NASA: stjerner og stjerneliv',url:'https://science.nasa.gov/universe/stars/types/'},{label:'NASA: universets utvikling',url:'https://science.nasa.gov/universe/overview/'},{label:'PhET: utforsk strålingskurver',url:'https://phet.colorado.edu/en/simulations/blackbody-spectrum'}],mount:mountUniverse},
  {id:'atmosfaeren',title:'UV, ozon og drivhuseffekt',kicker:'Stråling møter atmosfæren',summary:'Skill ozonbeskyttelse fra drivhuseffekt, følg stråling gjennom atmosfæren og utforsk jordas energibalanse.',sections:ceCompactSections(atmosphereSections),terms:[
    {term:'UV-stråling',definition:'Elektromagnetisk stråling med kortere bølgelengder enn synlig fiolett lys. Deles gjerne i UVA, UVB og UVC.'},
    {term:'Ozon',definition:'O₃, et molekyl med tre oksygenatomer. Ozon i stratosfæren absorberer mye skadelig UV.'},
    {term:'Ozonhull',definition:'Kraftig, sesongvis reduksjon av ozonmengden i stratosfæren; særlig over Antarktis.'},
    {term:'KFK',definition:'Klorfluorkarboner. Klor fra disse langlivede stoffene kan bidra til nedbrytning av stratosfærisk ozon.'},
    {term:'Infrarød stråling',definition:'Elektromagnetisk stråling med lengre bølgelengder enn synlig rødt lys. Jorda sender ut mesteparten av sin varmestråling i IR.'},
    {term:'Drivhusgass',definition:'Gass som absorberer og emitterer infrarød stråling, for eksempel vanndamp, CO₂, metan og lystgass.'},
    {term:'Albedo',definition:'Andelen innkommende stråling som en overflate eller planet reflekterer.'},
    {term:'Energibalanse',definition:'Forholdet mellom tilført og avgitt energi. Energioverskudd varmer jordsystemet, mens energiunderskudd kjøler det.'},
    {term:'Positiv tilbakekobling',definition:'En prosess som forsterker den opprinnelige endringen. «Positiv» betyr forsterkende, ikke nødvendigvis ønskelig.'},
    {term:'Termisk ekspansjon',definition:'At et stoff vanligvis får større volum når temperaturen øker. Oppvarming av havet bidrar derfor til høyere havnivå.'}
  ],questions:atmosphereQuestions,resources:[{label:'WHO: UV-stråling og virkninger',url:'https://www.who.int/health-topics/ultraviolet-radiation'},{label:'PhET: drivhuseffekten',url:'https://phet.colorado.edu/en/simulations/greenhouse?locale=en'},{label:'UNEP: spørsmål og svar om ozonlaget',url:'https://ozone.unep.org/sites/default/files/2023-05/Final_20Qs%202022%20full%20document_26April2023_digital%20version.pdf'}],mount:mountAtmosphere}
];
