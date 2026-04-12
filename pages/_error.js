import Link from 'next/link';
import Head from 'next/head';

const T = {
  en: {
    title500:    'Something went wrong',
    title404:    'Page not found',
    titleOther:  'An error occurred',
    sub500:      'We hit an unexpected snag on our end. Please try again in a moment — our team has been notified.',
    sub404:      "The page you are looking for doesn't exist or has been moved.",
    subOther:    'Something unexpected happened. Please try again.',
    btn_helpers: 'For Helpers',
    btn_emp:     'For Families',
    btn_back:    'Back to Home',
  },
  th: {
    title500:    'เกิดข้อผิดพลาด',
    title404:    'ไม่พบหน้านี้',
    titleOther:  'เกิดข้อผิดพลาด',
    sub500:      'ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองอีกครั้ง — ทีมงานของเราได้รับแจ้งแล้ว',
    sub404:      'หน้าที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายแล้ว',
    subOther:    'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง',
    btn_helpers: 'สำหรับผู้ช่วย',
    btn_emp:     'สำหรับนายจ้าง',
    btn_back:    'กลับหน้าแรก',
  },
  ru: {
    title500:    'Что-то пошло не так',
    title404:    'Страница не найдена',
    titleOther:  'Произошла ошибка',
    sub500:      'У нас возникла непредвиденная проблема. Пожалуйста, попробуйте снова через минуту — наша команда уже уведомлена.',
    sub404:      'Страница, которую вы ищете, не существует или была перемещена.',
    subOther:    'Произошло что-то непредвиденное. Пожалуйста, попробуйте снова.',
    btn_helpers: 'Для помощников',
    btn_emp:     'Для работодателей',
    btn_back:    'На главную',
  },
};

function getLang() {
  if (typeof window === 'undefined') return 'en';
  try {
    return localStorage.getItem('th_lang') || 'en';
  } catch {
    return 'en';
  }
}

function Error({ statusCode }) {
  const lang = getLang();
  const t = T[lang] || T.en;

  const isNotFound = statusCode === 404;
  const isServer = statusCode && statusCode >= 500;

  const title = isNotFound ? t.title404 : isServer ? t.title500 : t.titleOther;
  const sub = isNotFound ? t.sub404 : isServer ? t.sub500 : t.subOther;
  const code = statusCode || 'Error';

  return (
    <>
      <Head>
        <title>{title} – ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
        padding: '2rem',
        textAlign: 'center',
        background: '#f8faf9',
      }}>
        <div style={{
          fontSize: '5rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
          color: '#006a62',
          lineHeight: 1,
        }}>
          {code}
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#001b3d', fontWeight: 700 }}>
          {title}
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '460px', lineHeight: 1.6 }}>
          {sub}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            background: '#006a62',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}>
            {t.btn_helpers}
          </Link>
          <Link href="/employers" style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            background: '#001b3d',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}>
            {t.btn_emp}
          </Link>
        </div>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
