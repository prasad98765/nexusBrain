import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Code2,
  Network,
  Menu,
  X,
  Type,
  Mail,
  Languages,
  Volume2,
  Mic,
  FileText,
  PenTool,
  Image,
  Lightbulb,
  FileDown,
  Settings,
  Bot,
  Globe,
  Target,
  Award,
  MessageSquare,
  Eye,
  Play
} from 'lucide-react';
import '../styles/landing-animations.css';
import UniversalTranslator from '@/components/UniversalTranslator';
import { useNavigate } from "react-router-dom";
import HtmlPageGenerator from '@/components/HtmlPageGenerator';

export default function LandingPageEnhanced() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [typedText, setTypedText] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [htmlGeneratorOpen, setHtmlGeneratorOpen] = useState(false);

  const heroText = "Connect 400+ LLM Models with One Key";
  const navigate = useNavigate();

  useEffect(() => {
    if (typeIndex < heroText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + heroText[typeIndex]);
        setTypeIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [typeIndex, heroText]);

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
    navigate('/auth');
  };

  const aiTools = [
    { icon: Type, name: 'Format Text', description: 'Instantly clean and format messy text', color: 'from-yellow-400 to-yellow-500' },
    { icon: Mail, name: 'Email Writer', description: 'Write professional emails in seconds', color: 'from-purple-500 to-purple-600' },
    { icon: Languages, name: 'Language Translator', description: 'Convert text to any language', color: 'from-yellow-500 to-orange-500' },
    { icon: Code2, name: 'HTML Page Generator', description: 'Create beautiful websites from text prompts', color: 'from-purple-600 to-indigo-600' },
    { icon: Volume2, name: 'Text-to-Speech', description: 'Natural AI voice for your text', color: 'from-pink-500 to-rose-500' },
    { icon: Mic, name: 'Speech-to-Text', description: 'Turn voice into accurate text', color: 'from-amber-500 to-yellow-600' },
    { icon: CheckCircle, name: 'Grammar Checker', description: 'Catch errors in real-time', color: 'from-teal-500 to-cyan-600' },
    { icon: PenTool, name: 'Grammar Corrector', description: 'Rewrite with perfect grammar', color: 'from-violet-500 to-purple-600' },
    { icon: Image, name: 'AI Image Generator', description: 'Create unique visuals from prompts', color: 'from-emerald-500 to-teal-600' },
    { icon: Lightbulb, name: 'Idea Generator', description: 'Get fresh ideas for blogs, posts, or projects', color: 'from-yellow-400 to-amber-500' },
    { icon: FileDown, name: 'Summarizer', description: 'Turn long text into concise summaries', color: 'from-yellow-400 to-purple-600' },
    { icon: FileText, name: 'Note & Document Assistant', description: 'Organize, rewrite, and refine your documents', color: 'from-purple-500 to-fuchsia-600' },
    { icon: Settings, name: 'AI Response Casting', description: 'Edit and refine AI responses to match your exact needs', color: 'from-orange-500 to-red-600' },
    { icon: Bot, name: 'Custom AI Agents', description: 'Personalized assistants for your workflow', color: 'from-indigo-500 to-purple-600' }
  ];

  const testimonials = [
    {
      name: "Rahul S.",
      role: "Content Creator",
      content: "Nexus AI Hub saves me 2 hours every day when writing emails and documents. Absolute game changer!",
      rating: 5
    },
    {
      name: "Sarah M.",
      role: "Marketing Manager",
      content: "The AI tools are incredibly intuitive. I use the grammar checker and email writer daily – they're perfect!",
      rating: 5
    },
    {
      name: "David L.",
      role: "Developer",
      content: "The LLM integration is phenomenal. Having access to 400+ models through one API is a dream come true!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('/landing-page')}>
              <div className="w-10 h-10 gradient-yellow-purple rounded-xl flex items-center justify-center animate-float shadow-lg">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">
                Nexus AI Hub
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">Features</a>
              <a href="#why-choose" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">Why Choose</a>
              <a onClick={() => { window.location.href = '/About/AI'; }} className="text-gray-700 hover:text-purple-600 transition-colors font-medium cursor-pointer">About AI</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="btn-gradient text-gray-900 font-semibold px-6 py-2 rounded-xl border-0 shadow-lg"
                data-testid="button-get-started"
              >
                Get Started Free
              </Button>

              <button
                className="md:hidden text-gray-700 hover:text-purple-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-700 hover:text-purple-600 transition-colors font-medium">Features</a>
            <a href="#why-choose" className="block text-gray-700 hover:text-purple-600 transition-colors font-medium">Why Choose</a>
            <a onClick={() => { window.location.href = '/About/AI'; }} className="block text-gray-700 hover:text-purple-600 transition-colors font-medium cursor-pointer">About AI</a>
          </div>
        )}
      </header>

      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-20 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-yellow-300/30 to-transparent rounded-full blur-3xl animate-float -top-40 -left-40"></div>
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-purple-400/30 to-transparent rounded-full blur-3xl animate-float animation-delay-1000 -bottom-40 -right-40"></div>
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-pink-300/20 to-transparent rounded-full blur-3xl animate-float animation-delay-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center space-y-8 z-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            <span className="text-purple-600 font-semibold text-lg">Powered by LangChain</span>
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="gradient-text">
              {typedText}
            </span>
            <span className="animate-pulse text-purple-600">|</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            <Zap className="inline h-6 w-6 mr-2 text-yellow-500" />
            Access over 400+ advanced AI models through LLM integration. Our intelligent system automatically selects the best model for your task.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Button
              onClick={handleGetStarted}
              className="btn-gradient text-gray-900 px-8 py-6 text-lg font-bold rounded-xl shadow-2xl"
              data-testid="hero-get-started"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-purple-gradient text-white px-8 py-6 text-lg font-bold rounded-xl shadow-2xl"
              data-testid="hero-explore"
            >
              <Eye className="h-5 w-5 mr-2" />
              Explore Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="text-center space-y-2 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-5xl font-bold gradient-text">400+</div>
              <div className="text-gray-600 font-medium">LLM Models Connected</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-5xl font-bold gradient-text">1</div>
              <div className="text-gray-600 font-medium">Universal API Key</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-5xl font-bold gradient-text">AI</div>
              <div className="text-gray-600 font-medium">Smart Model Selection</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-purple-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16 animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-bold">
              <span className="gradient-text">AI Tools</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect to 400+ LLM models, edit AI responses with casting, and access powerful tools – all in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aiTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Card
                  key={index}
                  className={`bg-white border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group rounded-xl ${
                    hoveredFeature === index ? 'shadow-2xl border-purple-400' : ''
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  onClick={() => {
                    if (index === 2 && tool.name === 'Language Translator') {
                      setTranslatorOpen(true);
                    }
                    if (index === 3 && tool.name === 'HTML Page Generator') {
                      setHtmlGeneratorOpen(true);
                    }
                  }}
                  data-testid={`feature-card-${index}`}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-900 group-hover:text-purple-600 transition-colors font-bold">
                      {tool.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Badge className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white border-0 px-6 py-3 text-base font-semibold rounded-xl shadow-lg">
              <Settings className="h-5 w-5 mr-2" />
              Coming Soon: RAG Tools, Function Calling, MCP Server, and More...
            </Badge>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="why-choose" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16 animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-bold">
              Why Choose <span className="gradient-text">Nexus AI Hub</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The ultimate AI-powered platform designed for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="text-center space-y-4 animate-fade-in-up p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-yellow-purple rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">All-in-One Hub</h3>
              <p className="text-gray-600 leading-relaxed">
                No need to jump between tools. Everything you need in a single, unified platform.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-up animation-delay-200 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-purple-yellow rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <Network className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">LLM Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Direct access to 400+ LLM models from top providers like OpenAI, Anthropic, Google, and more through a single unified API.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-up animation-delay-400 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-yellow-purple rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Future-Proof</h3>
              <p className="text-gray-600 leading-relaxed">
                Stay ahead with automatic updates and access to the latest AI models as they're released.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-up animation-delay-600 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-purple-yellow rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant results with our optimized infrastructure and smart caching system.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-up animation-delay-800 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-yellow-purple rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade security with end-to-end encryption. Your data is always protected.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-up animation-delay-1000 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="w-20 h-20 gradient-purple-yellow rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Smart Selection</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI automatically picks the best model for your task. No configuration needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LLM Integration Highlight */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <Badge className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white border-0 px-4 py-2 text-sm font-semibold rounded-lg">
                <Zap className="h-4 w-4 mr-2 inline" />
                LLM Integration
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">
                One Key, All Models
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect to 400+ LLM models from OpenAI, Anthropic, Google, Meta, and more through a single unified API. No more managing multiple API keys or integrations.
              </p>
              <ul className="space-y-4">
                {[
                  'Universal API access to all major LLM providers',
                  'Automatic model selection based on your task',
                  'Cost optimization across different models',
                  'Real-time model performance tracking'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleGetStarted}
                className="btn-gradient text-gray-900 px-8 py-6 text-lg font-bold rounded-xl shadow-lg"
              >
                Start Building Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative animate-fade-in-up animation-delay-300">
              <div className="bg-gradient-to-br from-purple-100 to-yellow-100 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 gradient-yellow-purple rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">GPT-4o</h4>
                        <p className="text-sm text-gray-500">OpenAI</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-purple-600 h-2 rounded-full w-4/5"></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 gradient-purple-yellow rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Claude 3.5</h4>
                        <p className="text-sm text-gray-500">Anthropic</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-600 to-yellow-400 h-2 rounded-full w-3/5"></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 gradient-yellow-purple rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Gemini Pro</h4>
                        <p className="text-sm text-gray-500">Google</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-purple-600 h-2 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 to-yellow-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16 animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-bold gradient-text">
              Loved by Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users are saying about Nexus AI Hub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 rounded-2xl"
              >
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 gradient-purple-yellow rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 animate-gradient">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-white/90">
            Join thousands of users already experiencing the future of AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all"
              data-testid="cta-get-started"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 text-white/90 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Setup in 2 Minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-yellow-purple rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <span className="text-xl font-bold">Nexus AI Hub</span>
            </div>
            <div className="text-gray-400 text-center">
              <p>© 2025 Nexus AI Hub. Powered by LangChain. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UniversalTranslator
        isOpen={translatorOpen}
        onClose={() => setTranslatorOpen(false)}
      />

      <HtmlPageGenerator
        isOpen={htmlGeneratorOpen}
        onClose={() => setHtmlGeneratorOpen(false)}
      />
    </div>
  );
}
