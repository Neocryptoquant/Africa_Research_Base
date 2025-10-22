/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, Loader2, Award, TrendingUp, Star } from 'lucide-react';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchField, setResearchField] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File too large. Maximum size: 50MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        setError('Invalid file type. Supported: CSV, Excel, PDF, TXT');
        return;
      }

      setFile(selectedFile);
      setError('');
      
      // Auto-fill title from filename
      if (!title) {
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !researchField) {
      setError('Please fill all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      // Get session token
      const token = (session as any)?.accessToken || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('researchField', researchField);

      setUploadProgress(30);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);
      setUploadResult(data);
      setUploadComplete(true);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setDescription('');
        setResearchField('');
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setUploadComplete(false);
    setUploadResult(null);
    setFile(null);
    setTitle('');
    setDescription('');
    setResearchField('');
    setUploadProgress(0);
    setError('');
  };

  // Show success screen after upload
  if (uploadComplete && uploadResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-green-200">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
              <p className="text-gray-600">Your dataset has been analyzed and added to the platform</p>
            </div>

            {/* Points Earned - BIG Display */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 mb-6 text-white text-center">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">You Earned Points!</h3>
              <div className="text-6xl font-bold mb-4">
                +{uploadResult.rewards?.pointsEarned || 0}
              </div>
              <p className="text-xl opacity-90">
                New Total: {uploadResult.rewards?.newTotalPoints || 0} points
              </p>
            </div>

            {/* Points Breakdown */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Points Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(uploadResult.rewards?.breakdown || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-green-600">+{value} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Earned */}
            {(uploadResult.rewards?.badges?.firstUpload || 
              uploadResult.rewards?.badges?.highQuality || 
              uploadResult.rewards?.badges?.largeDataset) && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Badges Earned
                </h4>
                <div className="flex flex-wrap gap-3">
                  {uploadResult.rewards.badges.firstUpload && (
                    <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      🎉 First Upload
                    </div>
                  )}
                  {uploadResult.rewards.badges.highQuality && (
                    <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      ⭐ High Quality
                    </div>
                  )}
                  {uploadResult.rewards.badges.largeDataset && (
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      📊 Large Dataset
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dataset Info */}
            <div className="border border-gray-200 rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Dataset Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Title:</span>
                  <p className="font-medium text-gray-900">{uploadResult.dataset?.title}</p>
                </div>
                <div>
                  <span className="text-gray-600">Research Field:</span>
                  <p className="font-medium text-gray-900">{uploadResult.dataset?.researchField}</p>
                </div>
                <div>
                  <span className="text-gray-600">Quality Score:</span>
                  <p className="font-medium text-green-600 flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {uploadResult.dataset?.qualityScore}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <p className="font-medium text-gray-900">
                    {uploadResult.dataset?.rowCount} rows × {uploadResult.dataset?.columnCount} columns
                  </p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {uploadResult.analysis && (
              <div className="bg-purple-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>
                <p className="text-gray-700 text-sm mb-3">{uploadResult.analysis.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Completeness:</span>
                    <p className="font-semibold text-purple-600">{uploadResult.analysis.completeness}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Consistency:</span>
                    <p className="font-semibold text-purple-600">{uploadResult.analysis.consistency}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality:</span>
                    <p className="font-semibold text-purple-600">{uploadResult.analysis.qualityScore}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Upload Another Dataset
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Explore Datasets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show upload form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Research Dataset</h1>
            <p className="text-gray-600">
              Share your research data and earn points based on quality
            </p>
          </div>

          {/* Points Info Banner */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Earn Points
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Base Upload:</span>
                <p className="font-bold text-yellow-600">+50 pts</p>
              </div>
              <div>
                <span className="text-gray-600">High Quality (90+):</span>
                <p className="font-bold text-yellow-600">+100 pts</p>
              </div>
              <div>
                <span className="text-gray-600">Large Dataset:</span>
                <p className="font-bold text-yellow-600">+30 pts</p>
              </div>
              <div>
                <span className="text-gray-600">First Upload:</span>
                <p className="font-bold text-yellow-600">+50 pts</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls,.pdf,.txt"
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-2">CSV, Excel, PDF, TXT (max 50MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={uploading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your dataset, methodology, and key findings..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            {/* Research Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Field *
              </label>
              <select
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={uploading}
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

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    {uploadProgress < 30 ? 'Uploading file...' :
                     uploadProgress < 70 ? 'Analyzing with AI...' :
                     'Finalizing...'}
                  </span>
                  <span className="text-sm font-semibold text-blue-900">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                disabled={uploading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file || !title || !researchField}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Analyze
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