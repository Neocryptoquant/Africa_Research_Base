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
  const [fileData, setFileData] = useState<any>(null);
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

  const handleFileAnalyzed = (data: any) => {
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