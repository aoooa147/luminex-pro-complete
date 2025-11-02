import React, { useState } from 'react';
import { useMiniKit } from '../hooks/useMiniKit';
import { WORLD_APP_ID, WORLD_ACTION, TREASURY_ADDRESS, TOKEN_NAME, LOGO_URL, BRAND_NAME } from '../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';

/**
 * MiniKitPanel
 * - Adds Verify / Wallet Auth / Pay→Confirm controls in a collapsible sheet
 * - Purely additive: does not remove/replace any index.tsx code
 */
export default function MiniKitPanel() {
  const { ready, error, verify, walletAuth, pay } = useMiniKit();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(WORLD_ACTION || 'luminexstaking');
  const [amount, setAmount] = useState('0.1');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [logs, set{t('logs')}] = useState<string[]>([]);
  const [result, set{t('result')}] = useState<any>(null);

  const log = (m: string) => set{t('logs')}((old) => [m, ...old].slice(0, 120));

  const genReference = async () => {
    const r = await fetch('/api/initiate-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, symbol: 'WLD' }) });
    const j = await r.json();
    setReference(j.id || '');
    log('Generated reference: ' + (j.id || ''));
  };

  const doVerify = async () => {
    try {
      setBusy(true);
      const payload = await verify(action);
      const r = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, action }) });
      const j = await r.json();
      set{t('result')}(j);
      log('Verify response: ' + JSON.stringify(j));
    } catch (e: any) { log('Verify error: ' + e?.message); }
    finally { setBusy(false); }
  };

  const doWalletAuth = async () => {
    try {
      setBusy(true);
      const payload = await walletAuth();
      const r = await fetch('/api/complete-siwe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }) });
      const j = await r.json();
      set{t('result')}(j);
      log('WalletAuth response: ' + JSON.stringify(j));
    } catch (e: any) { log('WalletAuth error: ' + e?.message); }
    finally { setBusy(false); }
  };

  async function pollConfirm(tx: string, ref: string, max=pollMax, interval=1500) {
    setStep('pending');
    setIsPolling(true);
    setPollDone(false);
    setPollSuccess(false);
    setPollStep(0);
    setIsPolling(true);
    setPollDone(false);
    setPollSuccess(false);
    setPollStep(0);
    for (let i=0;i<max;i++) {
      setPollStep(i+1);
      try {
        const r = await fetch('/api/confirm-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: { transaction_id: tx, reference: ref } }) });
        const j = await r.json();
        if (j?.success && (j?.transaction?.transaction_status === 'confirmed' || j?.transaction?.status === 'confirmed')) {
          log('Polling confirmed: ' + JSON.stringify(j));
          set{t('result')}(j);
          return true;
        }
      } catch(e:any) {
        log('Polling error: ' + e?.message);
      }
      await new Promise(r => setTimeout(r, interval));
    }
    setPollDone(true);
    setIsPolling(false);
    setStep('failed');
    return false;
  }

  const doPay = async () => {
    setStep('initiated');
    try {
      setBusy(true);
      if (!reference) await genReference();
      const payload = await pay(reference, (TREASURY_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000', amount, 'WLD');
      const r = await fetch('/api/confirm-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }) });
      const j = await r.json();
      set{t('result')}(j);
      log('Confirm-payment response: ' + JSON.stringify(j));
    } catch (e: any) { log('Pay error: ' + e?.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      {/* Floating toggle button (non-intrusive) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
        style={{ minHeight: 44 }}
      >
        {open ? '{t('close_panel')}' : '{t('open_panel')}'}
      </button>

      {/* Collapsible sheet */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur">
          <div className="max-w-screen-sm mx-auto p-4 space-y-4 text-white">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="logo" className="h-8 w-8 rounded-xl ring-1 ring-white/10" />
              <div className="text-sm">
                <div className="font-semibold">{BRAND_NAME || 'MiniKit Panel'}</div>
                <div className="opacity-70">App ID: <code>{WORLD_APP_ID || '(set in .env.local)'}</code></div>
                <div className="opacity-70">MiniKit installed? <b>{String(ready)}</b>{error ? ` / error: ${error}` : ''}</div>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-sm">Action
                <input value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Amount ({TOKEN_NAME || 'WLD'})
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2" />
                </label>
                <label className="text-sm">Reference
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="auto-generated" className="mt-1 w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2" />
                </label>
              </div>
            </div>

{/* Stepper UI */}
<div className="w-full mb-2">
  <div className="flex items-center justify-between text-xs text-zinc-400">
    <div className={`flex items-center gap-2 ${step === 'initiated' || step === 'pending' || step === 'confirmed' ? 'text-indigo-300' : ''}`}>1. Initiated</div>
    <div className={`flex items-center gap-2 ${step === 'pending' || step === 'confirmed' ? 'text-indigo-300' : ''}`}>2. Pending</div>
    <div className={`flex items-center gap-2 ${step === 'confirmed' ? 'text-emerald-400' : step === 'failed' ? 'text-rose-400' : ''}`}>3. Confirmed</div>
  </div>
  <div className="relative mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{
        width: step === 'idle' ? '0%' : step === 'initiated' ? '33%' : step === 'pending' ? '66%' : step === 'confirmed' ? '100%' : '100%'
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={`h-2 ${step === 'failed' ? 'bg-rose-500' : 'bg-indigo-500'}`}
    />
  </div>
  <AnimatePresence>
    {step === 'confirmed' && (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-2 text-emerald-400 text-sm font-medium">
        {t('confirmed')}
      </motion.div>
    )}
    {step === 'failed' && (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-2 text-rose-400 text-sm">
        {t('not_confirmed')}
      </motion.div>
    )}
  </AnimatePresence>
</div>

            <div className="flex flex-wrap gap-2">
            {/* Polling UI */}
            {isPolling && (
              <div className="w-full mt-3">
                <p className="text-sm text-zinc-400">{t('polling')}</p>
                <div className="w-full bg-zinc-800 border border-zinc-700 rounded-full h-2 mt-2 overflow-hidden">
                  <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${(pollStep / pollMax) * 100}%` }} />
                </div>
              </div>
            )}
            {pollDone && (
              <div className="w-full mt-3">
                {pollSuccess ? (
                  <div className="text-emerald-400 font-medium">{t('confirmed')}</div>
                ) : (
                  <div className="text-rose-400">{t('not_confirmed')}</div>
                )}
              </div>
            )}
            
              <button disabled={busy} onClick={doVerify} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">{t('verify')}</button>
              <button disabled={busy} onClick={doWalletAuth} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50">{t('wallet_auth')}</button>
              <button disabled={busy} onClick={genReference} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">{t('gen_ref')}</button>
              <button disabled={busy} onClick={doPay} className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50">{t('pay_confirm')}</button>
            </div>

            <div className="grid gap-2">
              <div>
                <div className="text-xs opacity-80 mb-1">{t('logs')}</div>
                <pre className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 min-h-[80px] text-xs overflow-auto">{logs.join('\n')}</pre>
              </div>
              <div>
                <div className="text-xs opacity-80 mb-1">{t('result')}</div>
                <pre className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 min-h-[80px] text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
