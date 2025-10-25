"use client";

import { X } from "lucide-react";
import UploadPage from "@/app/upload/page";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden my-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Upload Form */}
        <div className="max-h-[85vh] overflow-y-auto">
          <UploadPage />
        </div>
      </div>
    </div>
  );
}
