/* Allocations, lightweight challenges, and a transparent daily spending guide. */
const CASHUAL_APP_VERSION='1.1.4';
const allocationMonth=()=>currentDay().slice(0,7);
const allocationActive=()=>state.allocations||[];
const allocationPaid=(allocation,month=allocationMonth())=>state.transactions.filter(tx=>tx.allocationId===allocation.id&&(allocation.cycle==='once'||tx.isoDate?.startsWith(month))&&!tx.transferId).reduce((sum,tx)=>sum+Math.abs(+tx.amount||0),0);
const allocationRemaining=(allocation)=>Math.max(0,(+allocation.target||0)-allocationPaid(allocation));
function spendableWallets(){
  const available=state.wallets.filter(w=>!w.archived&&w.included!==false);
  if(Array.isArray(state.safeSpend?.walletIds))return available.filter(w=>state.safeSpend.walletIds.includes(w.id));
  const checking=available.filter(w=>!(/savings|investment|credit/i.test(w.type||'')));
  return checking.length?checking:available;
}
function safeSpendSnapshot(){
  const today=new Date(currentDay()+'T12:00:00'),end=new Date(today.getFullYear(),today.getMonth()+1,0,12),days=Math.max(1,end.getDate()-today.getDate()+1);
  const balance=spendableWallets().reduce((sum,w)=>sum+(+w.balance||0),0);
  const planned=allocationActive().filter(a=>a.cycle!=='once'||!a.completed).reduce((sum,a)=>sum+allocationRemaining(a),0);
  const billsDue=state.bills.filter(b=>b.status!=='Paid'&&billDate(b)>=currentDay()&&billDate(b)<=`${allocationMonth()}-${String(end.getDate()).padStart(2,'0')}`).reduce((sum,b)=>sum+(+b.amount||0),0);
  const cushion=Math.max(0,+state.safeSpend?.cushion||0),available=balance-planned-billsDue-cushion;
  return {balance,planned,billsDue,cushion,available,perDay:Math.max(0,available/days),days};
}
function safeSpendCard(){
  const s=safeSpendSnapshot(),walletCount=spendableWallets().length;
  return `<section class="card safe-spend-card home-section"><div class="card-head"><div><p class="overline">Daily guide</p><h2>Safe to Spend</h2></div><button type="button" class="safe-settings" data-safe-settings aria-label="Configure Safe to Spend" title="Configure Safe to Spend">${svg('settings')}</button></div>${walletCount?`<strong class="safe-amount">${cash(s.perDay)} <small>/ day</small></strong><p>${s.days} day${s.days===1?'':'s'} left this month · ${s.available<0?`Short by ${cash(-s.available)}`:`${cash(Math.max(0,s.available))} available`}</p><details><summary>How this is calculated</summary><dl><div><dt>Spendable wallets</dt><dd>${cash(s.balance)}</dd></div><div><dt>Allocations left</dt><dd>−${cash(s.planned)}</dd></div><div><dt>Unpaid bills due</dt><dd>−${cash(s.billsDue)}</dd></div><div><dt>Safety cushion</dt><dd>−${cash(s.cushion)}</dd></div></dl><small>Estimate only. Future income is not counted until recorded.</small></details>`:'<p>Add an included wallet to see your daily guide.</p>'}</section>`;
}
function allocationCard(a){
  const paid=allocationPaid(a),remaining=allocationRemaining(a),progress=Math.min(100,Math.round(paid/(+a.target||1)*100));
  return `<article class="card allocation-card"><div class="allocation-top"><div><small>${a.cycle==='once'?'One-time target':'Monthly target'}${a.person?' · '+escC(a.person):''}</small><h3>${escC(a.name)}</h3></div><button type="button" data-allocation-edit="${escC(a.id)}" aria-label="Edit ${escC(a.name)}" title="Edit allocation">${svg('edit')}</button></div><div class="allocation-figures"><strong>${cash(paid)} <small>contributed</small></strong><span>${cash(a.target)} goal</span></div><div class="progress"><span style="width:${progress}%"></span></div><div class="allocation-bottom"><small>${remaining?`${cash(remaining)} left`:'Target reached'} · ${progress}%</small><button type="button" class="ghost-btn allocation-contribute" data-allocation-contribute="${escC(a.id)}">${svg('add')} Record contribution</button></div></article>`;
}
function allocationSection(){
  return `<section class="allocation-section home-section" id="budgetAllocator"><div class="card-head"><div><h2>Budget allocator</h2><p>Plan and track where you set money aside or give it.</p></div><button type="button" class="primary-btn allocation-add" data-allocation-add aria-label="Add allocation" title="Add allocation">${svg('add')}</button></div><div class="allocation-grid">${allocationActive().length?allocationActive().map(allocationCard).join(''):'<div class="card empty">No allocations yet. Add a target for any purpose.</div>'}</div></section>`;
}
function achievementSection(){
  const currentMonth=allocationMonth(),expenses=state.transactions.filter(t=>t.type==='expense'&&t.isoDate?.startsWith(currentMonth)),checkins=(state.noSpendCheckins||[]).filter(d=>d.startsWith(currentMonth)&&!expenses.some(t=>t.isoDate===d)),streak=state.streak?.count||0;
  const logDays=new Set(state.transactions.filter(t=>t.isoDate?.startsWith(currentMonth)&&['expense','income','transfer'].includes(t.type)).map(t=>t.isoDate)).size;
  const funded=allocationActive().some(a=>allocationPaid(a)>0),completed=allocationActive().some(a=>allocationPaid(a)>=+a.target);
  const items=[
    {icon:'flame',name:'Keep the habit',detail:'Log or review money 3 days in a row',value:Math.min(3,streak),goal:3},
    {icon:'calendar',name:'Money mindful',detail:'Record activity on 7 days this month',value:Math.min(7,logDays),goal:7},
    {icon:'check',name:'No-spend explorer',detail:'Check in on 5 days without expenses',value:Math.min(5,checkins.length),goal:5},
    {icon:'wallet',name:'Put it to work',detail:'Record your first allocation contribution',value:funded?1:0,goal:1},
    {icon:'insights',name:'Goal getter',detail:'Fully fund an allocation target',value:completed?1:0,goal:1}
  ];
  const today=currentDay(),spentToday=expenses.some(t=>t.isoDate===today),checked=(state.noSpendCheckins||[]).includes(today);
  return `<section class="challenge-section home-section"><div class="card-head"><div><h2>Challenges & achievements</h2><p>Small wins from your actual records.</p></div></div><div class="challenge-grid">${items.map(c=>`<article class="card challenge-card ${c.value>=c.goal?'earned':''}"><span class="challenge-icon">${svg(c.icon)}</span><div><strong>${c.name}</strong><small>${c.detail}</small><div class="progress"><span style="width:${c.value/c.goal*100}%"></span></div><small>${c.value}/${c.goal}${c.value>=c.goal?' · Achieved':''}</small></div></article>`).join('')}</div><div class="card no-spend-checkin"><div><strong>Did you have a no-spend day?</strong><small>${checked?'Checked in today':spentToday?'An expense is already recorded today':'Check in once today to count it'}</small></div><button type="button" class="ghost-btn" data-no-spend-checkin ${checked||spentToday?'disabled':''}>${svg('check')} ${checked?'Done':'Check in'}</button></div></section>`;
}
const insightsBeforeAllocation=insights;
insights=function(){return allocationSection()+insightsBeforeAllocation()+achievementSection()};
const homeBeforeAllocation=home;
home=function(){return homeBeforeAllocation()+safeSpendCard()};
const settingsBeforeSafe=more;
more=function(){return settingsBeforeSafe().replace('</section>',`<details class="card settings-block"><summary>Safe to Spend</summary><p>Choose spendable wallets and set a safety cushion. Allocations and unpaid bills due this month are reserved automatically.</p><button type="button" class="ghost-btn safe-config-link" data-safe-settings>${svg('settings')} Configure daily guide</button></details><p class="app-version">Cashual version ${CASHUAL_APP_VERSION}</p></section>`)};

