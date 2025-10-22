/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  User,
  Mail,
  Building2,
  MapPin,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => Promise<void>; // ✅ added prop for Header compatibility
}

export function ProfileModal({
  isOpen,
  onClose,
  onUpdate,
}: ProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    institution: "",
    researchField: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Load user data when modal opens
  useEffect(() => {
    if (isOpen && session?.user) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", (session?.user as any)?.id)
        .single();

      if (error) throw error;

      if (profile) {
        setFormData({
          fullName: profile.full_name || "",
          email: profile.email || "",
          institution: profile.institution || "",
          researchField: profile.research_field || "",
          country: profile.country || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    // Basic validation
    if (!formData.fullName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Updating your profile...");

    try {
      // ✅ Update in Supabase
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          institution: formData.institution.trim() || null,
          research_field: formData.researchField.trim() || null,
          country: formData.country.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (session.user as any).id);

      if (updateError) throw updateError;

      // ✅ Update NextAuth session info
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: formData.fullName.trim(),
          email: formData.email.trim(),
        },
      });

      // ✅ Trigger parent refresh (from Header)
      if (onUpdate) await onUpdate();

      toast.success("Profile updated successfully!", {
        id: loadingToast,
        duration: 4000,
      });

      // ✅ Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Institution */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                  Institution
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  placeholder="University or Organization"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Research Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                  Research Field
                </label>
                <select
                  value={formData.researchField}
                  onChange={(e) =>
                    handleChange("researchField", e.target.value)
                  }
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a field</option>
                  <option value="Environmental Science">
                    Environmental Science
                  </option>
                  <option value="Public Health">Public Health</option>
                  <option value="Education">Education</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Economics">Economics</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="e.g., Nigeria, Kenya, Ghana"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
