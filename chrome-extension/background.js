// Background service worker — handles all API calls so content script
// doesn't need to worry about CORS or storage.

const DEFAULT_BASE = 'https://www.reblet.com'

// Toolbar icon: rendered directly from icons/icon128.png via the manifest
// (no runtime canvas override).

async function getConfig() {
  const { apiKey, baseUrl } = await chrome.storage.local.get(['apiKey', 'baseUrl'])
  return { apiKey: apiKey || '', baseUrl: baseUrl || DEFAULT_BASE }
}

async function apiFetch(path, options = {}) {
  const { apiKey, baseUrl } = await getConfig()
  const url = baseUrl + path
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(url, { ...options, headers })
  return res.json().catch(() => ({ error: 'bad response' }))
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (msg.type) {

        case 'GET_CONFIG': {
          const cfg = await getConfig()
          sendResponse({ ok: true, ...cfg })
          break
        }

        case 'VALIDATE_KEY': {
          const { apiKey, baseUrl } = await getConfig()
          const data = await fetch((baseUrl || DEFAULT_BASE) + '/api/extension/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
          }).then(r => r.json()).catch(() => ({ error: 'Network error' }))
          sendResponse(data)
          break
        }

        case 'SAVE_KEY': {
          await chrome.storage.local.set({
            apiKey:  msg.apiKey,
            baseUrl: msg.baseUrl || DEFAULT_BASE,
          })
          sendResponse({ ok: true })
          break
        }

        case 'GET_PROFILE': {
          const { apiKey } = await getConfig()
          if (!apiKey) {
            sendResponse({ error: 'No API key — please connect the extension first.' })
            break
          }
          const data = await apiFetch('/api/extension/profile')
          sendResponse(data)
          break
        }

        case 'TAILOR': {
          const { apiKey } = await getConfig()
          if (!apiKey) {
            // No API key — return empty so content.js uses smartDefault fallbacks
            sendResponse({ answers: [] })
            break
          }
          const data = await apiFetch('/api/extension/tailor', {
            method: 'POST',
            body: JSON.stringify({
              jobTitle:       msg.jobTitle,
              company:        msg.company,
              jobDescription: msg.jobDescription,
              questions:      msg.questions || [],
            }),
          })
          sendResponse(data)
          break
        }

        case 'AI_ANALYZE_STEP': {
          const { apiKey: ak2 } = await getConfig()
          if (!ak2) { sendResponse({ answers: [] }); break }
          const data = await apiFetch('/api/extension/ai-step', {
            method: 'POST',
            body: JSON.stringify({
              jobTitle:    msg.jobTitle,
              company:     msg.company,
              stepFields:  msg.stepFields  || [],
              errorFields: msg.errorFields || [],
            }),
          })
          sendResponse(data)
          break
        }

        case 'TRACK': {
          const { apiKey } = await getConfig()
          if (!apiKey) {
            sendResponse({ ok: true, skipped: true })
            break
          }
          const data = await apiFetch('/api/extension/track', {
            method: 'POST',
            body: JSON.stringify({
              jobTitle:       msg.jobTitle,
              company:        msg.company,
              jobUrl:         msg.jobUrl,
              jobDescription: msg.jobDescription,
            }),
          })
          sendResponse(data)
          break
        }

        case 'LOOKUP_QUESTIONS': {
          const { apiKey } = await getConfig()
          if (!apiKey) { sendResponse({ answers: [] }); break }
          const data = await apiFetch('/api/extension/questions/lookup', {
            method: 'POST',
            body: JSON.stringify({ labels: msg.labels || [] }),
          })
          sendResponse(data)
          break
        }

        case 'SAVE_QUESTIONS': {
          const { apiKey } = await getConfig()
          if (!apiKey) { sendResponse({ ok: true }); break }
          await apiFetch('/api/extension/questions/save', {
            method: 'POST',
            body: JSON.stringify({ questions: msg.questions || [] }),
          })
          sendResponse({ ok: true })
          break
        }

        default:
          sendResponse({ error: 'Unknown message type' })
      }
    } catch (e) {
      console.error('[QR background]', e)
      sendResponse({ error: e.message })
    }
  })()
  return true // keep channel open for async response
})
