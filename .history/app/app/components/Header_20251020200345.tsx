'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  institution: string | null;
  research_field: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function ProfileModal() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch user profile
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setMessage('Error loading profile');
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session]);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Handle update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !profile) return;

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        full_name: profile.full_name,
        institution: profile.institution,
        research_field: profile.research_field,
        country: profile.country,
        bio: profile.bio,
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile.');
    } else {
      setMessage('Profile updated successfully ✅');
    }
    setSaving(false);
  };

  if (loading) return <p className="text-center py-6">Loading profile...</p>;
  if (!profile) return <p className="text-center py-6">No profile data found.</p>;

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-xl p-6 mt-10">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Profile</h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={profile.full_name || ''}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Institution</label>
          <input
            type="text"
            name="institution"
            value={profile.institution || ''}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Research Field</label>
          <input
            type="text"
            name="research_field"
            value={profile.research_field || ''}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            name="country"
            value={profile.country || ''}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            name="bio"
            value={profile.bio || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        {message && <p className="text-sm text-center text-gray-600">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
