// Landing page for the "Yes, I'm still looking for work" button in the
// reactivation letter (lib/emails/reactivate-or-remove.js → /api/still-looking).
//
// Bilingual on the page rather than switched by LangContext, for the same
// reason the letter carries both halves: the reader arrives from an email,
// not from a browse session, and we have no idea which language her phone is
// set to. Thai first — 345 of the 465 recipients are Thai nationals.
//
// Nothing here asks her to log in. The whole point of the button was that
// one press is all we need; the sign-in details are offered underneath for
// the helper who wants to go further and edit her profile, not as a wall.

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BrandWordmark from '@/components/BrandWordmark';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=app.thaihelper.mobile';
const IOS_URL = 'https://apps.apple.com/app/thaihelper-app/id6801794164';

const COPY = {
  ok: {
    icon: '✓',
    th: {
      title: 'เรียบร้อยค่ะ — โปรไฟล์ของคุณกลับมาแล้ว',
      body: 'ครอบครัวที่กำลังหาผู้ช่วยจะเห็นโปรไฟล์ของคุณอีกครั้งตั้งแต่ตอนนี้ คุณไม่ต้องทำอะไรเพิ่มแล้ว',
    },
    en: {
      title: "Done — you're back in the list",
      body: 'Families looking for help can see your profile again from now on. You do not need to do anything else.',
    },
  },
  invalid: {
    icon: '!',
    th: {
      title: 'ลิงก์นี้ใช้ไม่ได้',
      body: 'ลิงก์อาจหมดอายุหรือไม่สมบูรณ์ กรุณาเข้าสู่ระบบตามปกติ แล้วโปรไฟล์ของคุณจะกลับมาแสดงทันที',
    },
    en: {
      title: 'This link did not work',
      body: 'It may have expired or been cut short. Signing in normally does exactly the same thing — your profile comes back straight away.',
    },
  },
  gone: {
    icon: '!',
    th: {
      title: 'ไม่พบบัญชีนี้',
      body: 'บัญชีนี้ไม่มีอยู่แล้ว หากคุณยังต้องการหางาน สามารถสมัครใหม่ได้ใช้เวลาไม่นานค่ะ',
    },
    en: {
      title: 'We could not find this account',
      body: 'It no longer exists. If you are still looking for work, signing up again only takes a few minutes.',
    },
  },
  unavailable: {
    icon: '!',
    th: {
      title: 'บัญชีนี้ใช้งานไม่ได้',
      body: 'กรุณาติดต่อเราที่ support@thaihelper.app แล้วเราจะช่วยตรวจสอบให้ค่ะ',
    },
    en: {
      title: 'This account is not available',
      body: 'Please write to support@thaihelper.app and we will look into it.',
    },
  },
  error: {
    icon: '!',
    th: {
      title: 'มีบางอย่างผิดพลาด',
      body: 'กรุณาลองอีกครั้ง หรือเข้าสู่ระบบตามปกติ ซึ่งให้ผลเหมือนกันค่ะ',
    },
    en: {
      title: 'Something went wrong',
      body: 'Please try again, or just sign in normally — it has the same effect.',
    },
  },
};

export default function StillLooking() {
  const router = useRouter();
  const status = COPY[router.query.status] ? router.query.status : 'ok';
  const c = COPY[status];
  const good = status === 'ok';

  return (
    <>
      <Head>
        <title>Still looking · ThaiHelper</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-5 py-10">
        <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg p-7 sm:p-10">

          {/* BrandWordmark renders its own <Link href="/">. Wrapping it in
              another one nests <a> inside <a>, which React reports as a
              hydration mismatch. */}
          <div className="mb-6 text-center">
            <BrandWordmark />
          </div>

          <div
            className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
              good ? 'bg-[#e6f2f0] text-[#006a62]' : 'bg-[#fdf4e7] text-[#b86b1d]'
            }`}
            aria-hidden="true"
          >
            {c.icon}
          </div>

          <h1 className="text-xl font-bold text-center text-[#1B3A4B] mb-2 leading-snug">
            {c.th.title}
          </h1>
          <p className="text-center text-[15px] text-gray-600 leading-loose mb-5">
            {c.th.body}
          </p>

          <hr className="border-gray-200 my-5" />

          <h2 className="text-lg font-bold text-center text-[#1B3A4B] mb-2 leading-snug">
            {c.en.title}
          </h2>
          <p className="text-center text-[15px] text-gray-600 leading-relaxed">
            {c.en.body}
          </p>

          {good && (
            <>
              <div className="mt-7 rounded-xl bg-[#f0f7f6] border-l-4 border-[#006a62] p-4">
                <p className="text-[14px] text-gray-700 leading-loose mb-1">
                  อยากแก้ไขโปรไฟล์หรือดูข้อความของคุณไหมคะ เข้าสู่ระบบด้วยอีเมลและรหัสประจำตัวที่อยู่ในอีเมลฉบับนั้นได้เลย
                </p>
                <p className="text-[14px] text-gray-700 leading-relaxed">
                  Want to edit your profile or read your messages? Sign in with your
                  email and the number from that letter.
                </p>
              </div>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-[#006a62] px-6 py-3 font-semibold text-white no-underline hover:opacity-90"
                >
                  เข้าสู่ระบบ · Sign in
                </Link>
              </div>

              <p className="mt-7 text-center text-[13px] text-gray-500 leading-loose">
                รับข้อความจากครอบครัวได้เร็วขึ้นด้วยแอป · Get messages faster with the app
              </p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <a
                  href={IOS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-medium text-[#006a62] no-underline hover:underline"
                >
                  iPhone
                </a>
                <span className="text-gray-300" aria-hidden="true">·</span>
                <a
                  href={PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-medium text-[#006a62] no-underline hover:underline"
                >
                  Android
                </a>
              </div>
            </>
          )}

          {!good && (
            <div className="mt-7 text-center">
              <Link
                href={status === 'gone' ? '/register' : '/login'}
                className="inline-block rounded-lg bg-[#006a62] px-6 py-3 font-semibold text-white no-underline hover:opacity-90"
              >
                {status === 'gone' ? 'สมัครใหม่ · Sign up' : 'เข้าสู่ระบบ · Sign in'}
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
