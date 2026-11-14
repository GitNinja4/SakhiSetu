import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Home, Receipt, Package, Users, Sparkles, BookOpen, Settings, Mic, Send, Globe, Volume2, VolumeX, Square, Check, Menu, LogOut, X } from 'lucide-react';
import { LANG_META, I18N } from '../i18n/translations';
import { calculateMetrics } from '../domain/metrics';
import { parseSakhiIntent } from '../domain/intentParser';
import { useBusinessState } from '../data/useBusinessState';
import { queuePendingTransactions, syncPendingTransactions } from '../data/syncPendingTransactions';
import { createTransaction, applyTransaction } from '../domain/ledger';
import { createEmptyBusinessState } from '../domain/initialState';
import WelcomeLandingView from '../features/auth/WelcomeLandingView';
import AuthScreenView from '../features/auth/AuthScreenView';
import OverviewPage from '../features/dashboard/pages/OverviewPage';
import TransactionsPage from '../features/transactions/TransactionsPage';
import InventoryPage from '../features/inventory/InventoryPage';
import CustomersUdhaarPage from '../features/customers/CustomersUdhaarPage';
import AiInsightsPage from '../features/insights/AiInsightsPage';
import LearnAndSchemesPage from '../features/learning/LearnAndSchemesPage';
import SettingsPage from '../features/settings/SettingsPage';
import QuickRecordModal from '../features/transactions/QuickRecordModal';

