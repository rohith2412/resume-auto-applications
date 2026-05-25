// reblet — Autonomous LinkedIn Easy Apply Bot
// Uses text-content matching instead of brittle CSS class selectors.

;(function () {
  if (window.__qrInjected) return
  window.__qrInjected = true

  /* ═══════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════ */
  let profile        = null
  let aiAnswers      = []
  let isRunning      = false
  let isPaused       = false
  let applied        = 0
  let skipped        = 0
  let panel          = null
  let currentJob     = null
  let processedJobIds = new Set()   // stable IDs, not DOM refs
  let logLines       = []

  /* ═══════════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════════ */
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const jitter = (lo, hi) => sleep(lo + Math.random() * (hi - lo))

  function sendMsg(type, payload = {}) {
    return new Promise(resolve =>
      chrome.runtime.sendMessage({ type, ...payload }, r => resolve(r || {}))
    )
  }

  function log(txt) {
    const ts = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    logLines.unshift(`${ts}  ${txt}`)
    if (logLines.length > 50) logLines.pop()
    renderLog()
    console.log('[QR]', txt)
  }

  async function waitFor(selectorFn, maxMs = 6000) {
    const step = 250
    let waited = 0
    while (waited < maxMs) {
      const el = typeof selectorFn === 'function' ? selectorFn() : document.querySelector(selectorFn)
      if (el) return el
      await sleep(step)
      waited += step
    }
    return null
  }

  // React-compatible value setter
  function reactSet(el, value) {
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) setter.call(el, value)
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  async function fillField(el, value) {
    if (!el || value == null || value === '') return
    try {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      await jitter(60, 120)
      el.focus()
      await jitter(50, 100)
      if (el.tagName === 'SELECT') {
        const v = String(value).toLowerCase()
        const opt = [...el.options].find(o =>
          o.text.toLowerCase().includes(v) || o.value.toLowerCase().includes(v)
        )
        if (opt) {
          el.value = opt.value
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
      } else {
        reactSet(el, '')
        await jitter(30, 60)
        reactSet(el, String(value))
      }
      await jitter(50, 100)

      // Handle LinkedIn typeahead/autocomplete dropdowns (e.g. location city field)
      await pickTypeaheadOption(el, value)

    } catch (_) {}
  }

  // After typing, pick from any typeahead / autocomplete dropdown LinkedIn shows.
  // Works for location, school, company, skills — any combobox-style input.
  async function pickTypeaheadOption(inputEl, value) {
    if (inputEl.tagName === 'SELECT') return   // handled separately

    const val = String(value).toLowerCase()

    for (let i = 0; i < 8; i++) {             // poll up to 2s (8 × 250ms)
      await sleep(250)

      // Gather all dropdown options LinkedIn might render.
      // NOTE: cannot use offsetParent — portal/fixed elements have offsetParent=null.
      // Use computedStyle instead.
      const candidates = [...document.querySelectorAll(
        '.basic-typeahead__selectable, ' +
        '[class*="basic-typeahead"] li, ' +
        '[class*="typeahead-result"], ' +
        '[role="option"], ' +
        '[role="listbox"] li, ' +
        '[class*="autocomplete"] li, ' +
        '[class*="dropdown"] [class*="option"], ' +
        'ul[class*="results"] li'
      )].filter(o => {
        const s = window.getComputedStyle(o)
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
      })

      if (!candidates.length) continue

      // Best match: prefer Canada for location fields, then first text match, then first item
      const best =
        candidates.find(o =>
          o.textContent?.toLowerCase().includes(val) && /canada/i.test(o.textContent)
        ) ||
        candidates.find(o => o.textContent?.toLowerCase().includes(val)) ||
        candidates[0]

      // Full mouse sequence — LinkedIn dropdowns need mousedown to register selection
      best.scrollIntoView({ block: 'nearest' })
      best.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      best.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      best.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true }))
      best.click()
      await jitter(200, 350)
      return
    }
    // No dropdown appeared — plain text field, no action needed
  }

  /* ═══════════════════════════════════════════════════════════
     DOM FINDERS
     Research-backed selectors from working LinkedIn automation
     tools. Primary: .jobs-easy-apply-modal (confirmed working).
     Fallbacks check for unique step-navigation buttons.
  ═══════════════════════════════════════════════════════════ */

  // Returns true when the Easy Apply modal is visibly open
  function isModalOpen() {
    return !!(
      document.querySelector('.jobs-easy-apply-modal')                      ||
      document.querySelector('.jobs-easy-apply-content')                    ||
      document.querySelector('button[aria-label="Continue to next step"]')  ||
      document.querySelector('button[aria-label="Submit application"]')     ||
      document.querySelector('button[aria-label="Review your application"]')
    )
  }

  // The form content pane — scoped strictly to the modal, NO document.body fallback
  // (body fallback was causing fake questions to be extracted from LinkedIn's search filters)
  function getFormPane() {
    const modal =
      document.querySelector('.jobs-easy-apply-modal')     ||
      document.querySelector('.jobs-easy-apply-content')?.closest('[class*="modal"], [class*="overlay"]') ||
      document.querySelector('[class*="easy-apply-modal"]')
    if (!modal) return null
    return (
      modal.querySelector('.jobs-easy-apply-content') ||
      modal.querySelector('form')                      ||
      modal
    )
  }

  // Find Easy Apply button ONLY in the job details panel.
  // IMPORTANT: LinkedIn also has an "Easy Apply" FILTER pill at the top of search results.
  // We must not click that — it just toggles the filter, no modal opens.
  function findEasyApplyBtn() {
    // 1. Best: the specific apply-button class that LinkedIn uses only on apply buttons
    //    (never on search filter pills)
    const applyBtns = [...document.querySelectorAll('button.jobs-apply-button')]
      .filter(b => !b.disabled && !b.textContent?.includes('Applied'))
    if (applyBtns.length) {
      log(`Found apply btn: "${applyBtns[0].getAttribute('aria-label')?.slice(0,60)}"`)
      return applyBtns[0]
    }

    // 2. aria-label must say "Easy Apply to …" (real apply) not just "Easy Apply" (filter pill)
    const specific = document.querySelector('button[aria-label*="Easy Apply to"]')
    if (specific && !specific.disabled) {
      log(`Found apply btn (specific label): "${specific.getAttribute('aria-label')?.slice(0,60)}"`)
      return specific
    }

    // 3. Scoped to the right-panel job detail area only
    const detailPanel =
      document.querySelector('.jobs-details') ||
      document.querySelector('.scaffold-layout__detail') ||
      document.querySelector('.job-view-layout') ||
      document.querySelector('[data-job-id]')

    if (detailPanel) {
      const inPanel = [...detailPanel.querySelectorAll('button[aria-label*="Easy Apply"]')]
        .find(b => !b.disabled && !b.textContent?.includes('Applied'))
      if (inPanel) {
        log(`Found apply btn (in detail panel): "${inPanel.getAttribute('aria-label')?.slice(0,60)}"`)
        return inPanel
      }
    }

    log('⚠ No apply button found')
    return null
  }

  // Simulate a real mouse click (LinkedIn's React needs full event sequence)
  function simulateClick(el) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const rect = el.getBoundingClientRect()
    const cx   = rect.left + rect.width  / 2
    const cy   = rect.top  + rect.height / 2
    const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window }
    el.dispatchEvent(new MouseEvent('mouseover',  opts))
    el.dispatchEvent(new MouseEvent('mouseenter', opts))
    el.dispatchEvent(new MouseEvent('mousedown',  opts))
    el.dispatchEvent(new MouseEvent('mouseup',    opts))
    el.dispatchEvent(new MouseEvent('click',      opts))
  }

  // Primary footer action button — scoped to modal content
  function footerBtn() {
    if (!isModalOpen()) return null

    const matches = (b, ...terms) => terms.some(t =>
      (b.getAttribute('aria-label') || '').toLowerCase().includes(t) ||
      (b.textContent || '').toLowerCase().includes(t)
    )

    const scope = document.querySelector('.jobs-easy-apply-modal') ||
                  document.querySelector('.jobs-easy-apply-content') ||
                  document

    const btns = [...scope.querySelectorAll('button')].filter(b => !b.disabled)

    return (
      btns.find(b => matches(b, 'submit application'))        ||
      btns.find(b => matches(b, 'review your application'))   ||
      btns.find(b => matches(b, 'continue to next step'))     ||
      btns.find(b => matches(b, 'next step'))                 ||
      btns.find(b => /^next$/i.test(b.textContent?.trim()))   ||
      btns.find(b =>
        b.classList.contains('artdeco-button--primary') &&
        !matches(b, 'back', 'cancel', 'close', 'discard', 'dismiss', 'easy apply', 'save')
      ) || null
    )
  }

  function btnLabel(btn) {
    return ((btn?.getAttribute('aria-label') || '') + ' ' + (btn?.textContent || ''))
      .toLowerCase().trim()
  }

  /* ═══════════════════════════════════════════════════════════
     JOB INFO
  ═══════════════════════════════════════════════════════════ */
  function extractJobInfo() {
    const tx = s => document.querySelector(s)?.innerText?.trim() || ''
    return {
      jobTitle:
        tx('.job-details-jobs-unified-top-card__job-title h1') ||
        tx('.jobs-unified-top-card__job-title h1') ||
        tx('h1.t-24') ||
        tx('h1'),
      company:
        tx('.job-details-jobs-unified-top-card__company-name a') ||
        tx('.jobs-unified-top-card__company-name a') ||
        tx('.jobs-unified-top-card__company-name'),
      jobDescription: (
        document.querySelector('.jobs-description__content') ||
        document.querySelector('#job-details') ||
        document.querySelector('.jobs-description')
      )?.innerText?.trim().slice(0, 2000) || '',
      jobUrl: window.location.href,
    }
  }

  /* ═══════════════════════════════════════════════════════════
     QUESTION EXTRACTOR
  ═══════════════════════════════════════════════════════════ */
  function extractQuestions() {
    const pane = getFormPane()
    if (!pane) return []
    const SKIP = /^(first.?name|last.?name|full.?name|email|phone|mobile|linkedin url)/i
    const out  = []

    pane.querySelectorAll('fieldset, [class*="form-element"]').forEach(fs => {
      const labelEl  = fs.querySelector('legend, label, [class*="label"]')
      const labelTxt = labelEl?.innerText?.trim()
      if (!labelTxt || SKIP.test(labelTxt)) return
      const input = fs.querySelector('input, select, textarea')
      if (!input) return
      const type = input.type || input.tagName.toLowerCase()
      const options = type === 'select-one'
        ? [...input.options].map(o => o.text).filter(t => t && !/select an option/i.test(t))
        : [...fs.querySelectorAll('input[type=radio]')]
            .map(r => document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
                      r.closest('label')?.innerText?.trim())
            .filter(Boolean)
      out.push({ label: labelTxt, type, options })
    })
    return out
  }

  /* ═══════════════════════════════════════════════════════════
     SMART DEFAULTS
  ═══════════════════════════════════════════════════════════ */
  // Always returns SOMETHING — never an empty string.
  function smartDefault(label = '', options = []) {
    const l = label.toLowerCase()

    // Referral — always No
    if (/refer|referral|referred|know anyone|employee referral/i.test(l))
      return options.find(o => /no/i.test(o)) || 'No'
    // Previously worked here — always No
    if (/previous(ly)?.*work|work.*before|former.*employ|employ.*before|worked.*here|worked.*compan/i.test(l))
      return options.find(o => /no/i.test(o)) || 'No'

    // Pull live profile values so answers match what the user actually filled in
    const p  = profile?.profile  || {}
    const ed = profile?.education || {}
    const jp = profile?.jobPreferences || {}

    if (/author|legal|eligible|permit/i.test(l)) {
      const auth = p.workAuth || 'Yes'
      return options.find(o => o.toLowerCase().includes(auth.toLowerCase())) ||
             options.find(o => /yes/i.test(o)) || 'Yes'
    }
    if (/sponsor/i.test(l)) {
      const spons = p.sponsorship || 'No'
      return options.find(o => o.toLowerCase().includes(spons.toLowerCase())) ||
             options.find(o => /no/i.test(o)) || 'No'
    }
    if (/salary|compensation|expected|pay/i.test(l))
      return String(jp.salary || p.salary || '85000').replace(/[^0-9]/g, '') || '85000'
    if (/year|experience/i.test(l))
      return String(p.yearsExp || '2')
    if (/gpa|grade/i.test(l))                         return '3.5'
    if (/language|proficien/i.test(l))
      return options.find(o => /english|full|professional/i.test(o)) || options[0] || 'English'
    if (/willing|able|open|availab/i.test(l))         return options.find(o => /yes/i.test(o))  || 'Yes'
    if (/degree|education|bachelors?|masters?/i.test(l)) {
      const deg = ed.degree || "Bachelor's"
      return options.find(o => o.toLowerCase().includes(deg.toLowerCase().slice(0, 8))) ||
             options.find(o => /bachelor|undergrad/i.test(o)) || options[0] || deg
    }
    if (/race|gender|veteran|disability|ethnicity/i.test(l))
      return options.find(o => /prefer not|decline|not wish/i.test(o)) || options[options.length - 1] || options[0] || 'Prefer not to say'
    if (/notice|start date|when can/i.test(l))
      return p.notice || '2 weeks'
    if (/cover letter/i.test(l))                      return 'I am excited about this opportunity and confident my skills are a strong match.'
    if (/why|motivation|interest/i.test(l))           return 'I am highly motivated and believe my background aligns well with this role.'
    if (/strength|skill/i.test(l))                    return 'Problem solving, communication, and teamwork.'

    // Dropdown/radio — pick first option
    if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
    if (options.length)                               return options[0]

    // Last resort for plain text / number fields — never leave blank
    return '2'
  }

  /* ═══════════════════════════════════════════════════════════
     FILL ONE STEP
  ═══════════════════════════════════════════════════════════ */
  // Detect if the current modal step is about work/job experience
  // → we skip filling it and just click Next (LinkedIn pre-fills from your profile)
  function isWorkExperienceStep(pane) {
    if (!pane) return false

    // Check step heading text
    const heading = pane.querySelector('h3, h2, [class*="title"], [class*="heading"]')
    if (heading && /work.?experience|employment|job.?history|experience/i.test(heading.textContent)) {
      return true
    }

    // Check for work-experience specific CSS classes
    if (
      pane.querySelector('[class*="work-experience"]') ||
      pane.querySelector('[class*="experience-item"]') ||
      pane.querySelector('[class*="jobs-easy-apply-form-section__work"]')
    ) return true

    // Check for the combination of fields that only appear in a work history form
    const fieldLabels = [...pane.querySelectorAll('label, legend')]
      .map(l => l.innerText?.trim().toLowerCase())
      .join(' ')
    const workFields = ['title', 'company', 'start date', 'end date']
    const matchCount = workFields.filter(f => fieldLabels.includes(f)).length
    if (matchCount >= 3) return true

    return false
  }

  // force=true → re-fill even fields that already have a value (used on error retry)
  async function fillStep(force = false) {
    const pane = getFormPane()
    if (!pane) return

    const p = profile?.profile || {}
    await jitter(150, 300)

    // Standard contact fields
    const contacts = [
      { sel: 'input[id*="firstName"],input[aria-label*="First name"]',        val: p.fullName?.split(' ')[0] },
      { sel: 'input[id*="lastName"],input[aria-label*="Last name"]',           val: p.fullName?.split(' ').slice(1).join(' ') },
      { sel: 'input[type="tel"],input[id*="phone"],input[id*="phoneNumber"]',  val: p.phone },
      { sel: 'input[id*="city"],input[aria-label*="City"]',                    val: p.location },
      { sel: 'input[id*="linkedin"],input[aria-label*="LinkedIn"]',            val: p.linkedin },
      { sel: 'input[id*="github"],input[aria-label*="GitHub"]',               val: p.github },
      { sel: 'input[id*="website"],input[id*="portfolio"]',                   val: p.website },
    ]
    for (const { sel, val } of contacts) {
      const el = pane.querySelector(sel)
      if (el && val && (force || !el.value)) await fillField(el, val)
    }

    // Screening / custom question fields
    for (const fs of pane.querySelectorAll('fieldset, [class*="form-element"]')) {
      const labelEl  = fs.querySelector('legend, label, [class*="label"]')
      const labelTxt = labelEl?.innerText?.trim() || ''
      if (!labelTxt) continue

      // On force mode, target fields that are empty OR have an error indicator
      const hasError = !!fs.querySelector('[class*="error"], .artdeco-inline-feedback--error')
      if (!force && !hasError) {
        // normal pass: only fill if empty
      }

      const options = [
        ...[...fs.querySelectorAll('option')].map(o => o.text),
        ...[...fs.querySelectorAll('input[type=radio]')]
          .map(r => document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
                    r.closest('label')?.innerText?.trim()),
      ].filter(Boolean)

      const aiMatch = aiAnswers.find(a =>
        labelTxt.toLowerCase().includes((a.label || '').toLowerCase().slice(0, 35)) ||
        (a.label || '').toLowerCase().includes(labelTxt.toLowerCase().slice(0, 35))
      )
      // smartDefault now always returns something — never blank
      const answer = aiMatch?.answer || smartDefault(labelTxt, options)

      // Text / select / textarea
      const textEl = fs.querySelector('input:not([type=radio]):not([type=checkbox]), select, textarea')
      if (textEl) {
        if (force || !textEl.value || hasError) await fillField(textEl, answer)
        continue
      }

      // Radio
      const radios = fs.querySelectorAll('input[type=radio]')
      if (radios.length && (force || ![...radios].some(r => r.checked))) {
        let picked = false
        for (const r of radios) {
          const rLbl = document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
                       r.closest('label')?.innerText?.trim() || ''
          if (rLbl.toLowerCase().includes(answer.toLowerCase().slice(0, 20))) {
            r.click(); await jitter(100, 200); picked = true; break
          }
        }
        // If no label matched, just pick the first radio
        if (!picked && force) { radios[0].click(); await jitter(100, 200) }
      }
      await jitter(60, 120)
    }

    // Empty selects → first valid option
    for (const sel of pane.querySelectorAll('select')) {
      if (!force && sel.value) continue
      const first = [...sel.options].find(o => o.value && !/select an option/i.test(o.text))
      if (first && (force || !sel.value)) {
        sel.value = first.value
        sel.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     RATE-LIMIT DETECTOR
     LinkedIn shows "We limit daily submissions…" when you've
     hit their daily Easy Apply cap. Stop immediately.
  ═══════════════════════════════════════════════════════════ */
  function isRateLimited() {
    const text = document.body?.innerText || ''
    return (
      /we limit daily submissions/i.test(text) ||
      /apply tomorrow/i.test(text) ||
      /daily.*limit.*submissions/i.test(text) ||
      /limit.*daily.*submissions/i.test(text)
    )
  }

  /* ═══════════════════════════════════════════════════════════
     ERROR CHECKER
  ═══════════════════════════════════════════════════════════ */
  function hasErrors() {
    if (!isModalOpen()) return false
    const pane = getFormPane()
    return !!(pane && pane.querySelector(
      '[class*="error"], [data-test-form-element-error-message], .artdeco-inline-feedback--error'
    ))
  }

  /* ═══════════════════════════════════════════════════════════
     CLOSE MODAL
  ═══════════════════════════════════════════════════════════ */
  async function closeModal() {
    // Click Dismiss / X to close the Easy Apply modal
    const x =
      document.querySelector('button[aria-label="Dismiss"]')  ||
      document.querySelector('button[aria-label="Cancel"]')   ||
      [...document.querySelectorAll('button')].find(b =>
        /^(×|✕|close)$/i.test(b.textContent?.trim()) ||
        b.getAttribute('aria-label')?.toLowerCase() === 'dismiss'
      )
    if (x) { x.click(); await jitter(500, 800) }

    // If a "Discard" confirm appears, click it
    await jitter(300, 500)
    const confirmDiscard = [...document.querySelectorAll('button')]
      .find(b => /discard/i.test(b.textContent?.trim()))
    if (confirmDiscard) { confirmDiscard.click(); await jitter(400, 600) }
  }

  /* ═══════════════════════════════════════════════════════════
     WAIT FOR SUCCESS SCREEN
  ═══════════════════════════════════════════════════════════ */
  async function waitForSuccess(maxMs = 8000) {
    const step = 300
    let waited = 0
    while (waited < maxMs) {
      // LinkedIn shows a post-apply success modal
      const success =
        document.querySelector('.jobs-post-apply-modal') ||
        document.querySelector('[data-test-modal-id="post-apply-modal"]') ||
        // "Your application was sent" heading
        [...document.querySelectorAll('h2, h3')].find(h =>
          /application was sent|application submitted|you applied/i.test(h.textContent)
        )
      if (success) { log('✓ Success screen confirmed'); return true }

      // Modal fully gone (step buttons gone + no form pane)
      if (!isModalOpen()) { log('✓ Modal closed after submit'); return true }

      await sleep(step)
      waited += step
    }
    return false
  }

  async function dismissSuccess() {
    await jitter(700, 1100)
    const done = [
      'button[aria-label="Dismiss"]',
      'button[aria-label="Done"]',
    ].reduce((found, sel) => found || document.querySelector(sel), null) ||
    [...document.querySelectorAll('button')].find(b => /^done$/i.test(b.textContent?.trim()))
    if (done) { done.click(); await jitter(400, 700) }
  }

  /* ═══════════════════════════════════════════════════════════
     PROCESS ONE FULL EASY APPLY MODAL
  ═══════════════════════════════════════════════════════════ */
  async function processModal() {
    // Modal is already confirmed open before this is called

    // Handle "resume previous application?" popup
    await jitter(500, 800)
    const resumeDiscard = [...document.querySelectorAll('button')]
      .find(b => /discard/i.test(b.textContent?.trim()))
    if (resumeDiscard) { log('Discarding old application'); resumeDiscard.click(); await jitter(600, 900) }

    const MAX_STEPS  = 20
    let   stepCount  = 0
    let   prevLabel  = ''
    let   stuckCount = 0

    while (stepCount < MAX_STEPS) {
      if (!isRunning) return 'stopped'
      while (isPaused) { await sleep(400); if (!isRunning) return 'stopped' }

      // Modal disappeared?
      if (!isModalOpen()) {
        const ok = await waitForSuccess(2000)
        return ok ? 'applied' : 'skipped'
      }

      // Upload/resume step — just advance (LinkedIn pre-fills from profile)
      const pane = getFormPane()
      const hasUpload = pane?.querySelector('[class*="document-upload"]')

      if (hasUpload) {
        log(`Step ${stepCount + 1}: resume — using existing`)
        await jitter(500, 800)
      } else if (isWorkExperienceStep(pane)) {
        log(`Step ${stepCount + 1}: work experience — passing through (LinkedIn pre-fills)`)
        await jitter(500, 800)
      } else {
        log(`Step ${stepCount + 1}: filling fields`)
        await fillStep()
        await jitter(350, 600)
      }

      // If there are validation errors, retry up to 3 times with force-fill
      // (force=true re-fills every field, even ones that already have a value)
      if (hasErrors()) {
        let fixed = false
        for (let attempt = 1; attempt <= 3; attempt++) {
          log(`Step ${stepCount + 1}: fixing errors (attempt ${attempt}/3)`)
          await fillStep(true)   // force-fill all fields
          await jitter(400, 700)
          if (!hasErrors()) { fixed = true; break }
        }
        if (!fixed) {
          log('⚠ Could not fix required fields after 3 attempts — skipping')
          await closeModal()
          return 'skipped'
        }
      }

      // Find the action button
      const btn = footerBtn()
      if (!btn) {
        log(`Step ${stepCount + 1}: waiting for button…`)
        await jitter(700, 1100)
        stepCount++
        continue
      }

      const label = btnLabel(btn)
      log(`Step ${stepCount + 1}: button = "${label.slice(0, 40)}"`)

      // Stuck detection (same button 3 times)
      if (label === prevLabel) {
        stuckCount++
        if (stuckCount >= 3) {
          log('⚠ Stuck on same button — skipping')
          await closeModal()
          return 'skipped'
        }
      } else {
        stuckCount = 0
        prevLabel = label
      }

      if (label.includes('submit application')) {
        log('Clicking Submit…')
        await jitter(600, 1000)
        btn.click()
        const ok = await waitForSuccess(9000)
        if (ok) {
          await dismissSuccess()
          return 'applied'
        }
        log('⚠ Submit clicked — no success screen detected')
        return 'skipped'
      }

      // Next / Review / Continue
      await jitter(400, 700)
      btn.click()
      await jitter(1000, 1600)
      stepCount++
    }

    log('Max steps reached — skipping')
    await closeModal()
    return 'skipped'
  }

  /* ═══════════════════════════════════════════════════════════
     JOB CARD LIST
  ═══════════════════════════════════════════════════════════ */
  function cardJobId(card) {
    // LinkedIn puts the job ID in various places
    return (
      card.getAttribute('data-job-id') ||
      card.getAttribute('data-entity-urn') ||
      card.querySelector('a[href*="currentJobId"]')?.href?.match(/currentJobId=(\d+)/)?.[1] ||
      card.querySelector('a[href*="/jobs/view/"]')?.href?.match(/\/jobs\/view\/(\d+)/)?.[1] ||
      card.querySelector('a')?.href ||   // last resort: full link href
      null
    )
  }

  function pendingCards() {
    return [...document.querySelectorAll(
      '.jobs-search-results__list-item, .scaffold-layout__list-item'
    )].filter(card => {
      const id = cardJobId(card)
      if (id && processedJobIds.has(id)) return false
      return (
        card.querySelector('[class*="easy-apply"]') ||
        card.querySelector('[aria-label*="Easy Apply"]') ||
        card.textContent?.includes('Easy Apply')
      )
    })
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════════════════════════ */
  async function autoApplyLoop() {
    log('Loading profile…')
    const profileData = await sendMsg('GET_PROFILE')
    if (profileData.error || !profileData.profile) {
      log('⚠ Not connected — open popup and connect first')
      isRunning = false; renderPanel(); return
    }
    profile = profileData
    log(`Profile: ${profile.profile?.fullName || 'loaded'}`)

    const jobList = document.querySelector(
      '.jobs-search-results-list, .scaffold-layout__list'
    )

    while (isRunning) {
      while (isPaused) { await sleep(400); if (!isRunning) break }
      if (!isRunning) break

      let cards = pendingCards()
      if (!cards.length) {
        if (jobList) {
          log('Scrolling for more jobs…')
          jobList.scrollTop += 600
          await jitter(2200, 3200)
          cards = pendingCards()
        }
        if (!cards.length) {
          log(`All done — Applied: ${applied}  Skipped: ${skipped}`)
          isRunning = false; renderPanel(); return
        }
      }

      const card  = cards[0]
      const jobId = cardJobId(card)
      if (jobId) processedJobIds.add(jobId)   // dedupe by stable ID, not DOM ref

      const link = card.querySelector(
        'a.job-card-list__title, a[data-control-name="job_card_title"], .job-card-container__link, a'
      )
      if (!link) { skipped++; renderPanel(); continue }

      log(`Opening job #${applied + skipped + 1}`)
      link.click()
      await jitter(2000, 3000)

      // Check for LinkedIn daily limit banner before doing anything
      if (isRateLimited()) {
        log('⛔ LinkedIn daily limit reached — stopping. Try again tomorrow.')
        isRunning = false; renderPanel(); return
      }

      // Find the Easy Apply button in the detail panel
      const easyApplyBtn = await waitFor(findEasyApplyBtn, 5000)
      if (!easyApplyBtn) {
        log('Easy Apply button not found — skipping')
        skipped++; renderPanel(); continue
      }

      const jobData = extractJobInfo()
      currentJob = jobData
      renderPanel()
      log(`${jobData.jobTitle} @ ${jobData.company}`)

      // Simulate real mouse click on Easy Apply (LinkedIn React needs full event sequence)
      await jitter(500, 900)

      // Check again — banner sometimes only shows after selecting a job
      if (isRateLimited()) {
        log('⛔ LinkedIn daily limit reached — stopping. Try again tomorrow.')
        isRunning = false; renderPanel(); return
      }

      log(`Clicking: "${easyApplyBtn.getAttribute('aria-label') || easyApplyBtn.textContent?.trim()}"`)
      simulateClick(easyApplyBtn)

      // Wait for modal to actually open BEFORE doing anything else
      log('Waiting for modal…')
      const modalOpened = await waitFor(isModalOpen, 8000)
      if (!modalOpened) {
        // One more check — maybe the click revealed the rate-limit banner instead
        if (isRateLimited()) {
          log('⛔ LinkedIn daily limit reached — stopping. Try again tomorrow.')
          isRunning = false; renderPanel(); return
        }
        log('⚠ Easy Apply click did not open modal — skipping')
        skipped++; renderPanel(); continue
      }
      log('Modal confirmed open')
      await jitter(600, 1000)  // let the first step fully render

      // Now extract questions from the REAL open modal (no document.body fallback)
      aiAnswers = []
      const questions = extractQuestions()
      if (questions.length) {
        log(`${questions.length} screening questions — asking AI…`)
        const res = await sendMsg('TAILOR', {
          jobTitle: jobData.jobTitle,
          company: jobData.company,
          jobDescription: jobData.jobDescription,
          questions,
        })
        aiAnswers = res.answers || []
        log(`AI answered ${aiAnswers.length} questions`)
      }

      const result = await processModal()

      if (result === 'applied') {
        applied++
        log(`✓ APPLIED (${applied} total)`)
        sendMsg('TRACK', {
          jobTitle: jobData.jobTitle,
          company: jobData.company,
          jobUrl: jobData.jobUrl,
          jobDescription: jobData.jobDescription,
        })
      } else if (result === 'skipped') {
        skipped++
      } else if (result === 'stopped') {
        break
      }

      renderPanel()
      await jitter(3000, 5000)
    }

    if (isRunning) {
      log(`Complete — Applied: ${applied}  Skipped: ${skipped}`)
      isRunning = false; renderPanel()
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL UI
  ═══════════════════════════════════════════════════════════ */
  function buildPanel() {
    if (panel) return
    panel = document.createElement('div')
    panel.id = 'qr-panel'
    panel.innerHTML = `
      <div class="qr-header">
        <div class="qr-logo-row">
          <svg width="18" height="18" viewBox="100 85 200 230" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(200,200)">
              <rect x="-100" y="-115" width="200" height="230" rx="38" fill="#1a1a1a"/>
              <rect x="-22" y="-98" width="44" height="18" rx="6" fill="#555"/>
              <rect x="-22" y="-80" width="44" height="9" rx="2" fill="#888"/>
              <rect x="-22" y="-71" width="44" height="82" rx="4" fill="#fff"/>
              <rect x="-22" y="11" width="44" height="14" rx="2" fill="#e8c99a"/>
              <polygon points="-22,25 22,25 0,78" fill="#e8c99a"/>
              <polygon points="-7,64 7,64 0,78" fill="#444"/>
              <line x1="0" y1="76" x2="0" y2="84" stroke="#222" stroke-width="3" stroke-linecap="round"/>
            </g>
          </svg>
          <span class="qr-brand">reblet</span>
        </div>
        <button class="qr-x" id="qr-x">×</button>
      </div>

      <div class="qr-stats">
        <div class="qr-stat">
          <span class="qr-stat-n" id="qr-n-applied">0</span>
          <span class="qr-stat-l">Applied</span>
        </div>
        <div class="qr-stat-sep"></div>
        <div class="qr-stat">
          <span class="qr-stat-n" id="qr-n-skipped">0</span>
          <span class="qr-stat-l">Skipped</span>
        </div>
      </div>

      <div class="qr-status-row">
        <span class="qr-dot" id="qr-dot"></span>
        <span class="qr-status-txt" id="qr-status-txt">Ready</span>
      </div>

      <div class="qr-job-row" id="qr-job-row" style="display:none">
        <span class="qr-job-name" id="qr-job-name"></span>
        <span class="qr-job-co"   id="qr-job-co"></span>
      </div>

      <div class="qr-btns">
        <button class="qr-btn-start" id="qr-start">▶ Start Auto Apply</button>
        <div class="qr-run-btns" id="qr-run-btns" style="display:none">
          <button class="qr-btn-pause" id="qr-pause">⏸ Pause</button>
          <button class="qr-btn-stop"  id="qr-stop">■ Stop</button>
        </div>
        <button class="qr-btn-diag" id="qr-diag">🔍 Diagnose</button>
      </div>

      <div class="qr-log-wrap">
        <div class="qr-log-label">Activity log</div>
        <div class="qr-log" id="qr-log"></div>
      </div>
    `
    document.body.appendChild(panel)

    document.getElementById('qr-x').onclick = () => {
      isRunning = false; isPaused = false
      panel.remove(); panel = null
    }
    document.getElementById('qr-start').onclick = () => {
      if (isRunning) return
      isRunning = true; isPaused = false
      applied = 0; skipped = 0; currentJob = null; logLines = []
      processedJobIds = new Set()
      renderPanel(); renderLog()
      autoApplyLoop()
    }
    document.getElementById('qr-pause').onclick = () => {
      isPaused = !isPaused
      document.getElementById('qr-pause').textContent = isPaused ? '▶ Resume' : '⏸ Pause'
      log(isPaused ? 'Paused' : 'Resumed')
    }
    document.getElementById('qr-stop').onclick = () => {
      isRunning = false; isPaused = false
      log('Stopped by user'); renderPanel()
    }
    document.getElementById('qr-diag').onclick = () => runDiagnostic()
  }

  async function runDiagnostic() {
    logLines = []
    log('── DIAGNOSTIC ──')

    // 1. What apply buttons exist?
    const applyByClass = [...document.querySelectorAll('button.jobs-apply-button')]
    log(`button.jobs-apply-button: ${applyByClass.length}`)
    applyByClass.forEach(b =>
      log(`  label="${b.getAttribute('aria-label')?.slice(0,50)}" disabled=${b.disabled}`)
    )

    const applyByLabel = [...document.querySelectorAll('button[aria-label*="Easy Apply"]')]
    log(`button[aria-label*=Easy Apply]: ${applyByLabel.length}`)
    applyByLabel.forEach(b =>
      log(`  label="${b.getAttribute('aria-label')?.slice(0,50)}" class="${b.className?.slice(0,40)}"`)
    )

    // 2. Modal state NOW (before any click)
    log(`isModalOpen() = ${isModalOpen()}`)
    log(`.jobs-easy-apply-modal = ${!!document.querySelector('.jobs-easy-apply-modal')}`)
    log(`.jobs-easy-apply-content = ${!!document.querySelector('.jobs-easy-apply-content')}`)
    log(`[role=dialog] count = ${document.querySelectorAll('[role=dialog]').length}`)
    log(`.artdeco-modal--active = ${!!document.querySelector('.artdeco-modal--active')}`)

    // 3. Try clicking the button we would use
    const btn = findEasyApplyBtn()
    if (!btn) {
      log('⚠ findEasyApplyBtn() = null — no button to click')
      return
    }
    log(`Clicking: "${btn.getAttribute('aria-label') || btn.textContent?.trim()}"`)

    // Try plain click first
    btn.focus()
    await sleep(300)
    btn.click()
    await sleep(2000)

    log(`After .click() — isModalOpen() = ${isModalOpen()}`)
    log(`.jobs-easy-apply-modal = ${!!document.querySelector('.jobs-easy-apply-modal')}`)
    log(`.jobs-easy-apply-content = ${!!document.querySelector('.jobs-easy-apply-content')}`)
    log(`[role=dialog] count = ${document.querySelectorAll('[role=dialog]').length}`)

    // All new elements with "modal" in class
    const modals = [...document.querySelectorAll('[class*="modal"]')]
      .filter(e => {
        const s = window.getComputedStyle(e)
        return s.display !== 'none' && s.visibility !== 'hidden'
      })
      .map(e => e.className?.split(' ').find(c => c.includes('modal')) || e.tagName)
    log(`Visible modal classes: ${modals.slice(0,5).join(', ') || 'none'}`)

    log('── END ──')
    renderLog()
  }

  function renderPanel() {
    if (!panel) return
    document.getElementById('qr-n-applied').textContent = applied
    document.getElementById('qr-n-skipped').textContent = skipped
    const startBtn = document.getElementById('qr-start')
    const runBtns  = document.getElementById('qr-run-btns')
    const dot      = document.getElementById('qr-dot')
    const jobRow   = document.getElementById('qr-job-row')
    const status   = document.getElementById('qr-status-txt')

    if (isRunning) {
      startBtn.style.display = 'none'
      runBtns.style.display  = 'flex'
      dot.className = 'qr-dot qr-dot-active'
      if (status && logLines[0]) status.textContent = logLines[0].split('  ').slice(1).join('  ')
      if (currentJob) {
        jobRow.style.display = 'block'
        document.getElementById('qr-job-name').textContent = currentJob.jobTitle
        document.getElementById('qr-job-co').textContent   = currentJob.company
      }
    } else {
      startBtn.style.display = 'block'
      runBtns.style.display  = 'none'
      dot.className = 'qr-dot'
      jobRow.style.display = 'none'
    }
  }

  function renderLog() {
    const el = document.getElementById('qr-log')
    if (!el) return
    el.innerHTML = logLines.map(l => {
      const cls = l.includes('✓') ? 'qr-log-ok' : l.includes('⚠') ? 'qr-log-warn' : ''
      return `<div class="qr-log-line ${cls}">${l}</div>`
    }).join('')
    // Auto-scroll isn't needed since newest is at top
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */
  function maybeShowPanel() {
    if (location.pathname.startsWith('/jobs') && !panel) buildPanel()
  }
  setTimeout(maybeShowPanel, 1200)
  new MutationObserver(maybeShowPanel)
    .observe(document.body, { childList: true, subtree: false })
})()
