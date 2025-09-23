import React, { useState } from 'react';
import { Dataset } from '../hooks/useDatasets';

export function DatasetCard({
  dataset,
  onDownload
}: {
  dataset: Dataset;
  onDownload?: (id: string) => void;
}) {
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatPrice = (lamports: number) => {
    const sol = lamports / 1e9;
    return sol > 0 ? `${sol} SOL` : 'Free';
  };

  const getFieldColor = (field: string) => {
    const colors: Record<string, string> = {
      environment: 'bg-green-100 text-green-800 border-green-200',
      health: 'bg-red-100 text-red-800 border-red-200',
      economics: 'bg-blue-100 text-blue-800 border-blue-200',
      social_sciences: 'bg-purple-100 text-purple-800 border-purple-200',
      education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      agriculture: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      technology: 'bg-gray-100 text-gray-800 border-gray-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[field] || colors.other;
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const [imageError, setImageError] = useState(false);

  // Remove unused variables for now
  const _imageError = imageError;
  const _setImageError = setImageError;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Header with field badge and quality indicator */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getFieldColor(dataset.field)}`}>
            <div className="w-2 h-2 rounded-full bg-current mr-2 opacity-75"></div>
            {dataset.field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>

          {/* Quality Score */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className={`w-8 h-2 rounded-full bg-gray-200`}>
                <div
                  className={`h-2 rounded-full ${getQualityColor(dataset.quality_score)}`}
                  style={{ width: `${dataset.quality_score}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-gray-600">{dataset.quality_score}/100</span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {dataset.file_name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {dataset.description}
          </p>
        </div>
      </div>

      {/* Dataset Preview/Thumbnail Area */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-center h-16 mb-2">
            <div className="text-4xl opacity-60">📊</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-medium text-gray-900">{dataset.row_count.toLocaleString()}</div>
              <div className="text-gray-500">Rows</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{dataset.column_count}</div>
              <div className="text-gray-500">Columns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {dataset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                {tag}
              </span>
            ))}
            {dataset.tags.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{dataset.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              📁 {formatFileSize(dataset.file_size)}
            </span>
            <span className="flex items-center">
              📥 {dataset.download_count}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">{formatPrice(dataset.price_lamports)}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <button
          onClick={() => onDownload?.(dataset.id)}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Download Dataset</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
    </div>
  );
}