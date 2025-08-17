import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function LandingPageHub() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#tools" className="text-slate-300 hover:text-slate-100 transition-colors">AI Tools</a>
              <a href="#about" className="text-slate-300 hover:text-slate-100 transition-colors">About</a>
              <a href="#features" className="text-slate-300 hover:text-slate-100 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
              <a href="#contact" className="text-slate-300 hover:text-slate-100 transition-colors">Contact</a>
            </nav>
            
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Discover AI Tools */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto text-center space-y-8 sm:space-y-12 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up">
            <span className="text-white">Discover the </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse-glow">
              Future of AI
            </span>
          </h1>

          {/* AI Tools Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
            {/* ChatGPT */}
            <div className="bg-slate-800/60 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold">ChatGPT</h3>
                <div className="px-2 py-1 bg-blue-500/20 rounded text-blue-400 text-xs animate-pulse">Featured</div>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mb-4">
                OpenAI's advanced AI that supports writing, voice and browsing, ideation.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 animate-twinkle">⭐</span>
                  <span className="text-xs sm:text-sm">4.8</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
                  <span>Users:</span> <span>100M+</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs sm:text-sm text-slate-400">Pricing:</span>
                <span className="text-green-400 text-xs sm:text-sm">Freemium</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">AI Chat</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">Writing</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">Code</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300">Try Now</Button>
            </div>

            {/* Midjourney */}
            <div className="bg-slate-800/60 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold">Midjourney</h3>
                <div className="px-2 py-1 bg-purple-500/20 rounded text-purple-400 text-xs animate-pulse animation-delay-100">Popular</div>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mb-4">
                Premium AI tool for artists to create art and creative artwork.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 animate-twinkle animation-delay-200">⭐</span>
                  <span className="text-xs sm:text-sm">4.7</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
                  <span>Users:</span> <span>20M+</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs sm:text-sm text-slate-400">Pricing:</span>
                <span className="text-orange-400 text-xs sm:text-sm">Paid</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">Art</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">Design</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">Creative</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300">Try Now</Button>
            </div>

            {/* Claude */}
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="text-lg font-bold mb-4">Claude</h3>
              <p className="text-slate-400 text-sm mb-4">
                Claude AI assistant. Strong contextual reasoning and coding.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm">4.6</span>
                </div>
                <div className="text-sm text-slate-400">
                  <span>Users:</span> <span>10M+</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-400">Pricing:</span>
                <span className="text-green-400 text-sm">Freemium</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">AI Chat</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Analysis</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Writing</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Try Now</Button>
            </div>

            {/* GitHub Copilot */}
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="text-lg font-bold mb-4">GitHub Copilot</h3>
              <p className="text-slate-400 text-sm mb-4">
                AI pair programmer for code completion and developer productivity.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm">4.5</span>
                </div>
                <div className="text-sm text-slate-400">
                  <span>Users:</span> <span>5M+</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-400">Pricing:</span>
                <span className="text-orange-400 text-sm">Premium</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Coding</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Development</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Productivity</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Try Now</Button>
            </div>

            {/* Gemini (Google) */}
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Gemini (Google)</h3>
                <div className="px-2 py-1 bg-green-500/20 rounded text-green-400 text-xs">Popular</div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Google's flagship multimodal assistant integrated across web and services.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm">4.7</span>
                </div>
                <div className="text-sm text-slate-400">
                  <span>Users:</span> <span>450M+ monthly users</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-400">Pricing:</span>
                <span className="text-green-400 text-sm">Freemium</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">AI Chat</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Multimodal</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Search</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Try Now</Button>
            </div>

            {/* DeepSeek */}
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="text-lg font-bold mb-4">DeepSeek</h3>
              <p className="text-slate-400 text-sm mb-4">
                Open-source LLM (DeepSeek-R1) offering math, code, reasoning tasks.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm">4.4</span>
                </div>
                <div className="text-sm text-slate-400">
                  <span>Users:</span> <span>growing user base</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-400">Pricing:</span>
                <span className="text-blue-400 text-sm">Free / Open Source</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">LLM</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Research</span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs">Open Source</span>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Try Now</Button>
            </div>
          </div>
        </div>

        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
          
          {/* Floating Stars */}
          <div className="absolute top-10 left-10 w-1 h-1 bg-indigo-400 rounded-full animate-twinkle"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-twinkle animation-delay-500"></div>
          <div className="absolute bottom-32 left-20 w-1 h-1 bg-blue-400 rounded-full animate-twinkle animation-delay-1000"></div>
          <div className="absolute bottom-20 right-32 w-1 h-1 bg-indigo-300 rounded-full animate-twinkle animation-delay-1500"></div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 animate-fade-in-up">Ready to Build Your Own AI Hub?</h2>
          <p className="text-base sm:text-lg text-slate-400 mb-8 animate-fade-in-up animation-delay-300">
            Join thousands of businesses creating their personalized AI ecosystems with Nexus AI Hub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
            >
              Get Started Now →
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transform hover:scale-105 transition-all duration-300"
            >
              Explore All Tools
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800/80 border-t border-slate-700 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="text-xl font-bold text-slate-100">Nexus AI Hub</span>
          </div>
          <p className="text-slate-400">© 2025 Nexus AI Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}