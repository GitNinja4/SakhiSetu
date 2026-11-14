import React, { useState } from 'react';
import { LANG_META } from '../../i18n/translations';

function SettingsPage({ state, setState, t, notify, isDemo, canManageStaff, userRole }) {
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteBusy, setInviteBusy] = useState(false);
  const canEditShop = canManageStaff || isDemo;
  const roleLabel = userRole === 'owner'
    ? t('roleOwner')
    : userRole === 'accountant'
      ? t('roleAccountant')
      : userRole === 'staff'
        ? t('roleStaff')
        : t('roleOwner');

  const updateProfile = (key, value) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  };

  const saveProfile = async () => {
    if (isDemo) {
      notify('Demo profile updated.');
      return;
    }
    setProfileBusy(true);
    try {
      const response = await fetch('/api/shop/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save shop settings.');
      notify('Shop settings saved.');
    } catch (error) {
      console.error('Failed to save shop settings.', error);
      notify(error instanceof Error ? error.message : 'Could not save shop settings.');
    } finally {
      setProfileBusy(false);
    }
  };

  const updatePin = async () => {
    setPinBusy(true);
    try {
      const response = await fetch('/api/auth/pin/set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not set PIN.');
      setState((prev) => ({ ...prev, profile: { ...prev.profile, pinEnabled: true } }));
      setPin('');
      notify('Quick-unlock PIN enabled.');
    } catch (error) {
      console.error('Failed to update quick-unlock PIN.', error);
      notify(error instanceof Error ? error.message : 'Could not set PIN.');
    } finally {
      setPinBusy(false);
    }
  };

  const disablePin = async () => {
    setPinBusy(true);
    try {
      const response = await fetch('/api/auth/pin', {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not disable PIN.');
      setState((prev) => ({ ...prev, profile: { ...prev.profile, pinEnabled: false } }));
      notify('Quick-unlock PIN disabled.');
    } catch (error) {
      console.error('Failed to disable quick-unlock PIN.', error);
      notify(error instanceof Error ? error.message : 'Could not disable PIN.');
    } finally {
      setPinBusy(false);
    }
  };

  const inviteStaff = async (event) => {
    event.preventDefault();
    setInviteBusy(true);
    try {
      const response = await fetch('/api/staff/invites', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: invitePhone, role: inviteRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not invite staff member.');
      setInvitePhone('');
      notify('Invitation code sent by SMS.');
    } catch (error) {
      console.error('Failed to invite a staff member.', error);
      notify(error instanceof Error ? error.message : 'Could not invite staff member.');
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2421]">{t('settingsTitle')}</h1>
        <p className="text-sm text-[#6B726E] mt-1">{t('settingsSub')}</p>
      </div>

      <section className="rounded-2xl border border-[#EBE7E0] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF5EE] text-xl font-bold text-[#146C43]">
              {state.profile.ownerName.trim().charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1E2421]">{t('accountProfileTitle')}</h2>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#37413C]">{state.profile.ownerName}</p>
              <p className="mt-1 break-all text-xs text-[#6B726E]">
                {t('verifiedMobileLabel')}: {state.profile.phone || '—'}
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-[#EAF5EE] px-3 py-1 text-xs font-bold text-[#146C43]">
            {roleLabel}
          </span>
        </div>
        <p className="mt-4 border-t border-[#F0EDE6] pt-3 text-xs leading-relaxed text-[#6B726E]">
          {t('profilePhoneNote')}
        </p>
      </section>

      <section className="rounded-2xl border border-[#EBE7E0] bg-white p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-bold text-base text-[#1E2421]">{t('shopDetailsTitle')}</h2>
          <p className="mt-1 text-xs text-[#6B726E]">{t('businessProfileTitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-owner-name" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('ownerNameLabel')}</label>
            <input
              id="settings-owner-name"
              type="text"
              value={state.profile.ownerName}
              onChange={(event) => updateProfile('ownerName', event.target.value)}
              disabled={!canEditShop}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm disabled:bg-[#F5F3EE] disabled:text-[#6B726E]"
            />
          </div>
          <div>
            <label htmlFor="settings-shop-name" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('shopNameLabel')}</label>
            <input
              id="settings-shop-name"
              type="text"
              value={state.profile.shopName}
              onChange={(event) => updateProfile('shopName', event.target.value)}
              disabled={!canEditShop}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm disabled:bg-[#F5F3EE] disabled:text-[#6B726E]"
            />
          </div>
          <div>
            <label htmlFor="settings-shop-category" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('shopCategoryLabel')}</label>
            <select
              id="settings-shop-category"
              value={state.profile.category}
              onChange={(event) => updateProfile('category', event.target.value)}
              disabled={!canEditShop}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] bg-white text-sm disabled:bg-[#F5F3EE]"
            >
              <option value="Handloom, Sarees & Boutique">Handloom & Boutique</option>
              <option value="Kirana & Daily Essentials">Kirana / Grocery</option>
              <option value="Beauty & Wellness Parlour">Beauty Parlour</option>
              <option value="Tiffin & Home Bakery">Tiffin & Food</option>
              <option value="Handicrafts & Jute">Handicrafts</option>
            </select>
          </div>
          <div>
            <label htmlFor="settings-upi-id" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('merchantUpiLabel')}</label>
            <input
              id="settings-upi-id"
              type="text"
              autoComplete="off"
              value={state.profile.upiId}
              onChange={(event) => updateProfile('upiId', event.target.value)}
              disabled={!canEditShop}
              placeholder="name@bank"
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm disabled:bg-[#F5F3EE] disabled:text-[#6B726E]"
            />
          </div>
          <div>
            <label htmlFor="settings-gstin" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('gstinLabel')}</label>
            <input
              id="settings-gstin"
              type="text"
              autoComplete="off"
              value={state.profile.gstin}
              onChange={(event) => updateProfile('gstin', event.target.value.toUpperCase())}
              disabled={!canEditShop}
              maxLength={32}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm uppercase disabled:bg-[#F5F3EE] disabled:text-[#6B726E]"
            />
          </div>
          <div>
            <label htmlFor="settings-udyam-number" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('udyamLabel')}</label>
            <input
              id="settings-udyam-number"
              type="text"
              autoComplete="off"
              value={state.profile.udyamNo}
              onChange={(event) => updateProfile('udyamNo', event.target.value.toUpperCase())}
              disabled={!canEditShop}
              maxLength={48}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] text-sm uppercase disabled:bg-[#F5F3EE] disabled:text-[#6B726E]"
            />
          </div>
          <div>
            <label htmlFor="settings-language" className="text-xs font-semibold text-[#5B635E] block mb-1">{t('languageLabel')}</label>
            <select
              id="settings-language"
              value={state.profile.language}
              onChange={(event) => updateProfile('language', event.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DCD7CD] bg-white text-sm"
            >
              {LANG_META.map((language) => (
                <option key={language.code} value={language.code}>{language.native}</option>
              ))}
            </select>
          </div>
        </div>
        {!canEditShop && (
          <p className="rounded-xl bg-[#FAF8F5] p-3 text-xs leading-relaxed text-[#6B726E]">
            {t('ownerOnlyProfileNote')}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveProfile}
            disabled={profileBusy || !canEditShop}
            className="px-4 py-2 rounded-xl bg-[#146C43] text-white text-xs font-bold disabled:opacity-60"
          >
            {profileBusy ? 'Saving…' : t('saveProfileBtn')}
          </button>
        </div>
      </section>

      {canManageStaff && !isDemo && (
        <form onSubmit={inviteStaff} className="bg-white rounded-2xl border border-[#EBE7E0] p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#1E2421]">Shop team</h3>
            <p className="text-xs text-[#6B726E] mt-1">Invite a helper or accountant with verified SMS access.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={invitePhone}
              onChange={(event) => setInvitePhone(event.target.value.replace(/\D/g, ''))}
              placeholder="+91 mobile number"
              className="flex-1 p-2.5 rounded-xl border border-[#DCD7CD] text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              className="p-2.5 rounded-xl border border-[#DCD7CD] text-sm bg-white"
            >
              <option value="staff">Helper — record sales</option>
              <option value="accountant">Accountant</option>
            </select>
            <button
              type="submit"
              disabled={inviteBusy || invitePhone.length !== 10}
              className="px-4 py-2 rounded-xl bg-[#146C43] text-white text-xs font-bold disabled:opacity-60"
            >
              {inviteBusy ? 'Sending…' : 'Invite'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6 space-y-4">
        <h3 className="font-bold text-base text-[#1E2421]">{t('securityOfflineTitle')}</h3>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE7E0]">
          <div>
            <div className="text-sm font-bold text-[#1E2421]">{t('pinLockTitle')}</div>
            <div className="text-xs text-[#6B726E]">
              {state.profile.pinEnabled ? 'PIN is securely stored on the server.' : t('pinLockSub')}
            </div>
          </div>
          {state.profile.pinEnabled ? (
            <button
              type="button"
              onClick={disablePin}
              disabled={pinBusy}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EBE7E0] text-[#37413C] disabled:opacity-60"
            >
              Disable PIN
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                aria-label="Quick-unlock PIN"
                placeholder="4-digit PIN"
                className="w-28 px-3 py-2 rounded-lg border border-[#DCD7CD] text-sm tracking-widest"
              />
              <button
                type="button"
                onClick={updatePin}
                disabled={pinBusy || pin.length !== 4}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#146C43] text-white disabled:opacity-60"
              >
                {pinBusy ? 'Saving…' : 'Set PIN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
