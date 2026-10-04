/* Spacious settings layout and direct category management. */
icons.tags='<path d="M3 5v6l9 9 8-8-9-9H5a2 2 0 0 0-2 2Z"/><circle cx="8" cy="8" r="1.5"/>';

function settingsCategoryRows(group){
  const items=state.categories.filter(category=>(category.group||'expense')===group),byParent=new Map();
  for(const category of items){const key=category.parent||'';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key).push(category)}
  const roots=items.filter(category=>!category.parent||!items.some(parent=>parent.id===category.parent)),ordered=[];
  for(const root of roots){ordered.push([root,false]);for(const child of byParent.get(root.id)||[])ordered.push([child,true])}
  for(const category of items)if(!ordered.some(([item])=>item.id===category.id))ordered.push([category,!!category.parent]);
  if(!ordered.length)return '<div class="category-list-empty">No categories yet.</div>';
  return ordered.map(([category,child])=>{
    const parent=child?state.categories.find(item=>item.id===category.parent):null,color=/^#[0-9a-f]{6}$/i.test(category.color||'')?category.color:'#8f978b';
    return `<div class="category-manage-row ${child?'is-child':''}"><span class="category-manage-icon" style="--category-color:${escC(color)}" aria-hidden="true">${userIcon(category.icon||'other')}</span><span class="category-manage-copy"><strong>${escC(category.name)}</strong><small>${parent?`Subcategory of ${escC(parent.name)}`:group==='income'?'Money received':'Purchase category'}</small></span><span class="category-manage-actions"><button type="button" class="category-row-action" data-category-edit="${escC(category.id)}" aria-label="Edit ${escC(category.name)}" title="Edit category">${svg('edit')}</button><button type="button" class="category-row-action delete" data-category-delete="${escC(category.id)}" aria-label="Delete ${escC(category.name)}" title="Delete category">${svg('trash')}</button></span></div>`;
  }).join('');
}

function settingsCategoryManager(){
  const expenseCount=state.categories.filter(category=>(category.group||'expense')!=='income').length,incomeCount=state.categories.length-expenseCount;
  return `<details class="settings-row category-settings"><summary><span>${svg('tags')}</span><div><strong>Categories</strong><small>${state.categories.length} categories · edit, organize, or delete</small></div></summary><div class="settings-row-content category-manager-content"><div class="category-manager-head"><div><strong>Categories & subcategories</strong><small>Deleting a used category moves its entries to another category.</small></div><button type="button" class="category-add-button" data-enhance-form="category">${svg('add')}<span>New category</span></button></div><section class="category-manage-group"><header><strong>Expenses</strong><span>${expenseCount}</span></header><div class="category-manage-list">${settingsCategoryRows('expense')}</div></section><section class="category-manage-group"><header><strong>Money received</strong><span>${incomeCount}</span></header><div class="category-manage-list">${settingsCategoryRows('income')}</div></section></div></details>`;
}

const settingsRefinementBefore=more;
more=function(){
  let markup=settingsRefinementBefore();
  markup=markup.replaceAll('class="settings-row" open','class="settings-row"');
  markup=markup.replace(/<details class="settings-row"[^>]*>\s*<summary>Categories & subcategories<\/summary>[\s\S]*?<\/details>/,settingsCategoryManager());
  markup=markup.replace('<details class="settings-row"><summary>Wallet display</summary>',`<details class="settings-row wallet-display-settings"><summary><span>${svg('wallet')}</span><div><strong>Wallet display</strong><small>Card layout and density</small></div></summary>`);
  markup=markup.replace('<details class="settings-row"><summary>Import & export</summary>',`<details class="settings-row data-settings"><summary><span>${svg('archive')}</span><div><strong>Import & export</strong><small>Backups and offline storage</small></div></summary>`);
  markup=markup.replace('<details class="settings-row"><summary>Navigation</summary>',`<details class="settings-row navigation-settings"><summary><span>${svg('transactions')}</span><div><strong>Navigation</strong><small>Mobile shortcut labels</small></div></summary>`);
  markup=markup.replace('<details class="settings-row"><summary>Safe to Spend</summary>',`<details class="settings-row safe-spend-settings"><summary><span>${svg('savings')}</span><div><strong>Safe to Spend</strong><small>Daily spending guide</small></div></summary>`);
  markup=markup.replace('<details class="settings-row update-settings"><summary>App updates</summary>',`<details class="settings-row update-settings"><summary><span>${svg('download')}</span><div><strong>App updates</strong><small>Check and install releases</small></div></summary>`);
  markup=markup.replace('<section class="settings-page">',`<section class="settings-page settings-refined"><header class="settings-heading"><p class="overline">Cashual</p><h2>Settings</h2><p>Personalize the app without digging through one long screen.</p></header><nav class="settings-overview" aria-label="Settings shortcuts"><button type="button" data-settings-jump="appearance-editor">${svg('sun')}<span>Appearance</span></button><button type="button" data-settings-jump="category-settings">${svg('tags')}<span>Categories</span></button><button type="button" data-settings-jump="home-display-editor">${svg('home')}<span>Home</span></button><button type="button" data-settings-jump="update-settings">${svg('download')}<span>Updates</span></button></nav>`);
  return markup.replace('settings-row appearance-editor" open','settings-row appearance-editor"');
};

document.addEventListener('click',event=>{
  const jump=event.target.closest('[data-settings-jump]');if(!jump)return;
  const section=view.querySelector(`.${jump.dataset.settingsJump}`);if(!section)return;
  event.preventDefault();section.open=true;requestAnimationFrame(()=>section.scrollIntoView({behavior:'smooth',block:'start'}));
});

const renderBeforeSettingsRefinement=render;
render=function(){renderBeforeSettingsRefinement();if((location.hash.slice(1)||'home')==='more')view.querySelector('.settings-refined')?.classList.add('is-ready')};
