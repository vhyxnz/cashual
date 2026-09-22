/* A readable spending view with the user's actual category artwork. */
icons.search='<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>';
let expenseTypeFilter='all',expenseSearch='';
function expensePeriodItems(){
  const today=currentDay(),start=new Date(today+'T12:00:00');
  if(expenseRange==='weekly')start.setDate(start.getDate()-6);
  else if(expenseRange==='monthly')start.setDate(1);
  else if(expenseRange==='yearly'){start.setMonth(0);start.setDate(1)}
  const from=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
  return state.transactions.filter(t=>(t.isoDate||'')>=from&&(t.isoDate||'')<=today);
}
function expenseVisibleItems(){
  const query=expenseSearch.trim().toLocaleLowerCase();
  return expensePeriodItems().filter(t=>(expenseTypeFilter==='all'||t.type===expenseTypeFilter)&&(!query||`${t.title||''} ${t.category||''} ${t.wallet||''}`.toLocaleLowerCase().includes(query)));
}
function transactionCategory(t){return state.categories.find(c=>c.id===t.categoryId)||state.categories.find(c=>c.name===t.category)}
txRows=function(items=state.transactions){
  if(!items.length)return '<div class="expense-empty">No entries match this view yet.</div>';
  return items.map(t=>{
    const category=transactionCategory(t),icon=category?.icon||t.icon||(t.type==='transfer'?'transfer':t.type==='income'?'income':'expense');
    const color=/^#[0-9a-f]{6}$/i.test(category?.color||'')?category.color:(t.type==='income'?'#83bc6d':t.type==='transfer'?'#88a9e6':'#a8b097');
    const date=t.isoDate?new Date(t.isoDate+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric'}):t.date||'';
    return `<div class="swipe-shell tx-swipe" data-tx-item="${escC(t.id)}"><div class="swipe-back swipe-delete" data-swipe-tx-delete="${escC(t.id)}">${svg('trash')} Delete</div><div class="swipe-surface"><div class="tx transaction-row"><span class="tx-icon category-badge" style="--category-color:${color}" aria-hidden="true">${userIcon(icon)}</span><div class="tx-main"><strong>${escC(t.title||category?.name||'Transaction')}</strong><small>${escC(category?.name||t.category||t.type||'Other')} · ${escC(t.wallet||'Wallet')}</small></div><div class="tx-amount ${+t.amount>0?'positive':''}"><strong>${money(+t.amount||0)}</strong><small>${escC(date)}${t.time?` · ${escC(t.time)}`:''}</small></div>${t.type==='transfer'?'':`<button class="tx-edit" data-edit-tx="${escC(t.id)}" aria-label="Edit ${escC(t.title||'transaction')}" title="Edit">${svg('edit')}</button>`}</div></div></div>`;
  }).join('');
};
transactions=function(){
  const items=expensePeriodItems(),spent=items.filter(t=>t.type==='expense').reduce((sum,t)=>sum+Math.abs(+t.amount||0),0);
  const labels={daily:'today',weekly:'this week',monthly:'this month',yearly:'this year'};
  const visible=expenseVisibleItems();
  return `<section class="expense-page"><div class="expense-intro"><div><p class="expense-eyebrow">Your spending</p><h2>Expenses</h2><p>Explore your activity by period, type, or category.</p></div><button class="primary-btn" data-open="expense" aria-label="Add expense" title="Add expense">${svg('add')}</button></div><div class="expense-periods" role="group" aria-label="Expense period">${[['daily','Day'],['weekly','Week'],['monthly','Month'],['yearly','Year']].map(([key,label])=>`<button class="expense-period ${expenseRange===key?'active':''}" data-expense-period="${key}" aria-pressed="${expenseRange===key}">${label}</button>`).join('')}</div><div class="expense-overview card"><div><span>Spent ${labels[expenseRange]||'today'}</span><strong>${cash(spent)}</strong></div><small>${items.filter(t=>t.type==='expense').length} expense${items.filter(t=>t.type==='expense').length===1?'':'s'} recorded</small></div><div class="expense-list-head"><div><h3>Activity</h3><small id="expenseCount">${visible.length} entr${visible.length===1?'y':'ies'}</small></div></div><div class="expense-controls"><label class="expense-search"><span class="sr-only">Search activity</span>${svg('search')}<input type="search" id="expenseSearch" placeholder="Search name, category, wallet" value="${escC(expenseSearch)}"></label><label class="expense-type"><span class="sr-only">Transaction type</span><select id="expenseTypeFilter"><option value="all" ${expenseTypeFilter==='all'?'selected':''}>All types</option><option value="expense" ${expenseTypeFilter==='expense'?'selected':''}>Expenses</option><option value="income" ${expenseTypeFilter==='income'?'selected':''}>Income</option><option value="transfer" ${expenseTypeFilter==='transfer'?'selected':''}>Transfers</option></select></label></div><div class="expense-list transactions" id="txList">${txRows(visible)}</div></section>`;
};
document.addEventListener('click',event=>{
  const period=event.target.closest('[data-expense-period]');if(!period)return;
  expenseRange=period.dataset.expensePeriod;render();
});
function refreshExpenseList(){const list=document.getElementById('txList');if(!list)return;const items=expenseVisibleItems();list.innerHTML=txRows(items);const count=document.getElementById('expenseCount');if(count)count.textContent=`${items.length} entr${items.length===1?'y':'ies'}`}
document.addEventListener('input',event=>{if(event.target.id==='expenseSearch'){expenseSearch=event.target.value;refreshExpenseList()}});
document.addEventListener('change',event=>{if(event.target.id==='expenseTypeFilter'){expenseTypeFilter=event.target.value;refreshExpenseList()}});
render();
