"use client"

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Wallet, Database, Download, Globe, Shield, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { EnhancedUploadDialog } from './components/EnhancedUploadDialog';
import { ModernDatasetCard } from './components/ModernDatasetCard';
import { SearchFilter } from './components/SearchFilter';
import { PaymentModal } from './components/PaymentModal';
import { useSimpleSolanaProgram } from './hooks/useSimpleSolanaProgram';
import { useDatasets, DatasetFilters, Dataset } from './hooks/useDatasets';
import { useEnhancedWallet } from './hooks/useEnhancedWallet';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'upload' | 'explore' | 'payment'>('landing');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    monetize: false,
    price: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [filters, setFilters] = useState<DatasetFilters>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { datasets, loading, error, refreshDatasets } = useDatasets(filters);
  const { walletState, connectWallet, disconnectWallet } = useEnhancedWallet();
  const { createDataset } = useSimpleSolanaProgram();

  // Handle upload button click - connect wallet first
  const handleUploadClick = async () => {
    if (!walletState.connected) {
      await connectWallet();
    }
    if (walletState.connected) {
      setShowUploadDialog(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadData({ ...uploadData, file });
    }
  };

  const handleFileAnalyzed = (data: {
    fileName: string;
    fileSize: number;
    columnCount: number;
    rowCount: number;
    dataPreview: unknown[];
    analysis: {
      fields: string[];
      dataTypes: string[];
      qualityMetrics: {
        completeness: number;
        consistency: number;
        accuracy: number;
      };
      suggestedTags: string[];
      summary: string;
    };
  }) => {
    console.log('File analyzed:', data);
    alert(`Dataset analyzed successfully!\n\n${data.analysis.summary}\n\nFields detected: ${data.analysis.fields.join(', ')}\n\nThis would normally be uploaded to the blockchain and database.`);
    setCurrentPage('explore');
  };

  const purchaseDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    if (selectedDataset) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    if (selectedDataset) {
      // Handle successful payment
      alert(`Successfully purchased ${selectedDataset.file_name}!`);
      setShowPaymentModal(false);
      setSelectedDataset(null);
    }
  };

  const handleFileUploadAndAnalysis = async (file: File, metadata: Record<string, unknown>) => {
    try {
      // Step 1: Analyze the document with AI
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title as string);
      formData.append('researchField', metadata.researchField as string);

      const response = await fetch('/api/datasets/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Step 2: Create content hash
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const contentHash = new Uint8Array(hashBuffer);

      // Step 3: Create dataset on Solana blockchain (if createDataset is available)
      try {
        const solanaResult = await createDataset({
          fileName: file.name,
          fileSize: file.size,
          contentHash,
          aiMetadata: {
            title: metadata.title as string,
            description: result.metadata.summary,
            researchField: metadata.researchField as string,
            topics: result.metadata.topics,
            methodology: result.metadata.methodology,
            geographicScope: result.metadata.geographicScope,
            timeframe: result.metadata.timeframe,
            sampleSize: result.metadata.sampleSize,
            wordCount: result.metadata.wordCount,
            pageCount: result.metadata.pageCount,
            language: result.metadata.language,
            dataTypes: result.metadata.dataTypes
          },
          dataUri: `ipfs://placeholder-${Date.now()}`, // TODO: Upload to IPFS
          columnCount: result.metadata.columnCount || 0,
          rowCount: result.metadata.rowCount || 0,
          qualityScore: result.qualityScore
        });

        console.log('Dataset created on-chain:', solanaResult);
      } catch (solanaError) {
        console.warn('Solana upload failed, continuing with local storage:', solanaError);
      }

      // Step 4: Add to local datasets (this will make it appear in explore immediately)
      const newDataset = {
        id: `local-${Date.now()}`,
        file_name: file.name,
        title: metadata.title as string,
        description: result.metadata.summary,
        research_field: metadata.researchField as string,
        file_size: file.size,
        quality_score: result.qualityScore,
        price_lamports: 100000000, // 0.1 SOL default
        contributor_address: walletState.publicKey || '',
        created_at: new Date().toISOString(),
        tags: result.metadata.topics || [],
        column_count: result.metadata.columnCount || 0,
        row_count: result.metadata.rowCount || 0,
        download_count: 0,
        topics: result.metadata.topics || [],
        methodology: result.metadata.methodology || '',
        geographic_scope: result.metadata.geographicScope || '',
        timeframe: result.metadata.timeframe || '',
        sample_size: result.metadata.sampleSize || 0,
        word_count: result.metadata.wordCount || 0,
        page_count: result.metadata.pageCount || 0,
        language: result.metadata.language || 'English',
        data_types: result.metadata.dataTypes || []
      };

      // Store in localStorage so it persists and appears in explore
      const existingDatasets = JSON.parse(localStorage.getItem('userDatasets') || '[]');
      existingDatasets.unshift(newDataset);
      localStorage.setItem('userDatasets', JSON.stringify(existingDatasets));

      // Refresh the datasets to show the new upload immediately
      refreshDatasets();

      console.log('Upload successful! Dataset added:', newDataset);
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <button 
          onClick={() => setCurrentPage('landing')}
          className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={40} 
            height={40}
            className="w-8 h-8 md:w-10 md:h-10"
          />
          <h1 className="text-lg md:text-2xl font-bold text-amber-900 hidden sm:block">AFRICA RESEARCH BASE</h1>
          <h1 className="text-lg font-bold text-amber-900 sm:hidden">ARB</h1>
        </button>
        <div className="flex items-center space-x-2 md:space-x-4">
          {!walletState.connected ? (
            <button 
              onClick={connectWallet}
              disabled={walletState.connecting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 text-sm md:text-base"
            >
              {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-xs md:text-sm hidden sm:block">
                <div className="text-amber-700 font-medium">
                  {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                </div>
                {walletState.balance !== null && (
                  <div className="text-gray-600">{walletState.balance.toFixed(4)} SOL</div>
                )}
              </div>
              <button 
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm md:text-base"
              >
                Upload Data
              </button>
              <button 
                onClick={disconnectWallet}
                className="text-amber-700 hover:text-amber-900 transition-colors text-sm md:text-base"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between px-4 md:px-6 py-8 md:py-16 max-w-7xl mx-auto">
        <div className="lg:w-1/2 space-y-6 md:space-y-8 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            A new economy<br />
            <span className="text-amber-700">for science</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            We&apos;re building a new model for scientific research where publishing and peer review lead to funding. 
            Empowering African researchers with decentralized data monetization.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6 justify-center lg:justify-start">
            <button 
              onClick={connectWallet}
              className="bg-blue-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              <Wallet size={18} className="md:w-5 md:h-5" />
              <span>Connect Wallet</span>
            </button>
            <button 
              onClick={() => setCurrentPage('explore')}
              className="border-2 border-blue-600 text-blue-600 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all text-sm md:text-base"
            >
              Explore Data
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 mt-8 lg:mt-0 w-full max-w-md lg:max-w-none">
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 transform rotate-1 hover:rotate-0 transition-transform mx-auto">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-3">
                <Database className="text-amber-600 flex-shrink-0" size={20} />
                <span className="font-semibold text-gray-800 text-sm md:text-base">Upload Research Data</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-green-600 flex-shrink-0" size={20} />
                <span className="font-semibold text-gray-800 text-sm md:text-base">Get Funded</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="text-blue-600 flex-shrink-0" size={20} />
                <span className="font-semibold text-gray-800 text-sm md:text-base">Impact Africa</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 bg-amber-50 p-3 md:p-4 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-2 text-sm md:text-base">Featured Research</h4>
              <div className="text-xs md:text-sm text-gray-600">
                <p>Climate Impact Survey - Uganda</p>
                <p className="text-amber-700 font-medium">78% funded • 23 backers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8 md:py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:justify-between md:items-center">
            {/* Logo and Description */}
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Image 
                  src="/logo.svg" 
                  alt="Africa Research Base Logo" 
                  width={32} 
                  height={32}
                  className="w-8 h-8"
                />
                <span className="font-semibold text-lg md:text-xl">AFRICA RESEARCH BASE</span>
              </div>
              <p className="text-amber-200 text-sm hidden md:block">Empowering African research</p>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center justify-center space-x-6">
              <a 
                href="https://x.com/AfResearchBase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-300 transition-colors p-2"
                aria-label="Follow us on X"
              >
                <Image src="/x.png" alt="X" width={20} height={20} className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/africa-research-base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-300 transition-colors p-2"
                aria-label="Connect on LinkedIn"
              >
                <Image src="/linkedin.jpg" alt="LinkedIn" width={20} height={20} className="w-5 h-5 rounded-sm" />
              </a>
              <a 
                href="https://github.com/Neocryptoquant/Africa_Research_Base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-300 transition-colors p-2"
                aria-label="View on GitHub"
              >
                <Image src="/git.png" alt="GitHub" width={20} height={20} className="w-5 h-5" />
              </a>
            </div>

            {/* Powered By */}
            <div className="flex flex-col items-center md:items-end space-y-2 text-center md:text-right">
              <span className="text-amber-200 text-xs">Powered by</span>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <Image 
                    src="/solana.png" 
                    alt="Solana" 
                    width={16} 
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="text-amber-100">Solana</span>
                </div>
                <span className="text-amber-300">•</span>
                <div className="flex items-center space-x-1">
                  <Image 
                    src="/ssa.png" 
                    alt="Solana Students Africa" 
                    width={16} 
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="text-amber-100">SSA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  // Explore Page Component
  const ExplorePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <button 
          onClick={() => setCurrentPage('landing')}
          className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={32} 
            height={32}
            className="w-6 h-6 md:w-8 md:h-8"
          />
          <span className="font-semibold text-amber-900 text-sm md:text-base">AFRICA RESEARCH BASE</span>
        </button>
        <div className="flex items-center space-x-2 md:space-x-4">
          {!walletState.connected ? (
            <button 
              onClick={connectWallet}
              disabled={walletState.connecting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 text-sm md:text-base"
            >
              {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-xs md:text-sm hidden sm:block">
                <div className="text-amber-700 font-medium">
                  {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                </div>
                {walletState.balance !== null && (
                  <div className="text-gray-600">{walletState.balance.toFixed(4)} SOL</div>
                )}
              </div>
              <button 
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm md:text-base"
              >
                Upload Data
              </button>
              <button 
                onClick={disconnectWallet}
                className="text-amber-700 hover:text-amber-900 transition-colors text-sm md:text-base"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Explore Research Data</h1>
          <SearchFilter onFilter={setFilters} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800 text-sm md:text-base">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-gray-600 text-sm md:text-base">Loading datasets...</span>
          </div>
        ) : datasets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {datasets.map((dataset) => (
              <ModernDatasetCard
                key={dataset.id}
                dataset={dataset}
                onPurchase={purchaseDataset}
                isOwner={dataset.contributor_address === walletState.publicKey}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl md:text-6xl mb-4">📊</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              {filters.search || filters.field
                ? "Try adjusting your search filters"
                : "Be the first to upload a dataset to get started!"}
            </p>
            {!filters.search && !filters.field && (
              <button
                onClick={handleUploadClick}
                className="px-4 py-2 md:px-6 md:py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium text-sm md:text-base"
              >
                Upload First Dataset
              </button>
            )}
            <button 
              onClick={() => setCurrentPage('landing')}
              className="block mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm md:text-base mx-auto"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'landing': return <LandingPage />;
      case 'explore': return <ExplorePage />;
      default: return <LandingPage />;
    }
  };

  return (
    <div>
      {renderCurrentPage()}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedDataset && (
        <PaymentModal
          datasetId={selectedDataset.id}
          price={selectedDataset.price_lamports}
          recipientAddress={selectedDataset.contributor_address || '11111111111111111111111111111112'}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Upload Dialog */}
      <EnhancedUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleFileUploadAndAnalysis}
        onSuccess={() => setCurrentPage('explore')}
      />
    </div>
  );
}
