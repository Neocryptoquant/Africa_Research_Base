"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { SignInModal } from "./SignInModal";
import { SignUpModal } from "./SignUpModal";

interface HeaderProps {
  onUploadClick: () => void;
}

export function Header({ onUploadClick }: HeaderProps) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
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
              <span className="text-xl font-bold text-gray-900 sm:hidden">
                ARB
              </span>
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
              {status === "loading" ? (
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

                  {/* Profile Dropdown */}
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center hover:bg-blue-200 transition"
                    >
                      {getInitial(session.user?.name)}
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                        <div className="px-4 py-2 text-gray-700 font-medium border-b border-gray-100">
                          {session.user?.name || "User"}
                        </div>

                        <button
                          onClick={() => alert("Open wallet modal")}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          💰 <span>Wallet</span>
                        </button>

                        <button
                          onClick={() => setIsProfileModalOpen(true)}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          ⚙️ <span>Profile</span>
                        </button>

                        <hr className="my-1 border-gray-100" />

                        <button
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600"
                        >
                          🚪 <span>Logout</span>
                        </button>
                      </div>
                    )}
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

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            <form className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  defaultValue={session.user?.name || ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  defaultValue={session.user?.email || ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Wallet Address</label>
                <input
                  type="text"
                  placeholder="Enter wallet address"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
