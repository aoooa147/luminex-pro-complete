import { useEffect, useState, useCallback } from 'react';
import { MiniKit, VerificationLevel, ISuccessResult, MiniAppWalletAuthSuccessPayload, tokenToDecimals, Tokens } from '@worldcoin/minikit-js';
import { STAKING_CONTRACT_NETWORK } from '@/lib/utils/constants';

// --- MiniKit sendTransaction compatibility shim ---
// Some parts of the app (or older code) may call MiniKit.commandsAsync.sendTransaction
// with a top-level { to, data, value } payload. New SDK requires { actions: [{...}], network }.
// This shim normalizes any old payloads to the new format, preventing
// "Cannot read properties of undefined (reading 'map')".
let __minikitCompatPatched = false;
function patchMiniKitSendTxCompat() {
  if (typeof window === 'undefined') return;
  try {
    const w: any = window as any;
    const mk = w.MiniKit;
    if (!mk?.commandsAsync?.sendTransaction) return;
    if (__minikitCompatPatched) return;

    const original = mk.commandsAsync.sendTransaction.bind(mk.commandsAsync);

    function toHexValue(v: any): string {
      if (v === undefined || v === null) return '0x0';
      if (typeof v === 'string') return v.startsWith('0x') ? v : ('0x' + BigInt(v).toString(16));
      try { return '0x' + BigInt(v).toString(16); } catch { return '0x0'; }
    }

    function normalizePayload(payload: any): any {
      if (!payload || typeof payload !== 'object') return payload;

      // Already new format
      if (Array.isArray(payload.actions)) {
        const network = payload.network || STAKING_CONTRACT_NETWORK || 'worldchain';
        const actions = payload.actions.map((a: any) => ({
          to: a.to,
          value: toHexValue(a.value ?? '0x0'),
          ...(a.data && a.data !== '0x' ? { data: a.data } : {}),
        }));
        return { ...payload, network, actions };
      }

      // Old format { to, data, value, network? }
      if (payload.to || payload.data || payload.value) {
        const action: any = {
          to: payload.to,
          value: toHexValue(payload.value ?? '0x0'),
        };
        if (payload.data && payload.data !== '0x') action.data = payload.data;
        const network = payload.network || STAKING_CONTRACT_NETWORK || 'worldchain';
        return { network, actions: [action] };
      }

      return payload;
    }

    mk.commandsAsync.sendTransaction = async function (payload: any) {
      const normalized = normalizePayload(payload);
      return await original(normalized);
    };

    __minikitCompatPatched = true;
    // Optional debug log
    try { console.log('MiniKit sendTransaction compatibility shim applied'); } catch {}
  } catch {
    // Silent
  }
}

/**
 * useMiniKit - thin wrapper around official MiniKit-JS
 * Works only inside World App (MiniKit.isInstalled() === true)
 */
