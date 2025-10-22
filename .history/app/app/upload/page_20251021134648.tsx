/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
    });
  }, []);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  async function handleUpload() {
    if (!session) {
      toast.error("You must be signed in to upload datasets.");
      return;
    }
    if (!file || !title.trim()) {
      toast.error("Please provide a title and file.");
      return;
    }
    setUploading(true);
    try {
      const user = session.user;
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage bucket
      const { error: uploadError } = await supabase.storage
        .from("datasets")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("datasets")
        .getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;

      // Insert dataset record
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

      toast.success("✅ Dataset uploaded successfully!");
      setFile(null);
      setTitle("");
      setDescription("");
      
      // Notify Explore page to refresh
      window.dispatchEvent(new Event("datasetUploaded"));
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white/5 rounded-2xl shadow-lg border border-gray-800">
      <h1 className="text-2xl font-semibold mb-6 text-white">Upload Dataset</h1>
      
      <input
        type="text"
        placeholder="Dataset Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-4 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      <textarea
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full mb-4 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      
      {/* Drag and Drop File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-4 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.json,.zip,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-white">
              {file ? file.name : 'Drop your research dataset here, or click to browse'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports CSV, Excel, JSON, ZIP, and TXT files up to 100MB
            </p>
          </div>

          <button
            type="button"
            onClick={onButtonClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            {uploading ? 'Processing...' : 'Choose File'}
          </button>
        </div>
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">Uploading your dataset...</p>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading..." : "Upload Dataset"}
      </button>
    </div>
  );
}