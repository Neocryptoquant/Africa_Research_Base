"use client"

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UploadResult {
  id: string;
  title: string;
  shareLink: string;
  aiScore: number;
  status: string;
  pointsAwarded: number;
}

interface AIAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export default function UploadPage() {
  const [step, setStep] = useState<'upload' | 'metadata' | 'processing' | 'complete'>('upload');
  const [fileData, setFileData] = useState<never>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Metadata form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchField, setResearchField] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const supabase = createClientComponentClient();

  const handleFileAnalyzed = (data: unknown) => {
    setFileData(data);
    setStep('metadata');
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !researchField) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload datasets');
      }

      // Prepare upload data
      const uploadData = {
        file: {
          data: fileData.fileData, // Base64 encoded file
          name: fileData.fileName,
          type: fileData.fileType,
          size: fileData.fileSize
        },
        metadata: {
          title,
          description,
          researchField,
          tags,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          fileType: fileData.fileType,
          columnCount: fileData.columnCount,
          rowCount: fileData.rowCount,
          dataPreview: fileData.dataPreview,
          fields: fileData.analysis.fields
        }
      };

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(uploadData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result.dataset);
      setAiAnalysis(result.aiAnalysis);
      setStep('complete');

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
      setStep('metadata');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setStep('upload');
    setFileData(null);
    setTitle('');
    setDescription('');
    setResearchField('');
    setTags([]);
    setUploadResult(null);
    setAiAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Upload', 'Metadata', 'Processing', 'Complete'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    idx <= ['upload', 'metadata', 'processing', 'complete'].indexOf(step)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="ml-2 font-medium text-gray-700">{label}</span>
                {idx < 3 && <div className="w-16 h-1 bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Research Dataset</h1>
            <p className="text-gray-600 mb-8">
              Share your research data with the African research community and earn points
            </p>
            <FileUpload
              onFileAnalyzed={handleFileAnalyzed}
              onUploadProgress={setUploadProgress}
            />
          </div>
        )}

        {/* Step 2: Metadata Form */}
        {step === 'metadata' && fileData && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dataset Information</h2>
            
            {/* File Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">File Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File:</span>
                  <span className="ml-2 font-medium">{fileData.fileName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{(fileData.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-gray-600">Rows:</span>
                  <span className="ml-2 font-medium">{fileData.rowCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Columns:</span>
                  <span className="ml-2 font-medium">{fileData.columnCount}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Climate Change Impact on Nigerian Agriculture 2020-2023"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a detailed description of your dataset, methodology, and key findings..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {description.length} characters (minimum 100 recommended)
                </p>
              </div>

              {/* Research Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Research Field *
                </label>
                <select
                  value={researchField}
                  onChange={(e) => setResearchField(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a field</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Health">Health & Medicine</option>
                  <option value="Education">Education</option>
                  <option value="Environment">Environment & Climate</option>
                  <option value="Economics">Economics & Finance</option>
                  <option value="Technology">Technology & Innovation</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Biology">Biology & Life Sciences</option>
                  <option value="Physics">Physics & Mathematics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add tags (press Enter)"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetUpload}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Dataset</h2>
            <p className="text-gray-600 mb-4">
              Our AI is analyzing your data for quality and relevance...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && uploadResult && aiAnalysis && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Dataset Uploaded Successfully!</h2>
              <p className="text-gray-600">Your dataset has been verified and is now pending human review</p>
            </div>

            {/* AI Score Card */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Confidence Score</h3>
                <div className="text-4xl font-bold text-blue-600">{aiAnalysis.score}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${aiAnalysis.score}%` }}
                ></div>
              </div>
              <p className="text-gray-700 mb-4">{aiAnalysis.summary}</p>
              
              {/* Strengths */}
              {aiAnalysis.strengths.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">✓ Strengths:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {aiAnalysis.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {aiAnalysis.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">⚠ Suggested Improvements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {aiAnalysis.improvements.map((improvement, idx) => (
                      <li key={idx}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Points Earned */}
            <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Points Earned</h3>
                  <p className="text-gray-600">Added to your account balance</p>
                </div>
                <div className="text-4xl font-bold text-yellow-600">+{uploadResult.pointsAwarded}</div>
              </div>
            </div>

            {/* Share Link */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Dataset</h3>
              <p className="text-gray-600 mb-4">
                Once verified by peer reviewers, your dataset will be publicly accessible via this link:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/dataset/${uploadResult.shareLink}`}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/dataset/${uploadResult.shareLink}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Your dataset is now visible to peer reviewers in the community</li>
                <li>Reviewers will assess the quality and provide feedback</li>
                <li>Once you receive enough positive reviews (60% human score), your dataset will be verified</li>
                <li>Verified datasets become publicly searchable and earn you additional points</li>
                <li>Other researchers can cite and use your data for their work</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Go to Dashboard
              </button>
              <button
                onClick={resetUpload}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Upload Another Dataset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}