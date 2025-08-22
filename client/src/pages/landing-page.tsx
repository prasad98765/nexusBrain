import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function LandingPage() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.substring(1));
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  const handleNav = (path: string) => {
    setLocation(path);
  };

  const handleGetStarted = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3" onClick={() => handleNav('/landing-page')} style={{ cursor: 'pointer' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
            <span className="text-white">Build Intelligent</span><br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI Agents
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Create powerful AI agents and search engines with Nexus AI Hub
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
          >
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
}