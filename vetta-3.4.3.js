(async()=>{
  const RELEASE='3.4.3';
  const uiParts=['./parts/ui-01.part','./parts/ui-02.part','./parts/ui-03.part','./parts/ui-04.part'];
  const appParts=['./parts/app-01.part','./parts/app-02.part','./parts/app-03.part','./parts/app-04.part','./parts/app-05.part','./parts/app-06.part','./parts/app-07.part','./parts/app-08.part','./parts/app-09.part','./parts/patch-01.part','./parts/patch-02.part','./parts/patch-03.part','./parts/patch-04.part','./parts/patch-05.part','./parts/patch-06.part','./parts/patch-07.part','./parts/patch-08.part'];
  const versioned=file=>`${file}?v=${RELEASE}`;
  const read=async files=>{
    const values=[];
    for(const file of files){
      const response=await fetch(versioned(file),{cache:'no-store'});
      if(!response.ok) throw new Error(`Falha ao carregar ${file}`);
      values.push(await response.text());
    }
    return values.join('');
  };
  const [ui,source]=await Promise.all([read(uiParts),read(appParts)]);
  document.getElementById('appRoot').outerHTML=ui;
  new Function(`${source}\nwindow.__vettaApp=app;`)();

  const style=document.createElement('style');
  style.textContent='.modal-backdrop{pointer-events:auto!important}.modal-sheet{position:relative;z-index:2;pointer-events:auto!important}.modal-sheet button,.modal-sheet input,.modal-sheet select{pointer-events:auto!important}';
  document.head.appendChild(style);

  const getApp=()=>window.__vettaApp;
  const find=(event,selector)=>event.target instanceof Element?event.target.closest(selector):null;

  document.addEventListener('click',event=>{
    const closeButton=find(event,'#closeCostModal');
    if(closeButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('costModal')?.classList.add('hidden');
      return;
    }

    const saveButton=find(event,'#saveCostButton');
    if(saveButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      const currentApp=getApp();
      if(!currentApp||typeof currentApp.saveCost!=='function') return;
      if(saveButton.dataset.saving==='true') return;
      saveButton.dataset.saving='true';
      saveButton.disabled=true;
      const originalText=saveButton.textContent;
      saveButton.textContent='Salvando...';
      try{ currentApp.saveCost(); }
      catch(error){ console.error('Falha ao salvar custo',error); currentApp.toast?.('Não foi possível salvar. Revise os campos e tente novamente.'); }
      finally{ saveButton.dataset.saving='false'; saveButton.disabled=false; saveButton.textContent=originalText; }
      return;
    }

    const modal=document.getElementById('costModal');
    if(modal&&event.target===modal){
      event.preventDefault();
      event.stopImmediatePropagation();
      modal.classList.add('hidden');
    }
  },true);

  document.addEventListener('change',event=>{
    const currentApp=getApp();
    if(!currentApp) return;
    if(find(event,'#costTemplate')) currentApp.applyCostTemplate?.(event.target.value);
    if(find(event,'#costKind')) currentApp.syncCostModal?.();
  },true);

  document.addEventListener('input',event=>{
    if(!find(event,'#costName,#costCategory,#costValue,#costDueDay,#costMonth')) return;
    getApp()?.updateCostImpactPreview?.();
  },true);

  const versionLabel=document.getElementById('appVersionLabel');
  if(versionLabel) versionLabel.textContent=`Versão ${RELEASE}`;
})().catch(error=>{
  console.error(error);
  const root=document.getElementById('appRoot');
  if(root) root.innerHTML='<main style="max-width:520px;margin:60px auto;padding:24px;font-family:system-ui"><h1>Não foi possível carregar o VETTA</h1><p>Atualize a página com internet para concluir a atualização.</p></main>';
});