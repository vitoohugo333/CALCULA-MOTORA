(async()=>{
  const uiParts=['./parts/ui-01.part', './parts/ui-02.part', './parts/ui-03.part', './parts/ui-04.part'];
  const appParts=['./parts/app-01.part', './parts/app-02.part', './parts/app-03.part', './parts/app-04.part', './parts/app-05.part', './parts/app-06.part', './parts/app-07.part', './parts/app-08.part', './parts/app-09.part', './parts/patch-01.part', './parts/patch-02.part', './parts/patch-03.part', './parts/patch-04.part', './parts/patch-05.part', './parts/patch-06.part'];
  const read=async files=>{const values=[];for(const file of files){const response=await fetch(file);if(!response.ok)throw new Error(`Falha ao carregar ${file}`);values.push(await response.text());}return values.join('');};
  const [ui,source]=await Promise.all([read(uiParts),read(appParts)]);
  document.getElementById('appRoot').outerHTML=ui;
  new Function(source)();
})().catch(error=>{console.error(error);document.getElementById('appRoot').innerHTML='<main style="max-width:520px;margin:60px auto;padding:24px;font-family:system-ui"><h1>Não foi possível carregar o VETTA</h1><p>Atualize a página com internet para concluir a atualização.</p></main>';});
