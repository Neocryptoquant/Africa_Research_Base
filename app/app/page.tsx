"use client"

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Search, Wallet, Database, Download, Star, Users, ChevronRight, Globe, Shield, Zap, TrendingUp, Eye, DollarSign, FileText } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ModernFileUploadDialog } from './components/ModernFileUploadDialog';
import { ModernDatasetCard } from './components/ModernDatasetCard';
import { useSimpleSolanaProgram } from './hooks/useSimpleSolanaProgram';
import { SearchFilter } from './components/SearchFilter';
import { DatasetCard } from './components/DatasetCard';
import { PaymentModal } from './components/PaymentModal';
import { useDatasets, DatasetFilters, Dataset } from './hooks/useDatasets';
import { useEnhancedWallet } from './hooks/useEnhancedWallet';
import { DatasetAnalytics } from './components/DatasetAnalytics';
import { StatsOverview } from './components/StatsOverview';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'upload' | 'explore' | 'payment'>('landing');
  const [walletConnected, setWalletConnected] = useState(false);
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
  const { walletState, connectWallet, disconnectWallet, availableWallets } = useEnhancedWallet();
  const { createDataset, loading: solanaLoading, error: solanaError } = useSimpleSolanaProgram();

  // Update wallet connected state when wallet state changes
  React.useEffect(() => {
    setWalletConnected(walletState.connected);
  }, [walletState.connected]);

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

  const submitDataset = () => {
    // This will be handled by the FileUpload component
    alert('Dataset submitted for AI processing!');
  };

  const handleDownload = async (id: string) => {
    const dataset = datasets.find(d => d.id === id);
    if (!dataset) return;

    if (dataset.price_lamports > 0) {
      // Show payment modal for paid datasets
      setSelectedDataset(dataset);
      setShowPaymentModal(true);
    } else {
      // Free download
      try {
        const response = await fetch(`/api/datasets/${dataset.id}/download`);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = dataset.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update download count
        refreshDatasets();
      } catch (error) {
        console.error('Download error:', error);
        alert('Download failed. Please try again.');
      }
    }
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

  const handlePaymentSuccess = async () => {
    if (selectedDataset) {
      // After successful payment, initiate download
      try {
        const response = await fetch(`/api/datasets/${selectedDataset.id}/download`);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedDataset.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update download count
        refreshDatasets();
        
        setShowPaymentModal(false);
        setSelectedDataset(null);
        alert('Payment successful! Download started.');
      } catch (error) {
        console.error('Download error:', error);
        alert('Payment successful, but download failed. Please contact support.');
      }
    }
  };

  // Create content hash from file
  const createContentHash = async (file: File): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return new Uint8Array(hashBuffer);
  };

  // Handle file upload and analysis with Solana integration
  const handleFileUploadAndAnalysis = async (file: File, metadata: any) => {
    try {
      // Step 1: Analyze the document with AI
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('researchField', metadata.researchField);

      const response = await fetch('/api/datasets/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Step 2: Create content hash
      const contentHash = await createContentHash(file);

      // Step 3: Create dataset on Solana blockchain
      const solanaResult = await createDataset({
        fileName: file.name,
        fileSize: file.size,
        contentHash,
        aiMetadata: {
          title: metadata.title,
          description: result.metadata.summary,
          researchField: metadata.researchField,
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
      
      // Refresh datasets to show the new one
      refreshDatasets();
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw to be handled by the dialog
    }
  };

  // Handle successful upload - redirect to explore page
  const handleUploadSuccess = () => {
    setCurrentPage('explore');
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <button 
          onClick={() => setCurrentPage('landing')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={40} 
            height={40}
            className="w-10 h-10"
          />
          <h1 className="text-2xl font-bold text-amber-900">AFRICA RESEARCH BASE</h1>
        </button>
        <div className="flex space-x-4">
          {!walletState.connected ? (
            <button 
              onClick={connectWallet}
              disabled={walletState.connecting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50"
            >
              {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="text-amber-700 font-medium">
                  {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                </div>
                {walletState.balance !== null && (
                  <div className="text-gray-600">{walletState.balance.toFixed(4)} SOL</div>
                )}
              </div>
              <button 
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
              >
                Upload Data
              </button>
              <button 
                onClick={disconnectWallet}
                className="text-amber-700 hover:text-amber-900 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-16 max-w-7xl mx-auto">
        <div className="lg:w-1/2 space-y-8">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            A new economy<br />
            <span className="text-amber-700">for science</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're building a new model for scientific research where publishing and peer review lead to funding. 
            Empowering African researchers with decentralized data monetization.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={connectWallet}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
            >
              <Wallet size={20} />
              <span>Connect Wallet</span>
            </button>
            <button 
              onClick={() => setCurrentPage('explore')}
              className="border-2 border-amber-700 text-amber-700 px-8 py-4 rounded-xl font-semibold hover:bg-amber-700 hover:text-white transition-all"
            >
              Explore Research
            </button>
          </div>
          
          <p className="text-gray-500">Start earning for open science today.</p>
        </div>

        {/* Right side preview */}
        <div className="lg:w-1/2 mt-16 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Database className="text-amber-600" size={24} />
                <span className="font-semibold text-gray-800">Upload Research Data</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-green-600" size={24} />
                <span className="font-semibold text-gray-800">Get Funded</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="text-blue-600" size={24} />
                <span className="font-semibold text-gray-800">Impact Africa</span>
              </div>
            </div>
            
            <div className="mt-6 bg-amber-50 p-4 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-2">Featured Research</h4>
              <div className="text-sm text-gray-600">
                <p>Climate Impact Survey - Uganda</p>
                <p className="text-amber-700 font-medium">78% funded • 23 backers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-amber-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold">{datasets.length}+</div>
              <div className="text-amber-200">Datasets</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">₿2.5M</div>
              <div className="text-amber-200">Total Funding</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-amber-200">Researchers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-amber-200">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Logo and Description */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.svg" 
                alt="Africa Research Base Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="font-semibold text-xl">AFRICA RESEARCH BASE</span>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center space-x-6">
              <a 
                href="https://x.com/AfResearchBase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com/company/africa-research-base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://substack.com/@africaresearchbase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/AfricaResearchBase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://africaresearchbase.cc.cc/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <Globe className="w-6 h-6" />
              </a>
            </div>

            {/* Powered By */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Powered by</span>
              <div className="flex items-center space-x-3">
                <Image 
                  src="/solana.png" 
                  alt="Solana" 
                  width={20} 
                  height={20}
                  className="w-5 h-5"
                />
                <span>Solana</span>
                <span>•</span>
                <Image 
                  src="/ssa.png" 
                  alt="Solana Students Africa" 
                  width={20} 
                  height={20}
                  className="w-5 h-5"
                />
                <span>SolanaStudentsAfrica</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  // Upload Data Page
  const UploadPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      <header className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-3">
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-amber-900">AFRICA RESEARCH BASE</span>
        </div>
        <button 
          onClick={() => setCurrentPage('landing')}
          className="text-amber-700 hover:text-amber-900"
        >
          Back to Home
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Research Data</h1>
          <p className="text-xl text-gray-600">Our AI agent will process and generate metadata for your dataset</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-8">
            {/* File Upload */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Upload Dataset</label>
              <div 
                className="border-2 border-dashed border-amber-300 rounded-xl p-12 text-center hover:border-amber-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-4 text-amber-600" size={48} />
                <p className="text-lg font-medium text-gray-700">
                  {uploadData.file ? uploadData.file.name : 'Click to upload your dataset'}
                </p>
                <p className="text-gray-500 mt-2">Supports CSV, JSON, Excel files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Use existing FileUpload component for AI processing */}
            <FileUpload
              onFileAnalyzed={handleFileAnalyzed}
              onUploadProgress={setUploadProgress}
            />

            {/* Monetization Options */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-800">Monetization</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={uploadData.monetize}
                    onChange={(e) => setUploadData({ ...uploadData, monetize: e.target.checked })}
                    className="w-5 h-5 text-amber-600 border-2 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Enable monetization for this dataset</span>
                </label>
              </div>
              
              {uploadData.monetize && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price in SOL</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={uploadData.price}
                    onChange={(e) => setUploadData({ ...uploadData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Processing... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Explore Projects Page
  const ExplorePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      <header className="px-6 py-4 flex justify-between items-center border-b bg-white">
        <button 
          onClick={() => setCurrentPage('landing')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-amber-900">AFRICA RESEARCH BASE</span>
        </button>
        <div className="flex space-x-4">
          {!walletState.connected ? (
            <button 
              onClick={connectWallet}
              disabled={walletState.connecting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50"
            >
              {walletState.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="text-amber-700 font-medium">
                  {walletState.publicKey?.slice(0, 4)}...{walletState.publicKey?.slice(-4)}
                </div>
                {walletState.balance !== null && (
                  <div className="text-gray-600">{walletState.balance.toFixed(4)} SOL</div>
                )}
              </div>
              <button 
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
              >
                Upload Data
              </button>
              <button 
                onClick={disconnectWallet}
                className="text-amber-700 hover:text-amber-900 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Research Data</h1>
          <SearchFilter onFilter={setFilters} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-gray-600">Loading datasets...</span>
          </div>
        ) : datasets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {datasets.map((dataset) => (
              <ModernDatasetCard
                key={dataset.id}
                dataset={dataset}
                onPurchase={purchaseDataset}
                onView={(dataset) => console.log('View dataset:', dataset)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.field
                ? "Try adjusting your search filters"
                : "Be the first to upload a dataset to get started!"}
            </p>
            {!filters.search && !filters.field && (
              <button
                onClick={() => setCurrentPage('upload')}
                className="px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium"
              >
                Upload First Dataset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Payment Page
  const PaymentPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      <header className="px-6 py-4 flex justify-between items-center border-b bg-white">
        <div className="flex items-center space-x-3">
          <Image 
            src="/logo.svg" 
            alt="Africa Research Base Logo" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-amber-900">AFRICA RESEARCH BASE</span>
        </div>
        <button 
          onClick={() => setCurrentPage('explore')}
          className="text-amber-700 hover:text-amber-900"
        >
          Back to Explore
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Purchase</h1>
          <p className="text-xl text-gray-600">Secure payment powered by Solana Pay</p>
        </div>

        {selectedDataset && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dataset Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dataset Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedDataset.file_name}</h3>
                  <p className="text-gray-600 mt-1">{selectedDataset.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="ml-2 font-medium">{selectedDataset.quality_score}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">File Size:</span>
                    <span className="ml-2 font-medium">{(selectedDataset.file_size / 1000).toFixed(0)}KB</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rows:</span>
                    <span className="ml-2 font-medium">{selectedDataset.row_count.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Columns:</span>
                    <span className="ml-2 font-medium">{selectedDataset.column_count}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDataset.tags?.map((tag) => (
                    <span key={tag} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">Total Amount</span>
                    <span className="text-2xl font-bold text-purple-700">{(selectedDataset.price_lamports / 1e9)} SOL</span>
                  </div>
                  <p className="text-sm text-gray-600">≈ ${((selectedDataset.price_lamports / 1e9) * 150).toFixed(2)} USD</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wallet className="text-purple-600" size={20} />
                      <span className="font-medium">Connected Wallet</span>
                    </div>
                    <span className="text-sm text-gray-600">{walletState.connected ? 'Connected' : 'Not Connected'}</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">What you'll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center space-x-2">
                        <Download size={14} />
                        <span>Instant download access</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Shield size={14} />
                        <span>Data quality guarantee</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FileText size={14} />
                        <span>Comprehensive metadata</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={processPayment}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
                >
                  <DollarSign size={20} />
                  <span>Pay with Solana Pay</span>
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Secure payment processed on Solana blockchain
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render current page
  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'landing': return <LandingPage />;
      case 'upload': return <UploadPage />;
      case 'explore': return <ExplorePage />;
      case 'payment': return <PaymentPage />;
      default: return <LandingPage />;
    }
  };

  return (
    <div className="font-sans">
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

      {/* File Upload Dialog */}
      <ModernFileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleFileUploadAndAnalysis}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
