/* Cashual wallet experience: clean cards, grouping, layouts, activity, and ordering. */
(()=>{
  Object.assign(icons,{
    qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M15 14h2v2h-2zm3 3h2v3h-3m-3-2v2"/>',
    up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',
    sweldo:'<path fill="currentColor" stroke="none" d="M18.4 5.4A12.8 12.8 0 0 0 12 3.7c-4.2 0-7 2.1-7 5.3 0 3 2.3 4.3 6.2 5.3 2.7.7 3.8 1.3 3.8 2.5 0 1.1-1.2 1.9-3.1 1.9-2.5 0-4.9-1-6.7-2.5l-2.3 3.1a13.7 13.7 0 0 0 9 3.1c4.6 0 7.7-2.2 7.7-5.7 0-3.1-2.3-4.6-6.7-5.7-2.7-.7-3.6-1.2-3.6-2.3 0-1 1.1-1.7 2.9-1.7 2 0 4 .7 5.7 1.8z"/><circle cx="20.5" cy="19.2" r="1.8" fill="#145cff" stroke="none"/>'
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
          <span class="wallet-ring" title="Monthly spending share: ${spentPercent}%" aria-label="Monthly spending share: ${spentPercent}%"><span><b>${spentPercent}%</b><small>spent</small></span></span>
        </button>
        <div class="wallet-card-tools">
          ${wallet.qr?`<button data-wallet-qr-shortcut="${escC(wallet.id)}" aria-label="Show QR code for ${escC(wallet.name)}" title="Show QR code">${svg('qr')}</button>`:''}
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

  function showWalletQr(wallet){
    let dialog=document.getElementById('walletQrPopup');
    if(!dialog){
      document.body.insertAdjacentHTML('beforeend',`<dialog id="walletQrPopup" class="wallet-qr-popup"><div><button type="button" class="close" data-wallet-qr-close aria-label="Close QR code">×</button><p class="overline">Wallet QR code</p><h2 id="walletQrTitle"></h2><div class="wallet-qr-frame"><img id="walletQrImage" alt=""></div><p class="wallet-qr-hint">Present this code when receiving money.</p></div></dialog>`);
      dialog=document.getElementById('walletQrPopup');
    }
    const image=dialog.querySelector('#walletQrImage'),title=dialog.querySelector('#walletQrTitle');title.textContent=wallet.name;image.src=wallet.qr;image.alt=`QR code for ${wallet.name}`;dialog.showModal();
  }

  const qrCropData=new Map(),fileDataBeforeQrCrop=fileData;
  const fileKey=file=>file&&`${file.name}:${file.size}:${file.lastModified}`;
  fileData=async file=>qrCropData.get(fileKey(file))||fileDataBeforeQrCrop(file);
  let qrCropSession=null;
  function ensureQrCropDialog(){
    let dialog=document.getElementById('qrCropDialog');if(dialog)return dialog;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="qrCropDialog" class="qr-crop-dialog"><div><button type="button" class="close" data-qr-crop-cancel aria-label="Close crop editor">×</button><p class="overline">QR image</p><h2>Crop your QR code</h2><p class="qr-crop-copy">Keep the full code and its quiet border inside the square.</p><canvas id="qrCropCanvas" width="640" height="640"></canvas><div class="qr-crop-controls"><label><span>Zoom</span><input name="qrCropZoom" type="range" min="1" max="3" step="0.01" value="1"></label><label><span>Left / right</span><input name="qrCropX" type="range" min="-100" max="100" step="1" value="0"></label><label><span>Up / down</span><input name="qrCropY" type="range" min="-100" max="100" step="1" value="0"></label></div><div class="form-actions"><button type="button" class="ghost-btn" data-qr-use-full>Use full image</button><button type="button" class="primary-btn" data-qr-crop-apply>Apply crop</button></div></div></dialog>`);
    return document.getElementById('qrCropDialog');
  }
  function drawQrCrop(){
    if(!qrCropSession)return;const {dialog,image}=qrCropSession,canvas=dialog.querySelector('#qrCropCanvas'),context=canvas.getContext('2d'),size=canvas.width;
    const zoom=+dialog.querySelector('[name="qrCropZoom"]').value,x=+dialog.querySelector('[name="qrCropX"]').value/100,y=+dialog.querySelector('[name="qrCropY"]').value/100;
    const scale=Math.max(size/image.naturalWidth,size/image.naturalHeight)*zoom,width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    const overflowX=Math.max(0,(width-size)/2),overflowY=Math.max(0,(height-size)/2),left=(size-width)/2-x*overflowX,top=(size-height)/2-y*overflowY;
    context.fillStyle='#fff';context.fillRect(0,0,size,size);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,left,top,width,height);
  }
  function openQrCrop(input,file){
    const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const dialog=ensureQrCropDialog();dialog.querySelectorAll('input[type="range"]').forEach(control=>control.value=control.name==='qrCropZoom'?'1':'0');qrCropSession={dialog,image,input,file};drawQrCrop();dialog.showModal()};image.src=reader.result};reader.readAsDataURL(file);
  }
  function closeQrCrop(clear=false){if(!qrCropSession)return;if(clear)qrCropSession.input.value='';qrCropSession.dialog.close();qrCropSession=null}

  document.addEventListener('change',event=>{
    if(event.target.matches('input[name="qr"][type="file"]')&&event.target.files?.[0])openQrCrop(event.target,event.target.files[0]);
    if(event.target.closest?.('.qr-crop-dialog')&&event.target.matches('input[type="range"]'))drawQrCrop();
  });
  document.addEventListener('input',event=>{if(event.target.closest?.('.qr-crop-dialog')&&event.target.matches('input[type="range"]'))drawQrCrop()});
  document.addEventListener('click',event=>{
    const cancel=event.target.closest('[data-qr-crop-cancel]'),full=event.target.closest('[data-qr-use-full]'),apply=event.target.closest('[data-qr-crop-apply]');if(!cancel&&!full&&!apply)return;
    event.preventDefault();
    if(cancel)return closeQrCrop(true);
    if(full)return closeQrCrop(false);
    if(!qrCropSession)return;
    const {dialog,input,file}=qrCropSession,data=dialog.querySelector('#qrCropCanvas').toDataURL('image/png'),binary=atob(data.split(',')[1]),bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
    const cropped=new File([bytes],`${file.name.replace(/\.[^.]+$/,'')||'wallet-qr'}-cropped.png`,{type:'image/png',lastModified:Date.now()});qrCropData.set(fileKey(cropped),data);qrCropData.set(fileKey(file),data);
    try{const transfer=new DataTransfer();transfer.items.add(cropped);input.files=transfer.files}catch{}
    input.closest('.field')?.classList.add('qr-crop-ready');closeQrCrop(false);toastMsg('QR crop ready');
  });

  document.addEventListener('click',event=>{
    const remove=event.target.closest('[data-wallet-delete]'),qr=event.target.closest('[data-wallet-qr],[data-wallet-qr-shortcut]'),move=event.target.closest('[data-wallet-move]'),closeQr=event.target.closest('[data-wallet-qr-close]');
    if(closeQr){event.preventDefault();document.getElementById('walletQrPopup')?.close();return}
    if(!remove&&!qr&&!move){if(!event.target.closest('[data-wallet-more],.wallet-card-actions'))document.querySelectorAll('.wallet-card-actions:not([hidden])').forEach(menu=>menu.hidden=true);return}
    event.preventDefault();event.stopImmediatePropagation();
    if(move)return moveWallet(move.dataset.walletId,move.dataset.walletMove);
    const id=remove?.dataset.walletDelete||qr?.dataset.walletQr||qr?.dataset.walletQrShortcut,wallet=state.wallets.find(item=>item.id===id);if(!wallet)return;
    if(qr){
      if(wallet.qr)showWalletQr(wallet)
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
  const homeCardDefinitions=[['streak','Daily streak'],['summary','Balance & shortcuts'],['upcoming','Coming up'],['cashflow','Monthly cash flow'],['spending','Expenses by category'],['activity','Recent activity'],['wallets','Wallets'],['bills','Bills'],['safe','Safe to Spend']];
  const homeCardKeys=homeCardDefinitions.map(([key])=>key);
  function normalizedHomeOrder(){const saved=Array.isArray(state.homeOrder)?state.homeOrder:[];return [...saved.filter((key,index)=>homeCardKeys.includes(key)&&saved.indexOf(key)===index),...homeCardKeys.filter(key=>!saved.includes(key))]}
  state.homeOrder=normalizedHomeOrder();
  function homeOrderKey(section){if(section.classList.contains('streak-card'))return 'streak';if(section.classList.contains('dashboard-grid'))return 'summary';if(section.classList.contains('upcoming-strip'))return 'upcoming';if(section.classList.contains('safe-spend-card'))return 'safe';const heading=section.querySelector('h2')?.textContent.trim();return {'Coming up':'upcoming','Monthly cash flow':'cashflow','Expenses by category':'spending','Recent activity':'activity','Wallets':'wallets','Bills':'bills'}[heading]||''}
  function applyHomeCardOrder(){if((location.hash.slice(1)||'home')!=='home')return;const sections=[...view.querySelectorAll(':scope > section')],byKey=new Map(sections.map(section=>[homeOrderKey(section),section]).filter(([key])=>key));for(const key of normalizedHomeOrder()){const section=byKey.get(key);if(section)view.append(section)}}
  function homeBillMark(bill){const mark=document.createElement('span');mark.className='home-bill-logo';mark.setAttribute('aria-hidden','true');mark.innerHTML=bill?.image?`<img src="${bill.image}" alt="">`:userIcon(bill?.icon||'receipt');return mark}
  function decorateHomeBills(){if((location.hash.slice(1)||'home')!=='home')return;const upcoming=state.bills.filter(b=>billStatus(b)!=='Paid').sort((a,b)=>billDate(a).localeCompare(billDate(b))).slice(0,3);view.querySelectorAll('.upcoming-strip .upcoming-row').forEach((row,index)=>{if(!row.querySelector('.home-bill-logo')&&upcoming[index])row.prepend(homeBillMark(upcoming[index]))});const billsSection=[...view.querySelectorAll(':scope > section')].find(section=>homeOrderKey(section)==='bills');billsSection?.querySelectorAll('.home-bill-row,.event').forEach((row,index)=>{const bill=state.bills[index];if(!row.querySelector('.home-bill-logo')&&bill)row.prepend(homeBillMark(bill))})}
  const moreBeforeHomeOrder=more;
  more=function(){const order=normalizedHomeOrder(),organizer=`<div class="home-order-editor"><div><strong>Card order</strong><small>Choose how cards appear on Home.</small></div><div class="home-order-list">${order.map((key,index)=>{const label=homeCardDefinitions.find(item=>item[0]===key)?.[1]||key;return `<div><span>${escC(label)}</span><div><button type="button" data-home-order="${key}" data-home-direction="up" aria-label="Move ${escC(label)} up" title="Move up" ${index===0?'disabled':''}>${svg('up')}</button><button type="button" data-home-order="${key}" data-home-direction="down" aria-label="Move ${escC(label)} down" title="Move down" ${index===order.length-1?'disabled':''}>${svg('down')}</button></div></div>`}).join('')}</div></div>`;return moreBeforeHomeOrder().replace(/(<summary>Home display<\/summary>[\s\S]*?<div class="toggle-grid">[\s\S]*?<\/div>)(<\/details>)/,'$1'+organizer+'$2')};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-home-order]');if(!button)return;event.preventDefault();const order=normalizedHomeOrder(),from=order.indexOf(button.dataset.homeOrder),to=button.dataset.homeDirection==='up'?from-1:from+1;if(from<0||to<0||to>=order.length)return;[order[from],order[to]]=[order[to],order[from]];state.homeOrder=order;save();const row=button.closest('.home-order-list > div'),list=row?.parentElement;if(!row||!list)return;if(button.dataset.homeDirection==='up')list.insertBefore(row,row.previousElementSibling);else list.insertBefore(row.nextElementSibling,row);[...list.children].forEach((item,index,items)=>{const controls=item.querySelectorAll('[data-home-direction]');controls[0].disabled=index===0;controls[1].disabled=index===items.length-1})});
  const renderBeforeWalletPolish=render;
  render=function(){renderBeforeWalletPolish();setupWalletCarousels();applyHomeCardOrder();decorateHomeBills()};
  const homeBeforeSweldo=home;
  home=function(){return homeBeforeSweldo().replace('</div></article></section>',`<button class="icon-only" data-sweldo-shortcut aria-label="Open Sweldo salary app" title="Open Sweldo">${svg('sweldo')}</button></div></article></section>`)};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-sweldo-shortcut]');if(!button)return;event.preventDefault();window.location.assign(new URL('sweldo.html?v=1.3.10',document.baseURI).href)});
  render();
})();
