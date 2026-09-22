/* Final mobile polish and a private, device-local daily check-in. */
Object.assign(icons,{
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.07.07-1.86 1.86-.07-.07A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 1.56V20H9v-.04A1.7 1.7 0 0 0 8 18.4a1.7 1.7 0 0 0-1.88.34l-.07.07-1.86-1.86.07-.07A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3v-4h.04A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.07-.07 1.86-1.86.07.07A1.7 1.7 0 0 0 8 5.6 1.7 1.7 0 0 0 9 4.04V4h6v.04A1.7 1.7 0 0 0 16 5.6a1.7 1.7 0 0 0 1.88-.34l.07-.07 1.86 1.86-.07.07A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1H21v4h-.04A1.7 1.7 0 0 0 19.4 15Z"/>',
  flame:'<path d="M12 22c4.2 0 7-2.8 7-6.6 0-2.7-1.4-4.6-3.7-6.4.1 2-.8 3.2-1.6 3.7.2-3.6-2-6.6-5.1-9.7.3 3-1.1 4.5-2.4 6.3C5 11 5 13 5 15.4 5 19.2 7.8 22 12 22Z"/><path d="M12 22c2 0 3.3-1.3 3.3-3.1 0-1.5-.7-2.7-2.2-4.1-.1 1.4-.8 2.1-1.6 2.7-.2-1.2-.9-2.3-1.8-3.1.1 1.4-.3 2.2-.9 3.2-.3.5-.5 1-.5 1.7 0 1.6 1.3 2.7 3.7 2.7Z"/>'
});
nav.find(item=>item[0]==='more')[1]='settings';
uiRouteIcons.more='settings';
extraDestinations.find(item=>item[0]==='more')[1]='settings';

const walletCardBeforePolish=walletCard;
walletCard=function(wallet){return walletCardBeforePolish(wallet)
  .replace('account-card compact-wallet','account-card')
  .replace(/<div class="swipe-back swipe-edit"[^>]*>[\s\S]*?<\/div>/,'')
  .replace('<div class="wallet-card-actions" hidden>',`<div class="wallet-card-actions" hidden><button data-wallet-edit="${escC(wallet.id)}" aria-label="Edit ${escC(wallet.name)} wallet" title="Edit wallet">${svg('edit')}</button>`)};
const txRowsBeforePolish=txRows;
txRows=function(items){return txRowsBeforePolish(items).replace(/<div class="swipe-back swipe-edit"[^>]*>[\s\S]*?<\/div>/g,'')};

const enhanceFormBeforePolish=enhanceForm;
enhanceForm=function(kind,id=''){
  enhanceFormBeforePolish(kind,id);
  if(kind==='expense'||kind==='income'){
    const name=formFields.querySelector('[name="name"]');
    if(name){name.required=false;name.placeholder='Optional — uses category if blank'}
  }
};
entryForm.addEventListener('submit',()=>{
  if(!['expense','income'].includes(editRecord?.kind))return;
  const name=entryForm.elements.name;
  if(name&&!name.value.trim()){
    const category=state.categories.find(item=>item.id===entryForm.elements.categoryId?.value);
    name.value=category?.name|| (editRecord.kind==='income'?'Income':'Expense');
  }
},true);

function updateDailyStreak(){
  if(!cashualHydrated)return;
  const today=currentDay(),streak=state.streak||{count:0,best:0,lastDay:''};
  if(streak.lastDay===today)return;
  const gap=streak.lastDay?Math.round((new Date(today+'T12:00:00')-new Date(streak.lastDay+'T12:00:00'))/86400000):Infinity;
  streak.count=gap===1?(streak.count||0)+1:1;
  streak.best=Math.max(streak.best||0,streak.count);
  streak.lastDay=today;
  state.streak=streak;
  save();
}
const homeBeforeStreak=home;
home=function(){
  const content=homeBeforeStreak().replaceAll('<div class="event">','<div class="event home-bill-row">');
  if(state.homeSections?.streak===false)return content;
  const streak=state.streak||{count:1,best:1};
  return `<section class="card streak-card" aria-label="Daily check-in streak"><span class="streak-mark">${svg('flame')}</span><div><strong>${streak.count||1}-day streak</strong><small>Checked in today · Best ${streak.best||1} ${(streak.best||1)===1?'day':'days'}</small></div><span class="streak-done">${svg('check')}</span></section>`+content;
};
const moreBeforeStreak=more;
more=function(){return moreBeforeStreak().replace('<summary>Home display</summary><div class="toggle-grid">',`<summary>Home display</summary><div class="toggle-grid"><label><input type="checkbox" data-home-toggle="streak" ${state.homeSections?.streak===false?'':'checked'}> Daily streak</label>`)};
const renderBeforeStreak=render;
render=function(){updateDailyStreak();renderBeforeStreak()};
render();
