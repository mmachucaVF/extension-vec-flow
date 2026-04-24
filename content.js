(() => {
  const BASE = 'https://flow.vecfleet.io';
  let allFlows = [];
  let selectedIds = new Set();
  let activeFilter = 'all';
  let groupMode = false;
  let groupByError = false;
  let statsData = { total: 0, errors: 0, timeouts: 0, ok: 0 };
  let panelOpen = false;
  let currentPage = 1;
  const PAGE_SIZE = 50;
  const expandedGroups = new Set();

  function injectStyles() {
    if (document.getElementById('fm-styles')) return;
    const style = document.createElement('style');
    style.id = 'fm-styles';
    style.textContent = `
      #fm-toggle-btn{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:1000000;background:#6c63ff;border:none;border-radius:10px 0 0 10px;width:26px;height:64px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:-3px 0 16px rgba(108,99,255,.35);padding:0;pointer-events:all}
      #fm-toggle-btn:hover{width:30px;background:#8078ff}
      #fm-toggle-btn svg{width:14px;height:14px;fill:white;transition:transform .25s}
      #fm-panel{position:fixed;top:0;right:0;width:760px;height:100vh;z-index:999999;display:flex;flex-direction:column;background:#0a0c10;border-left:1px solid rgba(255,255,255,.06);font-family:system-ui,sans-serif;font-size:13px;color:#eceef2;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);box-shadow:-12px 0 48px rgba(0,0,0,.6);pointer-events:none;overflow-x:hidden}
      #fm-panel.fm-open{transform:translateX(0);pointer-events:all}
      #fm-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:#111318;flex-shrink:0;gap:10px}
      #fm-header-left{display:flex;align-items:center;gap:10px}
      .fm-logo-dot{width:8px;height:8px;border-radius:50%;background:#6c63ff;box-shadow:0 0 8px #6c63ff;animation:fm-pulse 2.5s ease-in-out infinite}
      @keyframes fm-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
      .fm-logo-text{font-size:13px;font-weight:600;color:#eceef2}
      .fm-logo-sub{font-size:9px;color:#434a57}
      #fm-header-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
      .fm-date{font-size:9px;color:#7c8494;background:#181b22;border:1px solid rgba(255,255,255,.06);border-radius:5px;padding:3px 8px;white-space:nowrap}
      #fm-config-bar{display:flex;gap:1px;background:rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
      .fm-cfg-btn{flex:1;display:flex;align-items:center;gap:7px;padding:7px 12px;background:#111318;border:none;cursor:pointer;transition:background .15s;text-align:left}
      .fm-cfg-btn:hover{background:#181b22}
      .fm-cfg-icon{font-size:13px;flex-shrink:0}
      .fm-cfg-label{font-size:11px;font-weight:600;color:#7c8494;flex:1}
      .fm-cfg-status{font-size:9px;color:#434a57;white-space:nowrap}
      .fm-btn{font-size:11px;font-weight:500;padding:5px 11px;border-radius:7px;border:1px solid rgba(255,255,255,.11);background:#181b22;color:#eceef2;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
      .fm-btn:hover:not(:disabled){background:#1e2229}
      .fm-btn:disabled{cursor:not-allowed;opacity:.5}
      .fm-btn.fm-primary{background:#6c63ff;border-color:#6c63ff;color:#fff}
      .fm-btn.fm-primary:hover:not(:disabled){background:#8078ff}
      .fm-btn.fm-danger{background:rgba(240,80,80,.1);border-color:rgba(240,80,80,.22);color:#f05050}
      #fm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;min-width:0}
      .fm-stat{background:#111318;padding:9px 12px;display:flex;flex-direction:column;gap:2px;cursor:pointer;transition:background .15s;position:relative}
      .fm-stat:hover{background:#181b22}
      .fm-stat.fm-active::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px}
      .fm-stat.fm-active-all::after{background:#7c8494}
      .fm-stat.fm-active-error::after{background:#f05050}
      .fm-stat.fm-active-timeout::after{background:#f5923e}
      .fm-stat.fm-active-ok::after{background:#3ecf82}
      .fm-stat-label{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#434a57}
      .fm-stat-value{font-size:20px;font-weight:500;line-height:1.1}
      .fm-stat-meta{font-size:9px;color:#434a57}
      .fm-c-all{color:#eceef2}.fm-c-error{color:#f05050}.fm-c-timeout{color:#f5923e}.fm-c-ok{color:#3ecf82}
      #fm-main{display:grid;grid-template-columns:1fr 1fr;flex:1;overflow:hidden;min-height:0;min-width:0}
      #fm-list-panel{display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06);overflow:hidden;min-height:0;min-width:0}
      #fm-toolbar{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.06);background:#111318;display:flex;align-items:center;gap:6px;flex-shrink:0;position:sticky;top:0;z-index:5}
      .fm-search{flex:1;background:#181b22;border:1px solid rgba(255,255,255,.06);color:#eceef2;font-size:11px;padding:5px 9px;border-radius:7px;outline:none}
      .fm-search:focus{border-color:#6c63ff}
      .fm-chip{font-size:9px;padding:4px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.06);background:transparent;color:#7c8494;cursor:pointer;transition:all .15s;white-space:nowrap}
      .fm-chip:hover{color:#eceef2;border-color:rgba(255,255,255,.18)}
      .fm-chip.fm-active{background:rgba(108,99,255,.12);border-color:rgba(108,99,255,.3);color:#6c63ff}
      #fm-list-content{flex:1;overflow-y:auto}
      .fm-row{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;gap:8px;cursor:pointer;transition:background .1s;min-width:0}
      .fm-row:hover{background:#111318}
      .fm-row.fm-state-error{border-left:2px solid #f05050}
      .fm-row.fm-state-timeout{border-left:2px solid #f5923e}
      .fm-row.fm-state-ok{border-left:2px solid #3ecf82}
      .fm-row.fm-selected{background:rgba(108,99,255,.1)!important}
      .fm-check{width:14px;height:14px;border:1px solid rgba(255,255,255,.11);border-radius:3px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center}
      .fm-row.fm-selected .fm-check{background:#6c63ff;border-color:#6c63ff}
      .fm-check-mark{display:none;color:#fff;font-size:9px}
      .fm-row.fm-selected .fm-check-mark{display:block}
      .fm-info{flex:1;min-width:0;overflow:hidden}
      .fm-name{font-size:11px;font-weight:500;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;max-width:100%}
      .fm-desc{font-size:10px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
      .fm-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
      .fm-id,.fm-time{font-size:9px;color:#4b5563}
      .fm-pill{font-size:8px;font-weight:500;padding:1px 6px;border-radius:20px;display:inline-flex;align-items:center;gap:3px}
      .fm-pill-error{background:rgba(240,80,80,.18);color:#ff6b6b;border:1px solid rgba(240,80,80,.35)}
      .fm-pill-timeout{background:rgba(245,146,62,.18);color:#ffaa5e;border:1px solid rgba(245,146,62,.35)}
      .fm-pill-ok{background:rgba(62,207,130,.15);color:#4ade80;border:1px solid rgba(62,207,130,.35)}
      .fm-group-hdr{padding:5px 10px;background:#0a0c10;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:6px}
      .fm-group-name{font-size:9px;color:#434a57;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .fm-group-cnt{font-size:9px;color:#434a57}
      .fm-error-group-hdr{padding:8px 10px;border-bottom:1px solid rgba(240,80,80,.22);border-left:2px solid #f05050;cursor:pointer;transition:background .15s}
      .fm-error-group-hdr:hover{filter:brightness(1.15)}
      .fm-error-group-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}
      .fm-error-group-chevron{font-size:9px;font-family:monospace;width:10px;flex-shrink:0}
      .fm-error-group-msg{font-size:10px;flex:1;word-break:break-word;line-height:1.5}
      .fm-error-group-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .fm-error-group-body{animation:fm-slide-down .15s ease-out}
      @keyframes fm-slide-down{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      .fm-summary-bar{padding:9px 12px;background:#181b22;border-bottom:1px solid rgba(255,255,255,.11);display:flex;align-items:center;justify-content:space-between}
      .fm-summary-label{font-size:11px;font-weight:600;color:#e2e8f0}
      .fm-summary-sub{font-size:9px;color:#434a57}
      .fm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;gap:10px;color:#434a57;height:100%}
      .fm-empty-icon{font-size:28px;opacity:.35}
      .fm-empty-text{font-size:11px;text-align:center;line-height:1.7}
      .fm-loading-bar{height:2px;flex-shrink:0;background:linear-gradient(90deg,transparent,#6c63ff,transparent);background-size:200% 100%;animation:fm-loading 1.2s linear infinite}
      @keyframes fm-loading{0%{background-position:100% 0}100%{background-position:-100% 0}}
      #fm-pagination{flex-shrink:0;border-top:1px solid rgba(255,255,255,.06);background:#0a0c10}
      .fm-pag-wrap{display:flex;align-items:center;gap:3px;padding:6px 10px;flex-wrap:wrap}
      .fm-pag-btn{font-size:10px;padding:3px 7px;border-radius:5px;border:1px solid rgba(255,255,255,.06);background:transparent;color:#7c8494;cursor:pointer;min-width:26px;text-align:center}
      .fm-pag-btn:hover:not(:disabled){background:#181b22;color:#eceef2}
      .fm-pag-btn:disabled{opacity:.3;cursor:default}
      .fm-pag-btn.fm-pag-active{background:#6c63ff;border-color:#6c63ff;color:#fff}
      .fm-pag-ellipsis{color:#434a57;font-size:10px;padding:0 3px}
      .fm-pag-info{font-size:9px;color:#434a57;margin-left:auto;padding:6px 10px}
      #fm-sel-bar{flex-shrink:0;background:#181b22;border-top:1px solid rgba(255,255,255,.11);padding:7px 12px;display:flex;align-items:center;gap:7px;transform:translateY(100%);transition:transform .2s}
      #fm-sel-bar.fm-visible{transform:translateY(0)}
      .fm-sel-info{flex:1;font-size:11px;color:#7c8494}
      .fm-sel-count{color:#6c63ff;font-weight:500}
      #fm-detail{overflow-y:auto;overflow-x:hidden;background:#111318;display:flex;flex-direction:column;min-width:0}
      .fm-detail-hdr{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;background:#111318;z-index:5;flex-shrink:0}
      .fm-detail-hdr.fm-hdr-error{border-top:3px solid #f05050}
      .fm-detail-hdr.fm-hdr-timeout{border-top:3px solid #f5923e}
      .fm-detail-hdr.fm-hdr-ok{border-top:3px solid #3ecf82}
      .fm-detail-title{font-size:12px;font-weight:600;color:#f1f5f9;margin-bottom:2px;line-height:1.4}
      .fm-detail-sub{font-size:9px;color:#6b7280}
      .fm-detail-sec{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
      .fm-sec-label{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#434a57;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
      .fm-dr{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}
      .fm-dr:last-child{border-bottom:none}
      .fm-dk{font-size:11px;color:#9ca3af;min-width:75px}
      .fm-dv{font-size:10px;color:#e2e8f0;text-align:right;word-break:break-all;font-family:monospace}
      .fm-error-box{background:rgba(240,80,80,.1);border:1px solid rgba(240,80,80,.22);border-radius:7px;padding:10px;font-size:10px;color:#f05050;line-height:1.6;word-break:break-word;white-space:pre-wrap;margin-bottom:6px;font-family:monospace}
      .fm-timeout-box{background:rgba(245,146,62,.1);border:1px solid rgba(245,146,62,.22);border-radius:7px;padding:10px;font-size:10px;color:#f5923e;line-height:1.6;word-break:break-word;white-space:pre-wrap;margin-bottom:6px;font-family:monospace}
      .fm-json-box{background:#0a0c10;border:1px solid rgba(255,255,255,.11);border-radius:7px;padding:10px;font-size:10px;color:#7c8494;line-height:1.7;word-break:break-word;white-space:pre-wrap;max-height:260px;overflow-y:auto;margin-top:4px;font-family:monospace}
      .fm-json-box.fm-expanded{max-height:none}
      .fm-no-sel{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:10px;color:#434a57;padding:24px;text-align:center}
      .fm-no-sel-icon{width:44px;height:44px;border:1px solid rgba(255,255,255,.06);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px}
      .fm-no-sel-text{font-size:10px;color:#4b5563;line-height:1.7}
      #fm-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000001;display:none;align-items:center;justify-content:center;padding:16px}
      #fm-modal-overlay.fm-visible{display:flex}
      #fm-modal{background:#111318;border:1px solid rgba(255,255,255,.12);border-radius:11px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.7)}
      .fm-modal-hdr{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center}
      .fm-modal-title{font-size:14px;font-weight:600;color:#eceef2}
      .fm-modal-close{background:none;border:none;color:#6b7280;cursor:pointer;font-size:16px;padding:2px 5px}
      .fm-modal-body{padding:16px}
      .fm-field{margin-bottom:12px}
      .fm-field-label{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:5px;display:block}
      .fm-field-input,.fm-field-textarea,.fm-field-select{width:100%;background:#1e2230;border:1px solid rgba(255,255,255,.1);color:#e2e8f0;font-size:12px;padding:7px 10px;border-radius:7px;outline:none;box-sizing:border-box}
      .fm-field-input:focus,.fm-field-textarea:focus,.fm-field-select:focus{border-color:#6c63ff}
      .fm-field-textarea{resize:vertical;min-height:110px;font-family:monospace;font-size:10px;line-height:1.7}
      .fm-field-select option{background:#1e2230}
      .fm-modal-footer{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;align-items:center}
      #fm-jira-status{flex:1;font-size:10px;color:#434a57}
      #fm-ai-cfg-overlay,#fm-jira-cfg-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000003;align-items:center;justify-content:center;padding:16px;pointer-events:none}
      #fm-panel ::-webkit-scrollbar{width:3px}
      #fm-panel ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.11);border-radius:2px}
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    if (document.getElementById('fm-panel')) return;
    const btn = document.createElement('button');
    btn.id = 'fm-toggle-btn'; btn.title = 'Flow Monitor';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
    const panel = document.createElement('div');
    panel.id = 'fm-panel';
    panel.innerHTML = `
      <div id="fm-header">
        <div id="fm-header-left">
          <div class="fm-logo-dot"></div>
          <div><div class="fm-logo-text">Flow Monitor</div><div class="fm-logo-sub">vecfleet.io</div></div>
        </div>
        <div id="fm-header-right">
          <div class="fm-date" id="fm-date">—</div>
          <button class="fm-btn" id="fm-refresh-btn" data-action="refresh">🔄 Actualizar</button>
        </div>
      </div>
      <div id="fm-config-bar">
        <button class="fm-cfg-btn" id="fm-cfg-jira-btn" data-action="jira-config">
          <span class="fm-cfg-icon" id="fm-cfg-jira-icon">⚙️</span>
          <span class="fm-cfg-label">Jira</span>
          <span class="fm-cfg-status" id="fm-cfg-jira-status">no configurado</span>
        </button>
        <button class="fm-cfg-btn" id="fm-cfg-ai-btn" data-action="ai-config">
          <span class="fm-cfg-icon" id="fm-cfg-ai-icon">⚙️</span>
          <span class="fm-cfg-label">IA Diagnóstico</span>
          <span class="fm-cfg-status" id="fm-cfg-ai-status">no configurado</span>
        </button>
      </div>
      <div id="fm-stats">
        <div class="fm-stat fm-active fm-active-all" id="fm-stat-all" data-action="filter-all">
          <div class="fm-stat-label">Total</div>
          <div class="fm-stat-value fm-c-all" id="fm-stat-total">—</div>
          <div class="fm-stat-meta">flows</div>
        </div>
        <div class="fm-stat" id="fm-stat-error" data-action="filter-error">
          <div class="fm-stat-label">Errores</div>
          <div class="fm-stat-value fm-c-error" id="fm-stat-errors">—</div>
          <div class="fm-stat-meta" id="fm-stat-error-pct">—</div>
        </div>
        <div class="fm-stat" id="fm-stat-timeout" data-action="filter-timeout">
          <div class="fm-stat-label">Timeouts</div>
          <div class="fm-stat-value fm-c-timeout" id="fm-stat-timeouts">—</div>
          <div class="fm-stat-meta" id="fm-stat-timeout-pct">—</div>
        </div>
        <div class="fm-stat" id="fm-stat-ok" data-action="filter-ok">
          <div class="fm-stat-label">OK</div>
          <div class="fm-stat-value fm-c-ok" id="fm-stat-ok-val">—</div>
          <div class="fm-stat-meta" id="fm-stat-ok-pct">—</div>
        </div>
      </div>
      <div id="fm-main">
        <div id="fm-list-panel">
          <div id="fm-toolbar">
            <input type="text" class="fm-search" id="fm-search" placeholder="buscar nombre, ID, error...">
            <button class="fm-chip" id="fm-group-btn" data-action="toggle-group">agrupar</button>
            <button class="fm-chip" id="fm-group-err-btn" data-action="toggle-group-error">por error</button>
            <button class="fm-chip" data-action="select-all">☑️ sel.</button>
          </div>
          <div id="fm-list-content">
            <div class="fm-empty"><div class="fm-empty-icon">◎</div><div class="fm-empty-text">Hacé click en "Actualizar"<br>para cargar los flows</div></div>
          </div>
          <div id="fm-pagination"></div>
          <div id="fm-sel-bar">
            <div class="fm-sel-info"><span class="fm-sel-count" id="fm-sel-count">0</span> seleccionados</div>
            <button class="fm-btn" data-action="clear-sel">🗑️ Limpiar</button>
            <button class="fm-btn fm-danger" data-action="open-jira">🎫 Ticket →</button>
          </div>
        </div>
        <div id="fm-detail">
          <div class="fm-no-sel"><div class="fm-no-sel-icon">◷</div><div class="fm-no-sel-text">Seleccióná un flow<br>para ver el detalle</div></div>
        </div>
      </div>
      <div id="fm-modal-overlay">
        <div id="fm-modal">
          <div class="fm-modal-hdr">
            <div style="display:flex;align-items:center;gap:8px"><span>🎫</span><div class="fm-modal-title" id="fm-modal-title">Crear ticket en Jira</div></div>
            <button class="fm-modal-close" data-action="close-jira">✕</button>
          </div>
          <div class="fm-modal-body">
            <div class="fm-field"><label class="fm-field-label">PROYECTO</label><select class="fm-field-select" id="fm-jira-project"></select></div>
            <div class="fm-field"><label class="fm-field-label">TIPO DE ISSUE</label><select class="fm-field-select" id="fm-jira-issuetype"></select></div>
            <div class="fm-field"><label class="fm-field-label">ASUNTO</label><input type="text" class="fm-field-input" id="fm-jira-title" placeholder="Título"></div>
            <div class="fm-field"><label class="fm-field-label">DESCRIPCIÓN</label><textarea class="fm-field-textarea" id="fm-jira-desc" rows="8"></textarea></div>
            <div class="fm-field"><label class="fm-field-label">PRIORIDAD</label><select class="fm-field-select" id="fm-jira-priority"><option value="Highest">Highest</option><option value="High">High</option><option value="Medium" selected>Medium</option><option value="Low">Low</option><option value="Lowest">Lowest</option></select></div>
          </div>
          <div class="fm-modal-footer">
            <div id="fm-jira-status"></div>
            <button class="fm-btn" data-action="close-jira">Cancelar</button>
            <button class="fm-btn" data-action="jira-config">⚙️ Configurar</button>
            <button class="fm-btn fm-primary" id="fm-create-btn" data-action="create-jira-ticket">Crear ticket →</button>
          </div>
        </div>
      </div>
      <div id="fm-jira-cfg-overlay">
        <div style="background:#14171c;border:1px solid rgba(255,255,255,.12);border-radius:12px;width:100%;max-width:420px;pointer-events:all">
          <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:14px;font-weight:600;color:#e2e8f0">⚙️ Configuración Jira</div>
            <button data-action="close-jira-cfg" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:16px;padding:2px 5px">✕</button>
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
            <div><label class="fm-field-label">URL DE JIRA</label><input id="fm-cfg-url" type="text" placeholder="https://empresa.atlassian.net" class="fm-field-input" style="width:100%"></div>
            <div><label class="fm-field-label">EMAIL</label><input id="fm-cfg-email" type="email" placeholder="tu@email.com" class="fm-field-input" style="width:100%"></div>
            <div><label class="fm-field-label">API TOKEN</label><input id="fm-cfg-token" type="password" placeholder="ATATT3x..." class="fm-field-input" style="width:100%;font-family:monospace"><div style="margin-top:4px;font-size:10px;color:#6b7280">Generá uno en <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" style="color:#6c63ff">atlassian.com ↗</a></div></div>
            <div id="fm-cfg-status" style="font-size:11px;min-height:16px"></div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:flex-end;gap:8px">
            <button data-action="close-jira-cfg" class="fm-btn">Cancelar</button>
            <button id="fm-cfg-save-btn" class="fm-btn fm-primary" data-action="save-jira-config">Guardar y verificar</button>
          </div>
        </div>
      </div>
      <div id="fm-ai-cfg-overlay">
        <div style="background:#14171c;border:1px solid rgba(108,99,255,.3);border-radius:12px;width:100%;max-width:420px;pointer-events:all">
          <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:14px;font-weight:600;color:#e2e8f0">🤖 Configuración IA</div>
            <button data-action="close-ai-cfg" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:16px;padding:2px 5px">✕</button>
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
            <div><label class="fm-field-label">API KEY DE ANTHROPIC</label><input id="fm-ai-key-input" type="password" placeholder="sk-ant-..." class="fm-field-input" style="width:100%;font-family:monospace"><div style="margin-top:4px;font-size:10px;color:#6b7280">Generá una en <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:#6c63ff">console.anthropic.com ↗</a></div></div>
            <div id="fm-ai-cfg-status" style="font-size:11px;min-height:16px"></div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:flex-end;gap:8px">
            <button data-action="close-ai-cfg" class="fm-btn">Cancelar</button>
            <button id="fm-ai-cfg-save-btn" class="fm-btn fm-primary" data-action="save-ai-config">Guardar y verificar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('fm-date').textContent = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    updateConfigStatus();
    document.getElementById('fm-search').addEventListener('input', () => { currentPage = 1; renderList(); });
    panel.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      e.stopPropagation();
      const a = el.dataset.action;
      ({
        'refresh':            loadFlows,
        'filter-all':         () => setFilter('all'),
        'filter-error':       () => setFilter('error'),
        'filter-timeout':     () => setFilter('timeout'),
        'filter-ok':          () => setFilter('ok'),
        'toggle-group':       toggleGroup,
        'toggle-group-error': toggleGroupByError,
        'select-all':         selectAllVisible,
        'clear-sel':          clearSelection,
        'open-jira':          openJiraModal,
        'close-jira':         closeJiraModal,
        'jira-config':        openJiraConfig,
        'ai-config':          openAiConfig,
        'close-jira-cfg':     closeJiraCfg,
        'close-ai-cfg':       closeAiCfg,
        'save-jira-config':   saveJiraConfig,
        'save-ai-config':     saveAiConfig,
        'create-jira-ticket': createJiraTicket,
        'row-click':          () => handleClick(el.dataset.id),
        'page':               () => goToPage(parseInt(el.dataset.page)),
        'add-jira':           () => addAndJira(el.dataset.flowId),
        'sel-group':          () => selectGroup(el.getAttribute('data-group-key')),
        'ticket-group':       () => ticketGroup(el.getAttribute('data-group-key')),
        'toggle-err-group':   () => toggleErrGroup(el.getAttribute('data-group-key')),
        'run-diagnosis':      () => runDiagnosis(el.dataset.flowId),
      }[a] || (() => {}))();
    });
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('fm-panel');
    const btn   = document.getElementById('fm-toggle-btn');
    panel.classList.toggle('fm-open', panelOpen);
    
    
    if (btn) btn.style.right = panelOpen ? '760px' : '0';
    if (panelOpen && allFlows.length === 0) loadFlows();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function loadFlows() {
    const btn = document.getElementById('fm-refresh-btn');
    btn.textContent = '↻ Cargando...'; btn.disabled = true;
    allFlows = []; currentPage = 1;
    try {
      showLoading('Leyendo totales...');
      // Cargar flows y estados en paralelo
      setMsg('◎', 'Cargando flows y estados...');
      const [flowsResult, stateMap] = await Promise.all([
        loadAllFlows(),
        fetchStateMap()
      ]);
      allFlows = flowsResult;
      
      // Paso 3: asignar estado a cada flow
      for (const f of allFlows) {
        f.state = stateMap[f.id] || 'ok';
      }
      
      // Actualizar stats del panel
      const errors   = allFlows.filter(f=>f.state==='error').length;
      const timeouts = allFlows.filter(f=>f.state==='timeout').length;
      const running  = allFlows.filter(f=>f.state==='running').length;
      const ok       = allFlows.filter(f=>f.state==='ok').length;
      const total    = allFlows.length;
      document.getElementById('fm-stat-total').textContent    = total;
      document.getElementById('fm-stat-errors').textContent   = errors;
      document.getElementById('fm-stat-timeouts').textContent = timeouts;
      document.getElementById('fm-stat-ok-val').textContent   = ok;
      if (total>0) {
        document.getElementById('fm-stat-error-pct').textContent   = ((errors/total)*100).toFixed(1)+'%';
        document.getElementById('fm-stat-timeout-pct').textContent = ((timeouts/total)*100).toFixed(1)+'%';
        document.getElementById('fm-stat-ok-pct').textContent      = ((ok/total)*100).toFixed(1)+'%';
      }
      document.getElementById('fm-date').textContent = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      renderList();
      setMsg('✓', `Listo: ${total} flows cargados`);
      loadErrorDetailsInBackground(allFlows.filter(f=>f.state==='error'||f.state==='timeout'));
    } catch(e) { console.error('[FlowMonitor]', e); showError(e.message); }
    btn.textContent = '🔄 Actualizar'; btn.disabled = false;
  }

  async function loadErrorDetailsInBackground(flows) {
    if (!flows.length) return;
    const pending = flows.filter(f => !f.errorsLoaded);
    if (!pending.length) { if (groupByError) renderList(); return; }

    const container = document.getElementById('fm-list-content');
    const total = pending.length;
    let done = 0;

    if (groupByError && container) {
      const div = document.createElement('div');
      div.id = 'fm-err-loading';
      div.style.cssText = 'padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:14px';
      div.innerHTML = '<span class="fm-err-txt" style="font-size:11px;color:#7c8494">Cargando detalles... 0/' + total + '</span>'
        + '<div style="width:80%;height:3px;background:rgba(255,255,255,.08);border-radius:2px">'
        + '<div class="fm-err-fill" style="height:100%;width:0%;background:#6c63ff;border-radius:2px"></div>'
        + '</div>';
      container.innerHTML = '';
      container.appendChild(div);
    }

    let lastShown = -1;
    const timer = setInterval(() => {
      if (done === lastShown) return;
      lastShown = done;
      const el = document.getElementById('fm-err-loading');
      if (!el) { clearInterval(timer); return; }
      el.querySelector('.fm-err-txt').textContent = 'Cargando detalles... ' + done + '/' + total;
      el.querySelector('.fm-err-fill').style.width = Math.round((done / total) * 100) + '%';
    }, 300);

    const BATCH = 8;
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(batch.map(async f => {
        try {
          // Obtener executionId del HTML del flow
          const pageR = await fetch(`/flows/${f.id}`, { credentials: 'include' });
          const pageHtml = await pageR.text();
          const execM = pageHtml.match(/executions\/(\d+)\/download/);
          if (!execM) { f.errors = 'Sin detalle'; return; }
          f.executionId = execM[1];

          // Usar /details que devuelve el JSON completo sin truncar
          const detR = await fetch(`/executions/${f.executionId}/details`, { credentials: 'include' });
          if (!detR.ok) { f.errors = 'Sin detalle'; return; }
          const det = await detR.json();

          const procs = det.pipeline && det.pipeline.processes;
          if (procs && procs.length > 0) {
            const errProc = procs.find(p => p.errors && p.errors.trim()) || procs[0];
            f.errors     = errProc.errors || 'Sin detalle';
            f.errorsRaw  = errProc.errors || '';
            f.processName = errProc.name ? errProc.name.split('\\').pop() : '';
          } else {
            // Sin pipeline — fallback a /download
            const logR = await fetch(`/executions/${f.executionId}/download`, { credentials: 'include' });
            if (logR.ok) {
              const logText = await logR.text();
              const sepIdx = logText.lastIndexOf('=====');
              const afterSep = sepIdx >= 0 ? logText.slice(sepIdx + 5).trim() : logText;
              const jsonIdx = afterSep.indexOf('{');
              if (jsonIdx >= 0) {
                try {
                  const obj = JSON.parse(afterSep.slice(jsonIdx));
                  const errs = (obj.processes || []).map(p => (p.errors || '').trim()).filter(Boolean);
                  f.errors = errs.join(' | ') || 'Sin detalle';
                } catch(e2) { f.errors = 'Sin detalle'; }
              } else {
                const ap = logText.match(/\)\s+(.+)$/m);
                f.errors = ap ? ap[1].trim() : 'Sin detalle';
              }
              f.errorsRaw = f.errors;
            } else {
              f.errors = 'Sin detalle';
            }
          }
        } catch(e) {
          f.errors = 'Sin detalle';
        } finally {
          f.errorsLoaded = true;
          done++;
        }
      }));
    }

    clearInterval(timer);
    const loadingEl = document.getElementById('fm-err-loading');
    if (loadingEl) loadingEl.remove();
    if (groupByError) renderList();
  }


  async function fetchStateTotals() {
    const getTotal = async (state) => {
      try {
        const r = await fetch(`/dashboard?per_page=50&page=1&states%5B%5D=${state}`, {credentials:'include'});
        const html = await r.text();
        const m = html.match(/Mostrando\s+\d+\s*-\s*\d+\s+de\s+(\d+)/);
        return m ? parseInt(m[1]) : 0;
      } catch(e) { return 0; }
    };
    const [errors, timeouts, ok, running] = await Promise.all([
      getTotal('error'), getTotal('timeout'), getTotal('ok'), getTotal('running')
    ]);
    return { errors, timeouts, ok, running };
  }

    async function loadAllFlows() {
    const flows = [], seen = new Set();
    for (let page = 1; page <= 50; page++) {
      const { flows: pf, to, total } = await fetchFlowsFromPage(null, page);
      for (const f of pf) {
        if (!seen.has(f.id)) { seen.add(f.id); flows.push(f); }
      }
      setMsg('◎', `Cargando flows... ${flows.length}`);
      if (pf.length === 0 || total === 0 || to >= total) break;
    }
    return flows;
  }

  async function fetchStateMap() {
    // Fetch paralelo de los 4 estados para mapear id->estado
    const getIds = async (state) => {
      const ids = new Set();
      for (let page = 1; page <= 50; page++) {
        const { flows, to, total } = await fetchFlowsFromPage(state, page);
        flows.forEach(f => ids.add(f.id));
        if (flows.length === 0 || total === 0 || to >= total) break;
      }
      return ids;
    };
    const [errorIds, timeoutIds, runningIds] = await Promise.all([
      getIds('error'), getIds('timeout'), getIds('running')
    ]);
    // Construir mapa: error > timeout > running > ok (prioridad)
    const map = {};
    runningIds.forEach(id => map[id] = 'running');
    timeoutIds.forEach(id => map[id] = 'timeout');
    errorIds.forEach(id  => map[id] = 'error');
    return map;
  }

  async function loadStateFromDOM(state) {
    const flows = [], seen = new Set(), label = state==='error'?'errores':state==='timeout'?'timeouts':state==='running'?'running':'OK';
    for (let page = 1; page <= 50; page++) {
      setMsg('◎', `Cargando ${label}... p.${page}`);
      const pf = await fetchFlowsFromPage(state, page);
      for (const f of pf) {
        if (!seen.has(f.id)) { seen.add(f.id); flows.push(f); }
      }
      if (pf.length === 0) break;
    }
    return flows;
  }

  async function fetchFlowsFromPage(state, page) {
    const p = new URLSearchParams({ search:'', environment_id:'', status:'active', sort_by:'last_run', sort_dir:'desc', per_page:50, page:page||1 });
    if (state==='error')   p.set('states[]','error');
    if (state==='timeout') p.set('states[]','timeout');
    if (state==='ok')      p.set('states[]','ok');
    if (state==='running') p.set('states[]','running');
    // state===null: sin filtro, devuelve todos
    try {
      const r = await fetch(`/dashboard?${p.toString()}`, { credentials:'include' });
      const html = await r.text();
      const flows = parseFlowsFromHTML(html, state || 'ok');
      const m = html.match(/Mostrando\s+(\d+)\s*-\s*(\d+)\s+de\s+(\d+)/);
      const to    = m ? parseInt(m[2]) : 0;
      const total = m ? parseInt(m[3]) : 0;
      return { flows, to, total };
    } catch(e) { return { flows:[], to:0, total:0 }; }
  }

  async function loadAllFlows() {
    const flows = [], seen = new Set();
    for (let page = 1; page <= 50; page++) {
      try {
        const r = await fetch(`/dashboard?search=&environment_id=&status=active&sort_by=id&sort_dir=asc&per_page=50&page=${page}`, {credentials:'include'});
        const html = await r.text();
        const m = html.match(/Mostrando\s+(\d+)\s*-\s*(\d+)\s+de\s+(\d+)/);
        const to    = m ? parseInt(m[2]) : 0;
        const total = m ? parseInt(m[3]) : 0;
        const pf = parseFlowsFromHTML(html, 'ok');
        for (const f of pf) {
          if (!seen.has(f.id)) { seen.add(f.id); flows.push(f); }
        }
        setMsg('◎', `Cargando flows... ${flows.length}/${total}`);
        if (pf.length === 0 || total === 0 || to >= total) break;
      } catch(e) { break; }
    }
    return flows;
  }

  async function fetchStateMap() {
    const getIds = async (state) => {
      const ids = new Set();
      for (let page = 1; page <= 50; page++) {
        const res = await fetchFlowsFromPage(state, page);
        const pf    = Array.isArray(res.flows) ? res.flows : [];
        const to    = res.to    || 0;
        const total = res.total || 0;
        pf.forEach(f => ids.add(f.id));
        if (pf.length === 0 || total === 0 || to >= total) break;
      }
      return ids;
    };
    const [errorIds, timeoutIds, runningIds] = await Promise.all([
      getIds('error'), getIds('timeout'), getIds('running')
    ]);
    const map = {};
    runningIds.forEach(id => map[id] = 'running');
    timeoutIds.forEach(id => map[id] = 'timeout');
    errorIds.forEach(id  => map[id] = 'error');
    return map;
  }

  function parseFlowsFromHTML(html, state) {
    const flows = [], seen = new Set();
    const matches = [...html.matchAll(/href="https:\/\/flow\.vecfleet\.io\/flows\/(\d+)"\s+class="text-lg[^"]*"[^>]*>([^<]+)/g)];
    for (const m of matches) {
      const id = m[1], name = m[2].trim().replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
      if (!name || name.length < 4 || seen.has(id)) continue;
      seen.add(id);
      const pos = m.index;
      const ctx = html.slice(Math.max(0,pos-200), pos+500);
      const timeM = ctx.match(/hace\s+([\d]+\s+\w+)/);
      const typeM = ctx.match(/VecfleetHttpRequester|VecfleetDbQuery|VecfleetSshCommand/);
      const freqM = ctx.match(/\["?([^"\]]+)"?\]/);
      flows.push({ id, name, desc:'', state, lastRun:timeM?`hace ${timeM[1]}`:'\u2014', type:typeM?typeM[0]:'Unknown', freq:freqM?freqM[1]:'', errors:'', executionId:null });
    }
    return flows;
  }

  function navigateDashboard({ state, page, perPage = 50 }) {
    const p = new URLSearchParams({ search:'', environment_id:'', status:'active', sort_by:'last_run', sort_dir:'desc', per_page:perPage, page:page||1 });
    if (state==='error')   p.set('states[]','error');
    if (state==='timeout') p.set('states[]','timeout');
    if (state==='ok')      p.set('states[]','ok');
    if (state==='running') p.set('states[]','running');
    history.pushState({}, '', `/dashboard?${p.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state:{} }));
  }

  function waitForFlows(maxMs) {
    return new Promise(resolve => {
      const start = Date.now(); let lastCount = -1, stable = 0;
      const check = () => {
        const count = [...document.querySelectorAll('a[href*="/flows/"]')].filter(a => {
          const m = a.href.match(/\/flows\/\d+$/), t = a.innerText?.trim();
          return m && t && !t.includes('Panel') && t.length > 4;
        }).length;
        if (count > 0 && count === lastCount) { stable += 100; if (stable >= 400) { resolve(true); return; } } else stable = 0;
        lastCount = count;
        if (Date.now()-start > maxMs) { resolve(count>0); return; }
        setTimeout(check, 100);
      };
      setTimeout(check, 400);
    });
  }

  function readFlowsFromDOM(state) {
    const flows = [], seen = new Set();
    const selector = 'a.text-lg[href*="/flows/"], a[href*="/flows/"][class*="text-lg"]';
    let links = [...document.querySelectorAll(selector)];
    if (links.length === 0) {
      links = [...document.querySelectorAll('a[href*="/flows/"]')].filter(a =>
        a.href.match(/\/flows\/\d+$/) && !a.innerText?.includes('Panel') && (a.innerText?.trim().length || 0) > 4
      );
    }
    for (const a of links) {
      const m = a.href.match(/\/flows\/(\d+)$/);
      if (!m) continue;
      const id = m[1], name = a.innerText?.trim();
      if (!name || name.includes('Panel') || name.length < 4 || seen.has(id)) continue;
      seen.add(id);
      const card = a.closest('div.bg-white') || a.closest('[class*="border"]') || a.parentElement?.parentElement?.parentElement?.parentElement;
      const ct = card?.innerText?.replace(/\s+/g,' ').trim() || '';
      const timeM = ct.match(/hace\s+([\d]+\s+\w+)/);
      const typeM = ct.match(/VecfleetHttpRequester|VecfleetDbQuery|VecfleetSshCommand/);
      const freqM = ct.match(/\["?([^"\]]+)"?\]/);
      flows.push({ id, name, desc:'', state, lastRun:timeM?`hace ${timeM[1]}`:'\u2014', type:typeM?typeM[0]:'Unknown', freq:freqM?freqM[1]:'', errors:'', executionId:null });
    }
    return flows;
  }

  function parseStatsFromDOM() {
    const t = document.body.innerText;
    const tM=t.match(/FLOWS ACTIVOS\s*[\n\r]*(\d{3,5})/), eM=t.match(/ERRORES\s*[\n\r]*(\d{1,4})/), toM=t.match(/TIMEOUTS\s*[\n\r]*(\d{1,4})/), okM=t.match(/OK \(ULT\. RUN\)\s*[\n\r]*(\d{3,5})/);
    statsData = { total:tM?parseInt(tM[1]):0, errors:eM?parseInt(eM[1]):0, timeouts:toM?parseInt(toM[1]):0, ok:okM?parseInt(okM[1]):0 };
    const {total,errors,timeouts,ok} = statsData;
    document.getElementById('fm-stat-total').textContent    = total    || '—';
    document.getElementById('fm-stat-errors').textContent   = errors   || '—';
    document.getElementById('fm-stat-timeouts').textContent = timeouts || '—';
    document.getElementById('fm-stat-ok-val').textContent   = ok       || '—';
    if (total>0) {
      document.getElementById('fm-stat-error-pct').textContent   = ((errors/total)*100).toFixed(1)+'%';
      document.getElementById('fm-stat-timeout-pct').textContent = ((timeouts/total)*100).toFixed(1)+'%';
      document.getElementById('fm-stat-ok-pct').textContent      = ((ok/total)*100).toFixed(1)+'%';
    }
  }

  async function loadFlowDetail(flow) {
    if (flow.detailLoaded) return;
    const FAILED_STATE = 'App%5CFlows%5CSupport%5CStates%5CExecution%5CFailed';
    const TIMEOUT_STATE = 'App%5CFlows%5CSupport%5CStates%5CExecution%5CTimedOut';
    try {
      let execId = null;
      if (flow.state === 'error' || flow.state === 'timeout') {
        const stateParam = flow.state === 'timeout' ? TIMEOUT_STATE : FAILED_STATE;
        const r = await fetch(`${BASE}/flows/${flow.id}?state=${stateParam}`, {credentials:'include'});
        const h = await r.text();
        const m = h.match(/\/executions\/(\d+)\/details/);
        if (m) execId = m[1];
      }
      if (!execId) {
        const r = await fetch(`${BASE}/flows/${flow.id}`, {credentials:'include'});
        const h = await r.text();
        const m = h.match(/\/executions\/(\d+)\/details/);
        if (m) execId = m[1];
      }
      if (execId) flow.executionId = execId;
    } catch(e) {}
    if (flow.executionId) {
      try {
        const r = await fetch(`${BASE}/executions/${flow.executionId}/details`, {credentials:'include'});
        const d = await r.json();
        flow.jsonData = d;
        if (d.pipeline?.processes) {
          for (const proc of d.pipeline.processes) {
            if (proc.errors) {
              const raw = typeof proc.errors==='string' ? proc.errors : JSON.stringify(proc.errors);
              flow.errorsRaw=raw; flow.errors=parseErrorMessage(raw); flow.processName=proc.name?.split('\\').pop()||proc.name; break;
            }
          }
        }
      } catch(e) {}
    }
    flow.detailLoaded = true;
  }

  function parseErrorMessage(raw) {
    if (!raw) return '';
    const msgs = [];
    for (const m of [...raw.matchAll(/\{[^\n]{10,}\}/g)]) {
      try { const p=JSON.parse(m[0]); if(p.message)msgs.push(p.message); if(p.detalle)msgs.push(Array.isArray(p.detalle)?p.detalle.join(', '):String(p.detalle)); if(p.error?.[0]?.message)msgs.push(p.error[0].message); } catch(e) {}
    }
    if (msgs.length) return [...new Set(msgs)].join(' — ');
    const lines = raw.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')&&!l.startsWith('<'));
    return (lines[0]||'').substring(0,200);
  }

  function setFilter(f) {
    activeFilter=f; currentPage=1;
    document.querySelectorAll('.fm-stat').forEach(c=>c.classList.remove('fm-active','fm-active-all','fm-active-error','fm-active-timeout','fm-active-ok'));
    const cell=document.getElementById(`fm-stat-${f}`); if(cell)cell.classList.add('fm-active',`fm-active-${f}`);
    renderList();
  }

  function toggleGroup() { groupMode=!groupMode; groupByError=false; document.getElementById('fm-group-btn').classList.toggle('fm-active',groupMode); document.getElementById('fm-group-err-btn').classList.remove('fm-active'); currentPage=1; renderList(); }
  function toggleGroupByError() {
    groupByError = !groupByError;
    groupMode = false;
    document.getElementById('fm-group-err-btn').classList.toggle('fm-active', groupByError);
    document.getElementById('fm-group-btn').classList.remove('fm-active');
    currentPage = 1;
    if (groupByError) {
      const errFlows = allFlows.filter(f => f.state === 'error' || f.state === 'timeout');
      const allLoaded = errFlows.every(f => f.errorsLoaded);
      if (allLoaded) {
        renderList(); // ya están en cache, mostrar directo
      } else {
        loadErrorDetailsInBackground(errFlows);
      }
    } else {
      renderList();
    }
  }

  function getFiltered() {
    const q=document.getElementById('fm-search')?.value.toLowerCase()||'';
    let flows=activeFilter==='all'?allFlows:allFlows.filter(f=>f.state===activeFilter);
    if(q)flows=flows.filter(f=>f.name?.toLowerCase().includes(q)||f.id?.includes(q)||f.errors?.toLowerCase().includes(q));
    return flows;
  }

  function cleanErrorLabel(raw) {
    if (!raw || raw === 'Sin detalle') return '⚠ Sin detalle';
    
    // Extraer componentes estructurales del error
    var httpMatch = raw.match(/\b(4\d{2}|5\d{2})\b/);
    var httpCode  = httpMatch ? httpMatch[1] : '';
    var fileMatch = raw.match(/File:\s*(\S+\.php)/i);
    var lineMatch = raw.match(/\(Line\s*(\d+)\)/i);
    var fileName  = fileMatch ? fileMatch[1].split('/').pop() : '';
    var lineNum   = lineMatch ? lineMatch[1] : '';
    
    // Intentar extraer el mensaje real del JSON embebido (línea 2)
    var lines = raw.split('\n');
    var msgClean = '';
    
    // Buscar la línea que contiene el JSON (empieza con {)
    for (var i = 0; i < Math.min(lines.length, 5); i++) {
      var line = lines[i].trim();
      if (line.startsWith('{')) {
        try {
          var obj = JSON.parse(line);
          var d = Array.isArray(obj.detalle) ? obj.detalle[0] : null;
          var raw_msg = d ? (typeof d === 'string' ? d : (d.message || '')) : (obj.message || '');
          // Normalizar: quitar valores variables (números, UUIDs, IPs, valores SQL)
          msgClean = raw_msg
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')     // IPs
            .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>') // UUIDs
            .replace(/\b\d{4,}\b/g, '<N>')           // números largos (IDs)
            .replace(/=\s*[\d.]+/g, '= <V>')          // valores en comparaciones SQL
            .replace(/in\s*\([^)]+\)/gi, 'in (<V>)')  // IN (1,2,3)
            .replace(/'[^']{8,}'/g, "'<V>'")             // strings largos en SQL
            .trim();
          break;
        } catch(e) {
          // JSON malformado — usar la línea sin valores
          msgClean = line.slice(0, 100).replace(/\b\d{4,}\b/g, '<N>').trim();
          break;
        }
      }
    }
    
    // Si no hay JSON, usar la primera línea limpia (sin "Code: 0 - File:")
    if (!msgClean) {
      var firstMeaningful = '';
      for (var j = 0; j < lines.length; j++) {
        var l = lines[j].trim();
        if (l && !l.match(/^Code:\s*\d+/i) && !l.match(/^#\d+/) && !l.match(/^\/var\/www/)) {
          firstMeaningful = l
            .replace(/^\d{3}\s+/, '')                 // quitar HTTP code al inicio
            .replace(/\b\d{4,}\b/g, '<N>')           // normalizar IDs
            .replace(/=\s*[\d.]+/g, '= <V>')
            .trim();
          break;
        }
      }
      // Cortar stack trace inline antes de #0
            if (firstMeaningful.indexOf(' #0 ') > 0) firstMeaningful = firstMeaningful.slice(0, firstMeaningful.indexOf(' #0 ')).trim();
            msgClean = firstMeaningful || lines[0].replace(/ #0[\s\S]*$/, '').replace(/\b\d{4,}\b/g,'<N>').trim().slice(0, 150);
    }
    
    // Key final: HTTP + mensaje normalizado + archivo:linea
    // Esto garantiza que flows con el mismo error estructural se agrupen juntos
    var key = (httpCode ? 'HTTP ' + httpCode + ' — ' : '') 
            + msgClean 
            + (fileName ? ' [' + fileName + (lineNum ? ':' + lineNum : '') + ']' : '');
    
    return key.trim() || '⚠ Error desconocido';
  }


  function renderAdfPreview(adf) {
    var preview = document.getElementById('fm-jira-desc-preview');
    var textarea = document.getElementById('fm-jira-desc');
    if (!preview || !adf || typeof adf !== 'object') return;
    var html = adfToHtml(adf.content || []);
    preview.innerHTML = html;
    if (textarea) textarea.style.display = 'none';
    preview.style.display = 'block';
  }

  function adfToHtml(nodes) {
    if (!nodes) return '';
    return nodes.map(function(n) {
      if (!n) return '';
      var c = adfToHtml(n.content);
      if (n.type === 'panel') {
        var colors = {error:'#ff5630',warning:'#ff8b00',info:'#0052cc',success:'#36b37e'};
        var bg = {error:'rgba(255,86,48,.1)',warning:'rgba(255,139,0,.1)',info:'rgba(0,82,204,.1)',success:'rgba(54,179,126,.1)'};
        var pt = n.attrs && n.attrs.panelType || 'info';
        return '<div style="border-left:3px solid '+(colors[pt]||'#888')+';background:'+(bg[pt]||'rgba(255,255,255,.05)')+';padding:8px 10px;margin:4px 0;border-radius:0 4px 4px 0">'+c+'</div>';
      }
      if (n.type === 'expand') {
        return '<details style="margin:4px 0"><summary style="cursor:pointer;color:#7c8494;font-size:11px">'+(n.attrs&&n.attrs.title||'Ver más')+'</summary><div style="padding:4px 0 0 8px">'+c+'</div></details>';
      }
      if (n.type === 'heading') return '<h'+(n.attrs&&n.attrs.level||2)+' style="margin:6px 0 2px;color:#e0e4ed">'+c+'</h'+(n.attrs&&n.attrs.level||2)+'>';
      if (n.type === 'paragraph') return '<p style="margin:3px 0">'+c+'</p>';
      if (n.type === 'rule') return '<hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:6px 0">';
      if (n.type === 'bulletList') return '<ul style="margin:2px 0;padding-left:16px">'+c+'</ul>';
      if (n.type === 'listItem') return '<li>'+c+'</li>';
      if (n.type === 'table') return '<table style="border-collapse:collapse;width:100%;font-size:10px">'+c+'</table>';
      if (n.type === 'tableRow') return '<tr>'+c+'</tr>';
      if (n.type === 'tableHeader') return '<th style="border:1px solid rgba(255,255,255,.15);padding:3px 6px;background:rgba(255,255,255,.08);text-align:left">'+c+'</th>';
      if (n.type === 'tableCell') return '<td style="border:1px solid rgba(255,255,255,.1);padding:3px 6px">'+c+'</td>';
      if (n.type === 'codeBlock') return '<pre style="background:rgba(0,0,0,.3);padding:6px;border-radius:4px;font-size:9px;overflow-x:auto;max-height:100px">'+c+'</pre>';
      if (n.type === 'text') {
        var t = (n.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        var marks = n.marks || [];
        marks.forEach(function(m) {
          if (m.type === 'strong') t = '<strong>'+t+'</strong>';
          if (m.type === 'link') t = '<a href="'+(m.attrs&&m.attrs.href||'#')+'" style="color:#6c63ff" target="_blank">'+t+'</a>';
        });
        return t;
      }
      if (n.type === 'emoji') return n.attrs&&n.attrs.shortName ? n.attrs.shortName.replace(':x:','❌').replace(':mag:','🔍').replace(':wave:','👋').replace(':','').replace(':','') : '';
      return c;
    }).join('');
  }

  // ── Sistema de vínculos flow ↔ ticket Jira ──────────────────────────

  function getJiraCfg() {
    try { return JSON.parse(localStorage.getItem('fm_jira_cfg')||'{}'); } catch(e) { return {}; }
  }

  function flowLabel(flowId) { return 'flow-' + flowId; }

  async function jiraReq(path, method, body) {
    const cfg = getJiraCfg();
    if (!cfg.url || !cfg.email || !cfg.token) return null;
    const base = cfg.url.replace(/\/$/, '');
    const auth = btoa(cfg.email + ':' + cfg.token);
    const opts = { method: method||'GET', headers: { 'Authorization': 'Basic '+auth, 'Accept': 'application/json', 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(base + path, opts);
      if (res.status === 204) return { ok: true };
      return await res.json();
    } catch(e) { return null; }
  }

  // Buscar ticket vinculado a un flow por label
  async function findLinkedTicket(flowId) {
    const lbl = flowLabel(flowId);
    const data = await jiraReq('/rest/api/3/issue/picker?query=labels%3D%22' + lbl + '%22&currentProjectId=', 'GET');
    // Usar JQL search para buscar por label
    const jql = encodeURIComponent('labels = "' + lbl + '" ORDER BY created DESC');
    const res = await jiraReq('/rest/api/3/search?jql=' + jql + '&fields=summary,status,resolutiondate&maxResults=1', 'GET');
    if (!res || !res.issues || !res.issues.length) return null;
    const issue = res.issues[0];
    return {
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.name,
      resolutionDate: issue.fields.resolutiondate
    };
  }

  // Vincular ticket a un flow (agrega label al ticket)
  async function linkTicketToFlow(ticketKey, flowId) {
    const lbl = flowLabel(flowId);
    // Leer labels actuales
    const issue = await jiraReq('/rest/api/3/issue/' + ticketKey + '?fields=labels', 'GET');
    if (!issue || !issue.fields) return false;
    const labels = issue.fields.labels || [];
    if (labels.includes(lbl)) return true; // ya vinculado
    const res = await jiraReq('/rest/api/3/issue/' + ticketKey, 'PUT', { fields: { labels: [...labels, lbl] } });
    return res && (res.ok || res.id);
  }

  // Desvincular ticket de un flow (quita el label)
  async function unlinkTicketFromFlow(ticketKey, flowId) {
    const lbl = flowLabel(flowId);
    const issue = await jiraReq('/rest/api/3/issue/' + ticketKey + '?fields=labels', 'GET');
    if (!issue || !issue.fields) return false;
    const labels = (issue.fields.labels || []).filter(l => l !== lbl);
    const res = await jiraReq('/rest/api/3/issue/' + ticketKey, 'PUT', { fields: { labels } });
    return res && (res.ok || res.id);
  }

  // Vincular ticket a múltiples flows (para grupos)
  async function linkTicketToFlows(ticketKey, flowIds) {
    // Leer labels actuales UNA vez
    const issue = await jiraReq('/rest/api/3/issue/' + ticketKey + '?fields=labels', 'GET');
    if (!issue || !issue.fields) return false;
    const existing = issue.fields.labels || [];
    const toAdd = flowIds.map(flowLabel).filter(l => !existing.includes(l));
    if (!toAdd.length) return true;
    const res = await jiraReq('/rest/api/3/issue/' + ticketKey, 'PUT', { fields: { labels: [...existing, ...toAdd] } });
    return res && (res.ok || res.id);
  }

  // Chequear y limpiar tickets Done > 7 días (se corre al cargar)
  async function autoCleanExpiredLinks(flows) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const errFlows = flows.filter(f => f.status === 'error' && f.linkedTicket);
    for (const f of errFlows) {
      const t = f.linkedTicket;
      if (t.statusCategory === 'Done' && t.resolutionDate) {
        const resolvedAt = new Date(t.resolutionDate).getTime();
        if ((now - resolvedAt) > sevenDays) {
          await unlinkTicketFromFlow(t.key, f.id);
          f.linkedTicket = null;
          f.linkedTicketLoaded = false;
        }
      }
    }
  }

  // Cargar ticket vinculado para un flow
  async function loadLinkedTicket(f) {
    if (f.linkedTicketLoaded) return;
    f.linkedTicketLoaded = true;
    f.linkedTicket = await findLinkedTicket(f.id);
  }

  // Modal de vinculación manual
  function openLinkModal(flowId, currentTicket) {
    const existing = document.getElementById('fm-link-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'fm-link-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:100001;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:#1a1d23;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:24px;width:380px;font-family:sans-serif">
        <div style="font-size:14px;font-weight:600;color:#e0e4ed;margin-bottom:16px">🔗 Vincular ticket al flow #${flowId}</div>
        ${currentTicket ? `<div style="font-size:11px;color:#7c8494;margin-bottom:12px">Ticket actual: <span style="color:#6c63ff">${currentTicket.key}</span> — ${currentTicket.status}</div>` : ''}
        <div style="font-size:11px;color:#7c8494;margin-bottom:6px">Número de ticket (ej: OPS-1234 o GS-567)</div>
        <input id="fm-link-input" type="text" placeholder="OPS-1234" value="${currentTicket ? currentTicket.key : ''}"
          style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:8px 10px;color:#e0e4ed;font-size:13px;outline:none;margin-bottom:16px">
        <div style="display:flex;gap:8px;justify-content:flex-end">
          ${currentTicket ? `<button onclick="unlinkFlow('${flowId}','${currentTicket.key}')" style="background:rgba(255,59,48,.15);border:1px solid rgba(255,59,48,.3);color:#ff3b30;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px">Desvincular</button>` : ''}
          <button onclick="document.getElementById('fm-link-modal').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#7c8494;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button>
          <button onclick="saveLinkManual('${flowId}')" style="background:#6c63ff;border:none;color:#fff;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px">Vincular</button>
        </div>
        <div id="fm-link-msg" style="font-size:11px;color:#7c8494;margin-top:10px;min-height:16px"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('fm-link-input').focus();
  }

  async function saveLinkManual(flowId) {
    const val = (document.getElementById('fm-link-input')?.value||'').trim().toUpperCase();
    const msg = document.getElementById('fm-link-msg');
    if (!val) { if(msg) msg.textContent = 'Ingresá un número de ticket'; return; }
    if (msg) msg.textContent = 'Vinculando...';
    const ok = await linkTicketToFlow(val, flowId);
    if (ok) {
      if (msg) msg.style.color = '#34c759';
      if (msg) msg.textContent = '✓ Ticket vinculado correctamente';
      // Actualizar el flow en memoria
      const f = allFlows.find(x => String(x.id) === String(flowId));
      if (f) { f.linkedTicketLoaded = false; await loadLinkedTicket(f); }
      setTimeout(() => { document.getElementById('fm-link-modal')?.remove(); renderList(); }, 1000);
    } else {
      if (msg) msg.style.color = '#ff3b30';
      if (msg) msg.textContent = '✗ Error — verificá el número de ticket';
    }
  }

  async function unlinkFlow(flowId, ticketKey) {
    const msg = document.getElementById('fm-link-msg');
    if (msg) msg.textContent = 'Desvinculando...';
    const ok = await unlinkTicketFromFlow(ticketKey, flowId);
    if (ok) {
      const f = allFlows.find(x => String(x.id) === String(flowId));
      if (f) { f.linkedTicket = null; f.linkedTicketLoaded = true; }
      document.getElementById('fm-link-modal')?.remove();
      renderList();
    } else {
      if (msg) msg.style.color = '#ff3b30';
      if (msg) msg.textContent = '✗ Error al desvincular';
    }
  }

  // Badge HTML de ticket vinculado
  function ticketBadgeHtml(ticket, flowId) {
    if (!ticket) {
      return `<span onclick="openLinkModal('${flowId}',null)" title="Vincular ticket" style="cursor:pointer;font-size:10px;color:#7c8494;background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.1);border-radius:4px;padding:2px 6px;margin-left:6px">🔗 vincular</span>`;
    }
    const colors = { 'To Do':'#7c8494', 'In Progress':'#f0a500', 'Done':'#34c759', 'Closed':'#34c759', 'Resolved':'#34c759' };
    const color = colors[ticket.status] || '#7c8494';
    return `<span onclick="openLinkModal('${flowId}',${JSON.stringify(ticket).replace(/"/g,'&quot;')})" title="Click para gestionar vínculo" style="cursor:pointer;font-size:10px;color:${color};background:rgba(255,255,255,.05);border:1px solid ${color}44;border-radius:4px;padding:2px 6px;margin-left:6px">🎫 ${ticket.key} · ${ticket.status}</span>`;
  }


  // ═══════════════════════════════════════════════════════════
  // TICKET LINK MODULE — Vinculación de tickets Jira a flows
  // Clave storage: "tl:{flowId}:{execId}" → {ticket, linkedAt}
  // ═══════════════════════════════════════════════════════════
  function tlKey(flowId, execId) { return 'tl:' + flowId + ':' + (execId||'0'); }
  function tlGet(flowId, execId) { try { var raw=localStorage.getItem(tlKey(flowId,execId)); return raw?JSON.parse(raw):null; } catch(e){return null;} }
  function tlSet(flowId, execId, ticketKey) { try { localStorage.setItem(tlKey(flowId,execId), JSON.stringify({ticket:ticketKey,linkedAt:Date.now()})); } catch(e){} }
  function tlRemove(flowId, execId) { try { localStorage.removeItem(tlKey(flowId,execId)); } catch(e){} }

  var _tlCache = {};
  async function tlStatus(ticketKey) {
    var now = Date.now();
    if (_tlCache[ticketKey] && now - _tlCache[ticketKey].ts < 5*60*1000) return _tlCache[ticketKey].data;
    try {
      var data = await jiraReq('/issue/' + ticketKey + '?fields=status,summary', 'GET');
      if (!data||!data.fields) return null;
      var cat = ((data.fields.status||{}).statusCategory||{}).key||'new';
      var result = { key:ticketKey, statusName:(data.fields.status||{}).name||'', statusCat:cat, summary:(data.fields.summary||'').slice(0,80) };
      _tlCache[ticketKey] = { ts:now, data:result };
      return result;
    } catch(e){ return null; }
  }

  function tlColor(cat) { return cat==='done'?'#36b37e':cat==='indeterminate'?'#0052cc':'#7c8494'; }
  function tlIcon(cat)  { return cat==='done'?'✓':cat==='indeterminate'?'⟳':'○'; }

  async function tlAutoClean() {
    try {
      var keys=[]; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.startsWith('tl:'))keys.push(k);}
      var week=7*24*60*60*1000;
      for(var j=0;j<keys.length;j++){
        var rec=JSON.parse(localStorage.getItem(keys[j])||'null');
        if(!rec||!rec.ticket||Date.now()-rec.linkedAt<week) continue;
        var st=await tlStatus(rec.ticket);
        if(st&&st.statusCat==='done') localStorage.removeItem(keys[j]);
      }
    } catch(e){}
  }

  async function tlCheckDupes(flows) {
    var dupes=[];
    for(var i=0;i<flows.length;i++){
      var f=flows[i], rec=tlGet(f.id, f.executionId||'0');
      if(!rec||!rec.ticket) continue;
      var st=await tlStatus(rec.ticket);
      if(st&&st.statusCat==='done'){ tlRemove(f.id,f.executionId||'0'); continue; }
      dupes.push({flow:f, ticket:rec.ticket, status:st});
    }
    return dupes;
  }

  function tlDupeModal(dupes, onOk, onCancel) {
    var cfg=getJiraCfg(), base=cfg.url?cfg.url.replace(/\/$/, ''):'';
    var rows=dupes.slice(0,5).map(function(d){
      var col=tlColor(d.status?d.status.statusCat:'new'), icon=tlIcon(d.status?d.status.statusCat:'new');
      var fname=d.flow.name.split('|').pop().trim().replace(/^\[GPS\]\s*>\s*/i,'').slice(0,38);
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
        +'<span style="font-size:12px;color:#c8ccd4">'+fname+'</span>'
        +'<a href="'+base+'/browse/'+d.ticket+'" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:5px;background:'+col+'18;border:1px solid '+col+'40;border-radius:20px;padding:3px 10px;text-decoration:none;font-size:11px;font-weight:600;color:'+col+'">'
        +'<span>'+icon+'</span><span>'+d.ticket+'</span>'
        +(d.status?'<span style="color:#7c8494;font-weight:400">·&nbsp;'+d.status.statusName+'</span>':'')
        +'</a></div>';
    }).join('')+(dupes.length>5?'<div style="font-size:10px;color:#7c8494;margin-top:6px">...y '+(dupes.length-5)+' más</div>':'');
    var el=document.createElement('div');
    el.id='fm-tl-dupe-overlay';
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:10010;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    el.innerHTML='<div style="background:#16181f;border:1px solid rgba(255,165,0,.25);border-radius:14px;padding:26px 28px;width:460px;max-width:92vw;box-shadow:0 24px 60px rgba(0,0,0,.7)">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
      +'<div style="background:rgba(255,165,0,.15);border-radius:10px;padding:10px;font-size:22px;line-height:1">⚠️</div>'
      +'<div><div style="font-size:15px;font-weight:700;color:#e0e4ed">Tickets ya vinculados</div>'
      +'<div style="font-size:12px;color:#7c8494;margin-top:3px">'+dupes.length+' flow'+(dupes.length>1?'s tienen':'tiene')+' un ticket activo para este error</div>'
      +'</div></div>'
      +'<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 14px;margin-bottom:16px">'+rows+'</div>'
      +'<div style="font-size:12px;color:#7c8494;margin-bottom:16px">¿Querés crear un ticket nuevo de todas formas?</div>'
      +'<div style="display:flex;gap:10px;justify-content:flex-end">'
      +'<button id="fm-tl-dupe-cancel" style="padding:8px 20px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#c8ccd4;font-size:13px;cursor:pointer">Cancelar</button>'
      +'<button id="fm-tl-dupe-ok" style="padding:8px 20px;border-radius:8px;border:none;background:#6c63ff;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Crear igual</button>'
      +'</div></div>';
    document.body.appendChild(el);
    document.getElementById('fm-tl-dupe-cancel').onclick=function(){el.remove();if(onCancel)onCancel();};
    document.getElementById('fm-tl-dupe-ok').onclick=function(){el.remove();if(onOk)onOk();};
    el.onclick=function(e){if(e.target===el){el.remove();if(onCancel)onCancel();}};
  }

  async function tlRenderBadge(flowId, execId, container) {
    if(!container) return;
    container.querySelectorAll('.fm-tl-badge,.fm-tl-link-btn').forEach(function(e){e.remove();});
    var rec=tlGet(flowId, execId);
    if(!rec||!rec.ticket){
      var btn=document.createElement('button');
      btn.className='fm-tl-link-btn';
      btn.style.cssText='background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:3px 8px;font-size:10px;color:#7c8494;cursor:pointer;margin-left:6px;transition:all .15s;vertical-align:middle';
      btn.title='Vincular ticket de Jira';
      btn.innerHTML='🎫 <span style="font-size:10px;opacity:.7">+</span>';
      btn.onmouseover=function(){this.style.background='rgba(108,99,255,.2)';this.style.borderColor='rgba(108,99,255,.5)';this.style.color='#a09cf7';};
      btn.onmouseout=function(){this.style.background='rgba(255,255,255,.05)';this.style.borderColor='rgba(255,255,255,.1)';this.style.color='#7c8494';};
      btn.onclick=function(e){e.stopPropagation();tlManualModal(flowId,execId,container);};
      container.appendChild(btn);
      return;
    }
    var st=await tlStatus(rec.ticket);
    var col=tlColor(st?st.statusCat:'new'), icon=tlIcon(st?st.statusCat:'new');
    var sName=st?st.statusName:'...';
    var cfg=getJiraCfg(), base=cfg.url?cfg.url.replace(/\/$/, ''):'';
    var badge=document.createElement('span');
    badge.className='fm-tl-badge';
    badge.style.cssText='display:inline-flex;align-items:center;gap:5px;background:'+col+'16;border:1px solid '+col+'35;border-radius:20px;padding:3px 10px 3px 8px;font-size:11px;margin-left:6px;cursor:default;transition:background .15s;vertical-align:middle';
    badge.innerHTML='<span style="color:'+col+';font-size:10px;font-weight:700">'+icon+'</span>'
      +'<a href="'+base+'/browse/'+rec.ticket+'" target="_blank" onclick="event.stopPropagation()" style="color:'+col+';font-weight:700;text-decoration:none;font-size:11px">'+rec.ticket+'</a>'
      +'<span style="color:#7c8494;font-size:10px">·&nbsp;'+sName+'</span>'
      +'<span class="fm-tl-unlink" style="color:#7c8494;font-size:12px;margin-left:3px;opacity:0;transition:opacity .15s;cursor:pointer;line-height:1" title="Desvincular">×</span>';
    badge.onmouseover=function(){this.style.background=col+'28';this.querySelector('.fm-tl-unlink').style.opacity='1';};
    badge.onmouseout=function(){this.style.background=col+'16';this.querySelector('.fm-tl-unlink').style.opacity='0';};
    badge.querySelector('.fm-tl-unlink').onclick=function(e){
      e.stopPropagation();e.preventDefault();
      tlRemove(flowId,execId);
      tlRenderBadge(flowId,execId,container);
    };
    container.appendChild(badge);
  }

  function tlManualModal(flowId, execId, container) {
    var el=document.createElement('div');
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:10010;display:flex;align-items:center;justify-content:center';
    el.innerHTML='<div style="background:#16181f;border:1px solid rgba(108,99,255,.3);border-radius:14px;padding:24px 26px;width:330px;box-shadow:0 20px 60px rgba(0,0,0,.7)">'
      +'<div style="font-size:14px;font-weight:700;color:#e0e4ed;margin-bottom:5px">🎫 Vincular ticket</div>'
      +'<div style="font-size:11px;color:#7c8494;margin-bottom:14px">Ingresá el número del ticket</div>'
      +'<input id="fm-tl-input" placeholder="Ej: OPS-123 o GS-456" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:9px 13px;font-size:13px;color:#e0e4ed;outline:none;transition:border .15s" />'
      +'<div id="fm-tl-msg" style="font-size:11px;min-height:18px;margin-top:7px;color:#7c8494"></div>'
      +'<div style="display:flex;gap:9px;justify-content:flex-end;margin-top:14px">'
      +'<button id="fm-tl-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#c8ccd4;font-size:12px;cursor:pointer">Cancelar</button>'
      +'<button id="fm-tl-save" style="padding:8px 18px;border-radius:8px;border:none;background:#6c63ff;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Vincular</button>'
      +'</div></div>';
    document.body.appendChild(el);
    var inp=document.getElementById('fm-tl-input'), msg=document.getElementById('fm-tl-msg');
    setTimeout(function(){inp.focus();},50);
    inp.onfocus=function(){this.style.borderColor='rgba(108,99,255,.6)';};
    inp.onblur=function(){this.style.borderColor='rgba(255,255,255,.15)';};
    document.getElementById('fm-tl-cancel').onclick=function(){el.remove();};
    document.getElementById('fm-tl-save').onclick=async function(){
      var val=inp.value.trim().toUpperCase();
      if(!val.match(/^[A-Z]+-\d+$/)){msg.style.color='#ff5630';msg.textContent='Formato inválido. Ej: OPS-123';return;}
      msg.style.color='#7c8494';msg.textContent='Verificando...';
      var st=await tlStatus(val);
      if(!st){msg.style.color='#ff5630';msg.textContent='Ticket no encontrado o sin acceso';return;}
      if(st.statusCat==='done'){msg.style.color='#ff8b00';msg.textContent='El ticket '+val+' ya está finalizado';return;}
      tlSet(flowId,execId,val);
      el.remove();
      tlRenderBadge(flowId,execId,container);
    };
    inp.onkeydown=function(e){if(e.key==='Enter')document.getElementById('fm-tl-save').click();};
    el.onclick=function(e){if(e.target===el)el.remove();};
  }

  function getJiraCfg() { try{return JSON.parse(localStorage.getItem('fm_jira_cfg')||localStorage.getItem('fm_jira_config')||'{}');}catch(e){return {};} }


  // Recorrer todos los elementos de flow en el DOM y agregar badges
  function tlRefreshBadges() {
    // Cada flow en el DOM tiene data-flow-id o está en un elemento con el ID como data-attribute
    // Buscar todos los elementos que representan flows
    var items = document.querySelectorAll('[data-flow-id]');
    items.forEach(function(item) {
      var flowId = item.getAttribute('data-flow-id');
      var execId = item.getAttribute('data-exec-id') || '0';
      if (!flowId) return;
      // Buscar el contenedor para el badge (la fila del flow)
      var badgeContainer = item.querySelector('.fm-tl-badge-wrap') || item;
      tlRenderBadge(flowId, execId, badgeContainer);
    });
  }

  function renderList() {
    const flows=getFiltered(), container=document.getElementById('fm-list-content');
    if(!allFlows.length)return;
    if(!flows.length){container.innerHTML=`<div class="fm-empty"><div class="fm-empty-icon">○</div><div class="fm-empty-text">Sin resultados</div></div>`;document.getElementById('fm-pagination').innerHTML='';updateSelBar();return;}
    if(groupByError)renderByError(flows,container);
    else if(groupMode)renderGrouped(flows,container);
    else renderPaged(flows,container);
    updateSelBar();
    // Mostrar badges de tickets vinculados
    setTimeout(tlRefreshBadges, 100);
  }

  function renderPaged(flows,container) {
    const total=flows.length,totalPages=Math.ceil(total/PAGE_SIZE);
    currentPage=Math.min(currentPage,totalPages);
    const start=(currentPage-1)*PAGE_SIZE;
    container.innerHTML=flows.slice(start,start+PAGE_SIZE).map(rowHtml).join('');
    renderPagination(currentPage,totalPages,total);
  }

  function renderGrouped(flows,container) {
    const groups={};
    for(const f of flows){const m=f.name?.match(/(?:\[.*?\]\s*>?\s*)([^|]+)/);const key=m?m[1].trim():'Otros';if(!groups[key])groups[key]=[];groups[key].push(f);}
    container.innerHTML=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length).map(([key,gf])=>`<div class="fm-group-hdr"><span class="fm-group-name">${esc(key)}</span><span class="fm-group-cnt">${gf.length}</span></div>`+gf.map(rowHtml).join('')).join('');
    document.getElementById('fm-pagination').innerHTML=`<div class="fm-pag-info">${flows.length} flows</div>`;
  }

  function renderByError(flows,container) {
    const withError=flows.filter(f=>f.state!=='ok'), groups={};
    for(const f of withError){const key=f.errors||'__timeout__';if(!groups[key])groups[key]={key,label:f.errors||(f.state==='timeout'?'Timeout — sin mensaje':'Sin detalle'),flows:[],isErr:f.state==='error'};groups[key].flows.push(f);}
    const sorted=Object.values(groups).sort((a,b)=>b.flows.length-a.flows.length);
    let html=`<div class="fm-summary-bar"><span class="fm-summary-label">📊 ${sorted.length} tipo${sorted.length!==1?'s':''} de error</span><span class="fm-summary-sub">${withError.length} flows con fallo</span></div>`;
    for(const g of sorted){
      const exp=expandedGroups.has(g.key),allSel=g.flows.every(f=>selectedIds.has(f.id));
      const clr=g.isErr?'#f05050':'#f5923e',bg=g.isErr?'rgba(240,80,80,.06)':'rgba(245,146,62,.06)';
      html+=`<div><div class="fm-error-group-hdr" data-action="toggle-err-group" data-group-key="${esc(g.key)}" style="background:${bg}">
        <div class="fm-error-group-top">
          <span class="fm-error-group-chevron" style="color:${clr}">${exp?'▼':'▶'}</span>
          <span class="fm-error-group-msg" style="color:${clr}">${esc(cleanErrorLabel(g.label))}</span>
        </div>
        <div class="fm-error-group-meta">
          <span class="fm-group-cnt" style="color:${clr};font-weight:600">${g.flows.length} flow${g.flows.length!==1?'s':''}</span>
          <button class="fm-chip" style="font-size:9px;padding:2px 7px" data-action="sel-group" data-group-key="${esc(g.key)}">${allSel?'☑️':'☐'} sel.</button>
          <button class="fm-chip" style="font-size:9px;padding:2px 7px;background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.35);color:#8c85ff" data-action="ticket-group" data-group-key="${esc(g.key)}">🎫 ticket</button>
        </div>
      </div>${exp?`<div class="fm-error-group-body">${g.flows.map(rowHtml).join('')}</div>`:''}</div>`;
    }
    container.innerHTML=html;
    document.getElementById('fm-pagination').innerHTML=`<div class="fm-pag-info">${withError.length} con fallo · ${sorted.length} tipos</div>`;
  }

  function toggleErrGroup(key) { if(expandedGroups.has(key))expandedGroups.delete(key);else expandedGroups.add(key); renderList(); }

  function renderPagination(page,total,count) {
    const pag=document.getElementById('fm-pagination');
    if(total<=1){pag.innerHTML=`<div class="fm-pag-info">${count} flows</div>`;return;}
    let html=`<div class="fm-pag-wrap"><button class="fm-pag-btn" data-action="page" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>`;
    const pages=[];
    for(let p=1;p<=total;p++){if(p===1||p===total||Math.abs(p-page)<=2)pages.push(p);else if(pages[pages.length-1]!=='...')pages.push('...');}
    for(const p of pages){if(p==='...')html+=`<span class="fm-pag-ellipsis">…</span>`;else html+=`<button class="fm-pag-btn ${p===page?'fm-pag-active':''}" data-action="page" data-page="${p}">${p}</button>`;}
    html+=`<button class="fm-pag-btn" data-action="page" data-page="${page+1}" ${page===total?'disabled':''}>›</button><span class="fm-pag-info">${count} flows</span></div>`;
    pag.innerHTML=html;
  }

  function goToPage(p){if(isNaN(p)||p<1)return;currentPage=p;renderList();document.getElementById('fm-list-panel').scrollTop=0;}

  function rowHtml(f) {
    const sel=selectedIds.has(f.id)?'fm-selected':'',st=f.state==='error'?'fm-state-error':f.state==='timeout'?'fm-state-timeout':'fm-state-ok';
    const pc=f.state==='error'?'fm-pill-error':f.state==='timeout'?'fm-pill-timeout':'fm-pill-ok';
    const icon=f.state==='error'?'❌':f.state==='timeout'?'⏳':'✅', pl=f.state==='error'?'ERROR':f.state==='timeout'?'TIMEOUT':'OK';
    return `<div class="fm-row ${sel} ${st}" data-id="${f.id}" data-action="row-click"><div class="fm-check"><span class="fm-check-mark">✓</span></div><div class="fm-info"><div class="fm-name" title="${esc(f.name)}">${esc(f.name)}</div><div class="fm-desc">${esc(f.desc||'')}</div><div class="fm-meta"><span class="fm-id">#${f.id}</span><span class="fm-pill ${pc}">${icon} ${pl}</span><span class="fm-time">${f.lastRun}</span></div></div></div>`;
  }

  function esc(s){if(!s)return '';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function handleClick(id) {
    const flow = allFlows.find(f => f.id === id); if (!flow) return;
    const was = selectedIds.has(id);
    was ? selectedIds.delete(id) : selectedIds.add(id);
    document.querySelectorAll(`[data-id="${id}"]`).forEach(row => {
      row.classList.toggle('fm-selected', selectedIds.has(id));
    });
    if (was) clearDetail(); else showDetail(flow);
    updateSelBar();
  }

  function clearDetail(){const p=document.getElementById('fm-detail');p.innerHTML=`<div class="fm-no-sel"><div class="fm-no-sel-icon">◷</div><div class="fm-no-sel-text">Seleccióná un flow<br>para ver el detalle</div></div>`;}
  function selectAllVisible(){const flows=getFiltered(),allSel=flows.every(f=>selectedIds.has(f.id));flows.forEach(f=>allSel?selectedIds.delete(f.id):selectedIds.add(f.id));renderList();}
  function selectGroup(k) {
    const gFlows = allFlows.filter(f => (f.errors || 'Sin detalle') === k);
    const allSel = gFlows.every(f => selectedIds.has(f.id));
    if (allSel) { gFlows.forEach(f => selectedIds.delete(f.id)); }
    else        { gFlows.forEach(f => selectedIds.add(f.id)); }
    renderList();
  }
  function ticketGroup(k) {
    const gFlows = allFlows.filter(f => (f.errors || 'Sin detalle') === k);
    gFlows.forEach(f => selectedIds.add(f.id));
    renderList();
    openJiraModal(k, gFlows);
  }
  function clearSelection(){selectedIds.clear();renderList();}
  function updateSelBar(){const bar=document.getElementById('fm-sel-bar');if(!bar)return;bar.classList.toggle('fm-visible',selectedIds.size>0);const c=document.getElementById('fm-sel-count');if(c)c.textContent=selectedIds.size;}

  async function showDetail(flow) {
    const panel=document.getElementById('fm-detail');
    const pc=flow.state==='error'?'fm-pill-error':flow.state==='timeout'?'fm-pill-timeout':'fm-pill-ok';
    const hdrCls=flow.state==='error'?'fm-hdr-error':flow.state==='timeout'?'fm-hdr-timeout':'fm-hdr-ok';
    const stIcon=flow.state==='error'?'❌':flow.state==='timeout'?'⏳':'✅';
    panel.innerHTML=`<div class="fm-detail-hdr ${hdrCls}"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:14px">${stIcon}</span><span class="fm-pill ${pc}">${flow.state.toUpperCase()}</span></div><div class="fm-detail-title">${esc(flow.name)}</div><div class="fm-detail-sub">#${flow.id} · cargando...</div></div><div style="padding:20px;color:#555b66;font-size:11px;text-align:center">◎ Cargando...</div>`;
    await loadFlowDetail(flow);
    const jsonStr=flow.jsonData?JSON.stringify(flow.jsonData,null,2):'pipeline: null';
    const errorBox=flow.state==='timeout'?'fm-timeout-box':'fm-error-box';
    const hasErr=!!(flow.errors||flow.state==='timeout');
    panel.innerHTML=`
      <div class="fm-detail-hdr ${hdrCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:14px">${stIcon}</span><span class="fm-pill ${pc}">${flow.state.toUpperCase()}</span></div>
        <div class="fm-detail-title">${esc(flow.name)}</div>
        <div class="fm-detail-sub">#${flow.id} · ${esc(flow.type||'')} · ${esc(flow.freq||'')}</div>
      </div>
      <div class="fm-detail-sec">
        <div class="fm-sec-label">📋 Info</div>
        <div class="fm-dr"><span class="fm-dk">Último run</span><span class="fm-dv">${esc(flow.lastRun||'—')}</span></div>
        ${flow.executionId?`<div class="fm-dr"><span class="fm-dk">Execution ID</span><span class="fm-dv">#${flow.executionId}</span></div>`:''}
      </div>
      ${hasErr?`<div class="fm-detail-sec"><div class="fm-sec-label">${flow.state==='timeout'?'⏳ Timeout':'🔴 Error'}</div><div class="${errorBox}">${esc(flow.errors||'Timeout — sin mensaje')}</div>${flow.processName?`<div style="font-size:9px;color:#555b66;margin-top:4px;font-family:monospace">⚙️ ${esc(flow.processName)}</div>`:''  }${flow.errorsRaw&&flow.errorsRaw!==flow.errors?`<details style="margin-top:7px"><summary style="font-size:9px;color:#555b66;cursor:pointer;list-style:none;padding:3px 0">▶ stack trace</summary><div class="fm-json-box" style="margin-top:5px;color:#555b66">${esc(flow.errorsRaw)}</div></details>`:''}</div>`:''}  
      ${flow.state==='error'&&flow.errors?`<div class="fm-detail-sec" id="fm-diag-${flow.id}"><div class="fm-sec-label" style="display:flex;justify-content:space-between;align-items:center"><span>🤖 Pre-diagnóstico IA</span><span id="fm-diag-quota" style="font-size:9px;color:#434a57"></span></div><div id="fm-diag-body-${flow.id}">${typeof flow.diagnosis==='string'&&flow.diagnosis.length>0?`<div id="fm-diag-text-${flow.id}" style="font-size:11px;color:#c8d0e0;line-height:1.7;background:rgba(108,99,255,.06);border:1px solid rgba(108,99,255,.18);border-radius:7px;padding:12px"></div>`:`<button style="width:100%;padding:8px;background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.3);border-radius:7px;color:#8c85ff;font-size:12px;cursor:pointer" data-action="run-diagnosis" data-flow-id="${flow.id}">🤖 Generar diagnóstico</button>`}</div></div>`:''}
      <div class="fm-detail-sec">
        <div class="fm-sec-label" style="display:flex;justify-content:space-between;align-items:center"><span>🔎 JSON response</span><div style="display:flex;gap:8px;align-items:center"><button id="fm-json-toggle" style="font-size:8px;padding:2px 7px;border-radius:7px;border:1px solid rgba(255,255,255,.11);background:transparent;color:#7c8494;cursor:pointer" onclick="const b=document.getElementById('fm-json-box-main');const t=document.getElementById('fm-json-toggle');b.classList.toggle('fm-expanded');t.textContent=b.classList.contains('fm-expanded')?'⬆ colapsar':'⬇ expandir'">⬇ expandir</button><a href="${BASE}/flows/${flow.id}" target="_blank" style="color:#6c63ff;font-size:9px;text-decoration:none">🔗 vecfleet ↗</a></div></div>
        <div class="fm-json-box" id="fm-json-box-main">${esc(jsonStr)}</div>
      </div>
      <div class="fm-detail-sec" style="display:flex;flex-direction:column;gap:7px">
        <button class="fm-btn fm-danger" style="width:100%;justify-content:center" data-action="add-jira" data-flow-id="${flow.id}">🎫 Crear ticket Jira</button>
        <a href="${BASE}/flows/${flow.id}" target="_blank" class="fm-btn" style="width:100%;justify-content:center;text-decoration:none">🔗 Ver en VecFleet</a>
      </div>`;
    if(flow.state==='error'&&typeof flow.diagnosis==='string'&&flow.diagnosis.length>0){const el=document.getElementById(`fm-diag-text-${flow.id}`);if(el){el.innerHTML=flow.diagnosis.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+\.\s)/gm,'<br><span style="color:#6c63ff;font-weight:600">$1</span>').trim();}}
    if(flow.state==='error')updateDiagQuota();
  }

  const DAILY_LIMIT=20;
  function getDiagUsage(){const today=new Date().toISOString().slice(0,10);try{const d=JSON.parse(localStorage.getItem('fm_diag_usage'));if(d?.date===today)return d.count;}catch(e){}return 0;}
  function incDiagUsage(){const today=new Date().toISOString().slice(0,10);const c=getDiagUsage()+1;localStorage.setItem('fm_diag_usage',JSON.stringify({date:today,count:c}));return c;}
  function updateDiagQuota(){const r=DAILY_LIMIT-getDiagUsage();const el=document.getElementById('fm-diag-quota');if(el){el.textContent=`${r}/${DAILY_LIMIT} hoy`;el.style.color=r<=5?'#f5923e':'#434a57';}}

  function runDiagnosis(flowId) {
    const flow=allFlows.find(f=>f.id===flowId);if(!flow)return;
    if(getDiagUsage()>=DAILY_LIMIT){const el=document.getElementById(`fm-diag-body-${flowId}`);if(el)el.innerHTML=`<div style="font-size:10px;color:#f5923e;padding:6px 0">⚠️ Límite diario alcanzado.</div>`;return;}
    if(typeof flow.diagnosis==='string'&&flow.diagnosis.length>0){const el=document.getElementById(`fm-diag-body-${flowId}`);if(el){el.innerHTML=`<div id="fm-diag-text-${flowId}" style="font-size:11px;color:#c8d0e0;line-height:1.7;background:rgba(108,99,255,.06);border:1px solid rgba(108,99,255,.18);border-radius:7px;padding:12px"></div>`;const t=document.getElementById(`fm-diag-text-${flowId}`);if(t)t.innerHTML=flow.diagnosis.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').trim();}return;}
    const bodyEl=document.getElementById(`fm-diag-body-${flowId}`);if(bodyEl)bodyEl.innerHTML=`<div style="font-size:11px;color:#434a57;padding:4px 0">◌ Analizando con IA...</div>`;
    generateDiagnosis(flow).then(diag=>{
      flow.diagnosis=diag||false;if(diag)incDiagUsage();updateDiagQuota();
      const el=document.getElementById(`fm-diag-body-${flowId}`);
      if(el){if(diag){el.innerHTML=`<div style="font-size:11px;color:#c8d0e0;line-height:1.7;background:rgba(108,99,255,.06);border:1px solid rgba(108,99,255,.18);border-radius:7px;padding:12px">${diag.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+\.\s)/gm,'<br><span style="color:#6c63ff;font-weight:600">$1</span>').trim()}</div>`;}else el.innerHTML=`<div style="font-size:10px;color:#434a57;padding:4px 0">No se pudo generar. Verificá la API key.</div>`;}
    });
  }

  async function generateDiagnosis(flow) {
    const errorInfo=flow.errorsRaw||flow.errors||'';if(!errorInfo)return null;
    const prompt=`Sos un experto en sistemas backend Laravel/PHP. Analizá este error y respondé en español con 2 secciones:\n1. **Causa probable** — qué salió mal (1-2 oraciones)\n2. **Impacto** — qué funcionalidad falla\n\nFlow: "${flow.name}"\nError: ${errorInfo.slice(0,800)}\nMáximo 80 palabras total.`;
    return new Promise(resolve=>{
      const t=setTimeout(()=>resolve(null),20000);
      try{chrome.runtime.sendMessage({action:'anthropic',prompt},(resp)=>{clearTimeout(t);if(chrome.runtime.lastError){resolve(null);return;}resolve(resp?.ok?resp.text:null);})}
      catch(e){clearTimeout(t);resolve(null);}
    });
  }

  function getJiraConfig(){try{return JSON.parse(localStorage.getItem('fm_jira_cfg')||'null');}catch(e){return null;}}

  async function jiraFetch(path,options={}) {
    const cfg=getJiraConfig();if(!cfg)throw new Error('Jira no configurado');
    const url=`${cfg.url.replace(/\/$/,'')}/rest/api/3${path}`;
    return new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(new Error('Timeout')),15000);
      chrome.runtime.sendMessage({action:'jira',url,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined,email:cfg.email,token:cfg.token},(resp)=>{
        clearTimeout(t);
        if(chrome.runtime.lastError){reject(new Error(chrome.runtime.lastError.message));return;}
        if(!resp?.ok)reject(new Error(resp?.error||'Error desconocido'));else resolve(resp.data);
      });
    });
  }

  function addAndJira(id){selectedIds.add(id);renderList();openJiraModal();}

  async function openJiraModal(errorKey, groupFlows) {
    if (!errorKey && !selectedIds.size) return;
    const sel = groupFlows || allFlows.filter(f => selectedIds.has(f.id));
    if (!sel.length) return;

    // Contar clientes con regex [CLIENTE] — mismo criterio que generateGroupDesc
    const clients = [...new Set(sel.map(f => {
      const m = f.name.match(/\]\s*>\s*([^|>[\]]+?)\s*\|/);
      return m ? m[1] : null;
    }).filter(Boolean))];

    const title = errorKey
      ? '[Flow Monitor] ' + sel.length + ' flows — ' + clients.length + ' cliente' + (clients.length !== 1 ? 's' : '')
      : '[Flow Monitor] ' + sel.length + ' flows — ' + (clients.length > 0 ? clients.length + ' cliente' + (clients.length !== 1 ? 's' : '') : new Date().toLocaleDateString('es-AR'));

    document.getElementById('fm-jira-title').value = title;
    var _gdResult = errorKey ? await generateGroupDesc(errorKey, sel) : await generateDesc(sel);
        if (_gdResult && typeof _gdResult === 'object' && _gdResult.type === 'doc') {
          window._pendingAdf = _gdResult; setTimeout(function(){
      // Inyectar el preview div si no existe en el DOM
      var ta = document.getElementById("fm-jira-desc");
      if (ta && !document.getElementById("fm-jira-desc-preview")) {
        var prev = document.createElement("div");
        prev.id = "fm-jira-desc-preview";
        prev.style.cssText = "background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:10px;min-height:120px;max-height:260px;overflow-y:auto;font-size:11px;line-height:1.6;color:#c8ccd4";
        ta.parentNode.insertBefore(prev, ta.nextSibling);
        ta.style.display = "none";
      }
      renderAdfPreview(_gdResult);
    }, 50);
          document.getElementById('fm-jira-desc').value = '[Descripcion ADF generada automaticamente - ' + (errorKey ? sel.length + ' flows, ' + new Set(sel.map(f=>{var m=f.name.match(/\]\s*>\s*([^|>[\]]+?)\s*\|/);return m?m[1]:null;}).filter(Boolean)).size + ' entornos' : sel.length + ' flows') + ']';
        } else {
          window._pendingAdf = null;
          document.getElementById('fm-jira-desc').value = _gdResult || '';
        }
    document.getElementById('fm-modal-overlay').classList.add('fm-visible');
    populateJiraModal();
  }
  async function generateAIAnalysis(errorSummary, httpCode, processName, fileName, lineNum, clients, flowsCount) {
    try {
      var prompt = 'Sos especialista en soporte de sistemas GPS y flotas.\nAnalizá este error de producción y escribí 2-3 oraciones de análisis en español, siendo específico con los datos provistos. Sin título ni bullets.\n\nError: '+errorSummary+'\nHTTP: '+(httpCode||'N/A')+'\nProceso: '+(processName||'N/A')+'\nArchivo: '+(fileName||'N/A')+(lineNum?':'+lineNum:'')+'\nEntornos: '+clients.length+' ('+clients.slice(0,5).join(', ')+(clients.length>5?'...':'')+')\nFlows: '+flowsCount;
      var res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:prompt}]})});
      var data = await res.json();
      return data.content&&data.content[0]&&data.content[0].text ? data.content[0].text.trim() : null;
    } catch(e) { return null; }
  }

  async function generateGroupDesc(errorKey, flows) {
    var raw = errorKey.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    var httpMatch = raw.match(/\b(4\d{2}|5\d{2})\b/);
    var fileMatch = raw.match(/File:\s*(\S+\.php)/i);
    var lineMatch = raw.match(/\(Line\s*(\d+)\)/i);
    var httpCode  = httpMatch ? parseInt(httpMatch[1]) : 0;
    var fileName  = fileMatch ? fileMatch[1].split('/').pop() : '';
    var lineNum   = lineMatch ? lineMatch[1] : '';
    // Extraer JSON embebido si existe
    var jsonStart = raw.indexOf('{');
    var fullErrorMsg = '';
    var errorJson    = '';
    var processName  = '';
    if (jsonStart >= 0) {
      try {
        var jsonLine = raw.slice(jsonStart, raw.indexOf('\n', jsonStart) > 0 ? raw.indexOf('\n', jsonStart) : undefined);
        var obj = JSON.parse(jsonLine);
        errorJson = JSON.stringify(obj, null, 2);
        var d = Array.isArray(obj.detalle) ? obj.detalle[0] : null;
        fullErrorMsg = d ? (typeof d === 'string' ? d : (d.message || '')) : (obj.message || '');
        var procs2 = obj.pipeline && obj.pipeline.processes;
        if (procs2 && procs2[0] && procs2[0].name) {
          var pp3 = procs2[0].name.split('\\\\');
          processName = pp3[pp3.length-1] || '';
        }
      } catch(e) {
        errorJson = raw.slice(jsonStart);
      }
    }
    if (!fullErrorMsg) {
      var ap = raw.match(/\)\s+(.+)$/);
      var msg2 = ap ? ap[1].trim() : '';
      msg2 = msg2.replace(/^\d{3}\s+/, '').replace(/\b(\w[\w ]{3,25})\s+\1\b/gi, '$1').trim();
      fullErrorMsg = msg2.split('\n')[0] || raw;
    }
    // errorSummary = primera línea limpia (sin stack trace)
    // errorSummary: mensaje limpio para panel rojo (sin stack trace)
        var errorSummary = (function() {
          var lines = fullErrorMsg.split('\n');
          var first = lines[0].trim();
          // Si empieza con 'Code: N - File:' -> extraer del JSON en línea 2
          if (first.match(/^Code:\s*\d+/i) && lines.length > 1) {
            try {
              var jObj = JSON.parse(lines[1]);
              var det = Array.isArray(jObj.detalle) ? jObj.detalle[0] : null;
              return det ? (typeof det==='string' ? det : (det.message||'')) : (jObj.message||first);
            } catch(e) { return first; }
          }
          // Cortar antes del stack trace (#0, #1, etc.)
          var stackIdx = first.indexOf(' #0 ');
          if (stackIdx > 0) return first.slice(0, stackIdx).trim();
          // Tomar solo la primera oración (hasta el primer punto final o 120 chars)
          var dotIdx = first.search(/\.\s/);
          if (dotIdx > 0 && dotIdx < 200) return first.slice(0, dotIdx+1).trim();
          return first.slice(0, 200).trim();
        })();
    if (!processName && fileMatch) {
      var pp4 = fileMatch[1].match(/Processes\/([^\/]+)\/([^\/\.]+)\.php/i);
      processName = pp4 ? pp4[2] : fileName.replace('.php','');
    }
    var clientSet = new Set(flows.map(function(f) {
      var m = f.name.match(/\]\s*>\s*([^|>[\]]+?)\s*\|/);
      return m ? m[1].trim() : null;
    }).filter(Boolean));
    var clients = [...clientSet];
    var errorType = processName || (fileName ? fileName.replace('.php','') : 'los flows afectados');
    var multi = clients.length > 1;
    var patronCtx = multi
      ? 'El mismo error se registra en ' + clients.length + ' entornos distintos (' + clients.slice(0,3).join(', ') + (clients.length > 3 ? ' y otros' : '') + '), todos con el mismo punto de fallo'
      : 'El error se concentra en el entorno ' + (clients[0] || '');
    var patronLoc = (fileName ? ' (' + fileName + (lineNum ? ':' + lineNum : '') + ')' : '') + '.';
    // Análisis contextual basado en los datos reales del error
        var _multi = clients.length > 1;
        var _scope = _multi
          ? 'afecta a ' + clients.length + ' entornos simultáneamente (' + clients.slice(0,3).join(', ') + (clients.length > 3 ? ' y ' + (clients.length-3) + ' más' : '') + ')'
          : 'afecta al entorno ' + (clients[0] || '');
        // Tipo de flow — parte después del último |
        var _fTypes = [...new Set(flows.map(function(f){
          var p = f.name.split('|'); return p[p.length-1].trim().replace(/^\[GPS\]\s*>\s*/i,'').trim();
        }))].filter(Boolean);
        var _opName = _fTypes.length ? _fTypes.slice(0,2).join(' / ') : (processName || 'el proceso');
        // Construir análisis específico según tipo de error
        var analisis = '';
        if (errorSummary.match(/SQLSTATE|Column not found|Table.*doesn|Unknown column/i)) {
          var _col = errorSummary.match(/Unknown column '([^']+)'/)?.[1] || '';
          var _tbl = errorSummary.match(/from [`'"]?(\w+)[`'"]?\s+where/i)?.[1] || '';
          analisis = 'El proceso ' + (processName||'') + ' falla al ejecutar ' + _opName + ' con un error de esquema de base de datos'
            + (_col ? ' — la columna \'' + _col + '\' no existe' : '')
            + (_tbl ? ' en la tabla \'' + _tbl + '\'' : '')
            + '. ' + (_multi ? 'Al ' + _scope + ', se descarta un problema puntual de datos y apunta a una migración pendiente o un cambio de esquema no aplicado en producción.' : 'Verificar si hay migraciones pendientes en el entorno afectado.');
        } else if (errorSummary.match(/Gateway Timeout|504|upstream|timed out/i)) {
          analisis = 'El proceso ' + (processName||'') + ' no recibe respuesta del servicio externo al ejecutar ' + _opName
            + (lineNum ? ' (línea ' + lineNum + ' de ' + fileName + ')' : '')
            + '. ' + (_multi ? 'Al ' + _scope + ', no parece un problema de configuración por tenant sino una degradación o caída del servicio externo.' : 'Verificar disponibilidad del endpoint en el entorno ' + (clients[0]||'') + '.');
        } else if (errorSummary.match(/401|403|Unauthorized|Forbidden|token|credential/i)) {
          analisis = 'El proceso ' + (processName||'') + ' recibe un error de autenticación al ejecutar ' + _opName
            + '. ' + (_multi ? 'Al ' + _scope + ', podría indicar que las credenciales o tokens de acceso vencieron o fueron revocados a nivel global.' : 'Verificar credenciales configuradas para el entorno ' + (clients[0]||'') + '.');
        } else if (errorSummary.match(/Connection refused|ECONNREFUSED|connect ETIMEDOUT/i)) {
          analisis = 'El proceso ' + (processName||'') + ' no puede establecer conexión al ejecutar ' + _opName
            + '. ' + (_multi ? 'Al ' + _scope + ', apunta a una caída o inaccesibilidad del servicio de destino.' : 'Verificar conectividad en ' + (clients[0]||'') + '.');
        } else if (httpCode >= 500) {
          analisis = 'El proceso ' + (processName||'') + ' recibe un error interno del servidor (HTTP ' + httpCode + ') al ejecutar ' + _opName
            + (fileName ? ' en ' + fileName + (lineNum?':'+lineNum:'') : '')
            + '. ' + (_multi ? 'Al ' + _scope + ', el problema no es aislado.' : '');
        } else {
          analisis = 'El proceso ' + (processName||'') + ' falla al ejecutar ' + _opName
            + (fileName ? ' en ' + fileName + (lineNum?':'+lineNum:'') : '')
            + '. ' + (_multi ? 'El error ' + _scope + '.' : 'Afecta al entorno ' + (clients[0]||'') + '.');
        }
        var txt=function(t,m){var n={type:'text',text:String(t)};if(m)n.marks=m;return n;};
    var bold=function(t){return txt(t,[{type:'strong'}]);};
    var para=function(){return{type:'paragraph',content:[].slice.call(arguments)};};
    var h3=function(){return{type:'heading',attrs:{level:3},content:[].slice.call(arguments)};};
    var rule=function(){return{type:'rule'};};
    var emoji=function(name){return{type:'emoji',attrs:{shortName:':'+name+':',text:''}};};
    var panel=function(type,nodes){return{type:'panel',attrs:{panelType:type},content:nodes};};
    var expand=function(title,nodes){return{type:'expand',attrs:{title:title},content:nodes};};
    var blist=function(items){return{type:'bulletList',content:items.map(function(c){return{type:'listItem',content:[para(c)]};})};};
    var tbl=function(rows){return{type:'table',attrs:{isNumberColumnEnabled:false,layout:'default'},content:rows};};
    var tr=function(cells){return{type:'tableRow',content:cells};};
    var th=function(t){return{type:'tableHeader',attrs:{},content:[para(bold(t))]};};
    var td=function(){return{type:'tableCell',attrs:{},content:[para.apply(null,[].slice.call(arguments))]};};
    var link=function(t,url){return txt(t,[{type:'link',attrs:{href:url}}]);};
    var codeBlock=function(t){return{type:'codeBlock',attrs:{language:'json'},content:[{type:'text',text:t}]};};
    var content = [];
    // Panel rojo — solo resumen ejecutivo
    content.push(panel('error',[
      para(emoji('x'), txt(' '), bold('HTTP '+(httpCode||'?'))),
      para(txt(errorSummary)),
      para(bold('Proceso : '), txt(processName||'N/A')),
      para(bold('Archivo : '), txt(fileName||'N/A'), txt(lineNum ? '  |  Linea : '+lineNum : '')),
      para(bold('Impacto : '), txt(flows.length+' flows en '+clients.length+' entorno'+(clients.length!==1?'s':'')+' \u2014 '+clients.join(', ')))
    ]));
    // Panel azul — análisis
    content.push(panel('info',[
      para(emoji('mag'), txt(' '), bold('Analisis preliminar')),
      para(txt(analisis))
    ]));
    // Contexto
    content.push(rule());
    content.push(h3(emoji('wave'), txt(' Contexto')));
    content.push(para(txt('Buenas Team, les compartimos el error detectado en el proceso '), bold(errorType), txt(' en '+clients.length+' entorno'+(clients.length!==1?'s':'')+':')));
    content.push(blist(clients.map(function(c){ return txt(c); })));
    // Flows colapsables
    content.push(rule());
    var flowRows = [tr([th('Entorno'), th('Flow'), th('Link')])];
    flows.forEach(function(f) {
      var cl=(function(){var m=f.name.match(/\]\s*>\s*([^|>[\]]+?)\s*\|/);return m?m[1].trim():'';})();
      var tp=f.name.split('|').pop().trim().replace(/^\[GPS\]\s*>\s*/i,'').trim();
      flowRows.push(tr([td(txt(cl||f.id)),td(txt(tp)),td(link('Ver flow','https://flow.vecfleet.io/flows/'+f.id))]));
    });
    content.push(expand('Ver flows afectados ('+flows.length+')',[tbl(flowRows)]));
    // JSON Response colapsable — error completo
    var jsonContent = errorJson || fullErrorMsg;
    var jsonParas = jsonContent.split('\n').map(function(line){ return para(txt(line||'\u00a0')); });
    content.push(expand('JSON Response', jsonParas.length ? jsonParas : [para(txt(jsonContent))]));
    content.push(rule());
    content.push(para(txt('Flow Monitor - '+new Date().toLocaleString('es-AR'))));
    return {version:1, type:'doc', content:content};
  }

  async function generateDesc(flows) {
    if (!flows || !flows.length) return {version:1,type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Sin flows seleccionados.'}]}]};
    // Si hay un solo flow con error, usar generateGroupDesc con su errorKey
    // Si hay múltiples flows sin agrupar, usar el primer flow con error
    var errFlow = flows.find(function(f){ return f.errors && f.errors !== 'Sin detalle'; }) || flows[0];
    var errorKey = errFlow ? (errFlow.errors || 'Sin detalle') : 'Sin detalle';
    // Delegar a generateGroupDesc — mismo formato rico para individual y grupal
    return await generateGroupDesc(errorKey, flows);
  }

  function closeJiraModal(){document.getElementById('fm-modal-overlay').classList.remove('fm-visible');}

  function openJiraConfig(){const ov=document.getElementById('fm-jira-cfg-overlay');ov.style.display='flex';ov.style.pointerEvents='all';const cfg=getJiraConfig();if(cfg){document.getElementById('fm-cfg-url').value=cfg.url||'';document.getElementById('fm-cfg-email').value=cfg.email||'';document.getElementById('fm-cfg-token').value=cfg.token||'';}}
  function closeJiraCfg(){const ov=document.getElementById('fm-jira-cfg-overlay');ov.style.display='none';ov.style.pointerEvents='none';}

  async function saveJiraConfig() {
    const url=document.getElementById('fm-cfg-url').value.trim(),email=document.getElementById('fm-cfg-email').value.trim(),token=document.getElementById('fm-cfg-token').value.trim();
    const status=document.getElementById('fm-cfg-status'),btn=document.getElementById('fm-cfg-save-btn');
    if(!url||!email||!token){status.textContent='⚠️ Completá todos los campos';status.style.color='#f5923e';return;}
    btn.disabled=true;status.textContent='⟳ Verificando...';status.style.color='#9ca3af';
    localStorage.setItem('fm_jira_cfg',JSON.stringify({url,email,token}));
    try{const data=await jiraFetch('/myself');status.textContent=`✓ Conectado como ${data.displayName}`;status.style.color='#3ecf82';updateConfigStatus();setTimeout(()=>{closeJiraCfg();if(document.getElementById('fm-modal-overlay').classList.contains('fm-visible'))populateJiraModal();},1500);}
    catch(e){status.textContent=`✕ Error: ${e.message}`;status.style.color='#f05050';}
    btn.disabled=false;
  }

  async function populateJiraModal() {
    const projSel=document.getElementById('fm-jira-project'),typeSel=document.getElementById('fm-jira-issuetype'),status=document.getElementById('fm-jira-status');
    const cfg=getJiraConfig();if(!cfg){projSel.innerHTML='<option value="">⚙️ Configurá Jira primero</option>';status.textContent='Configurá Jira para continuar';return;}
    projSel.innerHTML='<option value="">Cargando proyectos...</option>';
    try{
      const data=await jiraFetch('/project/search?maxResults=50&orderBy=name');
      projSel.innerHTML=(data.values||[]).map(p=>`<option value="${p.key}">${p.key} — ${p.name}</option>`).join('');
      const ops=[...projSel.options].find(o=>o.value==='OPS');if(ops)projSel.value='OPS';
      status.textContent=`${(data.values||[]).length} proyectos cargados`;
      await updateIssueTypes();
      projSel.onchange=()=>updateIssueTypes();
    }catch(e){projSel.innerHTML='<option value="">Error</option>';status.textContent=`✕ ${e.message}`;status.style.color='#f05050';}
  }

  async function updateIssueTypes() {
    const projSel=document.getElementById('fm-jira-project'),typeSel=document.getElementById('fm-jira-issuetype');
    if(!projSel.value)return;
    typeSel.innerHTML='<option value="">Cargando...</option>';
    try{const data=await jiraFetch(`/project/${projSel.value}`);typeSel.innerHTML=(data.issueTypes||[]).filter(t=>!t.subtask).map(t=>`<option value="${t.id}">${t.name}</option>`).join('');const pref=['Bug','Task','Tarea','Incidente'];for(const p of pref){const o=[...typeSel.options].find(o=>o.text===p);if(o){typeSel.value=o.value;break;}}}
    catch(e){typeSel.innerHTML='<option value="">Error</option>';}
  }

  async function createJiraTicket() {
    const projKey=document.getElementById('fm-jira-project').value,typeId=document.getElementById('fm-jira-issuetype').value,title=document.getElementById('fm-jira-title').value.trim(),desc=window._pendingAdf||document.getElementById('fm-jira-desc').value.trim(),priority=document.getElementById('fm-jira-priority').value;
    const status=document.getElementById('fm-jira-status'),btn=document.getElementById('fm-create-btn');
    if(!projKey||!typeId||!title){status.textContent='⚠️ Completá proyecto, tipo y asunto';status.style.color='#f5923e';return;}
    btn.disabled=true;btn.textContent='⟳ Creando...';status.textContent='';
    const adfDesc = (desc && typeof desc === 'object' && desc.type === 'doc') ? desc : {version:1,type:'doc',content:(desc||'').split('\n\n').filter(Boolean).map(p=>({type:'paragraph',content:[{type:'text',text:p.replace(/\n/g,' ')}]}))};    try{
      const data=await jiraFetch('/issue',{method:'POST',body:JSON.stringify({fields:{project:{key:projKey},issuetype:{id:typeId},summary:title,description:adfDesc,priority:{name:priority}}})});
      const cfg=getJiraConfig(),url=`${cfg.url.replace(/\/$/,'')}/browse/${data.key}`;
      // Auto-vincular flows al ticket creado usando el nuevo módulo tlSet
      allFlows.filter(f=>selectedIds.has(f.id)).forEach(f=>{ tlSet(f.id, f.executionId||'0', data.key); });
      // Actualizar badges en la lista
      setTimeout(function(){ renderList(); }, 200);
      status.innerHTML=`✓ Ticket <a href="${url}" target="_blank" style="color:#6c63ff;font-weight:600">${data.key}</a> creado`;status.style.color='#3ecf82';btn.textContent='✓ Creado';
      setTimeout(()=>{closeJiraModal();btn.disabled=false;btn.textContent='Crear ticket →';},3000);
    }catch(e){status.textContent=`✕ Error: ${e.message}`;status.style.color='#f05050';btn.disabled=false;btn.textContent='Crear ticket →';}
  }

  function openAiConfig(){const ov=document.getElementById('fm-ai-cfg-overlay');ov.style.display='flex';ov.style.pointerEvents='all';}
  function closeAiCfg(){const ov=document.getElementById('fm-ai-cfg-overlay');ov.style.display='none';ov.style.pointerEvents='none';}

  async function saveAiConfig() {
    const key=document.getElementById('fm-ai-key-input').value.trim(),status=document.getElementById('fm-ai-cfg-status'),btn=document.getElementById('fm-ai-cfg-save-btn');
    if(!key||!key.startsWith('sk-ant-')){status.textContent='⚠️ La key debe empezar con sk-ant-';status.style.color='#f5923e';return;}
    btn.disabled=true;status.textContent='⟳ Verificando...';status.style.color='#9ca3af';
    await new Promise(r=>chrome.runtime.sendMessage({action:'saveAnthropicKey',key},r));
    const result=await new Promise(resolve=>{const t=setTimeout(()=>resolve(null),15000);chrome.runtime.sendMessage({action:'anthropic',prompt:'Di solo: ok'},(resp)=>{clearTimeout(t);resolve(resp);});});
    btn.disabled=false;
    if(result?.ok){localStorage.setItem('fm_ai_key_cached','1');status.textContent='✓ API key válida';status.style.color='#3ecf82';updateConfigStatus();setTimeout(closeAiCfg,1500);}
    else{localStorage.removeItem('fm_ai_key_cached');status.textContent=`✕ Error: ${result?.error||'Key inválida'}`;status.style.color='#f05050';}
  }

  function updateConfigStatus() {
    const cfg=getJiraConfig(),jiraOk=!!(cfg?.url&&cfg?.email&&cfg?.token);
    const ji=document.getElementById('fm-cfg-jira-icon'),jl=document.getElementById('fm-cfg-jira-status');
    if(ji){ji.textContent=jiraOk?'✅':'⚙️';jl.textContent=jiraOk?'configurado':'no configurado';jl.style.color=jiraOk?'#3ecf82':'#f05050';}
    const aiOk=!!localStorage.getItem('fm_ai_key_cached');
    const ai=document.getElementById('fm-cfg-ai-icon'),al=document.getElementById('fm-cfg-ai-status');
    if(ai){ai.textContent=aiOk?'✅':'⚙️';al.textContent=aiOk?'configurado':'no configurado';al.style.color=aiOk?'#3ecf82':'#f05050';}
    try{chrome.runtime.sendMessage({action:'getAnthropicKey'},(resp)=>{if(chrome.runtime.lastError)return;const has=!!resp?.key;if(has)localStorage.setItem('fm_ai_key_cached','1');else localStorage.removeItem('fm_ai_key_cached');if(ai){ai.textContent=has?'✅':'⚙️';al.textContent=has?'configurado':'no configurado';al.style.color=has?'#3ecf82':'#f05050';}});}catch(e){}
  }

  function showLoading(msg){document.getElementById('fm-list-content').innerHTML=`<div class="fm-loading-bar"></div><div class="fm-empty"><div class="fm-empty-icon" id="fm-loading-icon">◎</div><div class="fm-empty-text" id="fm-loading-msg">${msg||'Cargando...'}</div></div>`;document.getElementById('fm-pagination').innerHTML='';}
  function setMsg(icon,msg){const i=document.getElementById('fm-loading-icon'),m=document.getElementById('fm-loading-msg');if(i)i.textContent=icon;if(m)m.textContent=msg;}
  function showError(msg){document.getElementById('fm-list-content').innerHTML=`<div class="fm-empty"><div class="fm-empty-icon" style="color:#ff4d4d">✕</div><div class="fm-empty-text" style="color:#ff4d4d">Error: ${esc(msg)}<br><br><span style="color:#555b66">Asegurate de estar en<br>flow.vecfleet.io y logueado</span></div></div>`;}

  chrome.runtime.onMessage.addListener((msg) => { if(msg.action==='toggle')togglePanel(); });
  injectStyles();
  buildPanel();
})();
