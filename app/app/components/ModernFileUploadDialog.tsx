"use client"

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Sparkles, Brain, Zap, Loader2 } from 'lucide-react';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: any) => Promise<void>;
  onSuccess?: () => void;
}

export function ModernFileUploadDialog({ isOpen, onClose, onUpload, onSuccess }: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [researchField, setResearchField] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, Word document, text file, or spreadsheet.';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 50MB.';
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
      } else {
        setError('');
        setSelectedFile(file);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
      } else {
        setError('');
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Simulate AI analysis progress
  useEffect(() => {
    if (analyzing) {
      const stages = [
        { text: 'Extracting text content...', duration: 1000 },
        { text: 'Analyzing document structure...', duration: 1500 },
        { text: 'Identifying research topics...', duration: 2000 },
        { text: 'Calculating quality score...', duration: 1000 },
        { text: 'Generating metadata...', duration: 1500 }
      ];

      let currentStage = 0;
      let currentProgress = 0;

      const updateProgress = () => {
        if (currentStage < stages.length) {
          setAnalysisStage(stages[currentStage].text);
          
          const stageProgress = (currentStage + 1) / stages.length * 100;
          const interval = setInterval(() => {
            currentProgress += 2;
            setAnalysisProgress(Math.min(currentProgress, stageProgress));
            
            if (currentProgress >= stageProgress) {
              clearInterval(interval);
              currentStage++;
              setTimeout(updateProgress, 200);
            }
          }, stages[currentStage].duration / 50);
        }
      };

      updateProgress();
    }
  }, [analyzing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !title || !researchField) {
      setError('Please fill in all required fields and select a file.');
      return;
    }

    setUploading(true);
    setAnalyzing(true);
    setAnalysisProgress(0);
    setError('');

    try {
      const metadata = {
        title,
        researchField,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      };

      await onUpload(selectedFile, metadata);
      setSuccess(true);
      
      // Wait for analysis to complete visually
      setTimeout(() => {
        onSuccess?.();
        resetForm();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setResearchField('');
    setError('');
    setSuccess(false);
    setUploading(false);
    setAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg">
        {/* Background with gradient matching the page */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 rounded-2xl blur-sm"></div>
        
        {/* Main dialog */}
        <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-gray-600/20">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-600/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Research Data</h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Document *
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                  className="hidden"
                  disabled={uploading}
                />
                
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Drag files to upload
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">or</p>
                      <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Browse file
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      PDF, Word, Text, or Spreadsheet files up to 50MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter the title of your research"
                disabled={uploading}
                required
              />
            </div>

            {/* Research Field Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Field *
              </label>
              <select
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={uploading}
                required
              >
                <option value="">Select a field</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Public Health">Public Health</option>
                <option value="Education">Education</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Economics">Economics</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Technology">Technology</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle size={20} />
                <span className="text-sm">Upload successful! Redirecting to explore page...</span>
              </div>
            )}

            {/* AI Analysis Progress */}
            {analyzing && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <Sparkles className="w-3 h-3 text-yellow-500 dark:text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-200">AI Analysis in Progress</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{analysisStage}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-purple-700 dark:text-purple-300">
                    <span>Progress</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm text-purple-600 dark:text-purple-400">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4" />
                    <span>Quality Assessment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4" />
                    <span>Content Analysis</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Metadata Generation</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile || !title || !researchField}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
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
