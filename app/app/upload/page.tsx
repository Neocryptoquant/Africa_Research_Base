/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Brain,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

export default function UploadPage() {
  const { data: nextAuthSession, status } = useSession();
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
   * AUTO SYNC NEXTAUTH SESSION → SUPABASE SESSION
   * ============================================================
   */
  useEffect(() => {
    const syncSession = async () => {
      try {
        if (status === "loading") return;

        if (nextAuthSession?.supabaseAccessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: nextAuthSession.supabaseAccessToken,
            refresh_token: nextAuthSession.supabaseAccessToken,
          });
          if (error) console.warn("Supabase session set error:", error);
          if (data?.session) setSession(data.session);
        } else {
          const { data } = await supabase.auth.getSession();
          if (data?.session) setSession(data.session);
        }
      } catch (err) {
        console.error("Session sync error:", err);
      }
    };

    syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => updatedSession && setSession(updatedSession)
    );
    return () => listener?.subscription.unsubscribe();
  }, [nextAuthSession, status]);

  /**
   * ============================================================
   * FILE HANDLERS
   * ============================================================
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelection(e.dataTransfer.files[0]);
  };

  const handleFileSelection = (selectedFile: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > maxSize)
      return toast.error("⚠️ File size exceeds 500MB limit.");
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
    const k = 1024,
      sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  /**
   * ============================================================
   * UPLOAD LOGIC + AI SCORING (Gemini)
   * ============================================================
   */
  async function handleUpload() {
    const { data: liveSession } = await supabase.auth.getSession();
    const activeSession = liveSession?.session || session;

    if (!activeSession?.user?.id)
      return toast.error("🚫 You must be signed in to upload datasets.");
    if (!file || !title.trim())
      return toast.error("📝 Please provide a dataset title and file.");

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
      const user = activeSession.user;
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // 1️⃣ Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("datasets")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("datasets")
        .getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;

      // 2️⃣ Insert into Supabase DB
      const { data: insertedDataset, error: dbError } = await supabase
        .from("datasets")
        .insert({
          uploader_id: user.id,
          title,
          description,
          research_field: "General",
          tags: [],
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: fileUrl,
          status: "pending",
          is_public: true,
          share_link: crypto.randomUUID(),
          view_count: 0,
          download_count: 0,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3️⃣ Trigger AI Analysis
      const analyzeToast = toast.loading("🤖 Gemini AI is analyzing your dataset...");

      const aiRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          fileName: file.name,
          datasetId: insertedDataset.id, // ✅ send dataset ID to API
        }),
      });

      const aiData = await aiRes.json();

      if (aiData?.success && aiData.ai_confidence_score) {
        await supabase
          .from("datasets")
          .update({
            ai_confidence_score: aiData.ai_confidence_score,
            ai_analysis: aiData.ai_analysis,
            ai_verified_at: new Date().toISOString(),
          })
          .eq("id", insertedDataset.id);

        toast.success(
          `✅ AI Confidence Score: ${aiData.ai_confidence_score}/100`,
          { id: analyzeToast }
        );
      } else {
        toast.error(
          "⚠️ AI Scoring skipped — Gemini could not analyze this file.",
          { id: analyzeToast }
        );
      }

      // 4️⃣ Wrap Up
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      window.dispatchEvent(new Event("datasetUploaded"));
      toast.success("🎉 Dataset uploaded successfully!");

      setTimeout(() => {
        setFile(null);
        setTitle("");
        setDescription("");
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(`❌ Upload failed: ${err.message}`);
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
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Dataset
          </h1>
          <p className="text-gray-600 text-lg">
            Share your research data with the community
          </p>
          {session?.user?.email && (
            <p className="text-sm text-gray-500 mt-2">
              Signed in as{" "}
              <span className="font-medium">{session.user.email}</span>
            </p>
          )}
        </div>

        {/* Upload Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/80 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dataset Title *
              </label>
              <input
                type="text"
                placeholder="e.g., COVID-19 Global Statistics 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Provide a short description of your dataset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl text-gray-900 resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Drag & Drop */}
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
                  } ${uploading ? "opacity-50" : ""}`}
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
                    accept=".csv,.xlsx,.json,.zip,.txt,.pdf"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileSelection(e.target.files[0])
                    }
                  />
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800 mt-4">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV, Excel, JSON, ZIP, TXT, PDF • Max 500MB
                  </p>
                </div>
              ) : (
                <div className="border-2 border-gray-300 rounded-xl p-6 bg-white/80 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold truncate">
                        {file.name}
                      </p>
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
                  <span className="text-blue-600 font-bold">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] shadow-lg transition-all flex justify-center items-center"
            >
              {uploading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Upload & Analyze
                </>
              )}
            </button>

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-blue-700 mb-1">
                  Before uploading
                </p>
                <p>
                  Ensure your dataset doesn&apos;t contain sensitive information
                  and complies with open data-sharing policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          By uploading, you agree to make this dataset publicly accessible.
        </div>
      </div>
    </div>
  );
}
