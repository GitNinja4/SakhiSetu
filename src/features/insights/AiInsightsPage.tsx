import React, { useState } from 'react';
import { Sparkles, ChevronRight, Download, Lightbulb, X } from 'lucide-react';

function AiInsightsPage({ state, metrics, t, notify, isDemo, canExport }) {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [volumeDelta, setVolumeDelta] = useState(10);
  const [priceDelta, setPriceDelta] = useState(0);
  const [expenseDelta, setExpenseDelta] = useState(0);

  const simSales = Math.round(metrics.totalSales * (1 + volumeDelta / 100) * (1 + priceDelta / 100));
  const simCOGS = Math.round(metrics.totalCOGS * (1 + volumeDelta / 100));
  const simExpenses = Math.round(metrics.totalExpenses * (1 + expenseDelta / 100));
  const simNetProfit = simSales - simCOGS - simExpenses;
  const simDelta = simNetProfit - metrics.netProfit;

  const exportPassportCsv = async () => {
    if (!isDemo) {
      try {
        const response = await fetch('/api/reports/passport.csv', { credentials: 'include' });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Could not export the Financial Passport.');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SakhiSetu_Financial_Passport.csv';
        a.click();
        URL.revokeObjectURL(url);
        notify('CSV ✓');
      } catch (error) {
        console.error('Financial Passport export failed.', error);
        notify(error instanceof Error ? error.message : 'Could not export the Financial Passport.');
      }
      return;
    }
    const header = 'ID,Date,Type,Item,Qty,Amount_INR,PaymentMode,Party\n';
    const rows = state.transactions
      .map((tx) => `${tx.id},${tx.date},${tx.type},"${tx.itemName}",${tx.qty},${tx.amount},${tx.paymentMode},"${tx.customerName}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SakhiSetu_Financial_Passport.csv`;
    a.click();
    notify('CSV ✓');
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl sm:text-[38px] font-bold tracking-tight text-[#1E2421]">
          {t('insightsTitle')}
        </h1>
        <p className="text-[15px] text-[#6B726E] mt-1.5">{t('insightsSub')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1E2421]" />
              <h2 className="text-lg font-bold text-[#1E2421]">{t('profitDetectiveTitle')}</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#146C43] text-[11px] font-bold">
              {t('aiBadge')}
            </span>
          </div>

          <div className="divide-y divide-[#F0EDE6]">
            {metrics.detectiveSignals.map((sig) => (
              <button
                key={sig.id}
                onClick={() => setSelectedSignal(sig)}
                className="w-full py-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] px-2 -mx-2 rounded-xl transition"
              >
                <div className="pr-3">
                  <div className="font-bold text-[14px] text-[#1E2421]">{sig.title}</div>
                  <div className="text-[13px] text-[#6B726E] mt-0.5">{sig.subtitle}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#146C43] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#FDF8EE] rounded-2xl border border-[#F0E6D2] p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-[#1E2421]" />
            <h2 className="text-lg font-bold text-[#1E2421]">{t('growthCoachTitle')}</h2>
          </div>
          <p className="text-[13px] text-[#6B726E] mb-4">{t('growthCoachSub')}</p>

          <div className="divide-y divide-[#EFE5D1]">
            {metrics.coachTips.map((tip, idx) => (
              <div key={idx} className="py-3.5 flex items-start gap-3.5">
                <span className="w-6 h-6 rounded-full bg-[#F5E4C3] text-[#8E5814] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-[14px] font-medium text-[#2A302D] leading-snug">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#EEF6F0] rounded-2xl border border-[#DCEADF] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#146C43]">
              {t('planWithConfidence')}
            </div>
            <h3 className="text-xl font-bold text-[#1E2421] mt-1">{t('whatIfTitle')}</h3>
            <p className="text-[13px] text-[#5B635E] mt-0.5">{t('whatIfSub')}</p>
          </div>
          <button
            onClick={() => setSimulatorOpen(!simulatorOpen)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#D4E3D8] hover:bg-[#FAF8F5] text-[#1E2421] text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center shadow-2xs"
          >
            {simulatorOpen ? t('hideSimulatorBtn') : t('openSimulatorBtn')}{' '}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {simulatorOpen && (
          <div className="mt-6 pt-5 border-t border-[#DCEADF] grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{t('simVolumeLabel')}</span>
                  <span className="text-[#146C43]">{volumeDelta > 0 ? `+${volumeDelta}%` : `${volumeDelta}%`}</span>
                </div>
                <input
                  type="range"
                  min={-25}
                  max={50}
                  value={volumeDelta}
                  onChange={(e) => setVolumeDelta(Number(e.target.value))}
                  className="w-full accent-[#146C43]"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{t('simPriceLabel')}</span>
                  <span className="text-[#6B3FA0]">{priceDelta > 0 ? `+${priceDelta}%` : `${priceDelta}%`}</span>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={25}
                  value={priceDelta}
                  onChange={(e) => setPriceDelta(Number(e.target.value))}
                  className="w-full accent-[#6B3FA0]"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{t('simExpenseLabel')}</span>
                  <span>{expenseDelta > 0 ? `+${expenseDelta}%` : `${expenseDelta}%`}</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={25}
                  value={expenseDelta}
                  onChange={(e) => setExpenseDelta(Number(e.target.value))}
                  className="w-full accent-[#B47818]"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#DCEADF] flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B726E]">{t('projectedSalesLabel')}</span>
                  <span className="font-bold">₹{simSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B726E]">{t('projectedProfitLabel')}</span>
                  <span className="text-xl font-extrabold text-[#146C43]">
                    ₹{simNetProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[#EEF6F0] text-xs font-bold text-[#146C43]">
                {simDelta >= 0
                  ? `+₹${simDelta.toLocaleString('en-IN')} ${t('extraProfitSuffix')}`
                  : `-₹${Math.abs(simDelta).toLocaleString('en-IN')} ${t('lowerProfitSuffix')}`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E9591]">
            {t('cashflowHeader')}
          </div>
          <h3 className="text-lg font-bold text-[#1E2421] mt-1">{t('cashflowTitle')}</h3>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {metrics.forecast.map((f) => (
              <div key={f.horizon} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE7E0]">
                <div className="text-xs font-bold text-[#6B3FA0]">{f.horizon}</div>
                <div className="text-xs text-[#6B726E] mt-2">{t('inflowShort')}: ₹{f.inflow.toLocaleString('en-IN')}</div>
                <div className="text-xs text-[#6B726E]">{t('outflowShort')}: ₹{f.outflow.toLocaleString('en-IN')}</div>
                <div className="text-sm font-extrabold text-[#146C43] mt-1.5 pt-1.5 border-t border-[#EBE7E0]">
                  +₹{f.net.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#146C43]">
              {t('loanReadyHeader')}
            </div>
            <h3 className="text-lg font-bold text-[#1E2421] mt-1">{t('passportTitle')}</h3>
            <p className="text-xs text-[#6B726E] mt-1">{t('passportSub')}</p>
          </div>
          <div className="mt-4 flex gap-2.5">
            {(isDemo || canExport) && (
              <button
                onClick={exportPassportCsv}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#146C43] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> {t('downloadCsvBtn')}
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedSignal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase text-[#146C43]">{t('detectiveDetailHeader')}</span>
              <button onClick={() => setSelectedSignal(null)}>
                <X className="w-5 h-5 text-[#6B726E]" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#1E2421]">{selectedSignal.title}</h3>
            <p className="text-sm text-[#4F5652] leading-relaxed">{selectedSignal.detail}</p>
            <button
              onClick={() => setSelectedSignal(null)}
              className="w-full py-2.5 rounded-xl bg-[#146C43] text-white font-semibold text-sm"
            >
              {t('gotItBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiInsightsPage;
