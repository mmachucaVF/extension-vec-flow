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
      #fm-panel{position:fixed;top:0;right:0;width:760px;height:100vh;z-index:999999;display:flex;flex-direction:column;background:#0a0c10;border-left:1px solid rgba(255,255,255,.06);font-family:system-ui,sans-serif;font-size:13px;color:#eceef2;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);box-shadow:-12px 0 48px rgba(0,0,0,.6);pointer-events:none}
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
      #fm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
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
      #fm-main{display:grid;grid-template-columns:1fr 1fr;flex:1;overflow:hidden;min-height:0}
      #fm-list-panel{display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06);overflow:hidden;min-height:0}
      #fm-toolbar{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.06);background:#111318;display:flex;align-items:center;gap:6px;flex-shrink:0;position:sticky;top:0;z-index:5}
      .fm-search{flex:1;background:#181b22;border:1px solid rgba(255,255,255,.06);color:#eceef2;font-size:11px;padding:5px 9px;border-radius:7px;outline:none}
      .fm-search:focus{border-color:#6c63ff}
      .fm-chip{font-size:9px;padding:4px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.06);background:transparent;color:#7c8494;cursor:pointer;transition:all .15s;white-space:nowrap}
      .fm-chip:hover{color:#eceef2;border-color:rgba(255,255,255,.18)}
      .fm-chip.fm-active{background:rgba(108,99,255,.12);border-color:rgba(108,99,255,.3);color:#6c63ff}
      #fm-list-content{flex:1;overflow-y:auto}
      .fm-row{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;gap:8px;cursor:pointer;transition:background .1s}
      .fm-row:hover{background:#111318}
      .fm-row.fm-state-error{border-left:2px solid #f05050}
      .fm-row.fm-state-timeout{border-left:2px solid #f5923e}
      .fm-row.fm-state-ok{border-left:2px solid #3ecf82}
      .fm-row.fm-selected{background:rgba(108,99,255,.1)!important}
      .fm-check{width:14px;height:14px;border:1px solid rgba(255,255,255,.11);border-radius:3px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center}
      .fm-row.fm-selected .fm-check{background:#6c63ff;border-color:#6c63ff}
      .fm-check-mark{display:none;color:#fff;font-size:9px}
      .fm-row.fm-selected .fm-check-mark{display:block}
      .fm-info{flex:1;min-width:0}
      .fm-name{font-size:11px;font-weight:500;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
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
      #fm-detail{overflow-y:auto;background:#111318;display:flex;flex-direction:column}
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
        'sel-group':          () => selectGroup(el.dataset.groupKey),
        'ticket-group':       () => ticketGroup(el.dataset.groupKey),
        'toggle-err-group':   () => toggleErrGroup(el.dataset.groupKey),
        'run-diagnosis':      () => runDiagnosis(el.dataset.flowId),
      }[a] || (() => {}))();
    });
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('fm-panel');
    const btn   = document.getElementById('fm-toggle-btn');
    panel.classList.toggle('fm-open', panelOpen);
    document.body.style.marginRight  = panelOpen ? '760px' : '0px';
    document.body.style.transition   = 'margin-right 0.28s cubic-bezier(0.4,0,0.2,1)';
    if (btn) btn.style.right = panelOpen ? '760px' : '0px';
    if (panelOpen && allFlows.length === 0) loadFlows();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function loadFlows() {
    const btn = document.getElementById('fm-refresh-btn');
    btn.textContent = '↻ Cargando...'; btn.disabled = true;
    allFlows = []; currentPage = 1;
    try {
      showLoading('Leyendo estadísticas...');
      parseStatsFromDOM();
      const { errors, timeouts, ok } = statsData;
      setMsg('◎', `Stats: ${errors} errores · ${timeouts} timeouts · ${ok} OK`);
      await sleep(300);
      const errorFlows   = await loadStateFromDOM('error',   errors,   Math.ceil(errors/50));
      const timeoutFlows = await loadStateFromDOM('timeout', timeouts, Math.ceil(timeouts/50));
      const okFlows      = await loadStateFromDOM('ok',      ok,       Math.ceil(ok/50));
      allFlows = [...errorFlows, ...timeoutFlows, ...okFlows];
      const globalSeen = new Set();
      allFlows = allFlows.filter(f => { if (globalSeen.has(f.id)) return false; globalSeen.add(f.id); return true; });
      document.getElementById('fm-date').textContent = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      navigateDashboard({ state: null, page: 1 });
      await waitForFlows(3000);
      renderList();
      setMsg('✓', `Listo: ${allFlows.length} flows cargados`);
      loadErrorDetailsInBackground([...errorFlows, ...timeoutFlows]);
    } catch(e) { console.error('[FlowMonitor]', e); showError(e.message); }
    btn.textContent = '🔄 Actualizar'; btn.disabled = false;
  }

  async function loadErrorDetailsInBackground(flows) {
    const BATCH = 5;
    for (let i = 0; i < flows.length; i += BATCH) {
      const batch = flows.slice(i, i + BATCH);
      await Promise.all(batch.map(f => loadFlowDetail(f)));
      if (groupByError) renderList();
    }
    if (groupByError) renderList();
  }

  async function loadStateFromDOM(state, total, totalPages) {
    if (total === 0) return [];
    const flows = [], seen = new Set(), label = state==='error'?'errores':state==='timeout'?'timeouts':'OK';
    for (let page = 1; page <= totalPages; page++) {
      setMsg('◎', `Cargando ${label}... p.${page}/${totalPages}`);
      const pf = await fetchFlowsFromPage(state, page);
      let added = 0;
      for (const f of pf) {
        if (!seen.has(f.id)) { seen.add(f.id); flows.push(f); added++; }
      }
      if (added === 0) break;
    }
    return flows;
  }

  async function fetchFlowsFromPage(state, page) {
    const p = new URLSearchParams({ search:'', environment_id:'', status:'active', sort_by:'last_run', sort_dir:'desc', per_page:50, page:page||1 });
    if (state==='error')   p.set('states[]','error');
    if (state==='timeout') p.set('states[]','timeout');
    if (state==='ok')      p.set('states[]','ok');
    try {
      const r = await fetch(`/dashboard?${p.toString()}`, { credentials:'include' });
      const html = await r.text();
      return parseFlowsFromHTML(html, state);
    } catch(e) { return []; }
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
  function toggleGroupByError() { groupByError=!groupByError; groupMode=false; document.getElementById('fm-group-err-btn').classList.toggle('fm-active',groupByError); document.getElementById('fm-group-btn').classList.remove('fm-active'); currentPage=1; renderList(); }

  function getFiltered() {
    const q=document.getElementById('fm-search')?.value.toLowerCase()||'';
    let flows=activeFilter==='all'?allFlows:allFlows.filter(f=>f.state===activeFilter);
    if(q)flows=flows.filter(f=>f.name?.toLowerCase().includes(q)||f.id?.includes(q)||f.errors?.toLowerCase().includes(q));
    return flows;
  }

  function renderList() {
    const flows=getFiltered(), container=document.getElementById('fm-list-content');
    if(!allFlows.length)return;
    if(!flows.length){container.innerHTML=`<div class="fm-empty"><div class="fm-empty-icon">○</div><div class="fm-empty-text">Sin resultados</div></div>`;document.getElementById('fm-pagination').innerHTML='';updateSelBar();return;}
    if(groupByError)renderByError(flows,container);
    else if(groupMode)renderGrouped(flows,container);
    else renderPaged(flows,container);
    updateSelBar();
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
          <span class="fm-error-group-msg" style="color:${clr}">${esc(g.label)}</span>
        </div>
        <div class="fm-error-group-meta" onclick="event.stopPropagation()">
          <span class="fm-group-cnt" style="color:${clr};font-weight:600">${g.flows.length} flow${g.flows.length!==1?'s':''}</span>
          <button class="fm-chip" style="font-size:9px;padding:2px 7px" data-action="sel-group" data-group-key="${esc(g.label)}">${allSel?'☑️':'☐'} sel.</button>
          <button class="fm-chip" style="font-size:9px;padding:2px 7px;background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.35);color:#8c85ff" data-action="ticket-group" data-group-key="${esc(g.label)}">🎫 ticket</button>
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
  function selectGroup(k){const flows=allFlows.filter(f=>(f.errors||'Sin detalle'===k)),allSel=flows.every(f=>selectedIds.has(f.id));flows.forEach(f=>allSel?selectedIds.delete(f.id):selectedIds.add(f.id));renderList();}
  function ticketGroup(k){allFlows.filter(f=>(f.errors||'Sin detalle')===k).forEach(f=>selectedIds.add(f.id));renderList();openJiraModal();}
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

  function openJiraModal() {
    if(!selectedIds.size)return;
    const sel=allFlows.filter(f=>selectedIds.has(f.id));
    const fnames=[...new Set(sel.map(f=>{const m=f.name?.match(/\|\s*(.+)$/);return m?m[1].trim():f.name;}))];
    const clients=[...new Set(sel.map(f=>{const m=f.name?.match(/>\s*([^|>]+?)\s*\|/);return m?m[1].trim():null;}).filter(Boolean))];
    const fname=fnames.length===1?fnames[0]:`${sel.length} flows`;
    const title=clients.length<=2?`[Flow Monitor] ${fname} — ${clients.join(', ')||new Date().toLocaleDateString('es-AR')}`:`[Flow Monitor] ${fname} — ${clients.length} clientes`;
    document.getElementById('fm-modal-title').textContent='Crear ticket en Jira';
    document.getElementById('fm-jira-title').value=title;
    document.getElementById('fm-jira-desc').value=generateDesc(sel);
    document.getElementById('fm-modal-overlay').classList.add('fm-visible');
    populateJiraModal();
  }

  function generateDesc(flows) {
    const today=new Date().toLocaleString('es-AR');
    const clients=[...new Set(flows.map(f=>{const m=f.name?.match(/>\s*([^|>]+?)\s*\|/);return m?m[1].trim():null;}).filter(Boolean))];
    const fname=(()=>{const n=[...new Set(flows.map(f=>{const m=f.name?.match(/\|\s*(.+)$/);return m?m[1].trim():f.name;}))];return n.length===1?n[0]:`${n.length} flows`;})();
    let d=`h2. 🚨 Flow con fallo: ${fname}\n*Generado:* ${today}\n`;
    if(clients.length)d+=`*Clientes (${clients.length}):* ${clients.join(', ')}\n`;
    d+=`\n----\n\n`;
    const mainError=flows.find(f=>f.errors)?.errors||'';
    if(mainError)d+=`h3. ❌ Error\n\n{code}\n${mainError}\n{code}\n\n----\n\n`;
    d+=`h3. 📋 Flows afectados (${flows.length})\n\n||ID||Cliente||Flow||Último run||\n`;
    for(const f of flows){const c=f.name?.match(/>\s*([^|>]+?)\s*\|/)?.[1]?.trim()||'—',fn=f.name?.match(/\|\s*(.+)$/)?.[1]?.trim()||f.name;d+=`|[#${f.id}|${BASE}/flows/${f.id}]|${c}|${fn}|${f.lastRun}|\n`;}
    d+=`\n----\n\nh3. 🔗 Links\n\n`;
    for(const f of flows)d+=`* [${f.name}|${BASE}/flows/${f.id}]\n`;
    d+=`\n_Generado desde Flow Monitor Extension_`;
    return d;
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
    const projKey=document.getElementById('fm-jira-project').value,typeId=document.getElementById('fm-jira-issuetype').value,title=document.getElementById('fm-jira-title').value.trim(),desc=document.getElementById('fm-jira-desc').value.trim(),priority=document.getElementById('fm-jira-priority').value;
    const status=document.getElementById('fm-jira-status'),btn=document.getElementById('fm-create-btn');
    if(!projKey||!typeId||!title){status.textContent='⚠️ Completá proyecto, tipo y asunto';status.style.color='#f5923e';return;}
    btn.disabled=true;btn.textContent='⟳ Creando...';status.textContent='';
    const adfDesc={version:1,type:'doc',content:desc.split('\n\n').filter(Boolean).map(p=>({type:'paragraph',content:[{type:'text',text:p.replace(/\n/g,' ')}]}))};    try{
      const data=await jiraFetch('/issue',{method:'POST',body:JSON.stringify({fields:{project:{key:projKey},issuetype:{id:typeId},summary:title,description:adfDesc,priority:{name:priority}}})});
      const cfg=getJiraConfig(),url=`${cfg.url.replace(/\/$/,'')}/browse/${data.key}`;
      allFlows.filter(f=>selectedIds.has(f.id)).forEach(f=>{const all=JSON.parse(localStorage.getItem('fm_linked_tickets')||'{}');if(!all[f.id])all[f.id]=[];if(!all[f.id].find(t=>t.key===data.key))all[f.id].unshift({key:data.key,url,title,linkedAt:new Date().toISOString()});localStorage.setItem('fm_linked_tickets',JSON.stringify(all));});
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
