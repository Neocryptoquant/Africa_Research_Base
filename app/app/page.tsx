"use client"

import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { SearchFilter } from './components/SearchFilter';
import { DatasetCard } from './components/DatasetCard';
import { PaymentModal } from './components/PaymentModal';
import { useDatasets, DatasetFilters } from './hooks/useDatasets';
import { useWallet } from './hooks/useWallet';
import { DatasetAnalytics } from './components/DatasetAnalytics';
import { StatsOverview } from './components/StatsOverview';

export default function Home() {
  const [currentView, setCurrentView] = useState<'browse' | 'upload'>('browse');
  const [selectedDataset, setSelectedDataset] = useState<{
    id: string;
    price_lamports: number;
    contributor_address?: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filters, setFilters] = useState<DatasetFilters>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const { datasets, loading, error, refreshDatasets } = useDatasets(filters);
  const { walletState, connecting, connectWallet, disconnectWallet } = useWallet();

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
    // In a real app, this would trigger the upload to blockchain and database
    alert(`Dataset analyzed successfully!\n\n${data.analysis.summary}\n\nFields detected: ${data.analysis.fields.join(', ')}\n\nThis would normally be uploaded to the blockchain and database.`);
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

  const handlePaymentSuccess = () => {
    if (selectedDataset) {
      handleDownload(selectedDataset.id);
      setShowPaymentModal(false);
      setSelectedDataset(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                🌍 Africa Research Base
              </h1>
              <span className="ml-3 text-sm text-gray-500 hidden sm:block px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                AI-Powered Data Repository
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('browse')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === 'browse'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Browse Datasets
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Upload Dataset
              </button>

              {/* Wallet Connection Button */}
              <button
                onClick={walletState.connected ? disconnectWallet : connectWallet}
                disabled={connecting}
                className={`px-4 py-2 rounded-md transition-colors font-medium ${
                  walletState.connected
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                } disabled:opacity-50`}
              >
                {connecting ? (
                  '🔗 Connecting...'
                ) : walletState.connected ? (
                  `🔗 ${walletState.publicKey?.slice(0, 8)}...`
                ) : (
                  '🔗 Connect Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'upload' ? (
          /* Upload View */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Your Research Dataset
              </h2>
              <p className="text-lg text-gray-600">
                Share your data with the African research community. Our AI will analyze and catalog it automatically.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  File Requirements:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSV or Excel files up to 100MB</li>
                  <li>• First row should contain column headers</li>
                  <li>• Data will be automatically analyzed for quality and metadata</li>
                  <li>• You&apos;ll earn reputation points for high-quality uploads</li>
                </ul>
              </div>

              <FileUpload
                onFileAnalyzed={handleFileAnalyzed}
                onUploadProgress={setUploadProgress}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
        ) : (
          /* Browse View */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Research Datasets
              </h2>
              <p className="text-lg text-gray-600">
                Explore high-quality datasets from African researchers across various fields.
              </p>
            </div>

            {/* Platform Statistics */}
            <StatsOverview datasets={datasets} />

            {/* Data Analytics */}
            <DatasetAnalytics datasets={datasets} />

            {/* Search and Filters */}
            <SearchFilter
              onFilter={setFilters}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading datasets...</span>
              </div>
            ) : datasets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onDownload={handleDownload}
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
                    onClick={() => setCurrentView('upload')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Upload First Dataset
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

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

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🌍 Africa Research Base
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                The premier AI-powered data repository for African researchers.
                Share, discover, and collaborate on research data across the continent.
                Built with cutting-edge blockchain technology for transparent and secure data attribution.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  AI-Powered Analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Blockchain Security
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Community Driven
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• AI-powered data analysis</li>
                <li>• Blockchain attribution</li>
                <li>• Cross-institutional collaboration</li>
                <li>• Quality scoring system</li>
                <li>• Real-time analytics</li>
                <li>• Secure file storage</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Built With</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Next.js & TypeScript</li>
                <li>• Solana Blockchain</li>
                <li>• Supabase Database</li>
                <li>• Groq AI Analysis</li>
                <li>• Tailwind CSS</li>
                <li>• Recharts Visualization</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">
                &copy; 2024 Africa Research Base. Empowering African research through technology.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">Powered by</span>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">🌍 Africa</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">🤖 AI</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">⛓️ Blockchain</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
