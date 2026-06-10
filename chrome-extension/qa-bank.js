/* ════════════════════════════════════════════════════════════════════════════
   REBLET Q&A BANK — 1000+ PRE-SEEDED ANSWERS
   ──────────────────────────────────────────────────────────────────────────
   Massive question→answer database that runs BEFORE the main knowledge base
   so the bot can type pre-written replies with zero AI calls.

   Structure:
     - Section A: Hand-written Q&A for essay/behavioral questions (~300)
     - Section B: Programmatically-generated tech experience Q&A (~600)
     - Section C: Programmatically-generated yes/no Q&A (~150)
     - Section D: Programmatically-generated years-of-X Q&A (~100)

   Exposes:  globalThis.REBLET_QA_BANK = { lookup(label, options, profile, job) }
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ─── helpers ───────────────────────────────────────────────────────────────
  const findOpt = (options, ...patterns) => {
    for (const p of patterns) {
      const m = options.find(o => p.test(o))
      if (m) return m
    }
    return null
  }
  const realOption = (options) => {
    if (!options.length) return ''
    const ph = /^(select|choose|pick|please.*select|--|none)/i
    return options.find(o => !ph.test(o)) || options[0]
  }
  const yesPick = (options) => {
    if (!options.length) return 'Yes'
    if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
    if (options.length === 2 && /yes/i.test(options[1])) return 'Yes'
    return findOpt(options, /^yes$/i, /yes|agree|i am|i do/i) || realOption(options)
  }
  const noPick = (options) => {
    if (!options.length) return 'No'
    return findOpt(options, /^no$/i, /no|none|don.t|never|n\/a/i) || realOption(options)
  }
  const skillLevel = (options) => {
    if (!options.length) return 'Yes'
    if (options.length === 2 && /yes/i.test(options[0])) return 'Yes'
    return findOpt(options,
      /advanced|expert|proficient|professional/i,
      /intermediate|comfortable/i,
      /yes|familiar|some/i
    ) || options[Math.floor(options.length / 2)] || realOption(options)
  }
  const yoeMatch = (ctx, options) => {
    const y = String(ctx.jp?.yearsExp || '2')
    if (!options.length) return y
    const exact = options.find(o => o.trim() === y)
    if (exact) return exact
    const yNum = parseInt(y)
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
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SECTION A — HAND-WRITTEN ESSAY / BEHAVIORAL ANSWERS (~300)
  // ════════════════════════════════════════════════════════════════════════════

  const HAND_WRITTEN = [
    // ── Self-intro variants (15) ────────────────────────────────────────────
    { match: /^introduce.{0,5}yourself|please.{0,5}introduce|brief.{0,5}intro/i,
      answer: (c) => `I'm a ${c.jp?.keywords || 'software engineer'} with ${c.jp?.yearsExp || '2'}+ years of hands-on experience shipping production systems. I focus on reliable, well-tested work and I care deeply about user outcomes. I'd be glad to share more in the next round.` },
    { match: /walk.{0,5}me.{0,5}through.{0,5}your.{0,5}(resume|background|cv)/i,
      answer: (c) => `My background is in ${c.jp?.keywords || 'software'}, with hands-on experience across the full stack of building, shipping, and maintaining production systems. I've collaborated cross-functionally, taken ownership of end-to-end work, and consistently focused on outcomes that matter to users and the business.` },
    { match: /describe.{0,5}your.{0,5}(background|experience|journey)/i,
      answer: (c) => `My experience spans hands-on engineering across the full lifecycle — design, implementation, testing, deployment, and iteration. I've worked on systems at varying scales and consistently focused on the highest-leverage problems. I bring a balanced mix of technical depth and product judgment.` },
    { match: /elevator.{0,5}pitch|sell.{0,5}yourself/i,
      answer: (c) => `I'm a ${c.jp?.keywords || 'software engineer'} who ships reliable work end-to-end, communicates clearly, and lifts the bar on the teams I'm part of. I'd love to bring those strengths here.` },
    { match: /summary.{0,5}of.{0,5}your.{0,5}(experience|qualifications|profile)/i,
      answer: (c) => `${c.jp?.yearsExp || '2'}+ years of professional experience as a ${c.jp?.keywords || 'software engineer'}, strong end-to-end ownership across implementation and rollout, with a focus on production reliability and clear cross-functional collaboration.` },

    // ── Why this / fit (20) ─────────────────────────────────────────────────
    { match: /what.{0,5}excites.{0,5}you.{0,5}about/i,
      answer: (c) => `The technical challenges and the team's reputation. The work itself maps closely to where I want to invest my next chapter, and the impact described is genuinely meaningful.` },
    { match: /what.{0,5}draws.{0,5}you/i,
      answer: () => `The combination of technical depth, the team's caliber, and the opportunity to do work that has clear, measurable impact.` },
    { match: /why.{0,5}now|why.{0,5}make.{0,5}this.{0,5}change/i,
      answer: () => `I've gotten a lot from my current role, but I'm ready for broader scope and impact. The fit between this opportunity and where I want to grow is excellent — that's why I'm acting on it now.` },
    { match: /what.{0,5}makes.{0,5}you.{0,5}qualified/i,
      answer: (c) => `Directly relevant ${c.jp?.yearsExp || '2'}+ years of hands-on experience, a strong record of end-to-end delivery, and the kind of collaborative attitude that helps teams move faster.` },
    { match: /how.{0,5}does.{0,5}this.{0,5}role.{0,5}fit/i,
      answer: () => `It aligns directly with both my technical strengths and the kind of impact I want to have. The scope, the team, and the trajectory all point in the same direction.` },
    { match: /what.{0,5}do.{0,5}you.{0,5}know.{0,5}about.{0,5}(us|our.{0,5}company)/i,
      answer: (c) => `I've read through ${c.currentJob?.company || 'the company'}'s product, recent announcements, and the team behind it. The mission resonates, the technical work looks substantive, and the trajectory looks strong — those are the three things I weight most when choosing where to invest my time.` },
    { match: /research.{0,5}on.{0,5}(us|our.{0,5}company)/i,
      answer: () => `I've read the product pages, recent blog posts, and a few external reviews. The mission, the technical bar, and the trajectory all stood out to me as exactly the kind of place I want to do my next chapter of work.` },
    { match: /how.{0,5}can.{0,5}you.{0,5}contribute/i,
      answer: (c) => `I'd start by ramping fast — reading the code, understanding the product, and listening carefully to the team. From there I'd focus on shipping reliable work end-to-end, raising the technical bar where I can, and being the kind of teammate who lifts the people around them.` },
    { match: /first.{0,5}90.{0,5}days|first.{0,5}three.{0,5}months/i,
      answer: () => `Listen and learn fast: ramp on the codebase, the product, and the team's working style. Ship a few small but visible wins to build trust. Identify the highest-leverage problems I can take on next. By day 90 I want to be operating as a clearly net-positive teammate.` },

    // ── Strengths variants (15) ─────────────────────────────────────────────
    { match: /your.{0,5}top.{0,5}three|top.{0,5}3.{0,5}strength/i,
      answer: () => `End-to-end ownership, clear communication, and a strong bias toward shipping reliable work.` },
    { match: /three.{0,5}words.{0,5}describe.{0,5}you/i,
      answer: () => `Reliable, collaborative, curious.` },
    { match: /how.{0,5}would.{0,5}(your.{0,5})?(boss|manager|coworker|teammate).{0,5}describe.{0,5}you/i,
      answer: () => `As someone who delivers reliably, communicates clearly, and lifts the team around them. I get the unglamorous work done and I'm easy to work with.` },
    { match: /what.{0,5}are.{0,5}your.{0,5}superpower/i,
      answer: () => `Breaking ambiguous problems into shippable pieces, then driving them to production with high quality.` },
    { match: /unique.{0,5}value/i,
      answer: () => `I combine strong technical depth with clear written and verbal communication. I ship reliable work, raise the bar on quality, and stay a low-ego collaborator throughout.` },

    // ── Weakness variants (15) ──────────────────────────────────────────────
    { match: /what.{0,5}are.{0,5}you.{0,5}working.{0,5}on/i,
      answer: () => `Being more deliberate about delegating. I default to picking things up myself, and I've been intentionally pushing more ownership to teammates so the team gets stronger and I stay focused on the highest-leverage work.` },
    { match: /constructive.{0,5}feedback/i,
      answer: () => `A piece of feedback I've taken seriously is to share work earlier and iterate openly, rather than polishing in private. It's made me much faster and improved the quality of the work because I get input sooner.` },
    { match: /how.{0,5}do.{0,5}you.{0,5}handle.{0,5}criticism/i,
      answer: () => `I welcome it. Specific feedback is one of the fastest ways to grow. I try to listen without getting defensive, separate the signal from the delivery, and act on it visibly.` },

    // ── Project / accomplishment depth (20) ─────────────────────────────────
    { match: /most.{0,5}complex.{0,5}project/i,
      answer: (c) => `A large-scale data pipeline rewrite where the existing system was failing under load. I led the design, broke the migration into low-risk phases, and shipped it with no production incidents. Throughput improved 4x and p99 latency dropped significantly. The discipline of phased rollouts and tight observability was what made it possible.` },
    { match: /describe.{0,5}your.{0,5}(best|favorite).{0,5}work/i,
      answer: () => `An end-to-end platform feature I owned from scoping through rollout. It required tight cross-functional collaboration, careful technical design, and a clear rollout plan. The result shipped on time and is still in active use today.` },
    { match: /most.{0,5}impactful.{0,5}contribution/i,
      answer: () => `A reliability investment I drove that cut our team's on-call load roughly in half. The hardest part was getting alignment that the work was worth the engineering time. Once we shipped, the team was meaningfully faster and happier.` },
    { match: /technical.{0,5}challenge.{0,5}you.{0,5}solved/i,
      answer: () => `A subtle race condition in a high-throughput pipeline that caused intermittent data corruption. I instrumented the path, reproduced the race in tests, and shipped a fix gated behind a flag. The fix held under production load with no regressions.` },
    { match: /describe.{0,5}your.{0,5}role.{0,5}in.{0,5}a.{0,5}project/i,
      answer: () => `On my most recent project I owned the technical design and the bulk of the implementation. I partnered closely with product and design on scoping trade-offs, drove technical review, and led the rollout. The end result shipped on time and met its targets.` },

    // ── Failure depth (10) ──────────────────────────────────────────────────
    { match: /tell.{0,5}me.{0,5}about.{0,5}a.{0,5}time.{0,5}things.{0,5}didn.t.{0,5}go|setback.{0,5}you.{0,5}faced/i,
      answer: () => `A project I owned slipped past its initial deadline because I underestimated the integration work. I owned the slip publicly, replanned with realistic estimates, and shipped successfully a few weeks later. The lesson: scope integration work as carefully as the core build.` },
    { match: /time.{0,5}you.{0,5}were.{0,5}wrong/i,
      answer: () => `I once pushed strongly for a technical approach that turned out to be wrong for the use case. A teammate raised concerns, I dug in, and after looking honestly at the data I changed direction. The right outcome — and a good reminder to weight evidence over conviction.` },

    // ── Conflict depth (10) ─────────────────────────────────────────────────
    { match: /tell.{0,5}me.{0,5}about.{0,5}a.{0,5}time.{0,5}you.{0,5}disagreed/i,
      answer: () => `A colleague and I disagreed on the architecture for a new service. I listened carefully, restated their view, and then walked through my reasoning with concrete trade-offs. We ended up with a hybrid approach better than either of our original proposals — and the conversation strengthened our working relationship.` },
    { match: /handle.{0,5}difficult.{0,5}(person|situation|coworker)/i,
      answer: () => `I focus on understanding the other person's perspective first. Most "difficult" interactions get easier once I genuinely understand what they care about. From there I look for shared goals and propose a path forward that works for both sides.` },

    // ── Leadership depth (15) ───────────────────────────────────────────────
    { match: /describe.{0,5}your.{0,5}leadership/i,
      answer: () => `My style is collaborative and outcome-driven. I focus on context, clear priorities, removing blockers, and giving teammates the autonomy to do their best work — while staying close enough to coach and raise the bar.` },
    { match: /mentor|coach.{0,5}someone/i,
      answer: () => `I've mentored several junior engineers. My approach is to coach on judgment, not just tasks — helping them see why certain trade-offs matter, then giving them space to make decisions and learn. Seeing them grow is one of the most rewarding parts of the work.` },
    { match: /influence.{0,5}without.{0,5}authority/i,
      answer: () => `Lead with credibility and clarity. Do excellent work, document your reasoning, build trust through reliability, and bring people along by showing not telling. When you've earned the trust, the influence follows.` },

    // ── Customer / impact depth (10) ────────────────────────────────────────
    { match: /focus.{0,5}on.{0,5}customer|user.{0,5}empathy/i,
      answer: () => `I read support tickets, watch session recordings when possible, and stay close to the people who interact with users daily. Even on backend work I try to keep the user experience visible in my mental model — it makes for better engineering decisions.` },
    { match: /measure.{0,5}your.{0,5}success/i,
      answer: () => `Did the work move the metrics it was supposed to move? Did it ship on time and with high quality? Did teammates feel supported through it? Those are my three honest measures.` },

    // ── Cross-functional / communication (15) ──────────────────────────────
    { match: /work.{0,5}with.{0,5}(product|design|sales|marketing|stakeholder)/i,
      answer: () => `I default to over-communicating. I write down decisions, summarize meetings in writing, share context proactively, and treat cross-functional partners as teammates rather than handoff points. The work is better when everyone is in the loop.` },
    { match: /communicate.{0,5}technical.{0,5}to.{0,5}non.?technical/i,
      answer: () => `Start with the outcome, then the trade-offs, then only the technical detail that's actually needed for the decision. Use analogies where they help. Confirm understanding by asking what questions are open.` },
    { match: /written.{0,5}communication/i,
      answer: () => `Strong. I default to written documents for decisions, design proposals, and post-incident write-ups. Clear writing makes for better thinking and a more aligned team.` },

    // ── Process / methodology (15) ──────────────────────────────────────────
    { match: /agile.{0,5}vs.{0,5}waterfall/i,
      answer: () => `Agile fits most product work — short iterations, real feedback, fast course-corrections. Waterfall can fit when scope is truly fixed and well understood (regulated, low-change domains). Most teams I've worked on benefited from agile with strong scoping discipline.` },
    { match: /agile.{0,5}experience|scrum.{0,5}experience/i,
      answer: () => `Significant. I've worked across multiple agile flavors — sprint-based scrum, kanban, and hybrid setups. I'm comfortable in any of them and I focus more on the underlying habits (clear priorities, fast feedback, retrospection) than on the ceremony.` },
    { match: /testing.{0,5}approach|testing.{0,5}philosophy/i,
      answer: () => `I write tests at the level that gives me the most confidence per minute of effort — usually a strong unit test foundation plus targeted integration tests for the critical paths. I treat test code with the same care as production code.` },
    { match: /code.{0,5}review.{0,5}approach/i,
      answer: () => `I review for correctness, clarity, and long-term maintainability. I leave specific, actionable comments and ask questions rather than make demands. As a reviewee, I respond to every comment thoughtfully — accept, push back with reasoning, or take it offline.` },

    // ── Tech philosophy (15) ────────────────────────────────────────────────
    { match: /clean.{0,5}code.{0,5}philosophy|coding.{0,5}philosophy/i,
      answer: () => `Optimize for the person who has to read the code next — usually a teammate, often future-me. Clear names, small functions, obvious data flow, and tests that document intent. Premature abstraction is a debt; concrete is fine until you have a real second use case.` },
    { match: /technical.{0,5}debt/i,
      answer: () => `Pay it down deliberately. Track it visibly, weigh it against feature work in planning, and tackle the highest-interest debt first. Some debt is fine if you take it on knowingly with a payoff plan.` },
    { match: /system.{0,5}design.{0,5}approach/i,
      answer: () => `Start from the use case, work backward to the data model and APIs, then choose technologies that minimize complexity for the actual requirements. Plan for failure modes from day one and invest in observability early.` },
    { match: /favorite.{0,5}(language|framework|tool)/i,
      answer: () => `I'm pragmatic about tools — I pick what fits the job. That said, I really enjoy working in languages with strong type systems and good developer ergonomics; they make complex code more maintainable.` },

    // ── Soft skills depth (20) ──────────────────────────────────────────────
    { match: /handle.{0,5}ambiguity/i,
      answer: () => `By making it concrete. I write down what I know, what I don't know, and what assumptions I'm working from. Then I propose a path forward, get feedback, and iterate. Action beats analysis paralysis.` },
    { match: /handle.{0,5}change/i,
      answer: () => `I treat change as a signal that something has been learned. My job is to update quickly, adjust the plan, and bring the team along. Resistance is rarely the right move.` },
    { match: /handle.{0,5}failure/i,
      answer: () => `Acknowledge it cleanly, learn the actual lesson (not the convenient one), and apply it concretely going forward. Don't ruminate, don't hide it. Failure is data.` },
    { match: /work.?life.{0,5}balance/i,
      answer: () => `I work hard during work hours and I'm clear about protecting downtime. Sustainable energy compounds — burnout kills careers. I'd rather ship 80% over six months than 100% for two and then crash.` },
    { match: /remote.{0,5}work.{0,5}experience/i,
      answer: () => `I'm experienced and comfortable working remotely. I over-communicate, default to written async updates, and stay easy to reach for the synchronous moments that need it.` },
    { match: /hybrid.{0,5}work/i,
      answer: () => `I'm comfortable with hybrid. It's the best of both worlds when done well — deep focus from home, high-bandwidth collaboration in person.` },
    { match: /onsite.{0,5}or.{0,5}in.?office/i,
      answer: () => `I'm comfortable working onsite. In-person collaboration is high-bandwidth and I value the time it gives the team.` },

    // ── Misc essay (50) ─────────────────────────────────────────────────────
    { match: /describe.{0,5}your.{0,5}work.{0,5}style/i,
      answer: () => `Reliable, deliberate, and collaborative. I plan before I build, I ship in small pieces, I over-communicate status, and I'm easy to work with. I default to action when the path is clear and to writing-then-aligning when it isn't.` },
    { match: /describe.{0,5}your.{0,5}ideal.{0,5}(role|job|team|workplace)/i,
      answer: () => `A strong team that takes craft seriously, clear product direction, autonomy to do the work, and problems that genuinely matter to users. The work itself is rewarding when those things line up.` },
    { match: /perfect.{0,5}work.{0,5}environment/i,
      answer: () => `Smart, kind teammates, clear priorities, and the autonomy to make decisions about how the work gets done. I do my best work when I have ownership and clear context.` },
    { match: /what.{0,5}motivates.{0,5}you/i,
      answer: () => `Impactful work, smart teammates, and the chance to keep growing. When those three line up I bring my best.` },
    { match: /passionate.{0,5}about/i,
      answer: () => `Building reliable systems that meaningfully change what users can do, on teams that take their craft seriously.` },
    { match: /describe.{0,5}your.{0,5}working.{0,5}style/i,
      answer: () => `Deliberate, communicative, and ship-oriented. Plan the work, write down the trade-offs, ship in small pieces, and tighten the feedback loop. That's how I move quickly without making messes.` },
    { match: /how.{0,5}do.{0,5}you.{0,5}stay.{0,5}organized/i,
      answer: () => `A short daily plan, a weekly review of priorities, and a habit of writing things down when they're at risk of being forgotten. I keep the system simple so I actually use it.` },
    { match: /handle.{0,5}interruption/i,
      answer: () => `Block focus time on the calendar, batch shallow work, and protect the few deep-work blocks I do schedule. When interruptions are unavoidable, I triage quickly and get back to the focus block.` },
    { match: /work.{0,5}independently/i,
      answer: () => `Very comfortable. I scope my own work, raise risks early, and stay communicative so the team always knows what's happening without needing to ask.` },
    { match: /handle.{0,5}deadlines/i,
      answer: () => `Scope realistically up front, break the work into milestones, ship the riskiest pieces early, and over-communicate status. If something slips I flag it the moment I see it, with a revised plan.` },
    { match: /handle.{0,5}multiple.{0,5}priorities/i,
      answer: () => `Get crisp on the actual priority order, write it down, communicate it, and protect time for the top one or two. Most "I'm overloaded" issues turn into "I'm focused" once priorities are clear.` },
    { match: /handle.{0,5}negative.{0,5}feedback/i,
      answer: () => `I treat it as a gift. I separate the signal from the delivery, ask follow-up questions, and act on it visibly. The fastest way to grow is to take feedback seriously without taking it personally.` },
    { match: /give.{0,5}feedback/i,
      answer: () => `Direct, specific, and timely. I praise in public, critique in private. I focus on observable behavior and impact, not personality, and I always pair criticism with a clear next step.` },
    { match: /learn.{0,5}new.{0,5}technology/i,
      answer: () => `Pick a small, real project, learn just enough to ship it, then iterate. Hands-on beats reading every time, and a concrete project keeps me motivated.` },
    { match: /onboarding.{0,5}approach/i,
      answer: () => `Listen first. Read the code, the docs, and as many of the prior decisions as I can find. Ask questions in writing so people can answer async. Ship a few small wins early to build trust.` },
    { match: /describe.{0,5}your.{0,5}values/i,
      answer: () => `Honesty, reliability, and craft. I do what I say, take pride in the work, and treat teammates with respect — even when (especially when) the work gets hard.` },
    { match: /what.{0,5}matters.{0,5}most.{0,5}to.{0,5}you/i,
      answer: () => `Doing meaningful work with people I respect, on problems that matter, while continuing to grow.` },
    { match: /describe.{0,5}your.{0,5}biggest.{0,5}growth/i,
      answer: () => `Earlier in my career I focused mostly on technical depth. Over time I've invested heavily in writing, communication, and judgment — those have multiplied the impact of the technical skills.` },
    { match: /work.{0,5}with.{0,5}difficult.{0,5}stakeholder/i,
      answer: () => `Understand what they actually care about (not what they're saying first), reflect it back, find the overlap with the team's goals, and propose a path forward. Most "difficult stakeholder" situations get easier with patience and empathy.` },
    { match: /handle.{0,5}competing.{0,5}priorities/i,
      answer: () => `Get the priorities written down and explicitly ordered. Renegotiate scope before deadlines. Be transparent about trade-offs. Most prioritization conflicts dissolve once the actual ordering is shared.` },
  ]

  // ════════════════════════════════════════════════════════════════════════════
  //  SECTION B — PROGRAMMATICALLY-GENERATED TECH EXPERIENCE Q&A (~600)
  // ════════════════════════════════════════════════════════════════════════════

  // Massive list of technologies/skills LinkedIn asks about
  const TECH_LIST = [
    // Programming languages
    'Python','JavaScript','TypeScript','Java','C++','C#','C\\b','Go','Golang','Ruby','Rust','Kotlin','Swift','PHP',
    'SQL','Shell','Bash','PowerShell','R\\b','MATLAB','Scala','Perl','Haskell','Erlang','Elixir','Clojure','Dart',
    'Lua','Objective-C','VBA','SAS','COBOL','Fortran','Assembly','Solidity','HTML','CSS','SASS','LESS','SCSS',
    'Groovy','Julia','F#','OCaml','Lisp','Scheme','Verilog','VHDL','Apex','ABAP',
    // Frameworks
    'React','Angular','Vue','Svelte','Next\\.?js','Nuxt','Gatsby','Redux','jQuery','Ember','Backbone',
    'Node\\.?js','Express','Fastify','NestJS','Django','Flask','FastAPI','Pyramid','Tornado',
    'Spring','Spring Boot','Hibernate','Struts','\\.NET','ASP\\.NET','Laravel','Symfony','CodeIgniter',
    'Ruby on Rails','Rails','Sinatra','Phoenix','Gin','Echo','Actix','Rocket','Ktor','Play',
    'Meteor','Electron','Flutter','React Native','Ionic','Xamarin','Cordova',
    'TensorFlow','PyTorch','Keras','scikit-learn','Pandas','NumPy','SciPy','Matplotlib','Seaborn','OpenCV',
    'Apache Spark','Hadoop','Kafka','Airflow','Apache Beam','Dagster','Prefect','RabbitMQ','Celery',
    'GraphQL','Apollo','Relay','Prisma','Sequelize','Mongoose','TypeORM','SQLAlchemy',
    'Webpack','Vite','Rollup','Parcel','Turbopack','esbuild',
    'Jest','Mocha','Jasmine','Pytest','RSpec','JUnit','Cypress','Playwright','Selenium','Puppeteer','Storybook',
    // Cloud / DevOps
    'AWS','Amazon Web Services','EC2','S3','Lambda','RDS','CloudFront','Route 53','CloudFormation',
    'EKS','ECS','Fargate','SageMaker','DynamoDB',
    'Azure','Azure DevOps','AKS','Azure Functions','Azure App Service',
    'GCP','Google Cloud','GKE','Cloud Functions','BigQuery','Firestore','Firebase',
    'Kubernetes','K8s','Docker','Docker Compose','Helm','Istio','Linkerd','Envoy',
    'Terraform','Pulumi','Ansible','Chef','Puppet','SaltStack',
    'Jenkins','CircleCI','Travis CI','GitHub Actions','GitLab CI','Azure Pipelines','ArgoCD','Flux',
    'Prometheus','Grafana','Datadog','New Relic','Splunk','ELK','Elasticsearch','Logstash','Kibana',
    'OpenTelemetry','Jaeger','Zipkin','Consul','Vault','Nomad','Rancher','OpenShift',
    // Databases
    'PostgreSQL','Postgres','MySQL','MariaDB','Oracle','MSSQL','SQL Server','SQLite',
    'MongoDB','Cassandra','Redis','Memcached','Couchbase','CockroachDB','Neo4j','InfluxDB',
    'Snowflake','Redshift','Databricks','Hive','Presto','Trino','dbt','Looker','Tableau','Power BI',
    // Office / collab
    'Slack','Zoom','Microsoft Teams','Google Meet','Webex','Discord',
    'Jira','Confluence','Asana','Notion','Trello','Monday','ClickUp','Linear','Shortcut',
    'GitHub','GitLab','Bitbucket','Figma','Sketch','Adobe XD','InVision','Miro','Lucidchart',
    'Excel','Google Sheets','Word','PowerPoint','Google Docs','Outlook',
    'Salesforce','HubSpot','Pipedrive','Zendesk','Intercom','SAP','Workday','NetSuite','QuickBooks',
    // Tools
    'Git','SVN','Mercurial','Linux','Windows','macOS','Unix',
    'REST','GraphQL APIs','gRPC','WebSocket','OAuth','OpenID','JWT','SAML','SSO',
    // AI/ML
    'Machine Learning','Deep Learning','NLP','Computer Vision','LLM','LLMs','GPT','Claude','OpenAI','Hugging Face',
    'LangChain','LlamaIndex','Vector Database','Pinecone','Weaviate','Chroma','RAG',
    // Niche/Modern
    'Cursor','Claude Code','Copilot','Zapier','Make','n8n','Bubble','Webflow','Retool',
    'Stripe','Plaid','Twilio','SendGrid','Mailgun','Auth0','Okta','Clerk','Firebase Auth',
    'Vercel','Netlify','Heroku','Railway','Render','Fly.io','DigitalOcean','Linode',
    'Datadog APM','Sentry','Bugsnag','Rollbar','LogRocket','Mixpanel','Amplitude','Segment',
    'Agentic AI','Agentic Automation','AI Agents','Workflow Automation','RPA','UiPath','Automation Anywhere',
  ]

  // Generate "Do you have experience with X" questions for every tech
  const TECH_EXPERIENCE_PATTERNS = TECH_LIST.map(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return {
      match: new RegExp(`(experience.{0,10}with.{0,10}${escaped}|familiar.{0,10}with.{0,10}${escaped}|used.{0,10}${escaped}|knowledge.{0,10}of.{0,10}${escaped}|worked.{0,10}with.{0,10}${escaped}|proficient.{0,10}in.{0,10}${escaped}|comfortable.{0,10}with.{0,10}${escaped})`, 'i'),
      answer: (_, options) => skillLevel(options)
    }
  })

  // Generate "Years of experience with X" questions for every tech
  const TECH_YOE_PATTERNS = TECH_LIST.map(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return {
      match: new RegExp(`year.{0,10}(of.{0,10})?(experience.{0,10})?(with.{0,10}|in.{0,10})?${escaped}`, 'i'),
      answer: (ctx, options) => yoeMatch(ctx, options)
    }
  })

  // Generate "Rate yourself on X" / "How would you rate X" questions
  const TECH_RATING_PATTERNS = TECH_LIST.map(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return {
      match: new RegExp(`(rate.{0,10}your.{0,10}${escaped}|${escaped}.{0,10}skill.{0,10}level|${escaped}.{0,10}proficiency|level.{0,10}of.{0,10}${escaped})`, 'i'),
      answer: (_, options) => skillLevel(options)
    }
  })

  // ════════════════════════════════════════════════════════════════════════════
  //  SECTION C — PROGRAMMATIC YES/NO Q&A (~150)
  // ════════════════════════════════════════════════════════════════════════════

  const YES_NO_QUESTIONS = [
    // Willingness
    { q: /willing.{0,5}to.{0,5}travel/i,                                              a: 'yes' },
    { q: /willing.{0,5}to.{0,5}work.{0,5}(weekend|evening|night|holiday|extra)/i,     a: 'yes' },
    { q: /willing.{0,5}to.{0,5}sign.{0,5}(nda|non.?compete|non.?disclos)/i,           a: 'yes' },
    { q: /willing.{0,5}to.{0,5}take.{0,5}(drug.{0,5}test|background.{0,5}check)/i,    a: 'yes' },
    { q: /willing.{0,5}to.{0,5}work.{0,5}overtime/i,                                  a: 'yes' },
    { q: /willing.{0,5}to.{0,5}work.{0,5}flexible.{0,5}hours/i,                       a: 'yes' },
    { q: /willing.{0,5}to.{0,5}work.{0,5}rotating.{0,5}shifts/i,                      a: 'yes' },
    { q: /willing.{0,5}to.{0,5}travel.{0,5}internationally/i,                         a: 'yes' },
    { q: /willing.{0,5}to.{0,5}work.{0,5}on.?call/i,                                  a: 'yes' },
    { q: /open.{0,5}to.{0,5}contract.{0,5}work/i,                                     a: 'yes' },
    // Ability
    { q: /able.{0,5}to.{0,5}commute/i,                                                a: 'yes' },
    { q: /able.{0,5}to.{0,5}start.{0,5}(immediately|soon)/i,                          a: 'yes' },
    { q: /able.{0,5}to.{0,5}lift.{0,5}\d/i,                                           a: 'yes' },
    { q: /able.{0,5}to.{0,5}stand.{0,5}for/i,                                         a: 'yes' },
    { q: /able.{0,5}to.{0,5}sit.{0,5}for/i,                                           a: 'yes' },
    { q: /able.{0,5}to.{0,5}work.{0,5}remote/i,                                       a: 'yes' },
    { q: /able.{0,5}to.{0,5}work.{0,5}independently/i,                                a: 'yes' },
    { q: /able.{0,5}to.{0,5}work.{0,5}in.{0,5}team/i,                                 a: 'yes' },
    // Have
    { q: /have.{0,5}reliable.{0,5}transportation/i,                                   a: 'yes' },
    { q: /have.{0,5}a.{0,5}valid.{0,5}(driver|driving).{0,5}licen/i,                  a: 'yes' },
    { q: /have.{0,5}a.{0,5}valid.{0,5}passport/i,                                     a: 'yes' },
    { q: /have.{0,5}reliable.{0,5}internet/i,                                         a: 'yes' },
    { q: /have.{0,5}a.{0,5}quiet.{0,5}workspace/i,                                    a: 'yes' },
    { q: /have.{0,5}a.{0,5}home.{0,5}office/i,                                        a: 'yes' },
    { q: /have.{0,5}your.{0,5}own.{0,5}laptop/i,                                      a: 'yes' },
    { q: /have.{0,5}your.{0,5}own.{0,5}equipment/i,                                   a: 'yes' },
    { q: /have.{0,5}webcam/i,                                                          a: 'yes' },
    { q: /have.{0,5}microphone/i,                                                      a: 'yes' },
    { q: /have.{0,5}you.{0,5}read.{0,5}the.{0,5}job.{0,5}description/i,                a: 'yes' },
    { q: /have.{0,5}you.{0,5}applied.{0,5}before/i,                                    a: 'no'  },
    { q: /have.{0,5}you.{0,5}worked.{0,5}here.{0,5}before/i,                          a: 'no'  },
    { q: /have.{0,5}you.{0,5}been.{0,5}convicted/i,                                   a: 'no'  },
    { q: /have.{0,5}you.{0,5}been.{0,5}terminated/i,                                  a: 'no'  },
    { q: /have.{0,5}you.{0,5}been.{0,5}fired/i,                                       a: 'no'  },
    { q: /have.{0,5}you.{0,5}left.{0,5}a.{0,5}job.{0,5}voluntarily/i,                 a: 'yes' },
    { q: /have.{0,5}you.{0,5}signed.{0,5}an.{0,5}nda/i,                               a: 'no'  },
    { q: /have.{0,5}you.{0,5}attended.{0,5}college/i,                                 a: 'yes' },
    { q: /have.{0,5}you.{0,5}completed.{0,5}your.{0,5}education/i,                    a: 'yes' },
    // Comfortable
    { q: /comfortable.{0,5}with.{0,5}(remote|hybrid|onsite|on.?site)/i,                a: 'yes' },
    { q: /comfortable.{0,5}with.{0,5}ambiguity/i,                                      a: 'yes' },
    { q: /comfortable.{0,5}with.{0,5}fast.?paced/i,                                    a: 'yes' },
    { q: /comfortable.{0,5}with.{0,5}changing.{0,5}priorit/i,                          a: 'yes' },
    { q: /comfortable.{0,5}presenting/i,                                               a: 'yes' },
    { q: /comfortable.{0,5}speaking.{0,5}in.{0,5}public/i,                             a: 'yes' },
    { q: /comfortable.{0,5}working.{0,5}with.{0,5}data/i,                              a: 'yes' },
    { q: /comfortable.{0,5}working.{0,5}with.{0,5}customers/i,                         a: 'yes' },
    // Interest
    { q: /interested.{0,5}in.{0,5}learning/i,                                          a: 'yes' },
    { q: /interested.{0,5}in.{0,5}growth/i,                                            a: 'yes' },
    { q: /interested.{0,5}in.{0,5}leadership/i,                                        a: 'yes' },
    { q: /interested.{0,5}in.{0,5}long.?term.{0,5}career/i,                            a: 'yes' },
    // Agree
    { q: /agree.{0,5}to.{0,5}terms/i,                                                  a: 'yes' },
    { q: /agree.{0,5}to.{0,5}privacy/i,                                                a: 'yes' },
    { q: /agree.{0,5}to.{0,5}background.{0,5}check/i,                                  a: 'yes' },
    { q: /agree.{0,5}to.{0,5}drug.{0,5}test/i,                                         a: 'yes' },
    { q: /agree.{0,5}to.{0,5}references/i,                                             a: 'yes' },
    { q: /agree.{0,5}to.{0,5}share.{0,5}data/i,                                        a: 'no'  },
    { q: /agree.{0,5}to.{0,5}marketing/i,                                              a: 'no'  },
    // Confirm
    { q: /confirm.{0,5}you.{0,5}are.{0,5}over.{0,5}18/i,                              a: 'yes' },
    { q: /confirm.{0,5}you.{0,5}are.{0,5}over.{0,5}21/i,                              a: 'yes' },
    { q: /confirm.{0,5}you.{0,5}are.{0,5}eligible/i,                                  a: 'yes' },
    { q: /confirm.{0,5}you.{0,5}are.{0,5}authorized/i,                                a: 'yes' },
    { q: /confirm.{0,5}accuracy/i,                                                     a: 'yes' },
    { q: /confirm.{0,5}truthful/i,                                                     a: 'yes' },
    // Acknowledge
    { q: /acknowledge.{0,5}policy/i,                                                   a: 'yes' },
    { q: /acknowledge.{0,5}terms/i,                                                    a: 'yes' },
    { q: /acknowledge.{0,5}understanding/i,                                            a: 'yes' },
    // Generic confidence
    { q: /can.{0,5}you.{0,5}(start|begin|join)/i,                                      a: 'yes' },
    { q: /can.{0,5}you.{0,5}work.{0,5}(full|part).?time/i,                             a: 'yes' },
    { q: /can.{0,5}you.{0,5}provide.{0,5}references/i,                                 a: 'yes' },
    { q: /can.{0,5}you.{0,5}pass.{0,5}a.{0,5}background/i,                             a: 'yes' },
    { q: /can.{0,5}you.{0,5}pass.{0,5}a.{0,5}drug/i,                                   a: 'yes' },
    { q: /can.{0,5}you.{0,5}work.{0,5}independently/i,                                 a: 'yes' },
    { q: /can.{0,5}you.{0,5}meet.{0,5}deadlines/i,                                     a: 'yes' },
    { q: /can.{0,5}you.{0,5}lift/i,                                                    a: 'yes' },
    // Do you / will you
    { q: /do.{0,5}you.{0,5}have.{0,5}a.{0,5}degree/i,                                  a: 'yes' },
    { q: /do.{0,5}you.{0,5}have.{0,5}any.{0,5}certif/i,                                a: 'no'  },
    { q: /do.{0,5}you.{0,5}speak.{0,5}english/i,                                       a: 'yes' },
    { q: /will.{0,5}you.{0,5}relocate/i,                                               a: 'yes' },
    { q: /will.{0,5}you.{0,5}travel/i,                                                 a: 'yes' },
    { q: /will.{0,5}you.{0,5}consent/i,                                                a: 'yes' },
    { q: /will.{0,5}you.{0,5}be.{0,5}able/i,                                           a: 'yes' },
    // No-defaults
    { q: /currently.{0,5}working.{0,5}for.{0,5}a.{0,5}competitor/i,                   a: 'no'  },
    { q: /any.{0,5}criminal.{0,5}history/i,                                            a: 'no'  },
    { q: /any.{0,5}conflict.{0,5}of.{0,5}interest/i,                                   a: 'no'  },
    { q: /currently.{0,5}under.{0,5}contract/i,                                        a: 'no'  },
    { q: /need.{0,5}relocation.{0,5}assistance/i,                                      a: 'no'  },
    { q: /need.{0,5}visa.{0,5}sponsor/i,                                               a: 'no'  },
    { q: /currently.{0,5}on.{0,5}visa/i,                                               a: 'no'  },
    { q: /family.{0,5}member.{0,5}work/i,                                              a: 'no'  },
    { q: /related.{0,5}to.{0,5}any.{0,5}employee/i,                                    a: 'no'  },
    { q: /receive.{0,5}marketing/i,                                                    a: 'no'  },
    { q: /opt.{0,5}in/i,                                                                a: 'no'  },
  ]
  const YES_NO_PATTERNS = YES_NO_QUESTIONS.map(({ q, a }) => ({
    match: q,
    answer: (_, options) => a === 'yes' ? yesPick(options) : noPick(options)
  }))

  // ════════════════════════════════════════════════════════════════════════════
  //  SECTION D — PROGRAMMATIC NUMERIC / YOE Q&A (~100)
  // ════════════════════════════════════════════════════════════════════════════

  const NUMERIC_PATTERNS = [
    { match: /total.{0,5}years.{0,5}of.{0,5}experience/i,                              answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /overall.{0,5}years.{0,5}of.{0,5}experience/i,                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /relevant.{0,5}years.{0,5}of.{0,5}experience/i,                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}in.{0,5}current.{0,5}role/i,                                  answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}at.{0,5}current.{0,5}employer/i,                              answer: () => '2' },
    { match: /years.{0,5}of.{0,5}management/i,                                         answer: () => '1' },
    { match: /years.{0,5}of.{0,5}leadership/i,                                         answer: () => '1' },
    { match: /years.{0,5}of.{0,5}team.{0,5}leadership/i,                               answer: () => '1' },
    { match: /years.{0,5}of.{0,5}coding/i,                                             answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}programming/i,                                        answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}software/i,                                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}backend/i,                                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}frontend/i,                                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}full.?stack/i,                                        answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}devops/i,                                             answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}cloud/i,                                              answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}data.{0,5}science/i,                                  answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}machine.{0,5}learning/i,                              answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}ml/i,                                                 answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}ai/i,                                                 answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}consulting/i,                                         answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}sales/i,                                              answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}marketing/i,                                          answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}product.{0,5}management/i,                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}design/i,                                             answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}analyst/i,                                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}analytics/i,                                          answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}database/i,                                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}testing/i,                                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}qa/i,                                                 answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}security/i,                                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}networking/i,                                         answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}mobile/i,                                             answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}ios/i,                                                answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}android/i,                                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}web.{0,5}development/i,                               answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}embedded/i,                                           answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}game.{0,5}development/i,                              answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}finance/i,                                            answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}healthcare/i,                                         answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /years.{0,5}of.{0,5}education/i,                                          answer: (ctx, opts) => yoeMatch(ctx, opts) },
    { match: /how.{0,5}many.{0,5}people.{0,5}did.{0,5}you.{0,5}manage/i,               answer: () => '3' },
    { match: /size.{0,5}of.{0,5}team.{0,5}you.{0,5}led/i,                              answer: () => '5' },
    { match: /largest.{0,5}team.{0,5}you.{0,5}have.{0,5}led/i,                         answer: () => '5' },
    { match: /how.{0,5}many.{0,5}projects/i,                                           answer: () => '10' },
    { match: /how.{0,5}many.{0,5}clients/i,                                            answer: () => '5' },
    { match: /budget.{0,5}you.{0,5}have.{0,5}managed/i,                                answer: () => '100000' },
    { match: /revenue.{0,5}you.{0,5}generated/i,                                       answer: () => '500000' },
    { match: /hours.{0,5}per.{0,5}week/i,                                              answer: () => '40' },
    { match: /vacation.{0,5}days/i,                                                    answer: () => '15' },
    { match: /commute.{0,5}distance/i,                                                 answer: () => '20' },
  ]

  // ════════════════════════════════════════════════════════════════════════════
  //  SECTION E — INDUSTRY / SCENARIO Q&A (~100)
  // ════════════════════════════════════════════════════════════════════════════

  const SCENARIO_PATTERNS = [
    { match: /scenario|hypothetical|imagine.{0,5}you/i,
      answer: () => `My approach would be to clarify the goal, gather the relevant context, propose a path forward, and validate the plan with stakeholders before executing. Then I'd ship in small pieces with clear checkpoints, adjusting as I learn.` },
    { match: /missed.{0,5}deadline|deadline.{0,5}you.{0,5}missed/i,
      answer: () => `I once missed a deadline because I under-scoped the integration work. I owned the slip publicly, replanned with realistic estimates, and shipped successfully a few weeks later. I've been disciplined about scoping integration work ever since.` },
    { match: /angry.{0,5}customer|upset.{0,5}customer/i,
      answer: () => `Listen first, acknowledge the impact, then move quickly to a concrete fix. Customers don't need spin — they need empathy plus action.` },
    { match: /tight.{0,5}budget|limited.{0,5}resource/i,
      answer: () => `Get crisp on the highest-leverage outcome, ruthlessly cut everything that isn't load-bearing, and ship the minimum viable version that delivers real value. Then iterate.` },
    { match: /describe.{0,5}your.{0,5}sales.{0,5}process/i,
      answer: () => `Understand the customer's actual problem, map the solution to it explicitly, and earn trust through preparation and consistency. Long-term relationships beat short-term wins every time.` },
    { match: /describe.{0,5}your.{0,5}marketing.{0,5}approach/i,
      answer: () => `Data-informed, customer-centric, and iterative. Test small, measure, double down on what works, kill what doesn't.` },
    { match: /how.{0,5}do.{0,5}you.{0,5}handle.{0,5}escalation/i,
      answer: () => `Pull in the right people fast, communicate clearly, and focus on resolution before postmortem. Once the customer or system is stable, write down what happened and what changes prevent a repeat.` },
    { match: /how.{0,5}do.{0,5}you.{0,5}make.{0,5}decision/i,
      answer: () => `Get clear on the goal, identify the few real options, weigh the trade-offs against the goal, and commit. I bias to reversible decisions where I can, so I can move fast and adjust later.` },
    { match: /strategic.{0,5}thinking/i,
      answer: () => `I start from outcomes and work backward — what does success look like in 12-18 months, and what's the cleanest path there? Then I segment that into near-term bets that move the needle.` },
    { match: /how.{0,5}do.{0,5}you.{0,5}handle.{0,5}risk/i,
      answer: () => `Identify it explicitly, weight it by impact and likelihood, and mitigate the highest-EV ones first. The biggest risks are usually the ones you haven't named yet.` },
    { match: /tell.{0,5}me.{0,5}about.{0,5}a.{0,5}time.{0,5}you.{0,5}sold/i,
      answer: () => `I once needed to convince a skeptical stakeholder to adopt a new tool. I built a small proof-of-concept showing concrete wins, walked them through it, and addressed every concern they raised in writing. They ended up championing the rollout.` },
    { match: /sales.{0,5}target|quota/i,
      answer: () => `I treat targets seriously, plan against them weekly, and over-communicate when I'm tracking ahead or behind. Hitting numbers is about disciplined process, not heroics.` },
    { match: /describe.{0,5}your.{0,5}coding.{0,5}style/i,
      answer: () => `Clear names, small functions, obvious data flow, and tests that double as documentation. I optimize for the reader, not the writer.` },
    { match: /describe.{0,5}your.{0,5}data.{0,5}analysis/i,
      answer: () => `Start with the question. Pull the right data, validate it, look at distributions before you look at averages, and challenge the first conclusion. Always present caveats alongside findings.` },
  ]

  // ════════════════════════════════════════════════════════════════════════════
  //  COMBINE ALL
  // ════════════════════════════════════════════════════════════════════════════
  const ALL_QA = [
    ...HAND_WRITTEN,
    ...SCENARIO_PATTERNS,
    ...NUMERIC_PATTERNS,
    ...TECH_YOE_PATTERNS,
    ...TECH_EXPERIENCE_PATTERNS,
    ...TECH_RATING_PATTERNS,
    ...YES_NO_PATTERNS,
  ]

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
    for (const { match, answer } of ALL_QA) {
      if (match.test(l)) {
        try {
          const result = answer(ctx, options, label)
          if (result !== null && result !== undefined && result !== '') return String(result)
        } catch (e) { /* swallow & continue */ }
      }
    }
    return null
  }

  globalThis.REBLET_QA_BANK = {
    lookup,
    patterns: ALL_QA,
    size: ALL_QA.length,
  }
  try { console.log(`[reblet] Q&A bank loaded — ${ALL_QA.length} patterns`) } catch (e) {}
})()
