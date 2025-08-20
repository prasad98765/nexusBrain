import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function LandingPage() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (window.location.hash) {
      // Wait for DOM to be ready
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.substring(1));
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // 100ms delay helps ensure the element is rendered
    }
  }, [location]);

  // Helper for SPA navigation and hash scrolling
  const handleNav = (path: string) => {
    // Case 3: Default client-side routing
    setLocation(path);
  };

  const handleGetStarted = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3" onClick={() => handleNav('/landing-page')} style={{ cursor: 'pointer' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <span
                onClick={() => handleNav('/landing-page/hub')}
                className="cursor-pointer text-slate-300 hover:text-slate-100 transition-colors"
              >AI Tools</span>
              <a href="/landing-page#about" className="text-slate-300 hover:text-slate-100 transition-colors">About</a>
              <a href="/landing-page#features" className="text-slate-300 hover:text-slate-100 transition-colors">Features</a>
              <a href="/landing-page#how-it-works" className="text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
              <a href="/landing-page#contact" className="text-slate-300 hover:text-slate-100 transition-colors">Contact</a>
            </nav>

            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base px-4 sm:px-6 transform hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight animate-fade-in-up">
            <span className="text-white">Build Intelligent</span><br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse-glow">
              AI Agents
            </span><br />
            <span className="text-white">That <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse-glow">Connect Everything</span></span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            Where all your AI, tools, and data converge. Create powerful agents with drag-and-drop simplicity, integrate
            any third-party service, and deploy everywhere.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
            >
              Start Building Now →
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transform hover:scale-105 transition-all duration-300"
            >
              Watch Interactive Demo
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16 animate-fade-in-up animation-delay-900">
            <div className="flex flex-col items-center gap-3 text-center group">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float">
                <span className="text-2xl">∞</span>
              </div>
              <span className="text-sm text-slate-400">Integrations</span>
            </div>

            <div className="flex flex-col items-center gap-3 text-center group">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float animation-delay-200">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-sm text-slate-400">Instant Deploy</span>
            </div>

            <div className="flex flex-col items-center gap-3 text-center group">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float animation-delay-400">
                <span className="text-2xl">🎯</span>
              </div>
              <span className="text-sm text-slate-400">Zero Code</span>
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

      {/* About Section */}
      <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 animate-fade-in-up">
              About <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Nexus AI Hub</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-4xl mx-auto animate-fade-in-up animation-delay-300">
              We're revolutionizing how businesses interact with AI by creating the world's first truly integrated AI ecosystem
              where every tool, every data source, and every AI capability works together in perfect harmony.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-slide-in-left">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6 animate-bounce-subtle">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-4">Nexus</h3>
              <p className="text-sm sm:text-base text-slate-400">
                The central connection point where all your tools, data, and AI systems unite seamlessly.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-slide-in-up animation-delay-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 animate-bounce-subtle animation-delay-200">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-4">AI</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Intelligent agents that learn, adapt, and execute complex tasks with human-like reasoning.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-slide-in-right animation-delay-600 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-6 animate-bounce-subtle animation-delay-400">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-4">Hub</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Your command center for building, managing, and deploying AI solutions across all platforms.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-6">Our Mission</h3>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto">
              <span className="text-indigo-400 font-semibold">Build intelligent agents, integrate everything.</span> We believe the future belongs to businesses that can
              seamlessly connect their AI capabilities with their existing tools and workflows. Nexus AI Hub makes this vision
              a reality by providing the most intuitive, powerful, and comprehensive AI integration platform ever created.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Powerful <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto">
              Everything you need to build, deploy, and manage intelligent AI agents that transform how your business operates and engages with customers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle">
                <span className="text-xl">👆</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">Drag & Drop Builder</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Create sophisticated AI agents with our intuitive visual interface. No coding required - just drag, drop, and deploy.
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle animation-delay-100">
                <span className="text-xl">🔗</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">Universal Integrations</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Connect any third-party tool, API, or service. From CRM systems to social media platforms - if it has an API, we can connect it.
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-400">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle animation-delay-200">
                <span className="text-xl">📱</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">Multi-Platform Deploy</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Deploy your AI agents instantly to web apps, mobile interfaces, WhatsApp bots, or any platform with our universal deployment system.
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-600">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle animation-delay-300">
                <span className="text-xl">💬</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">WhatsApp Integration</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Launch your AI agents directly on WhatsApp for instant customer engagement and automated support workflows.
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-800">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle animation-delay-400">
                <span className="text-xl">🔗</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">Public Link Sharing</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Share your AI agents via simple public links. Perfect for customer support, lead generation, or internal team tools.
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-slate-700 hover:border-slate-600 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1000">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4 animate-bounce-subtle animation-delay-500">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3">Real-time Analytics</h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Monitor your AI agents' performance with comprehensive analytics and insights to optimize engagement and effectiveness.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-6">Ready to Experience the Power?</h3>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of businesses already transforming their operations with Nexus AI Hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 px-6 sm:px-8 py-3 transform hover:scale-105 transition-all duration-300"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              What Can You Build with <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Nexus AI Agents?</span>
            </h2>
            <p className="text-lg text-slate-400">
              With Nexus AI Hub, you can build powerful AI agents tailored to your specific needs. Here are some examples:
            </p>
          </div>

          {/* Stock Market Agent Example */}
          <div className="bg-slate-800/60 p-8 rounded-xl border border-slate-700 mb-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Stock Market Agent</h3>
              <p className="text-slate-400">An intelligent agent that gives you:</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600">
                <h4 className="font-bold mb-2">Daily Market Updates</h4>
                <p className="text-slate-400 text-sm">Get top stocks and market trends delivered daily</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600">
                <h4 className="font-bold mb-2">Personalized Investment Advice</h4>
                <p className="text-slate-400 text-sm">Recommendations based on your daily budget and goals</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600">
                <h4 className="font-bold mb-2">Adaptive Learning</h4>
                <p className="text-slate-400 text-sm">Learns your preferences and improves suggestions over time</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-indigo-400 font-semibold">
                And yes—you can train it your way using custom rules and data!
              </p>
            </div>
          </div>

          {/* Use Cases Grid */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">
              💼 <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Use Cases Are Endless</span>
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">🎧</span>
                </div>
                <h4 className="font-bold mb-2">Customer Support Agents</h4>
                <p className="text-slate-400 text-sm">24/7 intelligent support that learns from interactions</p>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">✈️</span>
                </div>
                <h4 className="font-bold mb-2">Travel Planners</h4>
                <p className="text-slate-400 text-sm">Personalized itinerary creation based on preferences</p>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">💪</span>
                </div>
                <h4 className="font-bold mb-2">AI Fitness Coaches</h4>
                <p className="text-slate-400 text-sm">Custom workout plans and nutrition guidance</p>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">💬</span>
                </div>
                <h4 className="font-bold mb-2">Sales Chatbots</h4>
                <p className="text-slate-400 text-sm">Convert leads with intelligent conversations</p>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">🎯</span>
                </div>
                <h4 className="font-bold mb-2">Lead Generation</h4>
                <p className="text-slate-400 text-sm">Automated prospecting and qualification</p>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">📧</span>
                </div>
                <h4 className="font-bold mb-2">Email Summarization</h4>
                <p className="text-slate-400 text-sm">Smart inbox management and priority sorting</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/60 px-6 py-3 rounded-full border border-slate-600">
              <span className="text-lg">💡</span>
              <span className="text-slate-300">If you can imagine it, you can build it here.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              How It <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto">
              From concept to deployment in just three simple steps. No technical expertise required - our platform handles all the complexity while you focus on creating amazing AI experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-lg">01</span>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">✨</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Design Your Agent</h3>
                <p className="text-slate-400">
                  Use our intuitive drag-and-drop interface to design your AI agent's workflow, personality, and capabilities.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-lg">02</span>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Connect & Configure</h3>
                <p className="text-slate-400">
                  Integrate your favorite tools, APIs, and data sources. Configure triggers, actions, and responses with simple point-and-click setup.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-lg">03</span>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Deploy Everywhere</h3>
                <p className="text-slate-400">
                  Launch your agent instantly across web, mobile, WhatsApp, or generate a public link to share with your team and customers.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Demo Section */}
          <div className="bg-slate-800/60 p-8 rounded-xl border border-slate-700 text-center">
            <h3 className="text-2xl font-bold mb-4">See It In Action</h3>
            <p className="text-slate-400 mb-8 max-w-3xl mx-auto">
              Watch our interactive demo to see how easy it is to build powerful AI agents that can revolutionize your business processes in minutes, not months.
            </p>

            <div className="bg-slate-900/50 rounded-lg p-8 mb-6 border border-slate-600">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">▶</span>
              </div>
              <p className="text-slate-400">Click to watch interactive demo</p>
            </div>

            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3"
            >
              Try Interactive Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Future Features Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/50 mb-8">
              <span className="text-indigo-400 text-sm">Coming Soon</span>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              The Future of <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Integration</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto">
              We're building the most comprehensive AI ecosystem ever created. Get ready for features that will transform how you think about AI automation and integration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/50">
                  <span className="text-blue-400 text-xs">In Development</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">🏪</span>
              </div>
              <h3 className="text-xl font-bold mb-4">AI Hub System</h3>
              <p className="text-slate-400">
                Comprehensive AI agent marketplace with pre-built templates, community sharing, and enterprise solutions.
              </p>
            </div>

            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/50">
                  <span className="text-orange-400 text-xs">Beta Testing</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">📚</span>
              </div>
              <h3 className="text-xl font-bold mb-4">API Directory</h3>
              <p className="text-slate-400">
                Curated library of 1000+ pre-configured API integrations for instant connection to popular services.
              </p>
            </div>

            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/50">
                  <span className="text-purple-400 text-xs">Design Phase</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Advanced Analytics</h3>
              <p className="text-slate-400">
                Deep insights, performance optimization, and predictive analytics for your AI agent ecosystem.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">Be First to Experience the Future</h3>
            <p className="text-lg text-slate-400 mb-8 max-w-3xl mx-auto">
              Join our exclusive early access program and get notified the moment these powerful features go live. Plus, enjoy special pricing and priority support.
            </p>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3"
            >
              Get Early Access
            </Button>
            <p className="text-sm text-slate-500 mt-4">No spam, ever. Unsubscribe at any time.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Get In <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Touch</span>
            </h2>
            <p className="text-lg text-slate-400">
              Ready to transform your business with AI? Have questions about our platform? We'd love to hear from you and help you get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Direct Contact</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-400 text-lg">📧</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email us at</p>
                  <a href="mailto:support@nexusaihub.co.in" className="text-indigo-400 hover:text-indigo-300">
                    support@nexusaihub.co.in
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Follow Us</h3>
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="text-slate-300">🐦</span>
                </div>
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="text-slate-300">💼</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">Stay updated with our latest features and AI insights</p>
            </div>
          </div>

          <div className="mt-12 bg-slate-800/30 p-8 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold mb-6">Our Commitment</h3>
            <div className="grid gap-6 text-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Response within 24 hours</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Dedicated technical support</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Free consultation for enterprises</span>
              </div>
            </div>
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