function allocationDialog(a){
  let dialog=document.getElementById('allocationDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='allocationDialog';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  dialog.innerHTML=`<form class="detail-sheet" id="allocationForm"><button type="button" class="detail-close" data-close-allocation aria-label="Close">${svg('close')}</button><p class="overline">${a?'Edit':'New'} allocation</p><h2>Budget allocator</h2><label class="field"><span>Title</span><input name="name" required maxlength="60" placeholder="e.g. Emergency fund" value="${escC(a?.name||'')}"></label><label class="field"><span>Person or purpose (optional)</span><input name="person" maxlength="60" value="${escC(a?.person||'')}"></label><label class="field"><span>Target amount</span><input name="target" type="number" required min="0.01" step="0.01" value="${a?.target||''}"></label><label class="field"><span>Cycle</span><select name="cycle"><option value="monthly" ${a?.cycle!=='once'?'selected':''}>Every month</option><option value="once" ${a?.cycle==='once'?'selected':''}>One-time target</option></select></label><div class="detail-footer"><button class="primary-btn" type="submit">Save allocation</button>${a?`<button type="button" class="danger-action" data-allocation-remove="${escC(a.id)}">${svg('trash')} Delete allocation</button>`:''}</div></form>`;
  dialog.dataset.allocationId=a?.id||'';dialog.showModal();dialog.querySelector('[name="name"]').focus();
}
function contributionDialog(a){
  let dialog=document.getElementById('contributionDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='contributionDialog';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  const wallets=state.wallets.filter(w=>!w.archived);
  dialog.innerHTML=`<form class="detail-sheet" id="contributionForm"><button type="button" class="detail-close" data-close-contribution aria-label="Close">${svg('close')}</button><p class="overline">Record contribution</p><h2>${escC(a.name)}</h2><p>${cash(allocationPaid(a))} of ${cash(a.target)} recorded this ${a.cycle==='once'?'target':'month'}.</p><label class="field"><span>Amount</span><input name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00"></label><label class="field"><span>From wallet</span><select name="from" required>${wallets.map(w=>`<option value="${escC(w.id)}">${escC(w.name)} · ${cash(w.balance)}</option>`).join('')}</select></label><label class="field"><span>Where it goes</span><select name="to"><option value="">Paid or given outside Cashual</option>${wallets.map(w=>`<option value="${escC(w.id)}">Transfer to ${escC(w.name)}</option>`).join('')}</select></label><label class="field"><span>Date</span><input name="date" type="date" required value="${currentDay()}"></label><label class="field"><span>Note (optional)</span><input name="note" maxlength="180"></label><p class="dialog-hint">An external payment becomes an expense. A wallet-to-wallet move is a transfer and does not count as spending.</p><button type="submit" class="primary-btn">Record contribution</button></form>`;
  dialog.dataset.allocationId=a.id;dialog.showModal();dialog.querySelector('[name="amount"]').focus();
}
function safeSettingsDialog(){
  let dialog=document.getElementById('safeSettingsDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='safeSettingsDialog';dialog.className='transaction-detail-dialog';document.body.append(dialog)}
  const selected=spendableWallets().map(w=>w.id);
  dialog.innerHTML=`<form class="detail-sheet" id="safeSettingsForm"><button type="button" class="detail-close" data-close-safe aria-label="Close">${svg('close')}</button><p class="overline">Daily guide</p><h2>Safe to Spend settings</h2><p>Select wallets you actually spend from. Exclude savings and investment wallets to keep the estimate useful.</p><fieldset class="safe-wallet-list"><legend>Spendable wallets</legend>${state.wallets.filter(w=>!w.archived&&w.included!==false).map(w=>`<label><input type="checkbox" name="walletId" value="${escC(w.id)}" ${selected.includes(w.id)?'checked':''}> ${escC(w.name)}</label>`).join('')||'<p>No included wallets yet.</p>'}</fieldset><label class="field"><span>Safety cushion</span><input name="cushion" type="number" min="0" step="0.01" value="${+state.safeSpend?.cushion||0}"></label><button type="submit" class="primary-btn">Save daily guide</button></form>`;
  dialog.showModal();
}
document.addEventListener('click',event=>{
  const add=event.target.closest('[data-allocation-add]'),edit=event.target.closest('[data-allocation-edit]'),contribute=event.target.closest('[data-allocation-contribute]'),safe=event.target.closest('[data-safe-settings]'),checkin=event.target.closest('[data-no-spend-checkin]'),remove=event.target.closest('[data-allocation-remove]');
  if(add)allocationDialog();
  if(edit)allocationDialog(allocationActive().find(a=>a.id===edit.dataset.allocationEdit));
  if(contribute){const a=allocationActive().find(a=>a.id===contribute.dataset.allocationContribute);if(a)contributionDialog(a)}
  if(safe)safeSettingsDialog();
  if(checkin){const today=currentDay();if(state.transactions.some(t=>t.type==='expense'&&t.isoDate===today))return toastMsg('An expense is already recorded today');state.noSpendCheckins??=[];if(!state.noSpendCheckins.includes(today)){state.noSpendCheckins.push(today);save();render();toastMsg('No-spend day checked in')}}
  if(remove){const allocation=allocationActive().find(a=>a.id===remove.dataset.allocationRemove);if(!allocation||!confirm(`Delete “${allocation.name}”? Past contribution transactions will be kept.`))return;state.allocations=allocationActive().filter(a=>a.id!==allocation.id);save();document.getElementById('allocationDialog')?.close();render();toastMsg('Allocation deleted; past transactions kept')}
  for(const [selector,id] of [['[data-close-allocation]','allocationDialog'],['[data-close-contribution]','contributionDialog'],['[data-close-safe]','safeSettingsDialog']])if(event.target.closest(selector))document.getElementById(id)?.close();
});
document.addEventListener('submit',event=>{
  if(event.target.id==='allocationForm'){
    event.preventDefault();const d=Object.fromEntries(new FormData(event.target)),target=Number(d.target),dialog=document.getElementById('allocationDialog');
    if(!d.name?.trim()||!Number.isFinite(target)||target<=0)return toastMsg('Enter a title and positive target');
    const a=allocationActive().find(x=>x.id===dialog.dataset.allocationId)||{id:crypto.randomUUID()};Object.assign(a,{name:d.name.trim(),person:d.person.trim(),target,cycle:d.cycle});if(!allocationActive().includes(a)){state.allocations??=[];state.allocations.push(a)}save();dialog.close();render();toastMsg('Allocation saved');return;
  }
  if(event.target.id==='contributionForm'){
    event.preventDefault();const d=Object.fromEntries(new FormData(event.target)),a=allocationActive().find(x=>x.id===document.getElementById('contributionDialog').dataset.allocationId),from=state.wallets.find(w=>w.id===d.from),to=state.wallets.find(w=>w.id===d.to),amount=Math.round(Number(d.amount)*100)/100;
    if(!a||!from||!Number.isFinite(amount)||amount<=0)return toastMsg('Choose a valid amount and wallet');
    if(from.balance<amount)return toastMsg('Not enough balance in the source wallet');
    if(to&&to.id===from.id)return toastMsg('Choose a different destination wallet');
    from.balance-=amount;if(to)to.balance+=amount;
    state.transactions.unshift({id:crypto.randomUUID(),type:to?'transfer':'expense',title:a.name,amount:-amount,fromId:to?from.id:undefined,toId:to?.id,walletId:from.id,wallet:from.name,category:'Allocation',allocationId:a.id,isoDate:d.date,time:new Date().toTimeString().slice(0,5),note:d.note||'',fee:0});
    save();document.getElementById('contributionDialog').close();render();toastMsg('Contribution recorded');return;
  }
  if(event.target.id==='safeSettingsForm'){
    event.preventDefault();const d=new FormData(event.target),cushion=Number(d.get('cushion'));if(!Number.isFinite(cushion)||cushion<0)return toastMsg('Enter a valid cushion');
    state.safeSpend={walletIds:d.getAll('walletId'),cushion};save();document.getElementById('safeSettingsDialog').close();render();toastMsg('Daily guide updated');
  }
});

/* Keep new records portable in both backup formats. */
const importJsonBeforeAllocator=importJson;
importJson=async function(file){
  if(!file)return;
  let extras;try{extras=JSON.parse(await file.text())}catch{}
  await importJsonBeforeAllocator(file);
  if(extras?.format!=='cashual-backup-v1'||!extras.state)return;
  const source=extras.state;
  if(Array.isArray(source.allocations)){
    state.allocations??=[];
    for(const item of source.allocations){if(!item?.id)continue;const index=state.allocations.findIndex(a=>a.id===item.id);if(index<0)state.allocations.push(item);else state.allocations[index]=item}
  }
  if(Array.isArray(source.noSpendCheckins))state.noSpendCheckins=[...new Set([...(state.noSpendCheckins||[]),...source.noSpendCheckins.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d))])];
  if(source.safeSpend&&typeof source.safeSpend==='object')state.safeSpend=source.safeSpend;
  if(/^#[0-9a-f]{6}$/i.test(source.appAccent||''))state.appAccent=source.appAccent;
  if(/^#[0-9a-f]{6}$/i.test(source.appSurface||''))state.appSurface=source.appSurface;
  if(/^#[0-9a-f]{6}$/i.test(source.appIconColor||''))state.appIconColor=source.appIconColor;
  await save();render();
};
exportCsv=function(){
  const rows=[['type','data']];
  for(const [type,items] of [['wallet',state.wallets],['transaction',state.transactions],['category',state.categories],['bill',state.bills],['loan',state.loans],['budget',state.budgets],['goal',state.goals],['allocation',allocationActive()]])for(const item of items||[])rows.push([type,JSON.stringify(item)]);
  rows.push(['profile',JSON.stringify(userProfile)],['safeSpend',JSON.stringify(state.safeSpend||{})],['noSpendCheckins',JSON.stringify(state.noSpendCheckins||[])],['appAccent',JSON.stringify(state.appAccent||'#d7f36a')],['appSurface',JSON.stringify(state.appSurface||'#f4f4ef')],['appIconColor',JSON.stringify(state.appIconColor||'#1c3c30')]);
  downloadCashual(`cashual-${currentDay()}.csv`,rows.map(row=>row.map(csvQuote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  recordExport();
};
const importCsvBeforeAllocator=importCsv;
importCsv=async function(file){
  if(!file)return;
  let rows;try{rows=csvRows(await file.text());if(rows[0]?.[0]!=='type'||rows[0]?.[1]!=='data')throw Error('Invalid header')}catch{return importCsvBeforeAllocator(file)}
  await importCsvBeforeAllocator(file);
  state.allocations??=[];
  for(const [type,json] of rows.slice(1))try{
    const data=JSON.parse(json);
    if(type==='allocation'&&data?.id){const index=state.allocations.findIndex(a=>a.id===data.id);if(index<0)state.allocations.push(data);else state.allocations[index]=data}
    if(type==='safeSpend'&&data&&typeof data==='object')state.safeSpend=data;
    if(type==='noSpendCheckins'&&Array.isArray(data))state.noSpendCheckins=[...new Set([...(state.noSpendCheckins||[]),...data.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d))])];
    if(type==='appAccent'&&/^#[0-9a-f]{6}$/i.test(data||''))state.appAccent=data;
    if(type==='appSurface'&&/^#[0-9a-f]{6}$/i.test(data||''))state.appSurface=data;
    if(type==='appIconColor'&&/^#[0-9a-f]{6}$/i.test(data||''))state.appIconColor=data;
  }catch{}
  await save();render();
};
render();
