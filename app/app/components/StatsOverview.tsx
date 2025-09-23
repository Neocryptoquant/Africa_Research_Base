"use client"

import { Dataset } from '../hooks/useDatasets';

interface StatsOverviewProps {
  datasets: Dataset[];
}

export function StatsOverview({ datasets }: StatsOverviewProps) {
  // Calculate statistics
  const totalDatasets = datasets.length;
  const avgQualityScore = totalDatasets > 0
    ? Math.round(datasets.reduce((sum, d) => sum + d.quality_score, 0) / totalDatasets)
    : 0;
  const totalDownloads = datasets.reduce((sum, d) => sum + d.download_count, 0);
  const totalSize = datasets.reduce((sum, d) => sum + d.file_size, 0);
  const uniqueFields = new Set(datasets.map(d => d.field)).size;
  const excellentDatasets = datasets.filter(d => d.quality_score >= 80).length;

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  const stats = [
    {
      title: 'Total Datasets',
      value: totalDatasets.toLocaleString(),
      icon: '📊',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Average Quality',
      value: `${avgQualityScore}%`,
      icon: '⭐',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Downloads',
      value: totalDownloads.toLocaleString(),
      icon: '📥',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+23%',
      changeType: 'positive' as const
    },
    {
      title: 'Research Fields',
      value: uniqueFields.toString(),
      icon: '🔬',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+2',
      changeType: 'neutral' as const
    },
    {
      title: 'Total Storage',
      value: formatFileSize(totalSize),
      icon: '💾',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Excellent Quality',
      value: excellentDatasets.toString(),
      icon: '🏆',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      change: '+15%',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
          <p className="text-gray-600">Key metrics and performance indicators</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-700">Just now</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor} w-10 h-10 flex items-center justify-center text-lg`}>
                {stat.icon}
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quality Distribution Bar */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Distribution</h3>
        <div className="space-y-3">
          {[
            { label: 'Excellent (80-100%)', count: excellentDatasets, color: 'bg-green-500', percentage: (excellentDatasets / totalDatasets) * 100 },
            { label: 'Good (60-79%)', count: datasets.filter(d => d.quality_score >= 60 && d.quality_score < 80).length, color: 'bg-yellow-500', percentage: (datasets.filter(d => d.quality_score >= 60 && d.quality_score < 80).length / totalDatasets) * 100 },
            { label: 'Fair (40-59%)', count: datasets.filter(d => d.quality_score >= 40 && d.quality_score < 60).length, color: 'bg-orange-500', percentage: (datasets.filter(d => d.quality_score >= 40 && d.quality_score < 60).length / totalDatasets) * 100 },
            { label: 'Poor (0-39%)', count: datasets.filter(d => d.quality_score < 40).length, color: 'bg-red-500', percentage: (datasets.filter(d => d.quality_score < 40).length / totalDatasets) * 100 }
          ].map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600">{item.label}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-gray-900 text-right">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
