/* Flatter settings, independent surface colors, and an in-app icon studio. */
const surfacePresets=[['Neutral','#f4f4ef'],['Sage','#e9efe5'],['Sand','#f2ebe0'],['Mist','#e9eef2'],['Lavender','#eee9f3'],['Blush','#f3e9e9']];
const iconPresets=[['Black','#111411'],['Gray','#626861'],['Purple','#6f48c9'],['Blue','#315f9e'],['Rose','#9d5265'],['Green','#1c3c30']];
function applyAppSurface(){
  const base=validAppColor(state.appSurface)?state.appSurface:'#f4f4ef',dark=theme==='dark';
  document.documentElement.style.setProperty('--paper',dark?mixAppColor(base,'#050705',.88):base);
  document.documentElement.style.setProperty('--card',dark?mixAppColor(base,'#090c09',.80):mixAppColor(base,'#ffffff',.72));
  document.documentElement.style.setProperty('--line',dark?mixAppColor(base,'#697068',.54):mixAppColor(base,'#5d645c',.78));
}
const appAccentBeforeSurface=applyAppAccent;
applyAppAccent=function(){appAccentBeforeSurface();applyAppSurface()};
const chooseAccentBeforeEditor=chooseAppColor;
chooseAppColor=function(color){chooseAccentBeforeEditor(color);const picker=document.getElementById('customThemeColor'),code=picker?.closest('.inline-color')?.querySelector('code');if(code)code.textContent=state.appAccent.toUpperCase()};
function iconInk(color){return appLuminance(color)>.34?'#162019':'#f2f6ec'}
function cashualIconSvg(color){
  const deep=mixAppColor(color,'#000000',.38),ink=iconInk(color),accent=validAppColor(state.appAccent)?state.appAccent:'#d7f36a';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="18" fill="url(#g)"/><path d="M45 20.5a19 19 0 1 0 0 23" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="M44 24c-2.6-2.5-6.2-3.8-10-3.8a12 12 0 0 0 0 24c3.8 0 7.4-1.3 10-3.8" fill="none" stroke="${accent}" stroke-width="1.8" opacity=".9" stroke-linecap="round"/><circle cx="47" cy="20" r="3" fill="${accent}"/></svg>`;
}
let cashualManifestUrl='';
function applyCashualIcon(){
  const color=validAppColor(state.appIconColor)?state.appIconColor:'#1c3c30',svgText=cashualIconSvg(color),url=`data:image/svg+xml,${encodeURIComponent(svgText)}`;
  document.querySelectorAll('.brand-logo,.mobile-brand-logo,.welcome-mark img').forEach(image=>image.src=url);
  const favicon=document.querySelector('link[rel="icon"]');if(favicon)favicon.href=url;
  const appRoot=new URL('./',location.href).href;
  const manifest={name:'Cashual — Money Tracker',short_name:'Cashual',description:'A private, local-first tracker for spending, wallets, bills, budgets, and goals.',start_url:appRoot,scope:appRoot,display:'standalone',background_color:validAppColor(state.appSurface)?state.appSurface:'#f4f4ef',theme_color:color,icons:[{src:url,sizes:'any',type:'image/svg+xml',purpose:'any maskable'}],shortcuts:[{name:'Add expense',short_name:'Expense',url:new URL('?action=expense#home',appRoot).href},{name:'Transfer funds',short_name:'Transfer',url:new URL('?action=transfer#wallets',appRoot).href}]};
  if(cashualManifestUrl)URL.revokeObjectURL(cashualManifestUrl);cashualManifestUrl=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}));
  const link=document.querySelector('link[rel="manifest"]');if(link)link.href=cashualManifestUrl;
}
function colorChoices(items,selected,attribute){return items.map(([name,color])=>`<button type="button" class="color-choice ${selected===color?'selected':''}" ${attribute}="${color}" aria-label="${name}" aria-pressed="${selected===color}" title="${name}"><span style="background:${color}"></span><small>${name}</small></button>`).join('')}
const settingsBeforeEditor=more;
more=function(){
  let markup=settingsBeforeEditor(),accent=validAppColor(state.appAccent)?state.appAccent:'#d7f36a',surface=validAppColor(state.appSurface)?state.appSurface:'#f4f4ef',icon=validAppColor(state.appIconColor)?state.appIconColor:'#1c3c30';
  const appearance=`<details class="settings-row appearance-editor" open><summary><span>${svg('sun')}</span><div><strong>Appearance & privacy</strong><small>Theme, colors, and balances</small></div></summary><div class="settings-row-content"><div class="appearance-quick"><button type="button" class="data-action-row" data-theme-setting>${svg(theme==='dark'?'sun':'moon')}<span>${theme==='dark'?'Use light mode':'Use dark mode'}</span></button><button type="button" class="data-action-row" data-privacy-setting>${svg('eye')}<span>Hide or show balances</span></button></div><div class="color-editor"><div><strong>Accent color</strong><small>Buttons, highlights, and the original green accent.</small></div><div class="color-choice-grid">${colorChoices(appThemePresets,accent,'data-theme-preset')}</div><label class="inline-color"><span>Custom accent</span><input id="customThemeColor" type="color" value="${accent}"><code>${accent.toUpperCase()}</code></label></div><div class="color-editor"><div><strong>Background tint</strong><small>Changes the app canvas and panels in both modes.</small></div><div class="color-choice-grid">${colorChoices(surfacePresets,surface,'data-surface-preset')}</div><label class="inline-color"><span>Custom background</span><input id="customSurfaceColor" type="color" value="${surface}"><code>${surface.toUpperCase()}</code></label></div></div></details>`;
  const iconStudio=`<details class="settings-row icon-studio"><summary><span>${svg('circle')}</span><div><strong>App icon</strong><small>Choose the Cashual icon color</small></div></summary><div class="settings-row-content"><div class="icon-preview"><img src="${`data:image/svg+xml,${encodeURIComponent(cashualIconSvg(icon))}`}" alt="Cashual icon preview"><div><strong>Icon studio</strong><small>The icon changes inside Cashual immediately.</small></div></div><div class="color-choice-grid icon-colors">${colorChoices(iconPresets,icon,'data-icon-preset')}</div><label class="inline-color"><span>Custom icon color</span><input id="customIconColor" type="color" value="${icon}"><code>${icon.toUpperCase()}</code></label><p class="settings-note">Installed Home Screen icons are controlled by the device. Some browsers apply the new choice after an app update or reinstall; your Cashual data remains stored separately.</p></div></details>`;
  markup=markup.replace(/<details class="card settings-block"><summary>Appearance & privacy<\/summary>[\s\S]*?<\/details>/,appearance);
  markup=markup.replace(/<details class="card settings-block theme-colors">[\s\S]*?<\/details>/,'');
  markup=markup.replace('<p class="app-version">',iconStudio+'<p class="app-version">');
  return markup.replaceAll('class="card settings-block','class="settings-row').replace('class="profile-setting card"','class="profile-setting settings-profile"').replace('class="settings-list shortcut-settings"','class="settings-shortcuts"');
};
function selectColor(selector,color){document.querySelectorAll(selector).forEach(button=>{const selected=button.dataset.themePreset===color||button.dataset.surfacePreset===color||button.dataset.iconPreset===color;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))})}
function setSurface(color){if(!validAppColor(color))return;state.appSurface=color.toLowerCase();save();applyAppSurface();selectColor('[data-surface-preset]',state.appSurface);const picker=document.getElementById('customSurfaceColor');if(picker)picker.value=state.appSurface;const code=picker?.closest('.inline-color')?.querySelector('code');if(code)code.textContent=state.appSurface.toUpperCase()}
function setCashualIcon(color){if(!validAppColor(color))return;state.appIconColor=color.toLowerCase();save();applyCashualIcon();selectColor('[data-icon-preset]',state.appIconColor);const picker=document.getElementById('customIconColor');if(picker)picker.value=state.appIconColor;const code=picker?.closest('.inline-color')?.querySelector('code');if(code)code.textContent=state.appIconColor.toUpperCase();const preview=document.querySelector('.icon-preview img');if(preview)preview.src=`data:image/svg+xml,${encodeURIComponent(cashualIconSvg(state.appIconColor))}`}
document.addEventListener('click',event=>{const surface=event.target.closest('[data-surface-preset]'),icon=event.target.closest('[data-icon-preset]');if(surface)setSurface(surface.dataset.surfacePreset);if(icon)setCashualIcon(icon.dataset.iconPreset)});
document.addEventListener('change',event=>{if(event.target.id==='customSurfaceColor')setSurface(event.target.value);if(event.target.id==='customIconColor')setCashualIcon(event.target.value)});
const renderBeforeSettingsEditor=render;
render=function(){renderBeforeSettingsEditor();applyAppSurface();applyCashualIcon()};
applyAppSurface();applyCashualIcon();render();
