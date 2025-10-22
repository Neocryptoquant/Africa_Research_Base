"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Star, MessageSquare, CheckCircle, XCircle, Loader2, Award, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Dataset {
  id: string;
  title: string;
  description: string;
  research_field: string;
  file_name: string;
  row_count: number;
  column_count: number;
  ai_confidence_score: number;
  human_verification_score: number | null;
  final_verification_score: number | null;
  total_reviews: number;
  created_at: string;
  uploader: {
    full_name: string;
    institution: string;
  };
}

interface Stats {
  pendingCount: number;
  totalPoints: number;
  reviewsSubmitted: number;
  pointsPerReview: number;
}

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supabase = createClient();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingCount: 0,
    totalPoints: 0,
    reviewsSubmitted: 0,
    pointsPerReview: 20
  });
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [qualityMetrics, setQualityMetrics] = useState({
    completeness: 50,
    accuracy: 50,
    relevance: 50,
    clarity: 50
  });
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchPendingDatasets();
    }
  }, [status]);

  const fetchPendingDatasets = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const response = await fetch('/api/reviews/pending', {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setDatasets(data.datasets);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowReviewModal(true);
    // Reset form
    setRating(0);
    setFeedback('');
    setQualityMetrics({
      completeness: 50,
      accuracy: 50,
      relevance: 50,
      clarity: 50
    });
    setIsApproved(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedDataset || rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          rating,
          feedback,
          qualityMetrics,
          isApproved,
          verificationNotes: feedback
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success with score breakdown
        const message = `✅ Review Submitted Successfully!

📊 Score Breakdown:
- AI Score: ${data.dataset.aiScore}%
- Human Score: ${data.dataset.humanScore}%
- Final Score: ${data.dataset.finalScore}%

💰 You earned ${data.review.pointsAwarded} points!
🎯 Your Total: ${data.reviewer.totalPoints} points

${data.dataset.isVerified ? '🎉 Dataset is now VERIFIED!' : '⏳ Dataset under review'}`;

        alert(message);
        
        setShowReviewModal(false);
        
        // Update local stats
        setStats(prev => ({
          ...prev,
          totalPoints: data.reviewer.totalPoints,
          reviewsSubmitted: prev.reviewsSubmitted + 1,
          pendingCount: prev.pendingCount - 1
        }));
        
        // Remove reviewed dataset from list
        setDatasets(datasets.filter(d => d.id !== selectedDataset.id));
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred while submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading datasets to review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Review Datasets</h1>
          <p className="text-gray-600">
            Help verify research data quality and earn points
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Points per Review</p>
                <p className="text-3xl font-bold text-yellow-600">+{stats.pointsPerReview}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Total Points</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalPoints}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reviews Done</p>
                <p className="text-3xl font-bold text-purple-600">{stats.reviewsSubmitted}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Points Progress Bar */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow p-6 mb-8 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Points Journey</h3>
              <p className="text-sm text-gray-600">Keep reviewing to earn more!</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-600">{stats.totalPoints}</p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.totalPoints / 1000) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {1000 - stats.totalPoints > 0 
              ? `${1000 - stats.totalPoints} points until next milestone (1000)`
              : '🎉 Milestone reached! Keep going!'
            }
          </p>
        </div>

        {/* Datasets List */}
        {datasets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Datasets to Review
            </h3>
            <p className="text-gray-600 mb-4">
              You&apos;ve reviewed all available datasets or there are no new submissions yet.
            </p>
            <p className="text-sm text-gray-500">
              Check back later for new datasets that need your expertise!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Datasets ({datasets.length})
            </h2>
            
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {dataset.title}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {dataset.research_field}
                      </span>
                      {dataset.total_reviews > 0 && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {dataset.total_reviews} review{dataset.total_reviews !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {dataset.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Uploader:</span>
                        <span className="text-gray-600">{dataset.uploader.full_name}</span>
                      </div>
                      {dataset.uploader.institution && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700">Institution:</span>
                          <span className="text-gray-600">{dataset.uploader.institution}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Size:</span>
                        <span className="text-gray-600">{dataset.row_count} × {dataset.column_count}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">AI Score:</span>
                        <span className="text-blue-600 font-semibold">{dataset.ai_confidence_score}%</span>
                      </div>
                    </div>

                    {dataset.human_verification_score !== null && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4 text-sm">
                          <div>
                            <span className="text-gray-600">Human Score:</span>
                            <span className="ml-2 font-semibold text-purple-600">
                              {dataset.human_verification_score.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Final Score:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              {dataset.final_verification_score?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleReviewClick(dataset)}
                    className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Review Dataset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setShowReviewModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Dataset
              </h2>
              <p className="text-gray-600 mb-6">{selectedDataset.title}</p>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overall Rating *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-lg font-semibold text-gray-700">
                    {rating > 0 ? `${rating}/5` : 'Select rating'}
                  </span>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quality Assessment
                </label>
                <div className="space-y-4">
                  {Object.entries(qualityMetrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 capitalize">{key}</span>
                        <span className="text-sm font-semibold text-gray-900">{value}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setQualityMetrics({
                          ...qualityMetrics,
                          [key]: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your thoughts on data quality, completeness, and relevance..."
                />
              </div>

              {/* Approval Decision */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Decision
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsApproved(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      isApproved === true
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApproved(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      isApproved === false
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <XCircle className="w-5 h-5 inline mr-2" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Score Preview */}
              {rating > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Score Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800">Your Rating:</span>
                      <span className="font-semibold text-blue-900">{rating}/5 ({(rating/5*100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">AI Score:</span>
                      <span className="font-semibold text-blue-900">{selectedDataset.ai_confidence_score}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-blue-800">Potential Final Score:</span>
                      <span className="font-bold text-blue-900">
                        {((selectedDataset.ai_confidence_score * 0.4) + ((rating/5*100) * 0.6)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Review (+{stats.pointsPerReview} pts)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}