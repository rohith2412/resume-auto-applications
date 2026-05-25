const $ = id => document.getElementById(id)

// Keep in sync with background.js DEFAULT_BASE
const DASHBOARD_URL = 'http://localhost:3000'

async function send(type, payload = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type, ...payload }, res => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(res || {})
      })
    } catch (e) { reject(e) }
  })
}

// ── Show screens ─────────────────────────────────────────────
function showConnected(userData) {
  $('setup').style.display = 'none'
  $('connected').style.display = 'block'

  $('user-name').textContent  = userData.profile?.fullName || 'Connected'
  $('user-email').textContent = userData.email || ''

  // Search prefs summary
  const jp = userData.jobPreferences || {}
  const wtMap = { '2': 'Remote', '3': 'Hybrid', '1': 'On-site' }
  const elMap = { '1': 'Internship', '2': 'Entry Level', '3': 'Associate', '4': 'Mid-Senior' }
  const parts = []
  if (jp.keywords)       parts.push(`<strong>${esc(jp.keywords)}</strong>`)
  if (jp.searchLocation) parts.push(`in ${esc(jp.searchLocation)}`)
  if (jp.workType)       parts.push(wtMap[jp.workType] || '')
  if (jp.expLevel)       parts.push(elMap[jp.expLevel] || '')

  $('search-prefs-display').innerHTML = parts.length
    ? `Searching: ${parts.join(' · ')}`
    : '<span style="color:#ccc">No search prefs — set them on the dashboard</span>'

  // Dashboard edit link
  const editLink = $('setup-link')
  if (editLink) editLink.href = getBaseUrl() + '/my-resumes'

  // LinkedIn button
  $('apply-btn').onclick = () => {
    const params = new URLSearchParams({
      f_AL: 'true',
      keywords: jp.keywords || '',
      location: jp.searchLocation || '',
      sortBy: 'R', refresh: 'true',
    })
    if (jp.workType) params.set('f_WT', jp.workType)
    if (jp.expLevel) params.set('f_E',  jp.expLevel)
    chrome.tabs.create({ url: `https://www.linkedin.com/jobs/search/?${params}` })
  }

}

function showSetup() {
  $('connected').style.display = 'none'
  $('setup').style.display = 'block'
  // Point "Auto Apply dashboard" link to correct URL
  const dashLink = $('dashboard-link')
  if (dashLink) dashLink.href = getBaseUrl() + '/my-resumes'
  setTimeout(() => $('api-key-input')?.focus(), 60)
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getBaseUrl() {
  // Check if we're connected to prod or dev
  // background.js stores baseUrl in chrome.storage.local
  return window._baseUrl || DASHBOARD_URL
}

// ── Init ─────────────────────────────────────────────────────
;(async () => {
  let cfg
  try { cfg = await send('GET_CONFIG') } catch { showSetup(); return }

  // Cache base URL so showConnected can use it
  window._baseUrl = cfg.baseUrl || DASHBOARD_URL

  if (!cfg.apiKey) { showSetup(); return }

  // Key exists → validate + fetch profile
  try {
    const data = await send('VALIDATE_KEY')
    if (data?.ok) {
      // Fetch full profile data for the connected screen
      const profileData = await send('GET_PROFILE')
      showConnected({
        profile:        profileData.profile        || {},
        email:          data.user?.email           || '',
        jobPreferences: profileData.jobPreferences || {},
      })
    } else {
      await send('SAVE_KEY', { apiKey: '', baseUrl: cfg.baseUrl })
      showSetup()
    }
  } catch {
    showSetup()
  }
})()

// ── Connect button ────────────────────────────────────────────
$('connect-btn').addEventListener('click', async () => {
  const apiKey  = $('api-key-input').value.trim()
  const errEl   = $('error-msg')
  errEl.style.display = 'none'

  if (!apiKey) {
    errEl.textContent = 'Paste your API key first.'
    errEl.style.display = 'block'
    return
  }

  $('connect-btn').disabled = true
  $('connect-btn').textContent = 'Connecting…'

  try {
    await send('SAVE_KEY', { apiKey, baseUrl: DASHBOARD_URL })
    const data = await send('VALIDATE_KEY')

    if (data?.ok) {
      const profileData = await send('GET_PROFILE')
      showConnected({
        profile:        profileData.profile        || {},
        email:          data.user?.email           || '',
        jobPreferences: profileData.jobPreferences || {},
      })
    } else {
      await send('SAVE_KEY', { apiKey: '', baseUrl: DASHBOARD_URL })
      errEl.textContent = data?.error === 'Network error'
        ? 'Cannot reach server. Check your internet connection.'
        : 'Invalid API key — generate a fresh one from the dashboard.'
      errEl.style.display = 'block'
    }
  } catch {
    errEl.textContent = 'Something went wrong. Try again.'
    errEl.style.display = 'block'
  } finally {
    $('connect-btn').disabled = false
    $('connect-btn').textContent = 'Connect'
  }
})

// ── Disconnect button ─────────────────────────────────────────
$('disconnect-btn').addEventListener('click', async () => {
  await send('SAVE_KEY', { apiKey: '', baseUrl: DASHBOARD_URL })
  $('api-key-input').value = ''
  showSetup()
})

// ── Clear error on type ───────────────────────────────────────
$('api-key-input').addEventListener('input', () => {
  $('error-msg').style.display = 'none'
})
$('api-key-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('connect-btn').click()
})
