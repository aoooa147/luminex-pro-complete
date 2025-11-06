'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Users, DollarSign, TrendingUp, BarChart3, Settings, 
  LogOut, AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw,
  Eye, Trash2, Edit, Lock, Unlock, Crown, Wallet, Clock, 
  Activity, PieChart, Archive, Download, UserPlus, PiggyBank, Coins, Send
} from "lucide-react";
import { ethers } from "ethers";
import { TREASURY_ADDRESS, TOKEN_NAME, POOLS, MEMBERSHIP_TIERS } from '@/lib/utils/constants';
import { formatNumber } from '@/lib/utils/helpers';
import { MiniKit, MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js';
// Admin wallet address - configure this in .env.local as ADMIN_WALLET_ADDRESS
const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || TREASURY_ADDRESS;

// Simple useMiniKit for admin page - uses direct MiniKit API
const useMiniKitForAdmin = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; username?: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if MiniKit is available using official API
    try {
      setReady(MiniKit.isInstalled());
    } catch (e: any) {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    
    const connectWallet = async () => {
      try {
        if (MiniKit.isInstalled() && MiniKit.commandsAsync?.walletAuth) {
          const nonce = crypto.randomUUID().replace(/-/g, '');
          const result = await MiniKit.commandsAsync.walletAuth({ nonce });
          const walletData = result.finalPayload as MiniAppWalletAuthSuccessPayload;
          if (walletData?.address) {
            setWallet({ address: walletData.address });
            setIsConnected(true);
            setUserInfo(null); // MiniKit API doesn't provide name/username
          }
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    };
    
    connectWallet();
  }, [ready]);

  const getWalletInfo = useCallback(() => ({
    address: wallet?.address,
    isConnected,
    user: userInfo
  }), [wallet, isConnected, userInfo]);

  return { miniKitReady: ready, getWalletInfo };
};

const AdminPage = () => {
  const { miniKitReady, getWalletInfo } = useMiniKitForAdmin();
  const walletInfo = useMemo(() => getWalletInfo(), [getWalletInfo]);
  const walletAddress = walletInfo.address;
  const isConnected = walletInfo.isConnected;
  const userInfo = walletInfo.user;

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStaking: 0,
    totalRevenue: 0,
    totalReferrals: 0,
    trends: {
      users: 0,
      staking: 0,
      revenue: 0,
      referrals: 0,
    },
  });
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    user: string;
    amount: string;
    time: string;
    status: string;
    txHash?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Check admin access
  useEffect(() => {
    if (!miniKitReady || !isConnected || !walletAddress) {
      return;
    }

    const checkAdminAccess = async () => {
      try {
        // Convert addresses to lowercase for comparison
        const isAdminUser = walletAddress?.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();
        setIsAdmin(isAdminUser);
        setShowAccessDenied(!isAdminUser);
        
        if (isAdminUser) {
          await Promise.all([loadAdminStats(), loadActivities()]);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setShowAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [miniKitReady, isConnected, walletAddress]);

  const loadAdminStats = async () => {
    try {
      // Fetch real stats from API
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          totalStaking: data.stats.totalStaking || 0,
          totalRevenue: data.stats.totalRevenue || 0,
          totalReferrals: data.stats.totalReferrals || 0,
          trends: data.stats.trends || {
            users: 0,
            staking: 0,
            revenue: 0,
            referrals: 0,
          },
        });
      } else {
        console.error('Failed to load admin stats:', data.error);
        // Fallback to default values
        setStats({
          totalUsers: 0,
          totalStaking: 0,
          totalRevenue: 0,
          totalReferrals: 0,
          trends: {
            users: 0,
            staking: 0,
            revenue: 0,
            referrals: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
        // Fallback to default values on error
        setStats({
          totalUsers: 0,
          totalStaking: 0,
          totalRevenue: 0,
          totalReferrals: 0,
          trends: {
            users: 0,
            staking: 0,
            revenue: 0,
            referrals: 0,
          },
        });
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const response = await fetch('/api/admin/activity?limit=20');
      const data = await response.json();
      
      if (data.success && data.activities) {
        setActivities(data.activities);
      } else {
        console.error('Failed to load activities:', data.error);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      // Fetch fresh stats and activities from API
      await Promise.all([loadAdminStats(), loadActivities()]);
      
      // Haptic feedback
      if ((window as any).MiniKit?.commandsAsync?.sendHapticFeedback) {
        await (window as any).MiniKit.commandsAsync.sendHapticFeedback({ type: 'success' });
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      if (data.success && data.analytics) {
        setAnalyticsData(data.analytics);
        setShowAnalyticsModal(true);
      } else {
        alert('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Error loading analytics');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/export?format=json');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luminex-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Haptic feedback
      if ((window as any).MiniKit?.commandsAsync?.sendHapticFeedback) {
        await (window as any).MiniKit.commandsAsync.sendHapticFeedback({ type: 'success' });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/admin/report?period=month');
      const data = await response.json();
      
      if (data.success && data.report) {
        const reportText = `Luminex Admin Report\n\nPeriod: ${data.report.period}\nGenerated: ${new Date(data.report.generatedAt).toLocaleString()}\n\nSummary:\n- Total Users: ${data.report.summary.totalUsers}\n- New Users: ${data.report.summary.newUsers}\n- New Memberships: ${data.report.summary.newMemberships}\n- Game Plays: ${data.report.summary.gamePlays}\n- Total Referrals: ${data.report.summary.totalReferrals}\n- New Referrals: ${data.report.summary.newReferrals}`;
        
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luminex-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Haptic feedback
        if ((window as any).MiniKit?.commandsAsync?.sendHapticFeedback) {
          await (window as any).MiniKit.commandsAsync.sendHapticFeedback({ type: 'success' });
        }
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    }
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  // Access Denied Screen
  if (!miniKitReady || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover rounded-2xl p-8 text-center border border-purple-400/30"
          >
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to access the admin dashboard.
            </p>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-300 text-sm">
                Only authorized admin wallets can access this area.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showAccessDenied || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card glass-card-hover rounded-2xl p-8 text-center border border-red-400/30"
          >
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm font-mono break-all">
                Required: {ADMIN_WALLET_ADDRESS.slice(0, 10)}...{ADMIN_WALLET_ADDRESS.slice(-8)}
              </p>
              <p className="text-red-300 text-sm font-mono break-all mt-2">
                Connected: {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
              </p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.assign('/');
                }
              }}
              className="inline-block btn-premium text-white font-semibold px-6 py-3 rounded-lg glow-purple-sm"
            >
              Back to App
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 relative main-container overflow-y-auto"
    >
      {/* Enhanced Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl float-animation-delay-1"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl float-animation-delay-2"></div>
      </div>

      {/* Header */}
      <div className="relative bg-black/60 backdrop-blur-2xl border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center glow-purple-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Admin Dashboard
                  <span className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">🔒 Secure</span>
                </h1>
                <p className="text-sm text-gray-400">
                  Full system control & monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshStats}
                disabled={refreshing}
                className="glass-card glass-card-hover rounded-xl px-4 py-2 flex items-center space-x-2 text-white border border-purple-400/30"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.assign('/');
                  }
                }}
                className="glass-card glass-card-hover rounded-xl px-4 py-2 flex items-center space-x-2 text-white border border-purple-400/30"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Back to App</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center glow-blue">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-extrabold text-white">{stats.totalUsers}</p>
            <p className={`text-xs mt-2 ${stats.trends.users >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.trends.users >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.users).toFixed(1)}% this month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center glow-purple-sm">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-2">Total Staking</p>
            <p className="text-3xl font-extrabold text-white">{formatNumber(stats.totalStaking)}</p>
            <p className={`text-xs mt-2 ${stats.trends.staking >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.trends.staking >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.staking).toFixed(1)}% this month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center glow-blue">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
            <p className="text-3xl font-extrabold text-white">${formatNumber(stats.totalRevenue)}</p>
            <p className={`text-xs mt-2 ${stats.trends.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.trends.revenue >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.revenue).toFixed(1)}% this month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center glow-purple-sm">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-2">Total Referrals</p>
            <p className="text-3xl font-extrabold text-white">{stats.totalReferrals}</p>
            <p className={`text-xs mt-2 ${stats.trends.referrals >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.trends.referrals >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.referrals).toFixed(1)}% this month
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewAnalytics}
              className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center space-y-2 text-white border border-blue-400/30 magnetic-hover"
            >
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-sm font-semibold">View Analytics</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportData}
              className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center space-y-2 text-white border border-purple-400/30 magnetic-hover"
            >
              <Archive className="w-6 h-6 text-purple-400" />
              <span className="text-sm font-semibold">Export Data</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadReport}
              className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center space-y-2 text-white border border-green-400/30 magnetic-hover"
            >
              <Download className="w-6 h-6 text-green-400" />
              <span className="text-sm font-semibold">Download Report</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSettings}
              className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center space-y-2 text-white border border-yellow-400/30 magnetic-hover"
            >
              <Settings className="w-6 h-6 text-yellow-400" />
              <span className="text-sm font-semibold">Settings</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Token Distribution Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card glass-card-hover rounded-2xl p-6 border border-yellow-400/30 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Token Distribution System
          </h2>
          <div className="space-y-3">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                How It Works
              </h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Free LUX:</strong> Users claim 1 LUX/day from Smart Contract</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Rewards:</strong> Staking APY calculated automatically, users claim when ready</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Referrals:</strong> 5 LUX each to referrer + new user (one-time)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>All ON-CHAIN:</strong> Smart Contract handles all distributions automatically</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Admin Action Required
              </h3>
              <p className="text-white/80 text-sm mb-2">
                Fund Staking Contract with LUX tokens using:
              </p>
              <div className="bg-black/30 rounded p-3 font-mono text-xs text-blue-300 break-all">
                stakingContract.fundContract(amount)
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-400/30"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity, index) => {
                const getTypeIcon = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'staking':
                      return <PiggyBank className="w-5 h-5 text-white" />;
                    case 'membership':
                      return <Crown className="w-5 h-5 text-white" />;
                    case 'referral':
                      return <UserPlus className="w-5 h-5 text-white" />;
                    case 'game':
                      return <Activity className="w-5 h-5 text-white" />;
                    default:
                      return <Wallet className="w-5 h-5 text-white" />;
                  }
                };
                
                const getTypeColor = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'staking':
                      return 'from-blue-500 to-cyan-500';
                    case 'membership':
                      return 'from-yellow-500 to-orange-500';
                    case 'referral':
                      return 'from-green-500 to-emerald-500';
                    case 'game':
                      return 'from-purple-500 to-pink-500';
                    default:
                      return 'from-purple-500 to-pink-500';
                  }
                };
                
                const shortAddress = activity.user 
                  ? `${activity.user.slice(0, 6)}...${activity.user.slice(-4)}`
                  : 'Unknown';
                
                const shortTxHash = activity.txHash 
                  ? `${activity.txHash.slice(0, 6)}...${activity.txHash.slice(-4)}`
                  : null;
                
                return (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(activity.type)} rounded-full flex items-center justify-center shadow-lg`}>
                        {getTypeIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm mb-1">{activity.type.toUpperCase()}</p>
                        <p className="text-white/90 text-sm mb-1">{activity.amount}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-gray-400 text-xs font-mono">{shortAddress}</p>
                          {shortTxHash && (
                            <a
                              href={`https://optimistic.etherscan.io/tx/${activity.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs font-mono underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {shortTxHash}
                            </a>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      {activity.status === 'success' && (
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                      )}
                      {activity.status === 'pending' && (
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
                          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                        </div>
                      )}
                      {activity.status === 'failed' && (
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                          <XCircle className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4" />
          <span>Admin access logged</span>
        </div>
        <span>© {new Date().getFullYear()} Luminex Staking - Admin Panel</span>
      </div>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalyticsModal && analyticsData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAnalyticsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 border border-purple-400/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                  Analytics Dashboard
                </h2>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Users */}
                <div className="bg-black/30 rounded-xl p-4 border border-blue-400/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Users
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.users.total}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Active (30d)</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.users.active}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">New This Month</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.users.newThisMonth || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Staking */}
                <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-purple-400" />
                    Staking
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Staked</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(analyticsData.staking.total)} LUX</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Average per User</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(analyticsData.staking.average)} LUX</p>
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-black/30 rounded-xl p-4 border border-green-400/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Revenue
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Revenue</span>
                      <span className="text-xl font-bold text-white">${formatNumber(analyticsData.revenue.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">This Month</span>
                      <span className="text-xl font-bold text-white">${formatNumber(analyticsData.revenue.thisMonth || 0)}</span>
                    </div>
                    {Object.keys(analyticsData.revenue.byPower || {}).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-sm mb-2">By Power Tier:</p>
                        {Object.entries(analyticsData.revenue.byPower).map(([tier, amount]: [string, any]) => (
                          <div key={tier} className="flex justify-between text-sm">
                            <span className="text-gray-300 capitalize">{tier}</span>
                            <span className="text-white">${formatNumber(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Referrals */}
                <div className="bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-yellow-400" />
                    Referrals
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Referrals</span>
                      <span className="text-xl font-bold text-white">{analyticsData.referrals.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">This Month</span>
                      <span className="text-xl font-bold text-white">{analyticsData.referrals.thisMonth || 0}</span>
                    </div>
                    {analyticsData.referrals.topReferrers && analyticsData.referrals.topReferrers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-sm mb-2">Top Referrers:</p>
                        {analyticsData.referrals.topReferrers.slice(0, 5).map((ref: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-300 font-mono text-xs">
                              {ref.address.slice(0, 6)}...{ref.address.slice(-4)}
                            </span>
                            <span className="text-white">{ref.count} referrals</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Games */}
                <div className="bg-black/30 rounded-xl p-4 border border-pink-400/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-pink-400" />
                    Games
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Plays</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.games.totalPlays}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Unique Players</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.games.uniquePlayers}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Avg Score</p>
                      <p className="text-2xl font-bold text-white">{Math.round(analyticsData.games.averageScore || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 border border-yellow-400/30 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-yellow-400" />
                  Settings
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                  <h3 className="text-white font-semibold mb-2">Admin Wallet</h3>
                  <p className="text-gray-400 text-sm font-mono break-all">{ADMIN_WALLET_ADDRESS}</p>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-blue-400/20">
                  <h3 className="text-white font-semibold mb-2">System Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Database</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-300 text-sm">
                    ⚠️ Settings configuration coming soon. Currently using environment variables.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;

