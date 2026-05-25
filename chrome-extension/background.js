// Background service worker — handles all API calls so content script
// doesn't need to worry about CORS or storage.

// Change to 'https://reblet.com' for production
const DEFAULT_BASE = 'http://localhost:3000'

// ── Toolbar icon ──────────────────────────────────────────────
// Draws the reblet logo with pure canvas calls (no SVG blob —
// those don't render in extension service workers).
function drawRebletIcon(size) {
  const canvas = new OffscreenCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const p      = size / 128   // scale factor

  // Dark rounded-rect background
  const r = Math.round(18 * p)
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.arcTo(size, 0,   size, size, r)
  ctx.arcTo(size, size, 0,   size, r)
  ctx.arcTo(0,   size, 0,   0,    r)
  ctx.arcTo(0,   0,    size, 0,    r)
  ctx.closePath()
  ctx.fill()

  // White document body
  const dx = Math.round(39 * p), dy = Math.round(18 * p)
  const dw = Math.round(50 * p), dh = Math.round(68 * p)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(dx, dy, dw, dh)

  // Cream/gold bottom block
  const bx = dx, by = dy + dh
  const bw = dw, bh = Math.round(12 * p)
  ctx.fillStyle = '#e8c99a'
  ctx.fillRect(bx, by, bw, bh)

  // Gold triangle (pencil tip)
  ctx.fillStyle = '#e8c99a'
  ctx.beginPath()
  ctx.moveTo(bx,      by + bh)
  ctx.lineTo(bx + bw, by + bh)
  ctx.lineTo(bx + bw / 2, by + bh + Math.round(22 * p))
  ctx.closePath()
  ctx.fill()

  // Dark triangle cap
  ctx.fillStyle = '#555'
  const tx = bx + bw / 2
  const ty = by + bh + Math.round(22 * p)
  ctx.beginPath()
  ctx.moveTo(tx - Math.round(7 * p), ty - Math.round(8 * p))
  ctx.lineTo(tx + Math.round(7 * p), ty - Math.round(8 * p))
  ctx.lineTo(tx, ty)
  ctx.closePath()
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}

async function setRebletIcon() {
  try {
    const imageData = {}
    for (const size of [16, 32, 48, 128]) imageData[size] = drawRebletIcon(size)
    await chrome.action.setIcon({ imageData })
  } catch { /* fall back to manifest PNG icons */ }
}

chrome.runtime.onInstalled.addListener(setRebletIcon)
self.addEventListener('activate', setRebletIcon)

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
