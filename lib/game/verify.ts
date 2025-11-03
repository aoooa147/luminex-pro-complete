import { verifyMessage } from 'viem';
export async function verifyScoreSignature(params:{ address:`0x${string}`; payload:{ address:string; score:number; ts:number; nonce:string }; signature:`0x${string}`; }){
  const { address, payload, signature } = params;
  const message = JSON.stringify(payload);
  return await verifyMessage({ address, message, signature });
}
