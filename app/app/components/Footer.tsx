"use client"

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Linkedin, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <footer className="bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Section - Contact Info */}
          <div className="space-y-8">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.svg" 
                alt="Africa Research Base Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold">AFRICA RESEARCH BASE</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-wrap gap-6 text-sm">
              <Link href="/discover" className="hover:text-blue-300 transition-colors">
                Discover
              </Link>
              <Link href="/faq" className="hover:text-blue-300 transition-colors">
                Docs
              </Link>
              <Link href="/about" className="hover:text-blue-300 transition-colors">
                About Us
              </Link>
            </nav>

            {/* Contact Us Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Contact us</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-blue-300">Website:</span>{' '}
                  <a href="https://africaresearchbase.netlify.app" className="hover:text-blue-300 transition-colors">
                    africaresearchbase.netlify.app
                  </a>
                </div>
                <div>
                  <span className="text-blue-300">Phone:</span>{' '}
                  <a href="tel:+234-808-380-4754" className="hover:text-blue-300 transition-colors">
                    +234-808-380-4754
                  </a>
                </div>
                <div>
                  <span className="text-blue-300">Address:</span>{' '}
                  1234 Mainland, Lagos State, Nigeria
                </div>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://linkedin.com/company/africa-research-base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com/africa-research-base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com/AfResearchBase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right Section - Newsletter */}
          <div className="space-y-6">
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Subscribe to news
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-white/60">
          <div>
            © 2025 Africa Research Base. All Rights Reserved.
          </div>
          <Link href="/privacy" className="hover:text-white transition-colors mt-4 sm:mt-0">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}