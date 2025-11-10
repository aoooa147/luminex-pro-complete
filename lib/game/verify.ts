import { ethers } from 'ethers';

export async function verifyScoreSignature(params: {
  address: `0x${string}`;
  payload: { address: string; score: number; ts: number; nonce: string };
  signature: `0x${string}`;
}) {
  const { address, payload, signature } = params;
  const message = JSON.stringify(payload);
  try {
    const recovered = await ethers.verifyMessage(message, signature);
    return recovered?.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}
