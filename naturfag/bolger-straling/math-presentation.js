export const frac=(num,den)=>`<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
const rows=(lhs,values)=>`<div class="calc-lines">${values.map((v,i)=>`<div class="calc-row"><span class="calc-lhs">${i?'':lhs}</span><span class="calc-eq">=</span><span class="calc-rhs">${v}</span></div>`).join('')}</div>`;
const worked={
 'wv-b3':()=>rows('f',[frac('v','λ'),frac('5 m/s','2 m'),'<strong>2,5 Hz</strong>']),
 'wv-b4':()=>rows('T',[frac(1,'f'),frac(1,'2,5 Hz'),'<strong>0,40 s</strong>']),
 'wv-b5':()=>rows('λ',[frac('v','f'),frac('345 m/s','440 Hz'),'<strong>0,784 m</strong> (avrundet)']),
 'wv-b6':()=>'<p>To bølgetopper per sekund gir f = 2 Hz.</p>'+rows('λ',[frac('v','f'),frac('4 m/s','2 Hz'),'<strong>2 m</strong>']),
 'wv-b9':()=>rows('s',['v · t','340 m/s · 3,0 s','<strong>1020 m</strong> ≈ 1 km']),
 'wv-b13':()=>'<p>Del tida på antallet svingninger for å finne tida for én svingning.</p>'
  +rows('T',[frac('10 s','15'),'<strong>0,67 s</strong> (avrundet)'])
  +'<p>Del antallet svingninger på tida for å finne frekvensen i hertz.</p>'
  +rows('f',[frac('15','10 s'),'<strong>1,5 Hz</strong>']),
 'wv-b14':()=>'<p>Fra en topp til nærmeste bunn er det en halv bølgelengde.</p>'
  +rows('λ',['2 · 1 m','<strong>2 m</strong>'])
  +'<p>Amplituden er utslaget fra likevektslinja opp til en topp.</p>'
  +rows('A',['<strong>3 m</strong>'])
  +rows('T',[frac('16 s',4),'<strong>4 s</strong>'])
  +rows('f',[frac(4,'16 s'),'<strong>0,25 Hz</strong>'])
  +rows('v',['f · λ','0,25 Hz · 2 m','<strong>0,50 m/s</strong>']),
 'wv-f1':()=>rows('Refleksjonsvinkel',['Innfallsvinkel','<strong>35°</strong>']),
 'wv-f6':()=>rows('A<sub>sum</sub>',['A₁ + A₂','3 cm + 3 cm','<strong>6 cm</strong>']),
 'em-03':()=>rows('λ',[frac('c','f'),frac('3,00 · 10<sup>8</sup> m/s','100 · 10<sup>6</sup> Hz'),'<strong>3,00 m</strong>']),
 'em-04':()=>rows('f',[frac('c','λ'),frac('3,00 · 10<sup>8</sup> m/s','5,00 · 10<sup>−7</sup> m'),'<strong>6,00 · 10<sup>14</sup> Hz</strong>']),
 'em-17':()=>rows('t',[frac('s','v'),frac('150 000 000 km','300 000 km/s'),'<strong>500 s</strong>'])
  +'<p>500 s er <strong>8 min 20 s</strong>. Så lenge ville det ta før det siste sollyset nådde jorda.</p>',
 'atom-05':()=>rows('E<sub>foton</sub>',['−0,24 aJ − (−0,54 aJ)','<strong>0,30 aJ</strong>'])+'<p>Atomet mister energi; fotonet får positiv energi.</p>',
 'atom-12':()=>rows('E',['h · f','6,63 · 10<sup>−34</sup> J s · 5,0 · 10<sup>14</sup> Hz','3,315 · 10<sup>−19</sup> J','<strong>3,3 · 10<sup>−19</sup> J</strong> (avrundet)']),
 'com-04':()=>rows('Antall biter',['5 · 8','<strong>40 biter</strong>']),
 'com-10':()=>rows('t',[frac('s','c'),frac('36 000 km','300 000 km/s'),'<strong>0,12 s</strong>'])+'<p>Andre deler av forbindelsen kan gi ekstra forsinkelse.</p>',
 'ra-q2':()=>rows('N',['A − Z','220 − 85','<strong>135 nøytroner</strong>']),
 'ra-q9':()=>'<p>40 → 20 → 10 → 5 g: tre halveringer.</p>'+rows('t',['3 · T½','3 · 5730 år','<strong>17 190 år</strong>']),
 'ra-q10':()=>rows('Antall halveringer',[frac('12 døgn','4 døgn'),'3'])+rows('Forventet antall',[frac('3000','2³'),'<strong>375 kjerner</strong>'])+'<p>Faktisk antall kan avvike fordi henfall er tilfeldig.</p>',
 'ra-q11':()=>'<p>100 → 50 → 25 → 12,5 → 6,25 %: fire halveringer.</p>'+rows('t',['4 · T½','4 · 5730 år','<strong>22 920 år</strong>']),
 'ra-q16':()=>rows('Mengde etter 15 halveringer',['1000 g · (½)<sup>15</sup>','<strong>0,0305 g</strong> ≈ 31 mg'])+'<p>Stoffet er omdannet, ikke forsvunnet.</p>',
 'sv-q7':()=>rows('Forventet antall henfall',['250 henfall/s · 20 s','<strong>5000 henfall</strong>'])+'<p>Dette er ikke antall registrerte tellinger i en vilkårlig detektor.</p>',
 'sv-q8':()=>rows('Dose',['2,5 mSv · '+frac('1000 µSv','1 mSv'),'<strong>2500 µSv</strong>']),
 'ce-u-06':()=>rows('λ<sub>topp</sub>',[frac('2 898 000 nm K','6000 K'),'<strong>483 nm</strong>'])+'<p>Stjernen sender ut mange bølgelengder; fargen bestemmes ikke bare av toppen.</p>',
 'ce-u-09':()=>rows('λ<sub>observert</sub>',['(1 + z) · λ<sub>referanse</sub>','1,10 · 656 nm','<strong>721,6 nm</strong>'])+'<p>Linjemønsteret er forskjøvet mot lengre bølgelengder.</p>',
 'ce-a-08':()=>rows('Absorbert effekt per areal',['340 W/m² · (1 − 0,30)','<strong>238 W/m²</strong>'])+'<p>Resten, 102 W/m², reflekteres.</p>',
 'ce-a-09':()=>rows('Energioverskudd per tid og areal',['238 W/m² − 230 W/m²','<strong>8 W/m²</strong>'])+'<p>Jordsystemet får tilført energi. Dette bestemmer ikke alene hvor stor temperaturøkningen blir.</p>'
};
export function solutionHtml(question){return worked[question.id]?worked[question.id]():question.answer;}
