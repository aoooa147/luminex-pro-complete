'use client';

/// <reference path="../luminex-unified-app.ts" />
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IDKitWidget } from "@worldcoin/idkit";
import { ethers } from "ethers";
import dynamic from 'next/dynamic';
import { WORLD_APP_ID as ENV_WORLD_APP_ID, WORLD_ACTION as ENV_WORLD_ACTION } from '@/lib/utils/constants';
const MiniKitPanel = dynamic(() => import('@/components/MiniKitPanel'), { ssr: false });
import { 
  Wallet, Shield, Coins, TrendingUp, Settings, Gift, Users, Zap, Lock, Unlock, 
  AlertTriangle, ExternalLink, Copy, Check, Loader2, Clock, Star, Droplet,
  DollarSign, Eye, BarChart3, Flame, Trophy, Award, TrendingDown, Globe, 
  PiggyBank, CreditCard, Gem, Sparkles, Crown, Rocket, DollarSign as DollarIcon,
  Calendar, Timer, TrendingUp as TrendingIcon, Share2, UserPlus, QrCode
} from "lucide-react";

const LOGO_URL = "https://i.postimg.cc/wvJqhSYW/Gemini-Generated-Image-ggu8gdggu8gdggu8-1.png";
const TOKEN_NAME = "LUX";
const TREASURY_ADDRESS = "0xA88674B762f8F99f81f04d34BE450EB19DDBda0f";

// preserved original:
const WORLD_APP_ID /* original: app_0ebc1640de72f393da01afc094665266 */ = (ENV_WORLD_APP_ID || "app_0ebc1640de72f393da01afc094665266");
// preserved original:
const WORLD_ACTION /* original: luminexstaking */ = (ENV_WORLD_ACTION || "luminexstaking");

// Contract addresses - Update these with your deployed contract addresses
const LUX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LUX_TOKEN_ADDRESS || "0x6289D5B756982bbc2535f345D9D68Cb50c853F35";
const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS || "";
const WLD_TOKEN_ADDRESS = "0x163f8C2467924Be0aE7B5347228CABF260318753";

// Optimism Sepolia testnet RPC
const RPC_URL = "https://sepolia.optimism.io";

// ERC20 ABI for balance checking and approvals
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Staking Contract ABI
const STAKING_ABI = [
  // View functions
  "function getUserStakeInfo(address user, uint8 poolId) external view returns (uint256 amount, uint256 lockPeriod, uint256 unlockTime, uint256 pendingRewards, bool isLP)",
  "function getPendingRewards(address user, uint8 poolId) external view returns (uint256)",
  "function totalStakedByUser(address user) external view returns (uint256)",
  "function referralCount(address user) external view returns (uint256)",
  "function stakes(address user, uint8 poolId) external view returns (uint256 amount, uint256 lockPeriod, uint256 startTime, uint256 unlockTime, uint256 lastRewardTime, uint256 accumulatedRewards, uint8 poolId, bool isLP)",
  // Write functions
  "function stake(uint8 poolId, uint256 amount, uint256 lockPeriod) external",
  "function withdraw(uint8 poolId, uint256 amount) external",
  "function claimRewards(uint8 poolId) external",
];

