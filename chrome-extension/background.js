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

  // ── Dark rounded-rect background ──────────────────────────────────────
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

  // ── Pencil pointing DOWN ───────────────────────────────────────────────
  const px  = Math.round(44 * p)    // left edge of pencil
  const pw  = Math.round(40 * p)    // pencil width
  const prx = px + pw               // right edge
  const cx  = px + pw / 2           // horizontal centre

  // Eraser cap (dark grey) — top
  const capT = Math.round(14 * p), capB = Math.round(22 * p)
  ctx.fillStyle = '#555555'
  ctx.fillRect(px, capT, pw, capB - capT)

  // Ferrule (silver ring)
  const ferB = capB + Math.round(6 * p)
  ctx.fillStyle = '#aaaaaa'
  ctx.fillRect(px, capB, pw, ferB - capB)

  // White pencil body
  const bodyB = Math.round(80 * p)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(px, ferB, pw, bodyB - ferB)

  // Wood section (cream)
  const woodB = Math.round(94 * p)
  ctx.fillStyle = '#e8c99a'
  ctx.fillRect(px, bodyB, pw, woodB - bodyB)

  // Tapered wood triangle — tip pointing DOWN
  const tipY = Math.round(116 * p)
  ctx.fillStyle = '#e8c99a'
  ctx.beginPath()
  ctx.moveTo(px,  woodB)
  ctx.lineTo(prx, woodB)
  ctx.lineTo(cx,  tipY)
  ctx.closePath()
  ctx.fill()

  // Graphite inner tip
  const gW    = Math.round(8 * p)
  const gTopY = tipY - Math.round(18 * p)
  ctx.fillStyle = '#444444'
  ctx.beginPath()
  ctx.moveTo(cx - gW, gTopY)
  ctx.lineTo(cx + gW, gTopY)
  ctx.lineTo(cx,      tipY)
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
