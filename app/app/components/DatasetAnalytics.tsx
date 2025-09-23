"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Dataset } from '../hooks/useDatasets';

interface DatasetAnalyticsProps {
  datasets: Dataset[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

export function DatasetAnalytics({ datasets }: DatasetAnalyticsProps) {
  // Calculate analytics data
  const fieldStats = datasets.reduce((acc, dataset) => {
    acc[dataset.field] = (acc[dataset.field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const qualityDistribution = [
    { range: '0-20%', count: datasets.filter(d => d.quality_score < 20).length },
    { range: '20-40%', count: datasets.filter(d => d.quality_score >= 20 && d.quality_score < 40).length },
    { range: '40-60%', count: datasets.filter(d => d.quality_score >= 40 && d.quality_score < 60).length },
    { range: '60-80%', count: datasets.filter(d => d.quality_score >= 60 && d.quality_score < 80).length },
    { range: '80-100%', count: datasets.filter(d => d.quality_score >= 80).length }
  ];

  const fieldChartData = Object.entries(fieldStats).map(([field, count]) => ({
    field: field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    datasets: count
  }));

  const sizeDistribution = datasets.reduce((acc, dataset) => {
    const sizeInMB = dataset.file_size / (1024 * 1024);
    if (sizeInMB < 1) acc['< 1MB'] = (acc['< 1MB'] || 0) + 1;
    else if (sizeInMB < 10) acc['1-10MB'] = (acc['1-10MB'] || 0) + 1;
    else if (sizeInMB < 50) acc['10-50MB'] = (acc['10-50MB'] || 0) + 1;
    else acc['> 50MB'] = (acc['> 50MB'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sizeChartData = Object.entries(sizeDistribution).map(([size, count]) => ({
    size,
    datasets: count
  }));

  // Growth trend (mock data for demonstration)
  const growthData = [
    { month: 'Jan', datasets: 12 },
    { month: 'Feb', datasets: 19 },
    { month: 'Mar', datasets: 25 },
    { month: 'Apr', datasets: 31 },
    { month: 'May', datasets: 42 },
    { month: 'Jun', datasets: 56 }
  ];

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{datasets.length}</div>
          <div className="text-sm text-gray-600">Total Datasets</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {Math.round(datasets.reduce((sum, d) => sum + d.quality_score, 0) / datasets.length) || 0}
          </div>
          <div className="text-sm text-gray-600">Avg Quality Score</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {Object.keys(fieldStats).length}
          </div>
          <div className="text-sm text-gray-600">Research Fields</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {datasets.reduce((sum, d) => sum + d.download_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Downloads</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Research Fields Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Fields Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fieldChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ field, percent }) => `${field} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="datasets"
              >
                {fieldChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Score Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dataset Size Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Size Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sizeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="datasets" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="datasets" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
