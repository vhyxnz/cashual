/* Split purchases and linked refunds keep one wallet movement per real event. */
const CASHUAL_RELEASE='1.0.2';
const expenseCategories=()=>state.categories.filter(c=>c.group!=='income');
const cents=n=>Math.round((+n||0)*100);
function cashualParts(tx){
  if(tx.type==='expense'){
    if(Array.isArray(tx.splits)&&tx.splits.length)return tx.splits.map(part=>({categoryId:part.categoryId,amount:+part.amount||0}));
    return [{categoryId:tx.categoryId||'',category:tx.category||'Other',amount:Math.abs(+tx.amount||0)}];
  }
  if(tx.type!=='refund')return [];
  const amount=Math.abs(+tx.amount||0),original=state.transactions.find(item=>String(item.id)===String(tx.refundOf));
  if(tx.refundCategoryId)return [{categoryId:tx.refundCategoryId,amount:-amount}];
  const parts=original?.type==='expense'?cashualParts(original):[{categoryId:tx.categoryId||'',category:tx.category||'Other',amount}];
  const total=parts.reduce((sum,part)=>sum+Math.max(0,cents(part.amount)),0);
  if(!total)return [{categoryId:tx.categoryId||'',category:tx.category||'Other',amount:-amount}];
  let allocated=0;
  return parts.map((part,index)=>{const value=index===parts.length-1?cents(amount)-allocated:Math.round(cents(amount)*cents(part.amount)/total);allocated+=value;return {...part,amount:-value/100}});
}
function cashualNetExpense(items){return items.reduce((sum,tx)=>sum+(tx.type==='expense'?Math.abs(+tx.amount||0):tx.type==='refund'?-Math.abs(+tx.amount||0):0),0)}
function cashualCategoryName(part){return state.categories.find(c=>c.id===part.categoryId)?.name||part.category||'Other'}
function cashualCategoryMatch(part,id){const category=state.categories.find(c=>c.id===id);return part.categoryId===id||!part.categoryId&&part.category===category?.name}

const categoryPieBeforeSplits=categoryPie;
categoryPie=function(){
  const entries=monthEntries().filter(tx=>tx.type==='expense'||tx.type==='refund');
  if(!entries.length)return categoryPieBeforeSplits();
  const sums=new Map();
  for(const tx of entries)for(const part of cashualParts(tx)){
    const key=part.categoryId||part.category||'Other',category=state.categories.find(c=>c.id===part.categoryId),prior=sums.get(key)||{name:cashualCategoryName(part),color:category?.color||'#9ca39a',icon:category?.icon||'circle',amount:0};
    prior.amount+=part.amount;sums.set(key,prior);
  }
  const positive=[...sums.values()].filter(item=>item.amount>0.005).sort((a,b)=>b.amount-a.amount),gross=positive.reduce((sum,item)=>sum+item.amount,0),net=cashualNetExpense(entries),credits=[...sums.values()].filter(item=>item.amount<-.005).reduce((sum,item)=>sum-Math.min(0,item.amount),0);
  if(!gross)return `<div class="empty">${net<0?'Refunds exceeded spending this month':'No net spending this month'}</div>`;
  let running=0;
  const gradient=positive.map(item=>{const start=running;running+=item.amount/gross*100;return `${item.color} ${start}% ${running}%`}).join(',');
  return `<div class="pie-layout"><div class="pie" style="background:conic-gradient(${gradient})"><div><strong>${net<0?'−':''}${cash(net)}</strong><small>Net spent</small></div></div><div class="pie-legend">${positive.map(item=>`<div><span style="background:${item.color}">${userIcon(item.icon)}</span><strong>${escC(item.name)}</strong><b>${cash(item.amount)}</b></div>`).join('')}${credits?`<small class="refund-credit-note">${cash(credits)} in refund credits offsets the category chart.</small>`:''}</div></div>`;
};
budgetSpent=function(b){
  const [from,to]=budgetWindow(b),total=state.transactions.filter(tx=>['expense','refund'].includes(tx.type)&&tx.isoDate>=from&&tx.isoDate<to).reduce((sum,tx)=>sum+cashualParts(tx).filter(part=>!b.categoryId||cashualCategoryMatch(part,b.categoryId)).reduce((partSum,part)=>partSum+part.amount,0),0);
  return Math.max(0,total);
};
const homeBeforeRefundSigns=home,insightsBeforeRefundSigns=insights,walletViewBeforeRefundSigns=walletView;
home=function(){
  const markup=homeBeforeRefundSigns(),monthly=monthStats();
  return monthly.expenses<0?markup.replaceAll(`<span>Expenses</span><strong>${cash(monthly.expenses)}</strong>`,`<span>Expenses after refunds</span><strong>−${cash(monthly.expenses)}</strong>`):markup;
};
insights=function(){
  const markup=insightsBeforeRefundSigns(),monthly=monthStats();
  return monthly.expenses<0?markup.replaceAll(`<span>Expenses</span><strong>${cash(monthly.expenses)}</strong>`,`<span>Expenses after refunds</span><strong>−${cash(monthly.expenses)}</strong>`):markup;
};
walletView=function(){
  const wallet=state.wallets.find(item=>item.id===selectedWallet),markup=walletViewBeforeRefundSigns();
  if(!wallet)return markup;
  const entries=state.transactions.filter(tx=>tx.walletId===wallet.id||tx.wallet===wallet.name),gross=entries.filter(tx=>tx.type==='expense').reduce((sum,tx)=>sum+Math.abs(+tx.amount||0),0),net=cashualNetExpense(entries);
  return markup.replace(`<span>Expenses</span><strong>${cash(gross)}</strong>`,`<span>Expenses after refunds</span><strong>${net<0?'−':''}${cash(net)}</strong>`);
};

