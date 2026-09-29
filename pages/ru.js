/**
 * /ru — Russian-language landing page for families in Thailand.
 *
 * WHY THIS EXISTS, AND WHY IT IS ONE PAGE AND NOT A LOCALE.
 *
 * Measured 2026-09-29 across every message ever sent: 30 contain Cyrillic,
 * from six different people — four families and, importantly, two helpers
 * answering in Russian. One family in Bang Tao is negotiating a month of
 * private cheffing entirely in Russian. Chinese, by comparison, is zero
 * messages out of 3,941, and German is zero as well: the eight families with
 * German names all write English. So Russian is the only non-Thai language
 * with demonstrated use, and it is the only one that got a page.
 *
 * Translating the interface would mean 1,534 strings across 28 files and a
 * third copy of every new line of text forever. This page is a dozen
 * paragraphs and answers the same question honestly: does Russian traffic
 * convert? If it does, the interface follows. If it does not, nothing was
 * spent.
 *
 * WHAT IT PROMISES. Not "10 helpers speak Russian" — that is a weak number
 * and would age badly. The real product claim is the one thing here that no
 * competitor page offers and that already works in production: a family
 * writes in Russian, and the helper reads it in Thai. The message pipeline
 * does that today (lib/translate.js, ru→th verified in live conversations).
 *
 * WHAT IT MUST NOT CLAIM. Only email addresses are verified — never identity
 * documents, never background checks. Phone verification is optional and
 * raises the outreach ceiling, it is not vetting. And no agency-bashing: the
 * page says what we do, not what anyone else fails to do.
 *
 * Headings are set in Manrope rather than the usual Plus Jakarta Sans, which
 * ships no Cyrillic glyphs at all. See the font block in pages/_app.js.
 */

import Link from 'next/link';
import SEOHead from '@/components/SEOHead';
import { getServiceSupabase } from '@/lib/supabase';

const SITE = 'https://thaihelper.app';

// ─── Live numbers ───────────────────────────────────────────────────────────
// Read at build time and refreshed hourly rather than hard-coded, so the page
// cannot quietly start lying as the platform grows. Every count falls back to
// null on error and the page simply omits that line — a missing number is
// better than a stale one.
export async function getStaticProps() {
  let helpers = null;
  let russianSpeakers = null;

  try {
    const supabase = getServiceSupabase();
    const [all, ru] = await Promise.all([
      supabase
        .from('helper_profiles')
        .select('helper_ref', { count: 'exact', head: true })
        .eq('email_verified', true)
        .or('status.eq.active,status.is.null'),
      supabase
        .from('helper_profiles')
        .select('helper_ref', { count: 'exact', head: true })
        .eq('email_verified', true)
        .or('status.eq.active,status.is.null')
        .ilike('languages', '%russ%'),
    ]);
    helpers = all.count ?? null;
    russianSpeakers = ru.count ?? null;
  } catch (err) {
    console.error('/ru counts failed:', err.message);
  }

  return { props: { helpers, russianSpeakers }, revalidate: 3600 };
}

// Round down to a round number so the headline does not change every day.
function roundedDown(n) {
  if (!n) return null;
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  return `${Math.floor(n / 10) * 10}+`;
}

const STEPS = [
  {
    n: '1',
    h: 'Создайте аккаунт',
    p: 'Укажите город и то, кого вы ищете: няню, домработницу, повара, водителя, садовника, репетитора или сиделку. Занимает пару минут. Бесплатно.',
  },
  {
    n: '2',
    h: 'Пишите по-русски',
    p: 'Откройте профиль помощницы и напишите ей — по-русски. Ваше сообщение придёт ей на тайском, её ответ придёт вам по-русски. Переводить самому не нужно.',
  },
  {
    n: '3',
    h: 'Договаривайтесь напрямую',
    p: 'Условия, график и оплату вы обсуждаете с человеком сами. Мы не участвуем в договорённостях и не берём процент с зарплаты.',
  },
];

const CITIES = [
  { name: 'Пхукет', slug: 'phuket' },
  { name: 'Бангкок', slug: 'bangkok' },
  { name: 'Паттайя', slug: 'pattaya' },
  { name: 'Чиангмай', slug: 'chiang-mai' },
  { name: 'Самуи', slug: 'koh-samui' },
  { name: 'Хуахин', slug: 'hua-hin' },
];

