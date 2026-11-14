# Module contract

Each content file is an ES module exporting `topics`, an array of topic objects. Only edit the file assigned to you.

Topic: `{id, title, kicker, summary, sections:[{title,body}], terms:[{term,definition}], questions:[...], resources:[{label,url}], mount(root,api)}`.

Section body is trusted HTML. Include diagram/widget HTML inside section bodies. Root has styles for `.concept-grid`, `.concept`, `.key`, `.model`, `.controls`, `.control`, `.readout`, `.model-note`, `.legend`, `.table-wrap`, `.compare-table`, `.steps`, `.mini-label`, `.wide`. You may include a single scoped `<style>` in the first section. Prefix all DOM IDs and selectors by your module file prefix. Use semantic labels and accessible SVG titles/descriptions. SVG viewBox typically `0 0 760 300`; widths responsive 100%. Tables need `.table-wrap`.

Questions: `{id,type:'mcq'|'number'|'open',prompt,choices:[strings],correct:0,answer:'explanation HTML',value:123,tolerance:0.1,unit:'m',hint:'...',level:'Start'|'Bruk'|'Utfordring'}`. mcq uses correct index; number uses value/tolerance; open uses answer. IDs globally unique. Put all necessary context/figures in prompt; do not refer to invisible original attachments. At least 10 varied questions per topic. Answers may use HTML and Unicode/sup/sub for equations. Do not require LaTeX library.

`mount(root,api)` optional. `api.onFrame(fn)` registers animation callback with elapsed seconds, called immediately and subsequently only for active module. `api.repaint()` calls registered callbacks at current time (use on sliders for paused animations). Root controls pause/speed/reduced motion and cleanup; no own RAF loops/timers. Event listeners on module elements can be normal; root removed on navigation. Return optional cleanup. No network dependencies or third-party JS. Animations accurately modeled or explicitly labeled as schematic. Controls must alter the actual displayed model. Provide useful initial static state.

Use nb language, concise explanations suitable Naturfag Vg1. No 'Modul 1' labels. Kicker is 2–4 words. Avoid old source mistakes. Resources may be links; no iframes needed. Preserve separation of Fagstoff/Oppgavebank in root. No placeholder content.
