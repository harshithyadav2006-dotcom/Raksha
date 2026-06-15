import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-6">
          {/* Pulsing shield logo */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold tracking-widest text-white">R</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium tracking-[0.3em] text-white uppercase">RAKSHA NEXUS</span>
            <span className="text-xs text-gray-500 tracking-widest">AUTHENTICATING...</span>
          </div>
          {/* Loading bar */}
          <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full animate-[loadBar_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loadBar {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 60%; margin-left: 20%; }
            100% { width: 0%; margin-left: 100%; }
          }
        ` }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
