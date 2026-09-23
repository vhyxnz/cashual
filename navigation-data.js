/* Four destinations frame a prominent center action; secondary pages stay one tap away. */
const mobileDestinations=[['home','home','Home'],['transactions','transactions','Expenses']];
const mobileRightDestinations=[['wallets','wallet','Wallets']];
const extraDestinations=[['bills','receipt','Bills'],['loans','loan','Loans'],['calendar','calendar','Calendar'],['insights','insights','Insights'],['more','settings','Settings']];
const navLayout=()=>state.navLabels==='icons'?'icons':'both';
function drawMobileNav(){
  const current=location.hash.slice(1)||'home';
  document.body.dataset.currentRoute=current;
  document.body.dataset.showFab='no';
  const labels=navLayout()==='both';
  const item=([id,icon,name])=>`<button type="button" class="mobile-nav-choice ${current===id?'active':''}" data-mobile-route="${id}" aria-label="${name}" title="${name}">${svg(icon)}<span class="mobile-nav-label">${name}</span></button>`;
  mobileNav.classList.toggle('nav-icons-only',!labels);
  mobileNav.innerHTML=mobileDestinations.map(item).join('')+`<button type="button" class="mobile-nav-add" data-quick aria-label="Add item" title="Add item">${svg('add')}</button>`+mobileRightDestinations.map(item).join('')+`<button type="button" class="mobile-nav-choice ${extraDestinations.some(([id])=>id===current)?'active':''}" data-nav-more aria-label="More pages and settings" aria-expanded="false" aria-controls="mobileNavDrawer" title="More pages and settings">${svg('more')}<span class="mobile-nav-label">More</span></button><div class="mobile-nav-drawer" id="mobileNavDrawer" hidden><div class="mobile-nav-drawer-title">More pages</div>${extraDestinations.map(item).join('')}</div>`;
}
const moreBeforeNav=more;
more=function(){
  let markup=moreBeforeNav();
  const backup=`<details class="card settings-block"><summary>Import & export</summary><p>JSON is a full backup, including wallet images and preferences. CSV contains wallets, transactions, categories, bills, and loans, without images. Imports merge by record ID; keep backup files private.</p><div class="backup-actions"><div class="backup-type">Complete backup · JSON</div><div class="backup-row"><button type="button" class="data-action-row" data-export-json>${svg('download')}<span>Export JSON</span></button><label class="data-action-row file-label">${svg('upload')}<span>Import JSON</span><input id="jsonImport" type="file" accept=".json,application/json" hidden></label></div><div class="backup-type">Spreadsheet data · CSV</div><div class="backup-row"><button type="button" class="data-action-row" data-export>${svg('download')}<span>Export CSV</span></button><label class="data-action-row file-label">${svg('upload')}<span>Import CSV</span><input id="csvImport" type="file" accept=".csv,text/csv" hidden></label></div><div class="backup-utilities"><button type="button" class="data-action-row" data-persist-storage>${svg('archive')}<span>Keep offline data</span></button><button type="button" class="data-action-row" data-restore-local>${svg('clock')}<span>Restore previous local copy</span></button></div></div></details>`;
  markup=markup.replace(/<details class="card settings-block"><summary>Import & export<\/summary>[\s\S]*?<\/details>/,backup);
  const navSettings=`<details class="card settings-block"><summary>Navigation</summary><p>Choose how mobile shortcuts appear. Other pages are always available through More.</p><div class="toggle-grid"><label><input type="radio" name="navLayout" value="both" ${navLayout()==='both'?'checked':''}> Icon + title</label><label><input type="radio" name="navLayout" value="icons" ${navLayout()==='icons'?'checked':''}> Icon only</label></div></details>`;
  return markup.replace('<details class="card settings-block"><summary>Appearance & privacy',navSettings+'<details class="card settings-block"><summary>Appearance & privacy');
};
const renderBeforeNav=render;
render=function(){renderBeforeNav();drawMobileNav()};
document.addEventListener('click',event=>{
  const moreButton=event.target.closest('[data-nav-more]');
  if(moreButton){const drawer=document.getElementById('mobileNavDrawer');drawer.hidden=!drawer.hidden;moreButton.setAttribute('aria-expanded',String(!drawer.hidden));return}
  const destination=event.target.closest('[data-mobile-route]');
  if(destination){location.hash=destination.dataset.mobileRoute;render()}
},true);
document.addEventListener('change',event=>{
  if(event.target.name==='navLayout'){
    state.navLabels=event.target.value;
    save();
    drawMobileNav();
  }
});
render();
