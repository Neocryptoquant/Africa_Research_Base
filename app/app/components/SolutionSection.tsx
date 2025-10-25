"use client"

import Image from 'next/image';

export function SolutionSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1594077810908-9ffd89d704ac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxBZnJpY2FuJTIwbWFuJTIwcmVzZWFyY2hlciUyMHRlY2hub2xvZ3klMjBkYXRhJTIwbW9kZXJuJTIwd29ya3NwYWNlfGVufDB8MHx8fDE3NTkxMzc1MjN8MA&ixlib=rb-4.1.0&q=85"
          alt="Oluwatobi Fasipe on Unsplash - African male researcher working with data and technology"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl ml-auto text-right">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            Our Solution
          </h2>

          <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed">
            An AI-powered African data repository with transparent blockchain attribution.
            Upload once, build reputation, collaborate, buy and sell data, share data as a service and stay discoverable forever.
          </p>
        </div>
      </div>
    </section>
  );
}