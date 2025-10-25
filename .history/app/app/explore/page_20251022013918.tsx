"use client";

import { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { EnhancedUploadDialog } from "../components/EnhancedUploadDialog";
import { PaymentModal } from "../components/PaymentModal";
import { useEnhancedWallet } from "../hooks/useEnhancedWallet";
import { useDatasets, type DatasetFilters, type Dataset } from "../hooks/useDatasets";
import { Search, Filter, Star, Download, Eye, ArrowLeft } from "lucide-react";
import { DynamicTimestamp } from "../components/DynamicTimestamp";

export default function ExplorePage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<DatasetFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { walletState, connectWallet, disconnectWallet } = useEnhancedWallet();
  const { datasets, loading, error, refreshDatasets } = useDatasets(filters);

  const handleUploadClick = async () => {
    if (!walletState.connected) await connectWallet();
    if (walletState.connected) setShowUploadDialog(true);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ ...filters, [filterType]: value });
  };

  // Renders stars for rating visualization
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating / 20)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));

  // 🧱 Dataset Card
  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedDataset(dataset)}
    >
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
        </div>
        <button
          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>
      </div>
    </div>
  );

  // 🧭 Dataset Detail View
  const DatasetDetail = ({ dataset }: { dataset: Dataset }) => (
    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm max-w-4xl mx-auto">
      <button
        onClick={() => setSelectedDataset(null)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all datasets
      </button>

      <h1 className="text-3xl font-bold mb-2 text-gray-900">{dataset.title}</h1>
      <p className="text-gray-500 mb-4">
        Uploaded by <span className="font-medium text-blue-600">Francisca .C.</span> •{" "}
        <DynamicTimestamp uploadDate={dataset.created_at} />
      </p>

      <div className="flex items-center mb-6">{renderStars(dataset.quality_score)}</div>

      <p className="text-gray-700 leading-relaxed mb-6">{dataset.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500">Field</p>
          <p className="font-medium text-gray-900">{dataset.research_field}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">File size</p>
          <p className="font-medium text-gray-900">
            {(dataset.file_size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Rows / Columns</p>
          <p className="font-medium text-gray-900">
            {dataset.row_count || 0} / {dataset.column_count || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Language</p>
          <p className="font-medium text-gray-900">
            {dataset.language || "English"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Quality Score</p>
          <p className="font-medium text-gray-900">{dataset.quality_score}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Downloads</p>
          <p className="font-medium text-gray-900">{dataset.download_count}</p>
        </div>
      </div>

      {dataset.tags?.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {dataset.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-semibold text-gray-900">
            ${((dataset.price_lamports || 0) / 1000000).toFixed(0)} USDC
          </span>
        </div>
        <button
          onClick={() => purchaseDataset(dataset)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Dataset
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
     

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If viewing a dataset */}
        {selectedDataset ? (
          <DatasetDetail dataset={selectedDataset} />
        ) : (
          <>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search author, topic, field..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              <select
                onChange={(e) => handleFilterChange("field", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none"
              >
                <option value="">Field</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Public Health">Public Health</option>
                <option value="Education">Education</option>
                <option value="Agriculture">Agriculture</option>
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
              <div className="text-center py-12 text-gray-600">
                No datasets found.
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {/* Modals */}
      {showPaymentModal && selectedDataset && (
        <PaymentModal
          datasetId={selectedDataset.id}
          price={selectedDataset.price_lamports}
          recipientAddress={
            selectedDataset.contributor_address || "11111111111111111111111111111112"
          }
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <EnhancedUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={() => refreshDatasets()}
        onSuccess={() => refreshDatasets()}
      />
    </div>
  );
}
