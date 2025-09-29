"use client"

import { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import type { DatasetFilters } from '../hooks/useDatasets';

interface SearchSectionProps {
  onFilter: (filters: DatasetFilters) => void;
}

export function SearchSection({ onFilter }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [qualityRange, setQualityRange] = useState([0, 100]);
  const [selectedFileType, setSelectedFileType] = useState('');

  const handleSearch = () => {
    onFilter({
      search: searchQuery || undefined,
      field: selectedField || undefined,
      minQuality: qualityRange[0] > 0 ? qualityRange[0] : undefined,
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedField('');
    setSelectedCountry('');
    setQualityRange([0, 100]);
    setSelectedFileType('');
    onFilter({});
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search author, topic, field..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Field</option>
            <option value="Environmental Science">Environmental Science</option>
            <option value="Public Health">Public Health</option>
            <option value="Education">Education</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Economics">Economics</option>
            <option value="Technology">Technology</option>
          </select>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Country</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="South Africa">South Africa</option>
            <option value="Ghana">Ghana</option>
            <option value="Ethiopia">Ethiopia</option>
          </select>

          <select
            value={qualityRange[0]}
            onChange={(e) => setQualityRange([parseInt(e.target.value), qualityRange[1]])}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Quality score range</option>
            <option value={50}>50%+</option>
            <option value={70}>70%+</option>
            <option value={80}>80%+</option>
            <option value={90}>90%+</option>
          </select>

          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">File type</option>
            <option value="CSV">CSV</option>
            <option value="PDF">PDF</option>
            <option value="JSON">JSON</option>
            <option value="Excel">Excel</option>
          </select>

          {(searchQuery || selectedField || selectedCountry || qualityRange[0] > 0 || selectedFileType) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Score Range
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={qualityRange[0]}
                    onChange={(e) => setQualityRange([parseInt(e.target.value), qualityRange[1]])}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[3rem]">{qualityRange[0]}%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Year
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}