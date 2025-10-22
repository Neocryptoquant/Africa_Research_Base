"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { X, Loader2, User, Mail, Building2, MapPin, BookOpen } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // callback for parent refresh
}

export default function ProfileModal({ isOpen, onClose, onUpdate }: ProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    institution: "",
    researchField: "",
    country: ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get Supabase user ID from session
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
    };
    if (session) fetchUserId();
  }, [session, supabase]);

  // Load user profile data
  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: data.full_name || "",
          email: data.email || "",
          institution: data.institution || "",
          researchField: data.research_field || "",
          country: data.country || ""
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User not found.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          email: formData.email,
          institution: formData.institution,
          research_field: formData.researchField,
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.fullName,
          email: formData.email
        }
      });

      toast.success("Profile updated successfully!");
      if (onUpdate) onUpdate();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster position="top-center" />
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-5 py-3">
            <h2 className="font-semibold text-lg">Edit Profile</h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-1 rounded hover:bg-blue-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-600" />
              <p className="mt-3 text-gray-500">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-500" /> Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Institution */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 mr-2 text-gray-500" /> Institution
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Research Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-gray-500" /> Research Field
                </label>
                <select
                  value={formData.researchField}
                  onChange={(e) => handleChange("researchField", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select field</option>
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

              {/* Country */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" /> Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
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