const expenseFormBeforeSplit=enhanceForm;
enhanceForm=function(kind,id=''){
  if(kind==='refund')return toastMsg('Delete and re-record a refund to change it');
  expenseFormBeforeSplit(kind,id);
  if(kind!=='expense'||!formDialog.open)return;
  const tx=state.transactions.find(item=>String(item.id)===String(id));
  const amountField=formFields.querySelector('[name="amount"]')?.closest('label');
  if(!amountField)return;
  amountField.insertAdjacentHTML('afterend',`<div class="split-editor"><label class="split-toggle"><input type="checkbox" data-split-toggle ${tx?.splits?.length?'checked':''}> Split across categories</label><div class="split-panel" ${tx?.splits?.length?'':'hidden'}><p>One wallet deduction, multiple category portions.</p><div class="split-rows"></div><button type="button" class="ghost-btn split-add" data-split-add>${svg('add')} Add category</button><small class="split-total" role="status"></small></div></div>`);
  if(tx?.splits?.length)tx.splits.forEach(part=>appendSplitRow(part));
  updateSplitTotal();
};
function appendSplitRow(part={}){
  const rows=formFields.querySelector('.split-rows');if(!rows)return;
  const choices=expenseCategories();
  rows.insertAdjacentHTML('beforeend',`<div class="split-row"><select aria-label="Split category">${choices.map(c=>`<option value="${escC(c.id)}" ${c.id===part.categoryId?'selected':''}>${escC(c.name)}</option>`).join('')}</select><input type="number" aria-label="Split amount" min="0.01" step="0.01" placeholder="0.00" value="${part.amount||''}"><button type="button" data-split-remove aria-label="Remove split" title="Remove split">${svg('close')}</button></div>`);
  if(!part.categoryId&&choices.length>1)rows.lastElementChild.querySelector('select').selectedIndex=Math.min(rows.children.length-1,choices.length-1);
  updateSplitTotal();
}
function updateSplitTotal(){
  const panel=formFields.querySelector('.split-panel'),status=panel?.querySelector('.split-total');if(!status)return;
  const amount=cents(entryForm.elements.amount?.value),sum=[...panel.querySelectorAll('.split-row input')].reduce((total,input)=>total+cents(input.value),0),left=amount-sum;
  status.textContent=`${cash(sum/100)} allocated · ${left<0?`${cash(-left/100)} over`:`${cash(left/100)} remaining`}`;
  status.classList.toggle('split-mismatch',left!==0);
}
document.addEventListener('change',event=>{
  if(event.target.matches('[data-split-toggle]')){
    const panel=formFields.querySelector('.split-panel');panel.hidden=!event.target.checked;
    if(event.target.checked&&!panel.querySelector('.split-row')){
      const amount=cents(entryForm.elements.amount.value);appendSplitRow({amount:amount?Math.floor(amount/2)/100:''});appendSplitRow({amount:amount?Math.ceil(amount/2)/100:''});
    }
    updateSplitTotal();
  }
});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-split-add]')){appendSplitRow();return}
  const remove=event.target.closest('[data-split-remove]');if(remove){remove.closest('.split-row').remove();updateSplitTotal()}
});
document.addEventListener('input',event=>{if(event.target.closest('.split-editor')||event.target===entryForm.elements.amount)updateSplitTotal()});
window.addEventListener('submit',async event=>{
  if(event.target!==entryForm||editRecord?.kind!=='expense')return;
  const original=state.transactions.find(tx=>String(tx.id)===String(editRecord.id)),splitOn=!!entryForm.querySelector('[data-split-toggle]')?.checked;
  if(!splitOn&&!original?.splits?.length)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(original?.billId||original?.loanId||original?.transferId)return toastMsg('Linked entries cannot be split');
  const data=Object.fromEntries(new FormData(entryForm)),amount=cents(data.amount),wallet=state.wallets.find(w=>w.id===data.walletId);
  if(!wallet||!Number.isSafeInteger(amount)||amount<=0)return toastMsg('Enter a valid amount and wallet');
  let splits=[];
  if(splitOn){
    const rows=[...formFields.querySelectorAll('.split-row')];
    if(rows.length<2)return toastMsg('Add at least two categories');
    splits=rows.map(row=>({categoryId:row.querySelector('select').value,amount:cents(row.querySelector('input').value)}));
    if(splits.some(part=>!part.categoryId||!Number.isSafeInteger(part.amount)||part.amount<=0))return toastMsg('Enter a positive amount for every category');
    if(splits.reduce((sum,part)=>sum+part.amount,0)!==amount)return toastMsg('Split amounts must equal the purchase total');
    splits=splits.map(part=>({...part,amount:part.amount/100}));
  }
  const alreadyRefunded=original?state.transactions.filter(tx=>tx.type==='refund'&&String(tx.refundOf)===String(original.id)).reduce((sum,tx)=>sum+cents(tx.amount),0):0;
  if(amount<alreadyRefunded)return toastMsg('Purchase total cannot be below its linked refunds');
  const oldWallet=original&&txWallet(original),available=(+wallet.balance||0)+(oldWallet?.id===wallet.id?Math.abs(+original.amount||0):0);
  if(available<amount/100)return toastMsg('Not enough balance in this wallet');
  if(oldWallet)oldWallet.balance-=+original.amount;
  wallet.balance-=amount/100;
  const category=state.categories.find(c=>c.id===data.categoryId),record={title:data.name?.trim()||(splitOn?'Split purchase':category?.name||'Expense'),amount:-amount/100,walletId:wallet.id,wallet:wallet.name,categoryId:splitOn?'':data.categoryId,category:splitOn?'Split purchase':category?.name||'Other',isoDate:data.date,time:data.time,note:data.note||''};
  if(original){Object.assign(original,record);if(splitOn)original.splits=splits;else delete original.splits}
  else state.transactions.unshift({id:crypto.randomUUID(),type:'expense',...record,splits});
  await save();editRecord=null;formDialog.close();render();toastMsg(splitOn?'Split purchase saved':'Expense saved');
},true);

