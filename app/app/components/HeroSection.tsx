"use client"

import { useState } from 'react';
import { Upload, TrendingUp, Globe } from 'lucide-react';

interface HeroSectionProps {
  onUploadClick: () => void;
  onExploreClick: () => void;
}

export function HeroSection({ onUploadClick, onExploreClick }: HeroSectionProps) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isCardClicked, setIsCardClicked] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save email to database
    console.log('Email signup:', email);
    setShowSignupModal(false);
    setEmail('');
    // After signup, trigger wallet connection
    onUploadClick();
  };

  const handleCardClick = () => {
    setIsCardClicked(true);
    setTimeout(() => setIsCardClicked(false), 300);
  };

  return (
    <>
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Building a self-sustaining{' '}
                  <span className="text-amber-600">knowledge economy for Africa</span>
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Africa does not have a central home for its research data.
                  Without a shared repository, researchers, innovators, and builders struggle to find reliable African data wasting time recreating what already exists and relying on foreign sources that don’t reflect our realities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onExploreClick}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <span>Explore Data</span>
                </button>
              </div>
            </div>

            {/* Right Content - Feature Card */}
            <div
              className={`bg-white rounded-2xl shadow-xl p-8 border border-gray-100 cursor-pointer transition-all duration-300 ${isCardClicked ? 'scale-95 shadow-lg' : 'hover:shadow-2xl hover:scale-105'
                }`}
              onClick={handleCardClick}
            >
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Upload Research Data</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Get Funded</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Impact Africa</span>
                </div>

                <div className="mt-8 p-4 bg-amber-50 rounded-xl">
                  <h4 className="font-semibold text-amber-800 mb-2">Featured Research</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Climate Impact Survey - Uganda</p>
                    <p className="text-amber-700 font-medium">78% funded • 23 backers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Africa Research Base</h2>
            <p className="text-gray-600 mb-6">Enter your email to get started and connect your wallet.</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}