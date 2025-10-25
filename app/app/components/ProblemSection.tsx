"use client"

import Image from 'next/image';

export function ProblemSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1559409881-d1207596578f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw4fHxBZnJpY2FuJTIwd29tYW4lMjByZXNlYXJjaGVyJTIwZ2xhc3NlcyUyMGFjYWRlbWljJTIwdW5pdmVyc2l0eXxlbnwwfDB8fHwxNzU5MTM3NTIzfDA&ixlib=rb-4.1.0&q=85"
          alt="Etty Fidele on Unsplash - African female researcher with glasses in academic setting"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            The Problem
          </h2>

          <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed">
            Africa does not have a central home for its research data.
            Without a shared repository, researchers, innovators, and builders struggle to find reliable African data wasting time recreating what already exists and relying on foreign sources that don’t reflect our realities.
          </p>
        </div>
      </div>
    </section>
  );
}