const showTransactionBeforeRefund=showTransaction;
showTransaction=function(id){
  showTransactionBeforeRefund(id);
  const dialog=document.getElementById('transactionDetail'),tx=state.transactions.find(item=>String(item.id)===String(id));
  if(!dialog?.open||!tx)return;
  const footer=dialog.querySelector('.detail-footer');
  if(tx.type==='expense'){
    const refunded=state.transactions.filter(item=>item.type==='refund'&&String(item.refundOf)===String(tx.id)).reduce((sum,item)=>sum+Math.abs(+item.amount||0),0);
    if(tx.splits?.length)footer.insertAdjacentHTML('beforebegin',`<div class="detail-splits"><strong>Category split</strong>${tx.splits.map(part=>`<div><span>${escC(cashualCategoryName(part))}</span><b>${cash(part.amount)}</b></div>`).join('')}</div>`);
    if(refunded)footer.insertAdjacentHTML('beforebegin',`<p class="refund-summary">${cash(refunded)} refunded · ${cash(Math.max(0,Math.abs(+tx.amount)-refunded))} net spent</p>`);
    if(refunded+0.005<Math.abs(+tx.amount))footer.insertAdjacentHTML('afterbegin',`<button type="button" class="ghost-btn detail-action" data-refund-expense="${escC(tx.id)}">${svg('income')} Refund</button>`);
  }
  if(tx.type==='refund'){
    footer.querySelector('[data-detail-edit]')?.remove();
    const source=state.transactions.find(item=>String(item.id)===String(tx.refundOf));
    footer.insertAdjacentHTML('beforebegin',`<p class="refund-summary">Linked to ${escC(source?.title||'a purchase')}. To change this refund, delete it and record a new one.</p>`);
  }
};
function openRefundDialog(tx){
  const refunded=state.transactions.filter(item=>item.type==='refund'&&String(item.refundOf)===String(tx.id)).reduce((sum,item)=>sum+cents(item.amount),0),remaining=(cents(-tx.amount)-refunded)/100;
  if(remaining<=0)return toastMsg('This purchase is fully refunded');
  let dialog=document.getElementById('refundDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='refundDialog';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  const originalParts=cashualParts(tx),categoryIds=[...new Set(originalParts.map(part=>part.categoryId).filter(Boolean))];
  dialog.innerHTML=`<form id="refundForm" class="detail-sheet"><button type="button" class="detail-close" data-close-refund aria-label="Close">${svg('close')}</button><p class="overline">Refund or reversal</p><h2>${escC(tx.title||'Purchase')}</h2><p>Up to ${cash(remaining)} can be credited back.</p><label class="field"><span>Type</span><select name="kind"><option value="refund">Refund</option><option value="reversal">Reversal of remaining purchase</option></select></label><label class="field"><span>Amount</span><input name="amount" type="number" min="0.01" max="${remaining.toFixed(2)}" step="0.01" required></label><label class="field"><span>Received in wallet</span><select name="walletId">${state.wallets.filter(w=>!w.archived).map(w=>`<option value="${escC(w.id)}" ${w.id===tx.walletId?'selected':''}>${escC(w.name)}</option>`).join('')}</select></label>${categoryIds.length>1?`<label class="field"><span>Category credit</span><select name="categoryId"><option value="">Across split categories proportionally</option>${categoryIds.map(id=>`<option value="${escC(id)}">${escC(state.categories.find(c=>c.id===id)?.name||'Other')}</option>`).join('')}</select></label>`:''}<label class="field"><span>Date</span><input name="date" type="date" min="${escC(tx.isoDate||'')}" value="${currentDay()}" required></label><label class="field"><span>Note (optional)</span><input name="note" maxlength="180"></label><button type="submit" class="primary-btn">Save credit</button></form>`;
  dialog.dataset.purchaseId=tx.id;document.getElementById('transactionDetail')?.close();dialog.showModal();dialog.querySelector('[name="amount"]').focus();
}
document.addEventListener('click',event=>{
  const refund=event.target.closest('[data-refund-expense]');if(refund){const tx=state.transactions.find(item=>String(item.id)===String(refund.dataset.refundExpense));if(tx?.type==='expense')openRefundDialog(tx)}
  if(event.target.closest('[data-close-refund]'))document.getElementById('refundDialog')?.close();
});
document.addEventListener('submit',async event=>{
  if(event.target.id!=='refundForm')return;
  event.preventDefault();const dialog=document.getElementById('refundDialog'),original=state.transactions.find(tx=>String(tx.id)===String(dialog.dataset.purchaseId)),data=Object.fromEntries(new FormData(event.target)),wallet=state.wallets.find(w=>w.id===data.walletId),amount=cents(data.amount);
  if(!original||original.type!=='expense'||!wallet||!Number.isSafeInteger(amount)||amount<=0)return toastMsg('Invalid refund');
  const prior=state.transactions.filter(tx=>tx.type==='refund'&&String(tx.refundOf)===String(original.id)).reduce((sum,tx)=>sum+cents(tx.amount),0);
  if(prior+amount>cents(-original.amount))return toastMsg('Refund exceeds the original purchase');
  if(data.kind==='reversal'&&prior+amount!==cents(-original.amount))return toastMsg('A reversal must cover the remaining purchase amount');
  if(data.date<original.isoDate)return toastMsg('Refund date must follow purchase date');
  wallet.balance+=amount/100;
  state.transactions.unshift({id:crypto.randomUUID(),type:'refund',refundKind:data.kind==='reversal'?'reversal':'refund',refundOf:original.id,refundCategoryId:data.categoryId||'',title:`${data.kind==='reversal'?'Reversal':'Refund'} · ${original.title||'Purchase'}`,amount:amount/100,walletId:wallet.id,wallet:wallet.name,category:'Refund',isoDate:data.date,time:new Date().toTimeString().slice(0,5),note:data.note||''});
  await save();dialog.close();render();toastMsg(data.kind==='reversal'?'Reversal recorded':'Refund recorded');
});
document.addEventListener('change',event=>{
  if(!event.target.matches('#refundForm [name="kind"]'))return;
  const form=event.target.form,amount=form.elements.amount;
  if(event.target.value==='reversal')amount.value=amount.max;
});

const rowsBeforeSplitBadges=txRows;
txRows=function(items){return rowsBeforeSplitBadges(items).replace(/<div class="tx transaction-row" data-tx-detail="([^"]+)"/g,(whole,id)=>whole.replace('transaction-row',`transaction-row${state.transactions.find(tx=>String(tx.id)===id)?.type==='refund'?' refund-row':''}`))};

/* Calendar totals follow the selected month and include refunds on their own dates. */
calendar=function(){
  const [year,month]=selectedMonth.split('-').map(Number),first=new Date(year,month-1,1),days=new Date(year,month,0).getDate(),offset=(first.getDay()+6)%7,title=first.toLocaleDateString('en-PH',{month:'long',year:'numeric'});
  const dayCells=Array.from({length:offset+days},(_,index)=>{
    if(index<offset)return '<span class="day muted" aria-hidden="true"></span>';
    const day=index-offset+1,date=`${selectedMonth}-${String(day).padStart(2,'0')}`,amount=cashualNetExpense(state.transactions.filter(tx=>tx.isoDate===date)),heat=amount>1500?'heat3':amount>700?'heat2':amount>0?'heat1':'';
    return `<button class="day ${heat}" type="button" data-cashual-day="${date}" aria-label="${escC(date)}: ${amount<0?'refund credit of ':'spent '}${cash(amount)}"><strong>${day}</strong>${amount?`<span>${amount<0?'−':''}${cash(amount)}</span>`:''}</button>`;
  }).join('');
  return `<section class="page-section"><div class="page-head"><div><h2>Calendar</h2><p>Net spending and refunds by day.</p></div><input class="month-picker" type="month" value="${escC(selectedMonth)}" aria-label="Calendar month"></div><article class="card"><h3 class="calendar-title">${escC(title)}</h3><div class="calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<div class="card-label">${day}</div>`).join('')}${dayCells}</div></article><div id="dayDetails"></div></section>`;
};
document.addEventListener('click',event=>{
  const day=event.target.closest('[data-cashual-day]');if(!day)return;
  const date=day.dataset.cashualDay,items=state.transactions.filter(tx=>tx.isoDate===date),net=cashualNetExpense(items),details=document.getElementById('dayDetails');
  if(details)details.innerHTML=`<article class="card day-detail"><div class="card-head"><h2>${escC(new Date(date+'T12:00:00').toLocaleDateString('en-PH',{month:'long',day:'numeric'}))}</h2><strong>${net<0?'−':''}${cash(net)} net spent</strong></div>${txRows(items)}</article>`;
});

/* The update check compares uncached release metadata; data stays in IndexedDB. */
let cashualAvailableVersion='',cashualUpdateCheckBusy=false;
const settingsBeforeUpdate=more;
more=function(){return settingsBeforeUpdate().replace('<p class="app-version">',`<details class="card settings-block update-settings"><summary>App updates</summary><p>Check for a newer Cashual release without clearing your wallets or transactions.</p><div class="update-controls"><button type="button" class="ghost-btn" data-check-app-update>${svg('download')} Check for update</button><button type="button" class="primary-btn" data-apply-app-update hidden>Install update</button></div><p class="update-status" role="status">Current release: ${CASHUAL_RELEASE}</p><small>App screens and artwork can update in place. iOS may retain the Home Screen icon chosen when the app was first added.</small></details><p class="app-version">`).replace(/Cashual version [^<]+/,`Cashual version ${CASHUAL_RELEASE}`)};
function setUpdateStatus(message,ready=false){
  const status=view.querySelector('.update-status'),apply=view.querySelector('[data-apply-app-update]');
  if(status)status.textContent=message;if(apply)apply.hidden=!ready;
}
async function checkCashualUpdate(){
  if(cashualUpdateCheckBusy)return;cashualUpdateCheckBusy=true;setUpdateStatus('Checking for updates…');
  try{
    if(!navigator.onLine)throw Error('Connect to the internet to check for updates.');
    const response=await fetch(`version.json?check=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw Error('Update information is unavailable.');
    const data=await response.json();if(!/^\d+\.\d+\.\d+$/.test(data.version||''))throw Error('Invalid update information.');
    if(!('serviceWorker'in navigator))throw Error('This browser does not support in-app PWA updates.');
    const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.ready;
    await registration.update();
    if(data.version===CASHUAL_RELEASE){cashualAvailableVersion='';setUpdateStatus(`Cashual ${CASHUAL_RELEASE} is up to date.`);return}
    cashualAvailableVersion=data.version;setUpdateStatus(`Version ${data.version} is available. Install it when ready.`,true);
  }catch(error){setUpdateStatus(error.message||'Could not check for updates. Try again later.')}
  finally{cashualUpdateCheckBusy=false}
}
async function applyCashualUpdate(){
  if(!cashualAvailableVersion)return;
  setUpdateStatus('Saving your data and applying the update…');
  try{
    await save();const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.ready;
    if(registration.waiting)registration.waiting.postMessage({type:'CASHUAL_SKIP_WAITING'});
    if(registration.installing)await new Promise(resolve=>{const worker=registration.installing,timer=setTimeout(resolve,8000);worker.addEventListener('statechange',()=>{if(worker.state==='activated'||worker.state==='redundant'){clearTimeout(timer);resolve()}},{once:false})});
    location.reload();
  }catch{setUpdateStatus('Update could not be applied. Your local data is unchanged.',true)}
}
document.addEventListener('click',event=>{if(event.target.closest('[data-check-app-update]'))checkCashualUpdate();if(event.target.closest('[data-apply-app-update]'))applyCashualUpdate()});
render();
