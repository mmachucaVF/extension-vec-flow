# Fix Workflow — extension-vec-flow

## Flujo correcto para cualquier fix (máximo 4 llamadas al tool)

### Paso 1: Fetch del archivo actual desde GitHub
```js
const r = await fetch('https://raw.githubusercontent.com/mmachucaVF/extension-vec-flow/main/content.js?t='+Date.now());
window.__code = await r.text();
```

### Paso 2: Aplicar el patch en memoria
```js
window.__newCode = window.__code.replace(OLD_STRING, NEW_STRING);
// o con slice para bloques más grandes:
const idx = window.__code.indexOf('texto_único_del_bloque');
window.__newCode = window.__code.slice(0, idx) + NEW_BLOCK + window.__code.slice(idx + OLD_BLOCK.length);
```

### Paso 3: Verificar sintaxis
```js
let ok=false, err='';
try { new Function(window.__newCode); ok=true; } catch(e) { err=e.message; }
ok + ' | len:' + window.__newCode.length + ' | err:' + err
// Debe decir: true | len:XXXXX | err:
```

### Paso 4: Subir via Git Tree API (un solo bloque JS)
```js
(async () => {
  const T = 'TOKEN';
  const h = { 'Authorization': 'token ' + T, 'Content-Type': 'application/json' };
  const blob = await (await fetch('https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/blobs',
    { method:'POST', headers:h, body:JSON.stringify({ content: window.__newCode, encoding:'utf-8' }) })).json();
  const ref = await (await fetch('https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/refs/heads/main', { headers:h })).json();
  const commit = await (await fetch(`https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/commits/${ref.object.sha}`, { headers:h })).json();
  const tree = await (await fetch('https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/trees',
    { method:'POST', headers:h, body:JSON.stringify({ base_tree: commit.tree.sha, tree:[{ path:'content.js', mode:'100644', type:'blob', sha:blob.sha }] }) })).json();
  const newCommit = await (await fetch('https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/commits',
    { method:'POST', headers:h, body:JSON.stringify({ message:'fix: descripción', tree:tree.sha, parents:[ref.object.sha] }) })).json();
  const update = await (await fetch('https://api.github.com/repos/mmachucaVF/extension-vec-flow/git/refs/heads/main',
    { method:'PATCH', headers:h, body:JSON.stringify({ sha:newCommit.sha }) })).json();
  console.log('Done:', newCommit.sha.slice(0,8));
})();
```

---

## Reglas para diagnóstico previo

Antes de modificar cualquier cosa, probar con código mínimo en la consola:
- **¿El dashboard es SSR o CSR?** → `fetch('/dashboard?per_page=50').then(r=>r.text()).then(h=>console.log(h.match(/flows\/\d+/g)?.length))`
- **¿Qué devuelve el endpoint?** → Probar la URL manualmente antes de asumir
- **¿El bug es en el código o en el entorno?** → Console.log del valor real antes de parchear

## Lo que NO hacer

- ❌ Inyectar código en chunks de 2000 chars (tarda horas)
- ❌ Usar `location.href` para navegar dentro de un loop async (destruye el estado JS)
- ❌ Asumir la causa del bug sin probar primero
- ❌ Intentar múltiples enfoques sin diagnosticar primero

## Arquitectura del dashboard VecFleet

- **SSR**: El HTML del servidor incluye los flows renderizados
- **per_page**: El parámetro de URL `per_page` SÍ funciona con fetch del HTML, NO funciona con pushState (Vue usa su estado interno)
- **Regex para parsear flows del HTML**: `/href="https:\/\/flow\.vecfleet\.io\/flows\/(\d+)"\s+class="text-lg[^"]*"[^>]*>([^<]+)/g`
- **50 flows por página** con `per_page=50` via fetch del servidor
