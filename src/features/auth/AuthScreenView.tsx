import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { LANG_META } from '../../i18n/translations';

function AuthScreenView({
  mode,
  setMode,
  lang,
  setLang,
  t,
  onBackWelcome,
  onAuthSuccess,
}) {
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Handloom, Sarees & Boutique');
  const [prefLang, setPrefLang] = useState(lang);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTabSwitch = (nextMode) => {
    setMode(nextMode);
    setOtpSent(false);
    setOtpCode('');
    setErrorMsg('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg(t('authErrPhone'));
      return;
    }
    if (mode === 'signup' && (!ownerName.trim() || !shopName.trim())) {
      setErrorMsg(t('authErrName'));
      return;
    }

    setBusy(true);
    try {
      const endpoint = otpSent ? '/api/auth/otp/verify' : '/api/auth/otp/send';
      const payload = otpSent
        ? {
            phone: cleanPhone,
            code: otpCode,
            ...(mode === 'signup'
              ? { ownerName: ownerName.trim(), shopName: shopName.trim(), category, language: prefLang }
              : {}),
          }
        : { phone: cleanPhone };
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Authentication failed.');

      if (!otpSent) {
        setOtpSent(true);
        return;
      }

      setLang(prefLang);
      await onAuthSuccess({ shopId: result.shopId, role: result.role, preferredLang: prefLang });
    } catch (error) {
      console.error('SakhiSetu OTP authentication failed.', error);
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2421] flex flex-col">
      <header className="w-full border-b border-[#EBE7E0] bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBackWelcome}
            className="text-xs sm:text-sm font-semibold text-[#5B635E] hover:text-[#1E2421] transition"
          >
            {t('welcomeBackBtn')}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#146C43] flex items-center justify-center text-white font-bold text-sm">
              स
            </div>
            <span className="font-bold text-sm text-[#1E2421]">SakhiSetu</span>
          </div>

          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-[#6B726E] absolute left-2.5 pointer-events-none" />
            <select
              aria-label="Select Language"
              value={lang}
              onChange={(event) => {
                setLang(event.target.value);
                setPrefLang(event.target.value);
              }}
              className="pl-7 pr-6 py-1.5 rounded-lg border border-[#DCD7CD] bg-white text-xs font-semibold text-[#1E2421] focus:outline-none focus:border-[#146C43]"
            >
              {LANG_META.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.native}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#EBE7E0] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F1EC] border border-[#EBE7E0]">
            {['login', 'signup'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabSwitch(tab)}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                  mode === tab
                    ? 'bg-white text-[#146C43] shadow-2xs'
                    : 'text-[#6B726E] hover:text-[#1E2421]'
                }`}
              >
                {tab === 'login' ? t('authLoginTab') : t('authSignupTab')}
              </button>
            ))}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E2421]">
              {mode === 'login' ? t('authWelcomeBack') : t('authCreateTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B726E] mt-1 leading-relaxed">
              {otpSent
                ? `Enter the verification code sent to +91 ${phone}.`
                : mode === 'login'
                  ? t('authLoginSub')
                  : t('authCreateSub')}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && !otpSent && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#1E2421] mb-1">
                    {t('authNameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder={t('authNamePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] focus:bg-white focus:border-[#146C43] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2421] mb-1">
                    {t('authShopLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder={t('authShopPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] focus:bg-white focus:border-[#146C43] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2421] mb-1">
                    {t('authCategoryLabel')}
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] focus:bg-white focus:border-[#146C43] focus:outline-none text-sm"
                  >
                    <option value="Handloom, Sarees & Boutique">Handloom & Boutique</option>
                    <option value="Kirana & Daily Essentials">Kirana / Grocery</option>
                    <option value="Beauty & Wellness Parlour">Beauty Parlour</option>
                    <option value="Tiffin & Home Bakery">Tiffin & Food</option>
                    <option value="Handicrafts & Jute">Handicrafts</option>
                  </select>
                </div>
              </>
            )}

            {!otpSent && (
              <div>
                <label className="block text-xs font-bold text-[#1E2421] mb-1">
                  {t('authPhoneLabel')}
                </label>
                <div className="flex items-center rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] focus-within:bg-white focus-within:border-[#146C43] overflow-hidden">
                  <span className="px-3 py-2.5 text-xs font-bold text-[#6B726E] border-r border-[#DCD7CD]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                    placeholder={t('authPhonePlaceholder')}
                    className="w-full px-3 py-2.5 bg-transparent focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {otpSent && (
              <div>
                <label className="block text-xs font-bold text-[#1E2421] mb-1">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  required
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  placeholder="Enter SMS code"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CD] bg-[#FAF8F5] focus:bg-white focus:border-[#146C43] focus:outline-none text-sm tracking-[0.3em]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  className="mt-2 text-xs font-semibold text-[#146C43] underline underline-offset-2"
                >
                  Change phone number
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || (otpSent && otpCode.length < 4)}
              className="w-full py-3 rounded-xl bg-[#146C43] hover:bg-[#0F5434] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition cursor-pointer"
            >
              {busy ? 'Please wait…' : otpSent ? 'Verify and continue' : 'Send verification code'}
            </button>
          </form>

          {otpSent && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOtpSent(false);
                setOtpCode('');
                setErrorMsg('');
              }}
              className="w-full text-xs font-semibold text-[#6B726E] hover:text-[#1E2421]"
            >
              Send a new code
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default AuthScreenView;
