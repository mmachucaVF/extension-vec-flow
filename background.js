// Toggle panel al clickear el ícono
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('flow.vecfleet.io')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  } else {
    chrome.tabs.create({ url: 'https://flow.vecfleet.io/dashboard' });
  }
});

// Proxy general para todas las APIs externas
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── API KEY: Anthropic ──────────────────────────────────────────
  if (msg.action === 'saveAnthropicKey') {
    chrome.storage.local.set({ anthropicKey: msg.key }, () =>
      sendResponse({ ok: true })
    );
    return true;
  }

  if (msg.action === 'getAnthropicKey') {
    chrome.storage.local.get(['anthropicKey'], (r) =>
      sendResponse({ key: r.anthropicKey || null })
    );
    return true;
  }

  // ── ANTHROPIC API ───────────────────────────────────────────────
  if (msg.action === 'anthropic') {
    chrome.storage.local.get(['anthropicKey'], (r) => {
      const key = r.anthropicKey;
      if (!key) { sendResponse({ ok: false, error: 'no_key' }); return; }

      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': key,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: msg.prompt }]
        })
      })
      .then(r => r.json())
      .then(d => {
        if (d.error) sendResponse({ ok: false, error: d.error.message });
        else sendResponse({ ok: true, text: d.content?.[0]?.text || '' });
      })
      .catch(e => sendResponse({ ok: false, error: e.message }));
    });
    return true;
  }

  // ── JIRA API ────────────────────────────────────────────────────
  if (msg.action === 'jira') {
    const { url, method, body, email, token } = msg;
    const auth = 'Basic ' + btoa(`${email}:${token}`);

    fetch(url, {
      method: method || 'GET',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    .then(r => r.json().then(d => ({ status: r.status, ok: r.ok, data: d })))
    .then(r => {
      if (!r.ok) sendResponse({ ok: false, status: r.status, error: r.data?.errorMessages?.[0] || r.data?.message || `HTTP ${r.status}`, data: r.data });
      else sendResponse({ ok: true, data: r.data });
    })
    .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

});

console.log('[FlowMonitor BG] Service worker activo');
