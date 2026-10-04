/* Cashual interface refresh: a quieter hierarchy with five stable navigation positions. */
(()=>{
  icons.overflow='<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>';

  const recentTransactions=()=>[...state.transactions].sort((a,b)=>`${b.isoDate||''}T${b.time||''}`.localeCompare(`${a.isoDate||''}T${a.time||''}`)).slice(0,3);
  const upcomingBills=()=>state.bills.filter(b=>billStatus(b)!=='Paid').sort((a,b)=>billDate(a).localeCompare(billDate(b))).slice(0,2);
  const billArtwork=b=>`<span class="home-bill-logo" aria-hidden="true">${b.image?`<img src="${b.image}" alt="">`:userIcon(b.icon||'receipt')}</span>`;
  const emptyState=(icon,title,copy,route,label)=>`<div class="pro-empty">${svg(icon)}<div><strong>${title}</strong><small>${copy}</small></div>${route?`<button type="button" class="text-btn" data-route="${route}">${label}</button>`:''}</div>`;

  home=function(){
    const wallets=state.wallets.filter(w=>!w.archived),net=wallets.filter(w=>w.included!==false).reduce((sum,w)=>sum+(+w.balance||0),0),month=monthStats(),safe=safeSpendSnapshot(),recent=recentTransactions(),bills=upcomingBills(),streak=state.streak||{count:0,best:0},sections=state.homeSections||{};
    const streakChip=sections.streak===false?'':`<span class="home-streak-chip" title="Best streak: ${streak.best||0} days">${svg('flame')} ${streak.count||1} day${(streak.count||1)===1?'':'s'}</span>`;
    const balance=`<section class="dashboard-grid pro-summary"><article class="balance-card pro-balance"><div class="pro-balance-top"><div class="card-label">Net balance</div>${streakChip}</div><div class="balance money">${cash(net)}</div><div class="balance-row"><div class="metric"><span>Income</span><strong>${cash(month.income)}</strong></div><div class="metric"><span>Expenses</span><strong>${month.expenses<0?'−':''}${cash(month.expenses)}</strong></div><div class="metric"><span>Net saved</span><strong>${month.saved<0?'−':''}${cash(month.saved)}</strong></div></div></article></section>`;
    const safeCard=`<section class="safe-spend-card pro-safe"><div><p class="overline">Daily guide</p><h2>Safe to Spend</h2><p>${safe.days} day${safe.days===1?'':'s'} left · ${safe.available<0?`${cash(-safe.available)} short`:`${cash(Math.max(0,safe.available))} available`}</p></div><div class="pro-safe-value"><strong>${cash(safe.perDay)}</strong><small>per day</small></div><button type="button" class="safe-settings" data-safe-settings aria-label="Configure Safe to Spend" title="Configure Safe to Spend">${svg('settings')}</button></section>`;
    const activity=sections.activity===false?'':`<section class="home-section pro-section pro-activity"><div class="card-head"><div><p class="section-kicker">Latest</p><h2>Recent activity</h2></div><button type="button" class="text-btn" data-route="transactions">View all</button></div><div class="transactions">${recent.length?txRows(recent):emptyState('transactions','No activity yet','Your newest transactions will appear here.','transactions','Add expense')}</div></section>`;
    const coming=sections.bills===false?'':`<section class="home-section upcoming-strip pro-section"><div class="card-head"><div><p class="section-kicker">Next due</p><h2>Coming up</h2></div><button type="button" class="text-btn" data-route="bills">View all</button></div>${bills.length?bills.map(b=>`<a href="#bills" class="upcoming-row pro-upcoming-row" data-route="bills" aria-label="Open ${escC(b.name)} bill">${billArtwork(b)}<span class="pro-row-copy"><strong>${escC(b.name)}</strong><small>${escC(b.category||'Bill')} · ${escC(billDate(b))}</small></span><span class="pro-row-value"><strong>${cash(b.amount)}</strong><small class="due-badge ${billStatus(b)==='Overdue'?'overdue':''}">${escC(billStatus(b))}</small></span></a>`).join(''):emptyState('receipt','Nothing due soon','Bills and subscriptions will appear here.','bills','Add bill')}</section>`;
    const walletSection=sections.wallets===false?'':`<section class="home-section pro-section pro-wallets"><div class="card-head"><div><p class="section-kicker">Accounts</p><h2>Wallets</h2></div><button type="button" class="text-btn" data-route="wallets">View all</button></div>${wallets.length?`<div class="wallet-strip">${wallets.slice(0,3).map(walletCard).join('')}</div>`:emptyState('wallet','Add your first wallet','Create a balance before recording transactions.','wallets','Add wallet')}</section>`;
    return `${balance}${safeCard}${activity}${coming}${walletSection}`;
  };

  setupNav=function(){
    const primary=[['home','home','Home'],['transactions','transactions','Activity'],['wallets','wallet','Wallets'],['insights','insights','Insights'],['more','settings','Settings']],secondary=[['bills','receipt','Bills'],['loans','loan','Loans'],['calendar','calendar','Calendar']];
    const item=([id,icon,label])=>`<button type="button" class="nav-item ${route===id?'active':''}" data-route="${id}"><span>${svg(icon)}</span>${label}</button>`;
    desktopNav.innerHTML=`<div class="rail-primary">${primary.map(item).join('')}</div><div class="rail-secondary"><small>Plan & organize</small>${secondary.map(item).join('')}</div>`;
    desktopNav.querySelectorAll('[data-route]').forEach(button=>button.onclick=()=>{location.hash=button.dataset.route});
  };

  drawMobileNav=function(){
    const current=location.hash.slice(1)||'home',labels=navLayout()==='both',extras=[['bills','receipt','Bills'],['loans','loan','Loans'],['calendar','calendar','Calendar'],['insights','insights','Insights'],['more','settings','Settings']];
    const item=([id,icon,label])=>`<button type="button" class="mobile-nav-choice ${current===id?'active':''}" data-mobile-route="${id}" aria-label="${label}" title="${label}">${svg(icon)}<span class="mobile-nav-label">${label}</span></button>`;
    document.body.dataset.currentRoute=current;document.body.dataset.showFab='no';mobileNav.classList.toggle('nav-icons-only',!labels);
    mobileNav.innerHTML=item(['home','home','Home'])+item(['transactions','transactions','Activity'])+`<button type="button" class="mobile-nav-add" data-quick aria-label="Add transaction" title="Add transaction">${svg('add')}</button>`+item(['wallets','wallet','Wallets'])+`<button type="button" class="mobile-nav-choice ${extras.some(([id])=>id===current)?'active':''}" data-nav-more aria-label="More" aria-expanded="false" aria-controls="mobileNavDrawer" title="More">${svg('overflow')}<span class="mobile-nav-label">More</span></button><div class="mobile-nav-drawer" id="mobileNavDrawer" hidden><div class="mobile-nav-drawer-title">More</div>${extras.map(item).join('')}<button type="button" class="mobile-nav-choice" data-sweldo-shortcut aria-label="Open Sweldo" title="Open Sweldo">${svg('sweldo')}<span class="mobile-nav-label">Sweldo</span></button></div>`;
  };

  const proHomeCards=[['summary','Balance'],['safe','Safe to Spend'],['activity','Recent activity'],['upcoming','Coming up'],['wallets','Wallets']],proHomeKeys=proHomeCards.map(([key])=>key);
  const savedHomeOrder=Array.isArray(state.homeOrder)?state.homeOrder:[];
  state.homeOrder=[...savedHomeOrder.filter((key,index)=>proHomeKeys.includes(key)&&savedHomeOrder.indexOf(key)===index),...proHomeKeys.filter(key=>!savedHomeOrder.includes(key)),...savedHomeOrder.filter(key=>!proHomeKeys.includes(key))];
  const interfaceMoreBase=more;
  more=function(){
    const markup=interfaceMoreBase(),visible=key=>state.homeSections?.[key]!==false,order=state.homeOrder.filter(key=>proHomeKeys.includes(key));
    const editor=`<details class="settings-row home-display-editor"><summary><span>${svg('home')}</span><div><strong>Home display</strong><small>Visible sections and their order</small></div></summary><div class="settings-row-content"><div class="toggle-grid"><label><input type="checkbox" data-home-toggle="streak" ${visible('streak')?'checked':''}> Streak in balance</label><label><input type="checkbox" data-home-toggle="activity" ${visible('activity')?'checked':''}> Recent activity</label><label><input type="checkbox" data-home-toggle="bills" ${visible('bills')?'checked':''}> Coming up</label><label><input type="checkbox" data-home-toggle="wallets" ${visible('wallets')?'checked':''}> Wallets</label></div><div class="home-order-editor"><div><strong>Section order</strong><small>Balance and Safe to Spend remain available at all times.</small></div><div class="home-order-list">${order.map((key,index)=>{const label=proHomeCards.find(item=>item[0]===key)?.[1]||key;return `<div><span>${label}</span><div><button type="button" data-pro-home-order="${key}" data-pro-direction="up" aria-label="Move ${label} up" ${index===0?'disabled':''}>${svg('up')}</button><button type="button" data-pro-home-order="${key}" data-pro-direction="down" aria-label="Move ${label} down" ${index===order.length-1?'disabled':''}>${svg('down')}</button></div></div>`}).join('')}</div></div></div></details>`;
    return markup.replace(/<details class="settings-row"[^>]*><summary>Home display<\/summary>[\s\S]*?<\/details>/,editor);
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-pro-home-order]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    const visibleOrder=state.homeOrder.filter(key=>proHomeKeys.includes(key)),from=visibleOrder.indexOf(button.dataset.proHomeOrder),to=button.dataset.proDirection==='up'?from-1:from+1;if(from<0||to<0||to>=visibleOrder.length)return;
    [visibleOrder[from],visibleOrder[to]]=[visibleOrder[to],visibleOrder[from]];state.homeOrder=[...visibleOrder,...state.homeOrder.filter(key=>!proHomeKeys.includes(key))];save();
    const row=button.closest('.home-order-list>div'),list=row?.parentElement;if(!row||!list)return;if(button.dataset.proDirection==='up')list.insertBefore(row,row.previousElementSibling);else list.insertBefore(row.nextElementSibling,row);[...list.children].forEach((item,index,items)=>{const controls=item.querySelectorAll('[data-pro-direction]');controls[0].disabled=index===0;controls[1].disabled=index===items.length-1});
  },true);

  const interfaceRenderBase=render;
  render=function(){interfaceRenderBase();document.body.classList.add('interface-refreshed')};
  const stopViewportGesture=event=>event.preventDefault();
  document.addEventListener('gesturestart',stopViewportGesture,{passive:false});
  document.addEventListener('gesturechange',stopViewportGesture,{passive:false});
  document.addEventListener('gestureend',stopViewportGesture,{passive:false});
  render();
})();
