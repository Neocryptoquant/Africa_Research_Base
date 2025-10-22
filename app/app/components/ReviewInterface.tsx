/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Star, Send, AlertCircle, CheckCircle, XCircle, X } from "lucide-react";

interface ReviewInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string;
  datasetTitle?: string;
  onSuccess?: () => void;
}

export function ReviewInterface({
  isOpen,
  onClose,
  datasetId = "unknown",
  datasetTitle = "Untitled Dataset",
  onSuccess,
}: ReviewInterfaceProps) {
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [completenessRating, setCompletenessRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [methodologyRating, setMethodologyRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [recommendation, setRecommendation] = useState<
    "approve" | "reject" | "needs_improvement"
  >("approve");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const StarRating = ({
    value,
    onChange,
    label,
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
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm font-medium text-gray-600">
          {value > 0 ? `${value}/5` : "Not rated"}
        </span>
      </div>
    </div>
  );

  const handleSubmit = async () => {
    setError("");

    if (
      !accuracyRating ||
      !completenessRating ||
      !relevanceRating ||
      !methodologyRating
    ) {
      setError("Please provide ratings for all criteria");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-gray-900"
                  >
                    Review Dataset
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-600 mb-6">{datasetTitle}</p>

                {success ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Review Submitted!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Thank you for contributing to the research community.
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      You earned 20 points!
                    </p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Rate the Dataset
                      </h3>

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
                        Overall Recommendation{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {[
                          {
                            value: "approve",
                            color: "green",
                            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                            title: "Approve",
                            desc: "High-quality, ready for use",
                          },
                          {
                            value: "needs_improvement",
                            color: "amber",
                            icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
                            title: "Needs Improvement",
                            desc: "Has potential but requires refinement",
                          },
                          {
                            value: "reject",
                            color: "red",
                            icon: <XCircle className="w-5 h-5 text-red-600" />,
                            title: "Reject",
                            desc: "Does not meet quality standards",
                          },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-${opt.color}-400 hover:bg-${opt.color}-50 transition-colors`}
                          >
                            <input
                              type="radio"
                              name="recommendation"
                              value={opt.value}
                              checked={recommendation === opt.value}
                              onChange={(e) =>
                                setRecommendation(e.target.value as any)
                              }
                              className={`w-4 h-4 text-${opt.color}-600 focus:ring-${opt.color}-500`}
                            />
                            <div className="ml-3 flex items-center space-x-2">
                              {opt.icon}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {opt.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {opt.desc}
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
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

                    {/* Points Info */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Earn 20 points</strong> for submitting a review.
                        Help the community by providing honest, constructive
                        feedback!
                      </p>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
