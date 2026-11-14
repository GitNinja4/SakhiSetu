import React, { useState } from 'react';
import { X } from 'lucide-react';

function QuickRecordModal({ state, t, onClose, commitTransaction }) {
  const [type, setType] = useState('sale');
  const [productId, setProductId] = useState('');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [customerName, setCustomerName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const prod = state.products.find((p) => p.id === productId);
    const total = Number(amount) || (prod ? prod.sellingPrice * qty : 0);
    if (total <= 0) return;
    commitTransaction({
      type,
      productId: prod?.id || null,
      itemName: prod ? prod.name : itemName || (type === 'sale' ? t('filterSale') : t('shopExpenseParty')),
      qty,
      unitPrice: Math.round(total / qty),
      amount: total,
      costBasis: prod ? prod.costPrice * qty : 0,
      paymentMode,
      customerName: type === 'sale' ? customerName || t('walkInCustomer') : t('shopExpenseParty'),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-[#1E2421]">{t('quickRecordTitle')}</h3>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-[#6B726E]" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'sale', label: t('modeSale') },
            { id: 'expense', label: t('modeExpense') },
          ].map((mode) => (
            <button
              type="button"
              key={mode.id}
              onClick={() => setType(mode.id)}
              className={`py-2 rounded-xl text-xs font-bold ${
                type === mode.id ? 'bg-[#146C43] text-white' : 'bg-[#FAF8F5] text-[#5B635E]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {!productId && (
          <input
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={type === 'sale' ? t('itemPlaceholder') : t('expensePlaceholder')}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            placeholder={t('qtyLabel')}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
          <input
            type="number"
            required
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('totalAmountPlaceholder')}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm font-bold"
          />
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-[#146C43] text-white font-bold text-sm">
          {t('saveEntryBtn')}
        </button>
      </form>
    </div>
  );
}

export default QuickRecordModal;
