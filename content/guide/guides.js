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

  {
    slug: 'hire-an-elder-caregiver-in-thailand',
    title: 'How to Hire an Elder Caregiver in Thailand — The Complete 2026 Guide',
    description:
      'Salary ranges by care level, shift options (8h, 12h, 24h, rotating teams), what to ask about medical training, work-permit logic for Filipino caregivers, dementia and post-stroke specialist rates. Updated for 2026.',
    date: '2026-06-08',
    updated: '2026-06-08',
    readTime: 14,
    author: 'ThaiHelper Team',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&q=80',
    keywords:
      'hire caregiver Thailand, elder care Bangkok, home nurse Thailand, Filipino caregiver Bangkok, hire dementia caregiver Thailand, 24 hour caregiver Phuket, post-stroke care Thailand, senior care at home Bangkok',
    sections: [
      {
        id: 'overview',
        h2: 'What you\'ll learn in this guide',
        html: `
          <p>Hiring a caregiver for an ageing parent or partner is a different decision from hiring a nanny or a housekeeper. The work is more <strong>specialised</strong> (mobility transfers, medication, sometimes incontinence and dementia behaviours), the <strong>emotional stakes are higher</strong> (you're trusting someone with a family member's safety), and the <strong>price tag is bigger</strong> (especially for 24-hour care or specialist conditions). Thailand is also one of the most cost-effective countries in the region for high-quality elder care, which is why Thai families with adult children abroad and retiring expats both increasingly choose home care over residential facilities.</p>
          <p>This guide covers what's involved: how to <strong>match the level of care to your real need</strong> (companion, basic personal care, nursing-level, dementia-specialist, end-of-life), what each tier costs in 2026, the difference between hiring one caregiver and rotating a team of two or three, where to find candidates with real training, what to ask in interviews, the work-permit logic for foreign caregivers (Filipino caregivers are common in this profession), how to structure a contract that protects both sides, and the mistakes families make when they hire under emotional pressure after a sudden health event.</p>
          <p><em>Last updated: 8 June 2026. Salary figures reflect rates current in 2026 and are sourced from active listings, recruitment data, and direct family-employer interviews. Legal references are to Thai Ministry of Labour regulations in force as of 2026.</em></p>
        `,
      },
      {
        id: 'levels',
        h2: 'Match the level of care to your real need',
        html: `
          <p>"Caregiver" covers five distinct roles in Thai practice. Hiring above your need is expensive; hiring below it is dangerous. Use this section before any salary research.</p>

          <h3>1. Companion caregiver</h3>
          <p>For an older person who is <strong>physically independent</strong> but lonely, forgetful with errands, or unsafe alone (mild fall risk, mild confusion). Tasks: company, conversation, walks, meal preparation, light tidying, reminders to take medication, accompanying to appointments. No personal care (bathing, toileting).</p>

          <h3>2. Personal-care caregiver</h3>
          <p>For someone who needs <strong>help with daily living</strong>: bathing, dressing, toileting, transfers from bed to chair, eating. Many Thai caregivers in this tier have learned on the job rather than through formal training but are very experienced. The caregiver typically reports to a family member or part-time visiting nurse.</p>

          <h3>3. Nursing-assistant level</h3>
          <p>For people with <strong>chronic conditions managed at home</strong>: diabetes, hypertension, post-surgical recovery, mobility limitations, or feeding tubes. The caregiver should have either a nursing-assistant qualification, hospital experience, or formal training. They handle medication scheduling, basic wound care, blood-pressure / blood-sugar monitoring, and know when to escalate to a doctor.</p>

          <h3>4. Specialist caregiver (dementia, post-stroke, palliative)</h3>
          <p>For specific conditions that change what good care looks like. Dementia care requires patience for repetition, redirection rather than correction, safe-environment setup, and a sleep schedule the family understands. Post-stroke care emphasises physiotherapy continuity and swallowing safety. Palliative / end-of-life care is its own field with very different communication and dignity considerations. Expect a real premium here — the caregivers who can do this well are rare and command it.</p>

          <h3>5. 24-hour or live-in caregiver</h3>
          <p>An orthogonal choice on top of the four levels above. One caregiver cannot realistically work 24 hours a day, every day, sustainably. Pick one of: <strong>two-caregiver rotation</strong> (one days, one nights), <strong>three-caregiver rotation</strong> (12-hour shifts with one day off each per week), or a <strong>live-in caregiver plus night sitter</strong> for the heaviest cases. Solo live-in works only for low-needs companion-tier roles.</p>
        `,
      },
      {
        id: 'cost',
        h2: 'How much does an elder caregiver in Thailand cost?',
        html: `
          <p>Pricing varies by <strong>care level</strong>, <strong>shift pattern</strong>, <strong>language requirement</strong>, and <strong>city</strong>. Below are 2026 ranges for the most common arrangements.</p>

          <h3>By care level (full-time, day shift, Bangkok)</h3>
          <table>
            <thead><tr><th>Level</th><th>Range (THB/month)</th><th>Typical</th></tr></thead>
            <tbody>
              <tr><td>Companion caregiver</td><td>13,000 – 18,000</td><td>15,000</td></tr>
              <tr><td>Personal-care caregiver</td><td>15,000 – 22,000</td><td>18,000</td></tr>
              <tr><td>Nursing-assistant level</td><td>20,000 – 30,000</td><td>25,000</td></tr>
              <tr><td>Dementia / post-stroke specialist</td><td>25,000 – 40,000</td><td>30,000</td></tr>
              <tr><td>Palliative / end-of-life</td><td>30,000 – 50,000</td><td>35,000</td></tr>
            </tbody>
          </table>

          <h3>By shift pattern</h3>
          <ul>
            <li><strong>Day shift (8 am – 5 pm, 6 days/week):</strong> base rates above</li>
            <li><strong>Night shift (8 pm – 6 am, 6 nights):</strong> 1.2× day rate; the work is lighter but the inversion is harder on the body</li>
            <li><strong>12-hour shifts (two-caregiver rotation):</strong> roughly 1.5× the day rate per caregiver — so two personal-care caregivers covering 24/7 = 18,000 × 1.5 × 2 = ~54,000 THB/month total</li>
            <li><strong>24-hour live-in (low-needs only):</strong> 25,000 – 40,000 THB/month plus room and food. Only realistic for companion-tier patients who sleep through the night.</li>
            <li><strong>Hourly visits (part-time):</strong> 200 – 500 THB/hour depending on level</li>
          </ul>

          <h3>Language premiums</h3>
          <ul>
            <li><strong>Thai-speaking only:</strong> base rate</li>
            <li><strong>Basic conversational English:</strong> +2,000 – 4,000 THB/month</li>
            <li><strong>Fluent English (Filipino caregiver):</strong> +5,000 – 10,000 THB/month over the Thai-speaking equivalent. A nursing-trained Filipino caregiver with hospital experience and fluent English in Bangkok commonly earns 30,000–40,000 THB/month.</li>
            <li><strong>Mandarin / Japanese:</strong> rare; rates negotiated individually</li>
          </ul>

          <h3>By city (personal-care level, day shift)</h3>
          <table>
            <thead><tr><th>City</th><th>Range (THB/month)</th><th>Typical</th></tr></thead>
            <tbody>
              <tr><td>Bangkok</td><td>15,000 – 22,000</td><td>18,000</td></tr>
              <tr><td>Phuket</td><td>14,000 – 21,000</td><td>17,000</td></tr>
              <tr><td>Pattaya</td><td>13,000 – 19,000</td><td>16,000</td></tr>
              <tr><td>Hua Hin</td><td>12,000 – 18,000</td><td>15,000</td></tr>
              <tr><td>Chiang Mai</td><td>11,000 – 17,000</td><td>14,000</td></tr>
              <tr><td>Khon Kaen, Udon Thani</td><td>10,000 – 14,000</td><td>12,000</td></tr>
            </tbody>
          </table>

          <h3>What's also part of the budget</h3>
          <ul>
            <li><strong>Social Security (Section 33):</strong> mandatory for full-time employees. 5 % each from employer and employee, covers medical and pension.</li>
            <li><strong>13th-month bonus:</strong> universally expected, paid before Songkran or at New Year.</li>
            <li><strong>Transport allowance</strong> for live-out caregivers (500 – 2,000 THB/month) — especially important for nursing-level staff whose reliability you depend on.</li>
            <li><strong>First-aid / CPR refresher</strong> (500 – 2,000 THB) — annually, paid by employer. A good caregiver wants this; one who declines it is a signal.</li>
            <li><strong>Equipment</strong> the caregiver shouldn't be paying for: gloves, masks, hand sanitiser, blood-pressure cuff, glucometer (if relevant), basic personal-protection supplies.</li>
          </ul>
        `,
      },
      {
        id: 'where-to-find',
        h2: 'Where to find an elder caregiver in Thailand',
        html: `
          <p>The channels overlap with general household hiring, but the right channel is more level-dependent than for nannies or housekeepers.</p>

          <h3>1. Direct-hire marketplaces (e.g. ThaiHelper)</h3>
          <p>Caregivers create free profiles with experience, training, languages, and the care levels they're comfortable handling. Families browse, message directly, interview at home, and agree on terms. Best for: companion and personal-care levels, full control of the hiring process, no placement fee.</p>

          <h3>2. Specialist home-care agencies</h3>
          <p>Companies like ElderThai, Bangkok Hospital Home Care, and several others operate dedicated home-care services with trained caregivers (often nursing-assistant or RN level), supervisor oversight, scheduling, and replacement on sick days. Rates are typically 1.5–2× direct-hire on a per-hour basis. Best for: nursing-level needs, complex medical situations, families who want a managed-service relationship and zero hiring effort. Limitation: cost, less choice of who exactly shows up each day, contract lock-in.</p>

          <h3>3. Hospital-affiliated discharge programmes</h3>
          <p>Bumrungrad, Bangkok Hospital, Samitivej, and BNH all have discharge-planning teams that recommend caregivers when a patient leaves after a major event (stroke, surgery, late-stage diagnosis). The caregivers they recommend are usually known to the hospital, often nursing-assistant trained, and the hospital can intervene if something goes wrong. Best for: post-surgical and post-stroke transitions. Limitation: focused on first 30–90 days; long-term arrangement still has to be negotiated separately.</p>

          <h3>4. Facebook groups, expat forums, and family referrals</h3>
          <p>Bangkok Expat Families, Phuket Expat Moms, and Chiang Mai retiree groups regularly have posts. Family-of-elderly support groups (e.g. Thailand Dementia Support, expat retirement communities) are gold for specialist referrals — caregivers who have done good work for one family in this space are often recommended onward by name.</p>

          <h3>5. Word of mouth at residential communities</h3>
          <p>Retirement villages, condo communities with older residents, and high-end serviced apartments often have a network of vetted caregivers who already work for neighbours. Ask the juristic-person office, building manager, or other residents.</p>

          <p><em>Mix pattern:</em> for personal-care level, shortlist on a marketplace + validate via Facebook. For nursing-level or specialist conditions, lead with an agency or hospital discharge programme and use direct-hire for relief / weekend shifts.</p>
        `,
      },
      {
        id: 'interview',
        h2: 'What to ask in a caregiver interview',
        html: `
          <p>Always interview in person at the patient's home. The caregiver should meet the person they would care for and the environment they would work in. A first interview without that introduction is incomplete.</p>

          <h3>Training and experience</h3>
          <ul>
            <li>What formal training have you done — nursing assistant, caregiver certificate, hospital programme, on-the-job only?</li>
            <li>How many patients have you cared for? What were their conditions?</li>
            <li>Have you worked with someone with [the specific condition we're dealing with]? Tell me about that.</li>
            <li>Are you comfortable with [bathing / toileting / transfers / wound care / insulin injections / NG-tube feeding] — whichever applies?</li>
            <li>What's your CPR / first-aid certification status? When did you last refresh it?</li>
          </ul>

          <h3>Approach to the patient</h3>
          <ul>
            <li>How would you handle our parent on a day when they are confused / agitated / refusing to eat?</li>
            <li>What's your view on restraints, sedatives, or asking the doctor for sleep medication?</li>
            <li>How would you involve our parent in their own care to preserve dignity and independence?</li>
            <li>If they ask the same question fifteen times, what do you do?</li>
          </ul>

          <h3>Safety and judgment</h3>
          <ul>
            <li>What would you do if our parent fell? Even a minor fall.</li>
            <li>How would you handle a fever, a sudden behavioural change, or unusual symptom you didn't recognise?</li>
            <li>At what point do you call us? At what point do you call an ambulance directly?</li>
            <li>If we have to be away for a day, what does your independent decision-making look like?</li>
          </ul>

          <h3>Practical fit</h3>
          <ul>
            <li>Are you comfortable in our home and area? How will you commute? (If overnight: are you a good sleeper through some noise?)</li>
            <li>What hours and days are sustainable for you?</li>
            <li>References — may we call your last two employers / agencies / supervising nurses?</li>
            <li>What salary feels fair to you for this level of care?</li>
          </ul>

          <p><strong>Critical:</strong> always do a paid trial day (or longer) with the patient present. Watching the caregiver actually interact with your parent for an afternoon tells you more than any number of interviews.</p>
        `,
      },
      {
        id: 'work-permit',
        h2: 'Foreign caregivers (Filipino, Burmese) and work permits',
        html: `
          <p>Filipino caregivers are the largest non-Thai group in higher-tier elder care in Thailand, particularly in Bangkok and Phuket. Many have formal nursing or caregiver training from the Philippines and fluent English — both of which command real premiums. Burmese caregivers are also common, more typically at companion and personal-care levels.</p>

          <h3>What's required</h3>
          <p>A foreign citizen needs a <strong>Non-Immigrant B visa</strong> and a <strong>Work Permit</strong> from the Ministry of Labour. Both are tied to the employer and the address.</p>

          <h3>Cost and timing</h3>
          <ul>
            <li><strong>Work permit:</strong> 6,500 – 10,000 THB per year (employer-paid)</li>
            <li><strong>Non-Immigrant B visa:</strong> ~2,000 THB/year plus initial setup</li>
            <li><strong>Visa agent:</strong> most families use one — 15,000 – 30,000 THB initial setup, 5,000 – 10,000 THB per renewal year</li>
            <li><strong>Processing:</strong> 7 – 30 working days once paperwork is complete</li>
          </ul>

          <h3>Tips specific to caregiver hires</h3>
          <ul>
            <li>Filipino caregivers often arrive with experience caring for elderly in Hong Kong, Singapore, or the Gulf. Ask specifically about that — long stints abroad mean adaptability and proven retention.</li>
            <li>A nursing-trained Filipino caregiver on a work permit is the closest thing to professional home nursing in Thailand at a household price. Worth budgeting for if the care level genuinely needs it.</li>
            <li>Do <strong>not</strong> hire an undocumented foreign worker for medical-tier care. If something goes wrong, the legal exposure for both you and the worker is significant.</li>
            <li>If you go through a specialist home-care agency that places Filipino caregivers, they typically handle the work-permit paperwork themselves and recharge you the cost.</li>
          </ul>
        `,
      },
      {
        id: 'contract',
        h2: 'Contract, benefits, and what to spell out',
        html: `
          <p>A caregiver contract should be more specific than a nanny or housekeeper one. The work changes when the patient's condition changes; both sides need clarity on what's included and what triggers a renegotiation.</p>

          <h3>What a caregiver contract should specify</h3>
          <ul>
            <li>Full name, ID number, training credentials, contact of both parties</li>
            <li>Patient's name, condition summary, and care goals (without sharing medical records beyond what's needed)</li>
            <li><strong>Scope:</strong> bathing, toileting, dressing, transfers, meals, medication reminders, medication administration, blood-pressure checks, wound care, escort to appointments — whichever applies. Be specific about what's <em>not</em> in scope (e.g. "no overnight stays", "no cleaning beyond patient's room").</li>
            <li>Working days, shift hours, public-holiday list, day(s) off each week</li>
            <li>What happens if the patient's condition deteriorates — does scope renegotiate? Salary renegotiate?</li>
            <li>Monthly salary, payment date, bank transfer details</li>
            <li>Room and meal arrangement (live-in only)</li>
            <li>Annual leave (6 days minimum, 10 – 15 customary; consider more for emotionally heavy roles)</li>
            <li>Paid sick leave</li>
            <li>13th-month bonus</li>
            <li>Notice period (30 days standard, both sides) — and explicit handling of <em>what happens if the patient passes away</em>. Many caregiver contracts include a 30-day post-event payment so the caregiver has time to find the next role.</li>
            <li>Confidentiality clause about the patient's condition and family matters</li>
            <li>Who pays for first-aid / CPR refresher courses (the employer)</li>
            <li>Who pays for personal-protection equipment (the employer)</li>
          </ul>

          <p>ThaiHelper publishes a free bilingual contract template that can be adapted for caregiver roles: <a href="/blog/employment-contract-template-thailand">/blog/employment-contract-template-thailand</a></p>

          <h3>Legally protected rights</h3>
          <p>Household and home-care employees are covered by <strong>Ministerial Regulation No. 14 (2012)</strong>: at least one day off per week, public-holiday entitlement, paid sick leave, and overtime pay for hours beyond the contract. For full-time staff, <strong>Social Security Section 33</strong> registration is mandatory; both sides contribute 5 % of monthly salary.</p>
        `,
      },
      {
        id: 'mistakes',
        h2: 'Common mistakes families make',
        html: `
          <ul>
            <li><strong>Hiring under emotional pressure right after a health event.</strong> The first week home from hospital is when families make their worst caregiver hires. Use a hospital-recommended caregiver for the first 2 – 4 weeks while you do a proper search for the long-term role.</li>
            <li><strong>Mismatching the care level.</strong> Hiring a companion-tier caregiver for someone with nursing needs is dangerous; hiring a nursing-trained Filipino caregiver for a healthy companion is expensive overkill. Be honest about the actual need.</li>
            <li><strong>Single 24-hour caregiver.</strong> Solo 24/7 doesn't work for anyone except the lowest-needs companion roles. Caregiver burnout is real and patient safety drops sharply with a chronically exhausted worker. Budget for at least a relief shift.</li>
            <li><strong>No emergency-escalation rules.</strong> "Call me first" doesn't help when you're on a flight. Define ambulance-call thresholds and the family member who is the second-in-line decision-maker.</li>
            <li><strong>Skipping the trial period.</strong> One paid week with the actual patient is non-negotiable. Personality fit matters enormously in elder care.</li>
            <li><strong>Verbal medical instructions.</strong> Medications, doses, schedules, contraindications — written down. Updated when anything changes. Photographed by the caregiver before the family travels.</li>
            <li><strong>Hiring foreign caregivers informally.</strong> The legal exposure here is the biggest in household employment. Always use a visa agent.</li>
            <li><strong>No social-time for the caregiver.</strong> Particularly with live-in roles caring for one person: the caregiver needs real off-hours and a real social life or she will burn out and leave just when you've built the trust.</li>
            <li><strong>Not paying the 13th-month bonus.</strong> Universal expectation; skipping it ends the relationship.</li>
          </ul>
        `,
      },
      {
        id: 'next-steps',
        h2: 'Next steps',
        html: `
          <p>You can start by browsing verified caregiver profiles on ThaiHelper — filter by city, languages, training level, and the type of care they're comfortable handling. Message directly, interview at home, no placement fees.</p>
          <ul>
            <li><a href="/hire/caregiver">Browse caregivers across Thailand</a></li>
            <li><a href="/hire/caregiver-bangkok">Caregivers in Bangkok</a></li>
            <li><a href="/hire/caregiver-phuket">Caregivers in Phuket</a></li>
            <li><a href="/hire/caregiver-chiang-mai">Caregivers in Chiang Mai</a></li>
            <li><a href="/blog/employment-contract-template-thailand">Free bilingual contract template</a></li>
            <li><a href="/blog/hire-elder-care-thailand">Elder Care in Thailand — broader overview</a></li>
            <li><a href="/guide/hire-a-nanny-in-thailand">Hire a Nanny in Thailand</a> (if you need childcare instead)</li>
          </ul>
        `,
      },
    ],
    faqs: [
      {
        question: 'How much does an elder caregiver in Bangkok cost in 2026?',
        answer:
          'A companion-tier caregiver in Bangkok costs 13,000–18,000 THB/month for day shifts. Personal-care level is 15,000–22,000. Nursing-assistant level is 20,000–30,000. Dementia or post-stroke specialists are 25,000–40,000. Fluent English (typically a Filipino caregiver) adds 5,000–10,000 THB/month over the Thai-speaking equivalent.',
      },
      {
        question: 'Can one caregiver work 24 hours a day for my elderly parent?',
        answer:
          'Sustainably, no — except for very low-needs companion-tier patients who sleep through the night. For anyone who needs night attention, overnight transfers, or has dementia behaviours, you need a two- or three-caregiver rotation. Standard arrangements: two 12-hour shifts with one caregiver each, or three caregivers doing 8-hour shifts with one day off per week.',
      },
      {
        question: 'Do I need a nursing-trained caregiver, or is a regular caregiver enough?',
        answer:
          'Depends entirely on the medical needs. For companionship, mobility assistance, and basic personal care (bathing, dressing, toileting, meals), an experienced non-nursing caregiver is appropriate and far less expensive. For medication administration, wound care, insulin injections, NG-tube feeding, post-surgical recovery, or chronic-condition monitoring, hire at the nursing-assistant level or above. Don\'t hire below the medical need — the cost difference is small compared to the risk.',
      },
      {
        question: 'Are Filipino caregivers in Thailand allowed to work without a work permit?',
        answer:
          'No. Any non-Thai citizen working in Thailand needs both a Non-Immigrant B visa and a Work Permit. Filipino caregivers are common in elder care because many have formal nursing or caregiver training and fluent English, but they all need full paperwork. The employer pays the work-permit fee (6,500–10,000 THB/year). Most families use a licensed visa agent (15,000–30,000 THB initial setup) and never deal with the paperwork directly.',
      },
      {
        question: 'Is home care or a nursing home cheaper in Thailand?',
        answer:
          'Home care is almost always cheaper and the gap is wide. A full-time day-shift personal-care caregiver in Bangkok costs around 18,000 THB/month plus Social Security. A residential nursing home runs 35,000–90,000 THB/month per resident, sometimes more for memory-care units. The trade-off is supervision and clinical infrastructure — for nursing-tier or end-stage needs, a facility may be more appropriate.',
      },
      {
        question: 'What should I do in the first week after a parent comes home from hospital?',
        answer:
          'Use a hospital-recommended caregiver or short-term agency for the first 2–4 weeks. Hiring under emotional pressure right after a hospital discharge is the single most common cause of bad long-term caregiver matches. Use the stabilisation period to interview properly, do paid trial days, and choose the long-term caregiver with a clear head. The slight premium on the interim placement is worth it.',
      },
    ],
  },

  {
    slug: 'hire-a-tutor-in-thailand',
    title: 'How to Hire a Tutor in Thailand — The Complete 2026 Guide',
    description:
      'Hourly rates by subject and tutor profile, native vs non-native English teachers, IELTS / SAT / IB exam prep specialists, online vs in-person, curriculum matching for international vs Thai schools. Updated for 2026.',
    date: '2026-06-08',
    updated: '2026-06-08',
    readTime: 14,
    author: 'ThaiHelper Team',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
    keywords:
      'hire tutor Thailand, English tutor Bangkok, math tutor Bangkok, IELTS tutor Thailand, SAT tutor Bangkok, IB tutor Bangkok, native English speaker tutor, online tutor Thailand, homeschool tutor Thailand',
    sections: [
      {
        id: 'overview',
        h2: 'What you\'ll learn in this guide',
        html: `
          <p>Hiring a tutor in Thailand is more decision-heavy than hiring a nanny or housekeeper. The right tutor depends on five things: <strong>the subject</strong>, <strong>the goal</strong> (catch-up, exam prep, enrichment, full-time homeschooling), <strong>the curriculum</strong> the child is following (Thai system, Cambridge / IGCSE, IB, American common-core, homeschool), <strong>the language of instruction</strong>, and <strong>the format</strong> (one-on-one in person, small group, online, hybrid). Each combination has a different sensible price point.</p>
          <p>This guide walks through the entire decision: how to <strong>match a tutor type to your child's actual need</strong>, what each combination costs in 2026 (the hourly market in Thailand is wider than most parents realise — 200 THB to 2,000+ THB per hour for different profiles), how to evaluate native vs non-native English speakers honestly, when online beats in-person and vice versa, where to find candidates, what to ask in interviews and trial lessons, and the work-permit picture for foreign tutors — which matters more in this category than in any other, because most expat parents specifically want native-English-speaking tutors.</p>
          <p><em>Last updated: 8 June 2026. Salary figures reflect rates current in 2026 and are sourced from active listings, recruitment data, and direct family interviews. Legal references are to Thai Ministry of Labour and Ministry of Education regulations in force as of 2026.</em></p>
        `,
      },
      {
        id: 'match',
        h2: 'Match the tutor type to your child\'s actual goal',
        html: `
          <p>A 200 THB/hour university student is the right hire for some goals and the wrong hire for others. Before any price research, get clear on which of these you actually need.</p>

          <h3>1. School catch-up / homework help</h3>
          <p>Your child is following a school curriculum and falling behind, or struggling with one specific subject. You need someone who understands the curriculum and can fill specific gaps. Often a strong university student or a recent graduate works fine; a senior teacher is overkill.</p>

          <h3>2. Subject deepening / enrichment</h3>
          <p>Your child is doing fine in school but you want them ahead in math, advanced reading, or a second language. The tutor's own depth in the subject matters here more than teaching credentials.</p>

          <h3>3. Exam preparation (IELTS, TOEFL, SAT, ACT, IB, IGCSE, AP)</h3>
          <p>Specific test, specific format, specific timeline. You want a tutor who has personally prepared multiple students for the exact same exam and can name their score outcomes. This is the highest-stakes tutor category and the hardest to fake — past student score reports are a real reference check.</p>

          <h3>4. English-as-a-Second-Language (ESL) for fluency</h3>
          <p>For Thai-system kids whose parents want stronger English, or expat kids in a non-English school environment. Look for someone with TEFL / CELTA / TESOL certification at minimum; native-speaker accent matters more here than for academic subjects.</p>

          <h3>5. Thai language for expats</h3>
          <p>Adult learners and expat children. Look for tutors with experience teaching foreigners specifically — teaching Thai to Thais is a very different skill set. Methods like Cracking Thai Fundamentals, Becker, or PALV vary in suitability.</p>

          <h3>6. Music, art, sport, code, drama</h3>
          <p>Specialist domains where the tutor's own track record matters most. Piano tutors who play at recital level themselves, coding tutors with shipped projects, art tutors with exhibition history.</p>

          <h3>7. Full-time homeschool tutor</h3>
          <p>A dedicated tutor who covers most of the curriculum across subjects, typically 4–6 hours/day, 5 days/week. Different price model (monthly salary, not hourly). Usually requires a teaching credential and the right personality to spend hours one-on-one with one child.</p>

          <h3>8. Learning-support tutor (for dyslexia, ADHD, etc.)</h3>
          <p>A specialist who has worked with children with specific learning differences and can scaffold subject material. Rare in Thailand outside Bangkok; expect to pay a premium and be patient finding the right person.</p>
        `,
      },
      {
        id: 'cost',
        h2: 'How much does a tutor in Thailand cost?',
        html: `
          <p>Most tutoring in Thailand is priced hourly. Monthly arrangements exist for homeschool and intensive exam-prep blocks but are the exception.</p>

          <h3>Hourly rates by tutor profile (Bangkok, in-person)</h3>
          <table>
            <thead><tr><th>Tutor profile</th><th>Rate (THB/hour)</th></tr></thead>
            <tbody>
              <tr><td>Thai university student, any subject</td><td>200 – 400</td></tr>
              <tr><td>Thai-school teacher (Thai-speaking, moonlighting)</td><td>400 – 700</td></tr>
              <tr><td>Non-native English speaker with TEFL (Filipino, etc.)</td><td>400 – 700</td></tr>
              <tr><td>Native-English-speaking tutor, basic ESL</td><td>600 – 1,000</td></tr>
              <tr><td>Native English speaker with teaching credential</td><td>800 – 1,500</td></tr>
              <tr><td>Subject specialist (Math / Science / Coding)</td><td>500 – 1,200</td></tr>
              <tr><td>Music / Art tutor (mid-career professional)</td><td>500 – 1,200</td></tr>
              <tr><td>IELTS / TOEFL / SAT / IB exam-prep specialist</td><td>800 – 2,000</td></tr>
              <tr><td>Learning-support specialist (dyslexia, ADHD)</td><td>1,000 – 2,500</td></tr>
            </tbody>
          </table>

          <h3>Format adjustments</h3>
          <ul>
            <li><strong>Online (Zoom / similar):</strong> 15–25 % cheaper than in-person — the tutor saves commute time. Online works very well for high-school-age and adult learners; less well for kids under ~9.</li>
            <li><strong>Small group (2–4 students):</strong> per-student rate drops 30–50 %, total revenue for the tutor goes up. Works for siblings or close friend-groups; doesn't work for kids at different levels.</li>
            <li><strong>Travel to your home:</strong> add 100–300 THB/visit on top of the hourly rate to cover the tutor's transport time and cost. In Bangkok this matters because traffic eats real hours.</li>
            <li><strong>Tutor's location (their home or a coffee shop):</strong> usually no premium but logistics are on you.</li>
          </ul>

          <h3>City variation</h3>
          <ul>
            <li><strong>Bangkok:</strong> the rates above</li>
            <li><strong>Chiang Mai:</strong> ~25 % below Bangkok (large pool of digital-nomad tutors keeps rates competitive)</li>
            <li><strong>Phuket / Pattaya / Koh Samui:</strong> ~10 % below Bangkok</li>
            <li><strong>Provincial cities:</strong> 40–50 % below Bangkok, but candidate pool for specialist subjects can be thin</li>
          </ul>

          <h3>Monthly arrangements (homeschool and intensive prep)</h3>
          <ul>
            <li><strong>Thai-speaking full-time tutor for homeschool:</strong> 25,000–40,000 THB/month, ~4–6 hours/day, 5 days/week</li>
            <li><strong>Native-English-speaking qualified tutor for homeschool:</strong> 40,000–80,000 THB/month at the same intensity</li>
            <li><strong>Intensive exam-prep package (e.g. 3-month IELTS):</strong> typically priced per package (e.g. 50–80 hours bundled at a 10–15 % discount on the per-hour rate)</li>
          </ul>

          <h3>What's not in the hourly rate but worth budgeting for</h3>
          <ul>
            <li><strong>Materials:</strong> textbooks, workbooks, exam prep books (500–3,000 THB depending on subject)</li>
            <li><strong>Mock exams:</strong> for SAT / IELTS / TOEFL — most prep tutors offer paid mocks (500–1,500 THB each); they're worth doing</li>
            <li><strong>Cancellation policy:</strong> standard is 24-hour notice or pay-in-full; agree this in advance</li>
            <li><strong>Holiday gaps:</strong> tutors don't bill during their own holidays but expect notice when you take your child's school holidays</li>
          </ul>
        `,
      },
      {
        id: 'format',
        h2: 'Online, in-person, or hybrid?',
        html: `
          <p>Post-2020, online tutoring became a real option in Thailand — and it stuck around for some learner types but not others.</p>

          <h3>When online works well</h3>
          <ul>
            <li><strong>Teenagers and adults</strong> — focus and self-direction are already there</li>
            <li><strong>Test prep</strong> — IELTS / SAT / TOEFL / GMAT — heavily document-and-screen-based anyway, online is fine</li>
            <li><strong>Subject deepening</strong> for a self-motivated learner — math, coding, advanced topics where work is on paper or screen</li>
            <li><strong>Adults learning Thai or English</strong> — speaking practice on Zoom is genuinely effective</li>
            <li><strong>When the best tutor for your need lives in a different city or country</strong> — the global tutor market opens up</li>
          </ul>

          <h3>When in-person is worth the premium</h3>
          <ul>
            <li><strong>Kids under ~9</strong> — attention span and physical presence matter</li>
            <li><strong>Music and art</strong> — the tutor needs to demonstrate posture, technique, physical correction</li>
            <li><strong>Learning-support tutoring</strong> — the tutor reads body language and adjusts in ways video doesn't carry</li>
            <li><strong>When your child genuinely doesn't engage on screen</strong> — some don't; not worth fighting it</li>
          </ul>

          <h3>Hybrid (most common pattern)</h3>
          <p>Many families settle into 2 in-person + 1 online session per week, or in-person during term and online during international holidays. Tutors generally accept this with no surcharge once the relationship is established.</p>
        `,
      },
      {
        id: 'where-to-find',
        h2: 'Where to find a tutor in Thailand',
        html: `
          <p>Five channels are common, and the right one depends heavily on what level of tutor you need.</p>

          <h3>1. Direct-hire marketplaces (e.g. ThaiHelper)</h3>
          <p>Tutors create free profiles with subjects, qualifications, languages, and rates. Families browse, message directly, do a trial lesson, agree on terms. Best for: any tutor profile from university student up to subject specialist. No platform commission. Limitation: marketplace verifies email and identity but doesn't verify teaching credentials — you have to ask for and check the documents.</p>

          <h3>2. Tutoring agencies</h3>
          <p>Agencies like Tutor Group, BangkokTutor, and several boutiques screen tutors, match them to families, and handle billing. Best for: families who want a vetted shortlist and the agency to manage scheduling. Limitation: 30–60 % higher hourly cost than direct-hire (the agency's margin), less control over which exact tutor you get.</p>

          <h3>3. International school parent networks</h3>
          <p>Almost every international school has a parent WhatsApp / Line group where tutor recommendations circulate. If your child is at NIST, ISB, KIS, Patana, or Shrewsbury, this is often the highest-signal channel — recommendations come from parents whose children are at the same school, doing the same exam track, and the tutor is already known to that community.</p>

          <h3>4. Facebook groups and expat forums</h3>
          <p>Bangkok Expat Families, Thai-language groups (for adult learners), and homeschool parent communities have regular tutor recommendations. Best for: ESL, Thai-language tutors, and homeschool support. Limitation: unverified, noisy.</p>

          <h3>5. University job boards</h3>
          <p>Chulalongkorn, Thammasat, Mahidol, AUA, and AIT have tutor job boards where graduate students post availability. Best for: math, science, and Thai-language tutoring at student rates. Limitation: turnover is high — your tutor finishes their thesis and disappears.</p>

          <p><em>Pattern for serious hires (e.g. SAT prep with a real score target):</em> ask in your school's parent network, shortlist three tutors with documented student outcomes, do a paid trial hour with each, decide on results.</p>
        `,
      },
      {
        id: 'interview',
        h2: 'How to interview a tutor (and the trial lesson)',
        html: `
          <p>A first conversation is for credentials and rapport; a paid trial lesson is for whether they can actually teach your child.</p>

          <h3>Credentials and background</h3>
          <ul>
            <li>What's your educational background and teaching qualification?</li>
            <li>For native-English-speaker roles: where are you from, and do you have a current Thai work permit covering this work?</li>
            <li>For exam-prep roles: which exam, how many students, what score outcomes? (Ask for specifics, not averages.)</li>
            <li>How long have you been tutoring in Thailand?</li>
            <li>Can you provide references from two recent families whose children studied for the same exam / subject / level?</li>
          </ul>

          <h3>Teaching approach</h3>
          <ul>
            <li>How would you handle a child who is anxious about the subject?</li>
            <li>How do you decide between drilling fundamentals and pushing toward the next level?</li>
            <li>What do you do when a child doesn't do the homework you've assigned?</li>
            <li>How do you measure whether the tutoring is working?</li>
            <li>How do you communicate progress back to the parents — frequency, format?</li>
          </ul>

          <h3>Logistics</h3>
          <ul>
            <li>What's your hourly rate, and what does it include (materials, mock exams, written feedback)?</li>
            <li>What's your cancellation policy?</li>
            <li>Are you available at our preferred times for at least the next school term?</li>
            <li>Do you tutor other students in our child's school? (Useful: tutor knows the teacher / curriculum. Risk: confidentiality.)</li>
            <li>What does your invoicing look like?</li>
          </ul>

          <h3>The trial lesson</h3>
          <p>Pay for a full hour. Sit in for the first 5 minutes and the last 5 minutes; leave the room for the rest. After:</p>
          <ul>
            <li>Ask your child: did this feel useful? Did the tutor explain things in a way you understood?</li>
            <li>Ask the tutor: what did you notice about how my child learns? What would you focus on first?</li>
            <li>Look at what the tutor produced — notes, plan, follow-up — not just what they said.</li>
          </ul>

          <p>A good tutor leaves the trial with a clear two-page plan and a recommended cadence. A weak one says "she did great" and asks when you'd like to start.</p>
        `,
      },
      {
        id: 'work-permit',
        h2: 'Foreign tutors and the work-permit question',
        html: `
          <p>This section matters more for tutoring than for any other helper category, because most expat families specifically want native English speakers and most native English speakers in Thailand are not Thai citizens.</p>

          <h3>The basic rule</h3>
          <p>Any non-Thai citizen working in Thailand — including teaching one student in your home for one hour a week — needs a <strong>Non-Immigrant B visa</strong> and a <strong>Work Permit</strong> issued by the Ministry of Labour. Tutoring is not exempt.</p>

          <h3>Where most expat tutors actually sit</h3>
          <ul>
            <li><strong>Full-time school teachers moonlighting</strong> — their visa and work permit are tied to the school. Technically, after-hours tutoring at someone else's home requires an extension to cover the second employer. Most do it without; many schools turn a blind eye but it is technically a permit violation.</li>
            <li><strong>Married to a Thai citizen (Non-O visa) and working with a permit covering "education"</strong> — fully legal. Ask for the permit.</li>
            <li><strong>Retired in Thailand on a retirement visa</strong> — not permitted to work. Tutoring is work. They legally cannot.</li>
            <li><strong>On a tourist or education visa</strong> — not permitted to work. Many do; the legal risk sits with them and with you.</li>
            <li><strong>Digital nomads claiming to teach "online from outside Thailand"</strong> — grey area. If the student is in Thailand and the tutor is physically in Thailand, it's working in Thailand regardless of where the company is registered.</li>
          </ul>

          <h3>What this means in practice</h3>
          <ul>
            <li>For one-off or short-term tutoring (a few months) with a foreigner already living in Thailand, almost all families don't worry about the work-permit detail. The enforcement risk is low. The legal risk sits primarily with the tutor.</li>
            <li>For a long-term, high-value engagement (full-time homeschool tutor, intensive multi-year exam prep), arrange the work permit properly. Use a visa agent. Budget 15,000–30,000 THB initial setup + 5,000–10,000 THB annual renewal.</li>
            <li>If you ever want to claim the tutoring cost against business income (some expats do via small Thai companies), you need the documentation to be clean — the tutor on a permit covering the work, invoices, the lot.</li>
            <li>Hiring an undocumented foreigner explicitly aware they can't legally work is the highest-risk version. If something goes wrong (your child's accident during a lesson, neighbour complaint, immigration sweep) the legal exposure attaches to the employer too.</li>
          </ul>
        `,
      },
      {
        id: 'mistakes',
        h2: 'Common mistakes families make',
        html: `
          <ul>
            <li><strong>Hiring on accent alone.</strong> "Native English speaker" doesn't mean "good teacher". A Thai or Filipino tutor with TEFL training and patience often outperforms an untrained native speaker, especially for young children.</li>
            <li><strong>Hiring without a trial lesson.</strong> An hour costs 500–2,000 THB and tells you what three interviews can't. Pay for it and run it.</li>
            <li><strong>Stacking too many tutors.</strong> A child with school + 4 tutors + homework + sports is being prepared for burnout, not for an exam. Two well-chosen tutors is almost always better than four mediocre ones.</li>
            <li><strong>No clear goal.</strong> "Improve in English" can mean reading level, conversational fluency, IELTS band, or grammar. Different goals, different tutors. Define the outcome.</li>
            <li><strong>Skipping the work-permit conversation for a long-term hire.</strong> If you're paying someone 40,000 THB/month for homeschool, you need them legally able to work. This is the most-skipped item in this category.</li>
            <li><strong>Not checking exam-prep claims.</strong> Anyone can claim "I helped a student get a 7.0 IELTS". Ask for specific past students you can call, or score-report screenshots with names redacted.</li>
            <li><strong>Letting the tutor mark their own homework.</strong> No accountability loop. Build in independent progress checks — a mock exam every 4–6 weeks, a periodic conversation with the school teacher, or a written progress note you actually read.</li>
            <li><strong>No exit clause.</strong> A tutor relationship that's not working should end at the end of a month, not drag on for a school year. Agree the off-ramp in writing on day one.</li>
          </ul>
        `,
      },
      {
        id: 'next-steps',
        h2: 'Next steps',
        html: `
          <p>You can start by browsing verified tutor profiles on ThaiHelper. Filter by subject, language, and city; message tutors directly; book a paid trial lesson before committing.</p>
          <ul>
            <li><a href="/hire/tutor">Browse tutors across Thailand</a></li>
            <li><a href="/hire/tutor-bangkok">Tutors in Bangkok</a></li>
            <li><a href="/hire/tutor-phuket">Tutors in Phuket</a></li>
            <li><a href="/hire/tutor-chiang-mai">Tutors in Chiang Mai</a></li>
            <li><a href="/blog/find-tutor-bangkok">Find a Tutor in Bangkok — broader overview</a></li>
            <li><a href="/blog/english-speaking-nanny-demand-thailand">English-Speaking Helper Demand in Thailand</a></li>
          </ul>
        `,
      },
    ],
    faqs: [
      {
        question: 'How much does a tutor cost in Bangkok in 2026?',
        answer:
          'Hourly rates in Bangkok range from 200 THB (Thai university student tutoring younger kids) to 2,000+ THB (specialist IELTS/SAT/IB tutors with track records). Typical bands: 200–400 THB for school catch-up, 400–700 for non-native English ESL or moonlighting Thai teachers, 600–1,000 for native English ESL, 800–1,500 for qualified native English with teaching credentials, 800–2,000 for exam-prep specialists. Online is 15–25 % cheaper than in-person.',
      },
      {
        question: 'Should I hire a native English speaker or a non-native tutor with TEFL?',
        answer:
          'For accent and pronunciation work, a native speaker matters. For grammar, structured curriculum, exam prep below the top band, and patience with young learners, a Thai or Filipino tutor with TEFL/CELTA training often outperforms an untrained native speaker. Match the tutor profile to the specific goal — "native speaker" is not automatically the right answer and it doubles the budget.',
      },
      {
        question: 'How do I find a tutor who actually knows the IB / IGCSE / SAT exam?',
        answer:
          'Ask for specific past students whose scores you can verify (score reports with names redacted are fine), not vague averages. Use your international school\'s parent network as the primary channel — recommendations come from families whose kids took the same exam track. Do a paid trial lesson and ask the tutor to walk you through a real past paper from the most recent year; how they handle that tells you whether they actually know the exam.',
      },
      {
        question: 'Do foreign tutors in Thailand need a work permit?',
        answer:
          'Yes. Any non-Thai citizen working in Thailand, including one-on-one tutoring in a private home, requires a Non-Immigrant B visa and a Work Permit. In practice, short-term tutoring with a foreigner already living in Thailand is often arranged informally and enforcement is low. For long-term, high-value arrangements (full-time homeschool, multi-year exam prep), arrange the permit properly via a visa agent: 15,000–30,000 THB initial setup, 5,000–10,000 THB annual renewal.',
      },
      {
        question: 'Is online tutoring as effective as in-person in Thailand?',
        answer:
          'For teenagers, adults, test prep, and subject deepening — yes, online is essentially as effective and 15–25 % cheaper. For young children (under 9), music, art, and learning-support tutoring, in-person is materially better. Many families settle into a hybrid pattern: 2 in-person sessions and 1 online per week during term, fully online during international holidays.',
      },
      {
        question: 'How many tutoring sessions per week is reasonable for a school-age child?',
        answer:
          'Two sessions per week per goal is the standard cadence — enough for skill-building between sessions, not enough to interfere with school or rest. Heavy exam prep (3–6 months before SAT/IELTS) can run to 3–4 sessions per week. Beyond that, returns drop steeply: a child with school plus 4+ tutoring sessions plus homework plus sport is being set up for burnout, and progress per hour falls.',
      },
    ],
  },

  {
    slug: 'hire-a-driver-in-thailand',
    title: 'How to Hire a Personal Driver in Thailand — The Complete 2026 Guide',
    description:
      'Monthly and daily rates, when a driver beats Grab/Bolt economically, school-run vs full-time vs executive arrangements, family-car vs driver-owned-car logic, insurance traps to avoid, work-permit and licensing essentials. Updated for 2026.',
    date: '2026-06-08',
    updated: '2026-06-08',
    readTime: 14,
    author: 'ThaiHelper Team',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80',
    keywords:
      'hire driver Bangkok, personal driver Thailand, family chauffeur Bangkok, school run driver Thailand, executive driver Bangkok, hire driver Phuket, driver cost Bangkok, hire car and driver Thailand',
    sections: [
      {
        id: 'overview',
        h2: 'What you\'ll learn in this guide',
        html: `
          <p>Hiring a personal driver in Thailand sits in an unusual price position. A full-time Bangkok driver costs about as much as a part-time tutor — 18,000–25,000 THB/month — yet shifts how a family lives more than almost any other helper hire. The trade-off against Grab and Bolt is real and changes with how many trips you make per day; the trade-off against ride-share goes one way for school-running families and the other way for couples who occasionally need an airport run.</p>
          <p>This guide covers all of that. You'll learn: <strong>when a personal driver beats ride-hailing economically</strong> (and when it doesn't), the four driver-role archetypes and what each one actually costs in 2026, the big <strong>family-car vs driver-owned-car decision</strong> that most expats get wrong, the <strong>insurance picture</strong> (the single most overlooked risk in this category — a driver crashing your car can become a major financial problem if you didn't structure cover correctly), where to find drivers, how to run a useful test drive, the work-permit question (mostly irrelevant for Thai drivers, important for the rare foreign-citizen driver), and the mistakes families make.</p>
          <p><em>Last updated: 8 June 2026. Salary figures reflect rates current in 2026 and are sourced from active listings, recruitment data, and direct family interviews in Bangkok, Phuket, and Chiang Mai. Legal and insurance references are to Thai regulations in force as of 2026.</em></p>
        `,
      },
      {
        id: 'vs-grab',
        h2: 'Do you actually need a driver, or is Grab enough?',
        html: `
          <p>Many expats in Bangkok arrive assuming they need a driver, then discover Grab and Bolt cover 90 % of trips at lower total cost. Others arrive thinking they'll Grab everywhere, then burn out two months in. The right answer depends on a small number of variables.</p>

          <h3>The maths in plain terms</h3>
          <p>A full-time Bangkok driver costs roughly 20,000 THB/month all-in (salary + social security + petrol allowance + small extras). A typical Grab Sukhumvit-to-school round trip in Bangkok runs 200–400 THB. So the break-even is roughly <strong>50–100 Grab trips per month</strong> — about 2–3 per day, every day.</p>

          <p>Families who cross that threshold easily:</p>
          <ul>
            <li>Two children at different international schools with two drop-offs and two pick-ups daily (4 trips/day base before any errands)</li>
            <li>A parent with a daily commute plus a child's school run</li>
            <li>A family that does heavy errand running, shopping, weekend trips out of town, and airport runs</li>
            <li>A retiree couple in a less-served part of Bangkok (Bang Na, Ramkhamhaeng, Nonthaburi) where Grab availability and pricing are worse than in Sukhumvit</li>
          </ul>

          <p>Families for whom Grab is plainly better:</p>
          <ul>
            <li>Single working professional, condo near work, occasional weekend trips</li>
            <li>One school-age child, school is walkable or has a school bus</li>
            <li>Anyone who travels 1–2 weeks per month — a driver still costs full salary during your trip</li>
          </ul>

          <h3>The non-financial reasons people hire a driver anyway</h3>
          <ul>
            <li><strong>Predictability.</strong> Grab surge pricing during rain or rush hour can double the price; a salaried driver doesn't.</li>
            <li><strong>Continuity with kids.</strong> A familiar adult picks up your child every day; you don't relearn the school protocol with every new driver.</li>
            <li><strong>Cargo and storage.</strong> The car becomes mobile storage for sports gear, groceries, school supplies, the dog crate.</li>
            <li><strong>Errands without a passenger.</strong> A salaried driver can pick up the visa appointment paperwork or do the supermarket run while you work — Grab can't.</li>
            <li><strong>Late-night and 4 am airport runs.</strong> Grab works for these but a known driver is more reliable.</li>
          </ul>
        `,
      },
      {
        id: 'types',
        h2: 'Four driver types — and which one fits you',
        html: `
          <h3>1. Personal / family driver (full-time, day shift)</h3>
          <p>Most common arrangement. Drives the family vehicle, on standby during the working day, school-runs in the morning and afternoon, errands and shopping in between, evening home by ~6 pm. 6 days per week.</p>

          <h3>2. Full-time live-in driver</h3>
          <p>Lives in the maid's quarters (common in Bangkok villas and Phuket pool villas) or a shared family-staff room. On standby for early-morning airport runs and late-night returns. Higher monthly cost but absorbs the time you'd otherwise lose to a driver commuting in. Suits families with irregular schedules, multiple children's evening activities, or frequent late-night events.</p>

          <h3>3. School-run only / part-time driver</h3>
          <p>The driver works mornings (drop-offs) and afternoons (pick-ups), about 4–5 hours total per day, with the middle of the day free. Pay can be split — half-salary plus paid additional trips, or a flat reduced monthly. Suits families with one or two school-age children and parents who don't need a driver during work hours.</p>

          <h3>4. Executive / VIP driver</h3>
          <p>Drives the principal (an executive or business owner) on a working schedule that maps to their day. Often expected to wear a suit, drive a black sedan, speak English well, and conduct themselves at executive level. Different price band (30,000–50,000 THB/month) and often comes with specific defensive-driving training. Common for senior expats on company packages.</p>

          <h3>5. Occasional / day-rate driver</h3>
          <p>Not really a hire — a known driver booked for a specific trip (a Saturday day out, a Hua Hin weekend, a multi-stop wedding day, a multi-day Chiang Mai trip). 1,500–3,000 THB per day for the driver's time, fuel separate, plus the driver's accommodation if overnight. Many families maintain two or three such drivers in a contacts list rather than employing one.</p>
        `,
      },
      {
        id: 'cost',
        h2: 'How much does a driver in Thailand cost?',
        html: `
          <h3>Monthly salaries (full-time, family-car arrangement)</h3>
          <table>
            <thead><tr><th>Driver type</th><th>Range (THB/month)</th><th>Typical</th></tr></thead>
            <tbody>
              <tr><td>Personal / family driver, Bangkok</td><td>15,000 – 25,000</td><td>20,000</td></tr>
              <tr><td>Personal / family driver, Phuket / Pattaya</td><td>14,000 – 22,000</td><td>18,000</td></tr>
              <tr><td>Personal / family driver, Chiang Mai / Hua Hin</td><td>12,000 – 18,000</td><td>15,000</td></tr>
              <tr><td>Live-in driver (Bangkok)</td><td>18,000 – 30,000</td><td>22,000 + room</td></tr>
              <tr><td>School-run only (4–5 hrs/day)</td><td>9,000 – 15,000</td><td>12,000</td></tr>
              <tr><td>Executive / VIP driver (Bangkok)</td><td>30,000 – 50,000</td><td>40,000</td></tr>
              <tr><td>English-speaking driver, premium</td><td>add 3,000 – 8,000</td><td>—</td></tr>
            </tbody>
          </table>

          <h3>Hourly and day rates (occasional / part-time)</h3>
          <ul>
            <li><strong>Hourly:</strong> 200 – 400 THB/hour (4-hour minimum is common)</li>
            <li><strong>Day rate (8 hours):</strong> 1,500 – 3,000 THB, fuel separate</li>
            <li><strong>Overnight trip:</strong> add 800 – 1,500 THB per night for the driver's accommodation</li>
            <li><strong>Multi-day road trip (e.g. Bangkok → Chiang Mai with stops):</strong> 2,500 – 4,000 THB/day plus fuel plus accommodation</li>
            <li><strong>Airport-only contracts:</strong> 800 – 1,500 THB per airport run within Bangkok; surcharge for very early or late hours</li>
          </ul>

          <h3>What's also part of the monthly budget</h3>
          <ul>
            <li><strong>Fuel:</strong> if driver uses family car, you pay petrol directly. Budget 3,000–6,000 THB/month for normal Bangkok use.</li>
            <li><strong>Driver's meals:</strong> roughly 100–200 THB/day if not provided. Many families just give the driver a fixed daily food allowance or include lunch when at home.</li>
            <li><strong>Parking:</strong> at your home (usually free if you have a spot), at malls and offices (the driver bills it back or you pre-pay).</li>
            <li><strong>13th-month bonus:</strong> universally expected.</li>
            <li><strong>Social Security (Section 33):</strong> 5 % from employer + 5 % from employee for full-time staff.</li>
            <li><strong>Driver's licence renewal and physical:</strong> small but check the licence is current at hire.</li>
            <li><strong>Defensive-driving / first-aid refresher</strong> if you want it. 1,500–3,000 THB for a half-day course. Worth doing once a year for school-run drivers.</li>
          </ul>

          <h3>The driver-owned-car alternative (cost shifts entirely)</h3>
          <p>Some drivers own their own car (typically a Toyota Vios, Honda City, or similar) and offer a full package — driver + vehicle + petrol + maintenance — billed monthly. Rates: 30,000 – 50,000 THB/month all-in for a sedan in Bangkok. Useful when you don't want to own a car at all (no purchase, no registration, no maintenance headaches). Less common in Phuket and Chiang Mai. Discussed more in the next section.</p>
        `,
      },
      {
        id: 'car-decision',
        h2: 'Driver\'s own car vs your car — the big decision',
        html: `
          <p>This is the single biggest practical decision in hiring a driver and most expat families don't think about it carefully enough.</p>

          <h3>Option A: You own the car, driver drives it</h3>
          <p><strong>Cost:</strong> car purchase (or lease) + maintenance + insurance + registration + petrol + driver salary.</p>
          <p><strong>Right for:</strong> families who plan to be in Thailand 2+ years, want a specific car (SUV, 7-seater, electric), and value control over the vehicle's condition.</p>
          <p><strong>Watch out for:</strong> insurance is your problem (covered below); maintenance is your problem; if the driver leaves, you still have a car you have to maintain or sell.</p>

          <h3>Option B: Driver owns and provides the car (and petrol)</h3>
          <p><strong>Cost:</strong> a single all-in monthly rate, typically 30,000 – 50,000 THB/month in Bangkok for a sedan. Some include first-class insurance.</p>
          <p><strong>Right for:</strong> shorter-term assignments (under 2 years), families who specifically don't want to own a car, anyone moving to Thailand without certainty about how long they'll stay.</p>
          <p><strong>Watch out for:</strong> car condition varies; agree explicitly that the car must be a specific year-or-newer with first-class insurance. The driver replaces tyres, services, repairs — but on the cheapest schedule. If you have small children, request a four-door sedan with rear-seat airbags and ISOFIX.</p>

          <h3>Option C: Hybrid — driver only, family rents or leases a car separately</h3>
          <p>Less common but increasingly popular in Bangkok with the rise of long-term lease services. You lease a car from a company (Toyota Sure, Mazda Lease, MG Sure, or independents like Tipperary) for 25,000–45,000 THB/month, then hire a driver separately. Some leases include first-class insurance and replacement during service, which removes the maintenance-burden objection from Option A.</p>
        `,
      },
      {
        id: 'insurance',
        h2: 'The insurance chapter you must read',
        html: `
          <p>Hire-driver crashes happen. Bangkok traffic, motorbike weavers, sudden rain, fatigue at the end of a long day. The insurance setup at the moment of impact is what decides whether it's a 20,000 THB inconvenience or a 200,000 THB problem. This section is for the family-car arrangement (driver drives your vehicle); the driver-owned arrangement should also be checked but the risk is mostly on the driver.</p>

          <h3>The five insurance layers in Thailand</h3>
          <ul>
            <li><strong>Compulsory Motor Insurance (พ.ร.บ. / "Por Ror Bor"):</strong> legally required, very cheap, covers basic injury claims to third parties (and the driver in some scenarios). Covers almost nothing in a real accident — bodily injury only, modest limits.</li>
            <li><strong>1st-Class voluntary insurance:</strong> full cover — third-party damage, your own car, theft, fire, glass. The default for any car worth keeping. Annual premium 15,000–40,000 THB depending on car value and driver history.</li>
            <li><strong>2nd-Class / 3rd-Class voluntary:</strong> partial cover (third-party only, or third-party with limited own-car). Used for older or low-value cars. Inadequate for a car a hired driver uses daily.</li>
            <li><strong>"Named driver" vs "any driver" provisions:</strong> this is the trap. Some 1st-Class policies cover only drivers explicitly listed on the policy. If your hired driver isn't on the policy and crashes, the insurer can deny the claim. Always confirm in writing that the policy covers <em>any licensed driver above age X</em>, OR add your driver as a named driver from day one.</li>
            <li><strong>Personal accident cover for the driver:</strong> separate cheap add-on (1,000–3,000 THB/year) that pays medical and disability benefits if the driver is injured. Strongly recommended — and a good faith signal to the driver.</li>
          </ul>

          <h3>The four things to do at the moment of hire</h3>
          <ol>
            <li><strong>Confirm the policy is 1st-Class</strong> and renew it before the start of employment if it's expired or below 1st-Class.</li>
            <li><strong>Add the driver as a named driver, OR confirm the "any licensed driver" clause</strong> in writing with the insurance company. Get the confirmation in email or a re-issued policy schedule.</li>
            <li><strong>Take a current photo of the driver's licence</strong> (Thai government driving licence is required; check the expiry date — many are valid 5 years). Verify it's a regular driving licence, not an expired learner's permit.</li>
            <li><strong>Add personal accident cover for the driver</strong> as an add-on to your policy or as a separate small policy. Roughly 2,000 THB/year for meaningful cover.</li>
          </ol>

          <h3>If the car is a company car</h3>
          <p>If you're driving a corporate car (provided by your employer in Thailand), the corporate insurance probably does <em>not</em> automatically cover personal drivers. Check with HR or the company secretary, get the cover extended in writing before the driver touches the keys, and budget the upgrade if needed.</p>
        `,
      },
      {
        id: 'where-to-find',
        h2: 'Where to find a driver in Thailand',
        html: `
          <p>Four channels are realistic for a long-term hire.</p>

          <h3>1. Direct-hire marketplaces (e.g. ThaiHelper)</h3>
          <p>Drivers create profiles with experience, licence type, English level, areas they're willing to commute, and the type of work they prefer (school-run, family, executive). Best for: standard family driver hires, no placement fee, structured comparison.</p>

          <h3>2. Driver placement / company-secretary firms</h3>
          <p>Several Bangkok firms place drivers for companies and high-net-worth families. They typically vet candidates more thoroughly (defensive-driving certification, background check, English assessment) and charge a placement fee of 8,000–25,000 THB. Best for: executive drivers, families wanting a fully managed shortlist.</p>

          <h3>3. Word of mouth — condo, building, and school networks</h3>
          <p>The single strongest channel for school-run drivers. Other parents at your school's drop-off line know which drivers are reliable; condo juristic-person offices know which drivers serve other residents well. A driver recommended by another family at your child's school usually beats any other channel.</p>

          <h3>4. Departing-expat handovers</h3>
          <p>An expat family leaving Thailand often wants to place their long-term driver with another family. The implicit reference is strong (this person has done the job well for years), the driver is already trained on Bangkok traffic patterns, and continuity for the driver is meaningful. Watch the Facebook groups and your school's parent network for these handover posts — they go quickly.</p>

          <h3>5. Grab / Bolt poaching — the grey method</h3>
          <p>Some families "discover" a particular ride-hailing driver, ask if he'd drive for them full-time, and convert him into a personal driver. Surprisingly common; works fine if the driver wants the stable income. Note: the Grab platform doesn't love this and the driver may need to actually leave the platform if he becomes full-time with you.</p>
        `,
      },
      {
        id: 'test-drive',
        h2: 'The interview and the test drive',
        html: `
          <p>An interview is for credentials and personality. A test drive is for whether you'd actually let this person drive your child every day. Both matter and the second one matters more.</p>

          <h3>Interview questions</h3>
          <ul>
            <li>How long have you been driving in Bangkok specifically? (Years total isn't enough — Bangkok experience is what counts.)</li>
            <li>Show me your current Thai driving licence. (Photograph the front and back; note the expiry.)</li>
            <li>What types of vehicles have you driven — sedan, SUV, 7-seater, manual transmission, automatic?</li>
            <li>Have you ever had an accident? Tell me about it. (Everyone has; the answer is in how they handle the question.)</li>
            <li>What's your typical commute to our area? Will you be reliably on time for 7 am drop-offs?</li>
            <li>How is your English / Thai for our purposes?</li>
            <li>Are you comfortable driving in heavy rain, late at night, on tollways, and outside Bangkok?</li>
            <li>How do you handle a tense passenger or a child crying in the back?</li>
            <li>References — may we contact your last two employers?</li>
          </ul>

          <h3>The test drive (non-negotiable before hiring)</h3>
          <p>Pay for a real driving session — at least 60 – 90 minutes, with you as passenger. Include:</p>
          <ul>
            <li><strong>A school-run-style route</strong> at school-run time, traffic and all</li>
            <li><strong>A motorway / expressway segment</strong> (Bangkok elevated motorway is fine)</li>
            <li><strong>A tight parking situation</strong> (mall basement, residential street)</li>
            <li><strong>A small unfamiliar destination</strong> using only the navigation app — to see how they handle directions and unexpected detours</li>
          </ul>

          <p>What you're looking for: smooth braking and acceleration (your back tells you), lane discipline, distance to the car in front (defensive driving is mostly distance management), calm in heavy traffic, mirror checks before lane changes, comfort with the navigation app. Hard braking, weaving between lanes, very close following, and impatience are disqualifiers — they will not improve, no matter how good the references look.</p>
        `,
      },
      {
        id: 'work-permit',
        h2: 'Work permits — almost always a non-issue, but check',
        html: `
          <p>The overwhelming majority of personal drivers in Thailand are Thai citizens. No work permit is required for them; a current Thai driving licence is the only legal document that matters at hire.</p>

          <h3>The rare foreign-driver case</h3>
          <p>Driving for hire is on the list of professions <strong>reserved for Thai citizens</strong> under the Foreign Employment Act. A foreign citizen cannot be hired as a personal driver in Thailand. Some expats arrange for a spouse or trusted foreign friend to drive informally — legally this is grey but not commercial driving and is generally not enforced. A foreign-citizen "driver" hired under a work permit covering a different role (e.g. personal-assistant role that happens to include driving) is technically a workaround that depends on how the work permit is written. If a foreign person is going to be driving you regularly, get advice from a Thai immigration lawyer about how the role is described.</p>

          <h3>What you do need to verify at hire (Thai driver)</h3>
          <ul>
            <li><strong>Valid Thai driving licence</strong> — photograph both sides, note the expiry, set a reminder to follow up before it expires</li>
            <li><strong>Licence category appropriate to your vehicle</strong> — most car drivers are fine with the basic category; check if you have a larger vehicle (van, 7-seater on some classifications)</li>
            <li><strong>No restrictions on the licence</strong> (e.g. "daytime only" — rare but exists)</li>
            <li><strong>For executive / livery drivers:</strong> a "Public" category (รับจ้าง) Thai licence is sometimes required if the driver will drive a vehicle registered as commercial. Most personal-driver arrangements use private vehicles and a standard licence.</li>
          </ul>
        `,
      },
      {
        id: 'mistakes',
        h2: 'Common mistakes families make',
        html: `
          <ul>
            <li><strong>Hiring without a real test drive.</strong> An interview tells you nothing about how someone drives. Pay for 60–90 minutes of real driving with you in the car and decide based on that.</li>
            <li><strong>Not verifying the licence is current.</strong> Photograph it on day one. Set a calendar reminder for the renewal date.</li>
            <li><strong>Not checking that insurance covers the hired driver.</strong> Many 1st-Class policies in Thailand only cover named drivers or the owner. A claim denied because your driver wasn't on the policy can cost six figures. Confirm in writing with the insurer before day one.</li>
            <li><strong>No personal accident cover for the driver.</strong> A driver injured at work has limited Social Security coverage. The add-on costs ~2,000 THB/year and removes a real risk for both sides.</li>
            <li><strong>Driver-owned-car arrangement without specifying car class.</strong> "I'll provide a car" without specifying year, make, and that it must carry first-class insurance leads to families being driven around in 15-year-old cars with bald tyres. Specify in the contract.</li>
            <li><strong>Treating the driver like a 24/7 on-call resource.</strong> 7 am to 6 pm with a clear lunch break is sustainable. Calling them out at 11 pm three nights a week is not — the driver will quit, often without notice.</li>
            <li><strong>No fuel-account discipline.</strong> If the driver fills up the family car, they pay first and you reimburse against the receipt. Don't hand them cash up front; receipts get vague.</li>
            <li><strong>Skipping the 13th-month bonus.</strong> Universally expected. Skipping it ends the relationship faster in this role than almost any other helper category — drivers talk to each other.</li>
            <li><strong>Hiring on accent alone.</strong> "English-speaking driver" is a real premium (3,000–8,000 THB/month). If your child's school is bilingual or you communicate fine in Thai, this is the easiest premium to skip.</li>
            <li><strong>Hiring a foreigner to drive without thinking about the legal restriction.</strong> Driving is on the Thai-citizens-only list. Don't.</li>
          </ul>
        `,
      },
      {
        id: 'next-steps',
        h2: 'Next steps',
        html: `
          <p>Browse verified driver profiles on ThaiHelper — filter by city, English level, and the type of driving you need (school-run, family, executive). Free to look, free to message, no placement fees.</p>
          <ul>
            <li><a href="/hire/driver">Browse drivers across Thailand</a></li>
            <li><a href="/hire/driver-bangkok">Drivers in Bangkok</a></li>
            <li><a href="/hire/driver-phuket">Drivers in Phuket</a></li>
            <li><a href="/hire/driver-chiang-mai">Drivers in Chiang Mai</a></li>
            <li><a href="/blog/hire-driver-bangkok-guide">Hire a Driver in Bangkok — broader overview</a></li>
            <li><a href="/blog/employment-contract-template-thailand">Free bilingual contract template</a></li>
          </ul>
        `,
      },
    ],
    faqs: [
      {
        question: 'How much does a personal driver in Bangkok cost in 2026?',
        answer:
          'A full-time personal driver in Bangkok costs 15,000–25,000 THB/month for the standard family arrangement (driver drives your car, 6 days a week, ~9-hour days). Live-in drivers run 18,000–30,000 THB plus room. School-run-only drivers (4–5 hours/day) are 9,000–15,000 THB/month. Executive drivers — suit, English fluent, professional manner — are 30,000–50,000 THB/month. English-speaking premium adds 3,000–8,000 THB on any tier.',
      },
      {
        question: 'Is hiring a driver cheaper than using Grab in Bangkok?',
        answer:
          'A full-time Bangkok driver costs about 20,000 THB/month all-in. A typical Grab trip is 200–400 THB. Break-even is around 50–100 Grab trips per month, or roughly 2–3 trips per day every day. Families with two school runs and weekend errands easily cross that threshold; single working professionals usually don\'t. Non-financial reasons — predictability, no surge pricing, continuity with kids, errands without a passenger — also matter.',
      },
      {
        question: 'Should I provide a car or hire a driver who has their own?',
        answer:
          'Driver-with-car arrangements (30,000–50,000 THB/month all-in including petrol and insurance) make sense for shorter-term stays (under 2 years) and families who don\'t want to own a car. Family-car-with-driver (20,000 THB salary + petrol + your insurance/maintenance) makes sense for long-term residents who want a specific vehicle and value control over its condition. A third option — long-term lease the car separately, hire the driver separately — has become popular in Bangkok.',
      },
      {
        question: 'Will my car insurance cover a hired driver?',
        answer:
          'Not automatically. Many Thai 1st-Class policies cover only "named drivers" listed on the policy, or only the registered owner. Add your driver as a named driver from day one, OR confirm in writing with the insurer that the policy covers "any licensed driver above [age]". A claim denied because the hired driver wasn\'t on the policy can cost six figures. Always confirm before the driver touches the keys.',
      },
      {
        question: 'Do foreigners need a work permit to drive for a private family in Thailand?',
        answer:
          'A foreign citizen cannot be hired as a personal driver in Thailand — driving for hire is on the list of professions reserved for Thai citizens under the Foreign Employment Act. The overwhelming majority of personal drivers are Thai citizens; no work permit is needed but a valid Thai driving licence is. A foreign citizen driving informally for a family (e.g. a spouse, friend) is a grey area and generally not enforced, but is not a commercial-driving arrangement.',
      },
      {
        question: 'What hours can I reasonably expect from a full-time driver?',
        answer:
          'Standard is 6 days a week, roughly 7 am to 6 pm with a clear lunch break — about 50–55 working hours per week. Overtime (late dinners, weekend errands beyond contracted hours) is paid separately or banked as time off. Calling a driver out at 11 pm three nights a week without compensation is the fastest way to lose a good driver. Live-in drivers have more flexible availability for early-morning or late-night trips but still need real off-time.',
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
