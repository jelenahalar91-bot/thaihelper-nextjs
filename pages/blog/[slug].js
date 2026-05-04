import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import SEOHead, { getBlogPostingSchema, getBreadcrumbSchema, getSpeakableSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import BlogCard from '@/components/BlogCard';
import SalaryCalculator from '@/components/SalaryCalculator';
import { blogPosts, getPostBySlug, getAllSlugs } from '@/content/blog/posts';
import { useLang } from '../_app';

export async function getStaticPaths() {
  return {
    paths: getAllSlugs().map((slug) => ({ params: { slug } })),
    // 'blocking' lets us redirect unknown slugs in getStaticProps instead of
    // returning a hard 404. Fixes GSC reporting /blog/[slug] (the literal
    // Next.js route template, picked up by AI crawlers from __NEXT_DATA__)
    // and also catches any typo'd blog URLs.
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return {
      redirect: { destination: '/blog', permanent: true },
    };
  }
  return { props: { post } };
}

export default function BlogPost({ post }) {
  const { lang } = useLang();

  const related = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        lang={lang}
        jsonLd={[
          getBlogPostingSchema(post),
          getBreadcrumbSchema(breadcrumbs),
          getSpeakableSchema(`/blog/${post.slug}`, ['h1', 'h2', '.prose p:first-of-type']),
        ]}
      />

      <div className="min-h-screen bg-white font-body">
        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link className="text-xs md:text-sm font-semibold text-primary hover:text-primary-container transition-colors" href="/blog">
              Blog
            </Link>
            <Link className="hidden sm:inline text-xs md:text-sm font-semibold text-primary hover:text-primary-container transition-colors" href="/">
              For Helpers
            </Link>
            <Link className="text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">
              Login
            </Link>
            <LangSwitcher />
            <Link className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs md:text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150" href="/register">
              Register Free
            </Link>
          </div>
        </nav>

        {/* ── HERO IMAGE ── */}
        <div className="pt-16 relative">
          <div className="w-full h-64 sm:h-80 md:h-96 relative overflow-hidden">
            <Image
              src={post.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        </div>

        {/* ── ARTICLE ── */}
        <article className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
          {/* Article Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-10 mb-8">
            {/* Breadcrumbs */}
            <nav className="flex text-xs text-gray-400 gap-1 mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
            </nav>

            {/* Category Badge */}
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${
              post.category === 'helpers'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {post.category === 'helpers'
                ? (lang === 'th' ? 'สำหรับผู้ช่วย' : 'For Helpers')
                : (lang === 'th' ? 'สำหรับครอบครัว' : 'For Families')}
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight font-headline mb-5">
              {(lang === 'th' && post.title_th) || post.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author || 'ThaiHelper Team'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime} {lang === 'th' ? 'นาที' : 'min read'}
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div
            className="prose prose-lg max-w-none px-2 sm:px-4
              prose-headings:font-bold prose-headings:font-headline prose-headings:text-gray-900
              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-li:text-gray-600 prose-li:leading-relaxed
              prose-strong:text-gray-800
              prose-table:text-sm prose-th:bg-gray-50 prose-th:p-3 prose-td:p-3
              prose-table:border prose-th:border prose-td:border prose-table:border-gray-200
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: (lang === 'th' && post.content_th) || post.content }}
          />

          {/* Salary Calculator (only on calculator post) */}
          {post.slug === 'thailand-helper-salary-calculator' && (
            <div className="px-2 sm:px-4">
              <SalaryCalculator />
            </div>
          )}

          {/* ── CTA BOX ── */}
          <div className="mt-14 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 text-center">
            {post.category === 'helpers' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-headline">
                  {lang === 'th' ? 'พร้อมหางานถัดไปไหม?' : 'Ready to find your next job?'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {lang === 'th' ? 'สร้างโปรไฟล์ฟรีบน ThaiHelper แล้วให้ครอบครัวทั่วไทยค้นพบคุณ' : 'Create your free profile on ThaiHelper and get discovered by families across Thailand.'}
                </p>
                <Link href="/register" className="inline-block bg-primary text-white font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
                  {lang === 'th' ? 'สร้างโปรไฟล์ฟรี' : 'Create Free Profile'}
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-headline">
                  {lang === 'th' ? 'กำลังหาผู้ช่วยในบ้านอยู่ไหม?' : 'Looking for household help?'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {lang === 'th' ? 'เรียกดูผู้ช่วยที่ผ่านการยืนยันในเมืองของคุณ เริ่มต้นฟรี' : 'Browse verified helpers in your city. Free to get started.'}
                </p>
                <Link href="/helpers" className="inline-block bg-primary text-white font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
                  {lang === 'th' ? 'เรียกดูผู้ช่วย' : 'Browse Helpers'}
                </Link>
              </>
            )}
          </div>

          {/* ── DISCLAIMER ── */}
          <div className="mt-10 p-5 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-500">
                {lang === 'th' ? 'ข้อจำกัดความรับผิดชอบ:' : 'Disclaimer:'}
              </strong>{' '}
              {lang === 'th'
                ? 'บทความนี้จัดทำขึ้นเพื่อให้ข้อมูลทั่วไปเท่านั้น ไม่ถือเป็นคำแนะนำทางกฎหมาย ภาษี หรือทางการเงิน ThaiHelper ไม่ใช่สำนักงานกฎหมายและไม่ได้ให้บริการทางกฎหมาย กฎหมายแรงงานไทย อัตราค่าจ้างขั้นต่ำ และข้อกำหนดด้านประกันสังคมอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบข้อมูลล่าสุดกับกระทรวงแรงงาน (mol.go.th) หรือปรึกษาทนายความที่มีคุณสมบัติก่อนตัดสินใจ'
                : 'This article is provided for general informational purposes only and does not constitute legal, tax, or financial advice. ThaiHelper is not a law firm and does not provide legal services. Thai labor laws, minimum wage rates, and social security requirements are subject to change. Please verify all information with the Thai Ministry of Labour (mol.go.th) or consult a qualified lawyer before making any decisions.'}
            </p>
          </div>

          {/* Back to Blog */}
          <div className="mt-6 mb-16">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {lang === 'th' ? 'กลับไปบทความทั้งหมด' : 'Back to all articles'}
            </Link>
          </div>
        </article>

        {/* ── RELATED ARTICLES ── */}
        {related.length > 0 && (
          <section className="bg-gray-50 border-t border-gray-100 py-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-10">
                <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">
                  {lang === 'th' ? 'อ่านต่อ' : 'Keep Reading'}
                </p>
                <h2 className="text-2xl font-bold text-gray-900 font-headline">
                  {lang === 'th' ? 'บทความที่เกี่ยวข้อง' : 'Related Articles'}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {related.map((r) => (
                  <BlogCard key={r.slug} post={r} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-12 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-xs shrink-0">
                <div className="text-xl font-bold text-on-background mb-4 font-headline">
                  Thai<span style={{ color: '#006a62' }}>Helper</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  A free platform connecting independent service providers with families in Thailand.
                </p>
                <div className="flex gap-4">
                  <a aria-label="Email support" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                  <a aria-label="LINE Official Account" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-all" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>                 </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">Product</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/helpers">Browse Helpers</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/employers">For Families</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm font-medium text-primary" href="/blog">Blog</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">Company</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">Contact Us</a></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/about">About Us</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/faq">FAQ</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">Legal</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/privacy">Privacy Policy</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/terms">Terms of Service</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-xs">&copy; 2026 ThaiHelper. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
