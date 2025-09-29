"use client"

import React from 'react';
import { Download, Star, Calendar, FileText, Eye, DollarSign, Database } from 'lucide-react';
import { Dataset } from '../hooks/useDatasets';

interface ModernDatasetCardProps {
  dataset: Dataset;
  onPurchase: (dataset: Dataset) => void;
  onView?: (dataset: Dataset) => void;
  isOwner?: boolean;
}

const fieldColors = {
  'Environmental Science': 'from-green-400 to-emerald-600',
  'Public Health': 'from-red-400 to-pink-600',
  'Education': 'from-blue-400 to-indigo-600',
  'Agriculture': 'from-yellow-400 to-orange-600',
  'Economics': 'from-purple-400 to-violet-600',
  'Social Sciences': 'from-teal-400 to-cyan-600',
  'Technology': 'from-gray-400 to-slate-600',
  'Other': 'from-amber-400 to-orange-600'
};

export function ModernDatasetCard({ dataset, onPurchase, onView, isOwner }: ModernDatasetCardProps) {
  const fieldColor = fieldColors[dataset.field as keyof typeof fieldColors] || fieldColors['Other'];
  const priceInSol = dataset.price_lamports / 1e9;
  const fileSizeInMB = (dataset.file_size / 1024 / 1024).toFixed(2);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
      {/* Header with gradient background */}
      <div className={`h-32 bg-gradient-to-br ${fieldColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
            {dataset.field}
          </span>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getQualityBadgeColor(dataset.quality_score)} backdrop-blur-sm`}>
            <Star className="w-3 h-3 mr-1" />
            {dataset.quality_score}%
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 translate-y-8"></div>
        <div className="absolute top-1/2 right-4 w-16 h-16 bg-white/5 rounded-full"></div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {dataset.file_name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {dataset.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {dataset.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {tag}
            </span>
          ))}
          {dataset.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
              +{dataset.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span>{dataset.row_count.toLocaleString()} × {dataset.column_count}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>{fileSizeInMB} MB</span>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-gray-400" />
            <span>{dataset.download_count} downloads</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(dataset.created_at)}</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              {priceInSol === 0 ? 'Free' : `$${(dataset.price_lamports / 1000000).toFixed(0)} USDC`}
            </span>
            {priceInSol > 0 && (
              <span className="text-xs text-gray-500">
                or {(dataset.price_lamports / 5000000).toFixed(0)} $ARB
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {onView && !isOwner && (
              <button
                onClick={() => onView(dataset)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {isOwner ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Your Dataset
                </span>
                <button
                  onClick={() => onView?.(dataset)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onPurchase(dataset)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                  priceInSol === 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>{priceInSol === 0 ? 'Download' : 'Purchase'}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent group-hover:from-blue-50/20 group-hover:to-purple-50/20 pointer-events-none transition-all duration-300 rounded-2xl"></div>
    </div>
  );
}
