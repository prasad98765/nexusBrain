import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Code,
  Database,
  Cpu,
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
  Infinity,
  Target,
  Award,
  MessageSquare,
  Eye,
  Play,
  Quote
} from 'lucide-react';
import '../styles/landing-animations.css';
import UniversalTranslator from '@/components/UniversalTranslator';

export default function LandingPageEnhanced() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [demoMode, setDemoMode] = useState('format');
  const [isListening, setIsListening] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [typedText, setTypedText] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  const [translatorOpen, setTranslatorOpen] = useState(false);

  const heroText = "Welcome to Nexus AI Hub – Your All-in-One AI Superpower";

  // Typing animation effect
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
    setLocation('/auth');
  };

  // AI Tools Features
  const aiTools = [
    { icon: Type, name: 'Format Text', description: 'Instantly clean and format messy text', color: 'from-blue-500 to-indigo-600' },
    { icon: Mail, name: 'Email Writer', description: 'Write professional emails in seconds', color: 'from-indigo-500 to-purple-600' },
    { icon: Languages, name: 'Language Translator', description: 'Convert text to any language', color: 'from-purple-500 to-pink-600' },
    { icon: Volume2, name: 'Text-to-Speech', description: 'Natural AI voice for your text', color: 'from-pink-500 to-red-600' },
    { icon: Mic, name: 'Speech-to-Text', description: 'Turn voice into accurate text', color: 'from-red-500 to-orange-600' },
    { icon: CheckCircle, name: 'Grammar Checker', description: 'Catch errors in real-time', color: 'from-orange-500 to-yellow-600' },
    { icon: PenTool, name: 'Grammar Corrector', description: 'Rewrite with perfect grammar', color: 'from-yellow-500 to-green-600' },
    { icon: Image, name: 'AI Image Generator', description: 'Create unique visuals from prompts', color: 'from-green-500 to-teal-600' },
    { icon: Lightbulb, name: 'Idea Generator', description: 'Get fresh ideas for blogs, posts, or projects', color: 'from-teal-500 to-cyan-600' },
    { icon: FileDown, name: 'Summarizer', description: 'Turn long text into concise summaries', color: 'from-cyan-500 to-blue-600' },
    { icon: FileText, name: 'Note & Document Assistant', description: 'Organize, rewrite, and refine your documents', color: 'from-blue-500 to-purple-600' },
    { icon: Bot, name: 'Custom AI Agents', description: 'Personalized assistants for your workflow', color: 'from-purple-500 to-indigo-600' }
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
      role: "Entrepreneur",
      content: "Finally, all AI tools in one place! The custom agents feature has transformed my business workflow.",
      rating: 5
    },
    {
      name: "Priya K.",
      role: "Student",
      content: "The summarizer and note assistant have made studying so much easier. I can't imagine working without it now.",
      rating: 5
    }
  ];

  const handleDemo = (mode: string) => {
    setDemoMode(mode);
    if (mode === 'format') {
      setDemoText('this is messy text that needs formatting...');
      setTimeout(() => setDemoText('This is messy text that needs formatting.'), 1000);
    } else if (mode === 'translate') {
      setDemoText('Hello, how are you today?');
      setTimeout(() => setDemoText('Hola, ¿cómo estás hoy?'), 1000);
    } else if (mode === 'grammar') {
      setDemoText('I are going to the store yesterday.');
      setTimeout(() => setDemoText('I went to the store yesterday.'), 1000);
    }
  };

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
              <a href="#features" className="text-slate-300 hover:text-slate-100 transition-colors">Features</a>
              <a href="#why-choose" className="text-slate-300 hover:text-slate-100 transition-colors">Why Choose</a>
              <a href="#demo" className="text-slate-300 hover:text-slate-100 transition-colors">Demo</a>
              <a href="#testimonials" className="text-slate-300 hover:text-slate-100 transition-colors">Reviews</a>
              <a href="#pricing" className="text-slate-300 hover:text-slate-100 transition-colors">Pricing</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base px-4 sm:px-6 transform hover:scale-105 transition-all duration-300"
              >
                Get Started Free
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
            <a href="#features" className="block text-slate-300 hover:text-slate-100 transition-colors">Features</a>
            <a href="#why-choose" className="block text-slate-300 hover:text-slate-100 transition-colors">Why Choose</a>
            <a href="#demo" className="block text-slate-300 hover:text-slate-100 transition-colors">Demo</a>
            <a href="#testimonials" className="block text-slate-300 hover:text-slate-100 transition-colors">Reviews</a>
            <a href="#pricing" className="block text-slate-300 hover:text-slate-100 transition-colors">Pricing</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse -top-48 -left-48"></div>
          <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse -bottom-48 -right-48"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8 z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
            <span className="text-yellow-400 font-medium">Powered by LangChain</span>
            <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
              {typedText}
            </span>
            <span className="animate-pulse">|</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            <Zap className="inline h-5 w-5 mr-2 text-yellow-400" />
            Powered by LangChain, Nexus AI Hub brings all AI tools into one place to make your life easier, faster, and smarter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 btn-pulse"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
            >
              <Eye className="h-5 w-5 mr-2" />
              Explore Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">12+</div>
              <div className="text-slate-400">AI Tools Available</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">∞</div>
              <div className="text-slate-400">Unlimited Usage</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">24/7</div>
              <div className="text-slate-400">Always Available</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              All Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Tools</span> in One Place
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              From text formatting to image generation – everything you need is right here
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aiTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Card 
                  key={index}
                  className={`bg-slate-800/80 border-slate-700 hover:border-slate-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer group ${
                    hoveredFeature === index ? 'shadow-2xl' : ''
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  onClick={() => {
                    // Open Universal Translator when Language Translator card is clicked (index 2)
                    if (index === 2 && tool.name === 'Language Translator') {
                      setTranslatorOpen(true);
                    }
                  }}
                  data-testid={`feature-card-${index}`}
                >
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white group-hover:text-indigo-300 transition-colors">
                      {tool.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-400 group-hover:text-slate-300 transition-colors">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Badge variant="outline" className="text-indigo-400 border-indigo-400 px-4 py-2 text-lg animate-pulse">
              <Settings className="h-4 w-4 mr-2" />
              + More Features Coming Soon...
            </Badge>
          </div>
        </div>
      </section>

      {/* Why Choose Nexus AI Hub */}
      <section id="why-choose" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              Why Choose <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Nexus AI Hub</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              The ultimate AI-powered platform designed for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center space-y-4 animate-fade-in-scale">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">All-in-One Hub</h3>
              <p className="text-slate-400">
                No need to jump between tools. Everything you need in a single, unified platform.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Network className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Powered by LangChain</h3>
              <p className="text-slate-400">
                Built on cutting-edge AI architecture for reliable, powerful performance.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-400">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Future-Proof</h3>
              <p className="text-slate-400">
                New AI tools and features added regularly to keep you ahead of the curve.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-600">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Easy to Use</h3>
              <p className="text-slate-400">
                Simple, clean, intuitive interface designed for effortless productivity.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-800">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">For Everyone</h3>
              <p className="text-slate-400">
                Students, professionals, creators, and businesses – built for all use cases.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-scale animation-delay-1000">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto hover-glow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Secure & Reliable</h3>
              <p className="text-slate-400">
                Enterprise-grade security with 99.9% uptime for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo / Interactive Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              See It in <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Action</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Try our AI tools right here – no signup required!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Demo */}
            <Card className="bg-slate-800/80 border-slate-700 p-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-indigo-400" />
                  Interactive Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={demoMode === 'format' ? 'default' : 'outline'}
                    onClick={() => handleDemo('format')}
                    className="text-sm"
                  >
                    Format Text
                  </Button>
                  <Button
                    variant={demoMode === 'translate' ? 'default' : 'outline'}
                    onClick={() => handleDemo('translate')}
                    className="text-sm"
                  >
                    Translate
                  </Button>
                  <Button
                    variant={demoMode === 'grammar' ? 'default' : 'outline'}
                    onClick={() => handleDemo('grammar')}
                    className="text-sm"
                  >
                    Grammar Check
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Input:</div>
                    <div className="text-white font-mono text-sm">
                      {demoMode === 'format' && 'this is messy text that needs formatting...'}
                      {demoMode === 'translate' && 'Hello, how are you today?'}
                      {demoMode === 'grammar' && 'I are going to the store yesterday.'}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-indigo-400 animate-pulse" />
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-4">
                    <div className="text-sm text-indigo-400 mb-2">AI Result:</div>
                    <div className="text-white font-mono text-sm">
                      {demoText || 'Click a demo button to see AI in action!'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Highlights */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 p-6">
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Mic className="h-6 w-6 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Speech-to-Text</h3>
                  </div>
                  <p className="text-slate-300 mb-4">Speak naturally and watch your words appear instantly with 99% accuracy.</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20"
                    onClick={() => setIsListening(!isListening)}
                  >
                    {isListening ? 'Stop Listening' : 'Try Voice Input'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6">
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Image className="h-6 w-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">AI Image Generator</h3>
                  </div>
                  <p className="text-slate-300 mb-4">Type any description and watch AI create stunning visuals in seconds.</p>
                  <Input 
                    placeholder="Describe an image..."
                    className="bg-slate-700/50 border-slate-600 text-white mb-3"
                  />
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                    Generate Image
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section id="testimonials" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              What Our Users <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Say</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Join thousands of happy users who've transformed their workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800/80 border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 text-indigo-400 mt-1 flex-shrink-0" />
                    <p className="text-slate-300 text-sm leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-700">
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-fade-in-up">
              Simple <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Pricing</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Choose the plan that fits your needs – start free, upgrade anytime
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="bg-slate-800/80 border-slate-700 p-8 hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Free Plan</CardTitle>
                <CardDescription className="text-slate-400">Perfect for getting started</CardDescription>
                <div className="text-4xl font-bold text-white">$0<span className="text-lg text-slate-400">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">All AI tools with usage limits</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">100 requests per day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Community support</span>
                  </div>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white"
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/50 p-8 hover:shadow-2xl transition-shadow duration-300 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl text-white">Pro Plan</CardTitle>
                <CardDescription className="text-slate-400">For professionals and creators</CardDescription>
                <div className="text-4xl font-bold text-white">$19<span className="text-lg text-slate-400">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Unlimited access to all tools</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Priority processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Advanced AI models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Email support</span>
                  </div>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-slate-800/80 border-slate-700 p-8 hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Enterprise</CardTitle>
                <CardDescription className="text-slate-400">For teams and businesses</CardDescription>
                <div className="text-4xl font-bold text-white">Custom<span className="text-lg text-slate-400"> pricing</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Custom AI solutions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Team management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">API access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">24/7 dedicated support</span>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              <span className="text-yellow-400">🌟</span> Join the Future of AI – Today
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Don't let productivity slip away. Start using the most comprehensive AI platform today and transform how you work.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 btn-pulse"
            >
              <Sparkles className="h-6 w-6 mr-3" />
              Start for Free
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-6 text-xl font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
            >
              <Eye className="h-6 w-6 mr-3" />
              See All Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-slate-700">
            <div className="text-center space-y-2">
              <Award className="h-8 w-8 text-yellow-400 mx-auto" />
              <div className="text-lg font-semibold text-white">No Credit Card Required</div>
              <div className="text-slate-400">Start using all features immediately</div>
            </div>
            <div className="text-center space-y-2">
              <Shield className="h-8 w-8 text-green-400 mx-auto" />
              <div className="text-lg font-semibold text-white">100% Secure</div>
              <div className="text-slate-400">Your data is protected and private</div>
            </div>
            <div className="text-center space-y-2">
              <Infinity className="h-8 w-8 text-blue-400 mx-auto" />
              <div className="text-lg font-semibold text-white">Cancel Anytime</div>
              <div className="text-slate-400">No contracts, no commitments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800/90 border-t border-slate-700 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>
            <div className="text-slate-400 text-center">
              <p>© 2025 Nexus AI Hub. Powered by LangChain. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Universal Translator Modal */}
      <UniversalTranslator 
        isOpen={translatorOpen} 
        onClose={() => setTranslatorOpen(false)} 
      />
    </div>
  );
}