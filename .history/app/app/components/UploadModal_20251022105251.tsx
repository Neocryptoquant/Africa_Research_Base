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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Glassmorphism Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-3xl my-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glassmorphism Card */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Decorative gradient blur background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2.5 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="relative max-h-[85vh] overflow-y-auto custom-scrollbar">
            <UploadPage />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.5);
        }
      `}</style>
    </div>
  );
}