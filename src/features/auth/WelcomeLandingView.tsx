import React from 'react';
import { Sparkles, Mic, Globe, QrCode, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { LANG_META } from '../../i18n/translations';

function WelcomeLandingView({ lang, setLang, t, onNavigateAuth, onQuickDemo }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2421] flex flex-col selection:bg-[#146C43]/15 selection:text-[#146C43]">
      <header className="w-full border-b border-[#EBE7E0] bg-[#FAF8F5]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#146C43] flex items-center justify-center text-white font-bold text-base shadow-xs">
              स
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#1E2421] block leading-none">
                SakhiSetu
              </span>
              <span className="hidden sm:block text-[11px] text-[#7A827E] font-medium mt-0.5">
                {t('brandSubtitle')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-[#6B726E] absolute left-2 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="pl-6 pr-5 py-1.5 rounded-lg border border-[#DCD7CD] bg-white text-xs font-semibold text-[#1E2421] focus:outline-none focus:border-[#146C43] cursor-pointer"
              >
                {LANG_META.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.native}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onNavigateAuth('login')}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-[#DCD7CD] bg-white hover:bg-[#F3F1EC] text-xs sm:text-sm font-semibold text-[#1E2421] transition"
            >
              {t('welcomeLoginBtn')}
            </button>
            <button
              onClick={() => onNavigateAuth('signup')}
              className="hidden sm:inline-flex px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#146C43] hover:bg-[#0F5434] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              {t('welcomeSignupBtn')}
            </button>
          </div>
        </div>
      </header>

      <main className="relative isolate max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 lg:pt-20 pb-10 sm:pb-16 w-full flex-1">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 -top-24 h-72 w-72 rounded-full bg-[#DDEFE4]/80 blur-3xl" />
          <div className="absolute -right-32 top-12 h-80 w-80 rounded-full bg-[#F4E8D5]/70 blur-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#CFE5D6] text-[#146C43] text-[10px] sm:text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('welcomeTag')}</span>
            </div>

            <h1 className="text-[2.3rem] sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.045em] text-[#1E2421] leading-[1.05]">
              {t('welcomeHeroTitle')}
            </h1>

            <p className="text-sm sm:text-lg text-[#5B635E] leading-relaxed max-w-xl">
              {t('welcomeHeroSub')}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={() => onNavigateAuth('signup')}
                className="w-full sm:w-auto justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#146C43] hover:bg-[#0F5434] text-white font-bold text-sm sm:text-base shadow-[0_10px_24px_-12px_rgba(20,108,67,0.75)] flex items-center gap-2 transition"
              >
                <span>{t('welcomeSignupBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateAuth('login')}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1E2421] border border-[#DCD7CD] font-bold text-sm sm:text-base transition"
              >
                {t('welcomeHeroLoginBtn')}
              </button>
            </div>

            {onQuickDemo && (
              <div className="pt-1">
                <button
                  onClick={onQuickDemo}
                  className="group inline-flex w-full sm:w-auto items-center justify-between gap-3 rounded-2xl border border-[#DED2EE] bg-white/80 px-3.5 py-2.5 text-left shadow-sm transition hover:border-[#BFA8DE] hover:bg-white hover:shadow-md"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EAF8] text-[#6B3FA0]">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-[#49336A]">{t('welcomeDemoBtn')}</span>
                      <span className="mt-0.5 block text-[11px] text-[#746784]">{t('welcomeDemoNote')}</span>
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-[#6B3FA0] transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            <div className="lg:hidden relative pt-3 sm:pt-5">
              <div aria-hidden="true" className="absolute inset-x-5 top-5 bottom-0 rotate-2 rounded-[1.75rem] bg-[#DDEFE4]" />
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/90 bg-white/90 p-3.5 sm:p-5 shadow-[0_24px_60px_-32px_rgba(27,72,48,0.5)] backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-[#EAF5EE] via-[#F5F8F1] to-white" />
                <div className="relative flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#146C43] to-[#55A675] text-sm font-bold text-white shadow-sm">
                    स
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1E2421]">Sunita Vastra &amp; Craft Store</p>
                    <p className="mt-0.5 text-[11px] text-[#6B726E]">Muzaffarpur, Bihar</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAF5EE] px-2 py-1 text-[10px] font-bold text-[#146C43]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2D9B63]" />
                    {t('onlineSynced')}
                  </span>
                </div>

                <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-[#E8EEE8] bg-white/90 p-3">
                    <p className="text-[10px] font-semibold text-[#7A827E]">{t('kpiSales')}</p>
                    <p className="mt-1 text-xl font-extrabold tracking-tight text-[#1E2421]">₹8,280</p>
                    <p className="mt-1 text-[10px] font-bold text-[#146C43]">+12.4%</p>
                  </div>
                  <div className="rounded-2xl border border-[#E8EEE8] bg-white/90 p-3">
                    <p className="text-[10px] font-semibold text-[#7A827E]">{t('kpiProfit')}</p>
                    <p className="mt-1 text-xl font-extrabold tracking-tight text-[#146C43]">₹2,050</p>
                    <p className="mt-1 text-[10px] font-bold text-[#6B3FA0]">{t('welcomeFeat2Title')}</p>
                  </div>
                </div>

                <div className="relative mt-2.5 flex items-center gap-2.5 rounded-2xl border border-[#E6DDF0] bg-[#FAF7FD] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E8F8] text-[#6B3FA0]">
                    <Mic className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#49336A]">{t('welcomeFeat1Title')}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#746784]">“आज ₹1,700 की 2 साड़ी बिकी”</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[#EAF5EE] px-2 py-1 text-[10px] font-bold text-[#146C43]">+₹1,700</span>
                </div>

                <div className="relative mt-3 flex items-center justify-between border-t border-[#F0EDE6] pt-3 text-[10px] font-semibold text-[#7A827E]">
                  <span>{t('navOverview')}</span>
                  <span>{t('navTransactions')}</span>
                  <span>{t('navInventory')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-6">
            <div className="relative rounded-[2rem] bg-gradient-to-br from-white/90 to-[#F0F7F1] p-2 shadow-[0_32px_80px_-40px_rgba(27,72,48,0.4)]">
              <div aria-hidden="true" className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#F2E7D5]" />
              <div className="relative space-y-4 rounded-[1.6rem] border border-[#EBE7E0] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#EAF5EE] text-[#146C43] font-bold flex items-center justify-center text-sm">
                    SD
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1E2421]">Sunita Vastra & Craft Store</p>
                    <p className="text-xs text-[#7A827E]">Muzaffarpur • Health Score 85/100</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EAF5EE] text-[#146C43] text-xs font-bold">
                  +18.4% Profit
                </span>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE7E0] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B3FA0] flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Sakhi Voice Entry (हिन्दी / भोजपुरी)
                  </span>
                  <span className="text-[11px] text-[#146C43] font-bold">Auto-Recorded</span>
                </div>
                <p className="text-sm font-semibold text-[#1E2421]">
                  “आज ₹1,700 की 2 साड़ी बिकी और ₹420 पैकिंग का खर्चा हुआ”
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-[#EAF5EE] text-[#146C43] text-xs font-bold">
                    +₹1,700 Sale
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FDF2DC] text-[#9A5B13] text-xs font-bold">
                    -₹420 Expense
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#EBE7E0] p-3">
                  <p className="text-xs text-[#7A827E]">Net Profit</p>
                  <p className="text-lg font-bold text-[#146C43] mt-0.5">₹3,840</p>
                </div>
                <div className="rounded-xl border border-[#EBE7E0] p-3">
                  <p className="text-xs text-[#7A827E]">Eligible Scheme</p>
                  <p className="text-sm font-bold text-[#6B3FA0] mt-1">PM Mudra ₹50k</p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 sm:mt-16">
          {[
            { icon: Mic, title: t('welcomeFeat1Title'), desc: t('welcomeFeat1Desc'), accent: 'text-[#146C43] bg-[#EAF5EE]' },
            { icon: Sparkles, title: t('welcomeFeat2Title'), desc: t('welcomeFeat2Desc'), accent: 'text-[#6B3FA0] bg-[#EFE7FA]' },
            { icon: QrCode, title: t('welcomeFeat3Title'), desc: t('welcomeFeat3Desc'), accent: 'text-[#146C43] bg-[#EAF5EE]' },
            { icon: ShieldCheck, title: t('welcomeFeat4Title'), desc: t('welcomeFeat4Desc'), accent: 'text-[#1E2421] bg-[#EFECE6]' },
          ].map((feat, i) => {
            const IconComp = feat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-[#EBE7E0] p-5 space-y-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${feat.accent}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#1E2421]">{feat.title}</h3>
                <p className="text-xs text-[#6B726E] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-[#EBE7E0] py-3 sm:py-4 px-4 sm:px-6 text-center text-xs text-[#7A827E]">
        <span className="sm:hidden">SakhiSetu</span>
        <span className="hidden sm:inline">
          SakhiSetu • Empowering Women Entrepreneurs Across Bharat • English • हिन्दी • भोजपुरी • मैथिली • বাংলা
        </span>
      </footer>
    </div>
  );
}

export default WelcomeLandingView;
