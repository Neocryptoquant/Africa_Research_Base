"use client"

import { useState, useEffect } from 'react';
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

  // Handle upload button click - connect wallet first
  const handleUploadClick = async () => {
    if (!walletState.connected) {
      await connectWallet();
    }
    if (walletState.connected) {
      setShowUploadDialog(true);
    }
  };

  const handleExploreClick = () => {
    window.location.href = '/explore';
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
      // Step 1: Upload file to storage
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('title', metadata.title as string);
      uploadFormData.append('researchField', metadata.researchField as string);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'File upload failed');
      }

      // Step 2: Analyze the document with AI
      const analysisFormData = new FormData();
      analysisFormData.append('file', file);
      analysisFormData.append('title', metadata.title as string);
      analysisFormData.append('researchField', metadata.researchField as string);

      const analysisResponse = await fetch('/api/datasets/analyze', {
        method: 'POST',
        body: analysisFormData,
      });

      const analysisResult = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Step 3: Create content hash
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const contentHash = new Uint8Array(hashBuffer);

      // Step 4: Create dataset on Solana blockchain (if createDataset is available)
      try {
        const solanaResult = await createDataset({
          fileName: file.name,
          fileSize: file.size,
          contentHash,
          aiMetadata: {
            title: metadata.title as string,
            description: analysisResult.metadata.summary,
            researchField: metadata.researchField as string,
            topics: analysisResult.metadata.topics,
            methodology: analysisResult.metadata.methodology,
            geographicScope: analysisResult.metadata.geographicScope,
            timeframe: analysisResult.metadata.timeframe,
            sampleSize: analysisResult.metadata.sampleSize,
            wordCount: analysisResult.metadata.wordCount,
            pageCount: analysisResult.metadata.pageCount,
            language: analysisResult.metadata.language,
            dataTypes: analysisResult.metadata.dataTypes
          },
          dataUri: uploadResult.file.fullUrl,
          columnCount: analysisResult.metadata.columnCount || 0,
          rowCount: analysisResult.metadata.rowCount || 0,
          qualityScore: analysisResult.qualityScore
        });

        console.log('Dataset created on-chain:', solanaResult);
      } catch (solanaError) {
        console.warn('Solana upload failed, continuing with local storage:', solanaError);
      }

      // Step 5: Add to local datasets with file URL
      const newDataset = {
        id: uploadResult.file.id,
        file_name: file.name,
        title: metadata.title as string,
        description: analysisResult.metadata.summary,
        research_field: metadata.researchField as string,
        file_size: file.size,
        quality_score: analysisResult.qualityScore,
        price_lamports: 100000000,
        contributor_address: walletState.publicKey || '',
        created_at: new Date().toISOString(),
        tags: analysisResult.metadata.topics || [],
        column_count: analysisResult.metadata.columnCount || 0,
        row_count: analysisResult.metadata.rowCount || 0,
        download_count: 0,
        topics: analysisResult.metadata.topics || [],
        methodology: analysisResult.metadata.methodology || '',
        geographic_scope: analysisResult.metadata.geographicScope || '',
        timeframe: analysisResult.metadata.timeframe || '',
        sample_size: analysisResult.metadata.sampleSize || 0,
        word_count: analysisResult.metadata.wordCount || 0,
        page_count: analysisResult.metadata.pageCount || 0,
        language: analysisResult.metadata.language || 'English',
        data_types: analysisResult.metadata.dataTypes || [],
        file_url: uploadResult.file.fullUrl,
        download_url: uploadResult.file.downloadUrl
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


  return (
    <div className="min-h-screen">

      <HeroSection
        onUploadClick={handleUploadClick}
        onExploreClick={handleExploreClick}
      />


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
