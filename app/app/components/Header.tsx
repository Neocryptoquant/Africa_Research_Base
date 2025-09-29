"use client"

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

interface HeaderProps {
  walletState: {
    connected: boolean;
    connecting: boolean;
    publicKey: string | null;
    balance: number | null;
  };
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onUploadClick: () => void;
}

export function Header({ walletState, onConnectWallet, onDisconnectWallet, onUploadClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.svg" 
              alt="Africa Research Base Logo" 
              width={32} 
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              AFRICA RESEARCH BASE
            </span>
            <span className="text-xl font-bold text-gray-900 sm:hidden">ARB</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">
              Discover
            </Link>
            
            <button onClick={onUploadClick} className="text-gray-700 hover:text-blue-600 transition-colors">
              Upload
            </button>
            
            <Link href="/my-datasets" className="text-gray-700 hover:text-blue-600 transition-colors">
              My Datasets
            </Link>
            
            <Link href="/docs" className="text-gray-700 hover:text-blue-600 transition-colors">
              Docs
            </Link>
            
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About Us
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {!walletState.connected ? (
              <>
                <button 
                  onClick={onUploadClick}
                  className="hidden sm:flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Upload
                </button>
                <button 
                  onClick={onConnectWallet}
                  disabled={walletState.connecting}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onUploadClick}
                  className="hidden sm:flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Upload
                </button>
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">
                      {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                    </div>
                    {walletState.balance !== null && (
                      <div className="text-gray-500">{(walletState.balance * 150).toFixed(2)} USDC</div>
                    )}
                  </div>
                  <button 
                    onClick={onDisconnectWallet}
                    className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <Link href="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">
                Discover
              </Link>
              <button onClick={onUploadClick} className="text-left text-gray-700 hover:text-blue-600 transition-colors">
                Upload
              </button>
              <Link href="/my-datasets" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Datasets
              </Link>
              <Link href="/docs" className="text-gray-700 hover:text-blue-600 transition-colors">
                Docs
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About Us
              </Link>
              
              {walletState.connected && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-900 font-medium mb-2">
                    {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                  </div>
                  <button 
                    onClick={onDisconnectWallet}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}