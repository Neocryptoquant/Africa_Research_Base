/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Upload, 
  Star, 
  Award, 
  TrendingUp, 
  Eye,
  Download,
  Share2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface DashboardProps {
  userId: string;
}

export default function UserDashboard({ userId }: DashboardProps) {
  const [stats, setStats] = useState({
    totalPoints: 0,
    reputationScore: 0,
    datasetsUploaded: 0,
    datasetsVerified: 0,
    reviewsGiven: 0,
    totalViews: 0,
    totalDownloads: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [topDatasets, setTopDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      // Fetch user stats
      const response = await fetch(`/api/user/dashboard?userId=${userId}`);
      const data = await response.json();
      
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setTopDatasets(data.topDatasets);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your contributions and rewards</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Points */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalPoints}</div>
          <div className="text-blue-100">Points Earned</div>
        </div>

        {/* Reputation Score */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Score
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.reputationScore}</div>
          <div className="text-purple-100">Reputation</div>
        </div>

        {/* Datasets */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.datasetsVerified}/{stats.datasetsUploaded}
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.datasetsUploaded}</div>
          <div className="text-green-100">Datasets Uploaded</div>
        </div>

        {/* Reviews */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Given
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.reviewsGiven}</div>
          <div className="text-amber-100">Reviews Given</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Datasets */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Top Datasets
            </h2>
            
            <div className="space-y-4">
              {topDatasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No datasets uploaded yet</p>
                  <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Upload Your First Dataset
                  </button>
                </div>
              ) : (
                topDatasets.map((dataset: any) => (
                  <div
                    key={dataset.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {dataset.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{dataset.view_count}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{dataset.download_count}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{dataset.final_score || dataset.ai_quality_score}%</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {dataset.verification_status === 'verified' ? (
                          <span className="flex items-center space-x-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>Verified</span>
                          </span>
                        ) : dataset.verification_status === 'pending_review' ? (
                          <span className="flex items-center space-x-1 text-amber-600 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-red-600 text-sm">
                            <XCircle className="w-4 h-4" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'upload' ? 'bg-green-100 text-green-600' :
                      activity.type === 'review' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'verification' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'upload' ? <Upload className="w-4 h-4" /> :
                       activity.type === 'review' ? <Star className="w-4 h-4" /> :
                       activity.type === 'verification' ? <CheckCircle className="w-4 h-4" /> :
                       <Trophy className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          +{activity.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Points Guide</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sign up</span>
                <span className="font-medium text-gray-900">100 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upload dataset</span>
                <span className="font-medium text-gray-900">50-150 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Review dataset</span>
                <span className="font-medium text-gray-900">20 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dataset verified</span>
                <span className="font-medium text-gray-900">200 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}