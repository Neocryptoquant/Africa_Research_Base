"use client";

import { useState, useEffect } from "react";
import { supabase, createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

      <Input
        placeholder="Dataset Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4"
      />

      <Textarea
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mb-4"
      />

      <Input
        type="file"
        accept=".csv,.xlsx,.json,.zip,.txt"
        onChange={(e: { target: { files: any[]; }; }) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Dataset"}
      </Button>
    </div>
  );
}
