"use client"

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, Brain, Loader2, Eye } from 'lucide-react';
import { ModernDatasetCard } from './ModernDatasetCard';

interface AnalysisResults {
  title: string;
  description: string;
  researchField: string;
  qualityScore: number;
  wordCount: number;
  pageCount: number;
  topics: string[];
  methodology: string;
  geographicScope: string;
  timeframe: string;
  language: string;
  dataTypes: string[];
}

interface EnhancedUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: Record<string, unknown>) => Promise<void>;
  onSuccess?: () => void;
}

export function EnhancedUploadDialog({ isOpen, onClose, onUpload, onSuccess }: EnhancedUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [researchField, setResearchField] = useState('');
  const [monetization, setMonetization] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setError('');
    }
  };

  const simulateAnalysis = async () => {
    setAnalyzing(true);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAnalysisProgress(i);
    }
    
    const results = {
      title,
      description: `Analysis of ${title} in ${researchField}`,
      researchField,
      qualityScore: Math.floor(Math.random() * 30) + 70,
      wordCount: Math.floor(Math.random() * 5000) + 2000,
      pageCount: Math.floor(Math.random() * 20) + 5,
      topics: [`${researchField} Research`, 'Data Analysis'],
      methodology: 'Quantitative analysis',
      geographicScope: 'Sub-Saharan Africa',
      timeframe: '2023-2024',
      language: 'English',
      dataTypes: ['Statistical Data', 'Research Findings']
    };
    
    setAnalysisResults(results);
    setAnalyzing(false);
    return results;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !title || !researchField) return;

    setUploading(true);
    setError('');

    try {
      const results = await simulateAnalysis();
      setShowResults(true);

      const metadata = {
        ...results,
        monetization,
        price: monetization === 'paid' ? parseFloat(price) : 0,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadDate: new Date().toISOString()
      };

      await onUpload(selectedFile, metadata);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setResearchField('');
    setMonetization('free');
    setPrice('');
    setUploading(false);
    setAnalyzing(false);
    setAnalysisProgress(0);
    setError('');
    setAnalysisResults(null);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  // Show results view after analysis
  if (showResults && analysisResults) {
    const mockDataset = {
      id: Date.now().toString(),
      file_name: selectedFile?.name || 'unknown.pdf',
      description: analysisResults.description,
      field: analysisResults.researchField,
      tags: analysisResults.topics,
      row_count: 1000,
      column_count: 10,
      file_size: selectedFile?.size || 0,
      quality_score: analysisResults.qualityScore,
      download_count: 0,
      price_lamports: monetization === 'paid' ? Math.floor(parseFloat(price) * 1000000) : 0,
      created_at: new Date().toISOString(),
      contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-green-50 to-amber-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload Successful!</h2>
                  <p className="text-gray-600">Your research has been processed</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-amber-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <h3 className="text-lg font-semibold mb-4">Preview of Your Dataset</h3>
            <ModernDatasetCard dataset={mockDataset} onPurchase={() => {}} isOwner={true} />
            
            <div className="bg-amber-50 rounded-xl p-4 mt-6">
              <h4 className="font-semibold mb-3 text-gray-900">Analysis Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>Quality Score: <span className="font-medium text-amber-700">{analysisResults.qualityScore}%</span></div>
                <div>Word Count: <span className="font-medium text-amber-700">{analysisResults.wordCount.toLocaleString()}</span></div>
                <div>Pages: <span className="font-medium text-amber-700">{analysisResults.pageCount}</span></div>
                <div>Monetization: <span className="font-medium text-amber-700">{monetization === 'free' ? 'Free Access' : `$${price} USDC`}</span></div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-amber-200 bg-amber-50">
            <div className="flex justify-end space-x-4">
              <button onClick={handleClose} className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
              <button onClick={() => { handleClose(); onSuccess?.(); }} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>View in Marketplace</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Upload Research Data</h2>
            <button onClick={handleClose} className="p-2 hover:bg-amber-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Research Document *</label>
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="w-8 h-8 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <p className="text-gray-600">Drag and drop your research document here or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Research Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required disabled={uploading} />
            </div>

            {/* Research Field */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Research Field *</label>
              <select value={researchField} onChange={(e) => setResearchField(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required disabled={uploading}>
                <option value="">Select Research Field</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Public Health">Public Health</option>
                <option value="Education">Education</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Economics">Economics</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            {/* Monetization */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Access & Monetization</label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                  <input type="radio" name="monetization" value="free" checked={monetization === 'free'} onChange={(e) => { setMonetization(e.target.value as 'free' | 'paid'); setPrice(''); }} disabled={uploading} className="text-amber-600 focus:ring-amber-500" />
                  <div>
                    <div className="font-medium text-gray-900">Free Access</div>
                    <div className="text-sm text-gray-500">Make your research freely available</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                  <input type="radio" name="monetization" value="paid" checked={monetization === 'paid'} onChange={(e) => setMonetization(e.target.value as 'free' | 'paid')} disabled={uploading} className="text-amber-600 focus:ring-amber-500" />
                  <div>
                    <div className="font-medium text-gray-900">Paid Access</div>
                    <div className="text-sm text-gray-500">Set a price for your research</div>
                  </div>
                </label>
              </div>

              {monetization === 'paid' && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Price (USDC) *</label>
                  <div className="relative">
                    <input type="number" step="1" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required disabled={uploading} />
                    <span className="absolute right-4 top-3 text-gray-500 font-medium">USDC</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-amber-600">Minimum: $1 USDC</p>
                    {price && (
                      <p className="text-xs text-gray-600">
                        Equivalent: {(parseFloat(price) / 50).toFixed(1)} $ARB
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis Progress */}
            {analyzing && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-6 h-6 text-amber-600 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Analysis in Progress</h3>
                    <p className="text-sm text-gray-600">Analyzing your research document...</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2 text-gray-700">
                    <span>Progress</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all" style={{ width: `${analysisProgress}%` }}></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={handleClose} disabled={uploading} className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={uploading || !selectedFile || !title || !researchField || (monetization === 'paid' && !price)} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 flex items-center space-x-2 transition-all">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Analyze</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
