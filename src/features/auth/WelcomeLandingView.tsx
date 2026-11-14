import React from 'react';
import { Sparkles, Mic, Globe, QrCode, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { LANG_META } from '../../i18n/translations';

function WelcomeLandingView({ lang, setLang, t, onNavigateAuth, onQuickDemo }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2421] flex flex-col justify-between selection:bg-[#146C43]/15 selection:text-[#146C43]">
      <header className="w-full border-b border-[#EBE7E0] bg-[#FAF8F5]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#146C43] flex items-center justify-center text-white font-bold text-base shadow-xs">
              स
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#1E2421] block leading-none">
                SakhiSetu
              </span>
              <span className="text-[11px] text-[#7A827E] font-medium block mt-0.5">
                {t('brandSubtitle')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-[#6B726E] absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="pl-7 pr-6 py-1.5 rounded-lg border border-[#DCD7CD] bg-white text-xs font-semibold text-[#1E2421] focus:outline-none focus:border-[#146C43] cursor-pointer"
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
              className="px-3.5 py-1.5 rounded-lg border border-[#DCD7CD] bg-white hover:bg-[#F3F1EC] text-xs sm:text-sm font-semibold text-[#1E2421] transition"
            >
              {t('welcomeLoginBtn')}
            </button>
            <button
              onClick={() => onNavigateAuth('signup')}
              className="px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#146C43] hover:bg-[#0F5434] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              {t('welcomeSignupBtn')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5EE] border border-[#CFE5D6] text-[#146C43] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('welcomeTag')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1E2421] leading-[1.12]">
              {t('welcomeHeroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-[#5B635E] leading-relaxed max-w-2xl">
              {t('welcomeHeroSub')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigateAuth('signup')}
                className="px-6 py-3.5 rounded-xl bg-[#146C43] hover:bg-[#0F5434] text-white font-bold text-sm sm:text-base shadow-sm flex items-center gap-2 transition"
              >
                <span>{t('welcomeSignupBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateAuth('login')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1E2421] border border-[#DCD7CD] font-bold text-sm sm:text-base transition"
              >
                {t('welcomeHeroLoginBtn')}
              </button>
            </div>

            {onQuickDemo && (
              <div className="pt-1">
                <button
                  onClick={onQuickDemo}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B3FA0] hover:text-[#542E82] underline underline-offset-4 transition"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('welcomeDemoBtn')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 sm:p-6 shadow-sm space-y-4">
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

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 sm:mt-16">
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

      <footer className="border-t border-[#EBE7E0] py-4 px-4 sm:px-6 text-center text-xs text-[#7A827E]">
        SakhiSetu • Empowering Women Entrepreneurs Across Bharat • English • हिन्दी • भोजपुरी • मैथिली • বাংলা
      </footer>
    </div>
  );
}

export default WelcomeLandingView;
