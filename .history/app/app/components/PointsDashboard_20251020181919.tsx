/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react';
import { Award, TrendingUp, Upload, Eye, CheckCircle, Sparkles, Trophy, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Transaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface Stats {
  totalPoints: number;
  uploadsCount: number;
  reviewsCount: number;
  verifiedDatasets: number;
  rank: number;
  nextMilestone: number;
}

interface PointsDashboardProps {
  userId: string;
}

export default function PointsDashboard({ userId }: PointsDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    totalPoints: 0,
    uploadsCount: 0,
    reviewsCount: 0,
    verifiedDatasets: 0,
    rank: 0,
    nextMilestone: 1000
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      // Get upload count
      const { count: uploadsCount } = await supabase
        .from('datasets')
        .select('id', { count: 'exact', head: true })
        .eq('uploader_id', userId);

      // Get review count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('reviewer_id', userId);

      // Get verified datasets count
      const { count: verifiedCount } = await supabase
        .from('datasets')
        .select('id', { count: 'exact', head: true })
        .eq('uploader_id', userId)
        .eq('is_verified', true);

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate rank (simple version)
      const { count: higherRanks } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt('total_points', profile?.total_points || 0);

      const totalPoints = profile?.total_points || 0;
      const nextMilestone = Math.ceil(totalPoints / 1000) * 1000 + 1000;

      setStats({
        totalPoints,
        uploadsCount: uploadsCount || 0,
        reviewsCount: reviewsCount || 0,
        verifiedDatasets: verifiedCount || 0,
        rank: (higherRanks || 0) + 1,
        nextMilestone
      });

      setTransactions(recentTransactions || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'signup_bonus':
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      case 'dataset_upload':
        return <Upload className="w-5 h-5 text-blue-500" />;
      case 'review_submitted':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'dataset_verification':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your points dashboard...</p>
      </div>
    );
  }

  const progressToNextMilestone = (stats.totalPoints / stats.nextMilestone) * 100;

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">Your Total Points</p>
              <h2 className="text-6xl font-bold">{stats.totalPoints.toLocaleString()}</h2>
              <p className="text-white/60 text-sm mt-1">Points</p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-10 h-10" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Rank #{stats.rank}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Next Milestone: {stats.nextMilestone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Progress to Next Milestone</h3>
          <span className="text-sm font-medium text-gray-600">
            {stats.nextMilestone - stats.totalPoints} points to go
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressToNextMilestone, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">
          {progressToNextMilestone.toFixed(1)}% complete
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Uploads</p>
            <Upload className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.uploadsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Datasets shared</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Reviews</p>
            <Eye className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.reviewsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Reviews submitted</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Verified</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.verifiedDatasets}</p>
          <p className="text-xs text-gray-500 mt-1">Datasets verified</p>
        </div>
      </div>

      {/* How to Earn More */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
          How to Earn More Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload Datasets</p>
              <p className="text-gray-600">Base: +50 pts | High Quality: +100 pts | Large: +30 pts</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Review Datasets</p>
              <p className="text-gray-600">Base: +20 pts | Detailed: +10 pts | First: +30 pts</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Get Verified</p>
              <p className="text-gray-600">+200 pts when your dataset gets community verified</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">First Time Bonuses</p>
              <p className="text-gray-600">First upload: +50 pts | First review: +30 pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Start uploading or reviewing to earn points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(tx.transaction_type)}
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatTransactionType(tx.transaction_type)} • {formatDate(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +{tx.points} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}