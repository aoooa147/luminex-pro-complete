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

      // Validate inputs before building payload
      if (!referenceId || typeof referenceId !== 'string' || referenceId.length < 8) {
        throw new Error('Invalid referenceId: must be a non-empty string with at least 8 characters');
      }

      if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
        throw new Error(`Invalid toAddress: must be a valid Ethereum address, got: ${toAddress}`);
      }

      // Check for zero address
      if (toAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid toAddress: cannot use zero address. Please configure NEXT_PUBLIC_TREASURY_ADDRESS correctly.');
      }

      const safeToken = (token || 'WLD') as PayToken;
      const safeAmount = String(amount);

      if (!safeAmount || isNaN(parseFloat(safeAmount)) || parseFloat(safeAmount) <= 0) {
        throw new Error(`Invalid amount: must be a positive number, got: ${safeAmount}`);
      }

      // MiniKit v1.9.8+ requires tokens as TokensPayload array with symbol and token_amount
      const payload = {
        reference: referenceId,
        to: toAddress,
        tokens: [{
          symbol: safeToken, // 'WLD' or 'USDC'
          token_amount: safeAmount // Amount as string
        }],
        description: `Payment of ${safeAmount} ${safeToken}`, // Required in v1.9.8+
      };

      // Log the exact payload being sent to MiniKit SDK
      console.log('🔍 MiniKit PAY payload →', JSON.stringify(payload, null, 2));
      console.log('🔍 MiniKit environment check:', {
        isInstalled: MiniKit.isInstalled(),
        hasCommandsAsync: !!MiniKit.commandsAsync,
        hasPay: !!MiniKit.commandsAsync?.pay,
      });

      try {
        const { finalPayload } = await MiniKit.commandsAsync.pay(payload as any);
        console.log('✅ MiniKit pay succeeded, finalPayload:', finalPayload);
        return finalPayload; // { transaction_id, reference, ... }
      } catch (err: any) {
        console.error('❌ MiniKit pay full error →', {
          message: err?.message,
          description: err?.description,
          error_code: err?.error_code,
          stack: err?.stack,
          fullError: err,
        });
        throw new Error('Payment failed: ' + (err?.message || err?.description || 'unknown'));
      }
    },
    []
  );

  return { ready, error, verify, walletAuth, pay };
};
