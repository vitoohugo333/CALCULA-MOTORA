const STORAGE_KEY = 'vetta-driver-intelligence-v2';
const LEGACY_KEYS = ['vetta-state'];
const defaults = {
  version: 2,
  targetProfit: 4000,
  workWeekdays: [1,2,3,4,5,6],
  extraDaysOff: 0,
  revenueKm: 2.25,
  gasPrice: 6.19,
  gasEff: 10.5,
  gnvPrice: 4.79,
  gnvEff: 13.2,
  activeFuel: 'gnv',
  maintKm: 0.18,
  fixedMonthly: 650,
  period: 1,
  records: []
};

const app = {
  state: JSON.parse(JSON.stringify(defaults)),
  revenueChart: null,
  compareChart: null,
  historyChart: null,
  deferredPrompt: null,

  init() {
    this.load();
    this.bind();
    this.prepareRecordForm();
    this.syncInputs();
    this.render();
    this.setupPwa();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        this.state = { ...this.cloneDefaults(), ...saved, records: Array.isArray(saved.records) ? saved.records : [] };
        return;
      }
      for (const key of LEGACY_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key) || 'null');
        if (!legacy) continue;
        const days = Number(legacy.daysPerWeek || legacy.days || 6);
        this.state = {
          ...this.cloneDefaults(),
          targetProfit: Number(legacy.targetProfit || legacy.target || defaults.targetProfit),
          workWeekdays: this.weekdaysForCount(days),
          revenueKm: Number(legacy.revenueKm || defaults.revenueKm),
          gasPrice: Number(legacy.gasPrice || defaults.gasPrice),
          gasEff: Number(legacy.gasEff || defaults.gasEff),
          gnvPrice: Number(legacy.gnvPrice || defaults.gnvPrice),
          gnvEff: Number(legacy.gnvEff || defaults.gnvEff),
          maintKm: Number(legacy.maintKm || defaults.maintKm),
          fixedMonthly: Number(legacy.fixedMonthly || legacy.fixed || defaults.fixedMonthly)
        };
        this.save();
        return;
      }
    } catch (error) {
      console.warn('Falha ao carregar dados locais', error);
    }
  },

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
  cloneDefaults() { return JSON.parse(JSON.stringify(defaults)); },
  todayKey() { return this.dateKey(new Date()); },
  dateKey(date) { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; },
  parseDate(key) { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d,12); },
  monthKey(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; },
  weekdaysForCount(count) { return count <= 5 ? [1,2,3,4,5] : count === 6 ? [1,2,3,4,5,6] : [0,1,2,3,4,5,6]; },
  currentDaysPerWeek() { return this.state.workWeekdays.length; },
  money(value,digits=2) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(value)?value:0); },
  integer(value) { return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(Number.isFinite(value)?value:0); },
  clamp(value,min,max) { return Math.min(max,Math.max(min,value)); },
  number(value) { const n=Number(String(value ?? '').replace(',','.')); return Number.isFinite(n)?n:0; },

  bind() {
    document.querySelectorAll('[data-model]').forEach(input => {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, event => {
        const key = event.currentTarget.dataset.model;
        const value = event.currentTarget.tagName === 'SELECT' ? event.currentTarget.value : this.number(event.currentTarget.value);
        this.state[key] = value;
        this.save();
        this.syncInputs(key,event.currentTarget);
        this.render();
      });
    });
    document.querySelectorAll('[data-days]').forEach(button => button.addEventListener('click',() => {
      this.state.workWeekdays = this.weekdaysForCount(Number(button.dataset.days));
      this.save(); this.syncInputs(); this.render();
    }));
    document.querySelectorAll('[data-weekday]').forEach(button => button.addEventListener('click',() => {
      const day=Number(button.dataset.weekday); const set=new Set(this.state.workWeekdays);
      if (set.has(day)) { if (set.size===1) return this.toast('Escolha pelo menos um dia de trabalho.'); set.delete(day); } else set.add(day);
      this.state.workWeekdays=Array.from(set).sort((a,b)=>a-b); this.save(); this.render();
    }));
    document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click',() => { this.state.period=Number(button.dataset.period); this.save(); this.render(); }));
    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click',() => this.showView(button.dataset.view)));
    ['recordGross','recordKm','recordHours','recordFuel','recordDate'].forEach(id => document.getElementById(id).addEventListener('input',() => this.renderRecordPreview()));
    document.getElementById('saveDayButton').addEventListener('click',() => this.saveDay());
    document.getElementById('clearDayButton').addEventListener('click',() => this.prepareRecordForm(true));
    document.getElementById('historyList').addEventListener('click',event => this.handleHistoryAction(event));
    document.getElementById('resetButton').addEventListener('click',() => this.reset());
    document.getElementById('exportButton').addEventListener('click',() => this.exportData());
    document.getElementById('importInput').addEventListener('change',event => this.importData(event));
    document.getElementById('installButton').addEventListener('click',() => this.install());
    document.getElementById('retryInstallButton').addEventListener('click',() => this.install());
    document.getElementById('closeInstallModal').addEventListener('click',() => document.getElementById('installModal').classList.add('hidden'));
  },

  syncInputs(changedKey=null,source=null) {
    document.querySelectorAll('[data-model]').forEach(input => {
      const key=input.dataset.model; if (source===input) return; if (changedKey && key!==changedKey) return;
      input.value=this.state[key];
    });
  },

  showView(view) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
    const target=document.getElementById(`view-${view}`); if (!target) return;
    target.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active',item.dataset.view===view));
    if (view==='day') this.prepareRecordForm(false);
    if (view==='history') this.renderHistory();
    window.scrollTo({top:0,behavior:'smooth'});
  },

  monthContext(reference=new Date()) {
    const year=reference.getFullYear(),month=reference.getMonth();
    const first=new Date(year,month,1,12),last=new Date(year,month+1,0,12);
    const selectedDates=[];
    for (let cursor=new Date(first);cursor<=last;cursor.setDate(cursor.getDate()+1)) if (this.state.workWeekdays.includes(cursor.getDay())) selectedDates.push(this.dateKey(cursor));
    const monthRecords=this.state.records.filter(record=>record.date.startsWith(this.monthKey(reference))).sort((a,b)=>a.date.localeCompare(b.date));
    const recordDates=new Set(monthRecords.map(r=>r.date));
    const todayKey=this.todayKey();
    const elapsedSelected=selectedDates.filter(key=>key<todayKey).length;
    const recordedElapsed=monthRecords.filter(record=>record.date<todayKey && selectedDates.includes(record.date)).length;
    const extraUsed=this.clamp(elapsedSelected-recordedElapsed,0,this.state.extraDaysOff);
    const extraRemaining=Math.max(0,this.state.extraDaysOff-extraUsed);
    const selectedRemaining=selectedDates.filter(key=>key>=todayKey && !recordDates.has(key)).length;
    const remainingDays=Math.max(0,selectedRemaining-extraRemaining);
    const plannedDays=Math.max(1,selectedDates.length-this.state.extraDaysOff);
    return {year,month,first,last,selectedDates,monthRecords,recordDates,plannedDays,remainingDays,extraUsed,extraRemaining,selectedRemaining};
  },

  fuelCostKm(fuel=this.state.activeFuel) {
    return fuel==='gas' ? (this.state.gasEff>0?this.state.gasPrice/this.state.gasEff:0) : (this.state.gnvEff>0?this.state.gnvPrice/this.state.gnvEff:0);
  },

  recordNumbers(record,context=this.monthContext(this.parseDate(record.date))) {
    const gross=this.number(record.gross),km=this.number(record.km);
    const estimatedFuel=km*this.fuelCostKm(record.activeFuel || this.state.activeFuel);
    const fuel=this.number(record.fuelSpend)>0?this.number(record.fuelSpend):estimatedFuel;
    const maintenance=km*this.number(record.maintKmSnapshot ?? this.state.maintKm);
    const contribution=gross-fuel-maintenance;
    const fixedShare=this.number(record.fixedShareSnapshot)>0?this.number(record.fixedShareSnapshot):this.state.fixedMonthly/Math.max(1,context.plannedDays);
    return {...record,gross,km,fuel,maintenance,contribution,fixedShare,net:contribution-fixedShare,revenuePerKm:km>0?gross/km:0,costPerKm:km>0?(fuel+maintenance)/km:0};
  },

  calculations() {
    const s=this.state,ctx=this.monthContext();
    const fuelKm=this.fuelCostKm();
    const variableCostKm=fuelKm+s.maintKm;
    const contributionKm=Math.max(.01,s.revenueKm-variableCostKm);
    const records=ctx.monthRecords.map(record=>this.recordNumbers(record,ctx));
    const actualGross=records.reduce((sum,r)=>sum+r.gross,0);
    const actualKm=records.reduce((sum,r)=>sum+r.km,0);
    const actualFuel=records.reduce((sum,r)=>sum+r.fuel,0);
    const actualMaintenance=records.reduce((sum,r)=>sum+r.maintenance,0);
    const actualContribution=actualGross-actualFuel-actualMaintenance;
    const fixedAllocated=s.fixedMonthly*Math.min(1,records.length/Math.max(1,ctx.plannedDays));
    const actualNet=actualContribution-fixedAllocated;
    const requiredContribution=s.targetProfit+s.fixedMonthly;
    const remainingContribution=Math.max(0,requiredContribution-actualContribution);
    const remainingDays=Math.max(0,ctx.remainingDays);
    const dailyContribution=remainingDays>0?remainingContribution/remainingDays:remainingContribution;
    const dailyKm=contributionKm>0?dailyContribution/contributionKm:0;
    const dailyGross=dailyKm*s.revenueKm;
    const dailyNet=remainingDays>0?Math.max(0,(s.targetProfit-actualNet)/remainingDays):Math.max(0,s.targetProfit-actualNet);
    const totalRequiredKm=contributionKm>0?requiredContribution/contributionKm:0;
    const totalGross=totalRequiredKm*s.revenueKm;
    const totalFuel=totalRequiredKm*fuelKm;
    const totalMaintenance=totalRequiredKm*s.maintKm;
    const averageContribution=records.length?actualContribution/records.length:dailyContribution;
    const projectedNet=records.length?averageContribution*ctx.plannedDays-s.fixedMonthly:s.targetProfit;
    const consumedDays=Math.max(0,ctx.plannedDays-remainingDays);
    const expectedNetToDate=s.targetProfit*(consumedDays/Math.max(1,ctx.plannedDays));
    const paceDelta=actualNet-expectedNetToDate;
    const progress=s.targetProfit>0?this.clamp(actualNet/s.targetProfit*100,0,100):0;
    const avgRevenueKm=actualKm>0?actualGross/actualKm:0;
    const avgNetKm=actualKm>0?(actualContribution/actualKm):0;
    const surplusContribution=Math.max(0,actualContribution-requiredContribution*(consumedDays/Math.max(1,ctx.plannedDays)));
    const earnedDays=dailyContribution>0?Math.floor(surplusContribution/dailyContribution):0;
    return {ctx,records,fuelKm,variableCostKm,contributionKm,actualGross,actualKm,actualFuel,actualMaintenance,actualContribution,fixedAllocated,actualNet,remainingContribution,remainingDays,dailyContribution,dailyGross,dailyKm,dailyNet,totalRequiredKm,totalGross,totalFuel,totalMaintenance,projectedNet,expectedNetToDate,paceDelta,progress,avgRevenueKm,avgNetKm,earnedDays};
  },

  render() {
    const c=this.calculations(),s=this.state;
    document.getElementById('targetProfitDisplay').textContent=this.money(s.targetProfit,0);
    document.getElementById('extraDaysOffBadge').textContent=s.extraDaysOff;
    document.getElementById('kpiGrossDaily').textContent=this.integer(c.dailyGross);
    document.getElementById('kpiNetDaily').textContent=this.money(c.dailyNet);
    document.getElementById('kpiKmDaily').textContent=`${this.integer(c.dailyKm)} km`;
    document.getElementById('navFuelPrice').textContent=`${this.money(c.fuelKm)}/km`;
    document.getElementById('dreGross').textContent=this.money(c.totalGross);
    document.getElementById('dreKm').textContent=`${this.integer(c.totalRequiredKm)} km`;
    document.getElementById('dreFuel').textContent=`- ${this.money(c.totalFuel)}`;
    document.getElementById('dreMaint').textContent=`- ${this.money(c.totalMaintenance)}`;
    document.getElementById('dreFixed').textContent=`- ${this.money(s.fixedMonthly)}`;
    document.getElementById('dreNet').textContent=this.money(s.targetProfit);
    document.getElementById('actualNet').textContent=this.money(Math.max(0,c.actualNet),0);
    document.getElementById('projectedNet').textContent=this.money(c.projectedNet,0);
    document.getElementById('remainingDays').textContent=c.remainingDays;
    document.getElementById('monthProgress').style.width=`${c.progress}%`;
    document.getElementById('calendarSummary').textContent=`Neste mês há ${c.ctx.selectedDates.length} dias compatíveis com sua agenda. Com ${s.extraDaysOff} folga(s) extra(s), o plano considera ${c.ctx.plannedDays} dias de trabalho.`;
    document.querySelectorAll('.day-button').forEach(button=>{const active=Number(button.dataset.days)===this.currentDaysPerWeek();button.className=`day-button flex-1 py-3 rounded-xl text-[10px] font-bold uppercase ${active?'day-btn-active':'day-btn-inactive'}`;});
    document.querySelectorAll('.weekday-button').forEach(button=>{const active=s.workWeekdays.includes(Number(button.dataset.weekday));button.className=`weekday-button py-3 rounded-xl text-[10px] font-bold ${active?'weekday-active':'weekday-inactive bg-slate-50'}`;});
    document.querySelectorAll('.period-button').forEach(button=>{const active=Number(button.dataset.period)===s.period;button.className=`period-button px-3 py-1.5 rounded-md text-[10px] font-bold ${active?'period-btn-active':'period-btn-inactive'}`;});
    this.renderStatus(c); this.renderInsights(c); this.renderCompare(c); this.renderHistory(c); this.renderCharts(c); this.renderRecordPreview();
  },

  renderStatus(c) {
    const title=document.getElementById('monthStatusTitle'),text=document.getElementById('monthStatusText'),pill=document.getElementById('monthStatusPill'),hero=document.getElementById('heroStatus');
    pill.className='px-3 py-1.5 rounded-full text-[10px] font-extrabold ';
    if (!c.records.length) {
      title.textContent='Comece registrando seu primeiro dia'; text.textContent=`Sua meta foi dividida por ${c.ctx.plannedDays} dias de trabalho neste mês.`; pill.textContent='PLANO PRONTO'; pill.className+='status-neutral'; hero.textContent=`Você tem ${c.remainingDays} dias planejados para alcançar ${this.money(this.state.targetProfit,0)} líquidos.`; return;
    }
    if (c.paceDelta>=0) { title.textContent=`Você está ${this.money(c.paceDelta,0)} adiantado`; text.textContent=c.earnedDays>0?`Seu ritmo atual já representa ${c.earnedDays} dia(s) de meta. Você pode preservar a vantagem ou transformar em folga.`:'Seu resultado real está acima do ritmo necessário para o mês.'; pill.textContent='ADIANTADO'; pill.className+='status-positive'; }
    else { title.textContent=`Faltam ${this.money(Math.abs(c.paceDelta),0)} para o ritmo ideal`; text.textContent=`O valor foi redistribuído pelos ${c.remainingDays} dias restantes. Não é uma punição: é a nova rota para fechar o mês.`; pill.textContent='AJUSTANDO'; pill.className+='status-negative'; }
    hero.textContent=c.remainingDays>0?`Meta recalculada após ${c.records.length} dia(s): ${this.money(c.dailyGross,0)} de faturamento por dia.`:'Não restam dias planejados neste mês. Revise a agenda ou a meta.';
  },

  renderInsights(c) {
    const title=document.getElementById('insightTitle'),text=document.getElementById('insightText'),reasons=document.getElementById('insightReasons');
    const items=[];
    if (!c.records.length) { title.textContent='Sua meta está pronta'; text.textContent=`Para alcançar ${this.money(this.state.targetProfit,0)} líquidos, a estimativa atual é rodar ${this.integer(c.dailyKm)} km por dia.`; }
    else if (c.paceDelta<0) { title.textContent='Por que sua meta diária aumentou?'; text.textContent='O VETTA recalculou o esforço necessário sem esconder o motivo.'; items.push(`O ritmo acumulado está ${this.money(Math.abs(c.paceDelta),0)} abaixo do planejado.`); }
    else { title.textContent=c.earnedDays>0?'Você conquistou margem para folgar':'Seu ritmo está saudável'; text.textContent=c.earnedDays>0?`A vantagem atual equivale a aproximadamente ${c.earnedDays} dia(s) da meta.`:'Mantendo a eficiência atual, a projeção mensal continua acima do objetivo.'; }
    if (this.state.extraDaysOff>0) items.push(`${this.state.extraDaysOff} folga(s) extra(s) deixam menos dias para dividir a mesma meta.`);
    items.push(`Seu combustível ativo custa ${this.money(c.fuelKm)}/km e a manutenção reserva ${this.money(this.state.maintKm)}/km.`);
    if (c.records.length && c.avgRevenueKm>0) items.push(`Sua receita real média está em ${this.money(c.avgRevenueKm)}/km.`);
    reasons.innerHTML=items.map(item=>`<div class="flex gap-2 text-xs text-slate-600 bg-white/70 p-3 rounded-xl"><i class="fas fa-circle-info text-blue-500 mt-0.5"></i><span>${item}</span></div>`).join('');
  },

  renderCompare(c) {
    const gasCost=this.state.gasEff>0?this.state.gasPrice/this.state.gasEff:0,gnvCost=this.state.gnvEff>0?this.state.gnvPrice/this.state.gnvEff:0;
    document.getElementById('gasCostKm').textContent=this.money(gasCost);
    document.getElementById('gnvCostKm').textContent=this.money(gnvCost);
    const saving=Math.max(0,(gasCost-gnvCost)*c.totalRequiredKm*12*this.state.period);
    document.getElementById('projectedSaving').textContent=this.money(saving);
    document.getElementById('savingCaption').textContent=`Economia acumulada em ${this.state.period} ${this.state.period===1?'ano':'anos'}, usando ${this.integer(c.totalRequiredKm)} km/mês.`;
    document.getElementById('chartTitle').textContent=`Projeção em ${this.state.period} ${this.state.period===1?'ano':'anos'}`;
  },

  prepareRecordForm(force=false) {
    const dateInput=document.getElementById('recordDate');
    if (force || !dateInput.value) dateInput.value=this.todayKey();
    if (force) { ['recordGross','recordKm','recordHours','recordFuel'].forEach(id=>document.getElementById(id).value=''); document.getElementById('saveDayButton').innerHTML='<i class="fas fa-check mr-2"></i>Fechar e salvar o dia'; }
    this.renderRecordPreview();
  },

  recordDraft() {
    const date=document.getElementById('recordDate').value || this.todayKey();
    const gross=this.number(document.getElementById('recordGross').value),km=this.number(document.getElementById('recordKm').value),hours=this.number(document.getElementById('recordHours').value),fuelSpend=this.number(document.getElementById('recordFuel').value);
    const ctx=this.monthContext(this.parseDate(date));
    return {id:`day-${date}`,date,gross,km,hours,fuelSpend,activeFuel:this.state.activeFuel,maintKmSnapshot:this.state.maintKm,fixedShareSnapshot:this.state.fixedMonthly/Math.max(1,ctx.plannedDays),updatedAt:new Date().toISOString()};
  },

  renderRecordPreview() {
    const draft=this.recordDraft(),numbers=this.recordNumbers(draft),c=this.calculations();
    document.getElementById('previewCost').textContent=this.money(numbers.fuel+numbers.maintenance+numbers.fixedShare);
    document.getElementById('previewNet').textContent=this.money(numbers.net);
    document.getElementById('previewRevenueKm').textContent=this.money(numbers.revenuePerKm);
    const delta=numbers.contribution-c.dailyContribution;
    document.getElementById('previewDelta').textContent=`${delta>=0?'+':''}${this.money(delta)}`;
    document.getElementById('previewDelta').className=`text-lg tabular ${delta>=0?'text-emerald-600':'text-red-500'}`;
    const explanation=document.getElementById('previewExplanation');
    if (!draft.gross || !draft.km) explanation.textContent='Preencha o faturamento e os quilômetros. Combustível e manutenção serão estimados automaticamente.';
    else if (delta>=0) explanation.textContent=`Este dia gerou ${this.money(delta)} a mais de contribuição que a meta diária atual.`;
    else explanation.textContent=`Mesmo com esse faturamento, a rodagem deixou o resultado ${this.money(Math.abs(delta))} abaixo da contribuição necessária.`;
    const exists=this.state.records.some(record=>record.date===draft.date); document.getElementById('saveDayButton').innerHTML=exists?'<i class="fas fa-pen mr-2"></i>Atualizar este dia':'<i class="fas fa-check mr-2"></i>Fechar e salvar o dia';
  },

  saveDay() {
    const draft=this.recordDraft();
    if (!draft.date || draft.gross<=0 || draft.km<=0) return this.toast('Informe faturamento e quilômetros maiores que zero.');
    const index=this.state.records.findIndex(record=>record.date===draft.date);
    if (index>=0) this.state.records[index]={...this.state.records[index],...draft}; else this.state.records.push({...draft,createdAt:new Date().toISOString()});
    this.state.records.sort((a,b)=>a.date.localeCompare(b.date)); this.save(); this.render(); this.toast(index>=0?'Dia atualizado.':'Dia salvo e meta recalculada.'); this.prepareRecordForm(true); this.showView('dashboard');
  },

  handleHistoryAction(event) {
    const button=event.target.closest('[data-action]'); if (!button) return;
    const date=button.dataset.date,action=button.dataset.action;
    if (action==='edit') { const record=this.state.records.find(item=>item.date===date); if (!record) return; document.getElementById('recordDate').value=record.date; document.getElementById('recordGross').value=record.gross; document.getElementById('recordKm').value=record.km; document.getElementById('recordHours').value=record.hours||''; document.getElementById('recordFuel').value=record.fuelSpend||''; this.showView('day'); this.renderRecordPreview(); }
    if (action==='delete' && confirm('Excluir este registro? A meta será recalculada.')) { this.state.records=this.state.records.filter(item=>item.date!==date); this.save(); this.render(); this.toast('Registro excluído.'); }
  },

  renderHistory(existingCalc=null) {
    const c=existingCalc || this.calculations(),records=[...c.records].sort((a,b)=>b.date.localeCompare(a.date));
    document.getElementById('historyDays').textContent=records.length;
    document.getElementById('historyRevenueKm').textContent=this.money(c.avgRevenueKm);
    document.getElementById('historyNet').textContent=this.money(records.reduce((sum,r)=>sum+r.net,0),0);
    document.getElementById('historyCount').textContent=`${records.length} ${records.length===1?'REGISTRO':'REGISTROS'}`;
    const list=document.getElementById('historyList');
    if (!records.length) list.innerHTML='<div class="card-vetta p-8 text-center text-sm text-slate-400">Nenhum dia registrado ainda.</div>';
    else list.innerHTML=records.map(r=>{const date=this.parseDate(r.date).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});return `<article class="history-row"><div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">${date}</span><strong class="block text-xl mt-1 tabular">${this.money(r.gross)}</strong><span class="text-xs text-slate-500">${this.integer(r.km)} km · ${this.money(r.revenuePerKm)}/km</span></div><div class="text-right"><span class="label-micro">Líquido estimado</span><strong class="${r.net>=0?'text-emerald-600':'text-red-500'} tabular">${this.money(r.net)}</strong></div></div><div class="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-50"><button data-action="edit" data-date="${r.date}" class="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-extrabold">EDITAR</button><button data-action="delete" data-date="${r.date}" class="px-3 py-2 rounded-xl bg-red-50 text-red-500 text-[10px] font-extrabold">EXCLUIR</button></div></article>`;}).join('');
    const insight=document.getElementById('historyInsight');
    if (records.length<2) insight.innerHTML='<span class="label-micro !text-emerald-700">Comparação inteligente</span><h3 class="font-extrabold text-lg">Ainda não há dias suficientes</h3><p class="text-xs text-slate-500 mt-2 leading-relaxed">Depois de dois registros, o VETTA mostra qual dia realmente rendeu mais.</p>';
    else { const best=[...records].sort((a,b)=>b.net-a.net)[0],highestGross=[...records].sort((a,b)=>b.gross-a.gross)[0]; const same=best.date===highestGross.date; insight.innerHTML=`<span class="label-micro !text-emerald-700">Comparação inteligente</span><h3 class="font-extrabold text-lg">${same?'Seu maior faturamento também foi o melhor dia':'Faturar mais não significou ganhar mais'}</h3><p class="text-xs text-slate-500 mt-2 leading-relaxed">${same?`Em ${this.parseDate(best.date).toLocaleDateString('pt-BR')}, você gerou ${this.money(best.net)} líquidos.`:`O dia de ${this.money(highestGross.gross)} bruto rendeu ${this.money(highestGross.net)} líquido, enquanto seu melhor dia líquido chegou a ${this.money(best.net)} com ${this.integer(best.km)} km.`}</p>`; }
  },

  renderCharts(c) {
    if (typeof Chart==='undefined') return;
    const values=[this.state.targetProfit,c.totalFuel,c.totalMaintenance,this.state.fixedMonthly],labels=['Líquido','Combustível','Manutenção','Fixos'],colors=['#10B981','#EF4444','#F59E0B','#2563EB'];
    if (this.revenueChart) this.revenueChart.destroy();
    this.revenueChart=new Chart(document.getElementById('revenueChart'),{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:colors,borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8,padding:16,font:{family:'Plus Jakarta Sans',size:10,weight:'700'}}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${this.money(ctx.raw)}`}}}}});
    const years=this.state.period,annualKm=c.totalRequiredKm*12,gasAnnual=(this.state.gasEff>0?this.state.gasPrice/this.state.gasEff:0)*annualKm,gnvAnnual=(this.state.gnvEff>0?this.state.gnvPrice/this.state.gnvEff:0)*annualKm,axis=Array.from({length:years},(_,i)=>`${i+1}º ano`);
    if (this.compareChart) this.compareChart.destroy();
    this.compareChart=new Chart(document.getElementById('compareChart'),{type:'bar',data:{labels:axis,datasets:[{label:'Gasolina',data:axis.map((_,i)=>gasAnnual*(i+1)),backgroundColor:'#2563EB',borderRadius:8},{label:'GNV',data:axis.map((_,i)=>gnvAnnual*(i+1)),backgroundColor:'#F59E0B',borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{grid:{display:false},ticks:{font:{size:10,family:'Plus Jakarta Sans',weight:'700'}}},y:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:value=>`R$ ${Math.round(value/1000)}k`,font:{size:10}}}},plugins:{legend:{labels:{usePointStyle:true,boxWidth:8,font:{size:10,weight:'700'}}},tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${this.money(ctx.raw)}`}}}}});
    const chronological=[...c.records].sort((a,b)=>a.date.localeCompare(b.date));
    if (this.historyChart) this.historyChart.destroy();
    this.historyChart=new Chart(document.getElementById('historyChart'),{type:'line',data:{labels:chronological.map(r=>this.parseDate(r.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})),datasets:[{label:'Líquido',data:chronological.map(r=>r.net),borderColor:'#10B981',backgroundColor:'rgba(16,185,129,.12)',fill:true,tension:.35,pointRadius:4,pointBackgroundColor:'#10B981'}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{grid:{color:'#F1F5F9'},ticks:{callback:v=>`R$ ${Math.round(v)}`,font:{size:10}}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` Líquido: ${this.money(ctx.raw)}`}}}}});
  },

  reset() {
    if (!confirm('Restaurar parâmetros? O histórico diário será preservado.')) return;
    const records=this.state.records; this.state={...this.cloneDefaults(),records}; this.save(); this.syncInputs(); this.render(); this.toast('Parâmetros restaurados.');
  },

  exportData() {
    const payload={app:'VETTA',exportedAt:new Date().toISOString(),data:this.state}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=`vetta-backup-${this.todayKey()}.json`; link.click(); URL.revokeObjectURL(url); this.toast('Backup exportado.');
  },

  async importData(event) {
    const file=event.target.files?.[0]; if (!file) return;
    try { const parsed=JSON.parse(await file.text()),data=parsed.data || parsed; if (!Array.isArray(data.records)) throw new Error('Backup inválido'); this.state={...this.cloneDefaults(),...data,records:data.records}; this.save(); this.syncInputs(); this.render(); this.toast('Backup importado.'); }
    catch (error) { console.error(error); this.toast('Não foi possível importar esse arquivo.'); }
    finally { event.target.value=''; }
  },

  setupPwa() {
    const button=document.getElementById('installButton');
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true) button.classList.add('install-hidden');
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();this.deferredPrompt=event;button.classList.remove('install-hidden');});
    window.addEventListener('appinstalled',()=>{button.classList.add('install-hidden');this.toast('VETTA instalado com sucesso.');});
    if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Service worker não registrado',error)));
  },

  async install() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true) return this.toast('O VETTA já está instalado.');
    if (this.deferredPrompt) { this.deferredPrompt.prompt(); await this.deferredPrompt.userChoice; this.deferredPrompt=null; return; }
    const samsung=/SamsungBrowser/i.test(navigator.userAgent),android=/Android/i.test(navigator.userAgent),modal=document.getElementById('installModal');
    document.getElementById('installHelp').textContent='O navegador não abriu o instalador automaticamente. Use o menu para adicionar o VETTA como aplicativo:';
    const steps=samsung?['Toque no menu ☰.','Escolha “Adicionar página a”.','Escolha “Tela inicial”.']:android?['Toque no menu ⋮ do navegador.','Escolha “Instalar app” ou “Adicionar à tela inicial”.','Confirme a instalação.']:['Abra o menu de compartilhamento ou opções.','Procure “Adicionar à tela inicial”.','Confirme.'];
    document.getElementById('installSteps').innerHTML=steps.map(step=>`<li>${step}</li>`).join(''); modal.classList.remove('hidden');
  },

  toast(message) { const el=document.getElementById('toast'); el.textContent=message; el.classList.remove('hidden'); clearTimeout(this.toastTimer); this.toastTimer=setTimeout(()=>el.classList.add('hidden'),2600); }
};

window.addEventListener('DOMContentLoaded',()=>app.init());
