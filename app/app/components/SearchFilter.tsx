
import React, { useState } from 'react';
import { DatasetFilters } from '../hooks/useDatasets';

export function SearchFilter({
  onFilter
}: {
  onFilter: (filters: DatasetFilters) => void;
}) {
  const [search, setSearch] = useState('');
  const [field, setField] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'quality' | 'price'>('newest');
  const [minQuality, setMinQuality] = useState(0);

  const handleSearch = () => {
    onFilter({
      search: search || undefined,
      field: field || undefined,
      sortBy,
      minQuality: minQuality > 0 ? minQuality : undefined
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Datasets
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search by name, description, or tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Field Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Field
          </label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Fields</option>
            <option value="environment">Environment</option>
            <option value="health">Health</option>
            <option value="economics">Economics</option>
            <option value="social_sciences">Social Sciences</option>
            <option value="education">Education</option>
            <option value="agriculture">Agriculture</option>
            <option value="technology">Technology</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="quality">Highest Quality</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>

        {/* Search Button */}
        <div>
          <button
            onClick={handleSearch}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quality Filter */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Minimum Quality: {minQuality}%
          </label>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={minQuality}
              onChange={(e) => setMinQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex gap-2 text-xs text-gray-500">
            <button
              onClick={() => setMinQuality(0)}
              className={`px-2 py-1 rounded ${minQuality === 0 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Any
            </button>
            <button
              onClick={() => setMinQuality(50)}
              className={`px-2 py-1 rounded ${minQuality === 50 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              50%+
            </button>
            <button
              onClick={() => setMinQuality(80)}
              className={`px-2 py-1 rounded ${minQuality === 80 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              80%+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
