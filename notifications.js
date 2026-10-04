/* Useful local alerts for bills, budgets, daily spending, and wallet health. */
(()=>{
  function alertItems(){
    const items=[],today=new Date(`${currentDay()}T12:00:00`);
    for(const bill of state.bills||[]){
      const due=billDate(bill),date=new Date(`${due}T12:00:00`),days=Math.ceil((date-today)/86400000),status=billStatus(bill);
      if(status==='Paid'||days>7)continue;
      const urgent=days<0,title=urgent?`${bill.name} is overdue`:days===0?`${bill.name} is due today`:`${bill.name} is due in ${days} day${days===1?'':'s'}`;
      items.push({key:`bill:${bill.id}:${due}:${status}`,icon:'receipt',tone:urgent?'danger':'warn',title,detail:`${cash(bill.amount)} · ${bill.category||'Bill'}`,route:'bills'});
    }
    for(const budget of state.budgets||[]){
      const spent=budgetSpent(budget),ratio=spent/(+budget.limit||1);
      if(ratio<.8)continue;
      const percent=Math.round(ratio*100),over=ratio>1;
      items.push({key:`budget:${budget.id}:${Math.floor(percent/5)}`,icon:'insights',tone:over?'danger':'warn',title:over?`${budget.name} is over budget`:`${budget.name} is ${percent}% used`,detail:`${cash(spent)} of ${cash(budget.limit)}`,route:'insights'});
    }
    const activeWallets=(state.wallets||[]).filter(wallet=>!wallet.archived);
    if(activeWallets.length){
      const safe=safeSpendSnapshot();
      if(safe.available<0)items.push({key:`safe:short:${Math.round(-safe.available)}`,icon:'calendar',tone:'danger',title:'Safe to Spend is below zero',detail:`You are ${cash(-safe.available)} short after planned commitments.`,route:'insights'});
      else if(safe.perDay>0&&safe.perDay<100)items.push({key:`safe:low:${Math.round(safe.perDay/10)}`,icon:'calendar',tone:'info',title:'Your daily spending room is tight',detail:`${cash(safe.perDay)} is available per day.`,route:'insights'});
    }
    for(const wallet of activeWallets.filter(wallet=>(+wallet.balance||0)<0))items.push({key:`wallet:${wallet.id}:negative`,icon:'wallet',tone:'danger',title:`${wallet.name} has a negative balance`,detail:cash(wallet.balance),route:'wallets'});
    return items;
  }

  function ensureCenter(){
    let dialog=document.getElementById('notificationCenter');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='notificationCenter';dialog.className='notification-center';
    dialog.innerHTML=`<section class="notification-sheet"><header><div><p class="overline">Cashual alerts</p><h2>Notifications</h2></div><button type="button" class="detail-close" data-notification-close aria-label="Close notifications">${svg('close')}</button></header><div class="notification-list"></div><footer><button type="button" class="ghost-btn notification-permission" data-notification-permission></button><small>Device alerts are generated locally. Cashual never sends your financial data to a server.</small></footer></section>`;
    document.body.append(dialog);return dialog;
  }

  function permissionCopy(){
    if(!('Notification'in window))return 'Device alerts unavailable';
    if(Notification.permission==='granted')return state.deviceNotifications?'Device alerts enabled':'Enable device alerts';
    if(Notification.permission==='denied')return 'Device alerts blocked';
    return 'Enable device alerts';
  }

  function renderCenter(){
    const dialog=ensureCenter(),items=alertItems(),list=dialog.querySelector('.notification-list'),permission=dialog.querySelector('[data-notification-permission]');
    list.innerHTML=items.length?items.map(item=>`<button type="button" class="notification-item ${item.tone}" data-notification-route="${item.route}">${svg(item.icon)}<span><strong>${escC(item.title)}</strong><small>${escC(item.detail)}</small></span>${svg('arrow')}</button>`).join(''):`<div class="notification-empty">${svg('check')}<strong>You’re all caught up</strong><small>Upcoming bills and money warnings will appear here.</small></div>`;
    permission.textContent=permissionCopy();permission.disabled=!('Notification'in window)||Notification.permission==='denied'||state.deviceNotifications===true;
    return items;
  }

  function updateBell(){
    const items=alertItems(),seen=new Set(state.notificationSeenKeys||[]),unread=items.filter(item=>!seen.has(item.key)).length,badge=notifBtn.querySelector('i');
    badge.hidden=unread===0;badge.textContent=unread>9?'9+':String(unread);notifBtn.title=unread?`${unread} unread notification${unread===1?'':'s'}`:'Notifications';notifBtn.setAttribute('aria-label',notifBtn.title);
    maybeSendDeviceAlert(items);
  }

  async function maybeSendDeviceAlert(items){
    if(!state.deviceNotifications||!('Notification'in window)||Notification.permission!=='granted'||!items.length)return;
    const notified=new Set(state.deviceNotificationKeys||[]),fresh=items.filter(item=>!notified.has(item.key));if(!fresh.length)return;
    const options={body:fresh.length===1?fresh[0].title:`${fresh.length} items need your attention`,icon:'cashual-icon-192.png?v=1.4.8',badge:'cashual-icon-192.png?v=1.4.8',tag:'cashual-alert-summary'};
    try{const registration=await navigator.serviceWorker?.ready;if(registration)await registration.showNotification('Cashual',options);else new Notification('Cashual',options);state.deviceNotificationKeys=items.map(item=>item.key);save()}catch{}
  }

  async function enableDeviceAlerts(){
    if(!('Notification'in window))return toastMsg('Device alerts are not supported here');
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){renderCenter();return toastMsg('Notification permission was not granted')}
    state.deviceNotifications=true;state.deviceNotificationKeys=[];await save();renderCenter();updateBell();toastMsg('Device alerts enabled');
  }

  notifBtn.onclick=()=>{
    const dialog=ensureCenter(),items=renderCenter();dialog.showModal();notifBtn.setAttribute('aria-expanded','true');
    state.notificationSeenKeys=items.map(item=>item.key);save();updateBell();
  };
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-notification-close]')){ensureCenter().close();notifBtn.setAttribute('aria-expanded','false');return}
    if(event.target.closest('[data-notification-permission]')){enableDeviceAlerts();return}
    const route=event.target.closest('[data-notification-route]')?.dataset.notificationRoute;if(route){ensureCenter().close();notifBtn.setAttribute('aria-expanded','false');location.hash=route;render()}
  });
  ensureCenter().addEventListener('close',()=>notifBtn.setAttribute('aria-expanded','false'));
  const renderBeforeNotifications=render;
  render=function(){renderBeforeNotifications();updateBell()};
  updateBell();
})();
