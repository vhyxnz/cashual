/* Small, reversible interactions layered over the existing local ledger. */
const originalInteractionRender=render;
render=function(){
  originalInteractionRender();
  eyebrow.hidden=!!location.hash&&location.hash!=='#home';
  if(eyebrow.hidden)eyebrow.textContent='';
  const actions=location.hash==='#wallet-detail'&&view.querySelector('.detail-actions');
  if(actions&&!actions.querySelector('[data-reconcile-wallet]'))actions.insertAdjacentHTML('beforeend',`<button class="ghost-btn reconcile-action" data-reconcile-wallet="${escC(selectedWallet)}">${svg('sliders')} Reconcile balance</button>`);
  const intro=view.querySelector('.expense-intro');
  if(intro&&!intro.querySelector('[data-repeat-last]')&&state.transactions.some(t=>t.type==='expense'))intro.querySelector('[data-open="expense"]')?.insertAdjacentHTML('beforebegin',`<button class="ghost-btn repeat-last" data-repeat-last>${svg('clock')} Repeat last</button>`);
  const backup=view.querySelector('.settings-block:has([data-export-json])');
  if(backup&&!backup.querySelector('.backup-status'))backup.querySelector('summary')?.insertAdjacentHTML('afterend',`<p class="backup-status">${state.lastBackupAt?'Last exported '+escC(new Date(state.lastBackupAt).toLocaleString()):'No backup recorded on this device yet.'} Your data remains on this device unless you export it.</p>`);
};

const oldQuickCategories=updateQuickCategories;
updateQuickCategories=function(){
  oldQuickCategories();
  const recent=[...state.transactions].filter(t=>t.type===quickType&&t.categoryId).sort((a,b)=>`${b.isoDate||''} ${b.time||''}`.localeCompare(`${a.isoDate||''} ${a.time||''}`));
  const seen=new Set(),order=[];
  for(const tx of recent)if(!seen.has(tx.categoryId)){seen.add(tx.categoryId);order.push(tx.categoryId)}
  const buttons=[...quickCategories.querySelectorAll('[data-quick-category]')];
  buttons.sort((a,b)=>{const ai=order.indexOf(a.dataset.quickCategory),bi=order.indexOf(b.dataset.quickCategory);return (ai<0?999:ai)-(bi<0?999:bi)}).forEach(button=>quickCategories.append(button));
};

const oldExportJson=exportJson,oldExportCsv=exportCsv;
function recordExport(){state.lastBackupAt=new Date().toISOString();save();const status=view.querySelector('.backup-status');if(status)status.textContent=`Last exported ${new Date(state.lastBackupAt).toLocaleString()}. Your data remains on this device unless you export it.`}
exportJson=function(){oldExportJson();recordExport()};
exportCsv=function(){oldExportCsv();recordExport()};

