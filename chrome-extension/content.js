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
  function normalizeLabel(label = '') {
    return label.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  }

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

  // Returns a date string relative to today (offset = days from now)
  function futureDate(offsetDays = 14, fmt = 'YYYY-MM-DD') {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    if (fmt === 'YYYY-MM') return `${y}-${m}`
    return `${y}-${m}-${day}`
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
        // Respect character limits — truncate cleanly at a word boundary
        let finalVal = String(value)
        const maxLen = el.maxLength > 0 ? el.maxLength : Infinity
        if (finalVal.length > maxLen) {
          finalVal = finalVal.slice(0, maxLen - 1).replace(/\s+\S*$/, '') // trim at last word
        }
        reactSet(el, '')
        await jitter(30, 60)
        reactSet(el, finalVal)
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
    const seen = new Set()

    pane.querySelectorAll('fieldset, [class*="form-element"]').forEach(fs => {
      const labelEl  = fs.querySelector('legend, label, [class*="label"]')
      const labelTxt = labelEl?.innerText?.trim()
      if (!labelTxt || SKIP.test(labelTxt) || seen.has(labelTxt)) return
      seen.add(labelTxt)

      const radios     = [...fs.querySelectorAll('input[type=radio]')]
      const checkboxes = [...fs.querySelectorAll('input[type=checkbox]')]
      const select     = fs.querySelector('select')
      const textarea   = fs.querySelector('textarea')
      const input      = fs.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=hidden])')

      if (select) {
        out.push({
          label: labelTxt, type: 'select',
          options: [...select.options].map(o => o.text).filter(t => t && !/select an option/i.test(t)),
        })
      } else if (radios.length) {
        out.push({
          label: labelTxt, type: 'radio',
          options: radios.map(r =>
            document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
            r.closest('label')?.innerText?.trim()
          ).filter(Boolean),
        })
      } else if (checkboxes.length) {
        out.push({
          label: labelTxt, type: 'checkbox',
          options: checkboxes.map(c =>
            document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() ||
            c.closest('label')?.innerText?.trim()
          ).filter(Boolean),
        })
      } else if (textarea) {
        out.push({ label: labelTxt, type: 'textarea' })
      } else if (input) {
        out.push({
          label: labelTxt,
          type: input.type || 'text',
          placeholder: input.placeholder || '',
        })
      }
    })
    // Secondary pass: catch checkbox groups outside standard fieldset wrappers (e.g. Greenhouse)
    const allCbInputs = [...pane.querySelectorAll('input[type=checkbox]')]
    const cbSeen = new Set()
    for (const cb of allCbInputs) {
      let container = cb.parentElement
      while (container && container !== pane) {
        if ([...container.querySelectorAll('input[type=checkbox]')].length > 1) break
        container = container.parentElement
      }
      if (!container || container === pane || cbSeen.has(container)) continue
      if (container.matches('fieldset, [class*="form-element"]')) continue
      cbSeen.add(container)

      const labelTxt = (
        container.querySelector('legend')?.innerText?.trim() ||
        container.querySelector('h1,h2,h3,h4,h5')?.innerText?.trim() ||
        [...container.querySelectorAll('label')].find(l => !l.htmlFor && !l.querySelector('input'))?.innerText?.trim() ||
        container.querySelector('[class*="label"],[class*="title"]')?.innerText?.trim() ||
        ''
      )
      if (!labelTxt || SKIP.test(labelTxt) || seen.has(labelTxt)) continue
      seen.add(labelTxt)

      const options = [...container.querySelectorAll('input[type=checkbox]')].map(c =>
        document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() ||
        c.closest('label')?.innerText?.trim() || c.value || ''
      ).filter(Boolean)
      out.push({ label: labelTxt, type: 'checkbox', options })
    }

    return out
  }

  // Build a rich description of every field on the current step for AI deep-analysis.
  function describeFormStep(pane) {
    if (!pane) return []
    const fields = []
    const seen   = new Set()

    pane.querySelectorAll('fieldset, [class*="form-element"]').forEach(fs => {
      const labelEl  = fs.querySelector('legend, label, [class*="label"]')
      const labelTxt = labelEl?.innerText?.trim()
      if (!labelTxt || seen.has(labelTxt)) return
      seen.add(labelTxt)

      const hasError   = !!fs.querySelector('[class*="error"], .artdeco-inline-feedback--error')
      const radios     = [...fs.querySelectorAll('input[type=radio]')]
      const checkboxes = [...fs.querySelectorAll('input[type=checkbox]')]
      const select     = fs.querySelector('select')
      const textarea   = fs.querySelector('textarea')
      const input      = fs.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=hidden])')

      if (select) {
        fields.push({
          label: labelTxt, type: 'select', hasError,
          currentValue: select.options[select.selectedIndex]?.text || '',
          options: [...select.options].map(o => o.text).filter(t => t && !/select an option/i.test(t)),
        })
      } else if (radios.length) {
        const checked = radios.find(r => r.checked)
        fields.push({
          label: labelTxt, type: 'radio', hasError,
          currentValue: checked
            ? (document.querySelector(`label[for="${checked.id}"]`)?.innerText?.trim() || '')
            : '',
          options: radios.map(r =>
            document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
            r.closest('label')?.innerText?.trim()
          ).filter(Boolean),
        })
      } else if (checkboxes.length) {
        const checkedLabels = checkboxes
          .filter(c => c.checked)
          .map(c => document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() || c.closest('label')?.innerText?.trim())
          .filter(Boolean)
        fields.push({
          label: labelTxt, type: 'checkbox', hasError,
          currentValue: checkedLabels.join(', '),
          options: checkboxes.map(c =>
            document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() ||
            c.closest('label')?.innerText?.trim()
          ).filter(Boolean),
        })
      } else if (textarea) {
        fields.push({ label: labelTxt, type: 'textarea', hasError, currentValue: textarea.value || '' })
      } else if (input) {
        fields.push({
          label: labelTxt, type: input.type || 'text', hasError,
          currentValue: input.value || '',
          placeholder: input.placeholder || '',
        })
      }
    })
    return fields
  }

  /* ═══════════════════════════════════════════════════════════
     SMART DEFAULTS
     Covers all 13 LinkedIn screening question categories +
     common ATS (Greenhouse, Lever, Workday) custom fields.
  ═══════════════════════════════════════════════════════════ */
  function smartDefault(label = '', options = []) {
    const l = label.toLowerCase()
    const p  = profile?.profile       || {}
    const ed = profile?.education      || {}
    const jp = profile?.jobPreferences || {}

    const opt = pat => options.find(o => pat.test(o))

    // ── 1. Referral / previous employment ───────────────────────
    if (/refer|referral|referred|know anyone|employee referral/i.test(l))
      return opt(/\bno\b/i) || 'No'
    if (/previous(ly)?.{0,10}work|work.{0,10}before|former.{0,10}employ|worked.{0,10}here|worked.{0,10}compan/i.test(l))
      return opt(/\bno\b/i) || 'No'

    // ── 2. Work authorization & visa sponsorship ─────────────────
    if (/authoriz|legal.*work|eligible.*work|right to work|work.*permit|allowed.*work/i.test(l)) {
      const auth = p.workAuth || 'Yes'
      return options.find(o => o.toLowerCase().includes(auth.toLowerCase())) ||
             opt(/\byes\b/i) || 'Yes'
    }
    if (/\bsponsor/i.test(l)) {
      const spons = p.sponsorship || 'No'
      return options.find(o => o.toLowerCase().includes(spons.toLowerCase())) ||
             opt(/\bno\b/i) || 'No'
    }
    if (/visa|immigration|h1b|h-1b|opt\b|cpt\b|ead\b|citizenship|citizen status/i.test(l)) {
      if (/yes/i.test(p.workAuth || 'Yes'))
        return opt(/citizen|permanent.*resident|authorized|no.*sponsor|don.t.*need/i) || opt(/\byes\b/i) || 'Authorized to work'
      return opt(/visa|sponsored/i) || options[0] || 'Require sponsorship'
    }

    // ── 3. Background check / consent / agreements ───────────────
    if (/background.?check|drug.?test|credit.?check|consent|agree.*condition|acknowledge|certif.*accurate/i.test(l))
      return opt(/yes|agree|i consent|i acknowledge|i certify/i) || 'Yes'

    // ── 4. Salary / compensation ──────────────────────────────────
    if (/salary|compensation|expected.{0,10}pay|pay.{0,10}expect|ctc|remunerat|wage/i.test(l))
      return String(jp.expectedSalary || '85000').replace(/[^0-9]/g, '') || '85000'

    // ── 5. Years of experience ────────────────────────────────────
    if (/how many year|years.{0,15}experience|experience.{0,15}year|years? of/i.test(l))
      return String(jp.yearsExp || '2')

    // ── 6. Education / degree ─────────────────────────────────────
    if (/degree|education|bachelors?|masters?|highest.{0,15}education|academic/i.test(l)) {
      const deg = ed.degree || "Bachelor's"
      return options.find(o => o.toLowerCase().includes(deg.toLowerCase().slice(0, 8))) ||
             opt(/bachelor|undergrad/i) || options[0] || deg
    }
    if (/gpa|grade.{0,10}point|cgpa/i.test(l))
      return ed.gpa || '3.5'
    if (/major|field.{0,10}study|area.{0,10}study/i.test(l))
      return profile?.educationField || ed.degree || 'Computer Science'
    if (/graduation|grad.{0,10}year|when.*graduat/i.test(l))
      return ed.graduationYear || new Date().getFullYear().toString()
    if (/university|school|college|institution/i.test(l))
      return ed.university || ''

    // ── 7. Language / proficiency ─────────────────────────────────
    if (/language|proficien|fluency|fluent|english level/i.test(l))
      return opt(/native|bilingual/i) ||
             opt(/full.{0,10}professional/i) ||
             opt(/professional.{0,10}working/i) ||
             opt(/english/i) ||
             options[0] || 'Full Professional'

    // ── 8. Notice period / availability / start date ─────────────
    if (/notice|start.?date|when.*start|available.*start|earliest.*start|join.*date/i.test(l))
      return jp.noticePeriod || p.notice || '2 weeks'
    // Date-picker specific (HTML date/month inputs get a formatted date)
    if (/availab|when.{0,10}can.*start|start.{0,10}date/i.test(l))
      return futureDate(14)

    // ── 9. Remote / hybrid / on-site preference ───────────────────
    if (/remote|hybrid|on.?site|in.?office|work.*location|work.*arrangement|work.*setting/i.test(l)) {
      const wt = jp.workType
      if (wt === '2') return opt(/remote/i)  || 'Remote'
      if (wt === '3') return opt(/hybrid/i)  || 'Hybrid'
      if (wt === '1') return opt(/on.?site|office/i) || 'On-site'
      return opt(/yes|open|flexible|willing/i) || options[0] || 'Yes'
    }

    // ── 10. Relocation ────────────────────────────────────────────
    if (/relocat|willing.*move|open.*relocat/i.test(l))
      return opt(/yes|willing|open/i) || 'Yes'

    // ── 11. Travel ────────────────────────────────────────────────
    if (/\btravel\b|commut/i.test(l))
      return opt(/yes|willing|open|occasional|up to/i) || options[0] || 'Yes'

    // ── 12. Demographics / EEO / voluntary disclosure ─────────────
    if (/race|ethnicity|gender|sex\b|veteran|disability|disab|eeo|voluntary|disclos/i.test(l))
      return opt(/prefer not|decline|not wish|i don.t|do not wish|choose not/i) ||
             options[options.length - 1] || options[0] || 'Prefer not to say'

    // ── 13. Certifications / licenses ────────────────────────────
    if (/certif|licen|pmp\b|aws\b|cpa\b|cfa\b/i.test(l))
      return opt(/\bno\b|none|don.t have/i) || opt(/\byes\b/i) || options[0] || 'No'

    // ── Phone number type (radio: Mobile / Home / Work / Other) ──────
    if (/^type$/i.test(l.trim()) || /phone.*type|type.*phone|number.*type|contact.*type/i.test(l))
      return opt(/mobile|cell/i) || opt(/home/i) || options[0] || 'Mobile'

    // ── Skills / expertise level ──────────────────────────────────
    if (/skill|expertise|proficien|experience.*with|familiar.*with/i.test(l)) {
      if (options.length) return opt(/advanced|expert|senior|proficient/i) || opt(/intermediate/i) || options[Math.floor(options.length / 2)] || options[0]
      return String(jp.yearsExp || '2')
    }

    // ── Industry / sector ─────────────────────────────────────────
    if (/industry|sector/i.test(l))
      return opt(/tech|software|information/i) || options[0] || 'Technology'

    // ── Willing / able / open ─────────────────────────────────────
    if (/willing|able\b|open to|availab/i.test(l))
      return opt(/\byes\b/i) || 'Yes'

    // ── How did you hear about us ─────────────────────────────────
    if (/how.*hear|learn.*about.*us|source.*application|referral.*source|find.*this.*job/i.test(l))
      return opt(/linkedin/i) || opt(/other/i) || options[0] || 'LinkedIn'

    // ── Long-form: examples / projects / achievements ─────────────
    if (/example|project|impact|achievement|accomplishment|evidence|highlight|tell us|describe|explain.*time|situation.*where/i.test(l)) {
      const fn = p.fullName?.split(' ')[0] || 'I'
      return `${fn} led the development of a full-stack application that reduced processing time by 40%. I architected the system, implemented core features, and deployed on cloud infrastructure, working cross-functionally with stakeholders. This delivered measurable impact and sharpened my ability to own projects end-to-end.`
    }

    // ── Cover letter / motivation / why this role ─────────────────
    if (/cover letter/i.test(l))
      return `I am excited about this opportunity and confident my skills are a strong match for the ${jp.keywords || 'role'}.`
    if (/why.*role|why.*company|why.*position|motivat|interest.*role|passion/i.test(l))
      return 'I am highly motivated by this opportunity and believe my background aligns strongly with what you are looking for.'
    if (/strength|what.*bring|value.*add|about yourself/i.test(l))
      return 'Strong problem-solving skills, a collaborative mindset, and a track record of delivering high-quality technical work on time.'

    // ── Current / previous employer ───────────────────────────────
    if (/current.*company|current.*employer|where.*work|employer.*name/i.test(l))
      return ''   // leave blank — don't expose current employer

    // ── URL / link fields ─────────────────────────────────────────
    if (/\blinkedin\b/i.test(l))    return p.linkedin  || ''
    if (/\bgithub\b/i.test(l))      return p.github    || ''
    if (/portfolio|personal.*url|additional.*link|website/i.test(l)) return p.portfolio || p.github || ''

    // ── "Please specify" follow-up text fields ────────────────────
    if (/please specify|specify.*below|please.*provide/i.test(l)) return ''

    // ── Dropdown/radio fallback — pick first sensible option ──────
    if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
    if (options.length) return options[0]

    // ── Numeric fallback ──────────────────────────────────────────
    if (/year|count|how many|number/i.test(l)) return String(jp.yearsExp || '2')

    // ── Plain text: return empty rather than garbage ───────────────
    return ''
  }

  /* ═══════════════════════════════════════════════════════════
     FILL ONE STEP
  ═══════════════════════════════════════════════════════════ */
  // Detect video-prompt steps — we can't answer these, skip the whole job
  function isVideoPromptStep(pane) {
    if (!pane) return false
    const text = pane.innerText || ''
    return (
      /record.*video|video.*response|video.*answer|video.*question|video.*interview/i.test(text) ||
      !!pane.querySelector('video, [class*="video-record"], [class*="video-prompt"]')
    )
  }

  // Detect if current modal step is about work/job experience
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
      { sel: 'input[id*="firstName"],input[aria-label*="First name"],input[aria-label*="first name"]', val: p.fullName?.split(' ')[0] },
      { sel: 'input[id*="lastName"],input[aria-label*="Last name"],input[aria-label*="last name"]',     val: p.fullName?.split(' ').slice(1).join(' ') },
      { sel: 'input[type="tel"],input[id*="phone"],input[id*="phoneNumber"],input[aria-label*="Phone"]', val: p.phone },
      { sel: 'input[id*="city"],input[aria-label*="City"],input[aria-label*="Location"]',               val: p.location },
      { sel: 'input[id*="linkedin"],input[aria-label*="LinkedIn"],input[placeholder*="linkedin"],input[aria-label*="Profile URL"]', val: p.linkedin },
      { sel: 'input[id*="github"],input[aria-label*="GitHub"],input[placeholder*="github"]',            val: p.github },
      { sel: 'input[id*="website"],input[id*="portfolio"],input[aria-label*="Website"],input[aria-label*="Portfolio"],input[aria-label*="Additional"],input[aria-label*="Personal URL"]', val: p.portfolio || p.github },
    ]
    for (const { sel, val } of contacts) {
      const el = pane.querySelector(sel)
      if (!el) continue
      // Use profile value first; fall back to any AI answer that matches this field
      let useVal = val || null
      if (!useVal) {
        const elLabel = (
          pane.querySelector(`label[for="${el.id}"]`)?.innerText?.trim() ||
          el.getAttribute('aria-label') ||
          el.placeholder || ''
        )
        if (elLabel) {
          const hit = aiAnswers.find(a =>
            normalizeLabel(elLabel).includes(normalizeLabel(a.label || '').slice(0, 20)) ||
            normalizeLabel(a.label || '').includes(normalizeLabel(elLabel).slice(0, 20))
          )
          useVal = hit?.answer || null
        }
      }
      if (useVal && (force || !el.value)) await fillField(el, useVal)
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

      // Compute select options and radio options separately so a fieldset
      // that contains BOTH a text/tel input AND radios (e.g. LinkedIn's
      // "Primary Phone Number" + "Type" in the same form element) gets the
      // right answer for each: phone field gets profile/AI phone value,
      // radio gets "Mobile" etc.
      const selectOptions = [...fs.querySelectorAll('option')].map(o => o.text).filter(Boolean)
      const radioInputs   = [...fs.querySelectorAll('input[type=radio]')]
      const radioOptions  = radioInputs.map(r =>
        document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
        r.closest('label')?.innerText?.trim()
      ).filter(Boolean)
      const allOptions = [...selectOptions, ...radioOptions]

      const aiMatch = aiAnswers.find(a =>
        labelTxt.toLowerCase().includes((a.label || '').toLowerCase().slice(0, 35)) ||
        (a.label || '').toLowerCase().includes(labelTxt.toLowerCase().slice(0, 35))
      )
      // answer used for select/text fields (no radio options polluting it)
      const answer      = aiMatch?.answer || smartDefault(labelTxt, selectOptions)
      // radioAnswer uses radio option labels so smartDefault can match them
      const radioAnswer = aiMatch?.answer || smartDefault(labelTxt, radioOptions.length ? radioOptions : allOptions)

      // Checkboxes — answer is comma-separated option labels to check
      const checkboxes = [...fs.querySelectorAll('input[type=checkbox]')]
      if (checkboxes.length) {
        if (answer && !/^none$/i.test(answer)) {
          const toCheck = answer.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          for (const cb of checkboxes) {
            const cbLbl = (
              document.querySelector(`label[for="${cb.id}"]`)?.innerText?.trim() ||
              cb.closest('label')?.innerText?.trim() || ''
            ).toLowerCase()
            const shouldCheck = toCheck.some(v =>
              cbLbl.includes(v) || v.includes(cbLbl.slice(0, 20))
            )
            if (shouldCheck && !cb.checked) { cb.click(); await jitter(80, 150) }
            if (!shouldCheck && cb.checked && force) { cb.click(); await jitter(80, 150) }
          }
        }
        await jitter(60, 100)
        continue
      }

      // Date / month pickers — ensure value is in the correct format
      const dateEl = fs.querySelector('input[type=date], input[type=month]')
      if (dateEl && (force || !dateEl.value || hasError)) {
        const fmt = dateEl.type === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'
        // If AI answer looks like a date use it, otherwise default to 2 weeks out
        const dateVal = /\d{4}-\d{2}/.test(answer) ? answer : futureDate(14, fmt)
        await fillField(dateEl, dateVal)
        continue
      }

      // Text / select / textarea / number
      // NOTE: no `continue` here — fall through so radios in the same fieldset
      // are also handled (e.g. phone type radio co-located with tel input).
      const textEl = fs.querySelector(
        'input:not([type=radio]):not([type=checkbox]):not([type=date]):not([type=month]):not([type=hidden]), select, textarea'
      )
      if (textEl) {
        // For tel/phone inputs prefer the profile phone value, then AI, then smartDefault
        const isPhoneField = textEl.type === 'tel' ||
          /phone|mobile/i.test(labelTxt) ||
          /phone/i.test(textEl.id || textEl.getAttribute('aria-label') || '')
        const phoneVal = isPhoneField ? (p.phone || null) : null
        // If profile phone is missing but AI returned one, use it
        const phoneAiAnswer = isPhoneField && !phoneVal
          ? (aiMatch?.answer || null)
          : null
        const finalTextAnswer = phoneVal || phoneAiAnswer || answer
        if (finalTextAnswer && (force || !textEl.value || hasError))
          await fillField(textEl, finalTextAnswer)
        // Do NOT continue — fall through to handle radios in same fieldset
      }

      // Radio (runs even when textEl was also present above)
      if (radioInputs.length && (force || !radioInputs.some(r => r.checked))) {
        let picked = false
        const ansLower = radioAnswer.toLowerCase()
        for (const r of radioInputs) {
          const rLbl = (
            document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
            r.closest('label')?.innerText?.trim() || ''
          ).toLowerCase()
          // Match: answer text contains label OR label contains answer text
          if (rLbl.includes(ansLower.slice(0, 25)) || ansLower.includes(rLbl.slice(0, 25))) {
            simulateClick(r); await jitter(100, 200); picked = true; break
          }
        }
        if (!picked && force) { simulateClick(radioInputs[0]); await jitter(100, 200) }
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

    // ── Broad checkbox sweep ─────────────────────────────────────────────
    // Catches Greenhouse-embedded forms and any layout that doesn't use
    // fieldset / [class*="form-element"] wrappers (the main loop above misses these).
    const allCbs = [...pane.querySelectorAll('input[type=checkbox]')]
    const cbGroupsSeen = new Set()

    for (const cb of allCbs) {
      // Find the tightest ancestor that contains multiple checkboxes
      let container = cb.parentElement
      while (container && container !== pane) {
        if ([...container.querySelectorAll('input[type=checkbox]')].length > 1) break
        container = container.parentElement
      }
      if (!container || container === pane || cbGroupsSeen.has(container)) continue
      cbGroupsSeen.add(container)

      // Already handled by the fieldset loop above?
      if (container.matches('fieldset, [class*="form-element"]')) continue

      // Extract group label from legends, unlabelled label, heading, or first text node
      const groupLabel = (
        container.querySelector('legend')?.innerText?.trim() ||
        container.querySelector('h1,h2,h3,h4,h5')?.innerText?.trim() ||
        // A <label> that isn't paired to an input (acts as a group heading)
        [...container.querySelectorAll('label')].find(l => !l.htmlFor && !l.querySelector('input'))?.innerText?.trim() ||
        container.querySelector('[class*="label"],[class*="title"],[class*="heading"]')?.innerText?.trim() ||
        ''
      )
      if (!groupLabel) continue

      const groupCbs = [...container.querySelectorAll('input[type=checkbox]')]
      const options  = groupCbs.map(c =>
        document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() ||
        c.closest('label')?.innerText?.trim() || c.value || ''
      ).filter(Boolean)

      const aiMatch = aiAnswers.find(a =>
        groupLabel.toLowerCase().includes((a.label || '').toLowerCase().slice(0, 35)) ||
        (a.label || '').toLowerCase().includes(groupLabel.toLowerCase().slice(0, 35))
      )
      const answer = aiMatch?.answer || smartDefault(groupLabel, options)
      if (!answer || /^none$/i.test(answer)) continue

      const toCheck = answer.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      let anyChecked = false
      for (const c of groupCbs) {
        const lbl = (
          document.querySelector(`label[for="${c.id}"]`)?.innerText?.trim() ||
          c.closest('label')?.innerText?.trim() || ''
        ).toLowerCase()
        const shouldCheck = toCheck.some(v => lbl.includes(v) || v.includes(lbl.slice(0, 25)))
        if (shouldCheck && !c.checked) { simulateClick(c); await jitter(80, 160); anyChecked = true }
        if (!shouldCheck && c.checked && force) { simulateClick(c); await jitter(80, 160) }
      }
      // If nothing matched, check the safest-looking option (LinkedIn > Other > first)
      if (!anyChecked && force) {
        const safe =
          groupCbs.find(c => /linkedin/i.test(c.closest('label')?.innerText || '')) ||
          groupCbs.find(c => /other/i.test(c.closest('label')?.innerText    || '')) ||
          groupCbs[0]
        if (safe && !safe.checked) { simulateClick(safe); await jitter(80, 160) }
      }
      await jitter(60, 120)
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Broad radio sweep ────────────────────────────────────────────────
    // Mirrors the broad checkbox sweep above. Catches radio groups that sit
    // outside standard fieldset/[class*="form-element"] wrappers — e.g.
    // LinkedIn's "Type" radio for phone number when it renders separately.
    // Groups radios by name attribute (same name = same group).
    const radioGroupMap = new Map()
    for (const r of pane.querySelectorAll('input[type=radio]')) {
      const key = r.name || r.id
      if (!key) continue
      if (!radioGroupMap.has(key)) radioGroupMap.set(key, [])
      radioGroupMap.get(key).push(r)
    }
    for (const [, groupRadios] of radioGroupMap) {
      // Skip if already handled (i.e. already checked) or inside a standard wrapper
      if (groupRadios.some(r => r.checked)) continue
      const wrapper = groupRadios[0].closest('fieldset, [class*="form-element"]')
      if (wrapper) continue   // already covered by fieldset loop above

      // Find a label for this group from surrounding DOM
      const container = (() => {
        let el = groupRadios[0].parentElement
        while (el && el !== pane) {
          if ([...el.querySelectorAll('input[type=radio]')].length >= groupRadios.length) return el
          el = el.parentElement
        }
        return null
      })()
      if (!container) continue

      const groupLabel = (
        container.querySelector('legend')?.innerText?.trim() ||
        container.querySelector('h1,h2,h3,h4,h5')?.innerText?.trim() ||
        [...container.querySelectorAll('label')].find(l => !l.htmlFor && !l.querySelector('input'))?.innerText?.trim() ||
        container.querySelector('[class*="label"],[class*="title"],[class*="heading"]')?.innerText?.trim() ||
        'type'
      )
      const groupOptions = groupRadios.map(r =>
        document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
        r.closest('label')?.innerText?.trim() || r.value || ''
      ).filter(Boolean)

      const aiMatchR = aiAnswers.find(a =>
        groupLabel.toLowerCase().includes((a.label || '').toLowerCase().slice(0, 35)) ||
        (a.label || '').toLowerCase().includes(groupLabel.toLowerCase().slice(0, 35))
      )
      const radioAns = (aiMatchR?.answer || smartDefault(groupLabel, groupOptions)).toLowerCase()

      let picked = false
      for (const r of groupRadios) {
        const rLbl = (
          document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
          r.closest('label')?.innerText?.trim() || ''
        ).toLowerCase()
        if (rLbl.includes(radioAns.slice(0, 25)) || radioAns.includes(rLbl.slice(0, 25))) {
          simulateClick(r); await jitter(80, 160); picked = true; break
        }
      }
      if (!picked && (force || !groupRadios.some(r => r.checked))) {
        simulateClick(groupRadios[0]); await jitter(80, 160)
      }
      await jitter(60, 120)
    }
    // ─────────────────────────────────────────────────────────────────────
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

  // Dismiss the post-apply success modal AND any follow-up upsell dialogs LinkedIn
  // shows (e.g. "Turn your resume into a profile", premium prompts, etc.).
  // Loops up to 4 times so nested overlays are cleared one by one.
  async function dismissSuccess() {
    await jitter(700, 1100)

    for (let pass = 0; pass < 4; pass++) {
      // Standard "Done" / "Dismiss" button on the success modal
      const done =
        document.querySelector('button[aria-label="Dismiss"]') ||
        document.querySelector('button[aria-label="Done"]')    ||
        [...document.querySelectorAll('button')].find(b =>
          /^(done|got it|close|ok)$/i.test(b.textContent?.trim())
        )
      if (done) { done.click(); await jitter(500, 800); continue }

      // LinkedIn upsell / promo dialogs — "Not now", "Skip", "Maybe later", "No thanks"
      const skip = [...document.querySelectorAll('button')].find(b =>
        /not now|skip|maybe later|no.?thanks|remind me later/i.test(b.textContent?.trim())
      )
      if (skip) { skip.click(); await jitter(500, 800); continue }

      // Any remaining visible modal/overlay that has a close-ish button
      const anyX = [...document.querySelectorAll('button')].find(b => {
        const lbl = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase().trim()
        return lbl === 'dismiss' || lbl === '×' || lbl === '✕' || lbl === 'close'
      })
      if (anyX) { anyX.click(); await jitter(500, 800); continue }

      break  // nothing left to dismiss
    }
  }

  // Proactively clear any post-apply overlays that might still be open before
  // we try to start a new Easy Apply.  Called in autoApplyLoop just before
  // simulateClick(easyApplyBtn).
  async function clearPostApplyOverlays() {
    // If no blocking overlay is visible, return immediately
    const overlayVisible = !!(
      document.querySelector('.jobs-post-apply-modal') ||
      document.querySelector('[data-test-modal-id="post-apply-modal"]') ||
      [...document.querySelectorAll('h2, h3, h4')].find(h =>
        /application was sent|application submitted|you applied|turn your resume|update.*profile|profile that recruiter/i.test(h.textContent)
      )
    )
    if (!overlayVisible) return

    log('Clearing post-apply overlay before next job…')
    await dismissSuccess()
    await jitter(400, 700)
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

      // Video-prompt step — we can't answer these, skip the whole job
      if (isVideoPromptStep(pane)) {
        log('⚠ Video prompt detected — skipping this job')
        await closeModal()
        return 'skipped'
      }

      if (hasUpload) {
        log(`Step ${stepCount + 1}: resume — using existing`)
        await jitter(500, 800)
      } else if (isWorkExperienceStep(pane)) {
        log(`Step ${stepCount + 1}: work experience — passing through (LinkedIn pre-fills)`)
        await jitter(500, 800)
      } else {
        // ── Per-step AI: get answers for any questions not yet covered ──
        const stepQs = extractQuestions()
        const newQs  = stepQs.filter(q =>
          !aiAnswers.some(a =>
            (a.label || '').toLowerCase().includes(q.label.toLowerCase().slice(0, 30)) ||
            q.label.toLowerCase().includes((a.label || '').toLowerCase().slice(0, 30))
          )
        )
        if (newQs.length) {
          log(`Step ${stepCount + 1}: ${newQs.length} new question(s) — asking AI…`)
          const res = await sendMsg('TAILOR', {
            jobTitle:       currentJob?.jobTitle,
            company:        currentJob?.company,
            jobDescription: currentJob?.jobDescription,
            questions:      newQs,
          })
          if (res.answers?.length) {
            aiAnswers = [...aiAnswers, ...res.answers]
            log(`AI answered ${res.answers.length} new question(s)`)
          }
        }
        // ──────────────────────────────────────────────────────────────
        log(`Step ${stepCount + 1}: filling fields`)
        await fillStep()
        await jitter(350, 600)
      }

      // If there are validation errors, retry up to 3 times with force-fill,
      // then escalate to AI deep-analysis as a final attempt.
      if (hasErrors()) {
        let fixed = false
        for (let attempt = 1; attempt <= 3; attempt++) {
          log(`Step ${stepCount + 1}: fixing errors (attempt ${attempt}/3)`)
          await fillStep(true)
          await jitter(400, 700)
          if (!hasErrors()) { fixed = true; break }
        }

        // ── AI deep-analysis fallback ────────────────────────────
        if (!fixed) {
          log(`Step ${stepCount + 1}: escalating to AI deep analysis…`)
          const stepPane   = getFormPane()
          const stepFields = describeFormStep(stepPane)
          const errorFields = stepFields.filter(f => f.hasError).map(f => f.label)
          const res = await sendMsg('AI_ANALYZE_STEP', {
            jobTitle:    currentJob?.jobTitle,
            company:     currentJob?.company,
            stepFields,
            errorFields,
          })
          if (res.answers?.length) {
            // Merge AI's deep answers over the existing aiAnswers
            for (const a of res.answers) {
              const idx = aiAnswers.findIndex(x =>
                x.label?.toLowerCase() === a.label?.toLowerCase()
              )
              if (idx >= 0) aiAnswers[idx] = a
              else aiAnswers.push(a)
            }
            log(`AI suggested ${res.answers.length} answers — re-filling…`)
            await fillStep(true)
            await jitter(500, 800)
            if (!hasErrors()) { fixed = true }
          }
        }
        // ────────────────────────────────────────────────────────

        if (!fixed) {
          log('⚠ Could not fix required fields even with AI analysis — skipping')
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
     PAGINATION & SIMILAR-TITLE SEARCH
  ═══════════════════════════════════════════════════════════ */
  const RESUME_KEY = 'reblet_autoresume'

  // Click LinkedIn's "Next page" button and wait for fresh cards.
  async function tryNextPage() {
    const nextBtn =
      document.querySelector('[aria-label="View next page"]') ||
      document.querySelector('[aria-label="Next"]') ||
      document.querySelector('.artdeco-pagination__button--next:not([disabled])') ||
      [...document.querySelectorAll('[class*="pagination"] button, nav button')].find(b =>
        !b.disabled && /next/i.test(b.getAttribute('aria-label') || b.textContent)
      )

    if (!nextBtn || nextBtn.disabled) return false

    log('Moving to next page of results…')
    nextBtn.scrollIntoView({ block: 'center' })
    await jitter(700, 1100)
    nextBtn.click()
    await jitter(2500, 4000)

    for (let i = 0; i < 16; i++) {
      if (pendingCards().length > 0) return true
      await sleep(500)
    }
    return false
  }

  // Return alternative titles to try when the current search runs dry.
  function getSimilarTitles(keywords) {
    if (!keywords) return []
    const k = keywords.toLowerCase().trim()
    const MAP = [
      ['software engineer',        ['software developer', 'full stack engineer', 'backend engineer', 'frontend engineer', 'web developer']],
      ['software developer',       ['software engineer', 'full stack developer', 'backend developer', 'web developer']],
      ['backend engineer',         ['backend developer', 'server-side engineer', 'api developer', 'software engineer']],
      ['backend developer',        ['backend engineer', 'server-side developer', 'software developer', 'software engineer']],
      ['frontend engineer',        ['frontend developer', 'ui engineer', 'web developer', 'software engineer']],
      ['frontend developer',       ['frontend engineer', 'ui developer', 'web developer', 'software developer']],
      ['full stack engineer',      ['full stack developer', 'software engineer', 'web developer']],
      ['full stack developer',     ['full stack engineer', 'software developer', 'web developer']],
      ['web developer',            ['software developer', 'frontend developer', 'full stack developer', 'ui developer']],
      ['data engineer',            ['analytics engineer', 'etl developer', 'data pipeline engineer', 'software engineer']],
      ['data analyst',             ['business analyst', 'data scientist', 'analytics analyst', 'reporting analyst']],
      ['data scientist',           ['machine learning engineer', 'data analyst', 'ml engineer', 'ai engineer']],
      ['machine learning engineer',['ml engineer', 'ai engineer', 'data scientist', 'software engineer']],
      ['ml engineer',              ['machine learning engineer', 'ai engineer', 'data scientist']],
      ['devops engineer',          ['site reliability engineer', 'platform engineer', 'cloud engineer', 'infrastructure engineer']],
      ['sre',                      ['devops engineer', 'platform engineer', 'reliability engineer', 'cloud engineer']],
      ['platform engineer',        ['devops engineer', 'cloud engineer', 'infrastructure engineer', 'sre']],
      ['cloud engineer',           ['devops engineer', 'platform engineer', 'infrastructure engineer']],
      ['product manager',          ['technical product manager', 'product owner', 'program manager']],
      ['mobile developer',         ['ios developer', 'android developer', 'react native developer', 'mobile engineer']],
      ['mobile engineer',          ['mobile developer', 'ios developer', 'android developer', 'react native developer']],
      ['ios developer',            ['mobile developer', 'swift developer', 'mobile engineer', 'android developer']],
      ['android developer',        ['mobile developer', 'kotlin developer', 'mobile engineer', 'ios developer']],
      ['ux designer',              ['ui designer', 'product designer', 'user experience designer', 'ux researcher']],
      ['ui designer',              ['ux designer', 'product designer', 'visual designer', 'graphic designer']],
      ['qa engineer',              ['test engineer', 'quality assurance engineer', 'software tester', 'automation engineer']],
      ['security engineer',        ['cybersecurity engineer', 'information security engineer', 'security analyst']],
    ]
    for (const [pattern, alts] of MAP) {
      if (k.includes(pattern) || k === pattern) return alts
    }
    // Generic fallback: strip/add seniority, swap Engineer ↔ Developer
    const out = []
    const stripped = k.replace(/\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|associate)\s*/gi, '').trim()
    if (stripped && stripped !== k) out.push(stripped)
    if (!/senior|sr\./i.test(k)) out.push('Senior ' + keywords.trim())
    if (/engineer/i.test(k)) out.push(keywords.trim().replace(/engineer/gi, 'Developer'))
    if (/developer/i.test(k)) out.push(keywords.trim().replace(/developer/gi, 'Engineer'))
    return [...new Set(out)].slice(0, 4)
  }

  // Persist bot counters so they survive same-domain navigation (title switch).
  function saveResumeState(triedTitles) {
    return new Promise(resolve => chrome.storage.local.set({
      [RESUME_KEY]: {
        autoResuming:    true,
        applied,
        skipped,
        triedTitles:     [...triedTitles],
        processedJobIds: [...processedJobIds],
        savedAt:         Date.now(),
      }
    }, resolve))
  }

  function loadResumeState() {
    return new Promise(resolve => chrome.storage.local.get(RESUME_KEY, result => {
      const s = result[RESUME_KEY]
      if (!s || !s.autoResuming) return resolve(null)
      if (Date.now() - (s.savedAt || 0) > 45000) {
        chrome.storage.local.remove(RESUME_KEY); return resolve(null)
      }
      resolve(s)
    }))
  }

  function clearResumeState() {
    return new Promise(resolve => chrome.storage.local.remove(RESUME_KEY, resolve))
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════════════════════════ */
  async function autoApplyLoop(triedTitles = new Set()) {
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
          // ── 1. Try next page ──────────────────────────────────
          const nextPageOk = await tryNextPage()
          if (nextPageOk) { log('Next page loaded — continuing…'); continue }

          // ── 2. Try a similar job title ─────────────────────────
          const url = new URL(window.location.href)
          const currentKeywords = url.searchParams.get('keywords') || ''
          const alts = getSimilarTitles(currentKeywords)
            .filter(t => !triedTitles.has(t.toLowerCase()))

          if (alts.length) {
            const nextTitle = alts[0]
            triedTitles.add(nextTitle.toLowerCase())
            log(`No more jobs for "${currentKeywords || 'this search'}" — trying "${nextTitle}"…`)
            await saveResumeState(triedTitles)
            url.searchParams.set('keywords', nextTitle)
            url.searchParams.set('f_AL', 'true')
            window.location.href = url.toString()
            return   // page will reload; state is saved and will auto-resume
          }

          // ── 3. Truly exhausted ────────────────────────────────
          log(`All searches exhausted — Applied: ${applied}  Skipped: ${skipped}`)
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

      // Clear any post-apply overlays left over from the previous application
      // (LinkedIn "Turn your resume into a profile" upsell, success banner, etc.)
      // that would block the new Easy Apply modal from opening.
      await clearPostApplyOverlays()

      log(`Clicking: "${easyApplyBtn.getAttribute('aria-label') || easyApplyBtn.textContent?.trim()}"`)
      simulateClick(easyApplyBtn)

      // Wait for modal to actually open BEFORE doing anything else
      log('Waiting for modal…')
      let modalOpened = await waitFor(isModalOpen, 7000)

      // If modal didn't open, a lingering overlay may have swallowed the click.
      // Clear overlays and retry once.
      if (!modalOpened) {
        await clearPostApplyOverlays()
        await jitter(400, 700)
        simulateClick(easyApplyBtn)
        modalOpened = await waitFor(isModalOpen, 6000)
      }

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
        // First check shared question DB for known answers
        const knownAnswers = []
        const dbRes = await sendMsg('LOOKUP_QUESTIONS', { labels: questions.map(q => q.label) })
        if (dbRes.answers?.length) {
          knownAnswers.push(...dbRes.answers)
          log(`DB: found ${dbRes.answers.length} known answer(s)`)
        }

        // Only ask AI for questions NOT already in DB (or low confidence)
        const questionsForAI = questions.filter(q =>
          !knownAnswers.some(a => normalizeLabel(a.label) === normalizeLabel(q.label) && a.confidence >= 5)
        )

        if (questionsForAI.length) {
          log(`${questionsForAI.length} question(s) — asking AI…`)
          const res = await sendMsg('TAILOR', {
            jobTitle:       jobData.jobTitle,
            company:        jobData.company,
            jobDescription: jobData.jobDescription,
            questions:      questionsForAI,
          })
          aiAnswers = [...knownAnswers.map(a => ({ label: a.label, answer: a.answer })), ...(res.answers || [])]
          log(`AI answered ${res.answers?.length || 0} question(s)`)
        } else {
          aiAnswers = knownAnswers.map(a => ({ label: a.label, answer: a.answer }))
          log(`All ${questions.length} question(s) answered from DB`)
        }
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
        // Save questions+answers to shared DB for future users
        if (aiAnswers.length) {
          const toSave = aiAnswers
            .filter(a => a.label && a.answer)
            .map(a => ({
              label:   a.label,
              type:    questions.find(q => q.label === a.label)?.type || 'text',
              options: questions.find(q => q.label === a.label)?.options || [],
              answer:  a.answer,
            }))
          if (toSave.length) sendMsg('SAVE_QUESTIONS', { questions: toSave })
        }
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
  async function maybeShowPanel() {
    if (!location.pathname.startsWith('/jobs')) return
    if (!panel) buildPanel()

    // Auto-resume after a title-switch navigation
    const saved = await loadResumeState()
    if (saved) {
      applied         = saved.applied  || 0
      skipped         = saved.skipped  || 0
      processedJobIds = new Set(saved.processedJobIds || [])
      const triedTitles = new Set(saved.triedTitles   || [])
      await clearResumeState()
      logLines = []; currentJob = null
      isRunning = true; isPaused = false
      renderPanel()
      log(`↩ Resumed — applied so far: ${applied}`)
      autoApplyLoop(triedTitles)
    }
  }

  setTimeout(maybeShowPanel, 1500)
  new MutationObserver(() => {
    if (location.pathname.startsWith('/jobs') && !panel) buildPanel()
  }).observe(document.body, { childList: true, subtree: false })
})()
