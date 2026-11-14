import React from 'react';
import { Mic, ChevronRight, DollarSign, Wallet, BarChart3, HeartPulse } from 'lucide-react';
import { LANG_META } from '../../../i18n/translations';

function OverviewPage({ state, metrics, t, lang, browserOnline, pendingSyncCount, onOpenSakhi, onNavigate, onOpenQuickEntry }) {
  const loc = LANG_META.find((l) => l.code === lang)?.locale || 'en-IN';
  const todayLabel = new Date()
    .toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  const maxBar = Math.max(500, ...metrics.dailySeries.map((d) => Math.max(d.sales, d.outflow)));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (metrics.healthScore / 100) * circumference;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7A827E]">
            <span>{todayLabel}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#146C43]" />
            <span className="text-[#146C43]">
              {!browserOnline || pendingSyncCount > 0 ? t('offlineQueueActive') : t('allCaughtUp')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-[40px] font-bold tracking-tight text-[#1E2421] leading-[1.15] mt-2">
            {t('heroTitle1')} <span className="text-[#146C43]">{t('heroTitle2')}</span>
          </h1>
          <p className="text-[15px] text-[#6B726E] mt-2 max-w-xl">{t('heroSub')}</p>
        </div>

        <button
          onClick={onOpenSakhi}
          className="bg-[#146C43] hover:bg-[#105836] text-white px-5 py-4 rounded-2xl flex items-center gap-3.5 shadow-sm transition text-left shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-white/95 text-[#146C43] flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-[15px] leading-tight">{t('talkSakhi')}</div>
            <div className="text-[12px] text-emerald-100/90 mt-0.5">{t('talkSakhiSub')}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-200 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="w-9 h-9 rounded-xl bg-[#E7F5EC] text-[#146C43] flex items-center justify-center mb-5">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-[13px] font-medium text-[#6B726E]">{t('kpiSales')}</div>
          <div className="text-[28px] font-bold text-[#1E2421] tracking-tight mt-1">
            ₹{metrics.totalSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[12px] font-semibold text-[#146C43] mt-2">+12.4%</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="w-9 h-9 rounded-xl bg-[#EFE7FA] text-[#6B3FA0] flex items-center justify-center mb-5">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-[13px] font-medium text-[#6B726E]">{t('kpiExpenses')}</div>
          <div className="text-[28px] font-bold text-[#1E2421] tracking-tight mt-1">
            ₹{metrics.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[12px] font-semibold text-[#6B3FA0] mt-2">
            {metrics.totalSales > 0
              ? `${((metrics.totalExpenses / metrics.totalSales) * 100).toFixed(1)}% ${t('ofSales')}`
              : t('controlled')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2DC] text-[#B47818] flex items-center justify-center mb-5">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-[13px] font-medium text-[#6B726E]">{t('kpiProfit')}</div>
          <div className="text-[28px] font-bold text-[#1E2421] tracking-tight mt-1">
            ₹{metrics.netProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-[12px] font-semibold text-[#B47818] mt-2">
            {metrics.netProfit >= 0 ? t('healthy') : t('needsAttention')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="w-9 h-9 rounded-xl bg-[#FBEAE8] text-[#B84A39] flex items-center justify-center mb-5">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="text-[13px] font-medium text-[#6B726E]">{t('kpiHealth')}</div>
          <div className="text-[28px] font-bold text-[#1E2421] tracking-tight mt-1">
            {metrics.healthScore}/100
          </div>
          <div className="text-[12px] font-semibold text-[#146C43] mt-2">{t('goodMomentum')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EBE7E0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E9591]">
                  {t('moneyMovement')}
                </div>
                <h3 className="text-lg font-bold text-[#1E2421] mt-1">{t('salesAtGlance')}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenQuickEntry}
                  className="px-3 py-1.5 rounded-xl bg-[#EAF5EE] text-[#146C43] text-xs font-bold hover:bg-[#DCEEE2] transition"
                >
                  {t('quickEntry')}
                </button>
                <button
                  onClick={() => onNavigate('transactions')}
                  className="text-xs font-semibold text-[#146C43] hover:underline flex items-center gap-0.5"
                >
                  {t('viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-6 h-40 flex items-end justify-between gap-3 pt-4 border-b border-[#F0EDE6] px-2">
              {metrics.dailySeries.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-28">
                    <div
                      style={{ height: `${Math.max(8, (day.sales / maxBar) * 100)}%` }}
                      className="w-4 sm:w-6 rounded-t-lg bg-[#146C43] transition-all"
                    />
                    {day.outflow > 0 && (
                      <div
                        style={{ height: `${Math.max(6, (day.outflow / maxBar) * 100)}%` }}
                        className="w-3 sm:w-4 rounded-t-lg bg-[#D8C7F0] transition-all"
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#7A827E]">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#F3F0EA]">
            {state.transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-[#1E2421]">{tx.itemName}</span>
                  <span className="text-xs text-[#7A827E] ml-2">
                    {tx.customerName} • {tx.paymentMode}
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    tx.type === 'sale' || tx.type === 'udhaar_repayment'
                      ? 'text-[#146C43]'
                      : 'text-[#6B3FA0]'
                  }`}
                >
                  {tx.type === 'sale' || tx.type === 'udhaar_repayment' ? '+' : '-'}₹
                  {tx.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EBE7E0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E9591]">
                  {t('yourSnapshot')}
                </div>
                <h3 className="text-lg font-bold text-[#1E2421] mt-1">{t('kpiHealth')}</h3>
              </div>
              <HeartPulse className="w-5 h-5 text-[#146C43]" />
            </div>

            <div className="my-5 flex items-center gap-5">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} stroke="#EEF3EF" strokeWidth="9" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#146C43"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-extrabold text-[#1E2421]">{metrics.healthScore}</div>
                  <div className="text-[10px] font-semibold text-[#7A827E]">{t('outOf100')}</div>
                </div>
              </div>
              <p className="text-xs text-[#5B635E] leading-relaxed">
                {t('healthSummaryPrefix')} <strong>{metrics.netMarginPct.toFixed(1)}%</strong>{' '}
                {t('healthSummaryMid')}{' '}
                <strong>₹{metrics.totalPendingUdhaar.toLocaleString('en-IN')}</strong>{' '}
                {t('healthSummarySuffix')}
              </p>
            </div>

            <div className="space-y-2.5">
              {metrics.healthPillars.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#4F5652]">{p.name}</span>
                    <span className="font-semibold text-[#1E2421]">
                      {p.score}/{p.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F2EFE9] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(p.score / p.max) * 100}%` }}
                      className="h-full bg-[#146C43] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('insights')}
            className="mt-5 w-full py-2.5 rounded-xl border border-[#DCE6DF] bg-[#FAF8F5] hover:bg-[#EAF5EE] text-[#146C43] text-xs font-bold transition"
          >
            {t('openAiForecastCta')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
