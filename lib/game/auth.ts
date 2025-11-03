import { MiniKit, MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js';
export async function walletAuthFlow(nonce?: string): Promise<{ address: string }>{ 
  const finalNonce = nonce || crypto.randomUUID().replace(/-/g, ''); 
  const { finalPayload } = await MiniKit.commandsAsync.walletAuth({ nonce: finalNonce }); 
  const payload = finalPayload as MiniAppWalletAuthSuccessPayload; 
  const address = (payload?.address || '').toLowerCase(); 
  if(!address) throw new Error('wallet address missing'); 
  return { address }; 
}
export async function signMessageWithMiniKit(message: string): Promise<`0x${string}`>{ 
  const { finalPayload } = await MiniKit.commandsAsync.signMessage({ message }); 
  const sig = (finalPayload as any)?.signature as `0x${string}`; 
  if(!sig) throw new Error('signature missing'); 
  return sig; 
}


