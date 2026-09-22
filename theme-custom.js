/* User-selected accent stays separate from per-wallet gradients and light/dark mode. */
const appThemePresets=[['Lime','#d7f36a'],['Teal','#66d8c1'],['Blue','#8db9ff'],['Rose','#f3a3b1'],['Violet','#c7a7f5'],['Amber','#f4c775']];
const validAppColor=value=>/^#[0-9a-f]{6}$/i.test(value||'');
function mixAppColor(first,second,ratio){
  const a=[1,3,5].map(i=>parseInt(first.slice(i,i+2),16)),b=[1,3,5].map(i=>parseInt(second.slice(i,i+2),16));
  return '#'+a.map((part,index)=>Math.round(part*(1-ratio)+b[index]*ratio).toString(16).padStart(2,'0')).join('');
}
function appLuminance(hex){
  const linear=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
function applyAppAccent(){
  const color=validAppColor(state.appAccent)?state.appAccent:'#d7f36a',dark=theme==='dark',luminance=appLuminance(color),strong=dark&&luminance<.4?mixAppColor(color,'#ffffff',.46):!dark&&luminance>.35?mixAppColor(color,'#000000',.24):color;
  document.documentElement.style.setProperty('--lime',color);
  document.documentElement.style.setProperty('--lime2',strong);
  document.documentElement.style.setProperty('--accent-ink',luminance>.179?'#172015':'#ffffff');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#171b16':'#f4f4ef');
}
const applyThemeBeforeCustom=applyTheme;
applyTheme=function(){applyThemeBeforeCustom();applyAppAccent()};
const settingsBeforeThemeColors=more;
more=function(){
  const chosen=validAppColor(state.appAccent)?state.appAccent.toLowerCase():'#d7f36a';
  const section=`<details class="card settings-block theme-colors"><summary>Theme color</summary><p>Choose Cashual's accent color. Wallet colors stay independent.</p><div class="theme-presets">${appThemePresets.map(([name,color])=>`<button type="button" class="theme-preset ${chosen===color?'selected':''}" data-theme-preset="${color}" aria-label="${name} theme" aria-pressed="${chosen===color}" title="${name}"><span style="background:${color}"></span><small>${name}</small></button>`).join('')}</div><label class="custom-theme-picker"><span>Custom color</span><input type="color" id="customThemeColor" value="${chosen}" aria-label="Custom theme color"><code>${chosen.toUpperCase()}</code></label></details>`;
  return settingsBeforeThemeColors().replace('<p class="app-version">',section+'<p class="app-version">');
};
function chooseAppColor(color){
  if(!validAppColor(color))return;
  state.appAccent=color.toLowerCase();save();applyAppAccent();
  document.querySelectorAll('[data-theme-preset]').forEach(button=>{const selected=button.dataset.themePreset===state.appAccent;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
  const picker=document.getElementById('customThemeColor');if(picker)picker.value=state.appAccent;
  const label=document.querySelector('.custom-theme-picker code');if(label)label.textContent=state.appAccent.toUpperCase();
}
document.addEventListener('click',event=>{const preset=event.target.closest('[data-theme-preset]');if(preset)chooseAppColor(preset.dataset.themePreset)});
document.addEventListener('change',event=>{if(event.target.id==='customThemeColor')chooseAppColor(event.target.value)});
const renderBeforeThemeColors=render;
render=function(){renderBeforeThemeColors();applyAppAccent()};
applyAppAccent();render();
