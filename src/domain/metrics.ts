import { I18N, LANG_META } from '../i18n/translations';
import type { BusinessState } from './models';
import { getRelativeDate } from './dates';

export function sha256Short(input) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

export function calculateMetrics(state: BusinessState) {
  const { transactions, products, customers } = state;
  const lang = state.profile?.language || 'en';
  const copy = I18N[lang] || I18N.en;
  const sales = transactions.filter((t) => t.type === 'sale');
  const expenses = transactions.filter((t) => t.type === 'expense');
  const purchases = transactions.filter((t) => t.type === 'purchase');
  const repayments = transactions.filter((t) => t.type === 'udhaar_repayment');

  const totalSales = sales.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalCOGS = sales.reduce((sum, t) => sum + Number(t.costBasis || 0), 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalPurchases = purchases.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const grossProfit = totalSales - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const totalPendingUdhaar = customers.reduce((sum, c) => sum + Math.max(0, Number(c.udhaarBalance || 0)), 0);
  const cashInFromSales = sales.filter((t) => t.paymentMode !== 'Udhaar').reduce((s, t) => s + Number(t.amount || 0), 0);
  const cashInFromUdhaar = repayments.reduce((s, t) => s + Number(t.amount || 0), 0);
  const netCashFlow = cashInFromSales + cashInFromUdhaar - totalExpenses - totalPurchases;

  const inventoryValue = products.reduce(
    (sum, p) => sum + (p.unit === 'service' ? 0 : Math.max(0, p.stock) * p.costPrice),
    0
  );
  const lowStockProducts = products.filter((p) => p.unit !== 'service' && p.stock <= p.minStock);

  const productAnalytics = products.map((p) => {
    const pSales = sales.filter((t) => t.productId === p.id || t.itemName.toLowerCase() === p.name.toLowerCase());
    const unitsSold = pSales.reduce((s, t) => s + Number(t.qty || 1), 0);
    const revenue = pSales.reduce((s, t) => s + Number(t.amount || 0), 0);
    const profit = pSales.reduce((s, t) => s + (Number(t.amount || 0) - Number(t.costBasis || p.costPrice * (t.qty || 1))), 0);
    const unitMargin = p.sellingPrice - p.costPrice;
    const marginPct = p.sellingPrice > 0 ? (unitMargin / p.sellingPrice) * 100 : 0;
    return { ...p, unitsSold, revenue, profit, unitMargin, marginPct };
  });

  const pulseTexts = {
    en: {
      subGood: `Your business is profitable this period (₹${netProfit.toLocaleString('en-IN')} net, ${netMarginPct.toFixed(1)}% margin).`,
      subBad: `Expenses exceed gross margin by ₹${Math.abs(netProfit).toLocaleString('en-IN')} this period.`,
      detail: `Total Sales ₹${totalSales.toLocaleString('en-IN')} minus Stock Cost ₹${totalCOGS.toLocaleString('en-IN')} leaves ₹${grossProfit.toLocaleString('en-IN')} gross profit. After ₹${totalExpenses.toLocaleString('en-IN')} shop expenses, your true net profit is ₹${netProfit.toLocaleString('en-IN')}.`,
      invSub: `${lowStockProducts.length} product(s) need restocking soon.`,
      invDetail:
        lowStockProducts.length > 0
          ? `Items running low: ${lowStockProducts.map((p) => `${p.name} (${p.stock} left)`).join(', ')}. Restocking early prevents lost customer walk-ins.`
          : 'All physical products are safely above their reorder thresholds.',
    },
    hi: {
      subGood: `इस अवधि में आपका व्यापार मुनाफे में है (₹${netProfit.toLocaleString('en-IN')} शुद्ध लाभ, ${netMarginPct.toFixed(1)}% मार्जिन)।`,
      subBad: `इस अवधि में खर्च सकल मुनाफे से ₹${Math.abs(netProfit).toLocaleString('en-IN')} अधिक है।`,
      detail: `कुल बिक्री ₹${totalSales.toLocaleString('en-IN')} में से माल लागत ₹${totalCOGS.toLocaleString('en-IN')} घटाने पर ₹${grossProfit.toLocaleString('en-IN')} सकल लाभ बचता है। ₹${totalExpenses.toLocaleString('en-IN')} दुकान खर्च के बाद आपका असली शुद्ध मुनाफा ₹${netProfit.toLocaleString('en-IN')} है।`,
      invSub: `${lowStockProducts.length} उत्पाद जल्द ही दोबारा मंगाने की ज़रूरत है।`,
      invDetail:
        lowStockProducts.length > 0
          ? `कम स्टॉक सामान: ${lowStockProducts.map((p) => `${p.name} (${p.stock} बाकी)`).join(', ')}।`
          : 'सभी सामान पर्याप्त स्टॉक में हैं।',
    },
    bho: {
      subGood: `एह समय राउर व्यापार मुनाफा में बा (₹${netProfit.toLocaleString('en-IN')} साफ लाभ, ${netMarginPct.toFixed(1)}% मार्जिन)।`,
      subBad: `एह समय खर्चा मुनाफा से ₹${Math.abs(netProfit).toLocaleString('en-IN')} बेसी बा।`,
      detail: `कुल बिक्री ₹${totalSales.toLocaleString('en-IN')} में से माल लागत ₹${totalCOGS.toLocaleString('en-IN')} घटवला पर ₹${grossProfit.toLocaleString('en-IN')} बचेला।`,
      invSub: `${lowStockProducts.length} सामान जल्द मंगावे के जरूरत बा।`,
      invDetail:
        lowStockProducts.length > 0
          ? `कम स्टॉक सामान: ${lowStockProducts.map((p) => `${p.name} (${p.stock} बाचल)`).join(', ')}।`
          : 'सब सामान पूरा स्टॉक में बा।',
    },
    mai: {
      subGood: `एहि अवधि मे अहाँक व्यापार लाभ मे अछि (₹${netProfit.toLocaleString('en-IN')} शुद्ध लाभ, ${netMarginPct.toFixed(1)}% मार्जिन)।`,
      subBad: `एहि अवधि मे खर्च सकल लाभ सँ ₹${Math.abs(netProfit).toLocaleString('en-IN')} बेसी अछि।`,
      detail: `कुल बिक्री ₹${totalSales.toLocaleString('en-IN')} सँ माल लागत ₹${totalCOGS.toLocaleString('en-IN')} घटयला पर ₹${grossProfit.toLocaleString('en-IN')} बचैत अछि।`,
      invSub: `${lowStockProducts.length} वस्तु शीघ्र अनबाक आवश्यकता अछि।`,
      invDetail:
        lowStockProducts.length > 0
          ? `कम स्टॉक वस्तु: ${lowStockProducts.map((p) => `${p.name} (${p.stock} बाकी)`).join(', ')}।`
          : 'सभ वस्तु पर्याप्त स्टॉक मे अछि।',
    },
    bn: {
      subGood: `এই সময়ে আপনার ব্যবসা লাভে আছে (₹${netProfit.toLocaleString('en-IN')} নিট লাভ, ${netMarginPct.toFixed(1)}% মার্জিন)।`,
      subBad: `এই সময়ে খরচ মোট লাভের চেয়ে ₹${Math.abs(netProfit).toLocaleString('en-IN')} বেশি হয়েছে।`,
      detail: `মোট বিক্রি ₹${totalSales.toLocaleString('en-IN')} থেকে পণ্যের ক্রয়মূল্য ₹${totalCOGS.toLocaleString('en-IN')} বাদ দিলে ₹${grossProfit.toLocaleString('en-IN')} থাকে।`,
      invSub: `${lowStockProducts.length}টি পণ্য শীঘ্রই রিস্টক করা প্রয়োজন।`,
      invDetail:
        lowStockProducts.length > 0
          ? `কম স্টক পণ্য: ${lowStockProducts.map((p) => `${p.name} (${p.stock}টি বাকি)`).join(', ')}।`
          : 'সব পণ্য পর্যাপ্ত স্টকে আছে।',
    },
  };
  const pt = pulseTexts[lang] || pulseTexts.en;

  const detectiveSignals = [
    {
      id: 'SIG-PULSE',
      title: copy.profitPulseTitle,
      subtitle: netProfit >= 0 ? pt.subGood : pt.subBad,
      detail: pt.detail,
      severity: netProfit >= 0 ? 'good' : 'critical',
    },
    {
      id: 'SIG-INV',
      title: copy.inventoryWatchTitle,
      subtitle: pt.invSub,
      detail: pt.invDetail,
      severity: lowStockProducts.length > 0 ? 'warning' : 'good',
    },
  ];

  const lossMakers = productAnalytics.filter((p) => p.unitMargin < 0);
  lossMakers.forEach((lm) => {
    const suggested = Math.ceil(lm.costPrice * 1.25);
    detectiveSignals.push({
      id: `SIG-LOSS-${lm.id}`,
      title: `${copy.lossAlertPrefix}: ${lm.name}`,
      subtitle: `Selling at ₹${lm.sellingPrice} below ₹${lm.costPrice} cost (losing ₹${Math.abs(lm.unitMargin)}/unit).`,
      detail: `Raise selling price to at least ₹${suggested} so every pack generates healthy profit.`,
      severity: 'critical',
    });
  });

  const topSeller = [...productAnalytics].sort((a, b) => b.profit - a.profit)[0];
  const coachMaps = {
    en: [
      topSeller
        ? `Bundle "${topSeller.name}" (${topSeller.marginPct.toFixed(0)}% margin) with Custom Blouse Tailoring to raise average bill size by 20%.`
        : 'Bundle your best-selling products to increase average order value.',
      totalPendingUdhaar > 0
        ? `Send polite WhatsApp UPI reminders to recover ₹${totalPendingUdhaar.toLocaleString('en-IN')} locked in Udhaar and boost cash-on-hand.`
        : 'Record every small expense so your profit picture stays honest.',
      lossMakers.length > 0
        ? `Re-price "${lossMakers[0].name}" from ₹${lossMakers[0].sellingPrice} to ₹${Math.ceil(lossMakers[0].costPrice * 1.25)} to eliminate negative-margin leakage.`
        : 'Keep 15% of weekly net profit aside in a dedicated Mudra/bank reserve.',
    ],
    hi: [
      topSeller
        ? `"${topSeller.name}" (${topSeller.marginPct.toFixed(0)}% मार्जिन) को ब्लाउज़ सिलाई सेवा के साथ जोड़कर औसत बिल 20% बढ़ाएं।`
        : 'औसत ऑर्डर बढ़ाने के लिए अपने सबसे ज़्यादा बिकने वाले सामानों का कॉम्बो बनाएं।',
      totalPendingUdhaar > 0
        ? `उधार में फंसे ₹${totalPendingUdhaar.toLocaleString('en-IN')} वापस पाने के लिए ग्राहकों को विनम्र व्हाट्सएप UPI रिमाइंडर भेजें।`
        : 'हर छोटा खर्च दर्ज करें ताकि आपका मुनाफा हमेशा सही दिखे।',
      lossMakers.length > 0
        ? `घाटा रोकने के लिए "${lossMakers[0].name}" का दाम ₹${lossMakers[0].sellingPrice} से बढ़ाकर ₹${Math.ceil(lossMakers[0].costPrice * 1.25)} करें।`
        : 'साप्ताहिक शुद्ध मुनाफे का 15% अलग बैंक बचत में सुरक्षित रखें।',
    ],
    bho: [
      topSeller
        ? `"${topSeller.name}" (${topSeller.marginPct.toFixed(0)}% मार्जिन) के साथ ब्लाउज़ सिलाई के कॉम्बो बना के औसत बिल 20% बढ़ाईं।`
        : 'औसत बिक्री बढ़ावे खातिर सबसे बेसी बिके वाला सामान के जोड़ी बनाईं।',
      totalPendingUdhaar > 0
        ? `उधार में फंसल ₹${totalPendingUdhaar.toLocaleString('en-IN')} निकाले खातिर ग्राहक लोग के व्हाट्सएप UPI रिमाइंडर भेजीं।`
        : 'हर छोट खर्चा लिखीं ताकि राउर मुनाफा के सही हिसाब रहे।',
      lossMakers.length > 0
        ? `नुकसान रोके खातिर "${lossMakers[0].name}" के दाम ₹${lossMakers[0].sellingPrice} से बढ़ा के ₹${Math.ceil(lossMakers[0].costPrice * 1.25)} करीं।`
        : 'हफ्ता के साफ मुनाफा में से 15% बैंक बचत में अलग रखीं।',
    ],
    mai: [
      topSeller
        ? `"${topSeller.name}" (${topSeller.marginPct.toFixed(0)}% मार्जिन) संग सिलाई सेवा जोड़ि औसत बिल 20% बढ़ाउ।`
        : 'औसत बिक्री बढ़ेबा लेल लोकप्रिय वस्तुक समूह बनाउ।',
      totalPendingUdhaar > 0
        ? `उधार मे फँसल ₹${totalPendingUdhaar.toLocaleString('en-IN')} वसूली लेल ग्राहक केँ व्हाट्सएप UPI स्मरण पठाउ।`
        : 'प्रत्येक छोट खर्च लिखू जाहि सँ लाभक सही चित्र रहय।',
      lossMakers.length > 0
        ? `घाटा रोकबा लेल "${lossMakers[0].name}" केर दाम ₹${lossMakers[0].sellingPrice} सँ बढ़ा कऽ ₹${Math.ceil(lossMakers[0].costPrice * 1.25)} करू।`
        : 'साप्ताहिक शुद्ध लाभक 15% बैंक बचत मे सुरक्षित राखू।',
    ],
    bn: [
      topSeller
        ? `"${topSeller.name}" (${topSeller.marginPct.toFixed(0)}% মার্জিন)-এর সাথে ব্লাউজ টেইলারিং বান্ডেল করে গড় বিল ২০% বাড়ান।`
        : 'গড় অর্ডার বাড়াতে আপনার সেরা বিক্রিত পণ্যগুলোর কম্বো তৈরি করুন।',
      totalPendingUdhaar > 0
        ? `বাকিতে আটকে থাকা ₹${totalPendingUdhaar.toLocaleString('en-IN')} আদায় করতে গ্রাহকদের হোয়াটসঅ্যাপ UPI রিমাইন্ডার পাঠান।`
        : 'প্রতিটি ছোট খরচ লিখে রাখুন যাতে লাভের হিসাব একদম সঠিক থাকে।',
      lossMakers.length > 0
        ? `ক্ষতি বন্ধ করতে "${lossMakers[0].name}"-এর দাম ₹${lossMakers[0].sellingPrice} থেকে বাড়িয়ে ₹${Math.ceil(lossMakers[0].costPrice * 1.25)} করুন।`
        : 'সাপ্তাহিক নিট লাভের ১৫% আলাদা ব্যাংক সঞ্চয়ে জমা রাখুন।',
    ],
  };
  const coachTips = coachMaps[lang] || coachMaps.en;

  const fraudFlags = [];
  const sortedByTime = [...transactions].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  for (let i = 1; i < sortedByTime.length; i++) {
    const prev = sortedByTime[i - 1];
    const curr = sortedByTime[i];
    if (
      prev.type === curr.type &&
      prev.amount === curr.amount &&
      prev.itemName === curr.itemName &&
      Math.abs((curr.createdAt || 0) - (prev.createdAt || 0)) < 900000
    ) {
      fraudFlags.push({
        id: `FRD-DUP-${curr.id}`,
        title: copy.dupTxnTitle,
        detail: `"${curr.itemName}" — ₹${curr.amount} (${prev.id} & ${curr.id})`,
      });
    }
  }

  const profPts = Math.min(35, Math.max(0, Math.round((netMarginPct / 32) * 35)));
  const expPts = totalSales > 0 ? Math.min(20, Math.max(5, Math.round((1 - Math.min(1, totalExpenses / (totalSales * 0.45))) * 20))) : 15;
  const cashPts = netCashFlow >= 0 ? 20 : Math.max(6, 20 - Math.round(Math.abs(netCashFlow) / 800));
  const stockPts = products.length > 0 ? Math.max(5, Math.round(((products.length - lowStockProducts.length) / products.length) * 15)) : 15;
  const udhaarPts = totalSales > 0 ? Math.min(10, Math.max(3, Math.round((1 - Math.min(1, totalPendingUdhaar / (totalSales * 0.5))) * 10))) : 8;
  const healthScore = Math.min(100, profPts + expPts + cashPts + stockPts + udhaarPts);

  const healthPillars = [
    { name: copy.pillarProfitability, score: profPts, max: 35 },
    { name: copy.pillarCashFlow, score: cashPts, max: 20 },
    { name: copy.pillarExpenseDiscipline, score: expPts, max: 20 },
    { name: copy.pillarStockHealth, score: stockPts, max: 15 },
    { name: copy.pillarUdhaarControl, score: udhaarPts, max: 10 },
  ];

  const dailySeries = [];
  const loc = LANG_META.find((l) => l.code === lang)?.locale || 'en-IN';
  for (let i = 6; i >= 0; i--) {
    const dStr = getRelativeDate(i);
    const dayObj = new Date(dStr);
    const label = dayObj.toLocaleDateString(loc, { weekday: 'short' });
    const daySales = sales.filter((t) => t.date === dStr).reduce((s, t) => s + Number(t.amount || 0), 0);
    const dayOut = transactions
      .filter((t) => t.date === dStr && (t.type === 'expense' || t.type === 'purchase'))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    dailySeries.push({ date: dStr, label, sales: daySales, outflow: dayOut });
  }

  const dailyRunRate = totalSales / 7;
  const dailyCostRate = (totalCOGS + totalExpenses) / 7;
  const forecast = [
    { horizon: copy.days30, inflow: Math.round(dailyRunRate * 30 + totalPendingUdhaar * 0.75), outflow: Math.round(dailyCostRate * 30) },
    { horizon: copy.days60, inflow: Math.round(dailyRunRate * 60 + totalPendingUdhaar * 0.9), outflow: Math.round(dailyCostRate * 60) },
    { horizon: copy.days90, inflow: Math.round(dailyRunRate * 90 + totalPendingUdhaar), outflow: Math.round(dailyCostRate * 90) },
  ].map((f) => ({ ...f, net: f.inflow - f.outflow }));

  return {
    totalSales,
    totalCOGS,
    totalExpenses,
    totalPurchases,
    grossProfit,
    netProfit,
    netMarginPct,
    totalPendingUdhaar,
    netCashFlow,
    inventoryValue,
    lowStockProducts,
    productAnalytics,
    detectiveSignals,
    coachTips,
    fraudFlags,
    healthScore,
    healthPillars,
    dailySeries,
    forecast,
  };
}
