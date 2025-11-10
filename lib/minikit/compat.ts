import { STAKING_CONTRACT_NETWORK } from '@/lib/utils/constants';

let patched = false;

function toHexValue(v: any): string {
  if (v === undefined || v === null) return '0x0';
  if (typeof v === 'string') return v.startsWith('0x') ? v : ('0x' + BigInt(v).toString(16));
  try { return '0x' + BigInt(v).toString(16); } catch { return '0x0'; }
}

function normalizePayload(payload: any): any {
  // Safety check: if payload is null/undefined, return as is
  if (!payload || typeof payload !== 'object') {
    console.warn('[MiniKit compat] Invalid payload:', payload);
    return payload;
  }

  // New format with actions array - this is the correct format
  if (payload.actions && Array.isArray(payload.actions)) {
    const network = payload.network || STAKING_CONTRACT_NETWORK || 'worldchain';
    // Safety check: ensure actions array is valid
    if (payload.actions.length === 0) {
      console.warn('[MiniKit compat] Empty actions array');
      return { network, actions: [] };
    }
    const actions = payload.actions.map((a: any) => {
      if (!a || typeof a !== 'object') {
        console.warn('[MiniKit compat] Invalid action:', a);
        return null;
      }
      return {
        to: a?.to,
        value: toHexValue(a?.value ?? '0x0'),
        ...(a?.data && a?.data !== '0x' ? { data: a.data } : {}),
      };
    }).filter((a: any) => a !== null); // Remove invalid actions
    return { ...payload, network, actions };
  }

  // Legacy top-level { to, data, value }
  if ((payload as any).to || (payload as any).data !== undefined || (payload as any).value !== undefined) {
    const action: any = {
      to: (payload as any).to,
      value: toHexValue((payload as any).value ?? '0x0'),
    };
    if ((payload as any).data && (payload as any).data !== '0x') action.data = (payload as any).data;
    const network = (payload as any).network || STAKING_CONTRACT_NETWORK || 'worldchain';
    return { network, actions: [action] };
  }

  // Legacy { transaction: { to, data, value } } - single transaction object
  if (payload && typeof (payload as any).transaction === 'object' && !Array.isArray((payload as any).transaction)) {
    const tx: any = (payload as any).transaction;
    if (tx && typeof tx === 'object') {
      const action: any = {
        to: tx?.to,
        value: toHexValue(tx?.value ?? '0x0'),
      };
      if (tx?.data && tx.data !== '0x') action.data = tx.data;
      const network = (payload as any).network || STAKING_CONTRACT_NETWORK || 'worldchain';
      return { network, actions: [action] };
    }
  }

  // Legacy { transactions: [{ to, data, value }, ...] } - array of transactions
  if (Array.isArray((payload as any).transactions)) {
    const arr = (payload as any).transactions as any[];
    if (arr.length === 0) {
      const network = (payload as any).network || STAKING_CONTRACT_NETWORK || 'worldchain';
      return { network, actions: [] };
    }
    const actions = arr
      .map((tx: any) => {
        if (!tx || typeof tx !== 'object') {
          console.warn('[MiniKit compat] Invalid transaction in array:', tx);
          return null;
        }
        return {
          to: tx?.to,
          value: toHexValue(tx?.value ?? '0x0'),
          ...(tx?.data && tx.data !== '0x' ? { data: tx.data } : {}),
        };
      })
      .filter((a: any) => a !== null); // Remove invalid transactions
    const network = (payload as any).network || STAKING_CONTRACT_NETWORK || 'worldchain';
    return { network, actions };
  }

  // If payload already has correct structure but missing network, add it
  if (payload.actions && Array.isArray(payload.actions) && payload.actions.length > 0) {
    const network = payload.network || STAKING_CONTRACT_NETWORK || 'worldchain';
    return { ...payload, network };
  }

  // Unknown format - return as is but log warning
  console.warn('[MiniKit compat] Unknown payload format:', payload);
  return payload;
}

export function applyMiniKitCompatShim() {
  if (typeof window === 'undefined') return;
  try {
    const mk: any = (window as any).MiniKit;
    if (!mk?.commandsAsync?.sendTransaction) return;
    if (patched) return;
    const original = mk.commandsAsync.sendTransaction.bind(mk.commandsAsync);
    mk.commandsAsync.sendTransaction = async function (payload: any) {
      const normalized = normalizePayload(payload);
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MiniKit compat] sendTransaction normalized', {
            hadActions: Array.isArray(payload?.actions),
            hadTopLevel: !!(payload?.to || payload?.data || payload?.value),
            network: normalized?.network,
            actionsLen: Array.isArray(normalized?.actions) ? normalized.actions.length : undefined,
          });
        }
      } catch {}
      return await original(normalized);
    };
    patched = true;
    try { console.log('MiniKit sendTransaction compat shim active'); } catch {}
  } catch (e) {
    // no-op
  }
}