export const useMiniKit = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Apply MiniKit compat patch once on mount (browser only)
      patchMiniKitSendTxCompat();
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

      // Allow 0 amount for transaction confirmation (used in game rewards)
      if (!safeAmount || isNaN(parseFloat(safeAmount)) || parseFloat(safeAmount) < 0) {
        throw new Error(`Invalid amount: must be a non-negative number, got: ${safeAmount}`);
      }
      
      // For 0 amount, we still need to send a valid decimal amount (minimum 1 wei)
      // But MiniKit requires at least 0.000001 for display purposes
      const parsedAmount = parseFloat(safeAmount);
      if (parsedAmount === 0) {
        // Use a very small amount (0.000001) for 0-amount transactions
        // This is just for UI display - the actual reward is handled by the contract
        const minAmount = '0.000001';
        console.log('⚠️ Zero amount detected, using minimum amount for MiniKit:', minAmount);
        const tokenSymbol = safeToken === 'WLD' ? Tokens.WLD : Tokens.USDC;
        const amountInDecimals = tokenToDecimals(parseFloat(minAmount), tokenSymbol);
        const tokenAmountStr = amountInDecimals.toString();

        const payload = {
          reference: referenceId,
          to: toAddress,
          tokens: [{
            symbol: tokenSymbol,
            token_amount: tokenAmountStr
          }],
          description: `Transaction confirmation (reward will be distributed separately)`,
        };

        console.log('🔍 MiniKit PAY payload (zero-amount override) →', JSON.stringify(payload, null, 2));
        
        try {
          const { finalPayload } = await MiniKit.commandsAsync.pay(payload as any);
          console.log('✅ MiniKit pay succeeded (zero-amount), finalPayload:', finalPayload);
          return finalPayload;
        } catch (err: any) {
          console.error('❌ MiniKit pay error (zero-amount) →', err);
          throw err;
        }
      }

      // Convert amount to decimals using tokenToDecimals() as per MiniKit documentation
      // WLD has 18 decimals, USDC has 6 decimals
      // Example: tokenToDecimals(1, Tokens.WLD) = 1000000000000000000 (1 * 10^18)
      const tokenSymbol = safeToken === 'WLD' ? Tokens.WLD : Tokens.USDC;
      const amountInDecimals = tokenToDecimals(parseFloat(safeAmount), tokenSymbol);
      const tokenAmountStr = amountInDecimals.toString();

      // MiniKit v1.9.8+ requires tokens as TokensPayload array with symbol and token_amount
      // token_amount MUST be in smallest unit (decimals) as per documentation
      const payload = {
      reference: referenceId,
      to: toAddress,
        tokens: [{
          symbol: tokenSymbol, // Tokens.WLD or Tokens.USDC (enum, not string)
          token_amount: tokenAmountStr // Amount in decimals (e.g., "1000000000000000000" for 1 WLD)
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
          code: err?.code,
          stack: err?.stack,
          fullError: err,
        });
        
        // Detect user cancellation from SDK error
        const msg = String(err?.message || '').toLowerCase();
        const desc = String(err?.description || '').toLowerCase();
        const code = String(err?.code || err?.error_code || '').toLowerCase();
        
        // Case: User cancelled/rejected/closed the payment window
        if (
          code.includes('user_rejected') || 
          code.includes('cancelled') || 
          code.includes('cancel') ||
          msg.includes('cancel') || 
          msg.includes('rejected') ||
          msg.includes('user') ||
          desc.includes('cancel') ||
          desc.includes('rejected')
        ) {
          const e = new Error('user_cancelled');
          (e as any).type = 'user_cancelled';
          (e as any).originalError = err;
          throw e;
        }
        
        throw err;
      }
    },
    []
  );

  /**
   * Send transaction (for contract interactions)
   * This shows "Authorize Transaction" popup instead of "Pay" popup
   * Updated to use MiniKit SDK v1.9.8+ format with transaction array
   */
  const sendTransaction = useCallback(
    async (
      toAddress: `0x${string}`,
      data: string,
      value: string = '0',
      network: string = 'worldchain'
    ) => {
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Open inside World App.');
      }

      if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
        throw new Error(`Invalid toAddress: must be a valid Ethereum address, got: ${toAddress}`);
      }

      // Convert value to hex string if it's not already
      let hexValue = value || '0';
      if (!hexValue.startsWith('0x')) {
        // Convert decimal string to hex
        const numValue = BigInt(hexValue);
        hexValue = '0x' + numValue.toString(16);
      }

      // MiniKit SDK v1.9.8+ requires actions array format (not transaction)
      // For authorization-only transactions (e.g., faucet claims, game rewards)
      // We create a simple action with address, value, and optional data
      const action: any = {
        to: toAddress,
        value: hexValue,
      };
      
      // Only include data if it's provided and not empty
      if (data && data !== '0x' && data.length > 2) {
        action.data = data;
      }

      const payload: any = {
        actions: [action],
      };
      
      // Include network if specified (defaults to worldchain)
      if (network) {
        payload.network = network;
      }

      console.log('🔍 MiniKit sendTransaction payload (new format) →', JSON.stringify(payload, null, 2));
      console.log('🔍 MiniKit environment check:', {
        isInstalled: MiniKit.isInstalled(),
        hasCommandsAsync: !!MiniKit.commandsAsync,
        hasSendTransaction: !!MiniKit.commandsAsync?.sendTransaction,
        network,
      });

      try {
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(payload);
        console.log('✅ MiniKit sendTransaction succeeded, finalPayload:', finalPayload);
        return finalPayload; // { transaction_id, ... }
      } catch (err: any) {
        console.error('❌ MiniKit sendTransaction error →', {
          message: err?.message,
          description: err?.description,
          error_code: err?.error_code,
          code: err?.code,
          stack: err?.stack,
          fullError: err,
          payload,
        });
        
        // Detect user cancellation from SDK error
        const msg = String(err?.message || '').toLowerCase();
        const desc = String(err?.description || '').toLowerCase();
        const code = String(err?.code || err?.error_code || '').toLowerCase();
        
        // Case: User cancelled/rejected/closed the transaction window
        if (
          code.includes('user_rejected') || 
          code.includes('cancelled') || 
          code.includes('cancel') ||
          msg.includes('cancel') || 
          msg.includes('rejected') ||
          msg.includes('user') ||
          desc.includes('cancel') ||
          desc.includes('rejected')
        ) {
          const e = new Error('user_cancelled');
          (e as any).type = 'user_cancelled';
          (e as any).originalError = err;
          throw e;
        }
        
        throw err;
      }
    },
    []
  );

  return { ready, error, verify, walletAuth, pay, sendTransaction };
};
