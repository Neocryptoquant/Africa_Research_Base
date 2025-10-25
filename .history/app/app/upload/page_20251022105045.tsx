/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const { data: nextAuthSession } = useSession();
  const [session, setSession] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ============================================================
   * SYNC NEXTAUTH SESSION → SUPABASE SESSION
   * ============================================================
   */

  useEffect(() => {
    const syncSession = async () => {
      try {
        if (nextAuthSession?.supabaseAccessToken) {
          await supabase.auth.setSession({
            access_token: nextAuthSession.supabaseAccessToken,
            refresh_token: nextAuthSession.supabaseAccessToken,
          });
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Supabase session error:", error);
        setSession(data?.session || null);
      } catch (err) {
        console.error("Session sync error:", err);
      }
    };
    syncSession();
  }, [nextAuthSession]);

  /**
   * ============================================================
   * FILE HANDLERS
   * ============================================================
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      alert("File size exceeds 100MB limit.");
      return;
    }
    setFile(selectedFile);
    setUploadSuccess(false);
  };

  const onButtonClick = () => fileInputRef.current?.click();

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  /**
   * ============================================================
   * UPLOAD LOGIC
   * ============================================================
   */
  async function handleUpload() {
    if (!session?.user?.id) {
      alert("You must be signed in to upload datasets.");
      return;
    }

    if (!file || !title.trim()) {
      alert("Please provide a dataset title and file.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const user = session.user;
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("datasets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("datasets")
        .getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from("datasets").insert({
        uploader_id: user.id,
        title,
        description,
        research_field: "General",
        tags: [],
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: fileUrl,
        ipfs_hash: null,
        column_count: null,
        row_count: null,
        ai_confidence_score: null,
        ai_analysis: null,
        ai_verified_at: null,
        human_verification_score: null,
        total_reviews: 0,
        is_verified: false,
        verified_at: null,
        final_verification_score: null,
        status: "pending",
        is_public: true,
        share_link: crypto.randomUUID(),
        view_count: 0,
        download_count: 0,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploadSuccess(true);
      window.dispatchEvent(new Event("datasetUploaded"));

      setTimeout(() => {
        setFile(null);
        setTitle("");
        setDescription("");
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(`Upload failed: ${err.message}`);
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  }

  /**
   * ============================================================
   * UI
   * ============================================================
   */
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Dataset
          </h1>
          <p className="text-gray-600 text-lg">
            Share your research data with the community
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/80 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dataset Title *
              </label>
              <input
                type="text"
                placeholder="e.g., COVID-19 Global Statistics 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Provide a short description of your dataset, contents, and potential use cases..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all shadow-sm"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload File *
              </label>

              {!file ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  } ${uploading ? "pointer-events-none opacity-50" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={onButtonClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.json,.zip,.txt"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileSelection(e.target.files[0])
                    }
                  />
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                    <Upload className="h-8 w-8 text-blue-600" strokeWidth={2} />
                  </div>
                  <p className="text-lg font-semibold text-gray-800 mt-4">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV, Excel, JSON, ZIP, TXT • Max 100MB
                  </p>
                </div>
              ) : (
                <div className="border-2 border-gray-300 rounded-xl p-6 bg-white/80 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    {!uploading && (
                      <button
                        onClick={removeFile}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Uploading...</span>
                  <span className="text-blue-600 font-bold">{uploadProgress}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Success */}
            {uploadSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 font-semibold">
                  Dataset uploaded successfully!
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Upload Dataset"
              )}
            </button>

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-blue-700 mb-1">Before uploading</p>
                <p>
                  Ensure your dataset doesn&apos;t contain sensitive personal information
                  and complies with data-sharing guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          By uploading, you agree to make this dataset publicly accessible.
        </div>
      </div>
    </div>
  );
}