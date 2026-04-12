import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

const T = {
  en: {
    page_title: 'About Us – ThaiHelper',
    meta_desc: 'The story behind ThaiHelper. We are a family of four who moved to Thailand and built the platform we wished existed when we were searching for a nanny, gardener and tutors.',
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_login: 'Login',
    nav_cta: 'Register – Free',

    hero_eyebrow: 'About Us',
    hero_h1: 'Built by a family, for families.',
    hero_sub: 'ThaiHelper started with our own struggle to find trusted help in Thailand. We built the platform we wished had existed.',

    story_title: 'Our story',
    story_p1: 'In December 2024 our family of four packed up our life and moved to Thailand. New country, new language, new everything — and like most expat families with kids, one of the first things we needed was a nanny.',
    story_p2: 'We searched for weeks. Facebook groups felt chaotic — endless posts, dozens of replies, no way to tell who was serious. Half the messages disappeared into the "message requests" folder we never thought to check. We sent enquiries to several agencies, waited days for an answer, and at the end of it all still had no one in our region.',
    story_p3: 'When applications did come in, they often had no real information — no background, no photo, no idea whether the person had ever cared for children. We had no way to do a proper background check, no transparent pricing, and no idea where the agency fees actually went. It rarely felt like the helpers themselves were getting that money.',
    story_p4: 'It wasn\'t just a nanny. We were also looking for a gardener for our pool and garden, and tutors for our kids. Every single search was the same chaos all over again. We kept thinking: in other countries we\'ve lived in, there were proper platforms for exactly this. Why not here?',
    story_p5: 'So we built one.',

    values_title: 'What we wanted to fix',
    val1_h: 'Direct contact',
    val1_p: 'No middleman standing between you and the person you might welcome into your home. You message helpers directly, ask the questions that matter to you, and decide for yourselves.',
    val2_h: 'Transparent, one-time pricing',
    val2_p: 'Employers pay one simple fee for full access during the period they choose. No hidden charges, no auto-renewing subscriptions, no surprise commissions skimmed off helpers\' wages.',
    val3_h: 'Free for helpers, always',
    val3_p: 'Helpers never pay to list their profile or to receive messages. Every baht they earn from a job stays with them. We refuse to build a platform on the backs of the people doing the work.',
    val4_h: 'Real profiles, real information',
    val4_p: 'Photos, experience, languages, references, certifications — the things you actually need to make a decision. No more guessing from a one-line Facebook comment.',

    family_title: 'Why this matters to us',
    family_p1: 'We are not a faceless company. We are a family living in Thailand who got frustrated enough to build a solution — first for ourselves, then for everyone else in the same situation.',
    family_p2: 'Every feature on ThaiHelper exists because we needed it ourselves. The category filters, the messaging tool, the verification, the simple pricing — all of it comes from real searches we ran for our own kids, our own home, our own garden.',
    family_p3: 'We hope ThaiHelper saves you the weeks of waiting and uncertainty we went through. And we hope it gives the wonderful helpers across Thailand a fairer way to find good families to work with.',

    cta_h2: 'Ready to get started?',
    cta_p: 'Whether you\'re looking for help or looking for work — welcome. We\'re glad you\'re here.',
    cta_btn_emp: 'I\'m hiring',
    cta_btn_helper: 'I\'m a helper',

    // Footer
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper is a platform only. We do not employ anyone, arrange visas or verify work permits. Users are responsible for their own legal and employment arrangements.',
  },

  th: {
    page_title: 'เกี่ยวกับเรา – ThaiHelper',
    meta_desc: 'เรื่องราวเบื้องหลัง ThaiHelper เราคือครอบครัวสี่คนที่ย้ายมาประเทศไทยและสร้างแพลตฟอร์มที่เราหวังว่าจะมีตอนที่เรากำลังหาพี่เลี้ยง คนสวน และครูสอนพิเศษ',
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',

    hero_eyebrow: 'เกี่ยวกับเรา',
    hero_h1: 'สร้างโดยครอบครัว เพื่อครอบครัว',
    hero_sub: 'ThaiHelper เริ่มต้นจากความยากลำบากของเราเองในการหาผู้ช่วยที่ไว้ใจได้ในประเทศไทย เราจึงสร้างแพลตฟอร์มที่เราอยากให้มีตั้งแต่แรก',

    story_title: 'เรื่องราวของเรา',
    story_p1: 'ในเดือนธันวาคม 2024 ครอบครัวสี่คนของเราย้ายมาอยู่ประเทศไทย ประเทศใหม่ ภาษาใหม่ ทุกอย่างใหม่ และเหมือนครอบครัวต่างชาติที่มีลูกส่วนใหญ่ สิ่งแรกๆ ที่เราต้องการคือพี่เลี้ยงเด็ก',
    story_p2: 'เราหาอยู่หลายสัปดาห์ กลุ่ม Facebook นั้นวุ่นวายมาก โพสต์ไม่จบสิ้น คำตอบนับสิบ และไม่มีวิธีบอกได้ว่าใครจริงจัง ข้อความครึ่งหนึ่งหายไปในโฟลเดอร์ "คำขอข้อความ" ที่เราไม่เคยคิดจะเปิดดู เราติดต่อเอเจนซี่หลายแห่ง รอหลายวันกว่าจะได้คำตอบ และสุดท้ายก็ยังไม่มีใครในพื้นที่ของเรา',
    story_p3: 'เมื่อมีใบสมัครเข้ามา ก็มักจะไม่มีข้อมูลจริง ไม่มีประวัติ ไม่มีรูปถ่าย ไม่รู้เลยว่าคนคนนั้นเคยดูแลเด็กมาก่อนหรือไม่ เราไม่มีทางตรวจสอบประวัติอย่างเหมาะสม ไม่มีราคาที่โปร่งใส และไม่รู้ว่าค่าธรรมเนียมเอเจนซี่ไปอยู่ที่ไหน ดูเหมือนเงินนั้นจะไม่ถึงมือผู้ช่วยจริงๆ',
    story_p4: 'ไม่ใช่แค่พี่เลี้ยง เรายังต้องการคนสวนสำหรับสระน้ำและสวน และครูสอนพิเศษให้ลูกๆ ทุกการค้นหาคือความวุ่นวายเดิมๆ ซ้ำแล้วซ้ำเล่า เราคิดอยู่ตลอดว่า ในประเทศอื่นๆ ที่เราเคยอยู่ มีแพลตฟอร์มที่เหมาะสมสำหรับเรื่องนี้โดยเฉพาะ ทำไมที่นี่ไม่มี?',
    story_p5: 'เราเลยสร้างมันขึ้นมาเอง',

    values_title: 'สิ่งที่เราต้องการแก้ไข',
    val1_h: 'ติดต่อโดยตรง',
    val1_p: 'ไม่มีคนกลางระหว่างคุณกับคนที่คุณอาจรับเข้ามาในบ้าน คุณส่งข้อความหาผู้ช่วยโดยตรง ถามคำถามที่สำคัญสำหรับคุณ และตัดสินใจด้วยตัวเอง',
    val2_h: 'ราคาโปร่งใส จ่ายครั้งเดียว',
    val2_p: 'นายจ้างจ่ายค่าธรรมเนียมเดียวง่ายๆ สำหรับการเข้าถึงเต็มรูปแบบในช่วงเวลาที่เลือก ไม่มีค่าใช้จ่ายแอบแฝง ไม่มีการต่ออายุอัตโนมัติ ไม่มีค่าคอมมิชชั่นที่หักจากค่าจ้างผู้ช่วย',
    val3_h: 'ฟรีสำหรับผู้ช่วยตลอดไป',
    val3_p: 'ผู้ช่วยไม่ต้องจ่ายเงินเพื่อลงโปรไฟล์หรือรับข้อความ ทุกบาทที่พวกเขาได้รับจากการทำงานเป็นของพวกเขา เราจะไม่สร้างแพลตฟอร์มบนหลังของคนที่ทำงานจริง',
    val4_h: 'โปรไฟล์จริง ข้อมูลจริง',
    val4_p: 'รูปภาพ ประสบการณ์ ภาษา ใบอ้างอิง ใบรับรอง สิ่งที่คุณต้องการเพื่อตัดสินใจ ไม่ต้องเดาจากความคิดเห็นบรรทัดเดียวบน Facebook อีกต่อไป',

    family_title: 'ทำไมสิ่งนี้สำคัญกับเรา',
    family_p1: 'เราไม่ใช่บริษัทไร้ตัวตน เราคือครอบครัวที่อาศัยอยู่ในประเทศไทยที่หงุดหงิดมากพอจนต้องสร้างทางออก ก่อนอื่นเพื่อตัวเรา จากนั้นเพื่อทุกคนที่อยู่ในสถานการณ์เดียวกัน',
    family_p2: 'ทุกฟีเจอร์บน ThaiHelper มีอยู่เพราะเราต้องการมันเอง ตัวกรองหมวดหมู่ เครื่องมือส่งข้อความ การยืนยันตัวตน ราคาที่เรียบง่าย ทั้งหมดมาจากการค้นหาจริงๆ ที่เราทำเพื่อลูกๆ ของเรา บ้านของเรา สวนของเรา',
    family_p3: 'เราหวังว่า ThaiHelper จะช่วยให้คุณประหยัดเวลาหลายสัปดาห์ของการรอคอยและความไม่แน่นอนที่เราเคยเจอ และเราหวังว่ามันจะให้ผู้ช่วยที่ยอดเยี่ยมทั่วประเทศไทยมีวิธีที่เป็นธรรมในการหาครอบครัวที่ดีให้ทำงานด้วย',

    cta_h2: 'พร้อมเริ่มต้นแล้วหรือยัง?',
    cta_p: 'ไม่ว่าคุณจะมองหาความช่วยเหลือหรือมองหางาน ยินดีต้อนรับ เรายินดีที่คุณมาที่นี่',
    cta_btn_emp: 'ฉันต้องการจ้าง',
    cta_btn_helper: 'ฉันเป็นผู้ช่วย',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
    footer_disclaimer: 'ThaiHelper เป็นแพลตฟอร์มเท่านั้น เราไม่ได้จ้างงานใคร ไม่จัดการวีซ่า หรือตรวจสอบใบอนุญาตทำงาน ผู้ใช้มีหน้าที่รับผิดชอบเรื่องกฎหมายและการจ้างงานของตนเอง',
  },

  ru: {
    page_title: 'О нас – ThaiHelper',
    meta_desc: 'История ThaiHelper. Мы — семья из четырёх человек, переехавшая в Таиланд. Мы создали платформу, которой нам не хватало, когда мы искали няню, садовника и преподавателей для детей.',
    nav_employers: 'Для семей',
    nav_helpers: 'Для помощников',
    nav_login: 'Войти',
    nav_cta: 'Регистрация – бесплатно',

    hero_eyebrow: 'О нас',
    hero_h1: 'Создано семьёй для семей.',
    hero_sub: 'ThaiHelper родился из нашей собственной борьбы в поисках надёжных помощников в Таиланде. Мы построили платформу, которой нам так не хватало.',

    story_title: 'Наша история',
    story_p1: 'В декабре 2024 года наша семья из четырёх человек собрала вещи и переехала в Таиланд. Новая страна, новый язык, всё новое — и, как большинство семей экспатов с детьми, одной из первых вещей, которые нам понадобились, была няня.',
    story_p2: 'Мы искали неделями. Группы в Facebook ощущались как хаос — бесконечные посты, десятки откликов, никакого способа понять, кто настроен серьёзно. Половина сообщений уходила в папку «запросы сообщений», которую мы даже не думали проверять. Мы писали в несколько агентств, ждали ответа днями — и в итоге так и не нашли никого в нашем районе.',
    story_p3: 'Когда отклики всё же приходили, в них почти не было реальной информации — никакой биографии, ни фото, никакого понимания, работал ли человек когда-либо с детьми. Не было способа провести нормальную проверку, не было прозрачных цен, и было непонятно, куда вообще уходят комиссии агентств. И уж точно казалось, что до самих помощников эти деньги почти не доходят.',
    story_p4: 'И речь была не только о няне. Мы также искали садовника для нашего бассейна и сада, и преподавателей для детей. Каждый поиск превращался в тот же самый хаос. Мы постоянно думали: в других странах, где мы жили, существовали нормальные платформы именно для этого. Почему здесь нет?',
    story_p5: 'И мы её сделали.',

    values_title: 'Что мы хотели исправить',
    val1_h: 'Прямой контакт',
    val1_p: 'Никаких посредников между вами и человеком, которого вы, возможно, впустите к себе домой. Вы пишете помощникам напрямую, задаёте важные именно для вас вопросы и решаете сами.',
    val2_h: 'Прозрачная цена, один платёж',
    val2_p: 'Работодатели платят один простой взнос за полный доступ на выбранный период. Никаких скрытых платежей, никаких автопродлений, никаких «незаметных» комиссий, удерживаемых с зарплаты помощников.',
    val3_h: 'Бесплатно для помощников, всегда',
    val3_p: 'Помощники никогда не платят за создание профиля или получение сообщений. Каждый бат, который они зарабатывают на работе, остаётся у них. Мы отказываемся строить платформу на спинах тех, кто делает работу.',
    val4_h: 'Реальные профили, реальная информация',
    val4_p: 'Фото, опыт, языки, рекомендации, сертификаты — всё, что вам действительно нужно для решения. Больше никаких догадок по одной строке в комментарии Facebook.',

    family_title: 'Почему это важно для нас',
    family_p1: 'Мы не безликая компания. Мы — семья, живущая в Таиланде, которой надоело настолько, что мы решили построить решение сначала для себя, а потом для всех, кто в той же ситуации.',
    family_p2: 'Каждая функция в ThaiHelper существует потому, что она была нужна нам самим. Фильтры по категориям, мессенджер, верификация, простые цены — всё это родилось из реальных поисков для наших собственных детей, нашего дома, нашего сада.',
    family_p3: 'Мы надеемся, что ThaiHelper избавит вас от тех недель ожидания и неопределённости, через которые прошли мы. И что замечательным помощникам по всему Таиланду он даст более честный способ находить хорошие семьи для работы.',

    cta_h2: 'Готовы начать?',
    cta_p: 'Ищете ли вы помощь или работу — добро пожаловать. Мы рады, что вы здесь.',
    cta_btn_emp: 'Я нанимаю',
    cta_btn_helper: 'Я помощник',

    footer_desc: 'ThaiHelper соединяет семьи и экспатов в Таиланде с надёжным домашним персоналом.',
    footer_product: 'Продукт', footer_find: 'Преимущества', footer_hire: 'Категории', footer_pricing: 'Цены', footer_employers: 'Для семей',
    footer_company: 'Компания', footer_contact: 'Контакты', footer_about: 'О нас', footer_faq: 'Вопросы',
    footer_legal: 'Правовое', footer_privacy: 'Политика конфиденциальности', footer_terms: 'Условия использования',
  },
};

