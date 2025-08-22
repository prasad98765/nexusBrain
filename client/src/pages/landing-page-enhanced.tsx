import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { 
  Bot, 
  Search, 
  MessageSquare, 
  Zap, 
  Globe, 
  Smartphone, 
  Mic, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Code,
  Database,
  Cpu,
  Network,
  Menu,
  X
} from 'lucide-react';
import '../styles/landing-animations.css';

export default function LandingPageEnhanced() {
  const [location, setLocation] = useLocation();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3" onClick={() => handleNav('/landing-page')} style={{ cursor: 'pointer' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#agent-bots" className="text-slate-300 hover:text-slate-100 transition-colors">Agent Bots</a>
              <a href="#ai-search" className="text-slate-300 hover:text-slate-100 transition-colors">AI Search</a>
              <a href="#ai-technology" className="text-slate-300 hover:text-slate-100 transition-colors">Technology</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base px-4 sm:px-6 transform hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Button>

              <button
                className="md:hidden text-slate-300 hover:text-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 space-y-3">
            <a href="#agent-bots" className="block text-slate-300 hover:text-slate-100 transition-colors">Agent Bots</a>
            <a href="#ai-search" className="block text-slate-300 hover:text-slate-100 transition-colors">AI Search</a>
            <a href="#ai-technology" className="block text-slate-300 hover:text-slate-100 transition-colors">Technology</a>
            <a href="#how-it-works" className="block text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight animate-fade-in-up">
            <span className="text-white">Build Intelligent</span><br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient-text">
              AI Agents
            </span><br />
            <span className="text-white">That <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-text">Connect Everything</span></span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            Create powerful AI agents for web, WhatsApp, and voice. Build intelligent search engines that understand your data. Transform how your business interacts with customers using cutting-edge AI technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 btn-pulse"
            >
              <Bot className="h-5 w-5 mr-2" />
              Create Your First Agent
            </Button>
            <Button
              variant="outline"
              onClick={handleGetStarted}
              className="border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
            >
              <Search className="h-5 w-5 mr-2" />
              Build AI Search Engine
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-indigo-400">50K+</div>
              <div className="text-slate-400">Active Agents Created</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-400">99.9%</div>
              <div className="text-slate-400">Uptime Guarantee</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">24/7</div>
              <div className="text-slate-400">Smart Automation</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float animation-delay-200">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="absolute top-40 right-10 animate-float animation-delay-600">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-purple-400" />
          </div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float animation-delay-1000">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
            <Search className="h-7 w-7 text-blue-400" />
          </div>
        </div>
      </section>

      {/* Agent Bot Section */}
      <section id="agent-bots" className="py-20 px-4 sm:px-6 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              Create Powerful <span className="animate-gradient-text">Agent Bots</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Build intelligent agents that work across multiple platforms. Start with web deployment, 
              with WhatsApp and Voice capabilities coming soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Web Agent */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 card-hover hover-lift animate-fade-in-scale">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Web Agent</h3>
                  <div className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Available Now
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Deploy intelligent web agents that understand context, handle complex queries, 
                    and provide 24/7 customer support on your website.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Natural language processing
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Custom knowledge base
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Real-time conversations
                  </div>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transform hover:scale-105 transition-all duration-300"
                >
                  Create Web Agent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* WhatsApp Agent */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 card-hover hover-lift animate-fade-in-scale animation-delay-200">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">WhatsApp Agent</h3>
                  <div className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    Coming Soon
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Reach customers where they are with WhatsApp Business integration. 
                    Handle inquiries, bookings, and support through their favorite messaging platform.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-orange-400 mr-3" />
                    WhatsApp Business API
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-orange-400 mr-3" />
                    Rich media messages
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-orange-400 mr-3" />
                    Automated workflows
                  </div>
                </div>
                <Button 
                  disabled
                  className="w-full bg-gradient-to-r from-orange-500/50 to-orange-600/50 text-white/70 font-semibold py-3 rounded-xl cursor-not-allowed"
                >
                  Notify When Ready
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Voice Agent */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 card-hover hover-lift animate-fade-in-scale animation-delay-400">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
                  <Mic className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Voice Agent</h3>
                  <div className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    Coming Soon
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Create voice-activated agents for phone systems, smart speakers, and voice interfaces. 
                    Natural speech recognition and synthesis.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3" />
                    Speech-to-text processing
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3" />
                    Natural voice synthesis
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3" />
                    Multi-language support
                  </div>
                </div>
                <Button 
                  disabled
                  className="w-full bg-gradient-to-r from-blue-500/50 to-indigo-600/50 text-white/70 font-semibold py-3 rounded-xl cursor-not-allowed"
                >
                  Notify When Ready
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Search Engine Section */}
      <section id="ai-search" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              Build Intelligent <span className="animate-gradient-text">Search Engines</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Create powerful AI-driven search engines that understand context, intent, and deliver 
              relevant results from your data sources.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white">
                  Beyond Traditional Search
                </h3>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Our AI Search Engine doesn't just match keywords—it understands meaning, context, 
                  and user intent to deliver the most relevant results from your data.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Semantic Understanding</h4>
                    <p className="text-slate-400">
                      Advanced AI models understand the meaning behind queries, not just keywords, 
                      delivering more accurate and relevant results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Multi-Source Integration</h4>
                    <p className="text-slate-400">
                      Connect and search across documents, databases, websites, and APIs 
                      from a single interface.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Intelligent Ranking</h4>
                    <p className="text-slate-400">
                      AI-powered ranking algorithms consider relevance, recency, and user preferences 
                      to surface the best results first.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Search className="h-5 w-5 mr-2" />
                Build Your Search Engine
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="animate-slide-in-right">
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 card-hover">
                <div className="space-y-6">
                  <div className="bg-slate-600/50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Search className="h-5 w-5 text-indigo-400" />
                      <span className="text-slate-300">AI Search Demo</span>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 mb-3">
                      <div className="text-indigo-400 text-sm mb-1">Query:</div>
                      <div className="text-white">"Show me recent project updates from last month"</div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-green-400 text-sm mb-1">✓ Understanding Intent</div>
                        <div className="text-slate-300 text-sm">Analyzing: time range, content type, relevance</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-blue-400 text-sm mb-1">⚡ Processing Sources</div>
                        <div className="text-slate-300 text-sm">Documents: 15 • Database: 8 • APIs: 3</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-purple-400 text-sm mb-1">🎯 Results Found</div>
                        <div className="text-slate-300 text-sm">26 relevant results ranked by importance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section id="ai-technology" className="py-20 px-4 sm:px-6 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              Powered by <span className="animate-gradient-text">Advanced AI</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Built on cutting-edge AI technologies including Large Language Models, LangChain framework, 
              and enterprise-grade infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 animate-fade-in-scale">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Large Language Models</h3>
              <p className="text-slate-400">
                Powered by state-of-the-art LLMs including GPT, Claude, and custom-trained models 
                for domain-specific understanding.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Network className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">LangChain Framework</h3>
              <p className="text-slate-400">
                Built with LangChain for robust AI application development, memory management, 
                and seamless tool integration.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-400">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Enterprise Security</h3>
              <p className="text-slate-400">
                Bank-level security with data encryption, access controls, and compliance 
                with GDPR, SOC 2, and other standards.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-600">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Scalable Infrastructure</h3>
              <p className="text-slate-400">
                Auto-scaling cloud infrastructure that grows with your business, 
                handling millions of interactions seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              How It <span className="animate-gradient-text">Works</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Get started with Nexus AI Hub in three simple steps. No coding required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-6 animate-fade-in-scale">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-white">Choose Your Agent Type</h3>
              <p className="text-slate-400 leading-relaxed">
                Select from Web Agent (available now), WhatsApp Agent, or Voice Agent. 
                Each designed for specific use cases and platforms.
              </p>
            </div>

            <div className="text-center space-y-6 animate-fade-in-scale animation-delay-200">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-white">Configure & Train</h3>
              <p className="text-slate-400 leading-relaxed">
                Upload your knowledge base, configure responses, and train your agent 
                using our intuitive drag-and-drop flow builder.
              </p>
            </div>

            <div className="text-center space-y-6 animate-fade-in-scale animation-delay-400">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-white">Deploy & Scale</h3>
              <p className="text-slate-400 leading-relaxed">
                Deploy your agent with one click. Monitor performance, gather insights, 
                and scale across multiple platforms as your business grows.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
            >
              Start Building Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <span className="text-xl font-bold text-slate-100">Nexus AI Hub</span>
              </div>
              <p className="text-slate-400">
                Building the future of intelligent AI agents and search engines.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Product</h4>
              <div className="space-y-2">
                <a href="#agent-bots" className="block text-slate-400 hover:text-slate-100 transition-colors">Agent Bots</a>
                <a href="#ai-search" className="block text-slate-400 hover:text-slate-100 transition-colors">AI Search</a>
                <a href="#ai-technology" className="block text-slate-400 hover:text-slate-100 transition-colors">Technology</a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">Documentation</a>
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">API Reference</a>
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">Tutorials</a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">About</a>
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">Contact</a>
                <a href="#" className="block text-slate-400 hover:text-slate-100 transition-colors">Support</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Nexus AI Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}