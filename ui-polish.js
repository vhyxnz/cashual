/* Compact icon-first controls; content cards and category choices keep their labels. */
Object.assign(icons,{
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v6m4-6v6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  week:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 14h2m3 0h2m3 0h1"/>',
  month:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4M8 14h3m2 0h3M8 17h3m2 0h3"/>',
  year:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4m-4 4v7m-3-3h6"/>'
});
const uiRouteIcons={home:'home',transactions:'transactions',wallets:'wallet',bills:'receipt',loans:'loan',calendar:'calendar',insights:'insights',more:'more'};
function iconForControl(button,label){
  const d=button.dataset;
  if(d.route)return button.classList.contains('text-btn')&&label.includes('All wallets')?'back':uiRouteIcons[d.route]||'arrow';
  if(d.kind)return ({expense:'expense',income:'income',transfer:'transfer',bill:'receipt',wallet:'wallet'})[d.kind]||'add';
  if(d.quickType)return d.quickType==='income'?'income':'expense';
  if(d.range)return ({daily:'clock',weekly:'week',monthly:'month',yearly:'year'})[d.range]||'calendar';
  if(d.filter)return ({all:'sliders',expense:'expense',income:'income',transfer:'transfer'})[d.filter]||'sliders';
  if(d.open)return ({expense:'expense',income:'income',transfer:'transfer',wallet:'add',bill:'receipt'})[d.open]||'add';
  if(d.enhanceForm||d.budgetAdd)return 'add';
  if(d.walletEdit||d.loanEdit||d.editTx||d.editBillId||d.budgetEdit||d.categoryEdit||d.swipeWalletEdit||d.swipeTxEdit)return 'edit';
  if(d.walletArchive||d.swipeArchive)return 'archive';
  if(d.swipeTxDelete)return 'trash';
  if(d.loanPayment||d.payBill)return 'check';
  if(d.walletTransfer)return 'transfer';
  if(d.walletFunds)return 'income';
  if(d.interestWallet)return 'income';
  if(d.exportJson!==undefined||d.export!==undefined)return 'download';
  if(d.restoreLocal!==undefined)return 'archive';
  if(d.persistStorage!==undefined)return 'archive';
  if(d.themeSetting!==undefined||button.id==='themeBtn')return 'moon';
  if(d.privacySetting!==undefined||button.id==='privacyBtn')return 'eye';
  if(d.quick!==undefined)return 'add';
  if(button.classList.contains('close')||d.quickClose!==undefined||label==='Cancel'||label==='Skip for now')return 'close';
  if((button.type==='submit'&&button.closest('form'))||/^Save|^Settle|^Mark paid/.test(label))return 'check';
  if(/^Transfer/.test(label))return 'transfer';
  if(/^Add/.test(label))return 'add';
  if(/^Edit/.test(label))return 'edit';
  if(/^View|^See/.test(label))return 'arrow';
  if(label==='Today')return 'calendar';
  return null;
}
function polishControls(){
  for(const button of document.querySelectorAll('button')){
    if(button.matches('.wallet-main,.profile-setting,.setting,.category-pill,.quick-category,.day,[data-wallet-privacy],[data-wallet-more],#themeBtn,#privacyBtn'))continue;
    const visibleText=button.textContent.trim().replace(/\s+/g,' ');
    const label=button.getAttribute('aria-label')||button.dataset.controlLabel||visibleText;
    const icon=iconForControl(button,label);
    if(!icon)continue;
    if(!button.dataset.controlLabel)button.dataset.controlLabel=label;
    button.setAttribute('aria-label',label);button.title=label;
    if(visibleText||!button.classList.contains('icon-only'))button.innerHTML=svg(icon);
    button.classList.add('icon-only');
  }
  for(const label of document.querySelectorAll('.file-label')){
    if(label.classList.contains('icon-only'))continue;
    const input=label.querySelector('input');if(!input)continue;
    const name=label.textContent.trim();label.setAttribute('aria-label',name);label.title=name;
    label.replaceChildren();label.insertAdjacentHTML('afterbegin',svg('upload'));label.append(input);label.classList.add('icon-only');
  }
  for(const action of document.querySelectorAll('.swipe-back')){
    if(action.classList.contains('icon-only'))continue;
    const label=action.textContent.trim();action.setAttribute('aria-label',label);action.title=label;
    action.innerHTML=svg(action.classList.contains('swipe-delete')?'trash':action.classList.contains('swipe-archive')?'archive':'edit');
    action.classList.add('icon-only');
  }
}
const settingsBeforePolish=more;
more=function(){return settingsBeforePolish()
  .replace(/<div class="page-head"><div><h2>Settings<\/h2><p>Personalize your dashboard and manage data\.<\/p><\/div><\/div>/,'')
  .replaceAll('class="card settings-block" open','class="card settings-block"')};
const renderBeforePolish=render;
render=function(){renderBeforePolish();polishControls()};
let polishScheduled=false;
new MutationObserver(()=>{if(polishScheduled)return;polishScheduled=true;queueMicrotask(()=>{polishScheduled=false;polishControls()})}).observe(document.body,{childList:true,subtree:true,characterData:true});
render();
