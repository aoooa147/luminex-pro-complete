'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy } from 'lucide-react';
import QRCodeSVG from 'react-qr-code';

interface QRModalProps {
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  safeReferralCode: string;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const QRModal = memo(({
  showQRModal,
  setShowQRModal,
  safeReferralCode,
  showToast,
}: QRModalProps) => {
  return (
    <AnimatePresence>
      {showQRModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-6 border border-yellow-600/30 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
              {safeReferralCode && (
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite?ref=${safeReferralCode}`}
                  size={256}
                  level="H"
                />
              )}
            </div>

            <div className="text-center">
              <p className="text-white/80 text-sm mb-2">Scan this QR code to join Luminex!</p>
              <p className="text-yellow-400 text-xs font-mono">{safeReferralCode}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const inviteLink = `https://world.org/mini-app?app_id=${process.env.NEXT_PUBLIC_WORLD_APP_ID || ''}&path=${encodeURIComponent(`/?ref=${safeReferralCode}`)}`;
                navigator.clipboard.writeText(inviteLink);
                showToast('Link copied to clipboard!', 'success');
              }}
              className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2"
            >
              <Copy className="w-5 h-5" />
              <span>Copy Link</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

QRModal.displayName = 'QRModal';

export default QRModal;