let undoAction=null,undoTimer=0;
const undoBar=document.createElement('div');undoBar.className='undo-bar';undoBar.setAttribute('role','status');document.body.append(undoBar);
function offerUndo(message,action){
  undoAction=action;clearTimeout(undoTimer);
  undoBar.innerHTML=`<span>${escC(message)}</span><button type="button" data-undo-action>Undo</button>`;
  undoBar.classList.add('show');
  undoTimer=setTimeout(()=>{undoAction=null;undoBar.classList.remove('show')},8000);
}
function deleteTransaction(id){
  const tx=state.transactions.find(t=>String(t.id)===String(id));
  if(!tx)return;
  if(tx.type==='expense'&&state.transactions.some(item=>item.type==='refund'&&String(item.refundOf)===String(tx.id)))return toastMsg('Delete linked refunds before deleting this purchase');
  if(tx.loanId||tx.transferId)return toastMsg('This linked entry cannot be deleted here');
  const removed=state.transactions.map((t,index)=>({t,index})).filter(({t})=>t.id===tx.id||tx.type==='transfer'&&t.transferId===tx.id);
  const balances=state.wallets.map(w=>({id:w.id,balance:w.balance}));
  if(tx.type==='transfer'){
    const from=state.wallets.find(w=>w.id===tx.fromId),to=state.wallets.find(w=>w.id===tx.toId);
    if(from)from.balance+=Math.abs(+tx.amount)+(+tx.fee||0);
    if(to)to.balance-=Math.abs(+tx.amount);
  }else{const wallet=txWallet(tx);if(wallet)wallet.balance-=+tx.amount}
  state.transactions=state.transactions.filter(t=>!removed.some(item=>item.t.id===t.id));
  const changes=balances.map(b=>({id:b.id,delta:(state.wallets.find(w=>w.id===b.id)?.balance||0)-b.balance})).filter(b=>b.delta);
  save();render();
  offerUndo('Transaction deleted',()=>{for(const item of removed.sort((a,b)=>a.index-b.index))state.transactions.splice(Math.min(item.index,state.transactions.length),0,item.t);for(const b of changes){const w=state.wallets.find(x=>x.id===b.id);if(w)w.balance-=b.delta}save();render()});
}
function showTransaction(id){
  const tx=state.transactions.find(t=>String(t.id)===String(id));if(!tx)return;
  const category=state.categories.find(c=>c.id===tx.categoryId);
  let dialog=document.getElementById('transactionDetail');if(!dialog){dialog=document.createElement('dialog');dialog.id='transactionDetail';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  dialog.innerHTML=`<div class="detail-sheet"><button type="button" class="detail-close" data-close-tx aria-label="Close details">${svg('close')}</button><p class="overline">Transaction details</p><h2>${escC(tx.title||category?.name||tx.category||'Transaction')}</h2><strong class="detail-figure">${money(+tx.amount||0)}</strong><dl><div><dt>Type</dt><dd>${escC(tx.type||'Transaction')}</dd></div><div><dt>Category</dt><dd>${escC(category?.name||tx.category||'—')}</dd></div><div><dt>Wallet</dt><dd>${escC(tx.wallet||state.wallets.find(w=>w.id===tx.walletId)?.name||'—')}</dd></div><div><dt>Date & time</dt><dd>${escC(tx.isoDate||tx.date||'—')}${tx.time?' · '+escC(tx.time):''}</dd></div><div><dt>Notes</dt><dd>${escC(tx.note||tx.notes||'None')}</dd></div></dl><div class="detail-footer">${['transfer','adjustment'].includes(tx.type)?'':`<button type="button" class="ghost-btn detail-action" data-detail-edit="${escC(tx.id)}">${svg('edit')} Edit</button>`}<button type="button" class="ghost-btn detail-action danger" data-detail-delete="${escC(tx.id)}">${svg('trash')} Delete</button></div></div>`;
  dialog.showModal();
}
function reconcileWallet(id){
  const wallet=state.wallets.find(w=>w.id===id);if(!wallet)return;
  let dialog=document.getElementById('reconcileDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='reconcileDialog';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  dialog.innerHTML=`<form class="detail-sheet" id="reconcileForm"><button type="button" class="detail-close" data-close-reconcile aria-label="Close">${svg('close')}</button><p class="overline">Balance reconciliation</p><h2>${escC(wallet.name)}</h2><p>Recorded balance: ${cash(wallet.balance)}</p><label class="field"><span>Actual balance</span><input name="balance" type="number" min="0" step="0.01" required value="${Number(wallet.balance).toFixed(2)}"></label><label class="field"><span>Reason for adjustment</span><input name="reason" required maxlength="180" placeholder="e.g. bank statement correction"></label><button class="primary-btn" type="submit">Save adjustment</button></form>`;
  dialog.dataset.walletId=id;dialog.showModal();dialog.querySelector('[name="balance"]').focus();
}

window.addEventListener('click',event=>{
  const target=event.target.closest('[data-swipe-tx-delete],[data-wallet-archive],[data-swipe-archive],[data-detail-delete]');
  if(!target)return;
  event.preventDefault();event.stopPropagation();
  if(target.dataset.walletArchive||target.dataset.swipeArchive){
    const wallet=state.wallets.find(w=>w.id===(target.dataset.walletArchive||target.dataset.swipeArchive));if(!wallet)return;
    wallet.archived=true;save();location.hash='wallets';render();
    offerUndo('Wallet archived',()=>{wallet.archived=false;save();render()});
  }else{document.getElementById('transactionDetail')?.close();deleteTransaction(target.dataset.swipeTxDelete||target.dataset.detailDelete)}
},true);
document.addEventListener('click',event=>{
  const row=event.target.closest('[data-tx-detail]');
  if(row&&!event.target.closest('button,[data-swipe-tx-delete]'))return showTransaction(row.dataset.txDetail);
  if(event.target.closest('[data-undo-action]')){const action=undoAction;undoAction=null;clearTimeout(undoTimer);undoBar.classList.remove('show');action?.();return}
  if(event.target.closest('[data-review-today]')){markDailyActivity();render();return}
  if(event.target.closest('[data-repeat-last]')){
    const tx=state.transactions.find(t=>t.type==='expense');if(!tx)return;
    openQuickEntry('expense');
    if(!quickEntryDialog.open)return;
    quickEntryForm.elements.amount.value=Math.abs(+tx.amount);
    if([...quickWallet.options].some(o=>o.value===tx.walletId))quickWallet.value=tx.walletId;
    if(state.categories.some(c=>c.id===tx.categoryId)){quickCategory=tx.categoryId;updateQuickCategories()}
    quickEntryForm.elements.title.value=tx.title||'';
    toastMsg('Review the details, then save');return;
  }
  if(event.target.closest('[data-close-tx]'))document.getElementById('transactionDetail')?.close();
  if(event.target.closest('[data-close-reconcile]'))document.getElementById('reconcileDialog')?.close();
  const edit=event.target.closest('[data-detail-edit]');if(edit){document.getElementById('transactionDetail')?.close();const tx=state.transactions.find(t=>t.id===edit.dataset.detailEdit);if(tx)enhanceForm(tx.type,tx.id)}
  const reconcile=event.target.closest('[data-reconcile-wallet]');if(reconcile)reconcileWallet(reconcile.dataset.reconcileWallet);
});
document.addEventListener('keydown',event=>{const row=event.target.closest('[data-tx-detail]');if(row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();showTransaction(row.dataset.txDetail)}});
document.addEventListener('submit',event=>{
  if(event.target.id!=='reconcileForm')return;
  event.preventDefault();const dialog=document.getElementById('reconcileDialog'),wallet=state.wallets.find(w=>w.id===dialog.dataset.walletId);
  const actual=Number(event.target.elements.balance.value),reason=event.target.elements.reason.value.trim();
  if(!wallet||!Number.isFinite(actual)||actual<0||!reason)return;
  const delta=Math.round((actual-wallet.balance)*100)/100;
  if(!delta){dialog.close();toastMsg('Balance already matches');return}
  wallet.balance=Math.round(actual*100)/100;
  const tx={id:crypto.randomUUID(),type:'adjustment',title:'Balance adjustment',amount:delta,walletId:wallet.id,wallet:wallet.name,category:'Balance adjustment',isoDate:currentDay(),time:new Date().toTimeString().slice(0,5),note:reason};
  state.transactions.unshift(tx);save();dialog.close();render();toastMsg('Balance reconciled');
});
render();
