"use client";
import { useState, useEffect } from "react";
import { supabase, createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
    });
  }, []);

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
      
      <input
        type="file"
        accept=".csv,.xlsx,.json,.zip,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full mb-4 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
      />
      
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading..." : "Upload Dataset"}
      </button>
    </div>
  );
}