function App() {
  const [entryView, setEntryView] = useState('welcome');
  const [authMode, setAuthMode] = useState('login');
  const [sessionShopId, setSessionShopId] = useState(null);
  const [state, setState, hydratedShopId] = useBusinessState(sessionShopId);
  const [userRole, setUserRole] = useState(null);
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);

  const [activePage, setActivePage] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sakhiDrawerOpen, setSakhiDrawerOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [locked, setLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speechProgress, setSpeechProgress] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const profileMenuRef = useRef(null);
  const speechFallbackTimerRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isSpeaking, isListening, liveTranscript]);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }, []);

  const metrics = useMemo(() => calculateMetrics(state), [state]);
  const lang = state.profile.language || 'en';
  const copy = I18N[lang] || I18N.en;
  const t = useCallback((key) => copy[key] || I18N.en[key] || key, [copy]);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Could not restore the signed-in session.');
        return response.json();
      })
      .then(async (session) => {
        if (!active || !session) return;
        setSessionShopId(session.shopId);
        setUserRole(session.role);
        setEntryView('loading');
      })
      .catch((error) => {
        console.error('Failed to restore SakhiSetu session.', error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionShopId || sessionShopId === 'demo' || hydratedShopId !== sessionShopId) return;
    let active = true;
    fetch('/api/business-state', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load this shop workspace.');
        return result;
      })
      .then((businessState) => {
        if (!active) return;
        setState(businessState);
        setLocked(Boolean(businessState.profile.pinEnabled));
        setEntryView('dashboard');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to load the SakhiSetu shop workspace.', error);
        setSessionShopId(null);
        setEntryView('welcome');
        notify(error instanceof Error ? error.message : 'Could not load this shop workspace.');
      });
    return () => {
      active = false;
    };
  }, [sessionShopId, hydratedShopId, setState, notify]);

  const setLang = useCallback((newLang) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, language: newLang },
    }));
    if (sessionShopId && sessionShopId !== 'demo') {
      fetch('/api/shop/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state.profile, language: newLang }),
      }).then((response) => {
        if (!response.ok) throw new Error('Could not save language preference.');
      }).catch((error) => {
        console.error('Failed to save language preference.', error);
        notify('Could not save language preference.');
      });
    }
  }, [sessionShopId, state.profile, notify, setState]);

  const pendingSyncCount = useMemo(
    () => state.transactions.filter((t) => !t.synced).length,
    [state.transactions]
  );

  useEffect(() => {
    const updateOnlineStatus = () => setBrowserOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (
      !sessionShopId ||
      sessionShopId === 'demo' ||
      state.offlineMode ||
      !browserOnline ||
      pendingSyncCount === 0
    ) return;

    let active = true;
    queuePendingTransactions(sessionShopId, state.transactions)
      .then(() => syncPendingTransactions(sessionShopId))
      .then((synced) => {
        if (!active || synced.length === 0) return;
        const byUuid = new Map(synced.map((entry) => [entry.clientTxnUuid, entry]));
        setState((previous) => ({
          ...previous,
          transactions: previous.transactions.map((transaction) => {
            const serverRecord = transaction.clientTxnUuid ? byUuid.get(transaction.clientTxnUuid) : undefined;
            return serverRecord
              ? {
                  ...transaction,
                  id: serverRecord.id,
                  amount: serverRecord.amount,
                  costBasis: serverRecord.costBasis,
                  gstAmount: serverRecord.gstAmount,
                  synced: true,
                }
              : transaction;
          }),
        }));
        notify(`${synced.length} offline entr${synced.length === 1 ? 'y' : 'ies'} synced.`);
      })
      .catch((error) => {
        console.error('Failed to sync pending SakhiSetu transactions.', error);
        notify('Some entries are still waiting to sync.');
      });

    return () => {
      active = false;
    };
  }, [
    sessionShopId,
    state.offlineMode,
    state.transactions,
    pendingSyncCount,
    browserOnline,
    setState,
    notify,
  ]);

  const stopSpeaking = useCallback(() => {
    if (speechFallbackTimerRef.current) {
      clearInterval(speechFallbackTimerRef.current);
      speechFallbackTimerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setSpeechProgress(0);
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  const speakText = useCallback(
    (text, messageId = null, forceSpeak = false) => {
      if (!forceSpeak && isVoiceMuted) return;
      stopSpeaking();
      if (!text) return;

      const estimatedMs = Math.max(1800, Math.min(18000, text.length * 68));
      const startedAt = Date.now();

      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
      setSpeechProgress(4);

      speechFallbackTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const pct = Math.min(96, Math.round((elapsed / estimatedMs) * 100));
        setSpeechProgress((prev) => Math.max(prev, pct));
        if (elapsed >= estimatedMs + 1400 && (!('speechSynthesis' in window) || !window.speechSynthesis.speaking)) {
          stopSpeaking();
        }
      }, 120);

      if (!('speechSynthesis' in window)) return;
      try {
        const utter = new SpeechSynthesisUtterance(text);
        const langMeta = LANG_META.find((l) => l.code === lang);
        utter.lang = langMeta?.speechCode || 'en-IN';
        utter.rate = 0.96;
        utter.onstart = () => {
          setIsSpeaking(true);
          setSpeakingMessageId(messageId);
        };
        utter.onboundary = (event) => {
          if (typeof event.charIndex === 'number' && text.length > 0) {
            const boundaryPct = Math.min(98, Math.max(6, Math.round((event.charIndex / text.length) * 100)));
            setSpeechProgress(boundaryPct);
          }
        };
        utter.onend = () => {
          setSpeechProgress(100);
          setTimeout(() => stopSpeaking(), 180);
        };
        utter.onerror = () => stopSpeaking();
        window.speechSynthesis.speak(utter);
      } catch {
        // Fallback timer animates cleanly
      }
    },
    [lang, isVoiceMuted, stopSpeaking]
  );

  const handleNavigateAuth = (mode) => {
    setAuthMode(mode);
    setEntryView('auth');
  };

  const handleQuickDemo = () => {
    if (!import.meta.env.DEV) return;
    setSessionShopId('demo');
    setLocked(false);
    setActivePage('overview');
    setEntryView('dashboard');
  };

  const handleAuthSuccess = async ({ shopId, role }) => {
    setEntryView('loading');
    setSessionShopId(shopId);
    setUserRole(role);
    setActivePage('overview');
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Could not sign out.');
    } catch (error) {
      console.error('Failed to sign out from SakhiSetu.', error);
      notify('Could not sign out. Check your connection and try again.');
      return;
    }
    stopSpeaking();
    setSakhiDrawerOpen(false);
    setSessionShopId(null);
    setUserRole(null);
    setLocked(false);
    setEntryView('welcome');
  };

  const commitTransaction = useCallback(
    (payload) => {
      const record = createTransaction(payload);
      if (sessionShopId === 'demo') record.synced = true;
      setState((prev) => applyTransaction(prev, record));
      notify(`✓ ${record.itemName} (₹${record.amount.toLocaleString('en-IN')})`);
      return record;
    },
    [notify, sessionShopId]
  );

  const handleSakhiSend = async (rawText) => {
    const clean = rawText.trim();
    if (!clean) return;
    const userBubble = { id: `m-${Date.now()}`, role: 'user', text: clean };
    let parsed = parseSakhiIntent(clean, state, metrics);
    if (sessionShopId && sessionShopId !== 'demo' && browserOnline && !state.offlineMode) {
      try {
        const response = await fetch('/api/sakhi/parse', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: clean, language: lang }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Sakhi parsing is unavailable.');
        const extraction = result.extraction;
        if (extraction.intent !== 'question' && extraction.intent !== 'unknown') {
          const type = extraction.intent;
          const qty = Math.max(1, Number(extraction.qty) || 1);
          const amount = Math.max(0, Number(extraction.amount) || 0);
          const itemName = String(extraction.item || clean).trim();
          const matchedProduct = state.products.find(
            (product) => product.name.toLowerCase() === itemName.toLowerCase(),
          );
          const matchedCustomer = state.customers.find(
            (customer) => customer.name.toLowerCase() === String(extraction.party || '').toLowerCase(),
          );
          const paymentMode = ['Cash', 'UPI', 'Udhaar'].includes(extraction.paymentMode)
            ? extraction.paymentMode
            : 'Cash';
          const proposal = {
            type,
            productId: matchedProduct?.id || null,
            itemName: matchedProduct?.name || itemName,
            qty,
            unitPrice: type === 'expense' || type === 'udhaar_repayment' ? amount : amount / qty,
            amount,
            costBasis: matchedProduct ? matchedProduct.costPrice * qty : 0,
            paymentMode,
            customerId: matchedCustomer?.id || null,
            customerName: matchedCustomer?.name || String(extraction.party || 'Walk-in Customer'),
          };
          parsed = {
            kind: 'proposal',
            proposal,
            summary: `Record ${type}: ${qty} × ${proposal.itemName} for ₹${amount} (${paymentMode})`,
          };
        }
      } catch (error) {
        console.error('Sakhi cloud parsing failed; using the local parser.', error);
        notify('AI parsing is unavailable; using offline voice parsing.');
      }
    }

    if (parsed.kind === 'proposal') {
      const botId = `m-${Date.now() + 1}`;
      const botBubble = {
        id: botId,
        role: 'ai',
        text: 'I understood this entry. Confirm below to save it across your ledger & stock:',
        proposal: parsed.proposal,
        summary: parsed.summary,
        confirmed: false,
      };
      setChatHistory((prev) => [...prev, userBubble, botBubble]);
      speakText(parsed.summary, botId);
    } else {
      const botId = `m-${Date.now() + 1}`;
      const botBubble = { id: botId, role: 'ai', text: parsed.message };
      setChatHistory((prev) => [...prev, userBubble, botBubble]);
      speakText(parsed.message, botId);
    }
    setChatInput('');
  };

  const confirmSakhiProposal = (msgId, proposal) => {
    commitTransaction(proposal);
    setChatHistory((prev) => prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m)));
    speakText('Saved! Your sales, stock, and customer balances are updated.', msgId);
  };

  const startMicInput = () => {
    stopSpeaking();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      notify(t('sakhiPlaceholder'));
      return;
    }
    const rec = new SR();
    const langMeta = LANG_META.find((l) => l.code === lang);
    rec.lang = langMeta?.speechCode || 'en-IN';
    rec.interimResults = true;
    rec.onstart = () => {
      setIsListening(true);
      setLiveTranscript('');
    };
    rec.onresult = (e) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      setLiveTranscript(finalText || interim);
      if (finalText.trim()) {
        setIsListening(false);
        setLiveTranscript('');
        handleSakhiSend(finalText);
      }
    };
    rec.onerror = () => {
      setIsListening(false);
      setLiveTranscript('');
    };
    rec.onend = () => {
      setIsListening(false);
      setLiveTranscript('');
    };
    rec.start();
  };

  // Render Welcome Screen or Login / Sign Up Screen before Dashboard
  if (entryView === 'welcome') {
    return (
      <WelcomeLandingView
        lang={lang}
        setLang={setLang}
        t={t}
        onNavigateAuth={handleNavigateAuth}
        onQuickDemo={import.meta.env.DEV ? handleQuickDemo : undefined}
      />
    );
  }

  if (entryView === 'auth') {
    return (
      <AuthScreenView
        mode={authMode}
        setMode={setAuthMode}
        lang={lang}
        setLang={setLang}
        t={t}
        onBackWelcome={() => setEntryView('welcome')}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (entryView === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-sm font-semibold text-[#5B635E]">
        Loading your shop workspace…
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white border border-[#EBE7E0] rounded-2xl max-w-sm w-full p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#146C43] text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            स
          </div>
          <h2 className="text-xl font-bold text-[#1E2421]">{state.profile.shopName}</h2>
          <p className="text-sm text-[#6B726E] mt-1">{t('unlockWorkspaceTitle')}</p>
          <input
            type="password"
            maxLength={4}
            value={pinEntry}
            onChange={(e) => setPinEntry(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="mt-5 w-40 text-center text-2xl tracking-[0.4em] font-bold py-2.5 rounded-xl border border-[#D8D3C8] focus:outline-none focus:border-[#146C43]"
          />
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/pin/verify', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pin: pinEntry }),
                });
                if (response.ok) {
                  setLocked(false);
                  setPinEntry('');
                } else {
                  const result = await response.json();
                  notify(result.error || 'PIN verification failed.');
                }
              } catch (error) {
                console.error('Failed to verify quick-unlock PIN.', error);
                notify('PIN verification is unavailable.');
              }
            }}
            className="mt-5 w-full py-3 rounded-xl bg-[#146C43] text-white font-semibold text-sm hover:bg-[#0F5434] transition"
          >
            {t('unlockBtn')}
          </button>
        </div>
      </div>
    );
  }

  const navRoutes = [
    { id: 'overview', label: t('navOverview'), icon: Home },
    { id: 'transactions', label: t('navTransactions'), icon: Receipt },
    { id: 'inventory', label: t('navInventory'), icon: Package },
    { id: 'customers', label: t('navCustomers'), icon: Users },
    { id: 'insights', label: t('navInsights'), icon: Sparkles, badge: metrics.detectiveSignals.length },
    { id: 'learn', label: t('navLearn'), icon: BookOpen },
  ];

  const firstName = state.profile.ownerName.split(' ')[0];
  const roleLabel = userRole === 'owner'
    ? t('roleOwner')
    : userRole === 'accountant'
      ? t('roleAccountant')
      : userRole === 'staff'
        ? t('roleStaff')
        : t('roleOwner');
  const currentNavLabel =
    activePage === 'overview'
      ? `${t('greeting')}, ${firstName}`
      : activePage === 'settings'
      ? t('navSettings')
      : navRoutes.find((r) => r.id === activePage)?.label;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2421] flex font-sans antialiased">
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E2421] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          {toast}
        </div>
      )}

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64 bg-white border-r border-[#EBE7E0] flex flex-col overflow-hidden transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#146C43] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              स
            </div>
            <div>
              <div className="font-bold text-[17px] text-[#1E2421] leading-tight tracking-tight">
                SakhiSetu
              </div>
              <div className="text-[11px] text-[#7A827E] font-medium mt-0.5">
                {t('brandSubtitle')}
              </div>
            </div>
          </div>

          <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E9591]">
            {t('workspace')}
          </div>

          <nav className="space-y-1">
            {navRoutes.map((route) => {
              const isActive = activePage === route.id;
              const NavIcon = route.icon;
              return (
                <button
                  key={route.id}
                  onClick={() => {
                    setActivePage(route.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] transition ${
                    isActive
                      ? 'bg-[#EAF5EE] text-[#146C43] font-semibold'
                      : 'text-[#4F5652] hover:bg-[#F5F3EE] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <NavIcon
                      className={`w-[18px] h-[18px] ${isActive ? 'text-[#146C43]' : 'text-[#6B726E]'}`}
                    />
                    <span>{route.label}</span>
                  </span>
                  {route.badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#F5E6D3] text-[#9A5B13] text-[11px] font-bold flex items-center justify-center">
                      {route.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 p-4 pb-5 border-t border-[#F0EDE6] bg-white space-y-1">
          <button
            onClick={() => {
              setActivePage('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] transition border ${
              activePage === 'settings'
                ? 'border-[#1E2421] bg-[#FAF8F5] text-[#1E2421] font-semibold'
                : 'border-transparent text-[#4F5652] hover:bg-[#F5F3EE] font-medium'
            }`}
          >
            <Settings className="w-[18px] h-[18px] text-[#6B726E]" />
            <span>{t('navSettings')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium text-red-700 hover:bg-red-50 transition"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>{t('logoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#FAF8F5] border-b border-[#EBE7E0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#4F5652] hover:bg-[#EFECE6]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[14px] font-semibold text-[#1E2421]">{currentNavLabel}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex items-center gap-1.5 text-[13px] font-medium text-[#4F5652]">
              <Globe className="w-4 h-4 text-[#6B726E]" />
              <select
                aria-label="Select Language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent pr-1 py-1 text-[#1E2421] font-medium focus:outline-none cursor-pointer"
              >
                {LANG_META.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (state.offlineMode) {
                  setState((prev) => ({ ...prev, offlineMode: false }));
                  notify(pendingSyncCount ? 'Reconnecting and syncing saved entries…' : t('onlineSynced'));
                } else {
                  setState((prev) => ({ ...prev, offlineMode: true }));
                  notify(t('offlineQueueActive'));
                }
              }}
              title={state.offlineMode ? t('offlineClickSync') : t('onlineSynced')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#EFECE6] transition"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full border ${
                  state.offlineMode
                    ? 'bg-amber-400 border-amber-600'
                    : 'bg-transparent border-[#9AA19D]'
                }`}
              />
              {pendingSyncCount > 0 && (
                <span className="text-[11px] font-bold text-amber-800">{pendingSyncCount}</span>
              )}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="w-9 h-9 rounded-full bg-[#E8C9A9] text-[#5C3D1E] font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-[#D8C1A9] focus:outline-none focus:ring-[#146C43]"
                title={state.profile.ownerName}
                aria-label={t('accountProfileTitle')}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                {firstName.charAt(0)}
              </button>
              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#EBE7E0] bg-white shadow-xl"
                >
                  <div className="border-b border-[#F0EDE6] px-4 py-4">
                    <p className="truncate text-sm font-bold text-[#1E2421]">{state.profile.ownerName}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6B726E]">{state.profile.shopName}</p>
                    <p className="mt-2 text-xs font-medium text-[#146C43]">
                      {roleLabel} · {state.profile.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActivePage('settings');
                      setMobileMenuOpen(false);
                      setProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#37413C] hover:bg-[#F5F3EE]"
                  >
                    <Settings className="h-4 w-4 text-[#6B726E]" />
                    {t('manageProfileBtn')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-[#F0EDE6] px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logoutBtn')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activePage === 'overview' && (
            <OverviewPage
              state={state}
              metrics={metrics}
              t={t}
              lang={lang}
              onOpenSakhi={() => setSakhiDrawerOpen(true)}
              onNavigate={setActivePage}
              onOpenQuickEntry={() => setQuickEntryOpen(true)}
            />
          )}
          {activePage === 'transactions' && (
            <TransactionsPage
              state={state}
              metrics={metrics}
              t={t}
              isDemo={sessionShopId === 'demo'}
              commitTransaction={commitTransaction}
              notify={notify}
            />
          )}
          {activePage === 'inventory' && (
            <InventoryPage
              state={state}
              setState={setState}
              metrics={metrics}
              t={t}
              isDemo={sessionShopId === 'demo'}
              commitTransaction={commitTransaction}
              notify={notify}
            />
          )}
          {activePage === 'customers' && (
            <CustomersUdhaarPage
              state={state}
              setState={setState}
              metrics={metrics}
              t={t}
              isDemo={sessionShopId === 'demo'}
              commitTransaction={commitTransaction}
              notify={notify}
            />
          )}
          {activePage === 'insights' && (
            <AiInsightsPage
              state={state}
              metrics={metrics}
              t={t}
              notify={notify}
              isDemo={sessionShopId === 'demo'}
              canExport={userRole === 'owner' || userRole === 'accountant'}
            />
          )}
          {activePage === 'learn' && <LearnAndSchemesPage t={t} speakText={speakText} />}
          {activePage === 'settings' && (
            <SettingsPage
              state={state}
              setState={setState}
              t={t}
              notify={notify}
              isDemo={sessionShopId === 'demo'}
              canManageStaff={userRole === 'owner'}
              userRole={userRole}
            />
          )}
        </main>
      </div>

      {/* SLIDE-OVER RIGHT DRAWER: SAKHI AI */}
      {sakhiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => {
              stopSpeaking();
              setSakhiDrawerOpen(false);
            }}
            className="flex-1 bg-black/25 backdrop-blur-[1px]"
          />
          <aside className="w-full max-w-md bg-white h-full shadow-2xl border-l border-[#EBE7E0] flex flex-col justify-between">
            <style>{`
              @keyframes sakhiWave {
                0%, 100% { transform: scaleY(0.32); }
                50% { transform: scaleY(1); }
              }
              .sakhi-eq-bar {
                transform-origin: center;
                animation: sakhiWave 0.72s ease-in-out infinite;
              }
            `}</style>

            <div className="px-6 py-4 border-b border-[#F0EDE6] bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E9591]">
                    {t('sakhiEyebrow')}
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="relative flex items-center justify-center">
                      {isSpeaking && (
                        <span className="absolute -inset-1.5 rounded-xl bg-[#6B3FA0]/25 animate-ping" />
                      )}
                      <span
                        className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          isSpeaking
                            ? 'bg-[#6B3FA0] text-white shadow-sm'
                            : 'bg-[#EFE7FA] text-[#6B3FA0]'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </span>
                    </span>
                    <h3 className="font-bold text-lg text-[#1E2421]">Sakhi AI</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMute = !isVoiceMuted;
                      setIsVoiceMuted(nextMute);
                      if (nextMute) stopSpeaking();
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                      isVoiceMuted
                        ? 'bg-[#FAF8F5] border-[#DCD7CD] text-[#7A827E]'
                        : 'bg-[#EAF5EE] border-[#CFE5D6] text-[#146C43]'
                    }`}
                  >
                    {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">
                      {isVoiceMuted ? t('autoVoiceMuted') : t('autoVoiceOn')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      stopSpeaking();
                      setSakhiDrawerOpen(false);
                    }}
                    className="p-2 rounded-lg text-[#6B726E] hover:bg-[#F5F3EE]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isSpeaking && (
                <div className="mt-3 px-3.5 py-2 rounded-xl bg-[#F4EEFB] border border-[#DFCEF4] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-[3px] h-4" aria-hidden="true">
                      {[0, 0.14, 0.28, 0.18, 0.06].map((delay, idx) => (
                        <span
                          key={idx}
                          style={{ animationDelay: `${delay}s` }}
                          className="sakhi-eq-bar w-[3px] h-4 rounded-full bg-[#6B3FA0]"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#5A3388]">{t('sakhiSpeaking')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-[#5A3388] border border-[#D8C5F0] text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <Square className="w-3 h-3 fill-current" /> {t('stopSpeakingBtn')}
                  </button>
                </div>
              )}
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div
                className={`relative overflow-hidden bg-[#EEF6F0] text-[#28382F] p-4 rounded-2xl text-[14px] leading-relaxed border transition ${
                  speakingMessageId === 'greeting'
                    ? 'border-[#6B3FA0] ring-2 ring-[#6B3FA0]/20'
                    : 'border-transparent'
                }`}
              >
                <p>{t('sakhiGreeting')}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span />
                  <button
                    type="button"
                    onClick={() =>
                      speakingMessageId === 'greeting'
                        ? stopSpeaking()
                        : speakText(t('sakhiGreeting'), 'greeting', true)
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#146C43] hover:underline"
                  >
                    {speakingMessageId === 'greeting' ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    {speakingMessageId === 'greeting' ? t('stopSpeakingBtn') : t('listenMsgBtn')}
                  </button>
                </div>
                {speakingMessageId === 'greeting' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#DCEADF]">
                    <div
                      style={{ width: `${speechProgress}%` }}
                      className="h-full bg-[#6B3FA0] transition-all duration-150"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: t('chipRecordSale'), cmd: 'Sold 2 Cotton Saree to Meera for 1700' },
                  { label: t('chipAskProfit'), cmd: 'Ask about profit' },
                  { label: t('chipCheckUdhaar'), cmd: 'Check pending udhaar' },
                  { label: t('chipLowStock'), cmd: 'Check low stock' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSakhiSend(chip.cmd)}
                    className="px-3.5 py-2 rounded-full border border-[#DCD7CD] bg-white hover:bg-[#FAF8F5] text-[13px] font-medium text-[#37413C] transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {chatHistory.map((msg) => {
                const isMsgSpeaking = isSpeaking && speakingMessageId === msg.id;
                const spokenContent = msg.summary || msg.text;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative overflow-hidden max-w-[88%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed transition ${
                        msg.role === 'user'
                          ? 'bg-[#146C43] text-white'
                          : isMsgSpeaking
                          ? 'bg-[#FAF7FD] border border-[#6B3FA0] ring-2 ring-[#6B3FA0]/20 text-[#1E2421]'
                          : 'bg-[#FAF8F5] border border-[#EBE7E0] text-[#1E2421]'
                      }`}
                    >
                      <div>{msg.text}</div>

                      {msg.role === 'ai' && (
                        <div className="mt-2 pt-2 border-t border-[#ECE8E0] flex items-center justify-between gap-3">
                          <span />
                          <button
                            type="button"
                            onClick={() =>
                              isMsgSpeaking ? stopSpeaking() : speakText(spokenContent, msg.id, true)
                            }
                            className={`inline-flex items-center gap-1 text-[11px] font-bold transition ${
                              isMsgSpeaking ? 'text-[#6B3FA0]' : 'text-[#5B635E] hover:text-[#146C43]'
                            }`}
                          >
                            {isMsgSpeaking ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                            {isMsgSpeaking ? t('stopSpeakingBtn') : t('listenMsgBtn')}
                          </button>
                        </div>
                      )}

                      {isMsgSpeaking && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E6D7F7]">
                          <div
                            style={{ width: `${speechProgress}%` }}
                            className="h-full bg-[#6B3FA0] transition-all duration-150"
                          />
                        </div>
                      )}
                    </div>

                    {msg.proposal && (
                      <div className="mt-2 w-full max-w-[90%] bg-white border border-[#D4E6DA] rounded-2xl p-4 shadow-xs space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#146C43]">
                          {t('parsedPreviewEyebrow')}
                        </div>
                        <div className="text-sm font-bold text-[#1E2421]">{msg.summary}</div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-[#5B635E] bg-[#FAF8F5] p-2.5 rounded-xl">
                          <div>{t('typeField')}: <strong className="capitalize">{msg.proposal.type.replace('_', ' ')}</strong></div>
                          <div>{t('amountField')}: <strong>₹{msg.proposal.amount}</strong></div>
                          <div>{t('modeField')}: <strong>{msg.proposal.paymentMode}</strong></div>
                          <div>{t('partyField')}: <strong>{msg.proposal.customerName}</strong></div>
                        </div>
                        {!msg.confirmed ? (
                          <button
                            onClick={() => confirmSakhiProposal(msg.id, msg.proposal)}
                            className="w-full py-2.5 rounded-xl bg-[#146C43] hover:bg-[#0F5434] text-white text-xs font-bold transition"
                          >
                            {t('confirmSaveLedgerBtn')}
                          </button>
                        ) : (
                          <div className="text-xs font-bold text-[#146C43] flex items-center gap-1">
                            <Check className="w-4 h-4" /> {t('savedSyncedLabel')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#F0EDE6] bg-white space-y-2.5">
              {isListening && (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#EAF5EE] border border-[#C6E2CF] flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#146C43] truncate">
                    {liveTranscript ? `"${liveTranscript}"` : t('sakhiListening')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSakhiSend(chatInput);
                }}
                className="flex items-center gap-2 border border-[#DCD7CD] rounded-2xl px-3 py-2 focus-within:border-[#146C43]"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('sakhiPlaceholder')}
                  className="flex-1 bg-transparent text-sm text-[#1E2421] placeholder-[#949B97] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#146C43] hover:bg-[#DCEEE2] flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={startMicInput}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-[#EAF5EE] text-[#146C43] hover:bg-[#DCEEE2]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {quickEntryOpen && (
        <QuickRecordModal
          state={state}
          t={t}
          onClose={() => setQuickEntryOpen(false)}
          commitTransaction={commitTransaction}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-PAGES: OVERVIEW, TRANSACTIONS, INVENTORY, CUSTOMERS, INSIGHTS, LEARN, SETTINGS
// ============================================================================

export default App;