export default function About() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/about"
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      <div className="min-h-screen bg-background text-on-background font-sans">
        {/* UTILITY TOP BAR — audience switch */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center gap-5 md:gap-7 text-xs md:text-sm">
            <Link href="/employers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_employers} →
            </Link>
            <Link href="/helpers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_helpers} →
            </Link>
          </div>
        </div>

        {/* NAV — mirrors landing page */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
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

        <main className="pt-24 md:pt-28">
          {/* HERO */}
          <section className="px-6 pt-10 pb-8 md:pt-16 md:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-4 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>
            </div>
          </section>

          {/* STORY */}
          <section className="px-6 pb-16">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-on-background mb-6">
                  {t.story_title}
                </h2>
                <div className="space-y-5 text-base md:text-lg text-on-surface-variant leading-relaxed">
                  <p>{t.story_p1}</p>
                  <p>{t.story_p2}</p>
                  <p>{t.story_p3}</p>
                  <p>{t.story_p4}</p>
                  <p className="text-xl md:text-2xl font-bold text-primary pt-2">{t.story_p5}</p>
                </div>
              </div>
            </div>
          </section>

          {/* VALUES */}
          <section className="px-6 py-16 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-center mb-12">
                {t.values_title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { h: t.val1_h, p: t.val1_p },
                  { h: t.val2_h, p: t.val2_p },
                  { h: t.val3_h, p: t.val3_p },
                  { h: t.val4_h, p: t.val4_p },
                ].map((v, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 hover:border-primary/30 hover:shadow-md transition-all">
                    <h3 className="text-lg md:text-xl font-bold font-headline text-on-background mb-2">{v.h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{v.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WHY IT MATTERS */}
          <section className="px-6 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-8">
                {t.family_title}
              </h2>
              <div className="space-y-5 text-base md:text-lg text-on-surface-variant leading-relaxed text-left">
                <p>{t.family_p1}</p>
                <p>{t.family_p2}</p>
                <p>{t.family_p3}</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-container/10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-4">{t.cta_h2}</h2>
              <p className="text-on-surface-variant mb-8">{t.cta_p}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/employer-register"
                  className="inline-block px-8 py-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {t.cta_btn_emp}
                </Link>
                <Link
                  href="/register"
                  className="inline-block px-8 py-3.5 rounded-2xl bg-white border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 transition-colors"
                >
                  {t.cta_btn_helper}
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER — mirrors landing page */}
        <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-start gap-8 bg-slate-50 border-t border-slate-100">
          <div className="max-w-xs">
            <div className="text-xl font-bold text-on-background mb-4 font-headline">
              Thai<span style={{ color: '#006a62' }}>Helper</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_product}</h4>
              <ul className="space-y-3">
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/#benefits">{t.footer_find}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/#categories">{t.footer_hire}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/pricing">{t.footer_pricing}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/employers">{t.footer_employers}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_company}</h4>
              <ul className="space-y-3">
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/about">{t.footer_about}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/faq">{t.footer_faq}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_legal}</h4>
              <ul className="space-y-3">
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/privacy">{t.footer_privacy}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/terms">{t.footer_terms}</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full mt-8 border-t pt-8">
            <p className="text-slate-400 text-xs leading-relaxed mb-3">{t.footer_disclaimer}</p>
            <p className="text-slate-500 text-xs">© 2026 ThaiHelper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
