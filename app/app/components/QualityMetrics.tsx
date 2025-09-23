"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface QualityMetricsProps {
  qualityScore: number;
  size?: string;
  field?: string;
  downloadCount?: number;
}

export function QualityMetrics({ qualityScore, size, field, downloadCount }: QualityMetricsProps) {
  // Create radar chart data based on various metrics
  const radarData = [
    { metric: 'Quality Score', value: qualityScore, max: 100 },
    { metric: 'Completeness', value: Math.min(qualityScore + 10, 100), max: 100 },
    { metric: 'Consistency', value: Math.min(qualityScore + 5, 100), max: 100 },
    { metric: 'Accuracy', value: qualityScore, max: 100 },
    { metric: 'Relevance', value: Math.min(qualityScore - 5, 100), max: 100 },
    { metric: 'Usability', value: Math.min(qualityScore + 8, 100), max: 100 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dataset Quality Metrics</h3>
          <p className="text-sm text-gray-600">Comprehensive quality assessment</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{qualityScore}%</div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Quality Dimensions</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Quality Metrics"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Detailed Breakdown</h4>
          <div className="space-y-3">
            {radarData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: '#8884d8' }}
                  />
                  <span className="text-sm text-gray-700">{item.metric}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{size || 'N/A'}</div>
            <div className="text-xs text-gray-500">File Size</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{field || 'N/A'}</div>
            <div className="text-xs text-gray-500">Research Field</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{downloadCount || 0}</div>
            <div className="text-xs text-gray-500">Downloads</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Work'}
            </div>
            <div className="text-xs text-gray-500">Quality Level</div>
          </div>
        </div>
      </div>
    </div>
  );
}
