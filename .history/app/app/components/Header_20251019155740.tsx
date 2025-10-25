"use client"

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';

interface HeaderProps {
  onUploadClick: () => void;
}

export function Header({ onUploadClick }: HeaderProps) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  const switchToSignUp = () => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const switchToSignIn = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="Africa Research Base Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                AFRICA RESEARCH BASE
              </span>
              <span className="text-xl font-bold text-gray-900 sm:hidden">ARB</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">
                Discover
              </Link>
              
              <button onClick={onUploadClick} className="text-gray-700 hover:text-blue-600 transition-colors">
                Upload
              </button>
              
              <Link href="/my-datasets" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Datasets
              </Link>
              
              <Link href="/docs" className="text-gray-700 hover:text-blue-600 transition-colors">
                Docs
              </Link>
              
              <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About Us
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
                </div>
              ) : !session ? (
                <>
                  <button 
                    onClick={onUploadClick}
                    className="hidden sm:flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Upload
                  </button>
                  <button 
                    onClick={() => setIsSignInModalOpen(true)}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setIsSignUpModalOpen(true)}
                    className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={onUploadClick}
                    className="hidden sm:flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Upload
                  </button>
                  
                  {/* User Menu */}
                  <div className="hidden sm:flex items-center space-x-4">
                    {/* Points Display */}
                    <div className="flex items-center px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-sm font-semibold text-yellow-800">
                        {session.user?.totalPoints || 0} pts
                      </span>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {session.user?.image ? (
                          <Image 
                            src={session.user.image} 
                            alt={session.user.name || 'User'} 
                            width={32} 
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {session.user?.email}
                        </div>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <Link href="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Discover
                </Link>
                <button onClick={onUploadClick} className="text-left text-gray-700 hover:text-blue-600 transition-colors">
                  Upload
                </button>
                <Link href="/my-datasets" className="text-gray-700 hover:text-blue-600 transition-colors">
                  My Datasets
                </Link>
                <Link href="/docs" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Docs
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                  About Us
                </Link>
                
                {session ? (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {/* Mobile User Info */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {session.user?.image ? (
                          <Image 
                            src={session.user.image} 
                            alt={session.user.name || 'User'} 
                            width={40} 
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.user?.email}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Points */}
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-sm font-medium text-yellow-800">Total Points</span>
                      <span className="text-lg font-bold text-yellow-800">
                        {session.user?.totalPoints || 0}
                      </span>
                    </div>

                    {/* Mobile Sign Out */}
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <button 
                      onClick={() => setIsSignUpModalOpen(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sign Up
                    </button>
                    <button 
                      onClick={() => setIsSignInModalOpen(true)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Log In
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modals */}
      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignup={switchToSignUp}
      />
      <SignUpModal 
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToLogin={switchToSignIn}
      />
    </>
  );
}