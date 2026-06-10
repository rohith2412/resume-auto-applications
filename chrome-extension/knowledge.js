/* ════════════════════════════════════════════════════════════════════════════
   REBLET KNOWLEDGE BASE
   ──────────────────────────────────────────────────────────────────────────
   Massive pattern → answer database for LinkedIn Easy Apply forms.
   Loaded BEFORE content.js so it's available as globalThis.REBLET_KB.

   Sections:
     1.  Helpers (option matchers)
     2.  Identity & personal info
     3.  Work authorization & visa (US, CA, UK, EU, AU, IN, etc.)
     4.  Demographics / EEO / voluntary self-id
     5.  Education
     6.  Years of experience
     7.  Compensation
     8.  Availability / notice / start date
     9.  Work arrangement (remote / hybrid / on-site)
     10. Relocation & travel
     11. Background checks & legal
     12. Programming languages (50+)
     13. Frameworks & libraries (80+)
     14. Cloud / DevOps / infra (60+)
     15. Databases & data tools
     16. Office / collaboration tools
     17. Soft skills & methodologies
     18. Long-form / essay templates
     19. Why this role / company prompts
     20. Strengths / weaknesses / behavioral
     21. References & sources
     22. Address sub-fields by country
     23. Phone / contact
     24. Date / availability
     25. Industry / sector
     26. Yes/No catch-alls
     27. Generic question handler
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ─── 1. Helpers ────────────────────────────────────────────────────────────
  const opt = (options, pat) => options.find(o => pat.test(o))
  const findOpt = (options, ...patterns) => {
    for (const p of patterns) {
      const m = options.find(o => p.test(o))
      if (m) return m
    }
    return null
  }
  const has = (s, ...words) => words.some(w => s.includes(w))
  const re = (...parts) => new RegExp(parts.join('|'), 'i')

  // Pick first option that isn't a placeholder
  const realOption = (options) => {
    if (!options.length) return ''
    const placeholders = /^(select|choose|pick|please.*select|--|none)/i
    const real = options.find(o => !placeholders.test(o))
    return real || options[0]
  }

  // ─── 2. IDENTITY & PERSONAL INFO ───────────────────────────────────────────
  const IDENTITY_PATTERNS = [
    // Names — full
    { match: /^full.{0,5}name|^legal.{0,5}name|^complete.{0,5}name|^applicant.{0,5}name|^candidate.{0,5}name/i,
      answer: (ctx) => ctx.p.fullName || '' },
    { match: /^name\b(?!.*last|.*first|.*middle)/i,
      answer: (ctx) => ctx.p.fullName || '' },

    // First name variants
    { match: /first.{0,5}name|given.{0,5}name|forename|christian.{0,5}name/i,
      answer: (ctx) => (ctx.p.fullName || '').split(' ')[0] || '' },

    // Last name variants
    { match: /last.{0,5}name|surname|family.{0,5}name|父姓/i,
      answer: (ctx) => (ctx.p.fullName || '').split(' ').slice(-1)[0] || '' },

    // Middle
    { match: /middle.{0,5}name|middle.{0,5}initial|second.{0,5}name/i,
      answer: () => '' },

    // Preferred / nickname / what should we call you
    { match: /preferred.{0,5}name|nickname|go.{0,5}by|call.{0,5}you|what.{0,5}should.{0,5}we.{0,5}call/i,
      answer: (ctx) => (ctx.p.fullName || '').split(' ')[0] || '' },

    // Title (Mr / Mrs / Ms / Dr / Mx)
    { match: /^title$|^salutation|^prefix|^honorific|mr\/mrs\/ms/i,
      answer: (ctx, options) => findOpt(options, /prefer not|decline/i, /^mx\b/i, /^mr\b/i) || options[0] || '' },

    // Pronouns
    { match: /pronoun/i,
      answer: (_, options) => findOpt(options, /prefer not|decline|no.*answer/i, /they.*them/i) || realOption(options) },

    // Date of birth
    { match: /date.{0,5}birth|dob\b|birthday|birth.{0,5}date|year.*birth|month.*birth/i,
      answer: (_, options) => findOpt(options, /prefer not|decline/i) || '' },

    // Age confirmations
    { match: /18.*older|over.*18|at.*least.{0,5}18|minimum.{0,5}age|legal.{0,5}working.{0,5}age/i,
      answer: (_, options) => findOpt(options, /yes|i am|over|above|confirm/i) || 'Yes' },
    { match: /21.*older|over.*21|at.*least.{0,5}21/i,
      answer: (_, options) => findOpt(options, /yes|i am|over/i) || 'Yes' },

    // Gender (with prefer not preference)
    { match: /\bgender\b|sex\b(?!ual)/i,
      answer: (_, options) => findOpt(options,
        /prefer not|decline|do not wish|i don.t wish|not.*disclose|i.*choose.*not/i,
        /non.?binary/i,
        /\bmale\b/i
      ) || realOption(options) },

    // Sexual orientation / LGBTQ
    { match: /orientation|lgbtq|sexual.{0,5}identity|how.*identify/i,
      answer: (_, options) => findOpt(options, /prefer not|decline|do not wish|not.*disclose/i) || realOption(options) },

    // Marital status
    { match: /marital|married|single.{0,5}status|spouse.{0,5}status/i,
      answer: (_, options) => findOpt(options, /prefer not|decline/i) || realOption(options) },

    // Dependents / family
    { match: /dependents|number.*children|family.{0,5}size/i,
      answer: () => '0' },
  ]

  // ─── 3. WORK AUTHORIZATION & VISA ──────────────────────────────────────────
  const VISA_PATTERNS = [
    // Authorization to work (US)
    { match: /authoriz.*work.*united.*states|authoriz.*work.*us\b|legally.*work.*us\b|eligible.*work.*us\b|us.{0,5}work.{0,5}authoriz|work.{0,5}authoriz.{0,5}us/i,
      answer: (ctx, options) => {
        const v = ctx.p.workAuth || 'Yes'
        return findOpt(options, new RegExp(v, 'i')) || findOpt(options, /yes|authorized|able/i) || 'Yes'
      } },

    // Authorization to work (CA)
    { match: /authoriz.*work.*canada|legally.*work.*canada|eligible.*work.*canada|canadian.{0,5}work.{0,5}authoriz|permanent.{0,5}resident.{0,5}canad|canad.{0,5}citizen/i,
      answer: (_, options) => findOpt(options, /yes|authorized|citizen|permanent|pr\b/i) || 'Yes' },

    // Authorization to work (UK)
    { match: /right.{0,5}to.{0,5}work.*uk|authoriz.*work.*uk\b|legally.*work.*uk\b|british.{0,5}citizen|settled.{0,5}status/i,
      answer: (_, options) => findOpt(options, /yes|authorized|citizen|settled|indefinite/i) || 'Yes' },

    // Authorization (generic)
    { match: /authoriz|legal(ly)?.{0,5}work|eligible.{0,5}work|right.{0,5}to.{0,5}work|work.{0,5}permit|allowed.{0,5}work|valid.{0,5}work.{0,5}status|work.{0,5}eligibilit/i,
      answer: (ctx, options) => {
        const v = ctx.p.workAuth || 'Yes'
        return findOpt(options, new RegExp(v, 'i')) || findOpt(options, /yes|authorized|able/i) || 'Yes'
      } },

    // Sponsorship
    { match: /sponsor|require.{0,5}sponsor|need.{0,5}sponsor|will.{0,5}you.{0,5}require|now.{0,5}or.{0,5}in.{0,5}the.{0,5}future|future.*sponsor/i,
      answer: (ctx, options) => {
        const v = ctx.p.sponsorship || 'No'
        return findOpt(options, new RegExp(v, 'i')) || findOpt(options, /^no\b|don.t/i) || 'No'
      } },

    // Visa specific
    { match: /h.?1.?b|h1b/i,
      answer: (_, options) => findOpt(options, /no|not.*require|don.t|never/i) || 'No' },
    { match: /\bopt\b|optional.*practical/i,
      answer: (_, options) => findOpt(options, /no|don.t/i) || 'No' },
    { match: /\bcpt\b|curricular.*practical/i,
      answer: (_, options) => findOpt(options, /no|don.t/i) || 'No' },
    { match: /\btn.{0,5}visa\b|tn.{0,5}status/i,
      answer: (_, options) => findOpt(options, /no|don.t/i) || 'No' },
    { match: /\bj.?1\b|exchange.*visitor/i,
      answer: (_, options) => findOpt(options, /no|don.t/i) || 'No' },
    { match: /\bf.?1\b|student.*visa/i,
      answer: (_, options) => findOpt(options, /no|don.t/i) || 'No' },
    { match: /\bead\b|employment.*authorization.*document/i,
      answer: (_, options) => findOpt(options, /no|don.t|n\/a/i) || 'No' },

    // Citizenship
    { match: /citizenship.{0,5}status|are.{0,5}you.{0,5}a.{0,5}citizen|us.{0,5}citizen|are.{0,5}you.*citizen/i,
      answer: (ctx, options) => {
        if (/yes/i.test(ctx.p.workAuth || 'Yes')) {
          return findOpt(options, /citizen|permanent.*resident|us.*national|naturalized|yes/i) || realOption(options)
        }
        return findOpt(options, /no|other|prefer not/i) || realOption(options)
      } },

    // Specific country citizenship
    { match: /country.*citizenship|nationality|passport.*country/i,
      answer: (ctx, options) => {
        const c = ctx.p.country || ctx.p.location?.split(',').slice(-1)[0]?.trim() || ''
        return findOpt(options, new RegExp(c, 'i')) || realOption(options)
      } },

    // Permanent resident
    { match: /permanent.{0,5}resident|green.{0,5}card|landed.{0,5}immigrant/i,
      answer: (ctx, options) => findOpt(options, /yes|i am|have/i) || 'Yes' },

    // Restrictions
    { match: /restriction.*employ|restricted.*work|limit.*work|conditions.*work/i,
      answer: (_, options) => findOpt(options, /no|none|don.t/i) || 'No' },
  ]

  // ─── 4. DEMOGRAPHICS / EEO / VOLUNTARY SELF-ID ────────────────────────────
  const EEO_PATTERNS = [
    // Race / ethnicity (US)
    { match: /race|ethnicity|ethnic.{0,5}background|ethnic.{0,5}origin|racial/i,
      answer: (_, options) => findOpt(options,
        /prefer not|decline|do not wish|i don.t wish|choose not|not.*disclose/i
      ) || realOption(options) },

    // Hispanic/Latino
    { match: /hispanic|latino|latinx|latin.{0,5}origin/i,
      answer: (_, options) => findOpt(options, /prefer not|decline|no\b/i) || 'No' },

    // Veteran (US)
    { match: /veteran|military|armed.{0,5}forces|protected.{0,5}veteran|disabled.{0,5}veteran/i,
      answer: (_, options) => findOpt(options,
        /not.*veteran|i am not|no\b|prefer not|decline/i
      ) || realOption(options) },

    // Disability (US Section 503)
    { match: /disability|disabled|disab.{0,5}status|impair|medical.{0,5}condition|adhd|adoption|adjustment/i,
      answer: (_, options) => findOpt(options,
        /prefer not|decline|do not wish|no\b|don.t|i don.t have/i
      ) || realOption(options) },

    // EEO general
    { match: /\beeo\b|equal.{0,5}employment|voluntary.{0,5}self|voluntary.{0,5}disclos|self.?identif/i,
      answer: (_, options) => findOpt(options,
        /prefer not|decline|do not wish|not.*disclose/i
      ) || realOption(options) },

    // Indigenous / Aboriginal (Canada)
    { match: /indigenous|aboriginal|first.{0,5}nations|métis|metis|inuit/i,
      answer: (_, options) => findOpt(options, /no|prefer not|decline/i) || 'No' },

    // Visible minority (Canada)
    { match: /visible.{0,5}minority|racialized/i,
      answer: (_, options) => findOpt(options, /prefer not|decline|no/i) || 'No' },

    // Religion
    { match: /religion|religious|faith|belief/i,
      answer: (_, options) => findOpt(options, /prefer not|decline|none|no.{0,5}religion/i) || realOption(options) },

    // Caste (India)
    { match: /\bcaste\b|category.*reserved|sc.{0,5}st|obc\b|general.{0,5}category/i,
      answer: (_, options) => findOpt(options, /general|prefer not|decline/i) || realOption(options) },
  ]

  // ─── 5. EDUCATION ──────────────────────────────────────────────────────────
  const EDUCATION_PATTERNS = [
    // Degree level
    { match: /highest.{0,5}(level.{0,5})?(degree|education|qualification)|education.{0,5}level|degree.{0,5}obtained|degree.{0,5}earned/i,
      answer: (ctx, options) => {
        const deg = (ctx.ed.degree || "Bachelor's").toLowerCase()
        if (deg.includes('phd') || deg.includes('doctor'))
          return findOpt(options, /phd|doctor/i) || realOption(options)
        if (deg.includes('master'))
          return findOpt(options, /master|m\.s|m\.a|mba/i) || realOption(options)
        if (deg.includes('bachelor') || deg.includes('undergrad'))
          return findOpt(options, /bachelor|b\.s|b\.a|undergrad/i) || realOption(options)
        if (deg.includes('associate'))
          return findOpt(options, /associate|2.?year/i) || realOption(options)
        if (deg.includes('diploma') || deg.includes('high school'))
          return findOpt(options, /diploma|high school|secondary/i) || realOption(options)
        return findOpt(options, /bachelor/i) || realOption(options)
      } },

    { match: /^degree\b|degree.{0,5}type|what.{0,5}degree/i,
      answer: (ctx, options) => {
        const d = ctx.ed.degree || "Bachelor's"
        return findOpt(options, new RegExp(d.slice(0, 8), 'i')) ||
               findOpt(options, /bachelor/i) || realOption(options) || d
      } },

    // Major / field of study
    { match: /major|field.{0,5}study|area.{0,5}study|field.{0,5}of|stream|specialization|concentration/i,
      answer: (ctx, options) => {
        const f = ctx.profile?.educationField || ctx.ed.field || ctx.ed.degree || 'Computer Science'
        if (options.length) return findOpt(options, new RegExp(f.slice(0, 8), 'i')) || realOption(options)
        return f
      } },

    // University / school
    { match: /^university$|^school$|^college$|institution|alma.{0,5}mater|education.{0,5}name|name.{0,5}university|name.{0,5}school|name.{0,5}college/i,
      answer: (ctx) => ctx.ed.university || '' },

    // Graduation year
    { match: /graduation.{0,5}(year|date)|year.{0,5}graduat|expected.{0,5}graduat|when.{0,5}did.{0,5}you.{0,5}graduat|grad.{0,5}year|completion.{0,5}year/i,
      answer: (ctx) => ctx.ed.graduationYear || new Date().getFullYear().toString() },

    // GPA
    { match: /\bgpa\b|grade.{0,5}point|cgpa|cumulative.{0,5}average|academic.{0,5}average/i,
      answer: (ctx) => ctx.ed.gpa || '3.5' },

    // Grade scale
    { match: /grade.{0,5}scale|gpa.{0,5}scale|out.{0,5}of/i,
      answer: () => '4.0' },

    // Class rank
    { match: /class.{0,5}rank|graduating.{0,5}rank/i,
      answer: () => 'Top 25%' },

    // Currently a student
    { match: /currently.*student|still.*studying|currently.*enrolled/i,
      answer: (_, options) => findOpt(options, /no|graduated|completed/i) || 'No' },

    // Education completion
    { match: /completed.{0,5}education|completed.{0,5}degree|finished.{0,5}studies/i,
      answer: (_, options) => findOpt(options, /yes|completed|graduated/i) || 'Yes' },
  ]

  // ─── 6. YEARS OF EXPERIENCE ────────────────────────────────────────────────
  const YOE_PATTERNS = [
    // CATCH-ALL: anything that mentions "how many years" or "years of experience"
    // — covers "How many years of work experience do you have with X" for ANY X
    { match: /how.{0,15}many.{0,15}year|years.{0,15}of.{0,15}(experience|work|hands.?on)|year.{0,15}of.{0,15}experience|experience.{0,15}with.{0,15}(years|how long)/i,
      answer: (ctx, options) => {
        const y = String(ctx.jp.yearsExp || '2')
        if (!options.length) return y
        const yNum = parseInt(y)
        const exact = options.find(o => o.trim() === y)
        if (exact) return exact
        const rng = options.find(o => {
          const m = o.match(/(\d+)[^\d]+(\d+)/)
          if (!m) return false
          return yNum >= parseInt(m[1]) && yNum <= parseInt(m[2])
        })
        if (rng) return rng
        const plus = options.find(o => {
          const m = o.match(/(\d+)\+/)
          return m && yNum >= parseInt(m[1])
        })
        if (plus) return plus
        return findOpt(options, /^\d/) || realOption(options)
      } },

    // Specific tech years
    { match: /year.*of (python|java|javascript|typescript|c\+\+|c#|ruby|go\b|rust|kotlin|swift|php|sql)/i,
      answer: (ctx) => String(ctx.jp.yearsExp || '2') },
  ]

  // ─── 6b. "DO YOU HAVE EXPERIENCE WITH X" CATCH-ALL ────────────────────────
  // Matches ANY phrasing of "Do you have experience with..." / "Are you familiar with..."
  // / "Have you used..." for any tool/tech/concept.
  const EXPERIENCE_QUESTION_PATTERNS = [
    { match: /do.{0,5}you.{0,5}have.{0,5}experience|have.{0,5}you.{0,5}used|have.{0,5}you.{0,5}worked.{0,5}with|are.{0,5}you.{0,5}familiar.{0,5}with|are.{0,5}you.{0,5}experienced|comfortable.{0,5}working.{0,5}with|exposure.{0,5}to|hands.?on.{0,5}experience/i,
      answer: (_, options) => {
        if (!options.length) return 'Yes'
        if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
        if (options.length === 2 && /yes/i.test(options[1])) return 'Yes'
        return findOpt(options,
          /^yes$/i,
          /yes|familiar|comfortable|some experience|intermediate|advanced/i,
          /\b1.?[-–].?2\b|\b2.?[-–].?4\b|\b3.?[-–].?5\b/
        ) || realOption(options)
      } },
  ]

  // ─── 6c. VIDEO RECORDING / INTERVIEW PROMPTS ──────────────────────────────
  // We cannot record video, so if forced to answer, say No or pick the safest opt-out.
  const VIDEO_PATTERNS = [
    { match: /record.{0,5}a.{0,5}.{0,5}(video|minute)|video.{0,5}introduc|video.{0,5}interview|video.{0,5}response|introduc.{0,5}yourself.{0,5}video|video.{0,5}message|submit.{0,5}a.{0,5}video|video.{0,5}application/i,
      answer: (_, options) => {
        if (!options.length) return 'Yes'    // text field — promise willing
        if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
        return findOpt(options, /yes|willing|i am/i) || realOption(options)
      } },
  ]

  // ─── 7. COMPENSATION ───────────────────────────────────────────────────────
  const SALARY_PATTERNS = [
    // Desired / expected salary
    { match: /desired.{0,5}salary|expected.{0,5}salary|target.{0,5}salary|salary.{0,5}expect|annual.{0,5}salary|base.{0,5}salary|salary.{0,5}requirement|compensation.{0,5}expect|expected.{0,5}compensation|expected.{0,5}ctc|salary.{0,5}range|pay.{0,5}expect|what.{0,5}are.{0,5}your.{0,5}salary/i,
      answer: (ctx) => String(ctx.jp.expectedSalary || '85000').replace(/[^0-9]/g, '') || '85000' },

    // Minimum salary
    { match: /minimum.{0,5}salary|lowest.{0,5}salary|salary.{0,5}floor/i,
      answer: (ctx) => String(parseInt(ctx.jp.expectedSalary || '85000') * 0.85).replace(/[^0-9]/g, '') || '70000' },

    // Hourly rate
    { match: /hourly.{0,5}rate|rate.{0,5}per.{0,5}hour|per.?hour|hourly.{0,5}wage|hourly.{0,5}compensation/i,
      answer: (ctx) => {
        const annual = parseInt(String(ctx.jp.expectedSalary || '85000').replace(/[^0-9]/g, '')) || 85000
        return String(Math.round(annual / 2080))
      } },

    // Current salary (avoid disclosing)
    { match: /current.{0,5}salary|present.{0,5}salary|current.{0,5}ctc|what.{0,5}is.{0,5}your.{0,5}current/i,
      answer: () => '' },

    // Bonus / equity expectations
    { match: /bonus|equity|stock.{0,5}option|rsu\b/i,
      answer: (_, options) => findOpt(options, /yes|open|flexible/i) || '' },

    // Currency
    { match: /currency|preferred.{0,5}currency/i,
      answer: (ctx, options) => {
        const country = (ctx.p.country || ctx.p.location || '').toLowerCase()
        if (country.includes('canada')) return findOpt(options, /cad|canadian/i) || realOption(options)
        if (country.includes('united kingdom') || country.includes('uk')) return findOpt(options, /gbp|pound/i) || realOption(options)
        if (country.includes('india')) return findOpt(options, /inr|rupee/i) || realOption(options)
        return findOpt(options, /usd|dollar/i) || realOption(options)
      } },
  ]

  // ─── 8. AVAILABILITY / NOTICE / START DATE ────────────────────────────────
  const AVAILABILITY_PATTERNS = [
    { match: /notice.{0,5}period|when.{0,5}can.{0,5}you.{0,5}start|how.{0,5}soon.{0,5}can.{0,5}you.{0,5}start|earliest.{0,5}start|when.{0,5}would.{0,5}you.{0,5}be.{0,5}able.{0,5}to.{0,5}start|start.{0,5}date|join.{0,5}date|availabilit.{0,5}to.{0,5}start/i,
      answer: (ctx, options) => {
        const n = ctx.jp.noticePeriod || ctx.p.notice || '2 weeks'
        if (options.length) return findOpt(options,
          /immediately|now|asap|2.?week|two.?week/i,
          new RegExp(n.replace(/\s/g, '.?'), 'i')
        ) || realOption(options)
        return n
      } },

    { match: /are.{0,5}you.{0,5}currently.{0,5}employed|currently.{0,5}working|employment.{0,5}status/i,
      answer: (_, options) => findOpt(options, /yes|employed|working/i) || 'Yes' },

    { match: /actively.{0,5}looking|actively.{0,5}searching/i,
      answer: (_, options) => findOpt(options, /yes|actively/i) || 'Yes' },

    { match: /immediate.{0,5}joiner|immediately.{0,5}available/i,
      answer: (_, options) => findOpt(options, /yes|i am|available/i) || 'Yes' },
  ]

  // ─── 9. WORK ARRANGEMENT (REMOTE / HYBRID / ON-SITE) ──────────────────────
  const WORK_ARRANGEMENT_PATTERNS = [
    { match: /remote|work.{0,5}from.{0,5}home|wfh\b|work.{0,5}location|work.{0,5}arrangement|work.{0,5}setting|work.{0,5}mode|in.?office|on.?site|hybrid/i,
      answer: (ctx, options) => {
        const wt = ctx.jp.workType
        if (wt === '2' || /^2$/.test(String(wt))) return findOpt(options, /remote|fully.*remote|work.{0,5}from.{0,5}home/i) || realOption(options)
        if (wt === '3' || /^3$/.test(String(wt))) return findOpt(options, /hybrid|flexible/i) || realOption(options)
        if (wt === '1' || /^1$/.test(String(wt))) return findOpt(options, /on.?site|in.?office|office/i) || realOption(options)
        // Default: open to anything
        return findOpt(options, /yes|open|flexible|willing|any|all/i) || realOption(options)
      } },

    { match: /comfortable.{0,5}with.{0,5}remote/i,
      answer: (_, options) => findOpt(options, /yes|comfortable/i) || 'Yes' },

    { match: /willing.{0,5}to.{0,5}commute/i,
      answer: (_, options) => findOpt(options, /yes|willing|open/i) || 'Yes' },
  ]

  // ─── 10. RELOCATION & TRAVEL ───────────────────────────────────────────────
  const RELOCATION_PATTERNS = [
    { match: /relocat|willing.{0,5}to.{0,5}move|open.{0,5}to.{0,5}relocat|move.{0,5}for.{0,5}job/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|i am/i) || 'Yes' },

    { match: /relocation.{0,5}assistance|relocation.{0,5}package|need.{0,5}relocation/i,
      answer: (_, options) => findOpt(options, /no|don.t|not.*need/i) || 'No' },

    { match: /travel.*required|willing.{0,5}to.{0,5}travel|comfortable.{0,5}travel|business.{0,5}travel/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|up to|occasional/i) || 'Yes' },

    { match: /travel.{0,5}percent|how.{0,5}much.{0,5}travel|amount.{0,5}travel/i,
      answer: (_, options) => findOpt(options, /up to 25|25%|10%|less than|some/i) || realOption(options) },

    { match: /willing.{0,5}commute|maximum.{0,5}commute|how.{0,5}far/i,
      answer: (_, options) => findOpt(options, /yes|30|45|60|willing/i) || 'Yes' },
  ]

  // ─── 11. BACKGROUND CHECKS & LEGAL ─────────────────────────────────────────
  const LEGAL_PATTERNS = [
    // Background check consent
    { match: /background.{0,5}check|criminal.{0,5}background|reference.{0,5}check|employment.{0,5}verification/i,
      answer: (_, options) => findOpt(options, /yes|consent|agree|i consent/i) || 'Yes' },

    // Criminal record
    { match: /convict|felony|misdemeanor|criminal.{0,5}record|criminal.{0,5}offense|arrested|guilty/i,
      answer: (_, options) => findOpt(options, /no|none|never|n\/a/i) || 'No' },

    // Drug test
    { match: /drug.{0,5}test|drug.{0,5}screen|drug.{0,5}free|substance.{0,5}abuse|pre.?employment.{0,5}drug/i,
      answer: (_, options) => findOpt(options, /yes|pass|willing|agree|consent/i) || 'Yes' },

    // Marijuana
    { match: /cannabis|marijuana/i,
      answer: (_, options) => findOpt(options, /no|never|not.*use|don.t/i) || 'No' },

    // Security clearance
    { match: /security.{0,5}clearance|clearance.{0,5}level|active.{0,5}clearance|secret.{0,5}clearance|top.?secret/i,
      answer: (_, options) => findOpt(options, /no|none|n\/a|not.*have/i) || 'No' },

    // Non-compete / NDA
    { match: /non.?compete|non.?disclosure|restrictive.{0,5}covenant|nda\b|garden.{0,5}leave|bound.{0,5}by/i,
      answer: (_, options) => findOpt(options, /no|none|don.t|n\/a/i) || 'No' },

    // Conflicts of interest
    { match: /conflict.{0,5}interest|conflict.{0,5}of.{0,5}interest/i,
      answer: (_, options) => findOpt(options, /no|none|don.t/i) || 'No' },

    // Consent / certification catch-all
    { match: /\bconsent\b|\bagree\b|\bcertif|\backnowledge\b|\bunderstand\b|\baccept\b|\bconfirm\b|acknowledg|terms.{0,5}condition|i.{0,5}attest|true.{0,5}and.{0,5}accurate|i.{0,5}declare/i,
      answer: (_, options) => findOpt(options, /yes|i agree|i confirm|i certify|i acknowledge|i consent|i accept|true|i understand/i) || 'Yes' },

    // Working environment / hazard
    { match: /lift.{0,5}\d|stand.{0,5}for|sit.{0,5}for|physical.{0,5}requirement|hazard|noisy.{0,5}environment/i,
      answer: (_, options) => findOpt(options, /yes|able|can|willing/i) || 'Yes' },

    // Reliable transportation
    { match: /reliable.{0,5}transportation|own.{0,5}transportation|drive|valid.{0,5}license|driver.{0,5}license/i,
      answer: (_, options) => findOpt(options, /yes|have|valid/i) || 'Yes' },

    // Work weekends / holidays / overtime
    { match: /work.{0,5}weekend|work.{0,5}holiday|work.{0,5}overtime|extended.{0,5}hours|on.?call|after.?hours/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|occasional/i) || 'Yes' },

    // Travel internationally
    { match: /international.{0,5}travel|travel.{0,5}international|valid.{0,5}passport/i,
      answer: (_, options) => findOpt(options, /yes|willing|have|valid/i) || 'Yes' },
  ]

  // ─── 12. PROGRAMMING LANGUAGES (50+) ──────────────────────────────────────
  const TECH_LANGUAGES = [
    'python', 'javascript', 'typescript', 'java', 'c\\+\\+', 'c#', 'go', 'golang',
    'ruby', 'rust', 'kotlin', 'swift', 'php', 'sql', 'plsql', 'tsql', 'mysql',
    'postgresql', 'mongodb', 'shell', 'bash', 'powershell', 'r\\b', 'matlab',
    'scala', 'perl', 'haskell', 'erlang', 'elixir', 'clojure', 'dart', 'lua',
    'objective.?c', 'vba', 'sas', 'cobol', 'fortran', 'assembly', 'solidity',
    'html', 'css', 'sass', 'less', 'scss', 'groovy', 'julia', 'd\\b', 'crystal',
    'f#', 'ocaml', 'lisp', 'scheme', 'tcl', 'racket', 'prolog', 'verilog', 'vhdl'
  ]
  const LANGUAGE_PATTERNS = TECH_LANGUAGES.map(lang => ({
    match: new RegExp(`\\b${lang}\\b`, 'i'),
    answer: (ctx, options) => {
      if (!options.length) return String(ctx.jp.yearsExp || '2')
      if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
      return findOpt(options,
        /advanced|expert|proficient|professional/i,
        /intermediate|comfortable/i,
        /yes|familiar|some/i
      ) || options[Math.floor(options.length / 2)] || realOption(options)
    }
  }))

  // ─── 13. FRAMEWORKS & LIBRARIES (80+) ─────────────────────────────────────
  const FRAMEWORKS = [
    'react', 'angular', 'vue', 'svelte', 'next\\.?js', 'nuxt', 'gatsby', 'redux',
    'jquery', 'ember', 'backbone', 'node\\.?js', 'express', 'fastify', 'nestjs',
    'django', 'flask', 'fastapi', 'pyramid', 'tornado', 'spring', 'spring.{0,5}boot',
    'hibernate', 'struts', '\\.net', 'asp\\.net', 'asp', 'laravel', 'symfony',
    'codeigniter', 'cake.?php', 'rails', 'sinatra', 'phoenix', 'gin\\b', 'echo\\b',
    'actix', 'rocket', 'ktor', 'play\\b', 'akka', 'meteor', 'electron', 'flutter',
    'react.{0,5}native', 'ionic', 'xamarin', 'cordova', 'phonegap', 'tensorflow',
    'pytorch', 'keras', 'scikit.?learn', 'pandas', 'numpy', 'scipy', 'matplotlib',
    'seaborn', 'plotly', 'opencv', 'spark', 'hadoop', 'kafka', 'airflow', 'beam',
    'dagster', 'prefect', 'rabbitmq', 'celery', 'sidekiq', 'graphql', 'apollo',
    'relay', 'prisma', 'sequelize', 'mongoose', 'typeorm', 'eloquent', 'activerecord',
    'jpa\\b', 'webpack', 'vite', 'rollup', 'parcel', 'turbopack', 'esbuild',
    'jest', 'mocha', 'jasmine', 'pytest', 'rspec', 'junit', 'cypress', 'playwright',
    'selenium', 'puppeteer', 'storybook'
  ]
  const FRAMEWORK_PATTERNS = FRAMEWORKS.map(fw => ({
    match: new RegExp(`\\b${fw}\\b`, 'i'),
    answer: (ctx, options) => {
      if (!options.length) return String(ctx.jp.yearsExp || '2')
      if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
      return findOpt(options,
        /advanced|expert|proficient/i,
        /intermediate|comfortable/i,
        /yes|familiar|some/i
      ) || options[Math.floor(options.length / 2)] || realOption(options)
    }
  }))

  // ─── 14. CLOUD / DEVOPS / INFRA (60+) ─────────────────────────────────────
  const CLOUD = [
    'aws', 'amazon.{0,5}web.{0,5}services', 'ec2', 's3\\b', 'rds\\b', 'lambda',
    'cloudfront', 'route.?53', 'cloudformation', 'amplify', 'eks\\b', 'ecs\\b',
    'fargate', 'sagemaker', 'azure', 'azure.{0,5}devops', 'aks\\b', 'app.{0,5}service',
    'gcp', 'google.{0,5}cloud', 'gke\\b', 'cloud.{0,5}functions', 'bigquery',
    'firestore', 'firebase', 'pubsub', 'kubernetes', 'k8s', 'docker', 'docker.?compose',
    'helm', 'istio', 'linkerd', 'envoy', 'terraform', 'pulumi', 'cloudformation',
    'ansible', 'chef', 'puppet', 'saltstack', 'jenkins', 'circle.?ci', 'travis',
    'github.{0,5}action', 'gitlab.{0,5}ci', 'azure.{0,5}pipeline', 'argocd', 'flux',
    'prometheus', 'grafana', 'datadog', 'newrelic', 'splunk', 'elk\\b', 'elastic',
    'logstash', 'kibana', 'fluentd', 'fluent.?bit', 'opentelemetry', 'jaeger',
    'zipkin', 'consul', 'vault', 'nomad', 'rancher', 'openshift', 'cloud.{0,5}native',
    'serverless', 'edge.{0,5}function', 'cdn', 'load.{0,5}balanc'
  ]
  const CLOUD_PATTERNS = CLOUD.map(c => ({
    match: new RegExp(`\\b${c}\\b`, 'i'),
    answer: (ctx, options) => {
      if (!options.length) return String(ctx.jp.yearsExp || '2')
      if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
      return findOpt(options,
        /advanced|expert|proficient/i,
        /intermediate|comfortable/i,
        /yes|familiar|some/i
      ) || options[Math.floor(options.length / 2)] || realOption(options)
    }
  }))

  // ─── 15. DATABASES & DATA TOOLS ────────────────────────────────────────────
  const DATABASES = [
    'postgresql', 'postgres', 'mysql', 'mariadb', 'oracle', 'mssql', 'sql.{0,5}server',
    'sqlite', 'mongodb', 'cassandra', 'dynamodb', 'redis', 'memcached', 'couchbase',
    'cockroachdb', 'neo4j', 'arangodb', 'influxdb', 'timescaledb', 'clickhouse',
    'snowflake', 'redshift', 'bigquery', 'databricks', 'hive\\b', 'presto', 'trino',
    'dbt\\b', 'looker', 'tableau', 'power.?bi', 'metabase', 'superset', 'mode\\b',
    'segment', 'mixpanel', 'amplitude'
  ]
  const DATABASE_PATTERNS = DATABASES.map(d => ({
    match: new RegExp(`\\b${d}\\b`, 'i'),
    answer: (ctx, options) => {
      if (!options.length) return String(ctx.jp.yearsExp || '2')
      if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
      return findOpt(options,
        /advanced|expert|proficient/i,
        /intermediate|comfortable/i,
        /yes|familiar|some/i
      ) || options[Math.floor(options.length / 2)] || realOption(options)
    }
  }))

  // ─── 16. OFFICE / COLLABORATION TOOLS ──────────────────────────────────────
  const TOOLS = [
    'slack', 'zoom', 'microsoft.{0,5}teams', 'google.{0,5}meet', 'webex', 'discord',
    'jira', 'confluence', 'asana', 'notion', 'trello', 'monday', 'clickup',
    'linear', 'shortcut', 'basecamp', 'github', 'gitlab', 'bitbucket', 'sourcetree',
    'tortoisesvn', 'mercurial', 'figma', 'sketch', 'adobe.{0,5}xd', 'invision',
    'zeplin', 'miro', 'mural', 'lucidchart', 'visio', 'draw\\.io', 'gimp',
    'photoshop', 'illustrator', 'after.{0,5}effect', 'premiere', 'final.{0,5}cut',
    'excel', 'google.{0,5}sheet', 'word', 'powerpoint', 'google.{0,5}doc',
    'google.{0,5}slide', 'outlook', 'salesforce', 'hubspot', 'pipedrive',
    'zendesk', 'intercom', 'freshdesk', 'sap', 'oracle.{0,5}ebs', 'workday',
    'netsuite', 'quickbooks'
  ]
  const TOOL_PATTERNS = TOOLS.map(t => ({
    match: new RegExp(`\\b${t}\\b`, 'i'),
    answer: (_, options) => {
      if (!options.length) return 'Yes'
      if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
      return findOpt(options,
        /advanced|expert|proficient/i,
        /yes|comfortable|familiar/i,
        /intermediate/i
      ) || options[0]
    }
  }))

  // ─── 17. SOFT SKILLS & METHODOLOGIES ───────────────────────────────────────
  const METHODOLOGIES = [
    'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six.{0,5}sigma', 'devops',
    'ci.?cd', 'tdd\\b', 'bdd\\b', 'pair.{0,5}programming', 'mob.{0,5}programming',
    'code.{0,5}review', 'design.{0,5}pattern', 'microservice', 'monolith',
    'rest.{0,5}api', 'graphql', 'grpc', 'websocket', 'event.?driven',
    'domain.{0,5}driven', 'ddd\\b', 'oop\\b', 'functional.{0,5}programming',
    'mvc\\b', 'mvvm\\b', 'clean.{0,5}architecture', 'hexagonal', 'cqrs'
  ]
  const METHODOLOGY_PATTERNS = METHODOLOGIES.map(m => ({
    match: new RegExp(`\\b${m}\\b`, 'i'),
    answer: (_, options) => {
      if (!options.length) return 'Yes'
      if (options.length === 2) return /yes/i.test(options[0]) ? 'Yes' : options[0]
      return findOpt(options,
        /yes|familiar|comfortable|practiced|experience/i,
        /intermediate|proficient/i
      ) || options[0]
    }
  }))

  // ═════════════════════════════════════════════════════════════════════════
  //  SEEDED ANSWER BANK — pre-written replies for common essay/behavioral
  //  questions. Bot types these directly so AI is barely ever needed.
  // ═════════════════════════════════════════════════════════════════════════
  const SEEDED_ANSWERS = {
    // ── Self-introduction ──────────────────────────────────────────────────
    tellMeAboutYourself: (ctx) => {
      const role = ctx.jp.keywords || 'software engineer'
      const yrs  = ctx.jp.yearsExp || '2'
      return `I'm a ${role} with ${yrs}+ years of hands-on experience building production systems. I enjoy taking ownership of end-to-end work — from scoping and design through implementation, testing, and rollout — and I care deeply about writing reliable, well-tested code. I'm collaborative by default, I communicate proactively, and I'm always pushing to deepen my technical craft while staying close to user outcomes. This opportunity feels like a strong match for both my skills and the kind of impact I want to have next.`
    },

    // ── Why this role ──────────────────────────────────────────────────────
    whyThisRole: (ctx) => {
      const co = ctx.currentJob?.company || 'your team'
      return `This role aligns directly with the work I find most energizing — building meaningful technical work alongside a strong team. The scope and responsibilities map closely to my strengths, and the technical challenges described are exactly the kind of problems I want to be tackling in the next phase of my career. I'm also excited about what ${co} is building and the trajectory of the team, which makes this an environment where I believe I can contribute quickly and grow significantly.`
    },

    // ── Why this company ───────────────────────────────────────────────────
    whyThisCompany: (ctx) => {
      const co = ctx.currentJob?.company || 'your company'
      return `What stands out to me about ${co} is the combination of an ambitious technical mission, a culture that takes engineering excellence seriously, and clear momentum in the market. The product impact is real, the team's reputation is strong, and the kinds of problems being worked on are genuinely interesting. I want to invest the next chapter of my career somewhere I can do my best work, and ${co} stands out as exactly that kind of place.`
    },

    // ── Cover letter ───────────────────────────────────────────────────────
    coverLetter: (ctx) => {
      const name = ctx.p.fullName || ''
      const role = ctx.currentJob?.jobTitle || ctx.jp.keywords || 'this role'
      const co   = ctx.currentJob?.company || 'your team'
      return `Dear Hiring Team,

I'm writing to apply for ${role} at ${co}. With strong hands-on experience delivering production software, a track record of cross-functional collaboration, and a relentless focus on user outcomes, I'm confident I can have an immediate, measurable impact.

Throughout my career I've prioritized building reliable, well-tested systems, raising the technical bar of the teams I work on, and shipping work that actually moves business and user metrics. I'm drawn to ${co} for the quality of the team, the importance of the mission, and the scope of the technical problems involved.

I'd welcome the opportunity to discuss how I can contribute. Thank you for considering my application.

Sincerely,
${name}`
    },

    // ── Strengths ──────────────────────────────────────────────────────────
    strengths: () =>
      `My top strengths are strong end-to-end ownership, clear written and verbal communication, and a deep focus on building reliable, maintainable systems. I'm known for raising the bar on engineering quality without slowing the team down, and for being a low-ego, helpful collaborator across product, design, and engineering. I also have a strong bias toward shipping — I scope problems pragmatically, get real feedback early, and iterate.`,

    // ── Weaknesses ─────────────────────────────────────────────────────────
    weaknesses: () =>
      `Early in my career I had a tendency to over-engineer in pursuit of the perfect solution rather than shipping a pragmatic v1 and iterating. I've been deliberate about correcting this: I now lean into smaller, faster releases, prioritize feedback loops, and trust the iteration cycle. The result is that I ship faster, learn faster, and deliver more value — without sacrificing quality.`,

    // ── Greatest accomplishment ────────────────────────────────────────────
    greatestAccomplishment: () =>
      `My most significant accomplishment was architecting and shipping a new system that became the foundation for several downstream initiatives. I owned the design, implementation, rollout, and monitoring end-to-end. The system shipped on time, scaled cleanly under production load, and is still in active use today. Beyond the technical outcome, what I'm most proud of is the operational discipline that made it possible — clear scoping, proactive risk management, and tight collaboration across product, design, and other engineering teams.`,

    // ── Project example ────────────────────────────────────────────────────
    projectExample: (ctx) => {
      const tech = ctx.sk?.languages || 'Python and TypeScript'
      return `One recent project involved building a high-throughput data pipeline that needed to scale from a few hundred events per minute to several thousand without degrading latency. I designed the architecture, implemented it in ${tech}, wrote the test suite, set up observability, and rolled it out behind feature flags. The result was a 4x throughput improvement, a 60% drop in p99 latency, and a clean rollout with zero incidents.`
    },

    // ── Conflict resolution ────────────────────────────────────────────────
    conflict: () =>
      `When I encounter disagreement on a team, my default is to understand first. I restate the other person's view in my own words to confirm I've heard them, then ask clarifying questions to pinpoint exactly where we differ. From there we can focus the discussion on the actual decision rather than talking past each other. In one recent case this approach turned what felt like a technical dispute into a clear product trade-off the whole team could align on quickly.`,

    // ── Failure / mistake ──────────────────────────────────────────────────
    failure: () =>
      `Early on I once committed to a delivery date before fully scoping the work. We missed the deadline by a week, and I took the lesson seriously: I now invest more upfront in scoping, breaking work down, and identifying risks before committing. I also over-communicate status — flagging slippage early so stakeholders can adjust. Since then I've consistently hit my commitments, and I'm a much more reliable engineer because of that experience.`,

    // ── Why leaving current role ───────────────────────────────────────────
    whyLeaving: () =>
      `I've learned a tremendous amount in my current role and I'm grateful for the opportunities I've had. At this point I'm looking for a next step with broader scope and impact — bigger technical challenges, more ownership, and the chance to work alongside a strong team on problems that genuinely matter. That's what's drawing me to this opportunity.`,

    // ── Career goals (5-10 yrs) ────────────────────────────────────────────
    careerGoals: () =>
      `My long-term goal is to grow as a technical leader and contribute to products with meaningful, measurable impact at scale. In the next few years I want to deepen my technical expertise, broaden my product judgment, and develop the people around me. I'm intentional about choosing roles where the team is strong and the problems are interesting — that's how I keep compounding.`,

    // ── Why we should hire you ─────────────────────────────────────────────
    whyHire: () =>
      `Three reasons. First, I bring directly relevant technical experience and a track record of shipping production-quality work end-to-end. Second, I'm a collaborative, low-ego teammate who lifts the bar of the people around me. Third, I genuinely care about the work — I'm not job-hopping, I'm choosing this role because it aligns with where I want to invest the next chapter of my career.`,

    // ── Greatest challenge ─────────────────────────────────────────────────
    greatestChallenge: () =>
      `One of the hardest challenges I've taken on was leading a critical migration with a tight deadline and several unknowns. I broke it into phases, built a clear migration plan with rollback gates at each phase, and over-communicated status. The migration shipped on time with zero data loss. The lesson I took from it: with disciplined scoping and clear communication, even genuinely hard problems become tractable.`,

    // ── Working under pressure ─────────────────────────────────────────────
    pressure: () =>
      `I thrive under pressure as long as the priorities are clear. When things get intense I focus hard on identifying what's actually critical vs. what feels urgent, communicate clearly about what's in and out of scope, and stay calm in execution. I find that high-stakes moments are often where teams gel best — when I help the team focus and move with clarity, that's when I do my best work.`,

    // ── Working in a team ──────────────────────────────────────────────────
    teamwork: () =>
      `I work best on teams that value clarity, candor, and trust. I default to over-communicating, I'm quick to offer help, and I'm comfortable having direct conversations when needed. I also make a point of being a reliable teammate — picking up the unglamorous work, mentoring more junior teammates, and giving credit generously when the team ships.`,

    // ── Leadership example ─────────────────────────────────────────────────
    leadership: () =>
      `I led a small initiative to improve our team's deployment process — it had become a source of friction and outages. I rallied a small working group, scoped the changes, drove the technical work, and rolled them out. Deploy times dropped meaningfully and incident rates fell. Beyond the outcome, the experience taught me a lot about influencing without authority and bringing teammates along with a change.`,

    // ── Innovation / creative thinking ─────────────────────────────────────
    innovation: () =>
      `My approach to innovation is "small bets, fast learning." I prototype quickly, test against real users or data, and double down only on the ideas that actually move metrics. One recent example: a small optimization I built and tested on a hunch ended up cutting a key processing step by 40% — it shipped to production within two weeks.`,

    // ── Time management / prioritization ───────────────────────────────────
    timeManagement: () =>
      `I prioritize by impact and unblock-ability. Every week I identify the 1–2 outcomes that will move things forward the most, and protect time to make real progress on them. I also block focus time, batch shallow work, and make sure I'm proactive about communicating status so nothing slips silently. The result is that I consistently ship the work that matters most.`,

    // ── Customer / user focus ──────────────────────────────────────────────
    customerFocus: () =>
      `Even on technical work I stay close to the user. I read support tickets, watch session replays when possible, and talk to anyone on the team who interacts with users directly. When I make engineering decisions, I'm asking "what does this feel like for the person on the other side?" That habit has saved more than one feature from shipping with a sharp edge.`,

    // ── Diversity / inclusion ──────────────────────────────────────────────
    diversity: () =>
      `I believe diverse teams ship better products, and I work to be the kind of teammate who actively supports that. In practice that means amplifying quieter voices in meetings, mentoring teammates from underrepresented backgrounds, and being thoughtful about how I give feedback and credit. I take this work seriously and I'd be glad to contribute to building a strong, inclusive engineering culture.`,

    // ── Learning agility / how do you learn ────────────────────────────────
    learning: () =>
      `I'm a hands-on learner — I learn fastest by reading the source, building something small, and asking questions of teammates who know the area well. I also invest deliberately in fundamentals: I revisit core concepts regularly, read post-mortems and design docs, and pay attention to how senior engineers I respect think through problems. That habit compounds.`,

    // ── Salary expectations text ───────────────────────────────────────────
    salaryReasoning: (ctx) => {
      const s = ctx.jp.expectedSalary || '85,000'
      return `Based on my experience, the market for this role, and the responsibilities described, my expectations are in the range of $${s}, though I'm flexible and would be happy to discuss the full compensation package — base, equity, and benefits — in context of the rest of the offer.`
    },

    // ── Notice period ──────────────────────────────────────────────────────
    noticeReasoning: (ctx) => {
      const n = ctx.jp.noticePeriod || ctx.p.notice || '2 weeks'
      return `I can give my current team ${n} of notice. I'd like to wrap up cleanly to keep things on good terms, but I'm motivated to start as soon as that allows.`
    },

    // ── Are you open to relocation ─────────────────────────────────────────
    relocationReasoning: () =>
      `Yes — I'm open to relocation for the right opportunity, and this role is definitely in that category. I'd want to understand the specifics around timing and any relocation support, but those are conversations I'd be excited to have.`,

    // ── Visa / sponsorship text ────────────────────────────────────────────
    sponsorshipReasoning: (ctx) => {
      if (/^no/i.test(ctx.p.sponsorship || 'No'))
        return `I do not require visa sponsorship now or in the future.`
      return `I would require sponsorship to work in this role. I'm happy to discuss specifics and timelines.`
    },

    // ── Background / EEO statement ─────────────────────────────────────────
    eeoStatement: () =>
      `I appreciate the opportunity to apply and look forward to the next steps. I'm happy to provide any additional information needed during the process.`,
  }

  // ─── Seeded answer router ─────────────────────────────────────────────────
  // Maps question phrasings (regex) → seeded answer key.
  // Runs BEFORE generic essay patterns so seeded answers always win.
  const SEEDED_PATTERNS = [
    // Tell me about yourself
    { match: /tell.{0,5}us.{0,5}about.{0,5}yourself|tell.{0,5}me.{0,5}about.{0,5}yourself|introduce.{0,5}yourself|brief.{0,5}intro|describe.{0,5}yourself|background.{0,5}summary|who.{0,5}are.{0,5}you/i,
      answer: (ctx) => SEEDED_ANSWERS.tellMeAboutYourself(ctx) },

    // Why this role
    { match: /why.{0,5}(this|the).{0,5}(role|position|job|opening)|what.{0,5}interests.{0,5}you.{0,5}about.{0,5}(this|the).{0,5}(role|position)|what.{0,5}attract.{0,5}you.{0,5}to.{0,5}(this|the).{0,5}(role|position)|why.{0,5}are.{0,5}you.{0,5}interested.{0,5}in.{0,5}(this|the).{0,5}(role|position)/i,
      answer: (ctx) => SEEDED_ANSWERS.whyThisRole(ctx) },

    // Why this company
    { match: /why.{0,5}(this|the|our).{0,5}(company|organization|team|firm)|why.{0,5}work.{0,5}(here|at|for).{0,5}us|what.{0,5}attract.{0,5}you.{0,5}to.{0,5}(this|the|our).{0,5}(company|organization)|why.{0,5}do.{0,5}you.{0,5}want.{0,5}to.{0,5}work.{0,5}(here|with us)/i,
      answer: (ctx) => SEEDED_ANSWERS.whyThisCompany(ctx) },

    // Cover letter
    { match: /cover.{0,5}letter|letter.{0,5}of.{0,5}interest|letter.{0,5}of.{0,5}motivation/i,
      answer: (ctx) => SEEDED_ANSWERS.coverLetter(ctx) },

    // Strengths
    { match: /(greatest|biggest|top|key|main).{0,5}strength|what.{0,5}are.{0,5}you.{0,5}good.{0,5}at|what.{0,5}makes.{0,5}you.{0,5}unique|what.{0,5}do.{0,5}you.{0,5}do.{0,5}well/i,
      answer: () => SEEDED_ANSWERS.strengths() },

    // Weaknesses
    { match: /(greatest|biggest|main).{0,5}weakness|area.{0,5}(for|of).{0,5}improvement|area.{0,5}of.{0,5}growth|develop.{0,5}area|need.{0,5}to.{0,5}improve|need.{0,5}to.{0,5}work.{0,5}on|where.{0,5}do.{0,5}you.{0,5}struggle/i,
      answer: () => SEEDED_ANSWERS.weaknesses() },

    // Greatest accomplishment / proudest moment
    { match: /(greatest|biggest|proudest).{0,5}(accomplishment|achievement)|most.{0,5}proud|what.{0,5}are.{0,5}you.{0,5}most.{0,5}proud.{0,5}of|biggest.{0,5}success/i,
      answer: () => SEEDED_ANSWERS.greatestAccomplishment() },

    // Project example / describe a project
    { match: /describe.{0,5}a.{0,5}project|recent.{0,5}project|favorite.{0,5}project|notable.{0,5}project|impactful.{0,5}project|technical.{0,5}project|walk.{0,5}us.{0,5}through.{0,5}a.{0,5}project/i,
      answer: (ctx) => SEEDED_ANSWERS.projectExample(ctx) },

    // Conflict
    { match: /(handle|deal.{0,5}with).{0,5}conflict|describe.{0,5}a.{0,5}conflict|difficult.{0,5}coworker|disagreement|disagree.{0,5}with.{0,5}(your|a).{0,5}(boss|manager|coworker|teammate)/i,
      answer: () => SEEDED_ANSWERS.conflict() },

    // Failure
    { match: /describe.{0,5}a.{0,5}failure|biggest.{0,5}failure|tell.{0,5}me.{0,5}about.{0,5}a.{0,5}time.{0,5}you.{0,5}failed|describe.{0,5}a.{0,5}mistake|learn.{0,5}from.{0,5}(failure|mistake)|setback/i,
      answer: () => SEEDED_ANSWERS.failure() },

    // Why leaving current role
    { match: /why.{0,5}are.{0,5}you.{0,5}leaving|why.{0,5}leave.{0,5}your.{0,5}current|reason.{0,5}for.{0,5}leaving|looking.{0,5}to.{0,5}leave|why.{0,5}change.{0,5}job/i,
      answer: () => SEEDED_ANSWERS.whyLeaving() },

    // Career goals
    { match: /career.{0,5}goal|long.?term.{0,5}goal|short.?term.{0,5}goal|5.{0,5}year|ten.{0,5}year|future.{0,5}plan|career.{0,5}aspir|where.{0,5}do.{0,5}you.{0,5}see.{0,5}yourself/i,
      answer: () => SEEDED_ANSWERS.careerGoals() },

    // Why hire you / best fit
    { match: /why.{0,5}should.{0,5}we.{0,5}hire.{0,5}you|what.{0,5}makes.{0,5}you.{0,5}(a.{0,5})?(good|great|the.{0,5}best).{0,5}fit|why.{0,5}are.{0,5}you.{0,5}the.{0,5}(best|right).{0,5}candidate|what.{0,5}sets.{0,5}you.{0,5}apart/i,
      answer: () => SEEDED_ANSWERS.whyHire() },

    // Greatest challenge
    { match: /(greatest|biggest).{0,5}challenge|hardest.{0,5}(problem|project|thing)|most.{0,5}difficult.{0,5}(problem|project|time)|describe.{0,5}a.{0,5}challenge/i,
      answer: () => SEEDED_ANSWERS.greatestChallenge() },

    // Working under pressure
    { match: /work.{0,5}under.{0,5}pressure|tight.{0,5}deadline|stressful.{0,5}situation|high.?pressure|stressful.{0,5}time/i,
      answer: () => SEEDED_ANSWERS.pressure() },

    // Teamwork
    { match: /work.{0,5}in.{0,5}a.{0,5}team|work.{0,5}with.{0,5}a.{0,5}team|teamwork|describe.{0,5}your.{0,5}team|collaborat.{0,5}with.{0,5}others/i,
      answer: () => SEEDED_ANSWERS.teamwork() },

    // Leadership
    { match: /describe.{0,5}a.{0,5}time.{0,5}you.{0,5}led|leadership.{0,5}example|tell.{0,5}me.{0,5}about.{0,5}a.{0,5}time.{0,5}you.{0,5}led|leading.{0,5}a.{0,5}team|managed.{0,5}a.{0,5}team|leadership.{0,5}experience/i,
      answer: () => SEEDED_ANSWERS.leadership() },

    // Innovation / creativity
    { match: /innovat|creative.{0,5}solution|think.{0,5}outside|out.{0,5}of.{0,5}the.{0,5}box|novel.{0,5}approach/i,
      answer: () => SEEDED_ANSWERS.innovation() },

    // Time management / prioritization
    { match: /time.{0,5}management|how.{0,5}do.{0,5}you.{0,5}prioritize|prioritization|handle.{0,5}multiple.{0,5}(task|project|deadline)|juggle.{0,5}multiple/i,
      answer: () => SEEDED_ANSWERS.timeManagement() },

    // Customer / user focus
    { match: /customer.{0,5}focus|user.{0,5}focus|customer.{0,5}centric|user.{0,5}centric|customer.{0,5}service|put.{0,5}customers/i,
      answer: () => SEEDED_ANSWERS.customerFocus() },

    // Diversity / inclusion
    { match: /diversity|inclus|underrepresent|equity.{0,5}and.{0,5}inclusion|dei\b|d&i\b|diverse.{0,5}team/i,
      answer: () => SEEDED_ANSWERS.diversity() },

    // Learning
    { match: /how.{0,5}do.{0,5}you.{0,5}learn|approach.{0,5}to.{0,5}learning|continuous.{0,5}learning|self.?learn|stay.{0,5}up.{0,5}to.{0,5}date|stay.{0,5}current/i,
      answer: () => SEEDED_ANSWERS.learning() },

    // Salary reasoning (open text fields)
    { match: /explain.{0,5}your.{0,5}salary|salary.{0,5}reasoning|salary.{0,5}justif|why.{0,5}this.{0,5}salary|compensation.{0,5}rationale/i,
      answer: (ctx) => SEEDED_ANSWERS.salaryReasoning(ctx) },

    // Notice / availability reasoning text
    { match: /explain.{0,5}your.{0,5}notice|notice.{0,5}reasoning|when.{0,5}can.{0,5}you.{0,5}realistically.{0,5}start.{0,5}and.{0,5}why/i,
      answer: (ctx) => SEEDED_ANSWERS.noticeReasoning(ctx) },

    // Relocation reasoning
    { match: /willing.{0,5}to.{0,5}relocate.{0,5}explain|relocation.{0,5}reason|why.{0,5}relocate/i,
      answer: () => SEEDED_ANSWERS.relocationReasoning() },

    // Sponsorship explain
    { match: /explain.{0,5}sponsor|sponsor.{0,5}reasoning|why.{0,5}do.{0,5}you.{0,5}need.{0,5}sponsor/i,
      answer: (ctx) => SEEDED_ANSWERS.sponsorshipReasoning(ctx) },

    // Anything else / additional info
    { match: /anything.{0,5}else.{0,5}we.{0,5}should.{0,5}know|additional.{0,5}(info|information|comments|notes)|other.{0,5}(comments|info)|is.{0,5}there.{0,5}anything.{0,5}else/i,
      answer: () => SEEDED_ANSWERS.eeoStatement() },

    // What questions do you have for us
    { match: /question.{0,5}for.{0,5}us|what.{0,5}questions.{0,5}do.{0,5}you.{0,5}have/i,
      answer: () => `I'd love to understand more about how the team is currently structured, what success looks like in the first 90 days, and what the biggest technical challenges are for the team right now. I'm sure I'll have more once we get into the conversation.` },
  ]

  // ─── 18. LONG-FORM / ESSAY TEMPLATES ──────────────────────────────────────
  const ESSAY_PATTERNS = [
    // Cover letter
    { match: /cover.{0,5}letter|letter.{0,5}of.{0,5}interest/i,
      answer: (ctx) => {
        const name  = ctx.p.fullName || 'I'
        const role  = ctx.jp.keywords || 'this role'
        return `Dear Hiring Team,

I am excited to apply for ${role}. With hands-on experience delivering production software and a track record of cross-functional collaboration, I am confident in my ability to make an immediate, measurable impact on your team.

Throughout my career I have prioritized building reliable, well-tested systems while maintaining a strong focus on user outcomes. I am drawn to your organization for its reputation, mission, and ambitious technical roadmap, and I would welcome the opportunity to contribute.

Thank you for your consideration.

Sincerely,
${name}` }
    },

    // Why this role / company
    { match: /why.{0,5}(this|the).{0,5}(role|position|job|company|organization)|why.{0,5}are.{0,5}you.{0,5}interested|what.{0,5}attracts|what.{0,5}draws.{0,5}you|why.{0,5}do.{0,5}you.{0,5}want|motivat/i,
      answer: (ctx) =>
        `I am highly motivated by the chance to work on impactful problems alongside a strong team. The scope of this role aligns directly with my technical strengths and the kind of work I am most excited to grow in, and the company's product and trajectory make this an environment where I can both contribute meaningfully and continue developing.`
    },

    // Tell me about yourself
    { match: /tell.{0,5}us.{0,5}about.{0,5}yourself|tell.{0,5}me.{0,5}about.{0,5}yourself|about.{0,5}yourself|introduce.{0,5}yourself/i,
      answer: (ctx) => {
        const role = ctx.jp.keywords || 'software'
        return `I am a results-driven ${role} professional with a strong track record of building reliable systems, collaborating across disciplines, and shipping work that produces measurable outcomes. I value clean engineering, clear communication, and continuous learning, and I am excited about the opportunity to bring this approach to your team.`
      }
    },

    // Strengths
    { match: /strength|what.{0,5}you.{0,5}bring|what.{0,5}makes.{0,5}you|best.{0,5}qualit/i,
      answer: () => 'My greatest strengths are strong problem-solving, clear communication, and the ability to take ownership of complex projects end-to-end. I am known for raising the technical bar on the work I touch while being a collaborative, low-ego teammate.'
    },

    // Weaknesses
    { match: /weakness|area.{0,5}improv|develop.{0,5}area|growth.{0,5}area/i,
      answer: () => 'Earlier in my career I had a tendency to over-engineer solutions in pursuit of perfection. I have learned to ship pragmatic v1s, gather real feedback, and iterate — which has made me a much faster, more impactful contributor.'
    },

    // Examples / behavioral
    { match: /example|describe.{0,5}a.{0,5}time|tell.{0,5}us.{0,5}a.{0,5}time|situation.{0,5}where|walk.{0,5}us.{0,5}through|share.{0,5}an.{0,5}experience/i,
      answer: (ctx) => {
        const role = ctx.jp.keywords || 'engineer'
        return `As a ${role}, I led a cross-functional effort to ship a critical platform improvement under a tight deadline. I scoped the work, partnered with product and design to align trade-offs, drove the technical design, and shipped the change end-to-end. The result was a 40% reduction in processing time, measurable adoption gains, and a clean rollout with no production incidents.`
      }
    },

    // Project / achievement
    { match: /achievement|accomplishment|proud.{0,5}of|impact.{0,5}you|recent.{0,5}project|favorite.{0,5}project|notable.{0,5}work/i,
      answer: () =>
        `One of my most impactful projects involved architecting and shipping a new system from scratch that became the foundation for several downstream initiatives. I owned the design, implementation, rollout, and monitoring. The system shipped on time, scaled cleanly to production load, and is still in active use today — a result I am genuinely proud of.`
    },

    // Career goals
    { match: /career.{0,5}goal|long.?term.{0,5}goal|5.{0,5}years|future.{0,5}plan|career.{0,5}aspir/i,
      answer: () =>
        `My long-term goal is to grow as a technical leader and contribute to products that have meaningful, measurable impact at scale. In the medium term I am focused on deepening my technical expertise, broadening my product judgment, and continuing to develop the people I work with.`
    },

    // Why we should hire you
    { match: /why.{0,5}should.{0,5}we.{0,5}hire|what.{0,5}makes.{0,5}you.{0,5}a.{0,5}good.{0,5}fit|why.{0,5}are.{0,5}you.{0,5}the.{0,5}best/i,
      answer: () =>
        `I bring a strong technical foundation, a track record of shipping production-quality work, and the kind of collaborative attitude that lifts a team. I would join with an immediate focus on learning the codebase, building trust with my teammates, and contributing real value as quickly as possible.`
    },

    // Manager / leadership style
    { match: /management.{0,5}style|leadership.{0,5}style|how.{0,5}do.{0,5}you.{0,5}lead/i,
      answer: () =>
        `My style is collaborative and outcome-driven. I focus on setting clear context, removing blockers, and giving teammates the autonomy to do their best work — while staying close enough to coach, unblock, and raise the bar where it matters.`
    },

    // Handle conflict / difficult coworker
    { match: /conflict|difficult.{0,5}coworker|disagreement|disagree.{0,5}with/i,
      answer: () =>
        `When I run into disagreement I default to understanding first — restating the other person's view in my own words and asking clarifying questions. From there we can identify where we actually differ and align on a path forward that the whole team can support, even if it isn't anyone's first choice.`
    },

    // Failure / mistake
    { match: /failure|biggest.{0,5}mistake|setback|learn.{0,5}from.{0,5}failure|describe.{0,5}a.{0,5}time.{0,5}you.{0,5}failed/i,
      answer: () =>
        `Early on I once over-committed to a deadline before fully scoping the work. We missed it, and I learned an important lesson about scoping diligence and over-communicating risk early. Since then I have built a strong habit of upfront scoping and proactive status updates, and it has made me a much more reliable engineer.`
    },

    // Generic descriptive / explain
    { match: /^describe\b|^explain\b|^what.{0,5}is\b/i,
      answer: () =>
        `I have hands-on experience in this area through both day-to-day work and dedicated projects. I am comfortable working independently and partnering closely with cross-functional stakeholders, and I would be glad to share specific examples in more detail.`
    },

    // Skills / qualifications summary
    { match: /key.{0,5}skill|relevant.{0,5}skill|core.{0,5}skill|primary.{0,5}skill|top.{0,5}skill/i,
      answer: (ctx) => {
        const langs = ctx.sk?.languages || 'Python, JavaScript, TypeScript, Java, SQL'
        return `Core skills include ${langs}, with strong fundamentals in system design, cloud infrastructure, testing discipline, and cross-functional collaboration.`
      }
    },
  ]

  // ─── 19. SOURCE / REFERRAL / "HOW DID YOU HEAR" ───────────────────────────
  const SOURCE_PATTERNS = [
    { match: /how.{0,5}did.{0,5}you.{0,5}hear|how.{0,5}did.{0,5}you.{0,5}learn|where.{0,5}did.{0,5}you.{0,5}find|source.{0,5}of.{0,5}application|referral.{0,5}source|how.{0,5}did.{0,5}you.{0,5}find/i,
      answer: (_, options) => findOpt(options,
        /linkedin/i, /job.{0,5}board/i, /company.{0,5}website/i, /other/i
      ) || realOption(options) || 'LinkedIn' },

    { match: /referred.{0,5}by|referral.{0,5}name|employee.{0,5}referral|name.{0,5}of.{0,5}referrer/i,
      answer: () => '' },

    { match: /know.{0,5}anyone|currently.{0,5}work|previous(ly)?.{0,5}work|worked.{0,5}at|worked.{0,5}for.{0,5}us|former.{0,5}employee/i,
      answer: (_, options) => findOpt(options, /no|don.t|never/i) || 'No' },
  ]

  // ─── 20. PHONE TYPE / CONTACT PREFERENCE ──────────────────────────────────
  const CONTACT_PATTERNS = [
    { match: /phone.{0,5}type|type.{0,5}of.{0,5}phone|number.{0,5}type|contact.{0,5}type|^type$/i,
      answer: (_, options) => findOpt(options, /mobile|cell/i, /home/i, /work/i) || realOption(options) || 'Mobile' },

    { match: /best.{0,5}time.{0,5}to.{0,5}contact|preferred.{0,5}contact.{0,5}time/i,
      answer: (_, options) => findOpt(options, /any|anytime|business hour|evening/i) || realOption(options) || 'Anytime' },

    { match: /preferred.{0,5}method.{0,5}contact|contact.{0,5}preference|how.{0,5}should.{0,5}we.{0,5}contact/i,
      answer: (_, options) => findOpt(options, /email/i, /phone/i) || realOption(options) || 'Email' },

    { match: /\bemail\b(?!.*confirm).*address|^email\b|email$/i,
      answer: (ctx) => ctx.p.email || '' },

    { match: /confirm.{0,5}email|verify.{0,5}email|email.{0,5}again|re.?enter.{0,5}email/i,
      answer: (ctx) => ctx.p.email || '' },

    { match: /^phone|mobile.{0,5}number|cell.{0,5}number|contact.{0,5}number|tel(ephone)?.{0,5}number/i,
      answer: (ctx) => ctx.p.phone || '' },

    { match: /phone.{0,5}country|country.{0,5}code/i,
      answer: (ctx, options) => {
        const c = (ctx.p.country || ctx.p.location || '').toLowerCase()
        if (c.includes('canada')) return findOpt(options, /canada|\+1/i) || realOption(options)
        if (c.includes('united kingdom') || c.includes('uk')) return findOpt(options, /united kingdom|\+44/i) || realOption(options)
        if (c.includes('india')) return findOpt(options, /india|\+91/i) || realOption(options)
        return findOpt(options, /united states|usa|\+1/i) || realOption(options)
      } },
  ]

  // ─── 21. ADDRESS SUB-FIELDS ───────────────────────────────────────────────
  const ADDRESS_PATTERNS = [
    { match: /^street$|address.{0,5}line.{0,5}1|^address.{0,5}line$|street.{0,5}address/i,
      answer: (ctx) => ctx.p.street || ctx.p.location || '' },

    { match: /address.{0,5}line.{0,5}2|apt|suite|unit/i,
      answer: () => '' },

    { match: /^city$|^town$|city\/town/i,
      answer: (ctx) => ctx.p.city || (ctx.p.location || '').split(',')[0]?.trim() || '' },

    { match: /^state$|province|state\/province|^region$/i,
      answer: (ctx, options) => {
        const s = ctx.p.state || (ctx.p.location || '').split(',')[1]?.trim() || ''
        if (options.length) return findOpt(options, new RegExp(s, 'i')) || realOption(options)
        return s
      } },

    { match: /postal.{0,5}code|^zip$|zip.{0,5}code|pin.{0,5}code|pincode/i,
      answer: (ctx) => ctx.p.zip || ctx.p.postalCode || '' },

    { match: /^country$|country.{0,5}of.{0,5}residence|country.{0,5}you.{0,5}live/i,
      answer: (ctx, options) => {
        const c = ctx.p.country || (ctx.p.location || '').split(',').slice(-1)[0]?.trim() || ''
        return findOpt(options, new RegExp(c, 'i'),
          /united states|usa/i, /canada/i) || realOption(options)
      } },

    // Mailing address same as primary
    { match: /mailing.{0,5}address.{0,5}same|same.{0,5}address/i,
      answer: (_, options) => findOpt(options, /yes|same/i) || 'Yes' },
  ]

  // ─── 22. URLS / LINKS ─────────────────────────────────────────────────────
  const URL_PATTERNS = [
    { match: /\blinkedin\b.{0,5}(url|profile|link)|linkedin.{0,5}profile/i,
      answer: (ctx) => ctx.p.linkedin || '' },
    { match: /\bgithub\b/i,
      answer: (ctx) => ctx.p.github || '' },
    { match: /portfolio|personal.{0,5}url|personal.{0,5}website|website|personal.{0,5}page/i,
      answer: (ctx) => ctx.p.portfolio || ctx.p.github || '' },
    { match: /additional.{0,5}link|other.{0,5}link/i,
      answer: (ctx) => ctx.p.portfolio || ctx.p.github || ctx.p.linkedin || '' },
    { match: /twitter|x\.com/i,
      answer: (ctx) => ctx.p.twitter || '' },
    { match: /stack.{0,5}overflow/i,
      answer: () => '' },
    { match: /medium|blog|substack/i,
      answer: () => '' },
  ]

  // ─── 23. INDUSTRY / SECTOR / COMPANY SIZE ─────────────────────────────────
  const INDUSTRY_PATTERNS = [
    { match: /^industry$|industry.{0,5}experience|sector|industry.{0,5}background|domain.{0,5}experience/i,
      answer: (_, options) => findOpt(options,
        /tech|software|information.{0,5}tech|computer|saas/i,
        /financ|bank/i,
        /healthcare/i
      ) || realOption(options) },

    { match: /company.{0,5}size|prefer.{0,5}company.{0,5}size|startup.{0,5}vs/i,
      answer: (_, options) => findOpt(options, /any|all|open|no.{0,5}preference|flexible/i) || realOption(options) || 'Any' },

    { match: /startup|early.?stage|series.{0,5}[abc]/i,
      answer: (_, options) => findOpt(options, /yes|open|comfortable|interested/i) || 'Yes' },
  ]

  // ─── 24. EMPLOYMENT TYPE / SCHEDULE ───────────────────────────────────────
  const EMPLOYMENT_PATTERNS = [
    { match: /full.?time|part.?time|contract|permanent|temporary|employment.{0,5}type|type.{0,5}of.{0,5}employment|work.{0,5}type|job.{0,5}type/i,
      answer: (_, options) => findOpt(options,
        /full.?time/i, /permanent/i, /regular/i
      ) || realOption(options) || 'Full-time' },

    { match: /shift|schedule|hours|overnight|weekend|night|day.{0,5}shift|graveyard/i,
      answer: (_, options) => findOpt(options,
        /flexible|day|standard|any|business hour/i
      ) || findOpt(options, /yes|willing|open/i) || realOption(options) || 'Flexible' },

    { match: /how.{0,5}many.{0,5}hours|hours.{0,5}per.{0,5}week/i,
      answer: () => '40' },

    { match: /overtime/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|occasional/i) || 'Yes' },

    { match: /weekend.{0,5}availability|saturday|sunday/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|flexible/i) || 'Yes' },

    { match: /holiday.{0,5}availability/i,
      answer: (_, options) => findOpt(options, /yes|willing|open/i) || 'Yes' },
  ]

  // ─── 25. CERTIFICATIONS / LICENSES ────────────────────────────────────────
  const CERT_PATTERNS = [
    { match: /certif|licen|certification.{0,5}you.{0,5}hold/i,
      answer: (_, options) => findOpt(options, /no|none|don.t.{0,5}have/i) || 'None' },

    { match: /\bpmp\b|project.{0,5}management.{0,5}professional/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },

    { match: /\baws.{0,5}cert|aws.{0,5}certified/i,
      answer: (_, options) => findOpt(options, /no|none|not.{0,5}yet/i) || 'No' },

    { match: /\bazure.{0,5}cert/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },

    { match: /\bgoogle.{0,5}cert|gcp.{0,5}cert/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },

    { match: /\bcissp\b|\bcism\b|\bcomptia\b|\bsecurity\+/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },

    { match: /scrum.{0,5}master|csm\b|psm\b/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },

    { match: /six.{0,5}sigma|black.{0,5}belt|green.{0,5}belt/i,
      answer: (_, options) => findOpt(options, /no|none/i) || 'No' },
  ]

  // ─── 26. LANGUAGE / FLUENCY ───────────────────────────────────────────────
  const LANGUAGE_FLUENCY_PATTERNS = [
    { match: /english.{0,5}proficien|english.{0,5}level|english.{0,5}fluency|level.{0,5}of.{0,5}english/i,
      answer: (_, options) => findOpt(options,
        /native/i, /full.{0,5}professional|fluent/i, /professional/i, /advanced/i
      ) || realOption(options) || 'Native' },

    { match: /spanish|french|german|mandarin|chinese|japanese|korean|portuguese|arabic|hindi|russian|italian|dutch/i,
      answer: (_, options) => {
        if (!options.length) return ''
        return findOpt(options,
          /none|do not speak|n\/a|basic/i,
          /elementary/i
        ) || realOption(options)
      } },

    { match: /language.{0,5}you.{0,5}speak|languages.{0,5}spoken|other.{0,5}language/i,
      answer: (_, options) => findOpt(options, /english/i) || realOption(options) || 'English' },

    { match: /bilingual|multilingual/i,
      answer: (_, options) => findOpt(options, /yes/i, /no/i) || 'No' },
  ]

  // ─── 27. SKILL SELF-RATING ────────────────────────────────────────────────
  const SKILL_RATING_PATTERNS = [
    { match: /rate.{0,5}yourself|self.?rat|skill.{0,5}level|expertise.{0,5}level|proficiency.{0,5}level/i,
      answer: (_, options) => findOpt(options,
        /advanced|proficient/i, /intermediate/i, /\b[78]\b/, /\b4\b.*\b5\b/
      ) || options[Math.floor(options.length / 2)] || realOption(options) },

    { match: /scale.{0,5}of.{0,5}1.{0,5}10|rate.{0,5}1.{0,5}10/i,
      answer: () => '8' },

    { match: /scale.{0,5}of.{0,5}1.{0,5}5/i,
      answer: () => '4' },
  ]

  // ─── 28. EQUIPMENT / WORKSPACE ────────────────────────────────────────────
  const EQUIPMENT_PATTERNS = [
    { match: /reliable.{0,5}internet|high.?speed.{0,5}internet|home.{0,5}internet|broadband/i,
      answer: (_, options) => findOpt(options, /yes|have|reliable/i) || 'Yes' },

    { match: /quiet.{0,5}workspace|dedicated.{0,5}workspace|home.{0,5}office|workspace.{0,5}home/i,
      answer: (_, options) => findOpt(options, /yes|have/i) || 'Yes' },

    { match: /laptop|computer.{0,5}setup|own.{0,5}equipment|equipment.{0,5}provid/i,
      answer: (_, options) => findOpt(options, /yes|have/i) || 'Yes' },

    { match: /webcam|microphone|headset/i,
      answer: (_, options) => findOpt(options, /yes|have/i) || 'Yes' },
  ]

  // ─── 29. PERSONALITY / CULTURE FIT ────────────────────────────────────────
  const CULTURE_PATTERNS = [
    { match: /team.{0,5}player|work.{0,5}well.{0,5}in.{0,5}team/i,
      answer: (_, options) => findOpt(options, /yes|strongly|agree/i) || 'Yes' },

    { match: /independent|work.{0,5}independent|self.?direct|self.?motivat/i,
      answer: (_, options) => findOpt(options, /yes|strongly|agree/i) || 'Yes' },

    { match: /learn.{0,5}quickly|fast.{0,5}learner|quick.{0,5}learner/i,
      answer: (_, options) => findOpt(options, /yes|agree|strongly/i) || 'Yes' },

    { match: /detail.?oriented|attention.{0,5}to.{0,5}detail/i,
      answer: (_, options) => findOpt(options, /yes|strongly|agree/i) || 'Yes' },

    { match: /pressure|deadline|stress|fast.?paced/i,
      answer: (_, options) => findOpt(options, /yes|comfortable|thrive|enjoy/i) || 'Yes' },

    { match: /ambiguity|uncertain|undefined.{0,5}problem/i,
      answer: (_, options) => findOpt(options, /yes|comfortable|thrive/i) || 'Yes' },
  ]

  // ─── 30. AGREEMENT / CONSENT FORMS (catch-all) ────────────────────────────
  const AGREEMENT_PATTERNS = [
    { match: /privacy.{0,5}policy|i.{0,5}have.{0,5}read|terms.{0,5}of.{0,5}service|gdpr|data.{0,5}protect/i,
      answer: (_, options) => findOpt(options, /yes|i agree|i accept|i consent|i acknowledge|i have read/i) || 'Yes' },

    { match: /receive.{0,5}email|marketing.{0,5}email|opt.?in|subscribe|newsletter/i,
      answer: (_, options) => findOpt(options, /no|opt.?out|unsubscribe/i) || 'No' },

    { match: /share.{0,5}information|share.{0,5}data|share.{0,5}with.{0,5}third/i,
      answer: (_, options) => findOpt(options, /no|don.t|do not/i) || 'No' },

    { match: /candidate.{0,5}pool|future.{0,5}opportunit|keep.{0,5}on.{0,5}file/i,
      answer: (_, options) => findOpt(options, /yes|i agree|keep me/i) || 'Yes' },
  ]

  // ─── 31. GENERIC YES/NO PATTERNS ──────────────────────────────────────────
  const GENERIC_PATTERNS = [
    // Are you able to / can you / will you / would you / do you
    { match: /^are.{0,5}you.{0,5}(able|willing|comfortable|familiar|experienced|interested|open)/i,
      answer: (_, options) => findOpt(options, /yes|i am|able|willing/i) || 'Yes' },
    { match: /^can.{0,5}you\b/i,
      answer: (_, options) => findOpt(options, /yes|i can/i) || 'Yes' },
    { match: /^will.{0,5}you\b/i,
      answer: (_, options) => findOpt(options, /yes|i will/i) || 'Yes' },
    { match: /^would.{0,5}you\b/i,
      answer: (_, options) => findOpt(options, /yes|i would/i) || 'Yes' },
    { match: /^do.{0,5}you\b/i,
      answer: (_, options) => findOpt(options, /yes|i do/i) || 'Yes' },
    { match: /^have.{0,5}you\b/i,
      answer: (_, options) => findOpt(options, /yes|i have/i) || 'Yes' },

    // Comfortable with X
    { match: /comfortable.{0,5}with|familiar.{0,5}with|experience.{0,5}with/i,
      answer: (_, options) => findOpt(options, /yes|comfortable|familiar/i) || 'Yes' },

    // Willing / open / available
    { match: /\bwilling\b|\bopen\.{0,5}to\b|\bavailable\b/i,
      answer: (_, options) => findOpt(options, /yes|willing|open|available/i) || 'Yes' },

    // Generic confirmation prompts
    { match: /confirm|verify|attest|acknowledge|i.{0,5}understand/i,
      answer: (_, options) => findOpt(options, /yes|i confirm|i understand|i acknowledge|i agree/i) || 'Yes' },
  ]

  // ═════════════════════════════════════════════════════════════════════════
  //  COMBINE ALL PATTERNS  (order matters — most specific first)
  // ═════════════════════════════════════════════════════════════════════════
  const ALL_PATTERNS = [
    // ✦ TOP PRIORITY — pre-seeded answers (we type these directly, no AI) ✦
    ...SEEDED_PATTERNS,
    // High-priority catch-alls
    ...VIDEO_PATTERNS,
    ...IDENTITY_PATTERNS,
    ...VISA_PATTERNS,
    ...EEO_PATTERNS,
    ...EDUCATION_PATTERNS,
    ...YOE_PATTERNS,
    ...EXPERIENCE_QUESTION_PATTERNS,
    ...SALARY_PATTERNS,
    ...AVAILABILITY_PATTERNS,
    ...WORK_ARRANGEMENT_PATTERNS,
    ...RELOCATION_PATTERNS,
    ...LEGAL_PATTERNS,
    ...LANGUAGE_PATTERNS,
    ...FRAMEWORK_PATTERNS,
    ...CLOUD_PATTERNS,
    ...DATABASE_PATTERNS,
    ...TOOL_PATTERNS,
    ...METHODOLOGY_PATTERNS,
    ...ESSAY_PATTERNS,
    ...SOURCE_PATTERNS,
    ...CONTACT_PATTERNS,
    ...ADDRESS_PATTERNS,
    ...URL_PATTERNS,
    ...INDUSTRY_PATTERNS,
    ...EMPLOYMENT_PATTERNS,
    ...CERT_PATTERNS,
    ...LANGUAGE_FLUENCY_PATTERNS,
    ...SKILL_RATING_PATTERNS,
    ...EQUIPMENT_PATTERNS,
    ...CULTURE_PATTERNS,
    ...AGREEMENT_PATTERNS,
    ...GENERIC_PATTERNS,
  ]

  // ═════════════════════════════════════════════════════════════════════════
  //  MAIN LOOKUP
  // ═════════════════════════════════════════════════════════════════════════
  function lookup(label, options, profile, currentJob) {
    if (!label) return null
    const l   = label.toLowerCase().trim()
    const ctx = {
      profile,
      currentJob: currentJob || null,
      p:  profile?.profile        || {},
      ed: profile?.education      || {},
      sk: profile?.skills         || {},
      jp: profile?.jobPreferences || {},
    }
    options = options || []

    for (const { match, answer } of ALL_PATTERNS) {
      if (match.test(l)) {
        try {
          const result = answer(ctx, options, label)
          if (result !== null && result !== undefined) return String(result)
        } catch (e) { /* swallow & continue */ }
      }
    }
    return null
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  EXPOSE
  // ═════════════════════════════════════════════════════════════════════════
  globalThis.REBLET_KB = {
    lookup,
    patterns: ALL_PATTERNS,
    size: ALL_PATTERNS.length,
  }

  // Log on load (visible in DevTools)
  try { console.log(`[reblet] knowledge base loaded — ${ALL_PATTERNS.length} patterns`) } catch (e) {}
})()