// Language translations
const translations: Record<string, Record<string, string>> = {
  en: {
    // Header
    'appName': 'Luminex Staking',
    'premiumPlatform': 'Premium Staking Platform',
    'yourBalance': 'YOUR BALANCE:',
    
    // Staking tab
    'myCurrentMembership': 'My Current Membership:',
    'noMembership': 'No membership',
    'myStakingBalance': 'My Staking Balance:',
    'earnedInterest': 'Earned Interest:',
    'timeElapsed': 'Time elapsed',
    'staking': 'STAKING',
    'withdrawBalance': 'WITHDRAW BALANCE',
    'withdrawInterest': 'WITHDRAW INTEREST',
    'freeToken': 'FREE LUX HERE',
    
    // Membership tab
    'boostEarnings': '🚀 Boost your earnings! 🚀',
    'upgradeMembership': 'Upgrading your Membership gives you a much higher APY for your Staking ✨',
    'vipMemberships': 'VIP. MEMBERSHIPS',
    
    // Referral tab
    'inviteFriends': 'Invite Friends!',
    'referralDesc': 'Get 50 LUX for each friend you invite',
    'earnTogether': '💰 Earn More Together! 💰',
    'totalReferrals': 'Total Referrals',
    'totalEarnings': 'Total Earnings',
    'yourReferralCode': 'Your Referral Code',
    'shareCode': 'Share this code with friends',
    'shareLink': 'Share Link',
    'showQRCode': 'Show QR Code',
    'howItWorks': 'How It Works',
    'howItWorks1': 'Share your referral code with friends',
    'howItWorks2': 'Get 50 LUX when they sign up',
    'howItWorks3': 'Unlimited referrals!',
    
    // Toast messages
    'insufficientBalance': 'Insufficient balance',
    'noBalanceWithdraw': 'No balance to withdraw',
    'noInterestClaim': 'No interest to claim',
    'paymentFailed': 'Payment failed',
    'successfullyStaked': 'Successfully staked {amount} LUX!',
    'claimedRewards': 'Claimed {amount} LUX rewards!',
    'claimedInterest': 'Claimed {amount} LUX interest!',
    'withdrewBalance': 'Withdrew {amount} LUX!',
    'membershipActivated': '{tier} Membership activated!',
    
    // Footer
    'poweredBy': 'Powered by Worldcoin',
    'termsPrivacy': 'Terms & Privacy',
    
    // World App Required
    'worldAppRequired': 'World App Required',
    'openInWorldApp': 'This Mini App can only be used within the World App. Please open it in World App to continue.',
    'downloadWorldApp': 'Download World App from your app store and search for "Luminex" to find this Mini App.',
    'download': 'Download World App',
    
    // Verification
    'verifyHumanity': 'Verify Humanity',
    'verifyDesc': 'You must verify your humanity to access the application.',
    'verify': 'Verify',
  },
  th: {
    // Header
    'appName': 'Luminex Staking',
    'premiumPlatform': 'แพลตฟอร์มสเตคิ้งพรีเมียม',
    'yourBalance': 'ยอดเงินของคุณ:',
    
    // Staking tab
    'myCurrentMembership': 'สมาชิกภาพปัจจุบันของฉัน:',
    'noMembership': 'ไม่มีสมาชิกภาพ',
    'myStakingBalance': 'ยอดเงินสเตคของฉัน:',
    'earnedInterest': 'ดอกเบี้ยที่ได้รับ:',
    'timeElapsed': 'เวลาที่ผ่านไป',
    'staking': 'สเตค',
    'withdrawBalance': 'ถอนยอดเงิน',
    'withdrawInterest': 'ถอนดอกเบี้ย',
    'freeToken': 'รับ LUX ฟรี',
    
    // Membership tab
    'boostEarnings': '🚀 เพิ่มรายได้ของคุณ! 🚀',
    'upgradeMembership': 'อัปเกรดสมาชิกภาพของคุณเพื่อรับ APY ที่สูงขึ้นสำหรับการสเตคของคุณ ✨',
    'vipMemberships': 'สมาชิกภาพ VIP',
    
    // Referral tab
    'inviteFriends': 'เชิญเพื่อน!',
    'referralDesc': 'รับ 50 LUX สำหรับแต่ละคนที่คุณเชิญ',
    'earnTogether': '💰 ร่วมกันหารายได้มากขึ้น! 💰',
    'totalReferrals': 'เชิญเพื่อนทั้งหมด',
    'totalEarnings': 'รายได้รวม',
    'yourReferralCode': 'รหัสแนะนำของคุณ',
    'shareCode': 'แชร์รหัสนี้กับเพื่อน',
    'shareLink': 'แชร์ลิงก์',
    'showQRCode': 'แสดง QR Code',
    'howItWorks': 'วิธีการทำงาน',
    'howItWorks1': 'แชร์รหัสแนะนำของคุณกับเพื่อน',
    'howItWorks2': 'รับ 50 LUX เมื่อพวกเขาสมัคร',
    'howItWorks3': 'เชิญเพื่อนได้ไม่จำกัด!',
    
    // Toast messages
    'insufficientBalance': 'ยอดเงินไม่เพียงพอ',
    'noBalanceWithdraw': 'ไม่มียอดเงินที่จะถอน',
    'noInterestClaim': 'ไม่มีดอกเบี้ยที่จะรับ',
    'paymentFailed': 'การชำระเงินล้มเหลว',
    'successfullyStaked': 'สเตค {amount} LUX สำเร็จ!',
    'claimedRewards': 'รับ {amount} LUX แล้ว!',
    'claimedInterest': 'รับดอกเบี้ย {amount} LUX แล้ว!',
    'withdrewBalance': 'ถอน {amount} LUX แล้ว!',
    'membershipActivated': 'เปิดใช้งานสมาชิกภาพ {tier} แล้ว!',
    
    // Footer
    'poweredBy': 'ขับเคลื่อนโดย Worldcoin',
    'termsPrivacy': 'ข้อกำหนดและความเป็นส่วนตัว',
    
    // World App Required
    'worldAppRequired': 'ต้องใช้ World App',
    'openInWorldApp': 'แอปพลิเคชันย่อยนี้ใช้งานได้เฉพาะใน World App เท่านั้น กรุณาเปิดใน World App เพื่อใช้งานต่อ',
    'downloadWorldApp': 'ดาวน์โหลด World App จากแอปสโตร์ของคุณและค้นหา "Luminex" เพื่อหาแอปพลิเคชันย่อยนี้',
    'download': 'ดาวน์โหลด World App',
    
    // Verification
    'verifyHumanity': 'ยืนยันความเป็นมนุษย์',
    'verifyDesc': 'คุณต้องยืนยันความเป็นมนุษย์เพื่อเข้าถึงแอปพลิเคชัน',
    'verify': 'ยืนยัน',
  },
  zh: {
    // Header
    'appName': 'Luminex Staking',
    'premiumPlatform': '高级质押平台',
    'yourBalance': '您的余额:',
    
    // Staking tab
    'myCurrentMembership': '我的当前会员:',
    'noMembership': '无会员',
    'myStakingBalance': '我的质押余额:',
    'earnedInterest': '已赚利息:',
    'timeElapsed': '已用时间',
    'staking': '质押',
    'withdrawBalance': '提取余额',
    'withdrawInterest': '提取利息',
    'freeToken': '免费获得 LUX',
    
    // Membership tab
    'boostEarnings': '🚀 提高您的收益！🚀',
    'upgradeMembership': '升级您的会员身份可以获得更高的质押 APY ✨',
    'vipMemberships': 'VIP 会员',
    
    // Referral tab
    'inviteFriends': '邀请朋友！',
    'referralDesc': '每邀请一位朋友即可获得 50 LUX',
    'earnTogether': '💰 一起赚更多！💰',
    'totalReferrals': '总推荐人数',
    'totalEarnings': '总收入',
    'yourReferralCode': '您的推荐代码',
    'shareCode': '与朋友分享此代码',
    'shareLink': '分享链接',
    'showQRCode': '显示二维码',
    'howItWorks': '如何运作',
    'howItWorks1': '与朋友分享您的推荐代码',
    'howItWorks2': '他们注册时您将获得 50 LUX',
    'howItWorks3': '推荐人数无限制！',
    
    // Toast messages
    'insufficientBalance': '余额不足',
    'noBalanceWithdraw': '无余额可提取',
    'noInterestClaim': '无利息可领取',
    'paymentFailed': '支付失败',
    'successfullyStaked': '成功质押 {amount} LUX！',
    'claimedRewards': '已领取 {amount} LUX！',
    'claimedInterest': '已领取 {amount} LUX 利息！',
    'withdrewBalance': '已提取 {amount} LUX！',
    'membershipActivated': '已激活 {tier} 会员！',
    
    // Footer
    'poweredBy': '由 Worldcoin 提供支持',
    'termsPrivacy': '条款和隐私',
    
    // World App Required
    'worldAppRequired': '需要 World App',
    'openInWorldApp': '此小型应用只能在 World App 中使用。请在 World App 中打开它。',
    'downloadWorldApp': '从应用商店下载 World App 并搜索 "Luminex" 查找此小型应用',
    'download': '下载 World App',
    
    // Verification
    'verifyHumanity': '验证人类身份',
    'verifyDesc': '您必须验证人类身份才能访问该应用程序。',
    'verify': '验证',
  },
  ja: {
    // Header
    'appName': 'Luminex Staking',
    'premiumPlatform': 'プレミアムステーキングプラットフォーム',
    'yourBalance': '残高:',
    
    // Staking tab
    'myCurrentMembership': '現在のメンバーシップ:',
    'noMembership': 'メンバーシップなし',
    'myStakingBalance': 'ステーキング残高:',
    'earnedInterest': '獲得した利息:',
    'timeElapsed': '経過時間',
    'staking': 'ステーキング',
    'withdrawBalance': '残高引き出し',
    'withdrawInterest': '利息引き出し',
    'freeToken': 'LUX無料',
    
    // Membership tab
    'boostEarnings': '🚀 収益を増やしましょう！🚀',
    'upgradeMembership': 'メンバーシップをアップグレードすると、ステーキングのAPYが大幅に向上します ✨',
    'vipMemberships': 'VIPメンバーシップ',
    
    // Referral tab
    'inviteFriends': '友人を招待！',
    'referralDesc': '友人1人あたり50 LUXを獲得',
    'earnTogether': '💰 一緒にもっと稼ごう！💰',
    'totalReferrals': '紹介総数',
    'totalEarnings': '総収益',
    'yourReferralCode': '紹介コード',
    'shareCode': 'このコードを友人と共有',
    'shareLink': 'リンクを共有',
    'showQRCode': 'QRコードを表示',
    'howItWorks': '仕組み',
    'howItWorks1': '紹介コードを友人と共有',
    'howItWorks2': '登録で50 LUXを獲得',
    'howItWorks3': '紹介人数に制限なし！',
    
    // Toast messages
    'insufficientBalance': '残高不足',
    'noBalanceWithdraw': '引き出し可能な残高なし',
    'noInterestClaim': '受け取り可能な利息なし',
    'paymentFailed': '支払い失敗',
    'successfullyStaked': '{amount} LUXのステーキング成功！',
    'claimedRewards': '{amount} LUXを受け取りました！',
    'claimedInterest': '{amount} LUXの利息を受け取りました！',
    'withdrewBalance': '{amount} LUXを引き出しました！',
    'membershipActivated': '{tier}メンバーシップが有効化されました！',
    
    // Footer
    'poweredBy': 'Worldcoin提供',
    'termsPrivacy': '利用規約とプライバシー',
    
    // World App Required
    'worldAppRequired': 'World Appが必要です',
    'openInWorldApp': 'このミニアプリはWorld App内でのみ使用できます。続けるにはWorld Appで開いてください。',
    'downloadWorldApp': 'アプリストアからWorld Appをダウンロードし、"Luminex"を検索してください',
    'download': 'World Appをダウンロード',
    
    // Verification
    'verifyHumanity': '人間性を確認',
    'verifyDesc': 'アプリケーションにアクセスするには、人間性を確認する必要があります。',
    'verify': '確認',
  },
  es: {
    // Header
    'appName': 'Luminex Staking',
    'premiumPlatform': 'Plataforma de Staking Premium',
    'yourBalance': 'TU SALDO:',
    
    // Staking tab
    'myCurrentMembership': 'Mi Membresía Actual:',
    'noMembership': 'Sin membresía',
    'myStakingBalance': 'Mi Saldo de Staking:',
    'earnedInterest': 'Interés Ganado:',
    'timeElapsed': 'Tiempo transcurrido',
    'staking': 'STAKING',
    'withdrawBalance': 'RETIRAR SALDO',
    'withdrawInterest': 'RETIRAR INTERÉS',
    'freeToken': 'OBTENER LUX GRATIS',
    
    // Membership tab
    'boostEarnings': '🚀 ¡Aumenta tus ganancias! 🚀',
    'upgradeMembership': 'Actualizar tu Membresía te da un APY mucho más alto para tu Staking ✨',
    'vipMemberships': 'MEMBRESÍAS VIP',
    
    // Referral tab
    'inviteFriends': '¡Invita Amigos!',
    'referralDesc': 'Obtén 50 LUX por cada amigo que invites',
    'earnTogether': '💰 ¡Gana Más Juntos! 💰',
    'totalReferrals': 'Invitaciones Totales',
    'totalEarnings': 'Ganancias Totales',
    'yourReferralCode': 'Tu Código de Referido',
    'shareCode': 'Comparte este código con amigos',
    'shareLink': 'Compartir Enlace',
    'showQRCode': 'Mostrar Código QR',
    'howItWorks': 'Cómo Funciona',
    'howItWorks1': 'Comparte tu código de referido con amigos',
    'howItWorks2': 'Obtén 50 LUX cuando se registren',
    'howItWorks3': '¡Invitaciones ilimitadas!',
    
    // Toast messages
    'insufficientBalance': 'Saldo insuficiente',
    'noBalanceWithdraw': 'Sin saldo para retirar',
    'noInterestClaim': 'Sin interés para reclamar',
    'paymentFailed': 'Pago fallido',
    'successfullyStaked': '¡Hace staking de {amount} LUX exitosamente!',
    'claimedRewards': '¡Reclamaste {amount} LUX!',
    'claimedInterest': '¡Reclamaste {amount} LUX de interés!',
    'withdrewBalance': '¡Retiraste {amount} LUX!',
    'membershipActivated': '¡Membresía {tier} activada!',
    
    // Footer
    'poweredBy': 'Impulsado por Worldcoin',
    'termsPrivacy': 'Términos y Privacidad',
    
    // World App Required
    'worldAppRequired': 'World App Requerido',
    'openInWorldApp': 'Esta Mini App solo puede usarse dentro de World App. Abre en World App para continuar.',
    'downloadWorldApp': 'Descarga World App desde tu tienda de aplicaciones y busca "Luminex"',
    'download': 'Descargar World App',
    
    // Verification
    'verifyHumanity': 'Verificar Humanidad',
    'verifyDesc': 'Debes verificar tu humanidad para acceder a la aplicación.',
    'verify': 'Verificar',
  },
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const POOLS = [
  { id: 0, name: "Flexible", lockDays: 0, apy: 50, icon: Unlock, color: "from-blue-400 to-cyan-400", bgColor: "bg-blue-500/10", desc: "No lock required" },
  { id: 1, name: "30 Days", lockDays: 30, apy: 75, icon: Lock, color: "from-green-400 to-emerald-400", bgColor: "bg-green-500/10", desc: "Lock for 30 days" },
  { id: 2, name: "90 Days", lockDays: 90, apy: 125, icon: Lock, color: "from-purple-400 to-pink-400", bgColor: "bg-purple-500/10", desc: "Lock for 90 days" },
  { id: 3, name: "180 Days", lockDays: 180, apy: 175, icon: Lock, color: "from-orange-400 to-red-400", bgColor: "bg-orange-500/10", desc: "Lock for 180 days" },
  { id: 4, name: "365 Days", lockDays: 365, apy: 325, icon: Lock, color: "from-red-500 to-pink-500", bgColor: "bg-red-500/10", desc: "Maximum APY!" },
];

const MEMBERSHIP_TIERS = [
  { id: 'bronze', name: 'Bronze', apy: 75, price: '1 WLD', color: 'from-amber-700 to-orange-700', icon: '🥉' },
  { id: 'silver', name: 'Silver', apy: 125, price: '5 WLD', color: 'from-slate-400 to-gray-500', icon: '🥈' },
  { id: 'gold', name: 'Gold', apy: 175, price: '10 WLD', color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
  { id: 'platinum', name: 'Platinum', apy: 325, price: '50 WLD', color: 'from-cyan-400 to-blue-400', sparkle: true, icon: '💎' },
  { id: 'diamond', name: 'Diamond', apy: 500, price: '200 WLD', color: 'from-indigo-400 to-purple-500', sparkle: true, icon: '👑' },
];

const useWorldID = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const verifyProof = async () => {
    // World ID verification is handled by IDKitWidget
    // This function is not used but kept for compatibility
    setIsVerifying(true);
    setIsVerified(false);
    setIsVerifying(false);
  };

  return { isVerified, isVerifying, userAddress, verifyProof };
};

const useMiniKit = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [userInfo, setUserInfo] = useState<{ name?: string; username?: string } | null>(null);

  const connectWallet = async () => {
    try {
      // Check if running in World App with MiniKit
      if (typeof window !== 'undefined' && (window as any).MiniKit?.walletAuth) {
        console.log('🔗 Connecting to World App MiniKit wallet...');
        const walletData = await (window as any).MiniKit.walletAuth();
        if (walletData?.address) {
    setWallet({
            address: walletData.address,
            name: walletData.name,
            username: walletData.username 
    });
    setIsConnected(true);
          setUserInfo({
            name: walletData.name,
            username: walletData.username
          });
          
          // Create provider for reading blockchain data
          const rpcProvider = new ethers.JsonRpcProvider(RPC_URL);
          setProvider(rpcProvider);
          
          console.log('✅ Connected to wallet:', walletData.address);
          if (walletData.name || walletData.username) {
            console.log('✅ User info:', { name: walletData.name, username: walletData.username });
          }
        } else {
          console.warn('⚠️ MiniKit walletAuth returned no address');
        }
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Fallback to MetaMask or other Web3 wallets
        // Check if it's actually MetaMask (not other providers like TronLink/Bybit)
        try {
          const ethereum = (window as any).ethereum;
          // Only proceed if it's MetaMask or has isMetaMask property
          if (ethereum.isMetaMask || (ethereum.providers && ethereum.providers.find((p: any) => p.isMetaMask))) {
            console.log('🔗 Connecting to MetaMask...');
            const metaMaskProvider = ethereum.isMetaMask 
              ? ethereum 
              : ethereum.providers.find((p: any) => p.isMetaMask);
            
            try {
              const accounts = await metaMaskProvider.request({ method: 'eth_requestAccounts' });
              if (accounts && accounts.length > 0 && typeof accounts[0] === 'string') {
                setWallet({ address: accounts[0] });
                setIsConnected(true);
                
                const rpcProvider = new ethers.BrowserProvider(metaMaskProvider);
                setProvider(rpcProvider);
                
                console.log('✅ Connected to wallet:', accounts[0]);
              } else {
                console.warn('⚠️ No accounts returned from MetaMask');
              }
            } catch (error: any) {
              // Silent fail for MetaMask - it's optional fallback
              if (error.code === 4001) {
                console.log('ℹ️ User rejected MetaMask connection');
              } else if (error.message?.includes('extension not found') || error.code === 'NO_METAMASK') {
                // MetaMask not installed - silent fail
                console.log('ℹ️ MetaMask extension not found');
              } else {
                console.warn('⚠️ MetaMask connection error (non-critical):', error.message || error);
              }
            }
          } else {
            console.log('ℹ️ Other wallet provider detected, skipping (using World App MiniKit)');
          }
        } catch (error: any) {
          // Catch any errors during provider detection
          console.log('ℹ️ Error detecting wallet provider:', error.message || error);
        }
      } else {
        // No wallet provider - this is fine if using World App MiniKit
        console.log('ℹ️ No external wallet provider (using World App MiniKit)');
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
    }
  };

  const requestPayment = async (params: { amount: string; currency: string; description: string }) => {
    console.log("💳 Payment request:", params);
    
    try {
      const amount = parseFloat(params.amount);
      if (!amount || amount <= 0) {
        return { success: false, error: 'Invalid amount' };
      }

      // Convert amount to wei (WLD uses 18 decimals)
      const amountWei = ethers.parseUnits(amount.toString(), 18);
      
      // Check balance first using provider (for reading)
      if (!provider || !wallet.address) {
        return { success: false, error: 'No provider or wallet address available' };
      }
      
      const wldContractRead = new ethers.Contract(WLD_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await wldContractRead.balanceOf(wallet.address);
      if (balance < amountWei) {
        return { success: false, error: 'Insufficient WLD balance' };
      }

      // Get signer for writing transaction
      const signer = await getSigner();
      if (!signer) {
        return { success: false, error: 'No signer available' };
      }

      // Transfer WLD tokens to treasury address
      console.log(`🔄 Transferring ${amount} WLD to ${TREASURY_ADDRESS}...`);
      
      // For MiniKit, use sendTransaction directly
      if (typeof window !== 'undefined' && (window as any).MiniKit?.commandsAsync?.sendTransaction && !('provider' in signer)) {
        // MiniKit custom signer - use sendTransaction directly
        const tx = await (signer as any).sendTransaction({
          to: WLD_TOKEN_ADDRESS,
          data: wldContractRead.interface.encodeFunctionData('transfer', [TREASURY_ADDRESS, amountWei])
        });
        // MiniKit returns transaction hash directly, wait for confirmation using provider
        const receipt = await provider.waitForTransaction(tx);
        const txHash = receipt?.hash || tx; // Use receipt.hash (ethers v6) or fallback to tx hash
        console.log('✅ Payment successful:', txHash);
        return { 
          success: true, 
          transactionHash: txHash,
          receipt 
        };
      } else {
        // Standard signer (MetaMask)
        const wldContractWrite = new ethers.Contract(WLD_TOKEN_ADDRESS, ERC20_ABI, signer as ethers.Signer);
        const transferTx = await wldContractWrite.transfer(TREASURY_ADDRESS, amountWei);
        const receipt = await transferTx.wait();
      
        const txHash = receipt?.hash || transferTx.hash;
        console.log('✅ Payment successful:', txHash);
  return {
          success: true, 
          transactionHash: txHash,
          receipt 
        };
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      return { success: false, error: error.message || 'Payment failed' };
    }
  };

  // Get signer for writing transactions
  const getSigner = async () => {
    if (typeof window !== 'undefined' && (window as any).MiniKit?.commandsAsync?.sendTransaction) {
      // Return a custom signer for MiniKit
  return {
        sendTransaction: async (tx: any) => {
          return await (window as any).MiniKit!.commandsAsync!.sendTransaction({
            to: tx.to,
            data: tx.data || '0x',
            value: tx.value?.toString() || '0'
          });
        }
      };
    } else if (typeof window !== 'undefined' && (window as any).ethereum && provider) {
      return await (provider as ethers.BrowserProvider).getSigner();
    }
    return null;
  };

  return { wallet, isConnected, connectWallet, requestPayment, provider, userInfo, getSigner };
};

// Optimized formatNumber function with validation
const formatNumber = (num: number, decimals = 2) => {
  // Validate input for better performance
  if (isNaN(num) || !isFinite(num)) return '0.00';
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

const isWorldApp = () => {
  if (typeof window === 'undefined') return false;
  const hasMiniKit = !!(window as any).MiniKit;
  const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
  const looksLikeWorldApp = /WorldApp|MiniApp|WorldAppWebView|WorldAppAndroid|WorldAppIOS/i.test(ua);
  const params = new URLSearchParams(window.location.search);
  const queryOverride = params.has('inapp') || params.get('inapp') === '1';
  const envOverride = (process.env.NEXT_PUBLIC_FORCE_INAPP || '').toString() === 'true';
  return hasMiniKit || looksLikeWorldApp || queryOverride || envOverride;
};

const WorldAppRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20"
    >
      <Globe className="w-16 h-16 text-white mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-white mb-4">World App Required</h1>
      <p className="text-white/80 mb-6">
        This Mini App can only be used within the World App. Please open it in World App to continue.
      </p>
      <div className="bg-white/10 rounded-xl p-4 mb-6">
        <p className="text-sm text-white/70">
          Download World App from your app store and search for "Luminex" to find this Mini App.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl"
        onClick={() => window.open('https://world.org', '_blank')}
      >
        Download World App
      </motion.button>
    </motion.div>
  </div>
);

const WorldIDVerification = ({ onVerify }: { onVerify: () => void }) => {
  const appId = (process.env.NEXT_PUBLIC_WORLD_APP_ID || WORLD_APP_ID) as string;
  const action = (process.env.WORLD_ACTION || WORLD_ACTION) as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
      <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block w-48 h-48">
            <div className="absolute inset-0 blur-2xl bg-purple-500/30 rounded-full"></div>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="w-40 h-40 rounded-full flex items-center justify-center shadow-2xl border-4 border-purple-400/30 overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500">
                <img src={LOGO_URL} alt="Luminex Logo" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            {/* Circuit ring */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="90" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              <motion.circle
                cx="96"
                cy="96"
                r="90"
                fill="none"
                stroke="rgba(244, 114, 182, 0.6)"
                strokeWidth="2.5"
                strokeDasharray="8 4"
                strokeDashoffset="0"
                animate={{ strokeDashoffset: [0, 12] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-black mt-8 bg-gradient-to-r from-white via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tight"
          >
            LUMINEX
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-purple-300 font-bold text-lg tracking-widest uppercase mt-3"
          >
            STAKING PLATFORM
          </motion.p>
        </motion.div>

        {/* Verification Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border border-purple-500/20 shadow-2xl relative overflow-hidden"
        >
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-8">
              <motion.div 
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20"
              >
                <Shield className="w-10 h-10 text-white drop-shadow-lg" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white mb-4 text-center tracking-tight">
              Verify Humanity
            </h2>
            <p className="text-white/80 mb-10 text-center leading-relaxed font-medium">
              You must verify your humanity to access the application.
            </p>

            <IDKitWidget
              app_id={appId}
              action={action}
              handleVerify={async (proof: any) => {
                const urlBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
                console.log('🔄 Sending verification request...', { urlBase, action });
                
                try {
                  const res = await fetch(`${urlBase}/api/verify-worldid`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      proof,
                      merkle_root: proof.merkle_root,
                      nullifier_hash: proof.nullifier_hash,
                      signal: proof.signal || '',
                      action 
                    })
                  });
                  
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `Server error: ${res.status}`);
                  }
                  
                  const data = await res.json();
                  console.log('✅ Verification response:', data);
                  
                  return data;
                } catch (error: any) {
                  console.error('❌ Verification error:', error);
                  throw error;
                }
              }}
              onSuccess={(result: any) => {
                console.log('✅ Verification successful, result:', result);
                
                // Store verified user data from result (returned by handleVerify)
                // handleVerify already stores data in sessionStorage, but we'll use result here too
                if (result?.userAddress || result?.address) {
                  const verifiedAddr = result.userAddress || result.address;
                  console.log('✅ Storing verified user address:', verifiedAddr);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('verifiedAddress', verifiedAddr);
                    if (result.name || result.username) {
                      sessionStorage.setItem('userName', result.name || result.username || '');
                    }
                  }
                }
                
                // Call onVerify callback
            onVerify();
          }}
              onError={(err: any) => {
                try {
                  console.error('World ID (IDKit) error object:', err, typeof err);
                  if (err && typeof err === 'object') {
                    console.error('  code:', err.code, 'detail:', err.detail, 'keys:', Object.keys(err || {}));
                  }
                } catch (_) {}
                const silentCodes = ['max_verifications_reached', 'already_signed'];
                const code = err?.code || '';
                if (typeof window !== 'undefined' && !silentCodes.includes(code)) {
                  const msg = err?.code || err?.detail || 'unknown';
                  alert(`World ID error: ${msg}`);
                }
              }}
            >
              {({ open }: any) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e: any) => {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold py-5 px-8 rounded-2xl flex items-center justify-center space-x-3 shadow-2xl shadow-purple-500/40 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Shield className="w-6 h-6 relative z-10 drop-shadow-md" />
                  <span className="text-xl relative z-10 font-extrabold tracking-wide">Verify</span>
                  <div className="w-2 h-2 bg-white rounded-full relative z-10 animate-pulse shadow-lg"></div>
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"
                  />
        </motion.button>
              )}
            </IDKitWidget>
          </div>
      </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-10"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <p className="text-purple-300 text-sm font-medium">
              Powered by <span className="text-white font-bold">World ID</span>
            </p>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const LuminexApp = () => {
  const [verified, setVerified] = useState(false);
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const { userAddress } = useWorldID();
  const { wallet, isConnected, connectWallet, requestPayment, provider, userInfo, getSigner } = useMiniKit();
  const [activeTab, setActiveTab] = useState<'staking' | 'membership' | 'referral'>('staking');
  const [selectedPool, setSelectedPool] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isClaimingInterest, setIsClaimingInterest] = useState(false);
  const [isShowInput, setIsShowInput] = useState(false);

  const [balance, setBalance] = useState(0);
  const [wldBalance, setWldBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [currentMembership, setCurrentMembership] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [referralCode, setReferralCode] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [language, setLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Memoize translation function to avoid recreating on every render
  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      let text = translations[language]?.[key] || translations['en'][key] || key;
      if (params) {
        Object.keys(params).forEach(param => {
          text = text.replace(`{${param}}`, String(params[param]));
        });
      }
      return text;
    };
  }, [language]);

  // Get the actual address to use (prioritize wallet, then verified address)
  const actualAddress = useMemo(
    () => wallet?.address || verifiedAddress || userAddress || null,
    [wallet?.address, verifiedAddress, userAddress]
  );

  // Refs to track fetch operations (avoids dependency loop)
  const balanceFetchInProgress = React.useRef(false);
  const stakingDataFetchInProgress = React.useRef(false);

  // Memoize formatted numbers to avoid recalculation on every render
  // Ensure all values are numbers and valid before formatting
  const formattedBalance = useMemo(() => {
    const val = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
    return formatNumber(val, 2);
  }, [balance]);
  
  const formattedWldBalance = useMemo(() => {
    const val = typeof wldBalance === 'number' && !isNaN(wldBalance) ? wldBalance : 0;
    return formatNumber(val, 4);
  }, [wldBalance]);
  
  const formattedStakedAmount = useMemo(() => {
    const val = typeof stakedAmount === 'number' && !isNaN(stakedAmount) ? stakedAmount : 0;
    return formatNumber(val, 2);
  }, [stakedAmount]);
  
  const formattedPendingRewards = useMemo(() => {
    const val = typeof pendingRewards === 'number' && !isNaN(pendingRewards) ? pendingRewards : 0;
    return formatNumber(val, 8);
  }, [pendingRewards]);
  
  // Safe referral code - ensure it's always a string
  const safeReferralCode = useMemo(() => {
    return typeof referralCode === 'string' && referralCode.length > 0 ? referralCode : 'LUX000000';
  }, [referralCode]);
  
  // Safe totals - ensure they're always numbers
  const safeTotalReferrals = useMemo(() => {
    return typeof totalReferrals === 'number' && !isNaN(totalReferrals) ? totalReferrals : 0;
  }, [totalReferrals]);
  
  const safeTotalEarnings = useMemo(() => {
    return typeof totalEarnings === 'number' && !isNaN(totalEarnings) ? totalEarnings : 0;
  }, [totalEarnings]);

  // Fetch real balance from blockchain
  const fetchBalance = useCallback(async () => {
    const addressToUse = actualAddress;
    
    if (!provider || !addressToUse || !LUX_TOKEN_ADDRESS) {
      console.log('⚠️ Missing requirements for balance fetch:', { 
        provider: !!provider, 
        address: addressToUse,
        tokenAddress: LUX_TOKEN_ADDRESS 
      });
      // Reset to 0 if requirements not met (not mock data)
      setBalance(0);
      setWldBalance(0);
      return;
    }
    
    // Prevent concurrent calls using ref
    if (balanceFetchInProgress.current) {
      console.log('⏳ Balance fetch already in progress, skipping...');
      return;
    }

    try {
      balanceFetchInProgress.current = true;
      setIsLoadingBalance(true);
      console.log('🔄 Fetching balance from blockchain for:', addressToUse);
      
      const tokenContract = new ethers.Contract(LUX_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(addressToUse);
      const decimals = await tokenContract.decimals();
      
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
      setBalance(balanceFormatted);
      
      console.log('✅ Balance fetched:', balanceFormatted, TOKEN_NAME);
      
      // Fetch WLD balance
      try {
        const wldContract = new ethers.Contract(WLD_TOKEN_ADDRESS, ERC20_ABI, provider);
        const wldBalanceBN = await wldContract.balanceOf(addressToUse);
        const wldDecimals = await wldContract.decimals();
        const wldBalanceFormatted = parseFloat(ethers.formatUnits(wldBalanceBN, wldDecimals));
        setWldBalance(wldBalanceFormatted);
        console.log('✅ WLD Balance fetched:', wldBalanceFormatted);
      } catch (error) {
        console.error('❌ Error fetching WLD balance:', error);
        setWldBalance(0);
      }
      
      setIsLoadingBalance(false);
      balanceFetchInProgress.current = false;
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
      setIsLoadingBalance(false);
      balanceFetchInProgress.current = false;
    }
  }, [provider, actualAddress]); // Removed isLoadingBalance from deps, using ref instead

  // Fetch staking data from blockchain
  const fetchStakingData = useCallback(async () => {
    const addressToUse = actualAddress;
    
    if (!provider || !addressToUse || !STAKING_CONTRACT_ADDRESS) {
      console.log('⚠️ Missing requirements for staking data fetch:', { 
        provider: !!provider, 
        address: addressToUse,
        stakingContract: STAKING_CONTRACT_ADDRESS 
      });
      // Reset to 0 if requirements not met (not mock data)
      if (!STAKING_CONTRACT_ADDRESS) {
        console.warn('⚠️ STAKING_CONTRACT_ADDRESS is not configured! Please set NEXT_PUBLIC_STAKING_ADDRESS environment variable.');
      }
      setStakedAmount(0);
      setPendingRewards(0);
      setTotalReferrals(0);
      setTotalEarnings(0);
      return;
    }

    // Prevent concurrent calls using ref
    if (stakingDataFetchInProgress.current) {
      console.log('⏳ Staking data fetch already in progress, skipping...');
      return;
    }

    try {
      stakingDataFetchInProgress.current = true;
      console.log('🔄 Fetching staking data from blockchain...');
      
      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
      
      // Get total staked amount across all pools
      const totalStaked = await stakingContract.totalStakedByUser(addressToUse);
      const stakedFormatted = parseFloat(ethers.formatUnits(totalStaked, 18));
      setStakedAmount(stakedFormatted);
      
      // Get pending rewards from current selected pool
      const pendingRewardsBN = await stakingContract.getPendingRewards(addressToUse, selectedPool);
      const rewardsFormatted = parseFloat(ethers.formatUnits(pendingRewardsBN, 18));
      setPendingRewards(rewardsFormatted);
      
      // Get stake info to calculate time elapsed
      try {
        const stakeInfo = await stakingContract.getUserStakeInfo(addressToUse, selectedPool);
        if (stakeInfo.startTime && stakeInfo.startTime > 0n) {
          const startTime = Number(stakeInfo.startTime);
          const currentTime = Math.floor(Date.now() / 1000);
          const elapsed = currentTime - startTime;
          
          const days = Math.floor(elapsed / 86400);
          const hours = Math.floor((elapsed % 86400) / 3600);
          const minutes = Math.floor((elapsed % 3600) / 60);
          const seconds = elapsed % 60;
          
          setTimeElapsed({ days, hours, minutes, seconds });
        }
      } catch (error) {
        console.log('Could not fetch stake start time:', error);
      }
      
      // Get referral count
      const referralCountBN = await stakingContract.referralCount(addressToUse);
      const referrals = parseFloat(referralCountBN.toString());
      setTotalReferrals(referrals);
      
      // Calculate total earnings (referrals * 50 LUX)
      const earnings = referrals * 50;
      setTotalEarnings(earnings);
      
      console.log('✅ Staking data fetched:', { 
        staked: stakedFormatted, 
        rewards: rewardsFormatted,
        referrals,
        earnings
      });
      
      stakingDataFetchInProgress.current = false;
    } catch (error) {
      console.error('❌ Error fetching staking data:', error);
      stakingDataFetchInProgress.current = false;
      // If contract doesn't exist or function fails, keep values at 0
    }
  }, [provider, actualAddress, selectedPool]);

  // Debounce function for fetch operations (define before use)
  const debounce = useCallback((fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  // Debounced fetch staking data (avoid rapid consecutive calls)
  const debouncedFetchStakingData = useMemo(
    () => debounce(fetchStakingData, 1000),
    [fetchStakingData, debounce]
  );

  // Debounced fetch balance (avoid rapid consecutive calls)
  const debouncedFetchBalance = useMemo(
    () => debounce(fetchBalance, 1000),
    [fetchBalance, debounce]
  );

  // Fetch staking data when address or pool changes
  useEffect(() => {
    if (!actualAddress || !provider || !STAKING_CONTRACT_ADDRESS) return;
    
    // Initial fetch immediately
    fetchStakingData();
    
    // Refresh staking data every 30 seconds (use debounced version)
    const interval = setInterval(() => {
      debouncedFetchStakingData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [actualAddress, provider, selectedPool, fetchStakingData, debouncedFetchStakingData]);

  useEffect(() => {
    if (!isWorldApp()) return;
    
    // Get verified address from sessionStorage (set by World ID verification)
    if (typeof window !== 'undefined') {
      const verifiedAddr = sessionStorage.getItem('verifiedAddress');
      if (verifiedAddr) {
        setVerifiedAddress(verifiedAddr);
        console.log('✅ Loaded verified address from session:', verifiedAddr);
      }
      const userName = sessionStorage.getItem('userName');
      if (userName) {
        console.log('✅ Loaded user name from session:', userName);
      }
    }
    
    connectWallet();
    
    // Detect user's preferred language from browser
    const browserLang = navigator.language.slice(0, 2);
    if (translations[browserLang]) {
      setLanguage(browserLang);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set referral code from wallet address
  useEffect(() => {
    if (actualAddress && !referralCode) {
      setReferralCode(`LUX${actualAddress.slice(2, 8).toUpperCase()}`);
      console.log('✅ Generated referral code from address:', actualAddress);
    }
  }, [actualAddress, referralCode]);

  // Fetch balance when address is available
  useEffect(() => {
    if (!actualAddress || !provider) return;
    
    // Initial fetch immediately
    fetchBalance();
    
    // Refresh balance every 30 seconds (use debounced version to prevent rapid calls)
    const interval = setInterval(() => {
      debouncedFetchBalance();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [actualAddress, provider, fetchBalance, debouncedFetchBalance]);

  // Close language menu when clicking outside
  useEffect(() => {
    if (!showLanguageMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-menu')) {
        setShowLanguageMenu(false);
      }
    };
    
    // Add event listener after a small delay to avoid immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageMenu]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (stakedAmount > 0) {
        setTimeElapsed(prev => {
          let { seconds, minutes, hours, days } = prev;
          seconds++;
          if (seconds >= 60) { seconds = 0; minutes++; }
          if (minutes >= 60) { minutes = 0; hours++; }
          if (hours >= 24) { hours = 0; days++; }
          return { days, hours, minutes, seconds };
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stakedAmount]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  const handleStake = async () => {
    if (!stakeAmount) {
      setIsShowInput(true);
      return;
    }
    if (!verified || !stakeAmount || !actualAddress) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    if (Number(stakeAmount) > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }
    if (!STAKING_CONTRACT_ADDRESS || !provider) {
      showToast('Staking contract not configured', 'error');
      return;
    }
    
    setIsStaking(true);
    try {
      const amount = Number(stakeAmount);
      const amountWei = ethers.parseUnits(amount.toString(), 18);
      const lockPeriod = POOLS[selectedPool].lockDays * 24 * 60 * 60; // Convert days to seconds

      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Check if signer has provider (standard signer)
      if (!('provider' in signer) || !signer.provider) {
        throw new Error('Staking requires standard wallet connection (use MetaMask)');
      }

      // Get token contract with signer for approval
      const tokenContract = new ethers.Contract(LUX_TOKEN_ADDRESS, ERC20_ABI, signer as ethers.Signer);
      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer as ethers.Signer);

      // Check and approve if needed
      const allowance = await tokenContract.allowance(actualAddress, STAKING_CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        console.log('🔄 Approving token spending...');
        const approveTx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
        console.log('✅ Token approved');
      }

      // Stake tokens
      console.log(`🔄 Staking ${amount} ${TOKEN_NAME} to pool ${selectedPool}...`);
      const stakeTx = await stakingContract.stake(selectedPool, amountWei, lockPeriod);
      await stakeTx.wait();
      console.log('✅ Staking successful');

      // Refresh data after successful transaction
      await Promise.all([
        fetchBalance().catch(err => console.error('Error refreshing balance:', err)),
        fetchStakingData().catch(err => console.error('Error refreshing staking data:', err))
      ]);

      setIsStaking(false);
      setShowStakeModal(false);
      setIsShowInput(false);
      showToast(`Successfully staked ${amount} ${TOKEN_NAME}!`, 'success');
    setStakeAmount('');
    } catch (error: any) {
      console.error('❌ Staking error:', error);
    setIsStaking(false);
      showToast(error?.message || 'Staking failed', 'error');
    }
  };

  const handleClaimRewards = async () => {
    if (pendingRewards === 0) {
      showToast('No rewards to claim', 'error');
      return;
    }
    if (!actualAddress || !STAKING_CONTRACT_ADDRESS || !provider) {
      showToast('Please connect wallet first', 'error');
      return;
    }

    setIsClaiming(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Check if signer has provider (standard signer)
      if (!('provider' in signer) || !signer.provider) {
        throw new Error('Claim rewards requires standard wallet connection (use MetaMask)');
      }

      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer as ethers.Signer);

      console.log(`🔄 Claiming rewards from pool ${selectedPool}...`);
      const claimTx = await stakingContract.claimRewards(selectedPool);
      await claimTx.wait();
      console.log('✅ Rewards claimed');

      // Refresh data after successful transaction
      await Promise.all([
        fetchBalance().catch(err => console.error('Error refreshing balance:', err)),
        fetchStakingData().catch(err => console.error('Error refreshing staking data:', err))
      ]);

    setIsClaiming(false);
      const rewardsValue = typeof pendingRewards === 'number' && !isNaN(pendingRewards) ? pendingRewards : 0;
      showToast(`Claimed ${rewardsValue.toFixed(2)} ${TOKEN_NAME} rewards!`, 'success');
    } catch (error: any) {
      console.error('❌ Claim rewards error:', error);
      setIsClaiming(false);
      showToast(error?.message || 'Claim failed', 'error');
    }
  };

  const handleWithdrawBalance = async () => {
    if (stakedAmount === 0) {
      showToast('No balance to withdraw', 'error');
      return;
    }
    if (!actualAddress || !STAKING_CONTRACT_ADDRESS || !provider) {
      showToast('Please connect wallet first', 'error');
      return;
    }

    setIsWithdrawing(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Check if signer has provider (standard signer)
      if (!('provider' in signer) || !signer.provider) {
        throw new Error('Claim rewards requires standard wallet connection (use MetaMask)');
      }

      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer as ethers.Signer);
      
      // Get user stake info to determine withdrawal amount
      const stakeInfo = await stakingContract.getUserStakeInfo(actualAddress, selectedPool);
      const amountWei = stakeInfo.amount; // Withdraw all staked amount

      if (amountWei === 0n) {
        throw new Error('No staked balance to withdraw');
      }

      console.log(`🔄 Withdrawing from pool ${selectedPool}...`);
      const withdrawTx = await stakingContract.withdraw(selectedPool, amountWei);
      await withdrawTx.wait();
      console.log('✅ Withdrawal successful');

      // Refresh data after successful transaction
      await Promise.all([
        fetchBalance().catch(err => console.error('Error refreshing balance:', err)),
        fetchStakingData().catch(err => console.error('Error refreshing staking data:', err))
      ]);

      setIsWithdrawing(false);
      showToast(`Withdrew ${ethers.formatUnits(amountWei, 18)} ${TOKEN_NAME}!`, 'success');
    } catch (error: any) {
      console.error('❌ Withdraw error:', error);
      setIsWithdrawing(false);
      showToast(error?.message || 'Withdrawal failed', 'error');
    }
  };

  const handleClaimInterest = async () => {
    // Claim interest uses the same claimRewards function
    await handleClaimRewards();
  };

  const handlePurchaseMembership = async (tier: typeof MEMBERSHIP_TIERS[0]) => {
    if (!actualAddress || !provider) {
      showToast('Please connect wallet first', 'error');
      return;
    }

    setIsClaimingInterest(true);
    try {
    const payment = await requestPayment({
        amount: tier.price.split(' ')[0],
      currency: 'WLD',
        description: `Purchase ${tier.name} Membership`
    });
    
    if (payment.success) {
        // Refresh WLD balance after payment
        await fetchBalance();
        
        setCurrentMembership(tier.id);
        showToast(`${tier.name} Membership activated!`, 'success');
      } else {
        showToast(payment.error || 'Payment failed', 'error');
      }
    } catch (error: any) {
      console.error('Membership purchase error:', error);
      showToast(error.message || 'Payment failed', 'error');
    } finally {
      setIsClaimingInterest(false);
    }
  };

  if (!isWorldApp()) return <WorldAppRequired />;
  if (!verified) return <WorldIDVerification onVerify={() => setVerified(true)} />;

  const currentPool = POOLS[selectedPool];
  const baseApy = currentPool.apy;
  const membershipBonus = currentMembership ? MEMBERSHIP_TIERS.find(t => t.id === currentMembership)?.apy || 0 : 0;
  const totalApy = baseApy + membershipBonus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative bg-black/60 backdrop-blur-2xl border-b border-purple-500/20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <button className="text-white hover:text-purple-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img src={LOGO_URL} alt="LUX" className="w-8 h-8 rounded-full ring-2 ring-purple-400/50" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  Luminex Staking
                </h1>
              </div>
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            </div>
            
          {/* User ID & Balance */}
          <div className="mt-3 space-y-2">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl px-3 py-2 flex items-center justify-between backdrop-blur-lg border border-purple-400/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                <span className="text-white text-sm font-medium">
                  {(() => {
                    const userName = userInfo?.name || userInfo?.username;
                    if (userName && typeof userName === 'string') return userName;
                    if (actualAddress && typeof actualAddress === 'string') {
                      return `@${actualAddress.slice(0, 8)}...${actualAddress.slice(-6)}`;
                    }
                    return 'USER';
                  })()}
                  </span>
                </div>
              <div className="relative language-menu">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Language button clicked!');
                    setShowLanguageMenu(!showLanguageMenu);
                  }}
                  className="flex items-center space-x-1 bg-black/40 rounded-lg px-2 py-1 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer z-50 relative"
                  style={{ userSelect: 'none', pointerEvents: 'auto' }}
                >
                  <span className="text-white text-xs font-semibold whitespace-nowrap">
                    {LANGUAGES.find(l => l.code === language)?.flag || '🏳️'} {language.toUpperCase()}
                  </span>
                  <svg className={`w-3 h-3 text-white/70 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Language Dropdown */}
                <AnimatePresence>
                  {showLanguageMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-40 bg-black/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl py-2 z-50"
                    >
                      {LANGUAGES.map((lang) => (
                  <button
                          type="button"
                          key={lang.code}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Language selected:', lang.code);
                            setLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-purple-500/20 transition-colors flex items-center space-x-2 cursor-pointer ${
                            language === lang.code ? 'bg-purple-500/20 text-purple-300' : 'text-white'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                      ))}
                    </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 backdrop-blur-lg border border-white/10">
              <div className="flex items-center text-white">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                  <Wallet className="w-4 h-4" />
          </div>
                <span className="text-xs font-medium">{t('yourBalance')}</span>
        </div>
              <div className="text-right">
                {!actualAddress ? (
                  <div className="text-yellow-400 text-xs">Connect wallet</div>
                ) : isLoadingBalance ? (
                  <div className="flex items-center justify-end space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-purple-400 text-sm">Loading...</span>
      </div>
                ) : (
                  <>
                    <div className="text-pink-400 font-bold text-base">{formattedBalance} {TOKEN_NAME}</div>
                    <div className="text-green-400 font-bold text-xs">{formattedWldBalance} WLD</div>
                  </>
                )}
                  </div>
                </div>
                  </div>
                </div>
                  </div>

      {/* Main Content */}
      <div className="relative max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'staking' && (
              <motion.div
              key="staking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
            {/* Pool Selection */}
              <div className="grid grid-cols-5 gap-2">
                {POOLS.map((pool) => {
                  const Icon = pool.icon;
                  return (
                    <motion.button
                      key={pool.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPool(pool.id)}
                      className={`relative p-2.5 rounded-xl border-2 transition-all overflow-hidden ${
                        selectedPool === pool.id
                          ? 'border-purple-400 bg-gradient-to-br from-purple-500/30 to-pink-500/30 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-black/40 backdrop-blur-lg hover:border-white/20'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${pool.color} opacity-10`}></div>
                      <div className="relative">
                        <i
                          className={`flex justify-center mb-1 ${
                            selectedPool === pool.id ? 'text-purple-300' : 'text-white/60'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </i>
                        <p className="text-white font-bold text-[10px] leading-tight">{pool.name}</p>
                        <p className={`text-[9px] font-semibold mt-0.5 ${selectedPool === pool.id ? 'text-purple-300' : 'text-white/50'}`}>{pool.apy}%</p>
                      </div>
                    </motion.button>
                  );
                })}
            </div>

              {/* Main Staking Card */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-6 text-white overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-transparent animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-3xl font-bold text-center">
                      ✨ <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">Luminex Staking</span> ✨
              </h2>
                  </div>
                  
                  {/* Current Membership */}
                  <div className="mb-4">
                    <p className="text-sm text-white/80 mb-2">{t('myCurrentMembership')}</p>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/20 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/30 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-lg">
                          {currentMembership ? (
                            <span className="flex items-center gap-2">
                              {MEMBERSHIP_TIERS.find(t => t.id === currentMembership)?.icon} {MEMBERSHIP_TIERS.find(t => t.id === currentMembership)?.name}
                            </span>
                          ) : (
                            t('noMembership')
                          )}
                        </span>
                        <span className="text-yellow-300 font-extrabold text-xl">APY {totalApy}%</span>
                  </div>
                    </motion.div>
                </div>

                  {/* Staking Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-white/80 mb-2">{t('myStakingBalance')}</p>
                    <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/30 shadow-lg">
                      {!actualAddress || !STAKING_CONTRACT_ADDRESS ? (
                        <div className="flex items-center justify-center py-4">
                          <span className="text-yellow-400 text-sm text-center">
                            {!actualAddress ? 'Connect wallet to view staking data' : 'Staking contract not configured'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                              <Coins className="w-7 h-7 text-yellow-300" />
                            </div>
                            <span className="text-4xl font-extrabold text-white">{formattedStakedAmount}</span>
                          </div>
                          <TrendingUp className="w-6 h-6 text-green-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Earned Interest */}
                  <div className="mb-4">
                    <p className="text-sm text-white/80 mb-2">{t('earnedInterest')}</p>
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl font-extrabold text-white bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent"
                    >
                      {formattedPendingRewards}
                    </motion.div>
                  </div>

                  {/* Time Elapsed */}
                  <div className="flex items-center space-x-2 text-sm text-white/70 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-lg">
                    <Timer className="w-4 h-4 flex-shrink-0" />
                    <span className="font-mono">{t('timeElapsed')}: {timeElapsed.days}D {timeElapsed.hours}H {timeElapsed.minutes}m {timeElapsed.seconds}s</span>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* STAKING Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowStakeModal(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-3 rounded-2xl flex flex-col items-center space-y-2 shadow-lg shadow-green-500/20 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center space-x-1">
                      <BarChart3 className="w-6 h-6" />
                      <Rocket className="w-4 h-4" />
                    </div>
                    <span className="text-sm relative z-10">{t('staking')}</span>
                  </motion.button>

                  {/* Withdraw Interest */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    onClick={handleClaimInterest}
                    disabled={isClaimingInterest || pendingRewards === 0}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-3 rounded-2xl flex flex-col items-center space-y-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"></div>
                    {isClaimingInterest ? (
                      <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                    ) : (
                      <div className="relative z-10">
                        <DollarIcon className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-sm relative z-10">{t('withdrawInterest')}</span>
                      </motion.button>
                </div>

                {/* Withdraw Balance */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                  onClick={handleWithdrawBalance}
                  disabled={isWithdrawing || stakedAmount === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-3 rounded-2xl flex flex-col items-center space-y-2 disabled:opacity-50 shadow-lg shadow-green-500/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"></div>
                  {isWithdrawing ? (
                    <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                  ) : (
                    <div className="relative z-10">
                      <CreditCard className="w-6 h-6" />
                    </div>
                  )}
                  <span className="text-sm relative z-10">{t('withdrawBalance')}</span>
                      </motion.button>

                {/* Free Token Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-purple-500/30 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Gift className="w-6 h-6 relative z-10" />
                  <span className="text-base relative z-10 font-extrabold">{t('freeToken')}</span>
                  <Sparkles className="w-5 h-5 relative z-10" />
                </motion.button>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'membership' && (
            /* Membership Tab */
            <motion.div
              key="membership"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Boost Illustration */}
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-transparent animate-pulse"></div>
                <div className="relative z-10">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-7xl mb-4"
                  >
                    🍙💪
                  </motion.div>
                  <h1 className="text-4xl font-extrabold text-white mb-3">
                    🚀 Boost your earnings! 🚀
                  </h1>
                  <p className="text-white/90 mb-6 text-lg">Upgrading your Membership gives you a much higher APY for your Staking ✨</p>
                  
                  {/* Current Membership */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/30 shadow-xl inline-block"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {currentMembership && (
                        <span className="text-3xl">
                          {MEMBERSHIP_TIERS.find(t => t.id === currentMembership)?.icon}
                        </span>
                      )}
                      <span className="text-white font-bold text-xl">
                        {currentMembership ? `${MEMBERSHIP_TIERS.find(t => t.id === currentMembership)?.name}` : 'No membership'}
                      </span>
                      <span className="text-yellow-300 font-extrabold text-2xl">: APY {totalApy}%</span>
                    </div>
                  </motion.div>
                </div>
                </div>

              {/* Membership Tiers */}
              <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                      <div>
                    <span className="text-yellow-400 font-bold text-2xl">VIP.</span>
                    <span className="text-white font-bold text-xl ml-2">MEMBERSHIPS</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {MEMBERSHIP_TIERS.map((tier, index) => (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r ${tier.color} bg-opacity-20 border-2 ${
                        currentMembership === tier.id ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-white/20'
                      } backdrop-blur-lg`}
                    >
                      <div className={`flex items-center space-x-3 px-5 py-3 rounded-xl bg-gradient-to-r ${tier.color} shadow-lg`}>
                        <span className="text-3xl">{tier.icon}</span>
                        <div>
                          <div className="text-white font-bold text-lg">{tier.name}</div>
                          <div className="text-white font-extrabold text-xl">
                            APY {tier.apy}%{tier.sparkle && ' ✨'}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePurchaseMembership(tier)}
                        className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all"
                      >
                        ${tier.price}
                      </motion.button>
                    </motion.div>
                  ))}
                    </div>
                  </div>
            </motion.div>
          )}
          
          {activeTab === 'referral' && (
            /* Referral Tab */
            <motion.div
              key="referral"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Hero Section */}
              <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-transparent animate-pulse"></div>
                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="text-7xl mb-4"
                  >
                    🎁🎊
                  </motion.div>
                  <h1 className="text-4xl font-extrabold text-white mb-3">
                    Invite Friends!
                  </h1>
                  <p className="text-white/90 mb-2 text-lg">Get 50 {TOKEN_NAME} for each friend you invite</p>
                  <p className="text-yellow-300 font-bold text-xl">💰 Earn More Together! 💰</p>
                    </div>
                  </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
              <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <UserPlus className="w-8 h-8" />
                  <div>
                      <p className="text-white/80 text-sm">Total Referrals</p>
                      <p className="text-3xl font-extrabold">{safeTotalReferrals}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 text-white"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Coins className="w-8 h-8" />
                  <div>
                      <p className="text-white/80 text-sm">Total Earnings</p>
                      <p className="text-3xl font-extrabold">{safeTotalEarnings}</p>
                  </div>
                </div>
              </motion.div>
              </div>

              {/* Referral Code */}
              <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                  <Share2 className="w-6 h-6" />
                  Your Referral Code
                </h2>
                
                <div className="relative">
              <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl p-5 border-2 border-purple-400/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                        <p className="text-purple-300 text-sm mb-1">Share this code with friends</p>
                        <p className="text-4xl font-extrabold text-white font-mono tracking-wider">{safeReferralCode}</p>
                  </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        {copied ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Copy className="w-6 h-6 text-white" />
                        )}
                      </motion.button>
                </div>
              </motion.div>
                </div>

                {/* Share Buttons */}
                <div className="mt-6 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/30"
                  >
                    <Share2 className="w-6 h-6" />
                    <span>Share Link</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-purple-500/30"
                  >
                    <QrCode className="w-6 h-6" />
                    <span>Show QR Code</span>
                  </motion.button>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-400/30">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift className="w-7 h-7 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">How It Works</h3>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Share your referral code with friends</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Get 50 {TOKEN_NAME} when they sign up</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Unlimited referrals!</span>
                      </li>
                    </ul>
                  </div>
                </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
            </div>

      {/* Stake Modal */}
      <AnimatePresence>
        {showStakeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowStakeModal(false); setIsShowInput(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 w-full max-w-md border border-purple-500/30 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Stake {TOKEN_NAME}</h3>
              {isShowInput && (
                <div className="mb-4">
                  <label className="block text-white/70 text-sm mb-2">Amount to Stake</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-purple-500/50 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 text-lg"
                    />
                    <button
                      onClick={() => setStakeAmount(balance.toString())}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-purple-500/50 text-white text-sm px-3 py-1 rounded-xl hover:bg-purple-500"
                    >
                      MAX
                    </button>
                </div>
                </div>
              )}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowStakeModal(false); setIsShowInput(false); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-2xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStake}
                  disabled={isStaking}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl disabled:opacity-50"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Staking...
                    </>
                  ) : (
                    'Confirm Stake'
                  )}
                </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-purple-500/20 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-around">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('staking')}
            className={`flex flex-col items-center space-y-1 relative ${activeTab === 'staking' ? 'text-white' : 'text-gray-500'}`}
          >
            {activeTab === 'staking' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur"
              />
            )}
            <PiggyBank className="w-6 h-6 relative z-10" />
            <span className="text-xs font-bold relative z-10">Staking</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('membership')}
            className={`flex flex-col items-center space-y-1 relative ${activeTab === 'membership' ? 'text-white' : 'text-gray-500'}`}
          >
            {activeTab === 'membership' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur"
              />
            )}
            <Star className="w-6 h-6 relative z-10" />
            <span className="text-xs font-bold relative z-10">Membership</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('referral')}
            className={`flex flex-col items-center space-y-1 relative ${activeTab === 'referral' ? 'text-white' : 'text-gray-500'}`}
          >
            {activeTab === 'referral' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur"
              />
            )}
            <UserPlus className="w-6 h-6 relative z-10" />
            <span className="text-xs font-bold relative z-10">Referral</span>
          </motion.button>
              </div>
            </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4`}
          >
            <div className={`rounded-2xl p-4 shadow-2xl backdrop-blur-xl border-2 ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 border-green-400/50'
                : 'bg-gradient-to-r from-red-500/90 to-pink-500/90 border-red-400/50'
            }`}>
              <div className="flex items-center space-x-3">
                {toast.type === 'success' ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-white" />
                )}
                <span className="text-white font-semibold flex-1">{toast.message}</span>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for bottom nav */}
      <div className="h-24"></div>

      {/* Worldcoin Footer */}
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>Powered by Worldcoin</span>
        </div>
        <span>Terms & Privacy</span>
      </div>
    </div>
  );
};

export default LuminexApp;

// --- MiniKitPanel bootstrap (non-destructive) ---
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const id = '__minikit_panel__';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        document.body.appendChild(el);
      }
      // use React 18 root
      const { createRoot } = await import('react-dom/client');
      // @ts-ignore
      const root = el.__root || createRoot(el);
      // @ts-ignore
      el.__root = root;
      root.render(<MiniKitPanel />);
    } catch (e) {
      console.error('MiniKitPanel bootstrap error:', e);
    }
  })();
}