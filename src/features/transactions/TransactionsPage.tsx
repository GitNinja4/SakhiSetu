import React, { useState } from 'react';
import { QrCode, X } from 'lucide-react';

function TransactionsPage({ state, metrics, t, isDemo, commitTransaction, notify }) {
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [entryType, setEntryType] = useState('sale');
  const [productId, setProductId] = useState('');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [customerName, setCustomerName] = useState('');
  const [upiModalAmount, setUpiModalAmount] = useState(null);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
  const [paymentLinkBusy, setPaymentLinkBusy] = useState(false);
  const [invoiceRecord, setInvoiceRecord] = useState(null);

  const createPaymentLink = async (transaction) => {
    setPaymentLinkBusy(true);
    try {
      const response = await fetch('/api/payments/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create a payment link.');
      setPaymentLinkUrl(result.paymentLink);
    } catch (error) {
      console.error('Failed to create UPI payment link.', error);
      notify(error instanceof Error ? error.message : 'Could not create a payment link.');
    } finally {
      setPaymentLinkBusy(false);
    }
  };

  const handleRecord = (e) => {
    e.preventDefault();
    if (entryType === 'sale' && paymentMode === 'Udhaar' && !customerName.trim()) {
      notify('Enter a customer name before recording Udhaar.');
      return;
    }
    const prod = state.products.find((p) => p.id === productId);
    const rate = Number(unitPrice) || (prod ? (entryType === 'purchase' ? prod.costPrice : prod.sellingPrice) : 0);
    if (rate <= 0) return;

    commitTransaction({
      type: entryType,
      productId: prod?.id || null,
      itemName: prod ? prod.name : itemName || t('shopExpenseParty'),
      qty: Number(qty),
      unitPrice: rate,
      amount: rate * Number(qty),
      costBasis: prod ? prod.costPrice * Number(qty) : 0,
      paymentMode,
      customerName: entryType === 'sale' ? customerName || t('walkInCustomer') : itemName || t('supplierVendor'),
    });

    setItemName('');
    setUnitPrice('');
    setProductId('');
    setCustomerName('');
  };

  const visibleTxns = state.transactions.filter((tx) => {
    const matchesTab = tab === 'all' || tx.type === tab;
    const matchesSearch =
      !searchQuery.trim() ||
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2421]">{t('txnTitle')}</h1>
          <p className="text-sm text-[#6B726E] mt-1">{t('txnSub')}</p>
        </div>
        <button
          onClick={() => setUpiModalAmount(500)}
          className="px-4 py-2.5 rounded-xl bg-[#6B3FA0] hover:bg-[#5A3388] text-white text-sm font-semibold flex items-center gap-2 shrink-0"
        >
          <QrCode className="w-4 h-4" /> {t('collectUpiQr')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: 'sale', label: t('modeSale') },
            { id: 'expense', label: t('modeExpense') },
            { id: 'purchase', label: t('modePurchase') },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setEntryType(mode.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                entryType === mode.id
                  ? 'bg-[#146C43] text-white'
                  : 'bg-[#FAF8F5] text-[#4F5652] border border-[#EBE7E0]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRecord} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          {entryType !== 'expense' && (
            <div>
              <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('catalogProduct')}</label>
              <select
                value={productId}
                onChange={(e) => {
                  const id = e.target.value;
                  setProductId(id);
                  const p = state.products.find((item) => item.id === id);
                  if (p) {
                    setItemName(p.name);
                    setUnitPrice(String(entryType === 'purchase' ? p.costPrice : p.sellingPrice));
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm bg-white"
              >
                <option value="">{t('customItemOpt')}</option>
                {state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stock} {t('leftWord')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('descriptionLabel')}</label>
            <input
              type="text"
              required={!productId}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={entryType === 'expense' ? t('expensePlaceholder') : t('itemPlaceholder')}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('qtyLabel')}</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('rateLabel')}</label>
              <input
                type="number"
                required
                min={1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5B635E] block mb-1">
              {entryType === 'sale' ? t('customerAndMode') : t('paymentModeLabel')}
            </label>
            <div className="flex gap-1.5">
              {entryType === 'sale' && (
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('walkInCustomer')}
                  className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-xs"
                />
              )}
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="p-2.5 rounded-xl border border-[#DCD7CD] text-xs bg-white font-semibold"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                {entryType === 'sale' && <option value="Udhaar">Udhaar</option>}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-[#146C43] hover:bg-[#0F5434] text-white font-bold text-sm transition"
          >
            {t('saveBtn')} ₹{((Number(unitPrice) || 0) * qty).toLocaleString('en-IN')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: t('filterAll') },
              { id: 'sale', label: t('filterSale') },
              { id: 'expense', label: t('filterExpense') },
              { id: 'purchase', label: t('filterPurchase') },
              { id: 'udhaar_repayment', label: t('filterRepayment') },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTab(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  tab === f.id ? 'bg-[#1E2421] text-white' : 'bg-[#FAF8F5] text-[#5B635E]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="px-3 py-1.5 rounded-xl border border-[#DCD7CD] text-xs bg-[#FAF8F5]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#EBE7E0] text-[11px] uppercase tracking-wider text-[#7A827E]">
              <tr>
                <th className="py-3 pr-3">{t('colDate')}</th>
                <th className="py-3 px-3">{t('colDescription')}</th>
                <th className="py-3 px-3">{t('colParty')}</th>
                <th className="py-3 px-3">{t('colMode')}</th>
                <th className="py-3 px-3 text-right">{t('colAmount')}</th>
                <th className="py-3 pl-3 text-right">{t('colBill')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EA]">
              {visibleTxns.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-3 pr-3 text-xs text-[#5B635E] whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 px-3 font-semibold text-[#1E2421]">
                    {tx.itemName} <span className="text-xs font-normal text-[#7A827E]">×{tx.qty}</span>
                  </td>
                  <td className="py-3 px-3 text-xs text-[#5B635E]">{tx.customerName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F0EA] text-[#37413C]">
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                      tx.type === 'sale' || tx.type === 'udhaar_repayment'
                        ? 'text-[#146C43]'
                        : 'text-[#6B3FA0]'
                    }`}
                  >
                    {tx.type === 'sale' || tx.type === 'udhaar_repayment' ? '+' : '-'}₹
                    {tx.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {tx.type === 'sale' && (
                        <button
                          onClick={() => setInvoiceRecord(tx)}
                          className="text-xs font-semibold text-[#146C43] hover:underline"
                        >
                          {t('invoiceBtn')}
                        </button>
                      )}
                      {!isDemo && tx.type === 'sale' && tx.paymentMode === 'UPI' && !tx.upiVerified && tx.synced && (
                        <button
                          type="button"
                          disabled={paymentLinkBusy}
                          onClick={() => createPaymentLink(tx)}
                          className="text-xs font-semibold text-[#6B3FA0] hover:underline disabled:opacity-60"
                        >
                          {paymentLinkBusy ? 'Creating…' : 'Collect UPI'}
                        </button>
                      )}
                      {tx.type === 'sale' && tx.paymentMode === 'UPI' && !tx.upiVerified && !tx.synced && (
                        <span className="text-[11px] text-[#9A5B13]">Waiting to sync</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {upiModalAmount !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B3FA0]">
                {t('upiQrHeader')}
              </span>
              <button onClick={() => setUpiModalAmount(null)} className="text-[#6B726E]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-[#1E2421]">{state.profile.shopName}</h3>
            <p className="text-xs text-[#6B726E]">{t('upiIdLabel')}: {state.profile.upiId}</p>
            <input
              type="number"
              value={upiModalAmount}
              onChange={(e) => setUpiModalAmount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-center font-bold text-lg"
            />
            <button
              onClick={() => {
                if (upiModalAmount > 0) {
                  commitTransaction({
                    type: 'sale',
                    itemName: 'UPI QR Sale',
                    qty: 1,
                    unitPrice: upiModalAmount,
                    amount: upiModalAmount,
                    costBasis: Math.round(upiModalAmount * 0.62),
                    paymentMode: 'UPI',
                    customerName: t('walkInCustomer'),
                  });
                  setUpiModalAmount(null);
                }
              }}
              className="w-full py-3 rounded-xl bg-[#146C43] text-white font-bold text-sm"
            >
              Save sale (payment unverified)
            </button>
          </div>
        </div>
      )}

      {paymentLinkUrl && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B3FA0]">
                UPI payment link
              </span>
              <button onClick={() => setPaymentLinkUrl('')} className="text-[#6B726E]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#4F5652]">Share this link with the customer. Payment is verified by the provider webhook.</p>
            <a
              href={paymentLinkUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-3 rounded-xl bg-[#146C43] text-white font-bold text-sm"
            >
              Open payment link
            </a>
          </div>
        </div>
      )}

      {invoiceRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-start border-b border-[#EBE7E0] pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#146C43]">{t('taxReceiptHeader')}</div>
                <h3 className="text-lg font-bold text-[#1E2421]">{state.profile.shopName}</h3>
              </div>
              <button onClick={() => setInvoiceRecord(null)}>
                <X className="w-5 h-5 text-[#6B726E]" />
              </button>
            </div>
            <div className="bg-[#FAF8F5] p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between font-semibold">
                <span>{invoiceRecord.itemName} × {invoiceRecord.qty}</span>
                <span>₹{invoiceRecord.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-[#EBE7E0] pt-2 flex justify-between font-bold text-base text-[#146C43]">
                <span>{t('totalPaidLabel')} ({invoiceRecord.paymentMode})</span>
                <span>₹{invoiceRecord.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                  notify(t('printDialogToast'));
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#146C43] text-white font-semibold text-sm"
              >
                {t('printSavePdf')}
              </button>
              <button
                onClick={() => setInvoiceRecord(null)}
                className="px-4 py-2.5 rounded-xl bg-[#F3F0EA] text-sm font-semibold"
              >
                {t('closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsPage;
