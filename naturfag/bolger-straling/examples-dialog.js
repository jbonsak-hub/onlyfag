import {rainbowExampleHtml,mountRainbowExample} from './waves-rainbow.js?v=20261125-refraction1';
import {refractionExampleHtml,mountRefractionExample} from './refraction-examples.js?v=20261125-refraction1';

const styles=`<style>
.ex-launch{box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:16px;width:min(100%,32rem);margin:21px 0 0;padding:14px 17px 14px 20px;border:1px solid var(--green);border-radius:12px;background:var(--green);color:var(--surface);box-shadow:0 4px 11px #17302720;font:inherit;font-size:15px;font-weight:700;text-align:left;cursor:pointer}.ex-launch:hover{box-shadow:0 5px 15px #17302745}.ex-launch>span:last-child{flex:none;display:grid;place-items:center;width:28px;height:28px;border:1px solid currentColor;border-radius:50%;font-size:19px;font-weight:500;line-height:1}
dialog.ex-dialog{box-sizing:border-box;width:min(1120px,calc(100vw - 28px));max-width:1120px;max-height:calc(100dvh - 28px);padding:16px;background:var(--surface,#fff);color:var(--ink,#20352e);border:1px solid var(--line,#d9e3dc);border-radius:14px;overflow:auto}dialog.ex-dialog::backdrop{background:#132d27a8;backdrop-filter:blur(3px)}.ex-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:12px}.ex-heading h2{margin:0;font-size:20px;line-height:1.25}.ex-close{display:grid;place-items:center;width:32px;height:32px;padding:0;flex:none;font-size:24px;line-height:1;background:var(--bg,#f5f8f5);border:1px solid var(--line,#d9e3dc);border-radius:50%;color:var(--ink,#20352e);cursor:pointer}.ex-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 13px}.ex-tabs button{font:inherit;font-size:12px;padding:7px 11px;border:1px solid var(--line,#d9e3dc);border-radius:7px;background:var(--surface,#fff);color:var(--ink,#20352e);cursor:pointer}.ex-tabs button[aria-selected=true]{color:var(--surface,#fff);background:var(--green,#236448);border-color:var(--green,#236448)}.ex-tabs button:focus-visible,.ex-close:focus-visible,.ex-launch:focus-visible{outline:3px solid var(--green,#236448);outline-offset:3px}.ex-dialog [hidden]{display:none!important}.topic-page .ex-dialog .model.wvr-model,.topic-page .ex-dialog .model.re-model{margin:0;padding:0;border:0;box-shadow:none}.topic-page .ex-dialog .model-panel{justify-content:flex-start;gap:14px}.ex-panel{min-width:0}.ex-dialog .wvr-description,.ex-dialog .re-description{font-size:12px;line-height:1.65}
@media(max-width:800px){dialog.ex-dialog{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:13px}.ex-heading h2{font-size:18px}.ex-tabs{gap:5px}.ex-tabs button{padding:7px 8px;font-size:11px}.topic-page .ex-dialog .model.wvr-model,.topic-page .ex-dialog .model.re-model{grid-template-columns:1fr}.topic-page .ex-dialog .model-panel{border-left:0;border-top:1px solid var(--line,#d9e3dc);padding:12px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}.ex-dialog .wvr-description,.ex-dialog .wvr-source,.ex-dialog .re-description,.ex-dialog .re-readout,.ex-dialog .re-source{grid-column:1/-1}}
</style>`;

const examplesTitle='Flere modeller og eksempler for å forstå brytning';
const tabs=[['car','Lekebil på teppe'],['coast','Bølger mot stranda'],['prism','Prisme'],['rainbow','Regnbue']];
export const practicalExamplesDialogHtml=`<button type="button" class="ex-launch" id="ex-open" aria-haspopup="dialog" aria-controls="ex-dialog" aria-expanded="false"><span>${examplesTitle}</span><span aria-hidden="true">+</span></button>
<dialog class="ex-dialog wvr-dialog re-dialog" id="ex-dialog" aria-labelledby="ex-title"><div class="ex-heading"><h2 id="ex-title">${examplesTitle}</h2><button type="button" class="ex-close" id="ex-close" aria-label="Lukk modeller og eksempler">×</button></div><div class="ex-tabs" role="tablist" aria-label="Velg modell eller eksempel">${tabs.map(([id,label],i)=>`<button type="button" role="tab" data-ex-tab="${id}" id="ex-tab-${id}" aria-selected="${i===0}" aria-controls="${i<2?'ex-refraction-panel':'ex-light-panel'}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div><div class="ex-panel" id="ex-light-panel" role="tabpanel" aria-labelledby="ex-tab-prism" hidden>${rainbowExampleHtml}</div><div class="ex-panel" id="ex-refraction-panel" role="tabpanel" aria-labelledby="ex-tab-car">${refractionExampleHtml}</div></dialog>${styles}`;

export function mountPracticalExamplesDialog(root,api){
 const q=id=>root.querySelector('#'+id),dialog=q('ex-dialog'),open=q('ex-open'),close=q('ex-close');
 if(!dialog||!open||!close)return ()=>{};
 const light=mountRainbowExample(root,api),practical=mountRefractionExample(root,api);
 const lightPanel=q('ex-light-panel'),practicalPanel=q('ex-refraction-panel'),tablist=root.querySelector('.ex-tabs'),buttons=[...root.querySelectorAll('[data-ex-tab]')];
 let active='car',returnFocus=null;
 const select=(id,focus=false)=>{
  active=tabs.some(([name])=>name===id)?id:'car';const isLight=active==='prism'||active==='rainbow';
  lightPanel.hidden=!isLight;practicalPanel.hidden=isLight;
  for(const button of buttons){const selected=button.dataset.exTab===active;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&focus)button.focus();}
  const panel=isLight?lightPanel:practicalPanel;panel.setAttribute('aria-labelledby','ex-tab-'+active);
  if(isLight)light.selectMode?.(active);else practical.selectMode?.(active);
 };
 const show=()=>{returnFocus=dialog.ownerDocument?.activeElement||open;if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}open.setAttribute('aria-expanded','true');select('car');close.focus();};
 const onClosed=()=>{open.setAttribute('aria-expanded','false');if(returnFocus?.isConnected!==false)returnFocus?.focus?.();returnFocus=null;};
 const hide=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');onClosed();}};
 const cancel=event=>{event.preventDefault();hide();};
 const backdrop=event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)hide();};
 const choose=event=>{const button=event.target.closest('[data-ex-tab]');if(button&&tablist.contains(button))select(button.dataset.exTab);};
 const keyboard=event=>{const button=event.target.closest('[data-ex-tab]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=tabs.findIndex(([name])=>name===active),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[next][0],true);};
 open.addEventListener('click',show);close.addEventListener('click',hide);dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',onClosed);dialog.addEventListener('click',backdrop);tablist.addEventListener('click',choose);tablist.addEventListener('keydown',keyboard);select('car');
 return ()=>{open.removeEventListener('click',show);close.removeEventListener('click',hide);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',onClosed);dialog.removeEventListener('click',backdrop);tablist.removeEventListener('click',choose);tablist.removeEventListener('keydown',keyboard);light?.();practical?.();returnFocus=null;if(dialog.open)hide();};
}
