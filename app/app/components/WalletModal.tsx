"use client";

import { X, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            My Wallet
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center justify-center space-y-4">
          <Wallet className="w-12 h-12 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Coming Soon 🚀
          </h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Your decentralized wallet integration will be available soon.
            You’ll be able to manage ARB tokens, track transactions, and
            connect to Solana wallets right here.
          </p>
          <div className="mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-md">
            Stay Tuned ✨
          </div>
        </div>
      </motion.div>
    </div>
  );
}
