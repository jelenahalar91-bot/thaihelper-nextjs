import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

const T = {
  en: {
    page_title: 'Pricing – ThaiHelper',
    meta_desc: 'Simple, transparent pricing for families. Browse helpers for free. Unlock unlimited messaging for as little as $5/month.',
    nav_home: 'Home',
    nav_employers: 'For Families',
    nav_login: 'Login',
    nav_cta: 'Register – Free',
    hero_eyebrow: 'Pricing',
    hero_h1: 'Simple, transparent pricing',
    hero_sub: 'Free to browse. Pay only when you are ready to contact helpers directly. No middleman fees, no commissions — ever.',
    promo_badge: '🎉 100% free for the first 2 months — no credit card required.',
    promo_launch_note: 'Launch offer — available only while we\'re growing our network.',
    // Cards
    tier_free_name: 'Free',
    tier_free_price: '$0',
    tier_free_per: 'forever',
    tier_free_desc: 'Browse the full helper directory and get a feel for the platform.',
    tier_free_cta: 'Create free account',
    tier_1m_name: '1 Month',
    tier_1m_price: '$9',
    tier_1m_per: 'per month',
    tier_1m_desc: 'Perfect for a one-off hire. Full access for 30 days.',
    tier_1m_cta: 'Get 1 Month',
    tier_3m_name: '3 Months',
    tier_3m_price: '$19',
    tier_3m_per_equiv: '≈ $6.33/month',
    tier_3m_save: 'Save 30%',
    tier_3m_badge: '⭐ Best Value',
    tier_3m_desc: 'Our most popular plan. Enough time to interview, hire and settle in.',
    tier_3m_cta: 'Get 3 Months',
    tier_3m_timeline_label: 'Why 3 months?',
    tier_3m_timeline_body: 'A realistic hire takes 4–6 weeks. You\'ll receive many applications, message shortlisted helpers, hold in-person interviews and run a 1–2 week trial before you commit. 3 months gives you breathing room to find the right match without the pressure of a ticking clock.',
    tier_12m_name: '12 Months',
    tier_12m_price: '$49',
    tier_12m_per_equiv: '≈ $4.08/month',
    tier_12m_save: 'Save 55%',
    tier_12m_desc: 'The cheapest per-month rate. Best for households hiring more than once a year.',
    tier_12m_cta: 'Get 12 Months',
    thb: '',
    coming_soon: 'Coming Soon',
    // Feature lists
    free_feat1: 'Browse all verified helper profiles',
    free_feat2: 'See ratings, reviews and experience',
    free_feat3: 'Message preview (first 3 words only)',
    free_feat4_lock: 'Direct contact locked',
    paid_feat1: 'Everything in Free, plus:',
    paid_feat2: 'Unlimited full-text messaging',
    paid_feat3: 'Unlock WhatsApp, phone & email',
    paid_feat4: 'Save favourite helpers',
    paid_feat5: 'Priority email support',
    // FAQ
    faq_title: 'Common questions',
    faq_q1: 'Do I need a credit card to start?',
    faq_a1: 'No. You can register as an employer and browse all helpers for free — no credit card required. During our launch phase, new accounts get the first 2 months of full access completely free. This launch bonus will go away once we\'ve grown our network of helpers and employers, so the earlier you join, the better.',
    faq_q2: 'Can I cancel anytime?',
    faq_a2: 'Yes. Each plan is a one-time payment for the period you choose. Nothing auto-renews — if you stop needing a helper, you simply stop paying.',
    faq_q3: 'What happens after my plan ends?',
    faq_a3: 'Your account stays free forever. You keep access to all helper profiles and your message history, but you\'ll need to renew a plan to send new full-text messages.',
    faq_q4: 'Why charge families but not helpers?',
    faq_a4: 'Helpers have traditionally lost significant amounts of salary to placement fees. We keep ThaiHelper free for helpers so they keep every dollar they earn. Families pay a small, transparent platform fee instead.',
    // Final CTA
    cta_h2: 'Still have questions?',
    cta_p: 'Email us at support@thaihelper.app — we usually reply within a few hours.',
    cta_btn: 'Register Now',
    // Footer
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is operated by Planet Bamboo GmbH (Germany). We are not a recruitment agency and do not provide placement services. The platform is currently free to use. All transactions are processed offshore via LemonSqueezy. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    page_title: 'ราคา – ThaiHelper',
    meta_desc: 'ราคาโปร่งใสสำหรับครอบครัว ค้นหาผู้ช่วยฟรี ปลดล็อกการส่งข้อความเริ่มต้นเพียง $5/เดือน',
    nav_home: 'หน้าหลัก',
    nav_employers: 'สำหรับครอบครัว',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'ลงทะเบียน – ฟรี',
    hero_eyebrow: 'ราคา',
    hero_h1: 'ราคาเรียบง่าย โปร่งใส',
    hero_sub: 'ค้นหาฟรี จ่ายเฉพาะเมื่อคุณพร้อมติดต่อผู้ช่วยโดยตรง ไม่มีค่าคนกลาง ไม่มีค่าคอมมิชชั่น',
    promo_badge: '🎉 ฟรี 100% สำหรับ 2 เดือนแรก — ไม่ต้องใช้บัตรเครดิต',
    promo_launch_note: 'ข้อเสนอช่วงเปิดตัว — มีให้เฉพาะช่วงที่เรากำลังขยายเครือข่ายเท่านั้น',
    tier_free_name: 'ฟรี',
    tier_free_price: '$0',
    tier_free_per: 'ตลอดไป',
    tier_free_desc: 'ค้นหาผู้ช่วยทั้งหมดและสัมผัสประสบการณ์ใช้งานแพลตฟอร์ม',
    tier_free_cta: 'สร้างบัญชีฟรี',
    tier_1m_name: '1 เดือน',
    tier_1m_price: '$9',
    tier_1m_per: 'ต่อเดือน',
    tier_1m_desc: 'เหมาะสำหรับการจ้างครั้งเดียว ใช้งานเต็มรูปแบบ 30 วัน',
    tier_1m_cta: 'ซื้อ 1 เดือน',
    tier_3m_name: '3 เดือน',
    tier_3m_price: '$19',
    tier_3m_per_equiv: '≈ $6.33/เดือน',
    tier_3m_save: 'ประหยัด 30%',
    tier_3m_badge: '⭐ คุ้มที่สุด',
    tier_3m_desc: 'แผนที่นิยมที่สุด มีเวลาเพียงพอสำหรับสัมภาษณ์ จ้าง และปรับตัว',
    tier_3m_cta: 'ซื้อ 3 เดือน',
    tier_3m_timeline_label: 'ทำไมต้อง 3 เดือน?',
    tier_3m_timeline_body: 'การจ้างที่เหมาะสมใช้เวลา 4–6 สัปดาห์ คุณจะได้รับใบสมัครจำนวนมาก ส่งข้อความถึงผู้ช่วยที่เข้ารอบ สัมภาษณ์ตัวต่อตัว และทดลองงาน 1–2 สัปดาห์ก่อนตัดสินใจจ้างจริง แผน 3 เดือนให้เวลาเพียงพอในการหาคนที่ใช่โดยไม่ต้องเร่งรีบ',
    tier_12m_name: '12 เดือน',
    tier_12m_price: '$49',
    tier_12m_per_equiv: '≈ $4.08/เดือน',
    tier_12m_save: 'ประหยัด 55%',
    tier_12m_desc: 'ราคาต่อเดือนถูกที่สุด เหมาะสำหรับครอบครัวที่จ้างมากกว่า 1 ครั้งต่อปี',
    tier_12m_cta: 'ซื้อ 12 เดือน',
    thb: '',
    coming_soon: 'เร็วๆ นี้',
    free_feat1: 'ค้นหาโปรไฟล์ผู้ช่วยที่ยืนยันทั้งหมด',
    free_feat2: 'ดูคะแนน รีวิว และประสบการณ์',
    free_feat3: 'ดูตัวอย่างข้อความ (3 คำแรกเท่านั้น)',
    free_feat4_lock: 'ติดต่อโดยตรงถูกล็อก',
    paid_feat1: 'ทุกอย่างในแพ็กฟรี พร้อม:',
    paid_feat2: 'ส่งข้อความเต็มรูปแบบไม่จำกัด',
    paid_feat3: 'ปลดล็อก WhatsApp เบอร์โทร และอีเมล',
    paid_feat4: 'บันทึกผู้ช่วยที่ชื่นชอบ',
    paid_feat5: 'การสนับสนุนทางอีเมลแบบพิเศษ',
    faq_title: 'คำถามที่พบบ่อย',
    faq_q1: 'ต้องใช้บัตรเครดิตเพื่อเริ่มต้นหรือไม่?',
    faq_a1: 'ไม่ต้อง คุณสามารถลงทะเบียนและค้นหาผู้ช่วยได้ฟรี ไม่ต้องใช้บัตรเครดิต ในช่วงเปิดตัว บัญชีใหม่ได้ใช้งานฟรีเต็มรูปแบบ 2 เดือนแรก โบนัสนี้จะหายไปเมื่อเครือข่ายของเราเติบโตขึ้น ยิ่งสมัครเร็ว ยิ่งได้ประโยชน์',
    faq_q2: 'ยกเลิกได้ทุกเมื่อหรือไม่?',
    faq_a2: 'ได้ แต่ละแผนเป็นการชำระเงินครั้งเดียวสำหรับระยะเวลาที่เลือก ไม่มีการต่ออายุอัตโนมัติ',
    faq_q3: 'เกิดอะไรขึ้นหลังจากแผนของฉันหมดอายุ?',
    faq_a3: 'บัญชีของคุณยังคงฟรีตลอดไป คุณยังคงเข้าถึงโปรไฟล์ผู้ช่วยและประวัติข้อความของคุณ แต่ต้องต่ออายุเพื่อส่งข้อความเต็มรูปแบบใหม่',
    faq_q4: 'ทำไมถึงเก็บค่าบริการจากนายจ้างแต่ไม่เก็บจากผู้ช่วย?',
    faq_a4: 'ผู้ช่วยมักสูญเสียรายได้จำนวนมากจากค่าธรรมเนียมการจัดหางาน เราให้บริการฟรีสำหรับผู้ช่วยเพื่อให้พวกเขาเก็บรายได้ทั้งหมดที่หามาได้',
    cta_h2: 'ยังมีคำถามอยู่?',
    cta_p: 'ส่งอีเมลหาเราที่ support@thaihelper.app — เรามักตอบกลับภายในไม่กี่ชั่วโมง',
    cta_btn: 'ลงทะเบียนเป็นนายจ้าง',
    footer_desc: 'ThaiHelper เชื่อมต่อครอบครัวและชาวต่างชาติในประเทศไทยกับผู้ช่วยภายในบ้านที่เชื่อถือได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'สิทธิประโยชน์', footer_hire: 'ประเภท', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับ', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'เงื่อนไขการใช้งาน',
    footer_disclaimer: 'ThaiHelper.app ดำเนินการโดย Planet Bamboo GmbH (ประเทศเยอรมนี) เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน แพลตฟอร์มให้บริการฟรีในปัจจุบัน ธุรกรรมทั้งหมดดำเนินการผ่าน LemonSqueezy การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
  ru: {
    page_title: 'Цены – ThaiHelper',
    meta_desc: 'Простые и прозрачные цены для семей. Просмотр помощников бесплатно. Неограниченные сообщения от $5/месяц.',
    nav_home: 'Главная',
    nav_employers: 'Для семей',
    nav_login: 'Войти',
    nav_cta: 'Регистрация – бесплатно',
    hero_eyebrow: 'Цены',
    hero_h1: 'Просто и прозрачно',
    hero_sub: 'Поиск бесплатный. Платите, только когда готовы связаться с помощником напрямую. Без посреднических сборов и комиссий.',
    promo_badge: '🎉 100% бесплатно первые 2 месяца — карта не нужна.',
    promo_launch_note: 'Акция при запуске — доступна только пока мы расширяем нашу сеть.',
    tier_free_name: 'Бесплатно',
    tier_free_price: '$0',
    tier_free_per: 'навсегда',
    tier_free_desc: 'Просматривайте весь каталог помощников и знакомьтесь с платформой.',
    tier_free_cta: 'Создать бесплатный аккаунт',
    tier_1m_name: '1 месяц',
    tier_1m_price: '$9',
    tier_1m_per: 'в месяц',
    tier_1m_desc: 'Идеально для разового найма. Полный доступ на 30 дней.',
    tier_1m_cta: 'Купить 1 месяц',
    tier_3m_name: '3 месяца',
    tier_3m_price: '$19',
    tier_3m_per_equiv: '≈ $6.33/мес',
    tier_3m_save: 'Экономия 30%',
    tier_3m_badge: '⭐ Лучшее предложение',
    tier_3m_desc: 'Наш самый популярный план. Хватает времени найти, нанять и адаптироваться.',
    tier_3m_cta: 'Купить 3 месяца',
    tier_3m_timeline_label: 'Почему именно 3 месяца?',
    tier_3m_timeline_body: 'Реалистичный найм занимает 4–6 недель. Вы просматриваете много откликов, переписываетесь с подходящими помощниками, проводите личные собеседования и даёте 1–2 недели пробной работы, прежде чем принять окончательное решение. 3 месяца дают запас времени, чтобы найти подходящего человека без спешки.',
    tier_12m_name: '12 месяцев',
    tier_12m_price: '$49',
    tier_12m_per_equiv: '≈ $4.08/мес',
    tier_12m_save: 'Экономия 55%',
    tier_12m_desc: 'Самая низкая цена за месяц. Для семей, которые нанимают более одного раза в год.',
    tier_12m_cta: 'Купить 12 месяцев',
    thb: '',
    coming_soon: 'Скоро',
    free_feat1: 'Просмотр всех проверенных профилей',
    free_feat2: 'Рейтинги, отзывы и опыт',
    free_feat3: 'Предпросмотр сообщений (только первые 3 слова)',
    free_feat4_lock: 'Прямой контакт заблокирован',
    paid_feat1: 'Всё из Free, плюс:',
    paid_feat2: 'Неограниченная полная переписка',
    paid_feat3: 'WhatsApp, телефон и email разблокированы',
    paid_feat4: 'Избранные помощники',
    paid_feat5: 'Приоритетная поддержка по email',
    faq_title: 'Частые вопросы',
    faq_q1: 'Нужна ли карта для начала?',
    faq_a1: 'Нет. Вы можете зарегистрироваться и просматривать всех помощников бесплатно — карта не нужна. В период запуска новые аккаунты получают первые 2 месяца полного доступа бесплатно. Этот бонус исчезнет, как только мы вырастим нашу сеть — чем раньше вы присоединитесь, тем лучше.',
    faq_q2: 'Можно ли отменить в любое время?',
    faq_a2: 'Да. Каждый план — это разовый платёж за выбранный период. Автопродления нет — если помощник больше не нужен, вы просто не продлеваете.',
    faq_q3: 'Что происходит после окончания плана?',
    faq_a3: 'Ваш аккаунт остаётся бесплатным навсегда. Доступ к профилям и истории переписки сохраняется, но для отправки новых полных сообщений нужно продлить план.',
    faq_q4: 'Почему платят работодатели, а не помощники?',
    faq_a4: 'Помощники традиционно теряли значительную часть зарплаты на сборах за трудоустройство. Мы оставляем ThaiHelper бесплатным для помощников — они получают весь заработок.',
    cta_h2: 'Остались вопросы?',
    cta_p: 'Напишите нам на support@thaihelper.app — обычно отвечаем за несколько часов.',
    cta_btn: 'Регистрация работодателя',
    footer_desc: 'ThaiHelper соединяет семьи и экспатов в Таиланде с надёжным домашним персоналом.',
    footer_product: 'Продукт', footer_find: 'Преимущества', footer_hire: 'Категории', footer_pricing: 'Цены', footer_employers: 'Для семей',
    footer_company: 'Компания', footer_contact: 'Контакты', footer_about: 'О нас', footer_faq: 'FAQ',
    footer_legal: 'Правовая информация', footer_privacy: 'Политика конфиденциальности', footer_terms: 'Условия использования',
    footer_disclaimer: 'ThaiHelper.app управляется Planet Bamboo GmbH (Германия). Мы не являемся кадровым агентством и не занимаемся трудоустройством. Платформа в настоящее время бесплатна. Все транзакции обрабатываются через LemonSqueezy. Соблюдение трудового и иммиграционного законодательства Таиланда является исключительной ответственностью пользователей.',
  },
};

// ─── Shared bits ────────────────────────────────────────────────────────────
const Check = () => (
  <svg className="w-4 h-4 shrink-0 text-primary mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Lock = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function PricingCard({ t, tier, highlight }) {
  const base = 'relative flex flex-col rounded-2xl p-5 md:p-6 border transition-all';
  const normal = 'bg-white border-slate-200 hover:border-slate-300';
  const popular = 'bg-white border-2 border-primary shadow-xl shadow-primary/10 md:-translate-y-2';

  return (
    <div className={`${base} ${highlight ? popular : normal}`}>
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold tracking-wide uppercase whitespace-nowrap shadow-md">
          {tier.badge}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-on-background mb-1.5 font-headline">{tier.name}</h3>
        <p className="text-xs text-on-surface-variant leading-snug min-h-[32px]">{tier.desc}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-extrabold text-on-background font-headline">{tier.price}</span>
          <span className="text-xs font-semibold text-on-surface-variant">{t.thb}</span>
        </div>
        <div className="mt-0.5 text-xs text-on-surface-variant">{tier.per}</div>
        {tier.save && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-gold/15 text-[10px] font-bold text-amber-700 tracking-wide uppercase">
            {tier.save}
          </span>
        )}
      </div>

      {/* Timeline explainer — only rendered if the tier has it (e.g. 3-month plan) */}
      {tier.timelineBody && (
        <div className="mb-4 p-3 rounded-lg bg-gold/10 border border-gold/30">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
              {tier.timelineLabel}
            </span>
          </div>
          <p className="text-[11px] text-amber-900/85 leading-snug">{tier.timelineBody}</p>
        </div>
      )}

      <ul className="space-y-2 mb-5 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-on-background leading-snug">
            {f.locked ? <Lock /> : <Check />}
            <span className={f.locked ? 'text-slate-400' : ''}>{f.label}</span>
          </li>
        ))}
      </ul>

      {tier.disabled ? (
        <span
          className="block text-center px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed"
        >
          {tier.cta}
        </span>
      ) : (
        <Link
          href={tier.href}
          className={
            highlight
              ? 'block text-center px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm hover:shadow-lg transition-all'
              : 'block text-center px-4 py-2.5 rounded-xl bg-surface-container-highest text-on-background font-bold text-sm hover:bg-surface-container-high transition-colors'
          }
        >
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

export default function Pricing() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const freeFeatures = [
    { label: t.free_feat1 },
    { label: t.free_feat2 },
    { label: t.free_feat3 },
    { label: t.free_feat4_lock, locked: true },
  ];
  const paidFeatures = [
    { label: t.paid_feat1 },
    { label: t.paid_feat2 },
    { label: t.paid_feat3 },
    { label: t.paid_feat4 },
    { label: t.paid_feat5 },
  ];

  const tiers = [
    {
      name: t.tier_free_name, price: t.tier_free_price, per: t.tier_free_per,
      desc: t.tier_free_desc, cta: t.tier_free_cta, href: '/employer-register',
      features: freeFeatures,
    },
    {
      name: t.tier_1m_name, price: t.tier_1m_price, per: t.tier_1m_per,
      desc: t.tier_1m_desc, cta: t.coming_soon, href: null, disabled: true,
      features: paidFeatures,
    },
    {
      name: t.tier_3m_name, price: t.tier_3m_price, per: t.tier_3m_per_equiv, save: t.tier_3m_save,
      badge: t.tier_3m_badge,
      desc: t.tier_3m_desc, cta: t.coming_soon, href: null, disabled: true,
      features: paidFeatures,
      timelineLabel: t.tier_3m_timeline_label,
      timelineBody: t.tier_3m_timeline_body,
    },
    {
      name: t.tier_12m_name, price: t.tier_12m_price, per: t.tier_12m_per_equiv, save: t.tier_12m_save,
      desc: t.tier_12m_desc, cta: t.coming_soon, href: null, disabled: true,
      features: paidFeatures,
    },
  ];

  const faqs = [
    { q: t.faq_q1, a: t.faq_a1 },
    { q: t.faq_q2, a: t.faq_a2 },
    { q: t.faq_q3, a: t.faq_a3 },
    { q: t.faq_q4, a: t.faq_a4 },
  ];

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/pricing"
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'For Families', path: '/employers' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />

      <div className="min-h-screen bg-background text-on-background font-sans">
        {/* TEAL TOP BAR */}
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-[60]"></div>

        {/* NAV — mirrors landing page */}
        <nav className="fixed top-1 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-semibold tracking-wide text-[#001b3d] hover:text-[#002d5f] transition-colors" href="/employers">
              {t.nav_employers}
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link className="text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">
              {t.nav_login}
            </Link>
            <LangSwitcher />
            <Link
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs md:text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150"
              href="/employer-register"
            >
              {t.nav_cta}
            </Link>
          </div>
        </nav>

        <main className="pt-20">
          {/* HERO */}
          <section className="px-6 pt-8 pb-6 md:pt-12 md:pb-8">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-3">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>

              {/* Promo banner */}
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 text-xs md:text-sm font-semibold text-amber-800">
                {t.promo_badge}
              </div>
              <p className="mt-2 text-[11px] md:text-xs text-amber-700/80 italic">
                {t.promo_launch_note}
              </p>
            </div>
          </section>

          {/* PRICING GRID */}
          <section className="px-6 pb-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-4 pt-10">
                {tiers.map((tier, i) => (
                  <PricingCard
                    key={tier.name}
                    t={t}
                    tier={tier}
                    highlight={i === 2 /* 3 Months is the highlighted tier */}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-20 bg-surface-container-low">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-center mb-12">
                {t.faq_title}
              </h2>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group bg-white rounded-2xl border border-slate-200 px-6 py-5 hover:border-slate-300 transition-colors"
                  >
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-bold text-on-background">
                      <span>{f.q}</span>
                      <span className="text-primary shrink-0 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="px-6 py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-4">{t.cta_h2}</h2>
              <p className="text-on-surface-variant mb-8">{t.cta_p}</p>
              <Link
                href="/employer-register"
                className="inline-block px-10 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                {t.cta_btn}
              </Link>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-12 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-xs shrink-0">
                <div className="text-xl font-bold text-on-background mb-4 font-headline">Thai<span style={{color:"#006a62"}}>Helper</span></div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
                <div className="flex gap-4">
                  <a aria-label="Email support" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/pricing">{t.footer_pricing}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/employers">{t.footer_employers}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/faq">{t.footer_faq}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/privacy">{t.footer_privacy}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/terms">{t.footer_terms}</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-3">{t.footer_disclaimer}</p>
              <p className="text-slate-500 text-xs">© 2026 ThaiHelper. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
