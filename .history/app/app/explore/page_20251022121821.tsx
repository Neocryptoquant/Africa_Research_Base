"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  ArrowLeft,
  Download,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { DynamicTimestamp } from "@/components/DynamicTimestamp";

interface Dataset {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  uploader_id: string;
  created_at: string;
  research_field?: string;
  file_size?: number;
  ai_confidence_score?: number;
  tags?: string[];
}

export default function ExplorePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);

  async function fetchDatasets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setDatasets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDatasets();
    const refresh = () => fetchDatasets();
    window.addEventListener("datasetUploaded", refresh);
    return () => window.removeEventListener("datasetUploaded", refresh);
  }, []);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating / 20)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return fetchDatasets();
    const filtered = datasets.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDatasets(filtered);
  };

  const handleReviewClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowReviewModal(true);
    setRating(0);
    setFeedback("");
    setIsApproved(null);
    setReviewComplete(false);
  };

  const handleSubmitReview = async () => {
    if (!selectedDataset || rating === 0) {
      alert("Please provide a rating before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const token = supabase.auth.getSession();
      const { data: currentSession } = await token;
      const access_token = currentSession?.session?.access_token;

      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          accuracyRating: rating,
          completenessRating: rating,
          relevanceRating: rating,
          methodologyRating: rating,
          feedback,
          recommendation: isApproved ? "approve" : "reject",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review failed");

      alert(
        `✅ ${data.message}\n\nAI Score: ${data.dataset.aiScore}%\nHuman Score: ${data.dataset.humanScore.toFixed(
          1
        )}%\nFinal Score: ${data.dataset.finalScore}%\n\nYou earned ${
          data.rewards.reviewerPoints
        } points!`
      );

      setReviewComplete(true);
      setShowReviewModal(false);
      fetchDatasets();
    } catch (error) {
      console.error("Review submission error:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 animate-pulse">
        Loading datasets...
      </div>
    );
  }

  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">
              <DynamicTimestamp uploadDate={dataset.created_at} />
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {dataset.title}
          </h3>
          <div className="flex items-center space-x-1 mb-3">
            {renderStars(dataset.ai_confidence_score || 80)}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {dataset.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={() => handleReviewClick(dataset)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <MessageSquare className="w-4 h-4" /> Review
        </button>

        <a
          href={dataset.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {!selectedDataset && (
          <form
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto mb-10"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search author, topic, field..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        )}

        {selectedDataset ? (
          <div className="text-center text-gray-400">Coming soon...</div>
        ) : datasets.length === 0 ? (
          <p className="text-center text-gray-400">No public datasets yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        )}
      </div>

      {/* 🧩 Review Modal */}
      {showReviewModal && selectedDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Review Dataset
            </h2>
            <p className="text-gray-600 mb-4">{selectedDataset.title}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 cursor-pointer transition ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-gray-700 font-medium">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Write your feedback here..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setIsApproved(true)}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  isApproved
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <CheckCircle className="inline w-4 h-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => setIsApproved(false)}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  isApproved === false
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <XCircle className="inline w-4 h-4 mr-2" />
                Reject
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={submitting}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0 || isApproved === null}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