const FAQ = [
  {
    q: 'Нужно ли мне знать тайский или английский?',
    a: 'Нет. Пишите по-русски — сообщение переводится автоматически, в обе стороны. Это работает в переписке на сайте и в приложении.',
  },
  {
    q: 'Сколько это стоит?',
    a: 'Для семей — бесплатно. Регистрация, просмотр анкет и переписка не стоят ничего. Мы не берём комиссию с зарплаты помощницы.',
  },
  {
    q: 'Вы проверяете помощниц?',
    a: 'Мы подтверждаем адрес электронной почты каждой анкеты, а также телефон, если человек его подтвердил — на анкете тогда стоит отметка. Мы не проверяем документы и не делаем проверку биографии. Просите документы и рекомендации сами, как при любом найме.',
  },
  {
    q: 'Кто отвечает за трудовой договор и разрешение на работу?',
    a: 'Вы и помощница договариваетесь напрямую, поэтому это ваша ответственность как работодателя. У нас есть бесплатный образец договора и разбор правил по разрешению на работу — на английском.',
  },
];

export default function RussianLanding({ helpers, russianSpeakers }) {
  const total = roundedDown(helpers);

  return (
    <>
      <SEOHead
        title="Няня, домработница и повар в Таиланде — пишите по-русски | ThaiHelper"
        description="Найдите няню, домработницу, повара или водителя в Таиланде. Пишите по-русски — помощница прочитает на тайском. Бесплатно для семей, без посредников."
        path="/ru"
        lang="en"
        // Both /ru and /th/ru serve the same Russian page; point them at one
        // URL so Google does not treat them as duplicates.
        canonicalOverride={`${SITE}/ru`}
      />

      <div
        style={{
          fontFamily: 'var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif',
          color: '#1a1a1a',
          background: '#fff',
          minHeight: '100vh',
        }}
      >
        {/* ── Nav ─────────────────────────────────────────────── */}
        <nav
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid #eee',
            position: 'sticky', top: 0, background: 'rgba(255,255,255,.94)',
            backdropFilter: 'blur(8px)', zIndex: 50,
          }}
        >
          <Link href="/" style={{ fontSize: '21px', fontWeight: 800, textDecoration: 'none', color: '#1a1a1a' }}>
            Thai<span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '13.5px', color: '#666', textDecoration: 'none' }}>
              English
            </Link>
            <Link
              href="/employer-register"
              style={{
                background: '#006a62', color: '#fff', textDecoration: 'none',
                padding: '9px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
              }}
            >
              Регистрация
            </Link>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────── */}
        <header style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 20px 40px' }}>
          <div style={{
            display: 'inline-block', background: '#e6f5f3', color: '#006a62',
            padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
            fontWeight: 700, letterSpacing: '.04em', marginBottom: '18px',
          }}>
            ДЛЯ СЕМЕЙ В ТАИЛАНДЕ
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 800, lineHeight: 1.12,
            margin: '0 0 18px', letterSpacing: '-.02em', textWrap: 'balance',
          }}>
            {/* The space before <br> is deliberate: without it the heading
                reads as one run-on word to screen readers and to anything
                that extracts text, which is how the homepage ended up
                announcing "Your Next Jobstarts here". */}
            Пишите по-русски.{' '}<br />
            <span style={{ color: '#006a62' }}>Помощница прочитает на тайском.</span>
          </h1>

          <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#444', margin: '0 0 28px', maxWidth: '58ch' }}>
            Няни, домработницы, повара, водители и сиделки по всему Таиланду.
            Вы пишете на своём языке, помощница читает на своём — перевод
            происходит сам. Без агентства и без комиссии с зарплаты.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <Link href="/employer-register" style={{
              background: '#006a62', color: '#fff', textDecoration: 'none',
              padding: '14px 26px', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
            }}>
              Найти помощницу — бесплатно
            </Link>
            <Link href="/helpers" style={{
              background: '#fff', color: '#006a62', textDecoration: 'none',
              padding: '14px 26px', borderRadius: '10px', fontSize: '16px',
              fontWeight: 700, border: '1.5px solid #006a62',
            }}>
              Посмотреть анкеты
            </Link>
          </div>

          {total && (
            <p style={{ fontSize: '14px', color: '#777', margin: 0 }}>
              {total} анкет с подтверждённой почтой
              {russianSpeakers ? `, ${russianSpeakers} из них говорят по-русски` : ''}
            </p>
          )}
        </header>

        {/* ── The translation, shown rather than described ─────── */}
        <section style={{ background: '#f7faf9', borderTop: '1px solid #e8efed', borderBottom: '1px solid #e8efed' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '44px 20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.01em' }}>
              Как выглядит переписка
            </h2>
            <p style={{ fontSize: '15.5px', color: '#555', margin: '0 0 24px', maxWidth: '54ch' }}>
              Вы пишете слева. Она видит справа. Никаких переводчиков и словарей.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8e6', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#888', letterSpacing: '.08em', marginBottom: '10px' }}>
                  ВЫ ПИШЕТЕ
                </div>
                <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.55 }}>
                  Здравствуйте! Ищем няню на полный день в Банг Тао. Двое детей,
                  4 и 7 лет. Начать можно с понедельника.
                </p>
              </div>
              <div style={{ background: '#fff', border: '1px solid #cfe6e2', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#006a62', letterSpacing: '.08em', marginBottom: '10px' }}>
                  ОНА ЧИТАЕТ
                </div>
                <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.55, fontFamily: 'var(--font-thai), sans-serif' }}>
                  สวัสดีค่ะ! เรากำลังมองหาพี่เลี้ยงเด็กแบบเต็มเวลาที่บางเทา
                  มีลูกสองคน อายุ 4 และ 7 ขวบ เริ่มงานได้ตั้งแต่วันจันทร์
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Steps ───────────────────────────────────────────── */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px 8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 26px', letterSpacing: '-.01em' }}>
            Три шага
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '18px' }}>
            {STEPS.map((s) => (
              <li key={s.n} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                  background: '#006a62', color: '#fff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px',
                }}>
                  {s.n}
                </span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '4px 0 5px' }}>{s.h}</h3>
                  <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.6, color: '#555', maxWidth: '56ch' }}>{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Cities ──────────────────────────────────────────── */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '44px 20px 0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.01em' }}>
            Города
          </h2>
          <p style={{ fontSize: '15.5px', color: '#555', margin: '0 0 18px' }}>
            Страницы городов на английском — анкеты те же.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/hire/${c.slug}`}
                style={{
                  border: '1.5px solid #e2e8e6', borderRadius: '999px',
                  padding: '8px 16px', fontSize: '14.5px', fontWeight: 600,
                  color: '#1a1a1a', textDecoration: 'none', background: '#fff',
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px 0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 22px', letterSpacing: '-.01em' }}>
            Частые вопросы
          </h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: '0 0 6px' }}>{f.q}</h3>
                <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.6, color: '#555', maxWidth: '58ch' }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px 64px' }}>
          <div style={{
            background: '#006a62', borderRadius: '16px', padding: '34px 28px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '25px', fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-.01em' }}>
              Начните на русском
            </h2>
            <p style={{ color: '#cfe8e4', fontSize: '16px', margin: '0 0 22px', lineHeight: 1.55 }}>
              Регистрация занимает пару минут и ничего не стоит.
            </p>
            <Link href="/employer-register" style={{
              display: 'inline-block', background: '#fff', color: '#006a62',
              textDecoration: 'none', padding: '14px 30px', borderRadius: '10px',
              fontSize: '16px', fontWeight: 700,
            }}>
              Создать аккаунт
            </Link>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid #eee', padding: '26px 20px 40px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', fontSize: '13.5px', color: '#777', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 10px' }}>
              ThaiHelper — площадка для прямого контакта между семьями и
              помощниками по дому в Таиланде. Мы не агентство по трудоустройству
              и не занимаемся подбором персонала: вы общаетесь и договариваетесь
              напрямую.
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/" style={{ color: '#006a62' }}>Главная</Link>
              {' · '}
              <Link href="/helpers" style={{ color: '#006a62' }}>Анкеты</Link>
              {' · '}
              <Link href="/privacy" style={{ color: '#006a62' }}>Конфиденциальность</Link>
              {' · '}
              <Link href="/terms" style={{ color: '#006a62' }}>Условия</Link>
              {' · '}
              <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>support@thaihelper.app</a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
