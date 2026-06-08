/**
 * Definitive Guides — long-form, authoritative content optimised for
 * Google AI Overviews and AI-search citation (Perplexity, ChatGPT,
 * Claude). Distinct from /blog/ which is shorter editorial content.
 *
 * Each guide:
 * - 2,000+ words
 * - Numbered table of contents (h2 sections become anchor links)
 * - Dated authorship
 * - Article + Speakable JSON-LD on the page template
 * - Salary tables / comparison tables where applicable
 * - FAQ section the page template wraps in FAQPage schema
 *
 * Content shape:
 *   slug, title, description, date, updated, readTime, author,
 *   sections: [{ id, h2, html }],
 *   faqs: [{ question, answer }],
 *   keywords (comma-separated)
 */

export const guides = [
  {
    slug: 'hire-a-nanny-in-thailand',
    title: 'How to Hire a Nanny in Thailand — The Complete 2026 Guide',
    description:
      'Salary ranges, work-permit rules, where to find nannies, what to ask in interviews, and how to write a fair contract. Updated for 2026 with city-specific data for Bangkok, Phuket, Chiang Mai, and more.',
    date: '2026-06-02',
    updated: '2026-06-02',
    readTime: 14,
    author: 'ThaiHelper Team',
    image: 'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=1200&q=80',
    keywords:
      'hire nanny Thailand, nanny cost Bangkok, find a nanny Phuket, live-in nanny salary Thailand, English speaking nanny Bangkok, work permit nanny Thailand, hire nanny without agency, Filipino nanny Bangkok',
    sections: [
      {
        id: 'overview',
        h2: 'What you\'ll learn in this guide',
        html: `
          <p>Hiring a nanny in Thailand is one of the most common decisions for expat and Thai families alike. For about <strong>15,000–25,000 THB per month</strong> (Bangkok rates, 2026), a family can have full-time, experienced childcare — a fraction of what the same arrangement costs in most Western countries. But the process is unfamiliar to first-time employers and the visible options (agencies, Facebook groups, word-of-mouth) all have trade-offs.</p>
          <p>This guide walks through the entire process: what nannies actually cost city by city, the difference between live-in and live-out arrangements, where to find candidates (with the trade-offs of each channel), what to ask in interviews, the work-permit rules for foreign nannies (Filipino, Burmese, etc.), how to structure a fair contract, and the mistakes most first-time families make.</p>
          <p>It is written for families hiring directly — without going through an agency — but the salary and legal information applies regardless of how you find your nanny.</p>
          <p><em>Last updated: 2 June 2026. Salary figures reflect rates current in 2026 and are sourced from active listings, recruitment data, and direct family-employer interviews. Legal references are to Thai Ministry of Labour regulations in force as of 2026.</em></p>
        `,
      },
      {
        id: 'cost',
        h2: 'How much does a nanny in Thailand cost?',
        html: `
          <p>Nanny salaries in Thailand vary by three main factors: <strong>city</strong>, <strong>arrangement</strong> (live-in, live-out, part-time), and <strong>experience or specialised skills</strong> (English, infant care, special needs). Below are the typical monthly ranges for 2026.</p>

          <h3>By city (full-time, live-out)</h3>
          <table>
            <thead><tr><th>City</th><th>Range (THB/month)</th><th>Typical (THB/month)</th></tr></thead>
            <tbody>
              <tr><td>Bangkok</td><td>15,000 – 25,000</td><td>20,000</td></tr>
              <tr><td>Phuket</td><td>15,000 – 22,000</td><td>18,000</td></tr>
              <tr><td>Pattaya</td><td>13,000 – 20,000</td><td>16,000</td></tr>
              <tr><td>Koh Samui</td><td>14,000 – 22,000</td><td>17,000</td></tr>
              <tr><td>Hua Hin</td><td>12,000 – 18,000</td><td>15,000</td></tr>
              <tr><td>Chiang Mai</td><td>12,000 – 18,000</td><td>14,000</td></tr>
              <tr><td>Chiang Rai, Udon Thani, Khon Kaen</td><td>9,000 – 14,000</td><td>11,000</td></tr>
            </tbody>
          </table>

          <h3>By arrangement</h3>
          <ul>
            <li><strong>Part-time (2–3 days/week):</strong> 6,000 – 12,000 THB/month. Common for families who only need help during a parent's work hours or for evening babysitting.</li>
            <li><strong>Full-time, live-out:</strong> 12,000 – 25,000 THB/month depending on city. The nanny commutes from her own home, typically 5–6 days per week.</li>
            <li><strong>Full-time, live-in:</strong> 12,000 – 20,000 THB/month <em>plus</em> a private room and meals. The cash salary is typically 20–30 % lower than live-out because room and board have real value.</li>
            <li><strong>24-hour or overnight nanny:</strong> 25,000 – 40,000 THB/month. Less common; usually for newborns or shift-working parents.</li>
          </ul>

          <h3>Premium factors</h3>
          <p>A nanny commands a higher salary when she:</p>
          <ul>
            <li>Speaks <strong>fluent English</strong> (or Mandarin, Japanese, German). Expect 25,000–35,000 THB/month in Bangkok for a confident English speaker.</li>
            <li>Has <strong>5+ years' experience</strong> with expat families and references that can be checked.</li>
            <li>Has <strong>infant or newborn experience</strong> — specialised skill, generally +20–30 % above the base rate.</li>
            <li>Has a <strong>nursing or early-childhood-education background</strong>. Rare; often 30,000+ THB.</li>
            <li>Is willing to <strong>travel with the family</strong> (domestic trips or overseas). Add a travel stipend and per-diem on top of base.</li>
          </ul>

          <p>Pay also includes the implicit cost of <strong>social-security contributions</strong> for full-time employees (5 % each from employer and employee, covering medical, maternity, and pension benefits) and the <strong>13th-month bonus</strong> that is customary in Thai household employment — most families pay it before Songkran or at New Year.</p>
        `,
      },
      {
        id: 'arrangements',
        h2: 'Live-in vs live-out vs part-time — which is right for your family?',
        html: `
          <p>There is no objectively best arrangement; the right one depends on your home, your hours, and how comfortable you are with another adult living in your space. Here is the trade-off in plain terms.</p>

          <h3>Live-in</h3>
          <p><strong>Choose live-in when:</strong> you have a spare room with its own bathroom, one or both parents travel for work, you have newborns or multiple young children, or you simply want help available before school in the morning and after the kids go to bed.</p>
          <p><strong>What's included:</strong> private room (en-suite where possible), three meals a day, one full day off per week, and reasonable use of the family's amenities. Cash salary 12,000–20,000 THB/month plus the value of room and board.</p>
          <p><strong>What to think about:</strong> Privacy on both sides matters. A nanny who lives in your home should have somewhere to retreat in the evening. Set ground rules early about working hours, off-time, and family visits.</p>

          <h3>Live-out</h3>
          <p><strong>Choose live-out when:</strong> you have a typical working-hours pattern (e.g. 8 am – 6 pm), your home doesn't have a spare bedroom, or you prefer to separate work and home life.</p>
          <p><strong>What's included:</strong> Cash salary (no room, no meals — although many families provide lunch as a courtesy). Typically 5–6 days per week. The nanny commutes from her own home, so her ability to start very early or stay very late depends on transport.</p>
          <p><strong>What to think about:</strong> Bangkok and Phuket traffic. A nanny who lives an hour away by motorbike may not be reliable for 7 am drop-offs. Many families pay a small <strong>transport allowance</strong> (500–2,000 THB/month) on top of base salary.</p>

          <h3>Part-time</h3>
          <p><strong>Choose part-time when:</strong> you only need help during peak hours (after school, weekday afternoons), you want a date-night sitter, or you're not ready for the commitment of full-time employment.</p>
          <p><strong>What's included:</strong> Hourly or daily rate. Typical hourly rate in Bangkok is 150–300 THB; in smaller towns 100–200 THB. Many part-time nannies have several families and a tight schedule, so be punctual with start and end times.</p>
        `,
      },
      {
        id: 'where-to-find',
        h2: 'Where to find a nanny in Thailand',
        html: `
          <p>There are four mainstream channels. None of them is uniquely "best" — they all surface different candidates, and many families use two or three in parallel.</p>

          <h3>1. Direct-hire marketplaces (e.g. ThaiHelper)</h3>
          <p><strong>How it works:</strong> Nannies create free profiles with experience, skills, photo, language, and availability. Families browse, message directly, interview, and agree on terms with no platform commission on salary.</p>
          <p><strong>Pros:</strong> Structured profiles, no placement fee, you control the entire hiring conversation, no contract lock-in. Open 24/7.</p>
          <p><strong>Cons:</strong> Marketplaces verify email and identity but don't conduct in-depth background checks — that's on you. References still need to be called.</p>

          <h3>2. Recruitment agencies</h3>
          <p><strong>How it works:</strong> The agency screens candidates, sends you a shortlist, and you interview and choose. The agency typically charges a one-time placement fee (6,000–25,000 THB) plus, in some cases, a replacement guarantee if the match fails within the first few months.</p>
          <p><strong>Pros:</strong> Pre-screened candidates, replacement guarantee, hands-off process.</p>
          <p><strong>Cons:</strong> Placement fee on top of salary, less direct insight into the candidate pool, and the agency's incentive is to fill the role quickly — not necessarily perfectly.</p>

          <h3>3. Facebook groups & expat forums</h3>
          <p><strong>How it works:</strong> Groups like Bangkok Expat Families, Phuket Expat Moms, and Chiang Mai Mums regularly have posts from departing families looking to place their long-term nanny, or from nannies looking directly for work.</p>
          <p><strong>Pros:</strong> Often the best candidates — a nanny whose previous expat family is recommending her has a strong implicit reference. No fees.</p>
          <p><strong>Cons:</strong> Unstructured, no verification, lots of irrelevant noise, and timing-dependent (good candidates appear and disappear quickly).</p>

          <h3>4. Word of mouth and condo notice boards</h3>
          <p><strong>How it works:</strong> Ask neighbours, colleagues, your condo juristic-person office, and other parents at your kids' school.</p>
          <p><strong>Pros:</strong> The deepest references — your neighbour has actually worked with this person.</p>
          <p><strong>Cons:</strong> Tiny candidate pool. Only works if you already have a network.</p>

          <p><em>Mix-and-match tip:</em> a common pattern is to <strong>shortlist on a marketplace</strong> (structured search across many candidates), <strong>verify with a Facebook post</strong> ("anyone worked with [name]?"), and <strong>finalise with an in-person interview</strong> at home.</p>
        `,
      },
      {
        id: 'interview',
        h2: 'What to ask in a nanny interview',
        html: `
          <p>The first interview is for chemistry and basic fit. A second interview, ideally at your home with your children present, is for the practical decision. These questions cover both.</p>

          <h3>Experience and background</h3>
          <ul>
            <li>How many families have you worked for, and how long with each?</li>
            <li>What are the ages of the children you've cared for? Any infant or newborn experience?</li>
            <li>Why did each previous job end?</li>
            <li>May I contact your two most recent families as references?</li>
          </ul>

          <h3>Daily logistics</h3>
          <ul>
            <li>What's your typical day with a child this age?</li>
            <li>How do you handle a child who refuses to eat / sleep / cooperate?</li>
            <li>What level of English (or other languages) are you comfortable speaking?</li>
            <li>Are you comfortable cooking simple meals for the children?</li>
            <li>Do you swim? Can you supervise pool play?</li>
          </ul>

          <h3>Safety and judgment</h3>
          <ul>
            <li>What would you do if a child suddenly developed a high fever?</li>
            <li>Have you done any first-aid or CPR training? If not, would you be open to it?</li>
            <li>What's your view on screen time / discipline / outdoor play?</li>
          </ul>

          <h3>Practical fit</h3>
          <ul>
            <li>How far do you live from us? Will the commute work for the hours we need?</li>
            <li>Are there days or hours you definitely can't work?</li>
            <li>What's your expected salary, and what would make it feel fair to you?</li>
          </ul>

          <p><strong>Critical:</strong> always conduct at least the second interview in person, and always with your child present. A nanny who is brilliant on a video call but uncomfortable around your specific toddler is not the right hire.</p>
        `,
      },
      {
        id: 'work-permit',
        h2: 'Work permits for foreign nannies (Filipino, Burmese, and others)',
        html: `
          <p>This section matters only if you hire a non-Thai citizen. Thai nationals working in private households do <strong>not</strong> need a work permit. Foreign nationals do.</p>

          <h3>The basic rule</h3>
          <p>A foreign citizen working in Thailand needs <strong>two documents</strong>: a Non-Immigrant Visa (type "B" for general employment, or the LTR / SMART visa categories for dependents and specialists) and a Work Permit issued by the Ministry of Labour. The two are linked: you cannot have a valid work permit without a valid visa.</p>

          <h3>Process and cost</h3>
          <ul>
            <li><strong>Processing time:</strong> typically 7–30 working days once paperwork is complete.</li>
            <li><strong>Annual cost (employer-paid):</strong> 6,500–10,000 THB per year for the work permit itself, plus visa fees of about 2,000 THB per year for renewal. Initial processing may cost more.</li>
            <li><strong>Employer requirements:</strong> Strictly, the employer needs to be a registered Thai company with paid-up capital of 2 million baht to hire one foreigner under standard rules. <strong>Household employment is treated more flexibly</strong> in practice — many families work with a licensed visa agent who handles this — but check the current rules with a Thai immigration lawyer before signing a contract.</li>
            <li><strong>Prohibited occupations:</strong> Some occupations are reserved for Thai citizens. Domestic work for a single private household is generally permitted for foreigners; commercial cleaning is not.</li>
          </ul>

          <h3>In practice</h3>
          <p>Most expat families hiring Filipino, Burmese, or other foreign nannies use a visa agent (cost: 15,000–30,000 THB for the initial setup, around 5,000–10,000 THB annually for renewals). The agent handles the Non-Immigrant B application, work-permit filing, 90-day reporting, and renewals. This is by far the most common arrangement and removes a lot of administrative friction.</p>

          <p>Working a foreign nanny <strong>without</strong> a valid work permit is illegal and exposes both employer and employee to fines, deportation, and (for the employer) future visa issues in Thailand. Even if you only hire informally for a few hours a week, get the paperwork right.</p>
        `,
      },
      {
        id: 'contract',
        h2: 'Contracts, benefits, and salary negotiation',
        html: `
          <p>A written contract is <strong>not legally required</strong> for household employment in Thailand, but it is strongly recommended. A simple contract protects both parties from misunderstandings and is required if you want to register your nanny for social security.</p>

          <h3>What a basic contract should specify</h3>
          <ul>
            <li>Full name, ID number, and contact of both parties</li>
            <li>Job description — what specifically she is and is not expected to do (e.g. childcare only, vs. childcare + light cleaning)</li>
            <li>Working hours, days off, public holidays</li>
            <li>Monthly salary and how it's paid (bank transfer is best — creates a record)</li>
            <li>Room and board arrangement (live-in only)</li>
            <li>Annual leave (typically 6 paid days/year minimum; many families provide 10–15)</li>
            <li>Sick leave</li>
            <li>13th-month bonus or year-end gift, if customary in your arrangement</li>
            <li>Notice period for resignation or termination (typically 30 days)</li>
            <li>Confidentiality clause if you have any privacy concerns</li>
          </ul>

          <p>ThaiHelper publishes a free bilingual contract template at <a href="/blog/employment-contract-template-thailand">/blog/employment-contract-template-thailand</a>.</p>

          <h3>Legally protected rights</h3>
          <p>Household workers in Thailand are covered by <strong>Ministerial Regulation No. 14 (2012)</strong>, which extends key labour protections to domestic employees: at least one day off per week, public-holiday entitlement, paid sick leave, and overtime pay if the employee works more than the contracted hours. For full-time arrangements, employers must also register the worker for <strong>Social Security (Section 33)</strong> — both employer and employee contribute 5 % of monthly salary, and the worker gets medical care, maternity benefits, disability cover, and a pension.</p>

          <h3>Customary benefits beyond the law</h3>
          <ul>
            <li><strong>13th-month bonus:</strong> standard practice, usually paid before Songkran (mid-April) or Thai New Year.</li>
            <li><strong>Transport allowance:</strong> 500–2,000 THB/month for live-out nannies with a long commute.</li>
            <li><strong>Phone-card top-up:</strong> small, but appreciated; lets you reach her easily.</li>
            <li><strong>School-fee or uniform contribution</strong> if she has school-age children — strengthens long-term retention.</li>
          </ul>
        `,
      },
      {
        id: 'mistakes',
        h2: 'Common mistakes families make',
        html: `
          <ul>
            <li><strong>Skipping reference checks.</strong> Always call at least two previous employers. A 10-minute phone call surfaces problems a CV will never show.</li>
            <li><strong>Hiring without a trial period.</strong> Agree on a 1–4 week trial. Pay her for the trial. If it doesn't work, no hard feelings on either side.</li>
            <li><strong>Vague job descriptions.</strong> "Childcare and light help" is too loose. Decide whether you want a nanny who also cleans (lower satisfaction long-term) or a dedicated nanny.</li>
            <li><strong>Underpaying English-speaking candidates.</strong> If you specifically need English, expect to pay the premium. Underpaid English-speaking nannies have outside options and leave quickly.</li>
            <li><strong>Skipping Social Security registration for full-time live-in nannies.</strong> It's both a legal requirement and a strong retention tool — the nanny gets free medical care via the public system.</li>
            <li><strong>No written contract.</strong> When something goes wrong, "what we agreed verbally" doesn't help anyone. A one-page contract is enough.</li>
            <li><strong>Not paying the 13th-month bonus.</strong> It is so universally expected that skipping it signals you don't see the role as serious.</li>
            <li><strong>Hiring through informal channels for a foreign nanny without arranging the work permit.</strong> This is the single highest-risk legal mistake expat families make in Thailand.</li>
          </ul>
        `,
      },
      {
        id: 'next-steps',
        h2: 'Next steps',
        html: `
          <p>If you're ready to start the search, you can browse verified nanny profiles on ThaiHelper for free. Filter by city, languages, experience level, and availability — then message candidates directly with no platform fees on either side.</p>
          <ul>
            <li><a href="/hire/nanny">Browse nannies across Thailand</a></li>
            <li><a href="/hire/nanny-bangkok">Nannies in Bangkok</a></li>
            <li><a href="/hire/nanny-phuket">Nannies in Phuket</a></li>
            <li><a href="/hire/nanny-chiang-mai">Nannies in Chiang Mai</a></li>
            <li><a href="/blog/employment-contract-template-thailand">Free employment-contract template (EN + TH)</a></li>
            <li><a href="/work-permit-wizard">Work-permit checker (Thai vs foreign nanny)</a></li>
          </ul>
        `,
      },
    ],
    faqs: [
      {
        question: 'How much does a nanny in Bangkok cost in 2026?',
        answer:
          'A full-time live-out nanny in Bangkok typically costs 15,000–25,000 THB per month. Live-in is 12,000–18,000 THB (cash) plus room and meals. Experienced English-speaking nannies command 25,000–35,000 THB. Part-time nannies cost 6,000–12,000 THB per month for 2–3 days a week.',
      },
      {
        question: 'Can I hire a nanny in Thailand without going through an agency?',
        answer:
          'Yes. Most Thai families hire nannies directly through referrals, condo notice boards, or online marketplaces. Expat families increasingly do the same — direct hire saves the agency placement fee (typically 6,000–25,000 THB) and gives you control over the interview and reference-check process. Marketplaces like ThaiHelper provide structured profiles without taking a cut.',
      },
      {
        question: 'Do nannies in Thailand need a work permit?',
        answer:
          'Thai citizens working as nannies do NOT need a work permit. Foreign nannies (Filipino, Burmese, Lao, etc.) DO need a Non-Immigrant B visa plus a work permit. The process takes 7–30 working days and costs the employer 6,500–10,000 THB per year for the permit. Most expat families use a licensed visa agent for the paperwork.',
      },
      {
        question: 'What is the difference between live-in and live-out nannies?',
        answer:
          'A live-in nanny resides at the employer\'s home, receives a private room and meals as part of compensation, and typically works 6 days per week. A live-out nanny commutes daily from her own home. Live-in cash salaries are usually 20–30 % lower than live-out for the same role because food and accommodation are included.',
      },
      {
        question: 'Is a written contract required when hiring a nanny in Thailand?',
        answer:
          'A written contract is not legally required for household employment in Thailand, but it is strongly recommended. It should specify duties, working hours, salary, days off, leave entitlement, notice period, and any benefits (room and meals if live-in). Both parties keep a signed copy. ThaiHelper publishes a free bilingual contract template.',
      },
      {
        question: 'What benefits should I provide beyond the basic salary?',
        answer:
          'Customary benefits in Thailand include: a 13th-month bonus paid before Songkran, paid annual leave (6 days minimum, 10–15 days is common), paid sick leave, and Social Security registration for full-time employees (5 % each from employer and employee, covers medical and pension). Many families also provide a transport allowance for live-out nannies (500–2,000 THB/month) and phone-card top-ups.',
      },
    ],
  },

  {
    slug: 'hire-a-housekeeper-in-thailand',
    title: 'How to Hire a Housekeeper or Maid in Thailand — The Complete 2026 Guide',
    description:
      'Daily, weekly, or full-time? Salary ranges by city and frequency, what scope the role should cover, where to find candidates, interview questions, contract checklist. Updated for 2026 with Bangkok, Phuket, and Chiang Mai data.',
    date: '2026-06-02',
    updated: '2026-06-02',
    readTime: 13,
    author: 'ThaiHelper Team',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    keywords:
      'hire housekeeper Thailand, hire maid Thailand, housekeeper cost Bangkok, live-in maid Bangkok, daily cleaner Thailand, weekly maid Bangkok, find housekeeper Phuket, domestic helper Thailand',
    sections: [
      {
        id: 'overview',
        h2: 'What you\'ll learn in this guide',
        html: `
          <p>"Housekeeper", "maid", and "cleaner" mean slightly different things in Thailand. A <strong>weekly cleaner</strong> may only do bathrooms, floors, and laundry on one set day. A <strong>full-time housekeeper</strong> typically handles cleaning, laundry, light cooking, light shopping, and basic organisation across a six-day week. A <strong>live-in maid</strong> is housed and fed by the family in exchange for a lower cash salary. Pricing, contracts, and the interview process differ for each.</p>
          <p>This guide covers all three. You'll learn: what each arrangement actually costs in 2026 (with city-by-city tables), how to scope the role so neither side ends up frustrated, where to find candidates, what to ask in interviews, the work-permit picture for foreign housekeepers (Burmese, Filipino, Lao, Cambodian), and the contract and benefit basics. It's written for families hiring directly — without going through a cleaning agency or a placement service — but the salary and legal information applies regardless.</p>
          <p><em>Last updated: 2 June 2026. Salary figures reflect rates current in 2026 and are sourced from active listings, recruitment data, and direct family-employer interviews. Legal references are to Thai Ministry of Labour regulations in force as of 2026.</em></p>
        `,
      },
      {
        id: 'cost',
        h2: 'How much does a housekeeper or maid in Thailand cost?',
        html: `
          <p>Housekeeper salaries in Thailand vary by three factors: <strong>frequency</strong> (one-off, weekly, daily, full-time), <strong>city</strong>, and <strong>scope</strong> (cleaning only, or cleaning plus cooking / shopping / childcare overlap). 2026 ranges below.</p>

          <h3>By frequency (Bangkok rates, scope: standard cleaning)</h3>
          <table>
            <thead><tr><th>Frequency</th><th>Rate</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>One-off deep clean</td><td>1,500 – 3,500 THB</td><td>4–6 hours, full bathrooms + floors + kitchen</td></tr>
              <tr><td>Weekly (4 hrs)</td><td>500 – 900 THB/visit</td><td>Same person each week; 2,000–3,600 THB/month</td></tr>
              <tr><td>Twice weekly (4 hrs each)</td><td>400 – 800 THB/visit</td><td>3,200–6,400 THB/month</td></tr>
              <tr><td>Daily (4 hrs morning)</td><td>250 – 450 THB/visit</td><td>5,500–10,000 THB/month, 22 working days</td></tr>
              <tr><td>Full-time live-out (6 days)</td><td>—</td><td>12,000 – 18,000 THB/month</td></tr>
              <tr><td>Full-time live-in (6 days)</td><td>—</td><td>10,000 – 15,000 THB cash + room + food</td></tr>
            </tbody>
          </table>

          <h3>By city (full-time live-out)</h3>
          <table>
            <thead><tr><th>City</th><th>Range (THB/month)</th><th>Typical</th></tr></thead>
            <tbody>
              <tr><td>Bangkok</td><td>13,000 – 18,000</td><td>15,000</td></tr>
              <tr><td>Phuket</td><td>12,000 – 17,000</td><td>14,000</td></tr>
              <tr><td>Pattaya</td><td>11,000 – 16,000</td><td>13,000</td></tr>
              <tr><td>Koh Samui</td><td>12,000 – 17,000</td><td>14,000</td></tr>
              <tr><td>Chiang Mai</td><td>10,000 – 14,000</td><td>12,000</td></tr>
              <tr><td>Hua Hin</td><td>10,000 – 14,000</td><td>12,000</td></tr>
              <tr><td>Khon Kaen, Udon Thani, Chiang Rai</td><td>8,000 – 12,000</td><td>10,000</td></tr>
            </tbody>
          </table>

          <h3>Scope premiums</h3>
          <p>The base rates above assume <strong>cleaning + laundry + light tidying</strong>. Adding scope raises the salary:</p>
          <ul>
            <li><strong>+ light cooking</strong> (Thai or basic Western meals for the family): +1,500–3,000 THB/month</li>
            <li><strong>+ grocery shopping</strong> (you give a list and budget): +500–1,500 THB/month</li>
            <li><strong>+ ironing (heavy load)</strong>: +500–1,000 THB/month</li>
            <li><strong>+ pet care</strong> (feeding, walking, basic grooming): +500–2,000 THB/month</li>
            <li><strong>+ childcare overlap</strong> (occasional pickup, watching kids for an hour): role becomes nanny-housekeeper, salary jumps to 17,000–25,000 THB/month</li>
          </ul>
          <p>Be honest with yourself about which of these you actually need. Asking a 12,000 THB/month housekeeper to also "watch the kids when needed" is the single most common reason for turnover.</p>

          <h3>What's included in the law</h3>
          <p>Full-time housekeepers in Thailand are covered by <strong>Ministerial Regulation No. 14 (2012)</strong>, which extends key labour protections to household employees: at least one day off per week, public-holiday entitlement, paid sick leave, and overtime pay for work beyond the contracted hours. For full-time employees, employers must register under <strong>Social Security Section 33</strong> — both sides contribute 5 % of monthly salary; the worker gets medical care, maternity benefits, disability cover, and a pension.</p>
        `,
      },
      {
        id: 'arrangements',
        h2: 'Daily, weekly, live-out, live-in — which is right for your home?',
        html: `
          <p>Pick by how big your home is, how often you actually need things cleaned, and how much daily flow you want.</p>

          <h3>Weekly cleaner (4 hours, one day a week)</h3>
          <p><strong>Right for:</strong> a small apartment, a one-bedroom condo, a single person or a couple without kids. You'll come home to a clean place once a week and that's enough.</p>
          <p><strong>Trade-off:</strong> Between visits the place is your problem. Laundry doesn't get done daily.</p>

          <h3>Twice-weekly or daily morning cleaner (3–4 hours)</h3>
          <p><strong>Right for:</strong> a family with young children, a condo where laundry piles up fast, or anyone who wants the kitchen reset every morning. Common pattern: she comes 7–11 am, washes breakfast dishes, throws in a load of laundry, mops floors, cleans one bathroom in rotation, leaves before lunch.</p>
          <p><strong>Trade-off:</strong> You're paying for hours rather than visible deep-cleans. The condo feels great daily but a deep clean of e.g. windows or oven still needs to be scheduled separately.</p>

          <h3>Full-time live-out housekeeper (6 days)</h3>
          <p><strong>Right for:</strong> a house rather than a small condo. Detached homes with gardens, multiple bathrooms, family laundry, and meal prep need someone present for most of the day.</p>
          <p><strong>Trade-off:</strong> Cash salary is the biggest jump (12,000–18,000 THB/month vs. ~6,000 for daily). The reward is that the house is consistently clean and meals can be on the table when you get home.</p>

          <h3>Full-time live-in housekeeper</h3>
          <p><strong>Right for:</strong> villas, large houses, and families who travel often. The housekeeper sleeps in a maid's room (most Bangkok houses and Phuket villas have one), takes one full day off per week, and is effectively part of the household routine.</p>
          <p><strong>Trade-off:</strong> Bigger up-front conversation about boundaries — her room, her food, her time. Cash salary is 20–30 % below live-out because room and food are included; budget for the real cost (food + utility share) when you compare.</p>
        `,
      },
      {
        id: 'where-to-find',
        h2: 'Where to find a housekeeper in Thailand',
        html: `
          <p>Five channels are common in Thailand. None is exclusively "best"; many families combine two or three.</p>

          <h3>1. Direct-hire marketplaces (e.g. ThaiHelper)</h3>
          <p>Housekeepers create free profiles with skills, languages, areas they're willing to commute to, and availability. Families browse, message directly, interview, and agree on terms with no platform commission on salary. Best for: structured comparison, no placement fee, full control of the conversation. Limitation: marketplaces verify identity but don't conduct in-depth background checks — references are still on you.</p>

          <h3>2. Cleaning agencies</h3>
          <p>The agency sends a cleaner (often a different person each visit) and handles supplies. Best for: zero hiring effort, easy cancellation, no employer obligations. Limitation: 30–50 % more expensive than direct-hire on a per-hour basis (Bangkok rates: 400–700 THB/hour with supplies, vs. 200–350 direct), no consistency of who shows up, no scope for cooking or pet care.</p>

          <h3>3. Recruitment / placement agencies</h3>
          <p>Different from a cleaning agency: they screen candidates and place ONE housekeeper with you long-term. You pay a one-time placement fee (5,000–20,000 THB) plus sometimes a replacement guarantee. Best for: hands-off process, vetted shortlist. Limitation: placement fee, less direct insight into the candidate pool, agency's incentive is to fill quickly.</p>

          <h3>4. Facebook groups and condo notice boards</h3>
          <p>Bangkok Expat Families, Phuket Expat Moms, and Chiang Mai Mums regularly have posts from departing families recommending their long-term housekeeper, or housekeepers looking directly for work. Strong implicit references — but timing-dependent and noisy.</p>

          <h3>5. Word of mouth</h3>
          <p>Ask neighbours, your condo juristic office, the building security guards (they know everyone), and other parents at your kids' school. Tiny candidate pool, deepest references.</p>

          <p><em>Mix-and-match pattern:</em> shortlist on a marketplace, validate with a Facebook post if the name comes up, finalise with an in-person interview at your home.</p>
        `,
      },
      {
        id: 'interview',
        h2: 'What to ask in a housekeeper interview',
        html: `
          <p>An interview at your actual home is far more useful than a phone or video call. The housekeeper sees the space; you see how she reacts to it.</p>

          <h3>Experience and references</h3>
          <ul>
            <li>How long did you work for your last two families? Why did each role end?</li>
            <li>How big were their homes — condo, townhouse, or detached house?</li>
            <li>What sort of cleaning products are you used to?</li>
            <li>May I contact your two most recent employers?</li>
          </ul>

          <h3>Scope and skills</h3>
          <ul>
            <li>Are you comfortable with the [number] of bathrooms / bedrooms here?</li>
            <li>Can you do ironing? Hand-wash delicates? Steam clothes?</li>
            <li>Do you cook Thai food? Western basics? Any food allergies or restrictions you can't accommodate?</li>
            <li>Are you comfortable with dogs / cats / our type of pet?</li>
            <li>Can you lift / carry heavy items, or should I provide a vacuum we can both manage?</li>
          </ul>

          <h3>Logistics</h3>
          <ul>
            <li>Where do you live and how do you commute? What time can you reliably start?</li>
            <li>Are there days you can't work? Any planned trips or family events in the next 6 months?</li>
            <li>What hours fit your routine — morning only, full day, or split shifts?</li>
            <li>What salary feels fair to you for this scope?</li>
          </ul>

          <h3>Trust and judgment</h3>
          <ul>
            <li>If something breaks while you're cleaning, what would you do?</li>
            <li>If we're not home and a delivery person shows up, how do you handle it?</li>
            <li>Have you ever had a serious disagreement with a previous family? How did it resolve?</li>
          </ul>

          <p>A short paid trial day is far more revealing than any interview. Pay her a fair day rate, give her the standard scope, and see how the place looks at 5 pm.</p>
        `,
      },
      {
        id: 'work-permit',
        h2: 'Foreign housekeepers (Burmese, Filipino, Lao) and work permits',
        html: `
          <p>If you hire a Thai citizen as a housekeeper, no work permit is needed. If you hire a non-Thai citizen, both a Non-Immigrant B visa and a Work Permit are required.</p>

          <h3>Common scenarios in Thailand</h3>
          <ul>
            <li><strong>Burmese housekeepers</strong> are the largest non-Thai group in this profession, particularly in Bangkok and Phuket. Many are already documented as migrant workers; some are not.</li>
            <li><strong>Filipino housekeepers</strong> are less common in domestic work (they trend toward nannying and English tutoring) but do exist, particularly with expat families.</li>
            <li><strong>Lao and Cambodian housekeepers</strong> are common in border-region cities and parts of Bangkok.</li>
          </ul>

          <h3>What the paperwork costs</h3>
          <ul>
            <li><strong>Work permit:</strong> 6,500–10,000 THB per year (employer-paid), 7–30 working-day processing time.</li>
            <li><strong>Non-Immigrant B visa:</strong> ~2,000 THB per year, plus initial setup.</li>
            <li><strong>Visa agent (most families use one):</strong> 15,000–30,000 THB initial setup, 5,000–10,000 THB per renewal year.</li>
          </ul>

          <p>Hiring an undocumented foreign worker is illegal in Thailand and exposes the <em>employer</em> to fines and immigration consequences (not just the worker). For Burmese workers without papers, there are periodic registration windows for migrant workers — your visa agent will know which one applies. Don't try to navigate this without one.</p>
        `,
      },
      {
        id: 'contract',
        h2: 'Scope, contract, and benefits',
        html: `
          <p>The single biggest source of housekeeper turnover is <strong>scope creep</strong> — a job that starts as "cleaning and laundry" expands week by week into cooking, errands, watching the dog, picking up dry-cleaning, and a bit of nanny duty. Write the scope down on day one.</p>

          <h3>What a basic contract should specify</h3>
          <ul>
            <li>Full name, ID number, contact details of both parties</li>
            <li><strong>Job description (specific):</strong> what is and is not part of the role — e.g. "cleaning, laundry, ironing — NOT childcare, NOT cooking for the parents, NOT walking the dog"</li>
            <li>Working days and hours, public-holiday list, day(s) off each week</li>
            <li>Monthly salary, payment date, payment method (bank transfer creates a record)</li>
            <li>Room and meal arrangement (live-in only)</li>
            <li>Annual leave (6 days minimum, 10–15 days customary)</li>
            <li>Paid sick leave</li>
            <li>13th-month bonus or year-end gift</li>
            <li>Notice period (30 days standard, both sides)</li>
            <li>Replacement / cleaning-product budget if she's responsible for buying supplies</li>
          </ul>

          <p>ThaiHelper publishes a free bilingual contract template at <a href="/blog/employment-contract-template-thailand">/blog/employment-contract-template-thailand</a>. Print two copies, both sign, both keep one.</p>

          <h3>Customary benefits</h3>
          <ul>
            <li><strong>13th-month bonus:</strong> universally expected, paid before Songkran or at New Year</li>
            <li><strong>Transport allowance</strong> for live-out housekeepers with a long commute (500–1,500 THB/month)</li>
            <li><strong>Cleaning supplies provided</strong> by the family — don't expect her to use her own products</li>
            <li><strong>Phone-card top-up</strong> (small, but signals you take the relationship seriously)</li>
            <li><strong>Social Security registration</strong> for full-time employees (legally required, and a genuine retention tool)</li>
          </ul>
        `,
      },
      {
        id: 'mistakes',
        h2: 'Common mistakes families make',
        html: `
          <ul>
            <li><strong>Vague scope.</strong> "Cleaning and helping out" expands into cooking, errands, and childcare. Write it down on day one.</li>
            <li><strong>Skipping the trial day.</strong> Pay for one full day with standard scope. The cleanliness at 5 pm tells you more than any reference call.</li>
            <li><strong>Not providing cleaning supplies.</strong> Don't expect her to bring her own mop, vacuum, or chemicals. Buy decent supplies; she'll use them better than budget ones and the job lasts longer.</li>
            <li><strong>Comparing direct-hire prices to cleaning-agency prices.</strong> They're not the same product. An agency charges more because they handle scheduling, supplies, replacement on sick days. Direct hire is cheaper but you absorb that overhead.</li>
            <li><strong>Skipping Social Security for full-time live-in.</strong> It's a legal requirement and a real benefit for her (free public-system medical care). It also makes the relationship more formal in a way that reduces small day-to-day arguments.</li>
            <li><strong>Not paying the 13th-month bonus.</strong> Universal expectation in Thailand. Skipping it signals you don't see the role as serious; she'll find a family who does.</li>
            <li><strong>Asking a housekeeper to do childcare.</strong> Different job, different training, different liability. Hire a nanny OR a housekeeper, not a "housekeeper who also watches the kids when needed".</li>
            <li><strong>Hiring foreign workers informally.</strong> If she doesn't have papers, you're the one taking the immigration risk. Get a visa agent or hire a Thai citizen.</li>
          </ul>
        `,
      },
      {
        id: 'next-steps',
        h2: 'Next steps',
        html: `
          <p>Ready to start? Browse verified housekeeper profiles on ThaiHelper — free to look, message directly, no agency placement fee.</p>
          <ul>
            <li><a href="/hire/housekeeper">Browse housekeepers across Thailand</a></li>
            <li><a href="/hire/housekeeper-bangkok">Housekeepers in Bangkok</a></li>
            <li><a href="/hire/housekeeper-phuket">Housekeepers in Phuket</a></li>
            <li><a href="/hire/housekeeper-chiang-mai">Housekeepers in Chiang Mai</a></li>
            <li><a href="/blog/employment-contract-template-thailand">Free bilingual contract template</a></li>
            <li><a href="/guide/hire-a-nanny-in-thailand">Hire a Nanny in Thailand — full guide</a> (if you actually need childcare, not housekeeping)</li>
          </ul>
        `,
      },
    ],
    faqs: [
      {
        question: 'How much does a housekeeper in Bangkok cost in 2026?',
        answer:
          'Full-time live-out housekeepers in Bangkok cost 13,000–18,000 THB/month. Full-time live-in is 10,000–15,000 THB cash plus a room and meals. Part-time arrangements: weekly cleaner about 2,000–3,600 THB/month for one 4-hour visit; daily morning cleaner 5,500–10,000 THB/month for 22 working days.',
      },
      {
        question: 'What is the difference between a maid, a housekeeper, and a cleaner in Thailand?',
        answer:
          'In practice the terms overlap, but: a "cleaner" usually means a part-time worker on a fixed cleaning task (4 hours, scoped); a "maid" is the more traditional full-time role focused on cleaning + laundry; a "housekeeper" typically expands to include light cooking, light shopping, and general home upkeep. Salary scales with scope, not job title.',
      },
      {
        question: 'Should I use a cleaning agency or hire a housekeeper directly?',
        answer:
          'An agency is right if you want zero hiring effort, a different person is fine each visit, and you only need 4–8 hours a week. Direct hire is better for full-time arrangements, longer relationships, scope beyond pure cleaning (cooking, pet care, laundry), and lower per-hour cost (typically 30–50 % less). Many families use both: weekly agency cleaner for deep cleans, direct-hire person for daily upkeep.',
      },
      {
        question: 'Do housekeepers in Thailand need a work permit?',
        answer:
          'Thai citizens do NOT need a work permit for domestic work. Foreign citizens (Burmese, Filipino, Lao, Cambodian) DO need both a Non-Immigrant B visa and a Work Permit. Employer pays 6,500–10,000 THB per year for the permit. Most families use a licensed visa agent for the paperwork (15,000–30,000 THB initial setup, 5,000–10,000 THB per renewal).',
      },
      {
        question: 'Is the 13th-month bonus required by law for housekeepers in Thailand?',
        answer:
          'Not strictly required by law, but universally expected. Almost every Thai family pays it, usually before Songkran (mid-April) or at Thai New Year. Skipping the 13th-month bonus is the single fastest way to lose a good housekeeper to a family that pays it.',
      },
      {
        question: 'Can I ask my housekeeper to also watch the kids occasionally?',
        answer:
          'It is the most common scope-creep mistake. Housekeeping and childcare are different jobs with different training and different legal liability. If you genuinely need occasional childcare, either hire a dedicated nanny, hire a "nanny-housekeeper" hybrid at the higher 17,000–25,000 THB/month rate from the start, or use a babysitter for evenings only — but don\'t silently add it to a housekeeper\'s role for free.',
      },
    ],
  },
];

export function getGuideBySlug(slug) {
  return guides.find((g) => g.slug === slug) || null;
}

export function getAllGuideSlugs() {
  return guides.map((g) => g.slug);
}
