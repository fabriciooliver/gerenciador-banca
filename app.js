const INITIAL_BANK=55;
const STORAGE_KEY='gerenciador-banca-v1'; // mesma chave da primeira versão: preserva operações já salvas
const BANK_KEY='gerenciador-banca-initial-v1';
const MG_CONFIG_KEY='gerenciador-banca-mg-config-v1';
const imported=[{"id":"hist-20261102","date":"2026-11-02","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.74},{"id":"hist-20261103","date":"2026-11-03","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":-14.36},{"id":"hist-20261104","date":"2026-11-04","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":-2},{"id":"hist-20261105","date":"2026-11-05","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":1.72},{"id":"hist-20261107","date":"2026-11-07","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.57},{"id":"hist-20261108","date":"2026-11-08","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.6},{"id":"hist-20261109","date":"2026-11-09","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.44},{"id":"hist-20261110","date":"2026-11-10","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.44},{"id":"hist-20261111","date":"2026-11-11","pair":"Histórico da planilha","stake":0,"payout":0,"outcome":"HIST","pnl":3.5}];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const percent=n=>(Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
let entries;try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));entries=Array.isArray(saved)?saved:imported;}catch{entries=imported;}
const savedInitialBank=localStorage.getItem(BANK_KEY);
let initialBank=savedInitialBank!==null && Number.isFinite(Number(savedInitialBank)) && Number(savedInitialBank)>0 ? Number(savedInitialBank) : INITIAL_BANK;
let mgConfig={};try{mgConfig=JSON.parse(localStorage.getItem(MG_CONFIG_KEY))||{};}catch{}
for(const id of ['calcBase','calcPayout'])if(mgConfig[id]!==undefined)$(id).value=mgConfig[id];
const ceilCents=n=>Math.ceil((n-1e-9)*100)/100;
function mgCalc(){
 const base=Number($('calcBase').value),pay=Number($('calcPayout').value);
 const body=$('mgCalcBody');body.replaceChildren();
 if(!Number.isFinite(base)||!Number.isFinite(pay)||base<=0||pay<=0||pay>1000){
   $('mgExposure').textContent='Informe entrada inicial positiva e payout maior que zero.';return;
 }
 // A entrada é arredondada para cima para que cada etapa alcance o lucro-alvo.
 const initial=ceilCents(base),target=initial*pay/100;
 const mg1=ceilCents((initial+target)/(pay/100));
 const mg2=ceilCents((initial+mg1+target)/(pay/100));
 const amounts=[initial,mg1,mg2],balance=stats().balance;
 let losses=0;
 for(let i=0;i<3;i++){
  const tr=document.createElement('tr'),stake=amounts[i],net=stake*pay/100-losses,stage=['ENTRADA','MG1','MG2'][i];
  const multiplier=i===0?'1,00×':(stake/amounts[i-1]).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'×';
  for(const t of [stage,money(stake),balance>0?percent(stake/balance*100):'Sem saldo',money(net),multiplier]){
    const td=document.createElement('td');td.textContent=t;tr.appendChild(td);
  }
  const td=document.createElement('td'),btn=document.createElement('button');
  btn.type='button';btn.className='secondary';btn.textContent='Usar valor';
  btn.addEventListener('click',()=>{$('stake').value=stake.toFixed(2);$('stage').value=stage;$('payout').value=pay;preview();$('stake').scrollIntoView({behavior:'smooth',block:'center'});});
  td.appendChild(btn);tr.appendChild(td);body.appendChild(tr);losses+=stake;
 }
 $('mgExposure').textContent='Lucro-alvo líquido: '+money(target)+'. Perda se as 3 entradas forem LOSS: '+money(losses)+'. Exposição sobre a BANCA INICIAL: '+(initialBank>0?percent(losses/initialBank*100):'sem banca inicial')+'. Exposição sobre a banca atual: '+(balance>0?percent(losses/balance*100):'sem saldo')+'.'+(losses>balance?' ATENÇÃO: a sequência supera o saldo disponível.':'');
 localStorage.setItem(MG_CONFIG_KEY,JSON.stringify({calcBase:$('calcBase').value,calcPayout:$('calcPayout').value}));
}
for(const id of ['calcBase','calcPayout'])$(id).addEventListener('input',mgCalc);
const sorted=()=>[...entries].sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stats(){const pnl=entries.reduce((a,e)=>a+(Number(e.pnl)||0),0),wins=entries.filter(e=>e.outcome==='WIN').length,losses=entries.filter(e=>e.outcome==='LOSS').length;return {pnl,balance:initialBank+pnl,wins,losses,operations:entries.filter(e=>e.outcome!=='HIST').length};}
function drawChart(){const canvas=$('balanceChart'),ctx=canvas.getContext('2d'),dpr=devicePixelRatio||1,w=canvas.clientWidth||600,h=180;canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);let balance=initialBank;const points=[balance];sorted().forEach(e=>{balance+=Number(e.pnl)||0;points.push(balance);});const min=Math.min(...points),max=Math.max(...points),span=Math.max(1,max-min),pad=20;ctx.strokeStyle='#d8e2ec';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=pad+(h-2*pad)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}ctx.strokeStyle='#2563eb';ctx.lineWidth=2.5;ctx.beginPath();points.forEach((v,i)=>{const x=pad+(w-2*pad)*i/Math.max(1,points.length-1),y=h-pad-(v-min)/span*(h-2*pad);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
function render(){const s=stats();$('currentBalance').textContent=money(s.balance);$('initialBank').textContent='Banca inicial: '+money(initialBank);$('totalReturn').textContent='Rentabilidade: '+percent(s.pnl/initialBank*100);$('totalPnl').textContent=money(s.pnl);$('winRate').textContent=percent((s.wins+s.losses)?s.wins/(s.wins+s.losses)*100:0);$('tradeCount').textContent=s.operations;$('winLoss').textContent=s.wins+' / '+s.losses;$('bankInput').value=initialBank.toFixed(2);const body=$('historyBody');body.replaceChildren();for(const e of sorted().reverse()){const tr=document.createElement('tr'),out=e.outcome==='HIST'?'HISTÓRICO':e.outcome,cls=e.outcome==='WIN'?'win':e.outcome==='LOSS'?'loss':'draw',pnl=Number(e.pnl)||0;tr.innerHTML=`<td>${new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${escapeHtml(e.pair||'—')}</td><td>${e.outcome==='HIST'?'—':money(e.stake)}</td><td>${escapeHtml(e.stage||"—")}</td><td><span class="tag ${cls}">${out}</span></td><td class="${pnl>=0?'positive':'negative'}">${money(pnl)}</td><td class="${pnl>=0?'positive':'negative'}">${initialBank>0?(pnl>0?'+':'')+percent(pnl/initialBank*100):'—'}</td><td><button class="delete" type="button" title="Excluir lançamento" aria-label="Excluir lançamento">×</button></td>`;tr.querySelector('button').addEventListener('click',()=>{if(confirm('Excluir este lançamento?')){entries=entries.filter(x=>x.id!==e.id);save();}});body.appendChild(tr);}$('emptyState').classList.toggle('hidden',entries.length>0);drawChart();preview();mgCalc();}
function preview(){const s=stats(),stake=Number($('stake').value)||0,payout=Number($('payout').value)||0,out=$('outcome').value,pnl=out==='WIN'?stake*payout/100:out==='LOSS'?-stake:0;$('stakePercent').textContent=s.balance>0?percent(stake/s.balance*100)+' da banca atual':'Banca sem saldo';$('preview').innerHTML=`Resultado estimado: <strong class="${pnl<0?'negative':'positive'}">${money(pnl)}</strong>`;}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));render();}
$('date').value=new Date().toLocaleDateString('en-CA');
['stake','payout','outcome'].forEach(id=>$(id).addEventListener('input',preview));
$('editBankShortcut').addEventListener('click',()=>{$('bankInput').scrollIntoView({behavior:'smooth',block:'center'});$('bankInput').focus({preventScroll:true});$('bankInput').select();});
$('bankInput').addEventListener('input',()=>{$('bankSavedMessage').textContent='Alteração ainda não salva';});
$('saveBank').addEventListener('click',()=>{const n=Number($('bankInput').value);if(!Number.isFinite(n)||n<=0){alert('Informe uma banca inicial maior que zero.');return;}initialBank=Math.round(n*100)/100;localStorage.setItem(BANK_KEY,String(initialBank));render();$('bankSavedMessage').textContent='✓ Banca inicial salva neste dispositivo';});
$('tradeForm').addEventListener('submit',e=>{e.preventDefault();const stake=Number($('stake').value),payout=Number($('payout').value),out=$('outcome').value;if(!(stake>0)||!(payout>=0&&payout<=1000)){alert('Revise a entrada e o payout.');return;}const pnl=out==='WIN'?stake*payout/100:out==='LOSS'?-stake:0;entries.push({id:crypto.randomUUID?.()||String(Date.now()),date:$('date').value,pair:$('pair').value.trim().toUpperCase(),stage:$('stage').value,stake,payout,outcome:out,pnl:Math.round(pnl*100)/100});save();});
$('exportBtn').addEventListener('click',()=>{const rows=[['Data','Par','Etapa','Resultado','Entrada (R$)','Payout (%)','Lucro/Perda (R$)','% da banca inicial'],...sorted().map(e=>[e.date,e.pair,e.stage||"",e.outcome,e.stake,e.payout,e.pnl,initialBank>0?(Number(e.pnl)||0)/initialBank*100:""])],csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='historico_banca.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
$('resetBtn').addEventListener('click',()=>{if(confirm('Apagar todos os registros deste dispositivo? Esta ação não pode ser desfeita.')){entries=[];save();}});
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden');});$('installBtn').addEventListener('click',async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden');}});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));window.addEventListener('resize',drawChart);render();
