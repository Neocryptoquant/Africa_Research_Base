"use client"

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useEnhancedWallet } from '../hooks/useEnhancedWallet';
import { useState } from 'react';
import { EnhancedUploadDialog } from '../components/EnhancedUploadDialog';

export default function DocsPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { walletState, connectWallet, disconnectWallet } = useEnhancedWallet();

  const handleUploadClick = async () => {
    if (!walletState.connected) {
      await connectWallet();
    }
    if (walletState.connected) {
      setShowUploadDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        walletState={walletState}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onUploadClick={handleUploadClick}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Welcome to Africa Research Base</h2>
            <p className="text-blue-800">
              A decentralized platform for African researchers to monetize and share their research data.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Connect Your Wallet</h3>
                <p className="text-gray-700">
                  Connect your Solana wallet (Phantom, Solflare, etc.) to start uploading and purchasing datasets.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Upload Research Data</h3>
                <p className="text-gray-700">
                  Upload your research datasets with AI-powered analysis and quality scoring. Supported formats include PDF, CSV, Excel, and more.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Discover & Purchase</h3>
                <p className="text-gray-700">
                  Browse and purchase datasets from other researchers using USDC or ARB tokens.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Methods</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">USDC (Primary)</h3>
                <p className="text-gray-700">
                  USD Coin is our primary payment method for purchasing datasets. Stable, reliable, and widely accepted.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">$ARB (Alternative)</h3>
                <p className="text-gray-700">
                  Our native Africa Research Base token. Use ARB for discounted purchases and exclusive features.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Features</h2>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Automatic Metadata Extraction:</strong> AI analyzes your documents to extract key information like topics, methodology, and geographic scope.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Quality Scoring:</strong> Each dataset receives a quality score based on completeness, accuracy, and relevance.
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Smart Recommendations:</strong> Discover relevant datasets based on your research interests and past purchases.
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported File Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium">PDF</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">CSV</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">Excel</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium">Word</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact & Support</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Need help or have questions? Reach out to our support team:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> info@positivus.com</li>
                <li><strong>Phone:</strong> +234-808-380-4754</li>
                <li><strong>Address:</strong> 1234 Mainland, Lagos State, Nigeria</li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <Footer />

      <EnhancedUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={async () => {}}
        onSuccess={() => {}}
      />
    </div>
  );
}
