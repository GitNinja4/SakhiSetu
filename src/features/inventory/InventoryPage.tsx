import React, { useState } from 'react';

function InventoryPage({ state, setState, metrics, t, isDemo, commitTransaction, notify }) {
  const [newItem, setNewItem] = useState({ name: '', category: 'Apparel', sellingPrice: '', costPrice: '', stock: '', minStock: 5 });

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sellingPrice) return;
    const payload = {
      name: newItem.name,
      category: newItem.category,
      sellingPrice: Number(newItem.sellingPrice),
      costPrice: Number(newItem.costPrice || 0),
      stock: Number(newItem.stock || 0),
      minStock: Number(newItem.minStock || 5),
      unit: 'pcs',
    };
    let item;
    if (isDemo) {
      item = { ...payload, id: `P-${101 + state.products.length}`, sku: `SKU-${10 + state.products.length}` };
    } else {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not add product.');
        item = result;
      } catch (error) {
        console.error('Failed to create product.', error);
        notify(error instanceof Error ? error.message : 'Could not add product.');
        return;
      }
    }
    setState((prev) => ({ ...prev, products: [...prev.products, item] }));
    setNewItem({ name: '', category: 'Apparel', sellingPrice: '', costPrice: '', stock: '', minStock: 5 });
    notify(`+ ${item.name}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2421]">{t('invTitle')}</h1>
      </div>

      <form onSubmit={addItem} className="bg-white rounded-2xl border border-[#EBE7E0] p-5 grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('productNameLabel')}</label>
          <input
            type="text"
            required
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder={t('productPlaceholder')}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('costLabel')}</label>
          <input
            type="number"
            required
            value={newItem.costPrice}
            onChange={(e) => setNewItem({ ...newItem, costPrice: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('sellingLabel')}</label>
          <input
            type="number"
            required
            value={newItem.sellingPrice}
            onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5B635E] block mb-1">{t('stockQtyLabel')}</label>
          <input
            type="number"
            value={newItem.stock}
            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
          />
        </div>
        <button type="submit" className="py-2.5 px-4 rounded-xl bg-[#146C43] text-white font-semibold text-sm">
          {t('addProductBtn')}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.productAnalytics.map((p) => {
          const isLow = p.unit !== 'service' && p.stock <= p.minStock;
          const isLoss = p.unitMargin < 0;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-[#EBE7E0] p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-[#8E9591]">{p.sku} • {p.category}</span>
                  <h3 className="font-bold text-base text-[#1E2421] mt-0.5">{p.name}</h3>
                  <div className="text-xs text-[#5B635E] mt-1">
                    {t('costWord')} ₹{p.costPrice} • {t('sellWord')} ₹{p.sellingPrice} • {t('marginWord')}{' '}
                    <strong className={isLoss ? 'text-[#B84A39]' : 'text-[#146C43]'}>
                      {p.marginPct.toFixed(0)}%
                    </strong>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#146C43]">
                  {p.unit === 'service' ? t('serviceBadge') : isLow ? `${t('lowStockBadge')} (${p.stock})` : `${t('inStockBadge')} (${p.stock})`}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F3F0EA] flex items-center justify-between">
                <span className="text-xs text-[#7A827E]">
                  {t('soldWord')}: <strong>{p.unitsSold}</strong> {t('unitsWord')}
                </span>
                {p.unit !== 'service' && (
                  <button
                    onClick={() =>
                      commitTransaction({
                        type: 'purchase',
                        productId: p.id,
                        itemName: p.name,
                        qty: 5,
                        unitPrice: p.costPrice,
                        amount: p.costPrice * 5,
                        paymentMode: 'UPI',
                        customerName: t('supplierVendor'),
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EAF5EE] border border-[#DCD7CD] text-[#146C43] text-xs font-semibold"
                  >
                    {t('restockPlus5')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryPage;
