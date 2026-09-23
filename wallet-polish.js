/* Cashual wallet experience: clean cards, grouping, layouts, activity, and ordering. */
(()=>{
  Object.assign(icons,{
    qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M15 14h2v2h-2zm3 3h2v3h-3m-3-2v2"/>',
    up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>'
  });
  state.walletPrivacy??={};
  state.walletLayout||='grid';

  const gradients={
    cash:['#426a55','#294f43'],bank:['#376b9b','#294b79'],'e-wallet':['#6260a8','#4a477f'],
    savings:['#397b76','#2d625e'],investment:['#71634f','#514738'],'credit card':['#565d77','#42485f'],other:['#596b64','#424f4a']
  };
  const groupChoices=['Cash','Banks','E-wallets','Savings','Investments','Credit','Other'];
  const defaultGroup=wallet=>wallet.group||({cash:'Cash',bank:'Banks','e-wallet':'E-wallets',savings:'Savings',investment:'Investments','credit card':'Credit'}[String(wallet.type||'').toLowerCase()]||'Other');
  const monthKey=()=>currentDay().slice(0,7);
  const walletActivity=wallet=>{
    let income=0,expense=0,net=0;
    for(const tx of state.transactions){
      if(!String(tx.isoDate||tx.date||'').startsWith(monthKey()))continue;
      let amount=+tx.amount||0;
      if(tx.type==='transfer'){
        if(tx.fromId===wallet.id){net-=Math.abs(amount);expense+=Math.abs(amount)}
        if(tx.toId===wallet.id){net+=Math.abs(amount);income+=Math.abs(amount)}
      }else if(tx.walletId===wallet.id||(!tx.walletId&&tx.wallet===wallet.name)){
        net+=amount;if(amount>=0)income+=amount;else expense+=Math.abs(amount);
      }
    }
    return {income,expense,net};
  };
  const maskedIdentifier=wallet=>{
    const raw=String(wallet.identifier||'').trim();
    if(!raw)return wallet.type||'Wallet';
    const compact=raw.replace(/\s+/g,'');
    return /^\d{4,}$/.test(compact)||compact.length>4?`•••• ${compact.slice(-4)}`:raw;
  };
  const iconButton=(attrs,label,icon)=>`<button class="icon-action" ${attrs} aria-label="${escC(label)}" title="${escC(label)}">${svg(icon)}</button>`;

  walletCard=function(wallet){
    const key=String(wallet.type||'other').toLowerCase(),pair=gradients[key]||gradients.other;
    const custom=wallet.color&&wallet.color!=='#d7f36a',first=custom?wallet.color:pair[0],second=custom?(wallet.accent||pair[1]):pair[1];
    const hidden=!!state.walletPrivacy[wallet.id],activity=walletActivity(wallet);
    const activityTotal=activity.income+activity.expense,spentPercent=activityTotal?Math.round(activity.expense/activityTotal*100):0;
    const trend=activity.net===0?'No activity this month':`${activity.net>0?'+':'−'}${cash(Math.abs(activity.net))} this month`;
    return `<div class="wallet-shell" data-wallet-item="${escC(wallet.id)}" draggable="true">
      <article class="wallet-card account-card" style="--wallet-bg:${escC(first)};--accent:${escC(second)};--spent:${spentPercent}%">
        <button class="wallet-main" data-wallet-view="${escC(wallet.id)}" aria-label="View ${escC(wallet.name)} wallet">
          ${wallet.image?`<span class="wallet-brand-badge"><img class="wallet-image" src="${wallet.image}" alt=""></span>`:`<span class="wallet-brand-badge wallet-icon">${userIcon(wallet.icon||'wallet')}</span>`}
          <span class="wallet-name">${escC(wallet.name)}</span>
          <span class="wallet-identifier">${escC(maskedIdentifier(wallet))}</span>
          <strong class="wallet-amount money ${hidden?'card-hidden':''}">${hidden?'••••••':cash(wallet.balance)}</strong>
          <span class="wallet-trend ${activity.net>0?'up':activity.net<0?'down':''}">${escC(trend)}</span>
          <span class="wallet-ring" aria-label="${spentPercent}% of this month's wallet activity is spending"><span>${spentPercent}%</span></span>
        </button>
        <div class="wallet-card-tools">
          <button data-wallet-privacy="${escC(wallet.id)}" aria-label="${hidden?'Show':'Hide'} ${escC(wallet.name)} balance" title="${hidden?'Show':'Hide'} balance">${svg('eye')}</button>
          <button data-wallet-more="${escC(wallet.id)}" aria-label="More actions for ${escC(wallet.name)}" title="More actions">${svg('more')}</button>
        </div>
        <div class="wallet-card-actions" hidden>
          <button data-wallet-transfer="${escC(wallet.id)}">${svg('transfer')}<span>Transfer</span></button>
          <button data-wallet-funds="${escC(wallet.id)}">${svg('add')}<span>Add funds</span></button>
          <button data-wallet-edit="${escC(wallet.id)}">${svg('edit')}<span>Edit</span></button>
          <button data-wallet-qr="${escC(wallet.id)}">${svg('qr')}<span>${wallet.qr?'View QR':'Add QR'}</span></button>
          <button data-wallet-move="up" data-wallet-id="${escC(wallet.id)}">${svg('up')}<span>Move earlier</span></button>
          <button data-wallet-move="down" data-wallet-id="${escC(wallet.id)}">${svg('down')}<span>Move later</span></button>
          <button data-wallet-archive="${escC(wallet.id)}">${svg('archive')}<span>Archive</span></button>
          <button class="wallet-delete" data-wallet-delete="${escC(wallet.id)}">${svg('trash')}<span>Delete</span></button>
        </div>
      </article>
    </div>`;
  };

  function walletDots(items){return `<div class="wallet-page-dots" aria-hidden="true">${items.map((_,index)=>`<i class="${index===0?'active':''}"></i>`).join('')}</div>`}
  wallets=function(){
    const active=state.wallets.filter(wallet=>!wallet.archived),layout=['grid','line','carousel'].includes(state.walletLayout)?state.walletLayout:'grid';
    const header=`<div class="page-head wallet-page-head"><div><h2>Wallets</h2><p>Your accounts, organized at a glance.</p></div><div class="action-pair">${iconButton('data-open="transfer"','Transfer between wallets','transfer')}${iconButton('data-open="wallet"','Add wallet','add')}</div></div>`;
    if(!active.length)return `<section>${header}<div class="card wallet-empty">${svg('wallet')}<h3>Create your first wallet</h3><p>Add cash, a bank account, savings, or an e-wallet to start tracking your money.</p><button class="primary-btn" data-open="wallet">${svg('add')}<span>Add wallet</span></button></div></section>`;
    const groups=groupChoices.map(name=>[name,active.filter(wallet=>defaultGroup(wallet)===name)]).filter(([,items])=>items.length);
    return `<section>${header}<div class="wallet-groups">${groups.map(([name,items])=>`<section class="wallet-group"><div class="wallet-group-head"><div><h3>${escC(name)}</h3><span>${items.length} ${items.length===1?'wallet':'wallets'}</span></div><span class="wallet-group-total money">${cash(items.reduce((sum,wallet)=>sum+(+wallet.balance||0),0))}</span></div><div class="wallet-collection manage-wallets ${layout}-view" data-wallet-carousel>${items.map(walletCard).join('')}</div>${walletDots(items)}</section>`).join('')}</div></section>`;
  };

  const walletFormBeforePolish=enhanceForm;
  enhanceForm=function(kind,id=''){
    walletFormBeforePolish(kind,id);
    if(kind!=='wallet')return;
    const wallet=state.wallets.find(item=>item.id===id),grid=formFields.querySelector('.compact-form,.form-grid');if(!grid)return;
    saveBtn.setAttribute('aria-label',id?'Save wallet changes':'Create wallet');
    const type=formFields.querySelector('[name="type"]');
    if(type&&!Array.from(type.options).some(option=>option.value==='Investment'))type.insertAdjacentHTML('beforeend','<option value="Investment">Investment</option>');
    const group=wallet?.group||defaultGroup({type:type?.value});
    grid.insertAdjacentHTML('beforeend',`${field('Account label (optional)','identifier','text',wallet?.identifier||'','placeholder="Last four digits or nickname"')}${select('Group','group',groupChoices.map(name=>[name,name]),group)}`);
  };

  const walletSubmitBeforePolish=entryForm.onsubmit;
  entryForm.onsubmit=async event=>{
    const kind=editRecord?.kind||formDialog.dataset.kind,id=editRecord?.id,before=new Set(state.wallets.map(wallet=>wallet.id));
    const data=kind==='wallet'?Object.fromEntries(new FormData(entryForm)):null;
    await walletSubmitBeforePolish(event);
    if(kind!=='wallet'||event.defaultPrevented===false)return;
    const wallet=id?state.wallets.find(item=>item.id===id):state.wallets.find(item=>!before.has(item.id));
    if(wallet){wallet.identifier=String(data.identifier||'').trim();wallet.group=groupChoices.includes(data.group)?data.group:defaultGroup(wallet);await save();render()}
  };

  const settingsBeforeWalletPolish=more;
  more=function(){
    const markup=settingsBeforeWalletPolish();
    const content=`<details class="settings-row" open><summary>Wallet display</summary><div class="toggle-grid wallet-layout-options"><label><input type="radio" name="walletLayout" value="grid" ${state.walletLayout==='grid'?'checked':''}> Grid cards</label><label><input type="radio" name="walletLayout" value="line" ${state.walletLayout==='line'?'checked':''}> Compact list</label><label><input type="radio" name="walletLayout" value="carousel" ${state.walletLayout==='carousel'?'checked':''}> Swipe carousel</label></div></details>`;
    return markup.replace(/<details class="settings-row"[^>]*><summary>Wallet display<\/summary>[\s\S]*?<\/details>/,content);
  };

  function moveWallet(id,direction,targetId=''){
    const from=state.wallets.findIndex(wallet=>wallet.id===id);if(from<0)return;
    let to=targetId?state.wallets.findIndex(wallet=>wallet.id===targetId):from+(direction==='up'?-1:1);
    if(to<0||to>=state.wallets.length||to===from)return;
    const [wallet]=state.wallets.splice(from,1);if(from<to)to--;state.wallets.splice(to,0,wallet);save();render();toastMsg('Wallet order updated');
  }

  document.addEventListener('click',event=>{
    const remove=event.target.closest('[data-wallet-delete]'),qr=event.target.closest('[data-wallet-qr]'),move=event.target.closest('[data-wallet-move]');
    if(!remove&&!qr&&!move){if(!event.target.closest('[data-wallet-more],.wallet-card-actions'))document.querySelectorAll('.wallet-card-actions:not([hidden])').forEach(menu=>menu.hidden=true);return}
    event.preventDefault();event.stopImmediatePropagation();
    if(move)return moveWallet(move.dataset.walletId,move.dataset.walletMove);
    const id=remove?.dataset.walletDelete||qr?.dataset.walletQr,wallet=state.wallets.find(item=>item.id===id);if(!wallet)return;
    if(qr){
      if(wallet.qr){selectedWallet=wallet.id;location.hash='wallet-detail';render();setTimeout(()=>document.querySelector('.qr-card')?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
      else{enhanceForm('wallet',wallet.id);toastMsg('Choose a QR code image in wallet settings')}
      return;
    }
    if(!confirm(`Delete “${wallet.name}”? Its transaction history will be kept, but this wallet cannot be restored.`))return;
    state.wallets=state.wallets.filter(item=>item.id!==wallet.id);state.loans?.forEach(loan=>{if(loan.walletId===wallet.id)loan.walletId=''});delete state.walletPrivacy[wallet.id];
    save();if(selectedWallet===wallet.id){selectedWallet=null;location.hash='wallets'}render();toastMsg('Wallet deleted; transaction history kept');
  },true);

  let draggedWallet='';
  document.addEventListener('dragstart',event=>{const card=event.target.closest('[data-wallet-item]');if(!card)return;draggedWallet=card.dataset.walletItem;card.classList.add('is-dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggedWallet)});
  document.addEventListener('dragend',event=>{event.target.closest('[data-wallet-item]')?.classList.remove('is-dragging');document.querySelectorAll('.drag-target').forEach(item=>item.classList.remove('drag-target'));draggedWallet=''});
  document.addEventListener('dragover',event=>{const target=event.target.closest('[data-wallet-item]');if(!target||!draggedWallet||target.dataset.walletItem===draggedWallet)return;event.preventDefault();document.querySelectorAll('.drag-target').forEach(item=>item.classList.remove('drag-target'));target.classList.add('drag-target')});
  document.addEventListener('drop',event=>{const target=event.target.closest('[data-wallet-item]');if(!target||!draggedWallet)return;event.preventDefault();moveWallet(draggedWallet,'',target.dataset.walletItem)});

  function setupWalletCarousels(){
    document.querySelectorAll('[data-wallet-carousel]').forEach(collection=>{
      const group=collection.closest('.wallet-group'),dots=[...group?.querySelectorAll('.wallet-page-dots i')||[]],cards=[...collection.querySelectorAll('.wallet-shell')];
      const update=()=>{if(!cards.length)return;const center=collection.scrollLeft+collection.clientWidth/2;let active=0,best=Infinity;cards.forEach((card,index)=>{const distance=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(distance<best){best=distance;active=index}card.classList.toggle('is-active',index===active)});dots.forEach((dot,index)=>dot.classList.toggle('active',index===active))};
      collection.addEventListener('scroll',update,{passive:true});update();
    });
  }
  const renderBeforeWalletPolish=render;
  render=function(){renderBeforeWalletPolish();setupWalletCarousels()};
  render();
})();
