"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ArrowLeft, Download, Star } from "lucide-react";
import { DynamicTimestamp } from "@/components/DynamicTimestamp";

interface Dataset {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  uploader_id: string;
  created_at: string;
  research_field?: string;
  file_size?: number;
  ai_confidence?: number;
  tags?: string[];
}

export default function ExplorePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchDatasets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setDatasets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDatasets();

    // Refresh when new upload happens
    const refresh = () => fetchDatasets();
    window.addEventListener("datasetUploaded", refresh);
    return () => window.removeEventListener("datasetUploaded", refresh);
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return fetchDatasets();
    const filtered = datasets.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDatasets(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 animate-pulse">
        Loading datasets...
      </div>
    );
  }

  // 🧱 Dataset card
  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div
      key={dataset.id}
      onClick={() => setSelectedDataset(dataset)}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
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
          <div className="flex items-center space-x-1 mb-3">
            {renderStars(dataset.ai_confidence || 80)}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {dataset.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-900">
          📄 {dataset.file_name}
        </span>
        <button className="text-blue-600 text-sm font-medium hover:underline">
          View
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
        Uploaded by{" "}
        <span className="font-medium text-blue-600">
          {dataset.uploader_id.slice(0, 6)}...
        </span>{" "}
        • <DynamicTimestamp uploadDate={dataset.created_at} />
      </p>

      <div className="flex items-center mb-6">
        {renderStars(dataset.ai_confidence || 80)}
      </div>

      <p className="text-gray-700 leading-relaxed mb-6">
        {dataset.description}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500">Field</p>
          <p className="font-medium text-gray-900">
            {dataset.research_field || "General Research"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">File Name</p>
          <p className="font-medium text-gray-900">{dataset.file_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">File Size</p>
          <p className="font-medium text-gray-900">
            {dataset.file_size
              ? `${(dataset.file_size / 1024 / 1024).toFixed(2)} MB`
              : "Unknown"}
          </p>
        </div>
      </div>

      {dataset.tags && dataset.tags.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {dataset.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <a
          href={dataset.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Dataset
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        {!selectedDataset && (
          <form
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto mb-10"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search author, topic, field..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        )}

        {/* Conditional render: list or detail */}
        {selectedDataset ? (
          <DatasetDetail dataset={selectedDataset} />
        ) : datasets.length === 0 ? (
          <p className="text-center text-gray-400">No public datasets yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
