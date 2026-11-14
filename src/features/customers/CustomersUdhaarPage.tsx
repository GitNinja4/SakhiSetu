import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

function CustomersUdhaarPage({ state, setState, metrics, t, isDemo, commitTransaction, notify }) {
  const [modalMode, setModalMode] = useState(null);
  const [modalAmt, setModalAmt] = useState(0);
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', creditLimit: 2500 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2421]">{t('custTitle')}</h1>
          <p className="text-sm text-[#6B726E] mt-1">
            {t('totalUdhaarReceivable')}: <strong className="text-[#6B3FA0]">₹{metrics.totalPendingUdhaar.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <button
          onClick={() => setNewCustOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#146C43] text-white text-xs font-bold self-start sm:self-center"
        >
          {t('addCustomerBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.customers.map((c) => {
          const phoneDigits = c.phone.replace(/\D/g, '').replace(/^91/, '');
          return (
          <div key={c.id} className="bg-white rounded-2xl border border-[#EBE7E0] p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-[#1E2421]">{c.name}</h3>
                <div className="text-xs text-[#6B726E] mt-1">
                  +91 {phoneDigits} • {t('totalSpendLabel')}: ₹{c.totalSpend.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium text-[#8E9591]">{t('udhaarDueLabel')}</div>
                <div className={`text-lg font-extrabold ${c.udhaarBalance > 0 ? 'text-[#6B3FA0]' : 'text-[#146C43]'}`}>
                  ₹{c.udhaarBalance.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3F0EA] flex flex-wrap gap-2">
              {c.udhaarBalance > 0 && (
                <>
                  <a
                    href={`https://wa.me/91${phoneDigits}?text=${encodeURIComponent(`Namaste ${c.name}, gentle reminder from ${state.profile.shopName}. Pending Udhaar: ₹${c.udhaarBalance}. UPI: ${state.profile.upiId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#EAF5EE] hover:bg-[#DCEEE2] text-[#146C43] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" /> {t('whatsappReminderBtn')}
                  </a>
                  <button
                    onClick={() => {
                      setModalMode({ kind: 'repay', cust: c });
                      setModalAmt(c.udhaarBalance);
                    }}
                    className="py-2 px-3 rounded-xl bg-[#6B3FA0] text-white text-xs font-bold"
                  >
                    {t('settleUdhaarBtn')}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setModalMode({ kind: 'credit', cust: c });
                  setModalAmt(500);
                }}
                className="py-2 px-3 rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] text-[#1E2421] text-xs font-bold"
              >
                {t('addUdhaarBtn')}
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#1E2421]">
                {modalMode.kind === 'repay' ? t('recordRepaymentTitle') : t('addCreditTitle')}
              </h3>
              <button onClick={() => setModalMode(null)}>
                <X className="w-5 h-5 text-[#6B726E]" />
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={modalAmt}
              onChange={(e) => setModalAmt(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] font-bold text-lg text-center"
            />
            <button
              onClick={() => {
                if (modalAmt > 0) {
                  commitTransaction({
                    type: modalMode.kind === 'repay' ? 'udhaar_repayment' : 'sale',
                    itemName: `${modalMode.kind === 'repay' ? t('filterRepayment') : 'Udhaar Credit'} - ${modalMode.cust.name}`,
                    qty: 1,
                    unitPrice: modalAmt,
                    amount: modalAmt,
                    costBasis: modalMode.kind === 'repay' ? 0 : Math.round(modalAmt * 0.65),
                    paymentMode: modalMode.kind === 'repay' ? 'UPI' : 'Udhaar',
                    customerId: modalMode.cust.id,
                    customerName: modalMode.cust.name,
                  });
                  setModalMode(null);
                }
              }}
              className="w-full py-3 rounded-xl bg-[#146C43] text-white font-bold text-sm"
            >
              {modalMode.kind === 'repay' ? t('confirmReceivedBtn') : t('confirmCreditBtn')} (₹{modalAmt})
            </button>
          </div>
        </div>
      )}

      {newCustOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCust.name) return;
              const payload = {
                name: newCust.name,
                phone: newCust.phone,
                creditLimit: Number(newCust.creditLimit || 2500),
              };
              let customer;
              if (isDemo) {
                customer = {
                  ...payload,
                  id: `C-${String(state.customers.length + 1).padStart(2, '0')}`,
                  phone: newCust.phone || '9835000000',
                  totalSpend: 0,
                  visits: 0,
                  udhaarBalance: 0,
                  lastActivity: new Date().toISOString().split('T')[0],
                };
              } else {
                try {
                  const response = await fetch('/api/customers', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || 'Could not add customer.');
                  customer = result;
                } catch (error) {
                  console.error('Failed to create customer.', error);
                  notify(error instanceof Error ? error.message : 'Could not add customer.');
                  return;
                }
              }
              setState((prev) => ({ ...prev, customers: [...prev.customers, customer] }));
              notify(`+ ${newCust.name}`);
              setNewCust({ name: '', phone: '', creditLimit: 2500 });
              setNewCustOpen(false);
            }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#1E2421]">{t('newCustomerTitle')}</h3>
              <button type="button" onClick={() => setNewCustOpen(false)}>
                <X className="w-5 h-5 text-[#6B726E]" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={t('customerNameLabel')}
              value={newCust.name}
              onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
            />
            <input
              type="tel"
              placeholder={t('phoneLabel')}
              value={newCust.phone}
              onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
            />
            <button type="submit" className="w-full py-3 rounded-xl bg-[#146C43] text-white font-bold text-sm">
              {t('saveCustomerBtn')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CustomersUdhaarPage;
