"use client"

import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { EnhancedUploadDialog } from '../components/EnhancedUploadDialog';
import { PaymentModal } from '../components/PaymentModal';
import { useEnhancedWallet } from '../hooks/useEnhancedWallet';
import { useDatasets, type DatasetFilters, type Dataset } from '../hooks/useDatasets';
import { useSimpleSolanaProgram } from '../hooks/useSimpleSolanaProgram';
import { Search, Filter, Star, Download, Eye } from 'lucide-react';
import { DynamicTimestamp } from '../components/DynamicTimestamp';

export default function ExplorePage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<DatasetFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ ...filters, [filterType]: value });
  };

  // Mock dataset card component matching Image 3 design
  const DatasetCard = ({ dataset }: { dataset: Dataset }) => {
    const getQualityColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ));
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">
                <DynamicTimestamp uploadDate={dataset.created_at} />
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {dataset.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              by <span className="text-blue-600 font-medium">Francisca .C.</span>
            </p>
            <div className="flex items-center space-x-1 mb-3">
              {renderStars(dataset.quality_score)}
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {dataset.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              ${((dataset.price_lamports || 0) / 1000000).toFixed(0)} USDC
            </span>
            <span className="text-sm text-gray-500">
              or {((dataset.price_lamports || 0) / 5000000).toFixed(0)} $ARB
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              onClick={() => purchaseDataset(dataset)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        walletState={walletState}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onUploadClick={handleUploadClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search author, topic, field..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <select
            onChange={(e) => handleFilterChange('field', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Field</option>
            <option value="Environmental Science">Environmental Science</option>
            <option value="Public Health">Public Health</option>
            <option value="Education">Education</option>
            <option value="Agriculture">Agriculture</option>
          </select>

          <select
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Country</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="Ghana">Ghana</option>
            <option value="Uganda">Uganda</option>
          </select>

          <select
            onChange={(e) => handleFilterChange('qualityRange', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Quality score range</option>
            <option value="80-100">80-100</option>
            <option value="60-79">60-79</option>
            <option value="40-59">40-59</option>
          </select>

          <select
            onChange={(e) => handleFilterChange('fileType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">File type</option>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
            <option value="XLSX">Excel</option>
            <option value="JSON">JSON</option>
          </select>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <ProgressIndicator message="Loading datasets..." />
        ) : datasets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
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
        onSuccess={() => refreshDatasets()}
      />
    </div>
  );
}
