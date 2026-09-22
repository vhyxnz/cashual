/* Cashual local-first features. No remote account or endpoint is used. */
document.body.classList.add('cashual-loading');
const CASHUAL_DB='cashual-local-v1';
let cashualDbPromise;
let cashualWriteQueue=Promise.resolve();
let cashualLastWriteOk=true;
const cashualRecordCount=value=>['wallets','transactions','bills','loans','budgets','goals'].reduce((sum,key)=>sum+(Array.isArray(value?.[key])?value[key].length:0),0);
function cashualDb(){
  return cashualDbPromise ||= new Promise((resolve,reject)=>{
    const request=indexedDB.open(CASHUAL_DB,1);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');if(!db.objectStoreNames.contains('syncQueue'))db.createObjectStore('syncQueue',{autoIncrement:true})};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function cashualGet(key){const db=await cashualDb();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readonly'),request=tx.objectStore('kv').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function cashualPut(key,value){const db=await cashualDb();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function cashualQueueRefresh(){if(navigator.onLine)return;try{const db=await cashualDb();const tx=db.transaction('syncQueue','readwrite');tx.objectStore('syncQueue').add({at:Date.now(),kind:'refresh'});navigator.serviceWorker?.ready.then(reg=>reg.sync?.register('cashual-refresh')).catch(()=>{})}catch{/* Online/visibility fallbacks still refresh the app. */}}
cashualPersist=()=>{
  const snapshot=structuredClone({state,userProfile,theme,savedAt:Date.now()});
  cashualWriteQueue=cashualWriteQueue.then(async()=>{const prior=await cashualGet('snapshot');if(prior?.state&&cashualRecordCount(prior.state)>0)await cashualPut('previous-snapshot',prior);await cashualPut('snapshot',snapshot);cashualLastWriteOk=true;await cashualQueueRefresh()}).catch(error=>{
    cashualLastWriteOk=false;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot.state));localStorage.setItem('cashual-profile',JSON.stringify(snapshot.userProfile));localStorage.setItem('cashual-theme',snapshot.theme)}catch{}
    console.warn('Cashual IndexedDB save failed; local fallback attempted',error);toastMsg('Local storage issue — export a backup');
  });
  return cashualWriteQueue;
};
async function hydrateCashual(){
  try{
    const snapshot=await cashualGet('snapshot'),legacyRaw=localStorage.getItem(STORAGE_KEY),legacy=legacyRaw?JSON.parse(legacyRaw):null;
    const useLegacy=!!legacy&&(!snapshot?.state||(cashualRecordCount(legacy)>0&&cashualRecordCount(snapshot.state)===0));
    if(useLegacy){await cashualPut('migration-backup',{state:legacy,userProfile,theme,savedAt:Date.now()});state={...structuredClone(seed),...legacy}}
    else if(snapshot?.state){state={...structuredClone(seed),...snapshot.state};userProfile=snapshot.userProfile||userProfile;theme=snapshot.theme||theme}
    state.loans??=[];state.budgets??=[];state.bills??=[];state.goals??=[];state.transactions??=[];state.wallets??=[];state.categories??=[];
    state.walletPrivacy??={};state.walletLayout||=state.walletCompact?'line':'grid';
    cashualHydrated=true;await save();
    if(cashualLastWriteOk){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('cashual-profile');localStorage.removeItem('cashual-theme')}
  }catch(error){
    console.warn('IndexedDB unavailable; using localStorage fallback',error);
    cashualPersist=()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem('cashual-profile',JSON.stringify(userProfile));localStorage.setItem('cashual-theme',theme);return Promise.resolve()};
    cashualHydrated=true;save();toastMsg('IndexedDB unavailable — export a backup');
  }
  document.body.classList.remove('cashual-loading');applyTheme();render();if(!userProfile.setup)setTimeout(()=>openProfileEditor(true),150);
  const action=new URLSearchParams(location.search).get('action');
  if(action==='expense')openQuickEntry('expense');else if(action==='transfer')openForm('transfer');
}
profileForm.addEventListener('submit',()=>queueMicrotask(()=>{save();if(cashualLastWriteOk)localStorage.removeItem('cashual-profile')}));
themeBtn.addEventListener('click',()=>queueMicrotask(()=>{save();if(cashualLastWriteOk)localStorage.removeItem('cashual-theme')}));
cancelProfile.onclick=()=>{userProfile.setup=true;save();profileDialog.close()};
window.addEventListener('online',()=>{render();navigator.serviceWorker?.ready.then(reg=>reg.sync?.register('cashual-refresh')).catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&cashualHydrated)render()});
navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='CASHUAL_REFRESH')render()});

