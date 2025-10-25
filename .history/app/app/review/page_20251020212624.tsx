// app/components/ReviewInterface.tsx
"use client";

import React, { useState } from 'react';
import { Star, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ReviewInterfaceProps {
  datasetId: string;
  datasetTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewInterface({
  datasetId,
  datasetTitle,
  onSuccess,
  onCancel,
}: ReviewInterfaceProps) {
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [completenessRating, setCompletenessRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [methodologyRating, setMethodologyRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState<'approve' | 'reject' | 'needs_improvement'>('approve');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    label: string;
  }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm font-medium text-gray-600">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!accuracyRating || !completenessRating || !relevanceRating || !methodologyRating) {
      setError('Please provide ratings for all criteria');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId,
          accuracyRating,
          completenessRating,
          relevanceRating,
          methodologyRating,
          feedback,
          recommendation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
        <p className="text-gray-600 mb-4">Thank you for contributing to the research community.</p>
        <p className="text-sm text-green-600 font-medium">You earned 20 points!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Dataset</h2>
      <p className="text-gray-600 mb-6">{datasetTitle}</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        {/* Rating Criteria */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate the Dataset</h3>
          
          <StarRating
            value={accuracyRating}
            onChange={setAccuracyRating}
            label="Data Accuracy"
          />
          
          <StarRating
            value={completenessRating}
            onChange={setCompletenessRating}
            label="Completeness"
          />
          
          <StarRating
            value={relevanceRating}
            onChange={setRelevanceRating}
            label="Research Relevance"
          />
          
          <StarRating
            value={methodologyRating}
            onChange={setMethodologyRating}
            label="Methodology Quality"
          />
        </div>

        {/* Feedback */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Share your thoughts about the dataset quality, methodology, or areas for improvement..."
          />
        </div>

        {/* Recommendation */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Recommendation <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
              <input
                type="radio"
                name="recommendation"
                value="approve"
                checked={recommendation === 'approve'}
                onChange={(e) => setRecommendation(e.target.value as any)}
                className="w-4 h-4 text-green-600 focus:ring-green-500"
              />
              <div className="ml-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Approve</div>
                  <div className="text-sm text-gray-600">High-quality, ready for use</div>
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
              <input
                type="radio"
                name="recommendation"
                value="needs_improvement"
                checked={recommendation === 'needs_improvement'}
                onChange={(e) => setRecommendation(e.target.value as any)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <div className="ml-3 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-medium text-gray-900">Needs Improvement</div>
                  <div className="text-sm text-gray-600">Has potential but requires refinement</div>
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
              <input
                type="radio"
                name="recommendation"
                value="reject"
                checked={recommendation === 'reject'}
                onChange={(e) => setRecommendation(e.target.value as any)}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <div className="ml-3 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">Reject</div>
                  <div className="text-sm text-gray-600">Does not meet quality standards</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Points Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Earn 20 points</strong> for submitting a review. Help the community by providing honest, constructive feedback!
        </p>
      </div>
    </div>
  );
}