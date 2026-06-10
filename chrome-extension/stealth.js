/* ════════════════════════════════════════════════════════════════════════════
   REBLET STEALTH MODULE — Human-Emulation & Anti-Detection Layer
   ──────────────────────────────────────────────────────────────────────────
   ONE BIG FILE consolidating every known technique to make the bot look like
   a real human user to LinkedIn's bot-detection systems.

   This module exposes:
     globalThis.REBLET_STEALTH = {
       humanDelay(min, max)         — randomized + skewed delay
       humanType(el, text)           — variable-speed typing with occasional "mistakes"
       humanClick(el)                — move-cursor-first, jitter-pixel click
       humanScroll(el)               — natural scroll with momentum
       readPause(text)               — pause proportional to text length
       sessionGuard()                — enforces daily caps + idle periods
       diversifyAnswer(text)         — slightly rewords seeded answers per use
       triggerHumanSignals()         — emits focus/blur/mousemove events periodically
       isSafeTime()                  — checks current time is within normal hours
       getApplicationGap()           — calculates how long to wait before next job
       randomBrowseAction()          — performs a fake browse action (hover/scroll)
     }

   Load order in manifest: stealth.js BEFORE content.js so it's available.

   SECTIONS:
     §1.  Randomization helpers
     §2.  Human delay distributions
     §3.  Mouse movement simulation
     §4.  Click humanization
     §5.  Keystroke timing & typing mistakes
     §6.  Scroll behavior emulation
     §7.  Reading time calculation
     §8.  Session management & daily caps
     §9.  Idle period enforcement
     §10. Answer text diversification
     §11. Focus / blur / visibility events
     §12. Time-of-day safety
     §13. Application pacing
     §14. Random browse actions (hover, scroll while reading)
     §15. Browser fingerprint normalization
     §16. Network rate limiting
     §17. Public API export
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ════════════════════════════════════════════════════════════════════════
  //  §1. RANDOMIZATION HELPERS
  //      Real humans don't have uniform distributions. We use a blend of
  //      Gaussian + log-normal to mimic real attention patterns.
  // ════════════════════════════════════════════════════════════════════════
  function randUniform(min, max) {
    return min + Math.random() * (max - min)
  }

  function randGaussian(mean, stdDev) {
    // Box-Muller transform
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return mean + z * stdDev
  }

  function randLogNormal(mean, sigma) {
    const z = randGaussian(0, 1)
    return Math.exp(mean + sigma * z)
  }

  function randSkewed(min, max, skew = 1.5) {
    // Skewed toward min — humans pause briefly more often than they pause long
    const u = Math.random()
    return min + (max - min) * Math.pow(u, skew)
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v))
  }

  function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function shuffle(arr) {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §2. HUMAN DELAY DISTRIBUTIONS
  //      Each "delay" call uses a different distribution depending on context
  //      — clicking a button vs. reading a question vs. typing a word.
  // ════════════════════════════════════════════════════════════════════════
  const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)))

  // Generic human delay — log-normal, peaks at ~1.2x the floor
  async function humanDelay(minMs, maxMs) {
    const mean   = (Math.log(minMs) + Math.log(maxMs)) / 2
    const sigma  = (Math.log(maxMs) - Math.log(minMs)) / 4
    const value  = clamp(randLogNormal(mean, sigma), minMs, maxMs)
    return sleep(value)
  }

  // Quick reaction delay — like clicking a button you just identified
  async function reactDelay() {
    return sleep(clamp(randGaussian(280, 90), 150, 600))
  }

  // Decision delay — like picking a dropdown value
  async function decisionDelay() {
    return sleep(clamp(randGaussian(900, 350), 400, 2200))
  }

  // Reading delay — proportional to text length but bounded
  async function readingDelay(textLength) {
    // ~250 wpm = ~24 chars/sec when actively reading. Skim = ~50 chars/sec.
    const minMs = clamp(textLength * 18, 600, 9000)
    const maxMs = clamp(textLength * 42, 1200, 18000)
    return humanDelay(minMs, maxMs)
  }

  // Long pondering delay — happens occasionally for "hard" questions
  async function ponderDelay() {
    return sleep(clamp(randGaussian(3500, 1100), 1800, 7500))
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §3. MOUSE MOVEMENT SIMULATION
  //      Bots traditionally click without moving. Real users have cursor
  //      trails. We dispatch mousemove events along a curved path to the
  //      target before clicking.
  // ════════════════════════════════════════════════════════════════════════
  let _cursorX = 200
  let _cursorY = 200

  function _bezierPoint(t, p0, p1, p2) {
    const oneMinusT = 1 - t
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2
  }

  async function moveCursorTo(targetX, targetY, durationMs = null) {
    durationMs = durationMs || clamp(randGaussian(420, 140), 200, 900)
    const startX = _cursorX
    const startY = _cursorY
    const distance = Math.hypot(targetX - startX, targetY - startY)

    // Skip animation for very short distances
    if (distance < 5) {
      _cursorX = targetX
      _cursorY = targetY
      return
    }

    // Control point for curve — offset perpendicular to the path
    const midX = (startX + targetX) / 2
    const midY = (startY + targetY) / 2
    const perpX = -(targetY - startY) / distance
    const perpY =  (targetX - startX) / distance
    const offset = randUniform(-30, 30)
    const ctrlX = midX + perpX * offset
    const ctrlY = midY + perpY * offset

    const steps = clamp(Math.round(distance / 14), 8, 60)
    const stepMs = durationMs / steps

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Ease in-out curve
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const x = _bezierPoint(easedT, startX, ctrlX, targetX) + randUniform(-1.5, 1.5)
      const y = _bezierPoint(easedT, startY, ctrlY, targetY) + randUniform(-1.5, 1.5)

      try {
        const evt = new MouseEvent('mousemove', {
          bubbles: true, cancelable: true,
          view: window,
          clientX: x, clientY: y,
          screenX: x, screenY: y,
        })
        const el = document.elementFromPoint(x, y)
        if (el) el.dispatchEvent(evt)
      } catch (e) { /* ignore — some pages block synthetic events */ }

      _cursorX = x
      _cursorY = y
      if (i < steps) await sleep(stepMs)
    }

    _cursorX = targetX
    _cursorY = targetY
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §4. CLICK HUMANIZATION
  //      Real clicks have: hover delay, slight pixel jitter, mousedown delay
  //      before mouseup, and occasionally a brief overshoot.
  // ════════════════════════════════════════════════════════════════════════
  async function humanClick(el) {
    if (!el || !el.getBoundingClientRect) {
      if (el?.click) el.click()
      return
    }

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      if (el.click) el.click()
      return
    }

    // Pick a click point — not the exact center, slightly off
    const jitterX = randGaussian(0, rect.width * 0.18)
    const jitterY = randGaussian(0, rect.height * 0.18)
    const clickX = clamp(rect.left + rect.width / 2 + jitterX, rect.left + 2, rect.right - 2)
    const clickY = clamp(rect.top + rect.height / 2 + jitterY, rect.top + 2, rect.bottom - 2)

    // Move cursor to target with curve
    await moveCursorTo(clickX, clickY)

    // Brief hover pause
    await sleep(clamp(randGaussian(95, 35), 40, 220))

    // mousedown
    try {
      el.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, view: window,
        clientX: clickX, clientY: clickY, button: 0,
      }))
    } catch (e) {}

    // Hold for a moment (mouse-down to mouse-up gap)
    await sleep(clamp(randGaussian(72, 28), 35, 180))

    // mouseup + click
    try {
      el.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, view: window,
        clientX: clickX, clientY: clickY, button: 0,
      }))
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: window,
        clientX: clickX, clientY: clickY, button: 0,
      }))
    } catch (e) {
      if (el.click) el.click()
    }

    // Fallback for cases where synthetic events don't work
    if (el.click) {
      try { el.click() } catch (e) {}
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §5. KEYSTROKE TIMING & TYPING MISTAKES
  //      Real typing has: per-character delays based on bigram frequency,
  //      occasional pauses mid-word, rare "mistakes" with correction.
  // ════════════════════════════════════════════════════════════════════════
  // Common bigram frequencies for English (lower = faster typed)
  const BIGRAM_SPEED = {
    'th': 0.7, 'he': 0.7, 'in': 0.8, 'er': 0.75, 'an': 0.8,
    're': 0.78, 'on': 0.82, 'at': 0.85, 'en': 0.85, 'nd': 0.85,
    'ti': 0.88, 'es': 0.88, 'or': 0.9, 'te': 0.9, 'of': 0.9,
    'ed': 0.92, 'is': 0.92, 'it': 0.92, 'al': 0.94, 'ar': 0.94,
    'st': 0.96, 'to': 0.96, 'nt': 0.98, 'ng': 0.98, 'se': 1.0,
  }

  function keystrokeDelayMs(prevChar, curChar) {
    let baseMs = clamp(randGaussian(95, 28), 50, 200)
    const bigram = (prevChar + curChar).toLowerCase()
    if (BIGRAM_SPEED[bigram] !== undefined) {
      baseMs *= BIGRAM_SPEED[bigram]
    }
    // Spaces are quick
    if (curChar === ' ') baseMs *= 0.75
    // Capital letters are slightly slower (shift key)
    if (curChar !== curChar.toLowerCase()) baseMs *= 1.25
    // Punctuation slightly slower
    if (/[.,!?;:]/.test(curChar)) baseMs *= 1.4
    return baseMs
  }

  // Occasionally inject a typo + correction
  function shouldMakeTypo() {
    return Math.random() < 0.02  // 2% chance per character on long texts
  }

  function nearbyKey(c) {
    const map = {
      a: 'sqz', b: 'vghn', c: 'xdv', d: 'sfec', e: 'wrd',
      f: 'dgrt', g: 'fhty', h: 'gjyu', i: 'uok', j: 'hkui',
      k: 'jlio', l: 'kop', m: 'nj,', n: 'bmhj', o: 'ipkl',
      p: 'ol;', q: 'wa', r: 'etdf', s: 'adwe', t: 'rygf',
      u: 'yihj', v: 'cbfg', w: 'qesa', x: 'zcsd', y: 'tuhg',
      z: 'xas',
    }
    const lower = c.toLowerCase()
    const neighbors = map[lower]
    if (!neighbors) return c
    return pickOne(neighbors.split(''))
  }

  async function humanType(el, text) {
    if (!el || !text) return
    el.focus()
    await sleep(clamp(randGaussian(120, 40), 60, 260))

    let prevChar = ' '
    for (let i = 0; i < text.length; i++) {
      const c = text[i]

      // Maybe make a typo (only on long-ish text)
      if (text.length > 20 && shouldMakeTypo() && i > 2 && /[a-zA-Z]/.test(c)) {
        const wrongChar = nearbyKey(c)
        await _typeChar(el, wrongChar, prevChar)
        await sleep(clamp(randGaussian(180, 50), 100, 400))
        // Realize the mistake
        await sleep(clamp(randGaussian(140, 40), 80, 300))
        // Backspace
        await _typeBackspace(el)
        await sleep(clamp(randGaussian(110, 40), 60, 250))
      }

      await _typeChar(el, c, prevChar)

      // Occasional mid-word pause (re-reading what you just wrote)
      if (Math.random() < 0.015 && i > 5) {
        await sleep(clamp(randGaussian(480, 200), 200, 1300))
      }

      prevChar = c
    }

    // Final settle pause
    await sleep(clamp(randGaussian(160, 60), 80, 400))

    // Fire change event so frameworks notice
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (e) {}
  }

  async function _typeChar(el, c, prevChar) {
    const delay = keystrokeDelayMs(prevChar, c)
    await sleep(delay)

    try {
      el.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: c, char: c,
      }))
    } catch (e) {}

    // Actually insert the character
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const oldVal = el.value || ''
      const start = el.selectionStart ?? oldVal.length
      const end   = el.selectionEnd   ?? oldVal.length
      el.value = oldVal.slice(0, start) + c + oldVal.slice(end)
      el.selectionStart = el.selectionEnd = start + 1
    } else if (el.isContentEditable) {
      document.execCommand('insertText', false, c)
    }

    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: c, inputType: 'insertText' }))
      el.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles: true, cancelable: true, key: c, char: c,
      }))
    } catch (e) {}
  }

  async function _typeBackspace(el) {
    try {
      el.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: 'Backspace',
      }))
    } catch (e) {}

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const val = el.value || ''
      const start = el.selectionStart ?? val.length
      if (start > 0) {
        el.value = val.slice(0, start - 1) + val.slice(start)
        el.selectionStart = el.selectionEnd = start - 1
      }
    }

    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }))
      el.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles: true, cancelable: true, key: 'Backspace',
      }))
    } catch (e) {}
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §6. SCROLL BEHAVIOR EMULATION
  //      Real users scroll with momentum — fast at first, slowing down.
  //      Multiple small scrolls beat one big jump.
  // ════════════════════════════════════════════════════════════════════════
  async function humanScroll(targetElement, distanceY = null) {
    const total = distanceY !== null ? distanceY : randUniform(200, 600)
    const steps = clamp(Math.round(Math.abs(total) / 60), 4, 18)
    const direction = total >= 0 ? 1 : -1
    const totalAbs = Math.abs(total)

    for (let i = 0; i < steps; i++) {
      // Ease-out — bigger scrolls at start, smaller at end
      const t = i / steps
      const stepSize = (totalAbs / steps) * (1.6 - t * 1.2)
      const delta = direction * stepSize

      if (targetElement && targetElement.scrollBy) {
        targetElement.scrollBy(0, delta)
      } else {
        window.scrollBy(0, delta)
      }

      await sleep(clamp(randGaussian(45, 12), 25, 110))
    }

    // Settle pause after scrolling
    await sleep(clamp(randGaussian(380, 130), 200, 850))
  }

  async function scrollIntoViewHuman(el) {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    // If element is already visible, no scroll needed
    if (rect.top > 50 && rect.bottom < viewportHeight - 50) return

    // Calculate distance to bring element to ~30% from top
    const target = rect.top - viewportHeight * 0.3
    await humanScroll(null, target)
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §7. READING TIME CALCULATION
  //      Pause time before answering proportional to how much text the user
  //      would actually need to read.
  // ════════════════════════════════════════════════════════════════════════
  async function readPause(text) {
    if (!text) return
    const len = String(text).length
    if (len < 5) {
      await sleep(clamp(randGaussian(280, 90), 150, 600))
      return
    }
    await readingDelay(len)
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §8. SESSION MANAGEMENT & DAILY CAPS
  //      Track per-day application count and enforce hard limits.
  //      Stored in chrome.storage.local so it persists across reloads.
  // ════════════════════════════════════════════════════════════════════════
  const CAPS = {
    perHour:     8,
    perSession:  25,
    perDay:      40,
    sessionGap:  35 * 60 * 1000,   // 35 min between sessions
    hourlyReset: 60 * 60 * 1000,
    dailyReset:  24 * 60 * 60 * 1000,
  }

  let _sessionState = {
    sessionStart: Date.now(),
    sessionCount: 0,
    hourCount:    0,
    hourStart:    Date.now(),
    dayCount:     0,
    dayStart:     Date.now(),
    lastApply:    0,
  }

  async function loadSessionState() {
    try {
      if (!chrome?.storage?.local) return
      const { reblet_session } = await chrome.storage.local.get('reblet_session')
      if (reblet_session) {
        _sessionState = { ..._sessionState, ...reblet_session }
        // Reset daily counters if a day has passed
        if (Date.now() - _sessionState.dayStart > CAPS.dailyReset) {
          _sessionState.dayCount = 0
          _sessionState.dayStart = Date.now()
        }
        // Reset hourly counters if an hour has passed
        if (Date.now() - _sessionState.hourStart > CAPS.hourlyReset) {
          _sessionState.hourCount = 0
          _sessionState.hourStart = Date.now()
        }
      }
    } catch (e) {}
  }

  async function saveSessionState() {
    try {
      if (!chrome?.storage?.local) return
      await chrome.storage.local.set({ reblet_session: _sessionState })
    } catch (e) {}
  }

  async function recordApplication() {
    _sessionState.sessionCount++
    _sessionState.hourCount++
    _sessionState.dayCount++
    _sessionState.lastApply = Date.now()
    await saveSessionState()
  }

  function sessionGuard() {
    // Returns { ok: bool, reason: string, waitMs: number }
    if (_sessionState.dayCount >= CAPS.perDay) {
      const waitMs = CAPS.dailyReset - (Date.now() - _sessionState.dayStart)
      return { ok: false, reason: 'daily cap reached', waitMs }
    }
    if (_sessionState.hourCount >= CAPS.perHour) {
      const waitMs = CAPS.hourlyReset - (Date.now() - _sessionState.hourStart)
      return { ok: false, reason: 'hourly cap reached', waitMs }
    }
    if (_sessionState.sessionCount >= CAPS.perSession) {
      return { ok: false, reason: 'session cap reached — take a break', waitMs: CAPS.sessionGap }
    }
    return { ok: true, reason: '', waitMs: 0 }
  }

  function resetSession() {
    _sessionState.sessionStart = Date.now()
    _sessionState.sessionCount = 0
    saveSessionState()
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §9. IDLE PERIOD ENFORCEMENT
  //      Long-running apply sessions get an enforced idle break every 25-30
  //      applications, to mimic a human getting up for water / a snack.
  // ════════════════════════════════════════════════════════════════════════
  async function maybeForcedBreak() {
    // Random 5-10% chance per application — micro break
    if (Math.random() < 0.06) {
      const breakMs = clamp(randGaussian(45000, 18000), 18000, 90000)
      return { taken: true, durationMs: breakMs, type: 'micro' }
    }
    // After 10+ apps in this session — larger chance
    if (_sessionState.sessionCount >= 10 && Math.random() < 0.18) {
      const breakMs = clamp(randGaussian(180000, 60000), 90000, 300000)
      return { taken: true, durationMs: breakMs, type: 'medium' }
    }
    return { taken: false, durationMs: 0, type: 'none' }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §10. ANSWER TEXT DIVERSIFICATION
  //       Don't send identical text in 50 cover letters. Apply subtle word-
  //       substitution to keep each instance unique without changing meaning.
  // ════════════════════════════════════════════════════════════════════════
  const SYNONYMS = {
    'strong':         ['solid', 'robust', 'firm', 'strong'],
    'great':          ['great', 'excellent', 'outstanding', 'remarkable'],
    'experience':     ['experience', 'background', 'expertise'],
    'team':           ['team', 'group', 'organization'],
    'team\'s':        ['team\'s', 'group\'s', 'organization\'s'],
    'work':           ['work', 'role', 'position'],
    'impact':         ['impact', 'influence', 'effect'],
    'opportunity':    ['opportunity', 'chance', 'role'],
    'company':        ['company', 'organization', 'firm'],
    'excited':        ['excited', 'enthusiastic', 'eager'],
    'passionate':     ['passionate', 'driven', 'committed'],
    'project':        ['project', 'initiative', 'effort'],
    'collaborate':    ['collaborate', 'partner', 'work together'],
    'collaboration':  ['collaboration', 'partnership', 'teamwork'],
    'contribute':     ['contribute', 'add', 'bring'],
    'deliver':        ['deliver', 'ship', 'produce'],
    'reliable':       ['reliable', 'dependable', 'consistent'],
    'quickly':        ['quickly', 'fast', 'rapidly'],
    'meaningful':     ['meaningful', 'significant', 'substantial'],
    'I am':           ['I am', 'I\'m'],
    'I have':         ['I have', 'I\'ve'],
    'I would':        ['I would', 'I\'d'],
    'do not':         ['do not', 'don\'t'],
    'cannot':         ['cannot', 'can\'t'],
    'will not':       ['will not', 'won\'t'],
  }

  function diversifyAnswer(text) {
    if (!text || typeof text !== 'string' || text.length < 30) return text
    let out = text
    for (const [word, options] of Object.entries(SYNONYMS)) {
      // Replace 1-2 occurrences max per synonym to keep it natural
      const re = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = out.match(re)
      if (!matches) continue
      const maxReplace = Math.min(matches.length, 2)
      let replaced = 0
      out = out.replace(re, (m) => {
        if (replaced >= maxReplace) return m
        if (Math.random() < 0.35) {
          replaced++
          const choice = pickOne(options)
          // Preserve capitalization
          if (m[0] === m[0].toUpperCase()) {
            return choice[0].toUpperCase() + choice.slice(1)
          }
          return choice
        }
        return m
      })
    }
    return out
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §11. FOCUS / BLUR / VISIBILITY EVENTS
  //       Real users switch tabs, alt-tab to other windows. Periodically
  //       emit these signals so the page sees normal browser activity.
  // ════════════════════════════════════════════════════════════════════════
  function triggerHumanSignals() {
    // Random mousemove on the document body
    try {
      const x = randUniform(50, window.innerWidth - 50)
      const y = randUniform(50, window.innerHeight - 50)
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true, clientX: x, clientY: y,
      }))
      _cursorX = x
      _cursorY = y
    } catch (e) {}

    // Occasionally emit visibilitychange (alt-tab away and back)
    if (Math.random() < 0.05) {
      try {
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
      } catch (e) {}
    }
  }

  // Start a low-frequency heartbeat
  let _heartbeat = null
  function startHumanHeartbeat() {
    if (_heartbeat) return
    _heartbeat = setInterval(triggerHumanSignals, clamp(randGaussian(28000, 9000), 12000, 60000))
  }
  function stopHumanHeartbeat() {
    if (_heartbeat) {
      clearInterval(_heartbeat)
      _heartbeat = null
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §12. TIME-OF-DAY SAFETY
  //       Real candidates apply mostly during normal hours (8am-11pm).
  //       Applying at 3am pattern-matches as a bot.
  // ════════════════════════════════════════════════════════════════════════
  function isSafeTime() {
    const hour = new Date().getHours()
    // Safe between 7am and midnight
    return hour >= 7 && hour < 24
  }

  function timeOfDayMultiplier() {
    const hour = new Date().getHours()
    // Slow down during late-night hours (less suspicious if you HAVE to apply)
    if (hour >= 0 && hour < 7)  return 2.5   // very slow, very rare
    if (hour >= 7 && hour < 9)  return 1.3   // morning warming up
    if (hour >= 9 && hour < 17) return 1.0   // normal work hours
    if (hour >= 17 && hour < 22) return 1.1  // evening
    return 1.6                                 // late evening
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §13. APPLICATION PACING
  //       The headline anti-detection metric: time-gap between applications.
  //       We model it with a heavy-tailed distribution — most are 30-90s,
  //       but occasionally users spend 5+ minutes reading a job before applying.
  // ════════════════════════════════════════════════════════════════════════
  function getApplicationGap() {
    const mult = timeOfDayMultiplier()
    // Base gap: log-normal centered around 45-60s
    const baseMean   = Math.log(50000)
    const baseSigma  = 0.55
    let gap = randLogNormal(baseMean, baseSigma) * mult

    // 15% chance of "long browse" — reading job descriptions thoroughly
    if (Math.random() < 0.15) {
      gap += clamp(randGaussian(120000, 50000), 30000, 360000)
    }

    // 3% chance of "stepped away" — answered an email, made coffee
    if (Math.random() < 0.03) {
      gap += clamp(randGaussian(380000, 180000), 120000, 900000)
    }

    return clamp(gap, 18000, 900000)  // 18s minimum, 15min maximum
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §14. RANDOM BROWSE ACTIONS
  //       Mix in non-apply activities between applications to look human.
  //       Hover over a job card, scroll the description, click "see more".
  // ════════════════════════════════════════════════════════════════════════
  const BROWSE_ACTIONS = [
    'hoverJobCard',
    'scrollJobDescription',
    'expandJobDescription',
    'scrollFeed',
    'glanceJobCard',
    'idleHover',
  ]

  async function randomBrowseAction() {
    const action = pickOne(BROWSE_ACTIONS)
    try {
      switch (action) {
        case 'hoverJobCard':
          await _doHoverJobCard()
          break
        case 'scrollJobDescription':
          await _doScrollDescription()
          break
        case 'expandJobDescription':
          await _doExpandDescription()
          break
        case 'scrollFeed':
          await _doScrollFeed()
          break
        case 'glanceJobCard':
          await _doGlanceJobCard()
          break
        case 'idleHover':
          await _doIdleHover()
          break
      }
    } catch (e) { /* swallow — best effort */ }
  }

  async function _doHoverJobCard() {
    const cards = document.querySelectorAll('[class*="job-card"], li[data-occludable-job-id]')
    if (!cards.length) return
    const card = pickOne([...cards].slice(0, 8))
    const rect = card.getBoundingClientRect()
    if (rect.width > 0) {
      await moveCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
      await sleep(clamp(randGaussian(800, 250), 350, 1800))
    }
  }

  async function _doScrollDescription() {
    const desc = document.querySelector('.jobs-description, .jobs-box__html-content, [class*="description"]')
    if (!desc) return
    await humanScroll(desc, randUniform(120, 380))
  }

  async function _doExpandDescription() {
    const seeMore = [...document.querySelectorAll('button')].find(b =>
      /show more|see more|read more/i.test(b.textContent || '')
    )
    if (seeMore) await humanClick(seeMore)
  }

  async function _doScrollFeed() {
    await humanScroll(null, randUniform(100, 350))
  }

  async function _doGlanceJobCard() {
    const cards = document.querySelectorAll('[class*="job-card"]')
    if (!cards.length) return
    const card = pickOne([...cards].slice(0, 12))
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await sleep(clamp(randGaussian(950, 320), 450, 2100))
  }

  async function _doIdleHover() {
    const x = randUniform(window.innerWidth * 0.3, window.innerWidth * 0.7)
    const y = randUniform(window.innerHeight * 0.3, window.innerHeight * 0.7)
    await moveCursorTo(x, y)
    await sleep(clamp(randGaussian(1500, 500), 600, 3500))
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §15. BROWSER FINGERPRINT NORMALIZATION
  //       Don't expose extension-specific globals that LinkedIn could scan
  //       for. Audit the window object after page load.
  // ════════════════════════════════════════════════════════════════════════
  function sanitizeFingerprint() {
    // Remove any obviously-bot-flavored property leaks
    const suspectKeys = ['_phantom', '__nightmare', 'callPhantom', '_selenium', 'webdriver']
    for (const key of suspectKeys) {
      try {
        if (window[key] !== undefined) {
          try { delete window[key] } catch (e) {}
        }
      } catch (e) {}
    }

    // Normalize navigator.webdriver — read-only, but worth attempting
    try {
      if (navigator.webdriver) {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true })
      }
    } catch (e) {}
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §16. NETWORK RATE LIMITING
  //       Track and rate-limit XHR requests that originate from the bot.
  //       Helps avoid suspicious spike patterns.
  // ════════════════════════════════════════════════════════════════════════
  let _xhrTimestamps = []
  const XHR_WINDOW_MS = 60000   // 1 minute
  const XHR_MAX       = 30      // max bot-initiated requests per minute

  async function rateLimitXhr() {
    const now = Date.now()
    _xhrTimestamps = _xhrTimestamps.filter(t => now - t < XHR_WINDOW_MS)
    if (_xhrTimestamps.length >= XHR_MAX) {
      const oldest = _xhrTimestamps[0]
      const waitMs = XHR_WINDOW_MS - (now - oldest) + 500
      await sleep(waitMs)
    }
    _xhrTimestamps.push(now)
  }

  // ════════════════════════════════════════════════════════════════════════
  //  §17. PUBLIC API EXPORT
  // ════════════════════════════════════════════════════════════════════════
  // Auto-init session state on load
  loadSessionState()
  startHumanHeartbeat()
  sanitizeFingerprint()

  globalThis.REBLET_STEALTH = {
    // Delays
    sleep,
    humanDelay,
    reactDelay,
    decisionDelay,
    readingDelay,
    ponderDelay,
    readPause,

    // Mouse & clicks
    moveCursorTo,
    humanClick,

    // Typing
    humanType,
    keystrokeDelayMs,

    // Scroll
    humanScroll,
    scrollIntoViewHuman,

    // Session
    sessionGuard,
    recordApplication,
    resetSession,
    getSessionState: () => ({ ..._sessionState }),
    maybeForcedBreak,

    // Diversification
    diversifyAnswer,

    // Signals
    triggerHumanSignals,
    startHumanHeartbeat,
    stopHumanHeartbeat,

    // Timing
    isSafeTime,
    timeOfDayMultiplier,
    getApplicationGap,

    // Browse actions
    randomBrowseAction,

    // Rate limiting
    rateLimitXhr,

    // Helpers (for inline use)
    randUniform,
    randGaussian,
    randLogNormal,
    randSkewed,
    clamp,
    pickOne,
    shuffle,

    // Caps (read-only access)
    CAPS,
  }

  try {
    console.log('[reblet] stealth module loaded — human-emulation active')
  } catch (e) {}
})()
