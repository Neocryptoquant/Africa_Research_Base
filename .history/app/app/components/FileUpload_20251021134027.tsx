"use client"

import { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileAnalyzed: (data: {
    fileName: string;
    fileSize: number;
    columnCount: number;
    rowCount: number;
    dataPreview: unknown[];
    analysis: {
      fields: string[];
      dataTypes: string[];
      qualityMetrics: {
        completeness: number;
        consistency: number;
        accuracy: number;
      };
      suggestedTags: string[];
      summary: string;
    };
  }) => void;
  onUploadProgress?: (progress: number) => void;
}

export function FileUpload({ onFileAnalyzed, onUploadProgress }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setIsUploading(true);
    onUploadProgress?.(10);

    try {
      // Read file content
      const fileText = await readFileContent(file);
      onUploadProgress?.(30);

      // Parse CSV data
      let parsedData: Record<string, unknown>[] = [];
      if (file.name.endsWith('.csv')) {
        parsedData = await parseCSV(fileText);
      } else {
        // For Excel files, we'd need additional processing
        alert('Excel file processing will be implemented. For now, please use CSV files.');
        return;
      }

      onUploadProgress?.(60);

      // Analyze data
      const analysis = await analyzeData(parsedData, file.name);
      onUploadProgress?.(90);

      // Create file metadata
      const fileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        columnCount: parsedData.length > 0 ? Object.keys(parsedData[0]).length : 0,
        rowCount: parsedData.length,
        dataPreview: parsedData.slice(0, 5),
        analysis: analysis
      };

      onFileAnalyzed(fileMetadata);
      onUploadProgress?.(100);

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const parseCSV = (csvText: string): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(results.errors[0]);
          } else {
            resolve(results.data as Record<string, unknown>[]);
          }
        },
        error: reject
      });
    });
  };

  const analyzeData = async (data: Record<string, unknown>[], fileName: string) => {
    // For now, return mock analysis
    // In production, this would call the AI analysis API
    return {
      fields: data.length > 0 ? Object.keys(data[0]) : [],
      dataTypes: data.length > 0 ? Object.keys(data[0]).map(() => 'mixed') : [],
      qualityMetrics: {
        completeness: 0.95,
        consistency: 0.88,
        accuracy: 0.92
      },
      suggestedTags: ['research', 'data', 'analysis'],
      summary: `Dataset contains ${data.length} rows and ${data.length > 0 ? Object.keys(data[0]).length : 0} columns`
    };
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop your research dataset here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports CSV files up to 100MB. Your data will be analyzed by AI for quality and metadata.
            </p>
          </div>

          <button
            onClick={onButtonClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isUploading}
          >
            {isUploading ? 'Processing...' : 'Choose File'}
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">Analyzing your dataset...</p>
        </div>
      )}
    </div>
  );
}