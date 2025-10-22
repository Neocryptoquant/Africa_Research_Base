/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SearchSection } from './components/SearchSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { Footer } from './components/Footer';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ModernDatasetCard } from './components/ModernDatasetCard';
import { EnhancedUploadDialog } from './components/EnhancedUploadDialog';
import { PaymentModal } from './components/PaymentModal';
import { useEnhancedWallet } from './hooks/useEnhancedWallet';
import { useDatasets, type DatasetFilters, type Dataset } from './hooks/useDatasets';
import { useSimpleSolanaProgram } from './hooks/useSimpleSolanaProgram';

export default function ModernLandingPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<DatasetFilters>({});
  const [currentView, setCurrentView] = useState<'landing' | 'explore'>('landing');

  const { walletState, connectWallet, disconnectWallet } = useEnhancedWallet();
  const { datasets, loading, error, refreshDatasets } = useDatasets(filters);
  const { createDataset } = useSimpleSolanaProgram();

  const handleUploadClick = async () => {
    if (!walletState.connected) {
      await connectWallet();
    }
    if (walletState.connected) {
      setShowUploadDialog(true);
    }
  };

  const handleExploreClick = () => {
    setCurrentView('explore');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const purchaseDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedDataset) {
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
          dataUri: `ipfs://placeholder-${Date.now()}`,
          columnCount: result.metadata.columnCount || 0,
          rowCount: result.metadata.rowCount || 0,
          qualityScore: result.qualityScore
        });

        console.log('Dataset created on-chain:', solanaResult);
      } catch (solanaError) {
        console.warn('Solana upload failed, continuing with local storage:', solanaError);
      }

      // Step 4: Add to local datasets
      const newDataset = {
        id: `local-${Date.now()}`,
        file_name: file.name,
        title: metadata.title as string,
        description: result.metadata.summary,
        research_field: metadata.researchField as string,
        file_size: file.size,
        quality_score: result.qualityScore,
        price_lamports: 100000000,
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

      // Store in localStorage
      const existingDatasets = JSON.parse(localStorage.getItem('userDatasets') || '[]');
      existingDatasets.unshift(newDataset);
      localStorage.setItem('userDatasets', JSON.stringify(existingDatasets));

      refreshDatasets();
      console.log('Upload successful! Dataset added:', newDataset);
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  if (currentView === 'explore') {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Explore Research Data</h1>
            <button
              onClick={handleBackToLanding}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>

          <SearchSection onFilter={setFilters} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <ProgressIndicator message="We got it from here." />
          ) : datasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  onClick={handleUploadClick}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Upload First Dataset
                </button>
              )}
            </div>
          )}
        </div>

        <Footer />

        {/* Modals */}
        {showPaymentModal && selectedDataset && (
          <PaymentModal
            datasetId={selectedDataset.id}
            price={selectedDataset.price_lamports}
            recipientAddress={selectedDataset.contributor_address || '11111111111111111111111111111112'}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}

        <EnhancedUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleFileUploadAndAnalysis}
          onSuccess={() => setCurrentView('explore')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <HeroSection
        onUploadClick={handleUploadClick}
        onExploreClick={handleExploreClick}
      />

      <SearchSection onFilter={setFilters} />

      {/* Featured Datasets Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Research</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover high-quality datasets from leading African researchers and institutions
            </p>
          </div>

          {loading ? (
            <ProgressIndicator message="Loading featured datasets..." />
          ) : datasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.slice(0, 6).map((dataset) => (
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
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Be the first to contribute!
              </h3>
              <p className="text-gray-600 mb-6">
                Upload your research data and help build Africa's largest research repository
              </p>
              <button
                onClick={handleUploadClick}
                className="px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold"
              >
                Upload Your Research
              </button>
            </div>
          )}

          {datasets.length > 6 && (
            <div className="text-center mt-12">
              <button
                onClick={handleExploreClick}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                View All Datasets
              </button>
            </div>
          )}
        </div>
      </section>

      <ProblemSection />
      <SolutionSection />

      {/* Modals */}
      {showPaymentModal && selectedDataset && (
        <PaymentModal
          datasetId={selectedDataset.id}
          price={selectedDataset.price_lamports}
          recipientAddress={selectedDataset.contributor_address || '11111111111111111111111111111112'}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <EnhancedUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleFileUploadAndAnalysis}
        onSuccess={() => setCurrentView('explore')}
      />
    </div>
  );
}