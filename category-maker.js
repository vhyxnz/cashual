/* A visual, SVG-only category maker for common spending and income uses. */
Object.assign(icons,{
  groceries:'<path d="M4 8h16l-2 12H6L4 8Z"/><path d="M8 8c0-3 2-5 4-5s4 2 4 5M8 12v4m4-4v4m4-4v4"/>',
  dining:'<circle cx="12" cy="12" r="7"/><path d="M4 4v6a2 2 0 0 0 2 2V4m0 8v8M19 4v16m0-16c-3 2-3 7 0 9"/>',
  coffee:'<path d="M5 8h11v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2M8 4c0 1 1 1 1 2m3-2c0 1 1 1 1 2"/>',
  transit:'<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M8 7h8M7 13h10M8 19l-2 2m10-2 2 2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>',
  fuel:'<path d="M6 3h9v18H6V3Z"/><path d="M8 6h5v4H8V6Zm7 1h2l2 3v7a2 2 0 0 1-4 0"/>',
  home:'<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z"/>',
  utilities:'<path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/>',
  internet:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  health:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11Z"/><path d="M9 12h6m-3-3v6"/>',
  pharmacy:'<path d="m8 5 11 11a4 4 0 0 1-6 6L2 11a4 4 0 0 1 6-6Z"/><path d="m7 16 9-9"/>',
  fitness:'<path d="M4 9v6m16-6v6M7 7v10m10-10v10M7 12h10M2 11v2m20-2v2"/>',
  clothes:'<path d="m8 4-5 3 3 5 2-1v10h8V11l2 1 3-5-5-3a4 4 0 0 1-8 0Z"/>',
  beauty:'<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM6 14l.7 1.8 1.8.7-1.8.7L6 19l-.7-1.8-1.8-.7 1.8-.7L6 14Z"/>',
  entertainment:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 2 4 3 4-3M8 15h5m4-1v2"/>',
  games:'<path d="M8 8h8a5 5 0 0 1 5 5v3a3 3 0 0 1-5 2l-2-2h-4l-2 2a3 3 0 0 1-5-2v-3a5 5 0 0 1 5-5Z"/><path d="M7 11v4m-2-2h4m7-1h.01m2 3h.01"/>',
  travel:'<path d="m2 16 20-8-2-2-8 3-5-5-2 1 4 6-5 2-2-1-1 1 1 3Z"/>',
  education:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 3 9 3 12 0v-5m4-2v6"/>',
  pets:'<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M8 19c0-5 8-5 8 0-2 2-6 2-8 0Z"/>',
  gift:'<path d="M3 10h18v11H3V10Zm-1-4h20v4H2V6Zm10 0v15"/><path d="M12 6c-5 0-6-5-3-5 2 0 3 3 3 5Zm0 0c5 0 6-5 3-5-2 0-3 3-3 5Z"/>',
  family:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-7a4 4 0 0 1 5 4v3"/>',
  childcare:'<circle cx="12" cy="12" r="9"/><path d="M9 11h.01M15 11h.01M9 15c2 2 4 2 6 0M12 3v3"/>',
  subscription:'<path d="M4 6h16v14H4V6Z"/><path d="M8 3v6m8-6v6M8 13h8m-8 4h5"/>',
  insurance:'<path d="M12 3 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  taxes:'<path d="M5 3h14v18H5V3Z"/><path d="M8 8h8M8 12h3m3 0h2M8 16h2m3 0h3"/>',
  work:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3m-12 5h18m-11 0v2h4v-2"/>',
  charity:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11Z"/>',
  savings:'<path d="M5 10a7 7 0 0 1 13-2h3v6h-3a7 7 0 0 1-5 4v3H9v-3a7 7 0 0 1-4-8Z"/><path d="M9 8h4m5 3h.01"/>',
  investment:'<path d="M4 19V9m6 10v-5m6 5V5m4 14V2"/><path d="m3 7 6-4 5 4 7-5"/>',
  salary:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 10h10m-10 4h6"/>',
  freelance:'<path d="M4 5h16v16H4V5Z"/><path d="M8 5V3h8v2M8 10h8m-8 4h5"/>',
  bonus:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  interest:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M5 19 19 5"/>',
  refund:'<path d="m9 7-5 5 5 5M4 12h9a6 6 0 0 1 6 6"/>',
  bakery:'<path d="M5 15c0-5 3-9 7-9s7 4 7 9c0 3-3 5-7 5s-7-2-7-5Z"/><path d="m8 9 2 3m2-6v4m4-1-2 3"/>',
  drinks:'<path d="M6 7h12l-1 14H7L6 7Z"/><path d="M9 3h7l-2 4M8 11h8"/>',
  delivery:'<path d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7Z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  parking:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  rent:'<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/><path d="M16 7h4v4"/>',
  water:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 16c.5 1.5 1.5 2 3 2"/>',
  medical:'<path d="M6 3v6a6 6 0 0 0 12 0V3M3 3h6m6 0h6"/><circle cx="18" cy="17" r="3"/><path d="M12 15v2a6 6 0 0 0 6 6"/>',
  electronics:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M2 21h20M9 17l-1 4m7-4 1 4"/>',
  movies:'<path d="M4 7h16v13H4V7Z"/><path d="m5 3 3 4m2-4 3 4m2-4 3 4M8 13l6-3v6l-6-3Z"/>',
  music:'<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  hotel:'<path d="M3 19V6m18 13V9a3 3 0 0 0-3-3h-7v8H3m0 5h18M6 10h3"/>',
  book:'<path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4Zm16 0h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3V4Z"/>',
  baby:'<path d="M8 4h8l-1 9H9L8 4Zm0 0a4 4 0 0 0-4 4v5h13"/><circle cx="9" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
  repair:'<path d="M14 6a4 4 0 0 0-5-4l2 3-3 3-3-2a4 4 0 0 0 5 5l8 8a2 2 0 0 0 3-3l-8-8c.6-.5 1-1.2 1-2Z"/>',
  bank:'<path d="m3 9 9-5 9 5M5 10v8m5-8v8m4-8v8m5-8v8M3 21h18"/>',
  other:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>'
});

