import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLang } from './_app';

const T = {
  en: {
    success_title: 'Email Verified',
    success_heading: 'Your email is verified!',
    success_text_helper: 'Your profile is now visible to families. Log in to manage your profile.',
    success_text_employer: 'Your account is now fully activated. Log in to browse helpers.',
    expired_title: 'Link Expired',
    expired_heading: 'This link has expired',
    expired_text: 'This verification link has already been used or is no longer valid. If you already verified your email, you can log in normally.',
    invalid_title: 'Invalid Link',
    invalid_heading: 'Invalid verification link',
    invalid_text: 'This link is not valid. Please check the link in your email and try again.',
    cta_login: 'Log In',
    cta_home: 'Back to Home',
  },
  th: {
    success_title: '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E41\u0E25\u0E49\u0E27',
    success_heading: '\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27!',
    success_text_helper: '\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E25\u0E49\u0E27 \u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C',
    success_text_employer: '\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27 \u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E1C\u0E39\u0E49\u0E0A\u0E48\u0E27\u0E22',
    expired_title: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38',
    expired_heading: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E19\u0E35\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E41\u0E25\u0E49\u0E27',
    expired_text: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E15\u0E48\u0E2D\u0E44\u0E1B',
    invalid_title: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07',
    invalid_heading: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07',
    invalid_text: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E43\u0E19\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07',
    cta_login: '\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A',
    cta_home: '\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01',
  },
};

export default function VerifyPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const { status, role } = router.query;

  const isSuccess = status === 'success';
  const isExpired = status === 'expired';

  const title = isSuccess ? t.success_title : isExpired ? t.expired_title : t.invalid_title;
  const heading = isSuccess ? t.success_heading : isExpired ? t.expired_heading : t.invalid_heading;
  const text = isSuccess
    ? (role === 'employer' ? t.success_text_employer : t.success_text_helper)
    : isExpired ? t.expired_text : t.invalid_text;

  return (
    <>
      <Head>
        <title>{title} – ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-background text-on-background font-sans flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-3xl mb-4">{isSuccess ? '\u2705' : '\u26A0\uFE0F'}</p>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-background mb-3">
            {heading}
          </h1>
          <p className="text-on-surface-variant mb-10">{text}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform text-center"
            >
              {t.cta_login}
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-surface-container-highest text-secondary font-bold text-sm hover:bg-surface-container-high transition-colors text-center"
            >
              {t.cta_home}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
