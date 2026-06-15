import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* VIDEO BACKGROUND */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col w-full h-full flex-1">
        {/* NAVBAR */}
        <nav className="w-full px-6 md:px-12 lg:px-16 pt-6">
          <div className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between relative">
            {/* Left */}
            <div className="text-2xl font-semibold tracking-tight">RAKSHA</div>
            
            {/* Center — absolutely centered */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <Link to="/dashboard" className="text-sm text-white hover:text-gray-300 transition-colors">Dashboard</Link>
              <Link to="/crisis" className="text-sm text-white hover:text-gray-300 transition-colors">Crisis</Link>
              <Link to="/women-safety" className="text-sm text-white hover:text-gray-300 transition-colors">Women Safety</Link>
              <Link to="/public-tools?tab=report" className="text-sm text-white hover:text-gray-300 transition-colors font-medium border border-transparent hover:border-red-500/20 px-2 py-0.5 rounded transition-all bg-red-500/10 text-red-200">Report Crisis</Link>
            </div>
            
            {/* Right */}
            <div>
              <Link to="/admin" className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div className="px-6 md:px-12 lg:px-16 pb-12 lg:pb-16 flex-1 flex flex-col justify-end">
          <div className="w-full lg:grid lg:grid-cols-2 lg:items-end gap-12">
            
            {/* LEFT COLUMN */}
            <div className="flex flex-col mb-8 lg:mb-0">
              <AnimatedHeading 
                text={"Every second\nmatters."} 
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-4 tracking-[-0.04em]" 
              />
              <FadeIn delay={800} duration={1000}>
                <p className="text-base md:text-lg text-gray-300 mb-5 max-w-xl">
                  Real-time safety intelligence for cities, campuses, and communities.
                </p>
              </FadeIn>
              <FadeIn delay={1200}>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link to="/dashboard" className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-all">
                    See How It Works
                  </Link>
                  <Link
                    to="/public-tools?tab=report"
                    className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                      boxShadow: '0 0 24px rgba(220,38,38,0.45)',
                    }}
                  >
                    Report Incident
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* RIGHT COLUMN */}
            <FadeIn delay={1400} className="flex items-end justify-start lg:justify-end">
              <div className="liquid-glass border border-white/20 px-6 py-3 rounded-xl inline-block max-w-[85vw]">
                <p className="text-lg md:text-xl lg:text-2xl font-light text-white text-balance leading-snug">
                  Crisis Response. Women Safety. AI Intelligence.
                </p>
              </div>
            </FadeIn>

          </div>
        </div>
      </div>
    </div>
  );
};
