"use client"

import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useEnhancedWallet } from '../hooks/useEnhancedWallet';
import { EnhancedUploadDialog } from '../components/EnhancedUploadDialog';
import { Users, Target, Globe, TrendingUp, Award, Heart } from 'lucide-react';

export default function AboutPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { walletState, connectWallet, disconnectWallet } = useEnhancedWallet();

  const handleUploadClick = async () => {
    if (!walletState.connected) {
      await connectWallet();
    }
    if (walletState.connected) {
      setShowUploadDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-blue-600">Africa Research Base</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Building a self-sustaining knowledge economy for Africa through decentralized research data monetization.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We&apos;re revolutionizing how African researchers share, monetize, and access scientific data. 
                Our platform creates a sustainable ecosystem where quality research is rewarded and 
                knowledge flows freely across the continent.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                By leveraging blockchain technology and AI-powered analysis, we ensure data integrity, 
                fair compensation, and accelerated scientific discovery across Africa.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <Target className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Data Integrity</h3>
                <p className="text-sm text-gray-600">Blockchain-secured research data with immutable records</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Fair Compensation</h3>
                <p className="text-sm text-gray-600">Researchers earn from their valuable data contributions</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <Globe className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Continental Reach</h3>
                <p className="text-sm text-gray-600">Connecting researchers across all African nations</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl">
                <Award className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Quality Assurance</h3>
                <p className="text-sm text-gray-600">AI-powered quality scoring and peer validation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Vision</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Empowered Researchers</h3>
              <p className="text-gray-600">
                African researchers have sustainable income streams from their valuable research contributions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Sharing</h3>
              <p className="text-gray-600">
                Seamless collaboration and data sharing across African research institutions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Impact Driven</h3>
              <p className="text-gray-600">
                Research that directly addresses Africa&apos;s challenges and drives continental development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Emmanuel */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square relative">
                <img
                  src="/Emmanuel.jpg"
                  alt="Emmanuel - Co-Founder & CEO"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Emmanuel</h3>
                <p className="text-blue-600 font-medium mb-3">Co-Founder & CEO</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Visionary leader driving Africa&apos;s research revolution. Passionate about creating 
                  sustainable knowledge economies and empowering African researchers through blockchain technology.
                </p>
              </div>
            </div>

            {/* Francisca */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square relative">
                <img
                  src="/Francisca.jpg"
                  alt="Francisca - Co-Founder & CTO"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Francisca</h3>
                <p className="text-green-600 font-medium mb-3">Co-Founder & CTO</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Technical architect behind our AI-powered platform. Expert in blockchain development 
                  and machine learning, ensuring robust and scalable research data infrastructure.
                </p>
              </div>
            </div>

            {/* Walter */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square relative">
                <img
                  src="/Walter.jpg"
                  alt="Walter - Head of Research"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Walter</h3>
                <p className="text-purple-600 font-medium mb-3">Head of Research</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Research strategist and academic liaison. Ensures our platform meets the highest 
                  academic standards while fostering collaboration across African research institutions.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Approach</h2>
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Infrastructure</h3>
              <p className="text-gray-600 leading-relaxed">
                Built on Solana for fast, low-cost transactions. Every dataset is cryptographically secured 
                with immutable records of ownership, quality scores, and transaction history.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced AI systems automatically analyze uploaded research data, extracting metadata, 
                assessing quality, and ensuring datasets meet academic standards.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sustainable Economics</h3>
              <p className="text-gray-600 leading-relaxed">
                Our tokenomics model ensures researchers are fairly compensated while maintaining 
                affordable access to data for the broader research community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Movement</h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of building Africa&apos;s largest decentralized research data repository.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleUploadClick}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Contributing
            </button>
            <button
              onClick={() => window.location.href = '/explore'}
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Explore Data
            </button>
          </div>
        </div>
      </section>


      <EnhancedUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={async () => {}}
        onSuccess={() => {}}
      />
    </div>
  );
}
