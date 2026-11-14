import { I18N } from '../i18n/translations';
import type { BusinessState } from './models';
import type { calculateMetrics } from './metrics';

export function parseSakhiIntent(
  rawInput: string,
  state: BusinessState,
  metrics: ReturnType<typeof calculateMetrics>,
) {
  const lang = state.profile?.language || 'en';
  const text = rawInput.trim();
  const lower = text.toLowerCase();
  const numbers = (text.match(/\d+(\.\d+)?/g) || []).map(Number);

  const matchedCustomer = state.customers.find(
    (c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.name.split(' ')[0].toLowerCase())
  );
  const matchedProduct = state.products.find((p) =>
    p.name.toLowerCase().split(' ').some((w) => w.length > 3 && lower.includes(w))
  );

  if (
    (lower.includes('profit') || lower.includes('munafa') || lower.includes('मुनाफा') || lower.includes('लाभ') || lower.includes('লাভ')) &&
    !lower.includes('sold') && !lower.includes('bech')
  ) {
    const replies = {
      en: `Your sales are ₹${metrics.totalSales.toLocaleString('en-IN')}, expenses are ₹${metrics.totalExpenses.toLocaleString('en-IN')}, and your Net Profit is ₹${metrics.netProfit.toLocaleString('en-IN')} (${metrics.netMarginPct.toFixed(1)}% margin).`,
      hi: `आपकी कुल बिक्री ₹${metrics.totalSales.toLocaleString('en-IN')} है, खर्च ₹${metrics.totalExpenses.toLocaleString('en-IN')} है, और शुद्ध मुनाफा ₹${metrics.netProfit.toLocaleString('en-IN')} (${metrics.netMarginPct.toFixed(1)}% मार्जिन) है।`,
      bho: `राउर कुल बिक्री ₹${metrics.totalSales.toLocaleString('en-IN')} बा, खर्चा ₹${metrics.totalExpenses.toLocaleString('en-IN')} बा, आ साफ मुनाफा ₹${metrics.netProfit.toLocaleString('en-IN')} बा।`,
      mai: `अहाँक कुल बिक्री ₹${metrics.totalSales.toLocaleString('en-IN')} अछि, खर्च ₹${metrics.totalExpenses.toLocaleString('en-IN')} अछि, आ शुद्ध लाभ ₹${metrics.netProfit.toLocaleString('en-IN')} अछि।`,
      bn: `আপনার মোট বিক্রি ₹${metrics.totalSales.toLocaleString('en-IN')}, খরচ ₹${metrics.totalExpenses.toLocaleString('en-IN')}, এবং নিট লাভ ₹${metrics.netProfit.toLocaleString('en-IN')} (${metrics.netMarginPct.toFixed(1)}% মার্জিন)।`,
    };
    return { kind: 'answer', message: replies[lang] || replies.en };
  }

  if ((lower.includes('udhaar') || lower.includes('udhar') || lower.includes('उधार') || lower.includes('বাকি')) && numbers.length === 0) {
    const pendingList = state.customers
      .filter((c) => c.udhaarBalance > 0)
      .map((c) => `${c.name} (₹${c.udhaarBalance})`)
      .join(', ');
    const replies = {
      en: `Total pending Udhaar is ₹${metrics.totalPendingUdhaar.toLocaleString('en-IN')}${pendingList ? `: ${pendingList}` : '.'}`,
      hi: `कुल बाकी उधार ₹${metrics.totalPendingUdhaar.toLocaleString('en-IN')} है${pendingList ? `: ${pendingList}` : '।'}`,
      bho: `कुल बाकी उधार ₹${metrics.totalPendingUdhaar.toLocaleString('en-IN')} बा${pendingList ? `: ${pendingList}` : '।'}`,
      mai: `कुल बाकी उधार ₹${metrics.totalPendingUdhaar.toLocaleString('en-IN')} अछि${pendingList ? `: ${pendingList}` : '।'}`,
      bn: `মোট বাকি পাওনা ₹${metrics.totalPendingUdhaar.toLocaleString('en-IN')}${pendingList ? `: ${pendingList}` : '।'}`,
    };
    return { kind: 'answer', message: replies[lang] || replies.en };
  }

  if ((lower.includes('stock') || lower.includes('inventory') || lower.includes('स्टॉक') || lower.includes('স্টক')) && numbers.length === 0) {
    const lowNames = metrics.lowStockProducts.map((p) => `${p.name} (${p.stock})`).join(', ');
    const replies = {
      en: metrics.lowStockProducts.length > 0 ? `Low stock alert: ${lowNames}.` : `All ${state.products.length} items are well stocked.`,
      hi: metrics.lowStockProducts.length > 0 ? `कम स्टॉक अलर्ट: ${lowNames}।` : `सभी ${state.products.length} सामान पर्याप्त स्टॉक में हैं।`,
      bho: metrics.lowStockProducts.length > 0 ? `कम स्टॉक चेतावनी: ${lowNames}।` : `सब ${state.products.length} सामान पूरा स्टॉक में बा।`,
      mai: metrics.lowStockProducts.length > 0 ? `कम स्टॉक चेतावनी: ${lowNames}।` : `सभ ${state.products.length} वस्तु पर्याप्त स्टॉक मे अछि।`,
      bn: metrics.lowStockProducts.length > 0 ? `কম স্টক সতর্কতা: ${lowNames}।` : `সব ${state.products.length}টি পণ্য পর্যাপ্ত স্টকে আছে।`,
    };
    return { kind: 'answer', message: replies[lang] || replies.en };
  }

  if (
    (lower.includes('expense') || lower.includes('kharch') || lower.includes('kharcha') || lower.includes('bill') || lower.includes('खर्च') || lower.includes('খরচ')) &&
    numbers.length > 0
  ) {
    const amount = Math.max(...numbers);
    const label =
      text
        .replace(/\d+/g, '')
        .replace(/(expense|kharch|kharcha|ka|ki|ke|for|rs|rupees|खर्च|खर्चा|খরচ)/gi, '')
        .trim() || 'Shop Expense';
    return {
      kind: 'proposal',
      summary: `Record ₹${amount} expense for "${label}"`,
      proposal: {
        type: 'expense',
        itemName: label.charAt(0).toUpperCase() + label.slice(1),
        qty: 1,
        unitPrice: amount,
        amount,
        costBasis: 0,
        paymentMode: lower.includes('upi') ? 'UPI' : 'Cash',
        customerName: 'Shop Expense',
      },
    };
  }

  if (
    numbers.length > 0 &&
    (lower.includes('sold') || lower.includes('sale') || lower.includes('bech') || lower.includes('बेच') || lower.includes('বিক্রি') || matchedProduct)
  ) {
    let qty = 1;
    let amount = 0;
    if (numbers.length >= 2) {
      qty = Math.min(...numbers);
      amount = Math.max(...numbers);
    } else if (matchedProduct && numbers[0] < 30) {
      qty = numbers[0];
      amount = qty * matchedProduct.sellingPrice;
    } else {
      amount = numbers[0];
    }

    const itemName = matchedProduct ? matchedProduct.name : 'Cotton Handloom Saree';
    const custName = matchedCustomer ? matchedCustomer.name : 'Meera Kumari';
    const paymentMode = lower.includes('udhaar') ? 'Udhaar' : lower.includes('cash') ? 'Cash' : 'UPI';
    return {
      kind: 'proposal',
      summary: `Record Sale: ${qty} × ${itemName} for ₹${amount} (${paymentMode})`,
      proposal: {
        type: 'sale',
        productId: matchedProduct?.id || 'P-101',
        itemName,
        qty,
        unitPrice: Math.round(amount / qty),
        amount,
        costBasis: matchedProduct ? matchedProduct.costPrice * qty : Math.round(amount * 0.65),
        paymentMode,
        customerId: matchedCustomer?.id || null,
        customerName: custName,
      },
    };
  }

  const helpMap = {
    en: `I heard: "${text}". Try saying: "Sold 2 Cotton Saree for 1700", "200 electricity bill expense", or "Ask about profit".`,
    hi: `मैंने सुना: "${text}"। आप बोल सकती हैं: "2 साड़ी 1700 में बेची", "200 बिजली बिल खर्च", या "मुनाफा बताओ"।`,
    bho: `हम सुननी: "${text}"। रउआ बोल सकीले: "2 साड़ी 1700 में बेचनी", "200 बिजली बिल खर्चा", या "मुनाफा बताईं"।`,
    mai: `हम सुनलहुँ: "${text}"। अहाँ बाजि सकैत छी: "2 साड़ी 1700 मे बेचलहुँ", "200 बिजली बिल खर्च", वा "लाभ बताउ"।`,
    bn: `আমি শুনেছি: "${text}"। আপনি বলতে পারেন: "২টি শাড়ি ১৭০০ টাকায় বিক্রি হয়েছে", "২০০ টাকা বিদ্যুৎ বিল খরচ", অথবা "লাভ কত বলো"।`,
  };
  return { kind: 'answer', message: helpMap[lang] || helpMap.en };
}

// ============================================================================
// 3. WELCOME LANDING & LOGIN / SIGN UP AUTHENTICATION VIEWS
// ============================================================================
