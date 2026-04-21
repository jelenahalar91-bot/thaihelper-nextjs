import { useState } from 'react';
import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import BlogCard from '@/components/BlogCard';
import { blogPosts } from '@/content/blog/posts';
import { useLang } from '../_app';

const FILTERS = [
  { key: 'all', label: 'All Articles', label_th: 'บทความทั้งหมด' },
  { key: 'families', label: 'For Families', label_th: 'สำหรับครอบครัว' },
  { key: 'helpers', label: 'For Helpers', label_th: 'สำหรับผู้ช่วย' },
];

export default function BlogIndex() {
  const [filter, setFilter] = useState('all');
  const { lang } = useLang();

  const filtered =
    filter === 'all' ? blogPosts : blogPosts.filter((p) => p.category === filter);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ];

  return (
    <>
      <SEOHead
        title="Blog — Hiring Tips, Salary Guides & Career Advice for Thailand"
        description="Expert guides for families hiring household help in Thailand and career tips for nannies, housekeepers, and domestic helpers. Salary guides, interview tips, and more."
        path="/blog"
        lang={lang}
        jsonLd={getBreadcrumbSchema(breadcrumbs)}
      />

      <div className="min-h-screen bg-white font-body">
        {/* ── NAV (matched to main site) ── */}
        <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link className="hidden sm:inline text-xs md:text-sm font-semibold text-primary hover:text-primary-container transition-colors" href="/">
              For Helpers
            </Link>
            <Link className="hidden sm:inline text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full border border-secondary/20 text-secondary hover:bg-secondary hover:text-white transition-all" href="/employers">
              For Families
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

        {/* ── HERO HEADER ── */}
        <header className="pt-24 pb-8 sm:pt-28 sm:pb-12 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto text-center">
            <p className="mb-3 font-medium text-primary text-xs uppercase tracking-widest">
              ThaiHelper Blog
            </p>
            <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl text-gray-900 tracking-tight font-headline mb-4">
              {lang === 'th' ? 'คู่มือและเคล็ดลับสำหรับประเทศไทย' : 'Guides & Tips for Thailand'}
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {lang === 'th'
                ? 'คู่มือการจ้างงานสำหรับครอบครัว และคำแนะนำอาชีพสำหรับผู้ช่วย ทุกสิ่งที่คุณต้องรู้เกี่ยวกับผู้ช่วยในครัวเรือนในไทย'
                : 'Practical hiring guides for families and career advice for helpers. Everything you need to know about household help in Thailand.'}
            </p>

            {/* Filter Tabs */}
            <div className="flex justify-center gap-2 mt-8">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {lang === 'th' ? f.label_th : f.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── POSTS GRID ── */}
        <main className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-16 text-lg">
              {lang === 'th' ? 'ยังไม่มีบทความในหมวดหมู่นี้' : 'No articles in this category yet.'}
            </p>
          )}
        </main>

        {/* ── CTA SECTION ── */}
        <section className="bg-gradient-to-br from-primary to-primary-container py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-headline">
              {lang === 'th' ? 'พร้อมเริ่มต้นหรือยัง?' : 'Ready to Get Started?'}
            </h2>
            <p className="text-white/80 text-lg mb-8">
              {lang === 'th'
                ? 'ไม่ว่าคุณจะเป็นครอบครัวที่กำลังหาผู้ช่วย หรือผู้ช่วยที่กำลังหางาน — ThaiHelper เชื่อมต่อคุณโดยตรง'
                : "Whether you're a family looking for help or a helper looking for work — ThaiHelper connects you directly."}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/employer-register"
                className="bg-white text-primary font-bold px-8 py-3.5 rounded-full hover:shadow-xl hover:scale-105 transition-all text-sm"
              >
                {lang === 'th' ? 'ฉันกำลังหาผู้ช่วย' : "I'm Looking for Help"}
              </Link>
              <Link
                href="/register"
                className="border-2 border-white text-white font-bold px-8 py-3.5 rounded-full hover:bg-white/10 transition-all text-sm"
              >
                {lang === 'th' ? 'ฉันเป็นผู้ช่วย' : "I'm a Helper"}
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER (matched to main site) ── */}
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
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/pricing">Pricing</Link></li>
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
