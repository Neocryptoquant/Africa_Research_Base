"use client";

import { useState } from "react";
import { FileUpload } from "./FileUpload";
import { toast } from "sonner";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileAnalyzed = async (data: any) => {
    console.log("Analyzed file metadata:", data);
    // Here you could trigger your Supabase upload logic, similar to UploadPage
    toast.success("File analyzed successfully! You can now proceed to upload.");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Dataset</h2>

        <FileUpload
          onFileAnalyzed={handleFileAnalyzed}
          onUploadProgress={(p) => setUploadProgress(p)}
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Progress: {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
