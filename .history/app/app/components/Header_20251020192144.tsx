"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, LogOut, Wallet, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SignInModal } from "./SignInModal";
import { SignUpModal } from "./SignUpModal";
import { ProfileModal } from "./ProfileModal";

interface HeaderProps {
  onUploadClick: () => void;
}

export function Header({ onUploadClick }: HeaderProps) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : "?";

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
              <Link
                href="/explore"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Discover
              </Link>
              <button
                onClick={onUploadClick}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Upload
              </button>
              <Link
                href="/my-datasets"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                My Datasets
              </Link>
              <Link
                href="/docs"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                About Us
              </Link>
            </nav>

            {/* Actions */}
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

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold hover:bg-blue-200 transition-colors">
                        {userInitial}
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-white rounded-xl border shadow-md"
                    >
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">
                            {session.user?.name || "User"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {session.user?.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        <User className="w-4 h-4 mr-2 text-gray-600" />
                        Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Wallet className="w-4 h-4 mr-2 text-gray-600" />
                        Wallet
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600 focus:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
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
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