const categoryIconChoices=[
  ['food','Food'],['groceries','Groceries'],['dining','Dining'],['coffee','Coffee'],['bakery','Bakery'],['drinks','Drinks'],['delivery','Delivery'],['car','Car'],['transit','Transit'],['fuel','Fuel'],['parking','Parking'],['travel','Travel'],['hotel','Hotel'],['home','Home'],['rent','Rent'],['utilities','Electricity'],['water','Water'],['phone','Phone'],['internet','Internet'],['repair','Repairs'],['health','Health'],['medical','Medical'],['pharmacy','Pharmacy'],['fitness','Fitness'],['bag','Shopping'],['clothes','Clothes'],['beauty','Personal care'],['electronics','Electronics'],['entertainment','Entertainment'],['movies','Movies'],['music','Music'],['games','Games'],['education','Education'],['book','Books'],['pets','Pets'],['gift','Gifts'],['family','Family'],['childcare','Childcare'],['baby','Baby'],['subscription','Subscriptions'],['receipt','Bills'],['insurance','Insurance'],['taxes','Taxes'],['bank','Banking'],['work','Work'],['charity','Charity'],['savings','Savings'],['investment','Investment'],['salary','Salary'],['freelance','Freelance'],['bonus','Bonus'],['interest','Interest'],['refund','Refund'],['other','Other']
];
const categoryMakerBefore=enhanceForm;
enhanceForm=function(kind,id=''){
  categoryMakerBefore(kind,id);if(kind!=='category'||!formDialog.open)return;
  const category=state.categories.find(c=>c.id===id),group=category?.group||'expense',chosen=icons[category?.icon]?category.icon:(group==='income'?'salary':'groceries');
  const parents=state.categories.filter(c=>c.id!==id&&!c.parent&&(c.group||'expense')===group);
  formOverline.textContent=category?'Edit category':'New category';formTitle.textContent=category?'Update category':'Create a category';saveBtn.textContent=category?'Save changes':'Create category';
  formFields.innerHTML=`<div class="category-maker"><label class="field"><span>Name</span><input name="name" required maxlength="40" autocomplete="off" placeholder="e.g. Groceries" value="${escC(category?.name||'')}"></label><fieldset class="category-kind"><legend>Used for</legend><label><input type="radio" name="group" value="expense" ${group!=='income'?'checked':''}><span>Expenses</span></label><label><input type="radio" name="group" value="income" ${group==='income'?'checked':''}><span>Money received</span></label></fieldset><fieldset class="category-icon-picker"><legend>Choose an icon</legend><input type="hidden" name="icon" value="${escC(chosen)}"><div class="category-icon-grid">${categoryIconChoices.map(([key,label])=>`<button type="button" class="category-icon-option ${key===chosen?'selected':''}" data-category-icon="${key}" aria-label="${label}" aria-pressed="${key===chosen}" title="${label}">${svg(key)}<small>${label}</small></button>`).join('')}</div></fieldset><div class="category-finishing"><label class="category-color"><span>Color</span><input name="color" type="color" value="${/^#[0-9a-f]{6}$/i.test(category?.color||'')?category.color:'#d7f36a'}"></label><label class="field"><span>Subcategory of <small>(optional)</small></span><select name="parent"><option value="">None</option>${parents.map(c=>`<option value="${escC(c.id)}" ${category?.parent===c.id?'selected':''}>${escC(c.name)}</option>`).join('')}</select></label></div></div>${category?`<button type="button" class="danger-action" data-category-delete="${escC(category.id)}">${svg('trash')} Delete category</button>`:''}`;
  formFields.querySelector('[name="name"]')?.focus();
};
document.addEventListener('click',event=>{
  const option=event.target.closest('[data-category-icon]');if(!option)return;
  event.preventDefault();event.stopImmediatePropagation();
  const maker=option.closest('.category-maker');maker.querySelector('[name="icon"]').value=option.dataset.categoryIcon;
  maker.querySelectorAll('[data-category-icon]').forEach(button=>{const active=button===option;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});
},true);
document.addEventListener('change',event=>{
  if(!event.target.matches('.category-maker [name="group"]'))return;
  const maker=event.target.closest('.category-maker'),select=maker.querySelector('[name="parent"]'),id=editRecord?.id||'',group=event.target.value;
  select.innerHTML='<option value="">None</option>'+state.categories.filter(c=>c.id!==id&&!c.parent&&(c.group||'expense')===group).map(c=>`<option value="${escC(c.id)}">${escC(c.name)}</option>`).join('');
});
