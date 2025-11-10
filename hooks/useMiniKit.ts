import { useEffect, useState, useCallback } from 'react';
import { MiniKit, VerificationLevel, ISuccessResult, MiniAppWalletAuthSuccessPayload, tokenToDecimals, Tokens } from '@worldcoin/minikit-js';
import { applyMiniKitCompatShim } from '@/lib/minikit/compat';
import { Interface } from 'ethers';

/**
 * useMiniKit - Enhanced wrapper around official MiniKit-JS
 * Works only inside World App (MiniKit.isInstalled() === true)
 */
export const useMiniKit = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    try {
      // Ensure MiniKit sendTransaction compat patch is applied
      applyMiniKitCompatShim();
      const installed = MiniKit.isInstalled();
      setIsInstalled(installed);
      setReady(installed);
      
      if (!installed) {
        console.warn('⚠️ MiniKit not installed. Please open in World App.');
      }
    } catch (e: any) {
      setReady(false);
      setIsInstalled(false);
      setError(e?.message || 'MiniKit detection failed');
      console.error('MiniKit initialization error:', e);
    }
  }, []);

  const verify = useCallback(async (action: string) => {
    if (!MiniKit.isInstalled()) {
      throw new Error('MiniKit is not installed. Open inside World App.');
    }
    
    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action,
        verification_level: VerificationLevel.Orb,
      });
      return finalPayload as ISuccessResult;
    } catch (error: any) {
      console.error('Verification failed:', error);
      throw new Error(error?.message || 'Verification failed. Please try again.');
    }
  }, []);

  const walletAuth = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      throw new Error('MiniKit is not installed. Open inside World App.');
    }
    
    try {
      // Generate nonce for wallet auth
      const nonce = crypto.randomUUID().replace(/-/g, '');
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({ nonce });
      return finalPayload as MiniAppWalletAuthSuccessPayload;
    } catch (error: any) {
      console.error('Wallet auth failed:', error);
      throw new Error(error?.message || 'Wallet authentication failed. Please try again.');
    }
  }, []);

  type PayToken = 'WLD' | 'USDC';

  const pay = useCallback(
    async (
      referenceId: string,
      toAddress: `0x${string}`,
      amount: string,
      token: PayToken = 'WLD',
      description?: string
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
      
      try {
        // For 0 amount, we still need to send a valid decimal amount (minimum 1 wei)
        const parsedAmount = parseFloat(safeAmount);
        const effectiveAmount = parsedAmount === 0 ? 0.000001 : parsedAmount;
        
        const tokenSymbol = safeToken === 'WLD' ? Tokens.WLD : Tokens.USDC;
        const amountInDecimals = tokenToDecimals(effectiveAmount, tokenSymbol);
        const tokenAmountStr = amountInDecimals.toString();

        const payload = {
          reference: referenceId,
          to: toAddress,
          tokens: [{
            symbol: tokenSymbol,
            token_amount: tokenAmountStr
          }],
          description: description || (parsedAmount === 0 
            ? 'Transaction confirmation (reward will be distributed separately)'
            : `Payment of ${safeAmount} ${safeToken}`),
        };

        console.log('🔍 MiniKit PAY payload →', JSON.stringify(payload, null, 2));
        
        const { finalPayload } = await MiniKit.commandsAsync.pay(payload);
        console.log('✅ MiniKit PAY success →', finalPayload);
        
        return finalPayload;
      } catch (error: any) {
        console.error('❌ MiniKit PAY error:', error);
        
        // Better error handling
        if (error?.message?.includes('cancelled')) {
          throw new Error('Transaction was cancelled');
        } else if (error?.message?.includes('insufficient')) {
          throw new Error('Insufficient balance');
        } else {
          throw new Error(error?.message || 'Payment failed. Please try again.');
        }
      }
    },
    []
  );

  const sendTransaction = useCallback(
    async (
      toAddressOrParams: `0x${string}` | {
        transaction: Array<{
          address: `0x${string}`;
          functionName: string;
          abi: any[];
          args: any[];
        }>;
        network: 'worldchain' | 'optimism';
      },
      data?: string,
      value?: string,
      network?: 'worldchain' | 'optimism'
    ) => {
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Open inside World App.');
      }

      try {
        let payload: { network: 'worldchain' | 'optimism'; actions: Array<{ to: string; value: string; data?: string }> };

        // Support legacy 4-argument format: (toAddress, data, value, network)
        if (typeof toAddressOrParams === 'string') {
          const toAddress = toAddressOrParams;
          const transactionData = data || '0x';
          const transactionValue = value || '0';
          const transactionNetwork = network || 'worldchain';

          if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
            throw new Error(`Invalid contract address: ${toAddress}`);
          }

          // Convert value to hex
          let hexValue = '0x0';
          if (transactionValue && transactionValue !== '0') {
            try {
              hexValue = '0x' + BigInt(transactionValue).toString(16);
            } catch {
              hexValue = '0x0';
            }
          }

          payload = {
            network: transactionNetwork as 'worldchain' | 'optimism',
            actions: [{
              to: toAddress,
              value: hexValue,
              ...(transactionData && transactionData !== '0x' ? { data: transactionData } : {}),
            }],
          };
        } else {
          // New format with transaction array
          const params = toAddressOrParams;
          
          if (!params.transaction || !Array.isArray(params.transaction) || params.transaction.length === 0) {
            throw new Error('Invalid transaction: must provide at least one transaction');
          }

          // Encode transactions using ABI and function name
          const actions = params.transaction.map((tx) => {
            if (!tx.address || !tx.address.startsWith('0x') || tx.address.length !== 42) {
              throw new Error(`Invalid contract address: ${tx.address}`);
            }
            
            if (!tx.functionName || typeof tx.functionName !== 'string') {
              throw new Error('Invalid function name');
            }
            
            if (!tx.abi || !Array.isArray(tx.abi) || tx.abi.length === 0) {
              throw new Error('Invalid ABI: must provide contract ABI');
            }

            try {
              // Encode function data using ethers
              const iface = new Interface(tx.abi);
              const encodedData = iface.encodeFunctionData(tx.functionName, tx.args || []);
              
              return {
                to: tx.address as `0x${string}`,
                value: '0x0',
                data: encodedData,
              };
            } catch (error: any) {
              throw new Error(`Failed to encode transaction for ${tx.functionName}: ${error?.message || 'Unknown error'}`);
            }
          });

          payload = {
            network: params.network,
            actions,
          };
        }

        console.log('📝 Sending transaction:', payload);

        // Use MiniKit.commandsAsync.sendTransaction if available
        if (MiniKit.commandsAsync?.sendTransaction) {
          const result = await MiniKit.commandsAsync.sendTransaction(payload as any);
          console.log('✅ Transaction sent successfully:', result);
          // Return finalPayload with transaction_id for compatibility
          return (result?.finalPayload || result) as any;
        } else {
          throw new Error('sendTransaction is not available in this version of MiniKit');
        }
      } catch (error: any) {
        console.error('❌ Transaction failed:', error);
        
        // Enhanced error handling
        if (error?.message?.includes('cancelled') || error?.type === 'user_cancelled') {
          throw new Error('Transaction was cancelled');
        } else if (error?.message?.includes('insufficient')) {
          throw new Error('Insufficient balance or gas');
        } else if (error?.message?.includes('reverted')) {
          throw new Error('Transaction reverted. Please check your input.');
        } else {
          throw new Error(error?.message || 'Transaction failed. Please try again.');
        }
      }
    },
    []
  );

  const signMessage = useCallback(
    async (message: string) => {
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Open inside World App.');
      }

      try {
        const { finalPayload } = await MiniKit.commandsAsync.signMessage({ message });
        console.log('✅ Message signed successfully');
        return finalPayload;
      } catch (error: any) {
        console.error('❌ Message signing failed:', error);
        throw new Error(error?.message || 'Failed to sign message');
      }
    },
    []
  );

  const signTypedData = useCallback(
    async (typedData: any) => {
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Open inside World App.');
      }

      try {
        const { finalPayload } = await MiniKit.commandsAsync.signTypedData({ typedData } as any);
        console.log('✅ Typed data signed successfully');
        return finalPayload;
      } catch (error: any) {
        console.error('❌ Typed data signing failed:', error);
        throw new Error(error?.message || 'Failed to sign typed data');
      }
    },
    []
  );

  // Get user info (if available)
  const getUserInfo = useCallback(() => {
    if (!MiniKit.isInstalled()) {
      return null;
    }

    try {
      // Check if user info is available in MiniKit
      if ((MiniKit as any).user) {
        return (MiniKit as any).user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }, []);

  return {
    ready,
    error,
    isInstalled,
    verify,
    walletAuth,
    pay,
    sendTransaction,
    signMessage,
    signTypedData,
    getUserInfo,
    MiniKit,
  };
};
