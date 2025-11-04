import { useEffect, useState, useCallback } from 'react';
import { MiniKit, VerificationLevel, ISuccessResult, MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js';

/**
 * useMiniKit - thin wrapper around official MiniKit-JS
 * Works only inside World App (MiniKit.isInstalled() === true)
 */
export const useMiniKit = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReady(MiniKit.isInstalled());
    } catch (e: any) {
      setReady(false);
      setError(e?.message || 'MiniKit detection failed');
    }
  }, []);

  const verify = useCallback(async (action: string) => {
    if (!MiniKit.isInstalled()) throw new Error('MiniKit is not installed. Open inside World App.');
    const { finalPayload } = await MiniKit.commandsAsync.verify({
      action,
      verification_level: VerificationLevel.Orb,
    });
    return finalPayload as ISuccessResult; // send to /api/verify
  }, []);

  const walletAuth = useCallback(async () => {
    if (!MiniKit.isInstalled()) throw new Error('MiniKit is not installed. Open inside World App.');
    // Generate nonce for wallet auth
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const { finalPayload } = await MiniKit.commandsAsync.walletAuth({ nonce });
    return finalPayload as MiniAppWalletAuthSuccessPayload;
  }, []);

  type PayToken = 'WLD' | 'USDC';

  const pay = useCallback(
    async (
      referenceId: string,
      toAddress: `0x${string}`,
      amount: string,
      token: PayToken = 'WLD'
    ) => {
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Open inside World App.');
      }
      try {
        const { finalPayload } = await MiniKit.commandsAsync.pay({
          reference: referenceId,
          to: toAddress,
          tokens: [token] as any, // ✅ Array format required for v1.x: ['WLD'] or ['USDC'] - using as any due to type mismatch
          amount: String(amount), // ✅ Ensure it's a string
        });
        return finalPayload; // { transaction_id, reference, ... }
      } catch (err: any) {
        console.error('MiniKit pay failed:', err);
        throw new Error('Payment failed: ' + (err?.message || 'unknown'));
      }
    },
    []
  );

  return { ready, error, verify, walletAuth, pay };
};