const quickEntryDialog=document.getElementById('quickEntryDialog');
const quickEntryForm=document.getElementById('quickEntryForm');
let quickType='expense',quickCategory='';
expenseSet=function(range=expenseRange){const today=new Date(currentDay()+'T12:00:00'),start=new Date(today);if(range==='weekly')start.setDate(today.getDate()-6);else if(range==='monthly')start.setDate(1);else if(range==='yearly'){start.setMonth(0);start.setDate(1)}return state.transactions.filter(t=>t.type==='expense'&&t.isoDate>=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`&&t.isoDate<=currentDay())};
function updateQuickCategories(){
  const options=state.categories.filter(c=>quickType==='income'?c.group==='income':c.group!=='income');
  if(!options.some(c=>c.id===quickCategory))quickCategory=options[0]?.id||'';
  quickCategories.innerHTML=options.map(c=>`<button type="button" class="quick-category ${c.id===quickCategory?'active':''}" data-quick-category="${escC(c.id)}">${userIcon(c.icon)}<span>${escC(c.name)}</span></button>`).join('');
  quickEntryForm.querySelector('.quick-save').textContent=`Save ${quickType}`;
  quickEntryForm.querySelectorAll('[data-quick-type]').forEach(b=>b.classList.toggle('active',b.dataset.quickType===quickType));
}
function openQuickEntry(type='expense'){
  if(!cashualHydrated)return;
  if(!walletChoices().length){toastMsg('Add a wallet first');openForm('wallet');return}
  if(quickDialog.open)quickDialog.close();quickType=type;quickCategory='';quickEntryForm.reset();
  quickWallet.innerHTML=walletChoices().map(([id,name])=>`<option value="${escC(id)}">${escC(name)}</option>`).join('');
  updateQuickCategories();quickEntryDialog.showModal();
  requestAnimationFrame(()=>quickEntryForm.elements.amount.focus());
}
document.addEventListener('click',event=>{
  const launcher=event.target.closest('[data-quick]');
  if(launcher){event.preventDefault();event.stopImmediatePropagation();openQuickEntry('expense');return}
  const type=event.target.closest('[data-quick-type]');if(type){quickType=type.dataset.quickType;quickCategory='';updateQuickCategories();return}
  const category=event.target.closest('[data-quick-category]');if(category){quickCategory=category.dataset.quickCategory;updateQuickCategories();return}
  if(event.target.closest('[data-quick-close]'))quickEntryDialog.close();
},true);
quickEntryForm.addEventListener('submit',event=>{
  event.preventDefault();const d=Object.fromEntries(new FormData(quickEntryForm)),amount=+d.amount,w=state.wallets.find(x=>x.id===d.walletId),category=state.categories.find(x=>x.id===quickCategory);
  if(!w||!Number.isFinite(amount)||amount<=0)return toastMsg('Enter a valid amount and wallet');
  const signed=quickType==='expense'?-amount:amount;w.balance+=signed;
  state.transactions.unshift({id:crypto.randomUUID(),type:quickType,title:d.title?.trim()||category?.name||quickType,amount:signed,walletId:w.id,wallet:w.name,categoryId:category?.id||'',category:category?.name||quickType,isoDate:currentDay(),time:new Date().toTimeString().slice(0,5)});
  save();quickEntryDialog.close();render();toastMsg('Transaction saved');
});

const priorBillForm=enhanceForm;
enhanceForm=function(kind,id=''){
  if(kind==='bill'){
    const bill=state.bills.find(x=>x.id===id);editRecord={kind,id};if(quickDialog.open)quickDialog.close();formDialog.dataset.kind='bill';formOverline.textContent=id?'Edit bill':'New bill';formTitle.textContent=id?'Edit bill':'Add a bill or subscription';saveBtn.textContent='Save bill';
    formFields.innerHTML=`<div class="form-grid compact-form">${field('Name','name','text',bill?.name||'','required')}${field('Amount','amount','number',bill?.amount||'','required min="0.01" step="0.01"')}${field('Next due date','dueDate','date',bill?.dueDate||currentDay(),'required')}${select('Repeats','repeat',[['never','One time'],['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly']],bill?.repeat||'never')}${select('Payment wallet','walletId',[['','No wallet'],...walletChoices()],bill?.walletId||'')}${field('Note','note','text',bill?.note||'')}</div>`;
    formDialog.showModal();return;
  }
  priorBillForm(kind,id);
};
const priorBillOpen=openForm;
openForm=function(kind){if(kind==='bill')return enhanceForm('bill');return priorBillOpen(kind)};
const priorBillSubmit=entryForm.onsubmit;
entryForm.onsubmit=async event=>{
  if(editRecord?.kind==='bill'){
    event.preventDefault();const d=Object.fromEntries(new FormData(entryForm)),amount=+d.amount;
    if(!d.name?.trim()||!Number.isFinite(amount)||amount<=0||!d.dueDate)return toastMsg('Enter a name, amount, and due date');
    const bill=state.bills.find(x=>x.id===editRecord.id)||{id:crypto.randomUUID()};
    Object.assign(bill,{name:d.name.trim(),amount,dueDate:d.dueDate,repeat:d.repeat,walletId:d.walletId||'',note:d.note||'',status:'Upcoming'});
    if(!state.bills.includes(bill))state.bills.unshift(bill);
    save();editRecord=null;formDialog.close();render();toastMsg('Bill saved');return;
  }
  return priorBillSubmit(event);
};
function billDate(b){if(/^\d{4}-\d{2}-\d{2}$/.test(b.dueDate||''))return b.dueDate;const parsed=new Date(`${b.date||''} ${new Date().getFullYear()}`);return Number.isNaN(+parsed)?currentDay():`${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`}
function advanceBill(date,repeat){if(repeat==='never')return date;let next=date;do{next=nextInterestDate(next,repeat)}while(next<=currentDay());return next}
function billStatus(b){if(b.status==='Paid'&&(!b.repeat||b.repeat==='never'))return 'Paid';const due=billDate(b),days=Math.ceil((new Date(due+'T12:00:00')-new Date(currentDay()+'T12:00:00'))/86400000);return days<0?'Overdue':days===0?'Due today':days<=7?`Due in ${days} days`:'Upcoming'}
bills=function(){const sorted=[...state.bills].sort((a,b)=>billDate(a).localeCompare(billDate(b)));return `<section><div class="page-head"><div><h2>Bills & subscriptions</h2><p>See what is due, overdue, and repeating.</p></div><button class="primary-btn" data-open="bill">Add bill</button></div><div class="bill-list">${sorted.length?sorted.map(b=>`<div class="card bill-card"><div class="tx-icon">${svg('receipt')}</div><div class="bill-info"><strong>${escC(b.name)}</strong><small>${escC(billDate(b))} · ${escC(b.repeat||'One time')}${b.note?` · ${escC(b.note)}`:''}</small></div><strong class="money">${cash(b.amount)}</strong><span class="due-badge ${billStatus(b).startsWith('Overdue')?'overdue':''}">${billStatus(b)}</span><button class="text-btn" data-edit-bill-id="${escC(b.id)}">Edit</button>${billStatus(b)!=='Paid'?`<button class="ghost-btn" data-pay-bill="${escC(b.id)}">Mark paid</button>`:''}</div>`).join(''):'<div class="card empty">No bills yet</div>'}</div></section>`};
document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit-bill-id]'),paid=event.target.closest('[data-pay-bill]');if(!edit&&!paid)return;
  event.preventDefault();event.stopImmediatePropagation();if(edit)return enhanceForm('bill',edit.dataset.editBillId);
  const b=state.bills.find(x=>x.id===paid.dataset.payBill);if(!b)return;
  const w=state.wallets.find(x=>x.id===b.walletId);if(w){if(w.balance<b.amount)return toastMsg('Not enough balance in the payment wallet');w.balance-=b.amount;state.transactions.unshift({id:crypto.randomUUID(),type:'expense',title:b.name,amount:-b.amount,walletId:w.id,wallet:w.name,category:'Bills',isoDate:currentDay(),time:new Date().toTimeString().slice(0,5),billId:b.id})}
  if(b.repeat&&b.repeat!=='never'){b.dueDate=advanceBill(billDate(b),b.repeat);b.status='Upcoming'}else b.status='Paid';
  save();render();toastMsg('Bill marked paid');
},true);

function budgetWindow(b){const start=new Date((b.startDate||currentDay())+'T12:00:00'),days=Math.max(1,+b.cycleDays||30),today=new Date(currentDay()+'T12:00:00');let periods=Math.floor((today-start)/86400000/days);if(periods<0)periods=0;const from=new Date(start);from.setDate(start.getDate()+periods*days);const to=new Date(from);to.setDate(from.getDate()+days);return [from.toISOString().slice(0,10),to.toISOString().slice(0,10)]}
function budgetSpent(b){const [from,to]=budgetWindow(b);return state.transactions.filter(t=>t.type==='expense'&&t.isoDate>=from&&t.isoDate<to&&(!b.categoryId||t.categoryId===b.categoryId||t.category===state.categories.find(c=>c.id===b.categoryId)?.name)).reduce((sum,t)=>sum+Math.abs(+t.amount||0),0)}
insights=function(){const m=monthStats();return `<section><div class="page-head"><div><h2>Insights & budgets</h2><p>Spending from your recorded transactions.</p></div><button class="primary-btn" data-budget-add>Add budget</button></div><div class="cashflow-stats card"><div><span>Income</span><strong>${cash(m.income)}</strong></div><div><span>Expenses</span><strong>${cash(m.expenses)}</strong></div><div><span>Net saved</span><strong>${m.saved<0?'−':''}${cash(m.saved)}</strong></div></div><div class="budget-grid">${state.budgets.length?state.budgets.map(b=>{const spent=budgetSpent(b),percent=Math.min(100,spent/b.limit*100),[from,to]=budgetWindow(b);return `<div class="card budget-card"><div class="budget-card-head"><div><strong>${escC(b.name)}</strong><small>${escC(from)} to ${escC(to)} · ${b.cycleDays} day cycle</small></div><button class="text-btn" data-budget-edit="${escC(b.id)}">Edit</button></div><div class="budget-ring" style="--progress:${percent}%"><div><strong>${Math.round(spent/b.limit*100)}%</strong><small>used</small></div></div><div class="budget-numbers"><span>${cash(spent)} spent</span><strong>${cash(b.limit)} limit</strong></div><div class="progress ${spent>b.limit?'warn':''}"><span style="width:${percent}%"></span></div></div>`}).join(''):'<div class="card empty">No budgets yet. Add one for a pay period or any custom cycle.</div>'}</div><article class="card home-section"><div class="card-head"><h2>Expense mix</h2><input class="month-picker" type="month" value="${selectedMonth}"></div>${categoryPie()}</article></section>`};
function openBudget(id=''){const b=state.budgets.find(x=>x.id===id);editRecord={kind:'budget',id};formDialog.dataset.kind='budget';formOverline.textContent=id?'Edit':'New';formTitle.textContent='Custom-cycle budget';saveBtn.textContent='Save budget';formFields.innerHTML=`<div class="form-grid compact-form">${field('Name','name','text',b?.name||'','required')}${field('Limit','limit','number',b?.limit||'','required min="0.01" step="0.01"')}${select('Category','categoryId',[['','All expenses'],...state.categories.filter(c=>c.group!=='income').map(c=>[c.id,c.name])],b?.categoryId||'')}${field('Cycle starts','startDate','date',b?.startDate||currentDay(),'required')}${field('Cycle length (days)','cycleDays','number',b?.cycleDays||14,'required min="1" max="366"')}</div>`;formDialog.showModal()}
const priorBudgetSubmit=entryForm.onsubmit;
entryForm.onsubmit=async event=>{if(editRecord?.kind==='budget'){event.preventDefault();const d=Object.fromEntries(new FormData(entryForm)),limit=+d.limit,cycleDays=+d.cycleDays;if(!d.name?.trim()||!Number.isFinite(limit)||limit<=0||!Number.isInteger(cycleDays)||cycleDays<1||cycleDays>366)return toastMsg('Enter a valid name, limit, and cycle');const b=state.budgets.find(x=>x.id===editRecord.id)||{id:crypto.randomUUID()};Object.assign(b,{name:d.name.trim(),limit,categoryId:d.categoryId||'',startDate:d.startDate,cycleDays});if(!state.budgets.includes(b))state.budgets.push(b);save();editRecord=null;formDialog.close();render();toastMsg('Budget saved');return}return priorBudgetSubmit(event)};
document.addEventListener('click',event=>{const add=event.target.closest('[data-budget-add]'),edit=event.target.closest('[data-budget-edit]');if(!add&&!edit)return;event.preventDefault();event.stopImmediatePropagation();openBudget(edit?.dataset.budgetEdit||'')},true);

function downloadCashual(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
exportCsv=function(){const rows=[['type','data']];for(const [type,items] of [['wallet',state.wallets],['transaction',state.transactions],['category',state.categories],['bill',state.bills],['loan',state.loans],['budget',state.budgets],['goal',state.goals]])for(const item of items)rows.push([type,JSON.stringify(item)]);rows.push(['profile',JSON.stringify(userProfile)]);downloadCashual(`cashual-${currentDay()}.csv`,rows.map(row=>row.map(csvQuote).join(',')).join('\r\n'),'text/csv;charset=utf-8')};
importCsv=async function(file){if(!file)return;try{const rows=csvRows(await file.text()),header=rows.shift();if(header?.[0]!=='type'||header?.[1]!=='data')throw Error('Not a Cashual CSV');const types={wallet:'wallets',transaction:'transactions',category:'categories',bill:'bills',loan:'loans',budget:'budgets',goal:'goals'},next=structuredClone(state);let imported=0;for(const [type,json] of rows){const record=JSON.parse(json);if(type==='profile'){if(record&&typeof record==='object')userProfile=record;continue}const key=types[type];if(!key||!record||typeof record!=='object')continue;record.id||=crypto.randomUUID();next[key]??=[];const index=next[key].findIndex(x=>String(x.id)===String(record.id));if(index<0)next[key].push(record);else next[key][index]=record;imported++}state=next;await save();render();toastMsg(`Imported ${imported} records`)}catch{toastMsg('Invalid Cashual CSV file')}};
function exportJson(){downloadCashual(`cashual-${currentDay()}.json`,JSON.stringify({format:'cashual-backup-v1',exportedAt:new Date().toISOString(),state,userProfile,theme},null,2),'application/json')}
async function importJson(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='cashual-backup-v1'||!data.state||!Array.isArray(data.state.wallets)||!Array.isArray(data.state.transactions))throw Error('Invalid backup');const next=structuredClone(state);for(const key of ['wallets','transactions','categories','bills','loans','budgets','goals'])for(const record of data.state[key]||[]){if(!record||typeof record!=='object')continue;record.id||=crypto.randomUUID();next[key]??=[];const index=next[key].findIndex(x=>String(x.id)===String(record.id));if(index<0)next[key].push(record);else next[key][index]=record}state=next;if(data.userProfile?.name)userProfile=data.userProfile;if(['light','dark'].includes(data.theme))theme=data.theme;await save();applyTheme();render();toastMsg('JSON backup imported')}catch{toastMsg('Invalid Cashual JSON backup')}}
const priorPortableSettings=more;
more=function(){return priorPortableSettings().replace('CSV exports wallets, transactions, categories, bills, and loans. Keep this file private.','Back up wallets, transactions, bills, loans, budgets, goals, and settings. JSON preserves images; keep backups private.').replace('<div class="settings-actions"><button class="ghost-btn" data-export>',`<div class="settings-actions"><button class="ghost-btn" data-export-json>${svg('download')} Export JSON</button><label class="ghost-btn file-label">${svg('upload')} Import JSON<input id="jsonImport" type="file" accept=".json,application/json" hidden></label><button class="ghost-btn" data-export>`).replace('</div></details><details class="card settings-block"><summary>Appearance & privacy',`</div><button class="text-btn backup-recovery" data-restore-local>${svg('archive')} Restore missing records from previous local copy</button></details><details class="card settings-block"><summary>Appearance & privacy`)};
document.addEventListener('click',event=>{if(event.target.closest('[data-export-json]'))exportJson()},true);
document.addEventListener('change',event=>{if(event.target.id==='jsonImport')importJson(event.target.files[0])});
document.addEventListener('click',async event=>{if(!event.target.closest('[data-restore-local]'))return;event.preventDefault();const backup=await cashualGet('migration-backup')||await cashualGet('previous-snapshot');if(!backup?.state)return toastMsg('No previous local copy found');let added=0;for(const key of ['wallets','transactions','bills','loans','budgets','goals','categories'])for(const item of backup.state[key]||[]){state[key]??=[];if(!state[key].some(x=>String(x.id)===String(item.id))){state[key].push(item);added++}}await save();render();toastMsg(`Restored ${added} missing records`)},true);

state.walletPrivacy??={};
const typeGradients={cash:['#537a42','#1f4d3e'],bank:['#235686','#162e60'],'e-wallet':['#364d9a','#7350a4'],savings:['#186b66','#9d8240'],'credit card':['#31354f','#5b4264'],other:['#4a6253','#303c52']};
walletCard=function(w){const pair=typeGradients[String(w.type||'other').toLowerCase()]||typeGradients.other,custom=w.color&&w.color!=='#d7f36a',first=custom?w.color:pair[0],second=custom?w.accent||pair[1]:pair[1],hidden=!!state.walletPrivacy[w.id];return `<div class="wallet-shell swipe-shell" data-wallet-item="${escC(w.id)}"><div class="swipe-back swipe-edit" data-swipe-wallet-edit="${escC(w.id)}">${svg('edit')} Edit</div><div class="swipe-back swipe-archive" data-swipe-archive="${escC(w.id)}">${svg('archive')} Archive</div><article class="card wallet custom-wallet account-card ${state.walletLayout==='line'?'compact-wallet':''}" style="--wallet-bg:${escC(first)};--accent:${escC(second)}"><button class="wallet-main" data-wallet-view="${escC(w.id)}" aria-label="View ${escC(w.name)} wallet">${w.image?`<img class="wallet-image" src="${w.image}" alt="">`:`<span class="wallet-icon">${userIcon(w.icon||'wallet')}</span>`}<span class="wallet-name">${escC(w.name)}</span><strong class="wallet-amount money ${hidden?'card-hidden':''}">${hidden?'••••••':cash(w.balance)}</strong><small>${escC(w.type)} · View summary</small></button><div class="wallet-card-tools"><button data-wallet-privacy="${escC(w.id)}" aria-label="${hidden?'Show':'Hide'} ${escC(w.name)} balance" title="${hidden?'Show':'Hide'} balance">${svg('eye')}</button><button data-wallet-more="${escC(w.id)}" aria-label="Wallet actions" title="Wallet actions">${svg('more')}</button></div><div class="wallet-card-actions" hidden><button data-wallet-transfer="${escC(w.id)}">${svg('transfer')} Transfer</button><button data-wallet-funds="${escC(w.id)}">${svg('add')} Add funds</button></div></article></div>`};
document.addEventListener('click',event=>{
  const privacy=event.target.closest('[data-wallet-privacy]'),moreButton=event.target.closest('[data-wallet-more]'),transfer=event.target.closest('[data-wallet-transfer]'),funds=event.target.closest('[data-wallet-funds]'),edit=event.target.closest('[data-swipe-wallet-edit]'),archive=event.target.closest('[data-swipe-archive]');
  if(!privacy&&!moreButton&&!transfer&&!funds&&!edit&&!archive)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(privacy){const id=privacy.dataset.walletPrivacy;state.walletPrivacy[id]=!state.walletPrivacy[id];save();render()}
  else if(moreButton){const panel=moreButton.closest('.account-card').querySelector('.wallet-card-actions');panel.hidden=!panel.hidden}
  else if(transfer){enhanceForm('transfer');const from=formFields.querySelector('[name="from"]');if(from)from.value=transfer.dataset.walletTransfer}
  else if(funds){openForm('income');const wallet=formFields.querySelector('[name="walletId"]');if(wallet)wallet.value=funds.dataset.walletFunds}
  else if(edit)enhanceForm('wallet',edit.dataset.swipeWalletEdit);
  else if(archive){const w=state.wallets.find(x=>x.id===archive.dataset.swipeArchive);if(w&&confirm(`Archive ${w.name}? You can restore it from a backup.`)){w.archived=true;save();render();toastMsg('Wallet archived')}}
},true);

const rowsBeforeSwipe=txRows;
txRows=function(items=state.transactions){if(!items.length)return rowsBeforeSwipe(items);return items.map(t=>`<div class="swipe-shell tx-swipe" data-tx-item="${escC(t.id)}"><div class="swipe-back swipe-edit" data-swipe-tx-edit="${escC(t.id)}">${svg('edit')} Edit</div><div class="swipe-back swipe-delete" data-swipe-tx-delete="${escC(t.id)}">${svg('archive')} Delete</div><div class="swipe-surface"><div class="tx"><div class="tx-icon">${svg(t.type==='income'?'income':t.type==='transfer'?'transfer':'expense')}</div><div class="tx-main"><strong>${escC(t.title||'Transaction')}</strong><small>${escC(t.category||'Other')} · ${escC(t.wallet||'Wallet')}</small></div><div class="tx-actions"><button data-edit-tx="${escC(t.id)}">Edit</button><div class="tx-amount ${+t.amount>0?'positive':''}">${money(+t.amount||0)}<small>${escC(t.isoDate||t.date||'')}</small></div></div></div></div></div>`).join('')};
document.addEventListener('click',event=>{const edit=event.target.closest('[data-swipe-tx-edit]'),del=event.target.closest('[data-swipe-tx-delete]');if(!edit&&!del)return;event.preventDefault();event.stopImmediatePropagation();const t=state.transactions.find(x=>String(x.id)===String(edit?.dataset.swipeTxEdit||del?.dataset.swipeTxDelete));if(!t)return;if(edit){if(t.type==='transfer')return toastMsg('Transfers cannot be edited');enhanceForm(t.type,t.id);return}if(t.loanId)return toastMsg('Loan-linked entries cannot be deleted here');if(!confirm(`Delete “${t.title}”? This will update wallet balances.`))return;if(t.type==='transfer'){const from=state.wallets.find(w=>w.id===t.fromId),to=state.wallets.find(w=>w.id===t.toId);if(from)from.balance+=Math.abs(+t.amount)+(+t.fee||0);if(to)to.balance-=Math.abs(+t.amount);state.transactions=state.transactions.filter(x=>x.transferId!==t.id&&x.id!==t.id)}else{const w=txWallet(t);if(w)w.balance-=+t.amount;state.transactions=state.transactions.filter(x=>x.id!==t.id)}save();render();toastMsg('Transaction deleted')},true);
let swipeStart=null;
document.addEventListener('touchstart',event=>{const shell=event.target.closest('.swipe-shell');if(!shell||event.target.closest('button'))return;const touch=event.touches[0];swipeStart={shell,x:touch.clientX,y:touch.clientY,dx:0}}, {passive:true});
document.addEventListener('touchmove',event=>{if(!swipeStart)return;const touch=event.touches[0],dx=touch.clientX-swipeStart.x,dy=touch.clientY-swipeStart.y;if(Math.abs(dy)>Math.abs(dx)+10)return;swipeStart.dx=Math.max(-86,Math.min(0,dx));swipeStart.shell.style.setProperty('--swipe-x',`${swipeStart.dx}px`);swipeStart.shell.classList.add('swiping')},{passive:true});
document.addEventListener('touchend',()=>{if(!swipeStart)return;const {shell,dx}=swipeStart;shell.classList.remove('swiping');shell.style.setProperty('--swipe-x',dx < -46?'-76px':'0px');swipeStart=null},{passive:true});

const renderBeforeNative=render;
render=function(){renderBeforeNative();if(location.hash==='#home'||!location.hash)eyebrow.textContent=new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric'});if(cashualHydrated)decorateActions();document.querySelectorAll('.swipe-back').forEach(action=>{action.setAttribute('role','button');action.tabIndex=0})};
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.swipe-back')){event.preventDefault();event.target.click()}});
const homeBeforeUpcoming=home;
home=function(){const html=homeBeforeUpcoming(),upcoming=state.bills.filter(b=>billStatus(b)!=='Paid').sort((a,b)=>billDate(a).localeCompare(billDate(b))).slice(0,3);if(!upcoming.length)return html;const strip=`<section class="card home-section upcoming-strip"><div class="card-head"><h2>Coming up</h2><button class="text-btn" data-route="bills">View bills</button></div>${upcoming.map(b=>`<div class="upcoming-row"><strong>${escC(b.name)}</strong><span>${cash(b.amount)}</span><small class="due-badge ${billStatus(b)==='Overdue'?'overdue':''}">${escC(billStatus(b))}</small></div>`).join('')}</section>`;return html+strip};
const insightsBeforeGoals=insights;
insights=function(){const goals=state.goals||[],section=goals.length?`<section class="home-section"><h2>Savings goals</h2><div class="budget-grid">${goals.map(g=>{const percent=Math.max(0,Math.min(100,(+g.saved||0)/(+g.target||1)*100));return `<div class="card budget-card"><strong>${escC(g.name||'Goal')}</strong><div class="budget-ring" style="--progress:${percent}%"><div><strong>${Math.round(percent)}%</strong><small>saved</small></div></div><div class="budget-numbers"><span>${cash(g.saved)} saved</span><strong>${cash(g.target)} target</strong></div></div>`}).join('')}</div></section>`:'';return insightsBeforeGoals()+section};
const settingsBeforePersistence=more;
more=function(){return settingsBeforePersistence().replace('<details class="card settings-block" open>',`<div class="settings-list shortcut-settings"><button class="card setting" data-route="insights"><span class="setting-icon">${svg('insights')}</span><div><strong>Budgets & insights</strong><small>Custom cycles and spending rings</small></div></button><button class="card setting" data-route="calendar"><span class="setting-icon">${svg('calendar')}</span><div><strong>Calendar</strong><small>Daily spending</small></div></button></div><details class="card settings-block" open>`).replace('<button class="ghost-btn" data-export-json>',`<button class="ghost-btn" data-persist-storage>${svg('archive')} Keep offline data</button><button class="ghost-btn" data-export-json>`)};
document.addEventListener('click',async event=>{if(!event.target.closest('[data-persist-storage]'))return;event.preventDefault();try{const granted=await navigator.storage?.persist?.();toastMsg(granted?'Persistent storage enabled':'This browser did not grant persistent storage. Keep a backup.') }catch{toastMsg('Persistent storage is unavailable here. Keep a backup.')}},true);
hydrateCashual();
