import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Zap, ArrowRight, Database, Network, Bot, Globe,
    Mail, CheckCircle, Upload, RefreshCw, MessageSquare, Share2,
    FileText, Menu, X, Users, Building, Rocket, Github, Twitter, Linkedin,
    ChevronLeft, ChevronRight, Settings, BarChart3, Code2, Layers, MessageCircle, Contact,
    Shield,
    Target,
    TrendingUp
} from 'lucide-react';
import '../styles/landing-animations.css';
import ChatBot from '@/components/ChatBot';
import { useIsMobile } from '@/hooks/use-mobile';

// Modular Components
const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
    const [typedText, setTypedText] = useState('');
    const [typeIndex, setTypeIndex] = useState(0);
    const heroText = "Connect. Build. Scale. With AI.";
    const isMobile = useIsMobile()
    useEffect(() => {
        if (typeIndex < heroText.length) {
            const timeout = setTimeout(() => {
                setTypedText(prev => prev + heroText[typeIndex]);
                setTypeIndex(prev => prev + 1);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [typeIndex]);

    return (
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-15 overflow-hidden">
            {/* Animated Neural Network Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                }} />
                {/* Floating particles */}
                <div className="absolute w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-float -top-48 -left-48" />
                <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float animation-delay-1000 -bottom-48 -right-48" />
                <div className="absolute w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-float animation-delay-600 top-1/2 left-1/2" />
            </div>

            <div className="max-w-6xl mx-auto text-center space-y-8 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-6">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-indigo-300">AI-Powered Developer Platform</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="block mb-4 text-white">One Key. 400+ LLMs.</span>
                    <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Infinite AI Power.
                    </span>
                </h1>

                <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                    {typedText}<span className="animate-pulse">|</span>
                </p>

                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    Access OpenAI, Claude, Gemini, Mistral, and 400+ models with a single API key.
                    Built for scalability and flexibility.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button
                        onClick={onGetStarted}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Try Now
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="border-2 border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/10 px-8 py-6 text-lg font-semibold rounded-xl"
                    >
                        Explore Features
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">400+</div>
                        <div className="text-slate-400 text-sm mt-2">LLM Models</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">1</div>
                        <div className="text-slate-400 text-sm mt-2">API Key</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">∞</div>
                        <div className="text-slate-400 text-sm mt-2">Possibilities</div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-slate-400/30 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-indigo-400 rounded-full mt-2 animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
};

// Rotating LLM Logos Component
const LLMLogosCarousel = () => {
    const logos = ['OpenAI', 'Claude', 'Gemini', 'Mistral', 'Llama', 'GPT-4', 'Cohere', 'Anthropic'];

    return (
        <div className="relative overflow-hidden py-8 bg-slate-800/30">
            <div className="flex animate-scroll">
                {[...logos, ...logos].map((logo, i) => (
                    <div key={i} className="flex-shrink-0 mx-8">
                        <div className="px-6 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg">
                            <span className="text-indigo-300 font-semibold text-lg">{logo}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, visual }: any) => (
    <Card className="group bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden">
        <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400">{description}</p>
                </div>
            </div>
            {visual && <div className="mt-4">{visual}</div>}
        </CardContent>
    </Card>
);

// RAG Workflow Visual
const RAGWorkflow = () => (
    <div className="flex items-center justify-between gap-2 mt-4 p-4 bg-slate-900/50 rounded-lg">
        {['Upload', 'Embed', 'Retrieve', 'Generate'].map((step, i) => (
            <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center">
                        <span className="text-indigo-300 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-xs text-slate-400">{step}</span>
                </div>
                {i < 3 && <ArrowRight className="h-4 w-4 text-indigo-500/50" />}
            </React.Fragment>
        ))}
    </div>
);

// Caching Animation
const CachingAnimation = () => (
    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Query Processing</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cached</Badge>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-shimmer" />
        </div>
    </div>
);

// Main Landing Page Component
export default function LandingNew() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const isMobile = useIsMobile()

    const handleGetStarted = () => navigate('/auth');

    const coreFeatures = [
        {
            icon: Network,
            title: "One Key. 400+ LLMs. Infinite AI Power.",
            description: "Access OpenAI, Claude, Gemini, Mistral, and 400+ models with a single API key.",
            visual: <div className="text-sm text-indigo-400 italic">Powered by intelligent model routing</div>
        },
        {
            icon: Database,
            title: "Connect Your Data to AI.",
            description: "Upload PDFs, DOCX, CSV, or text files — your AI answers are now grounded in your own data.",
            visual: <RAGWorkflow />
        },
        {
            icon: FileText,
            title: "Define, Save, and Reuse Prompts.",
            description: "Easily manage your prompts to ensure consistency across all LLM calls.",
            visual: <div className="p-3 bg-slate-900/50 rounded text-xs text-slate-400 font-mono">System: You are a helpful assistant...</div>
        },
        {
            icon: Zap,
            title: "Smarter. Faster. Cached.",
            description: "Our dual caching engine (Semantic & Exact) ensures lightning-fast responses.",
            visual: <CachingAnimation />
        },
        {
            icon: MessageSquare,
            title: "Ask. Learn. Regenerate.",
            description: "Ask any question, get instant AI-powered answers, and regenerate for deeper insights.",
            visual: <Button size="sm" variant="outline" className="w-full mt-2 border-indigo-500/30 text-indigo-400"><RefreshCw className="h-3 w-3 mr-2" />Regenerate</Button>
        },
        {
            icon: Bot,
            title: "Chat Your Changes.",
            description: "Just click our AI bot, type your changes, and see them applied instantly.",
            visual: <div className="flex gap-2 mt-2"><div className="flex-1 p-2 bg-slate-900/50 rounded text-xs text-slate-400">Type your changes...</div></div>
        },
        {
            icon: Share2,
            title: "Generate. Share. Collaborate.",
            description: "Create a custom AI setup, generate a unique link, and share it instantly with others.",
            visual: <Button size="sm" variant="outline" className="w-full mt-2 border-purple-500/30 text-purple-400"><Share2 className="h-3 w-3 mr-2" />Copy Link</Button>
        }
    ];

    const comingSoonFeatures = [
        {
            icon: Bot,
            title: "Build Your Own Agent",
            description: "Create, customize, and deploy AI agents tailored to your needs. Use them across your applications.",
            badge: "Coming Soon",
            color: "from-indigo-500 to-purple-600"
        },
        {
            icon: Layers,
            title: "Context Management",
            description: "Manage conversation context, memory, and state across all your AI interactions seamlessly.",
            badge: "Coming Soon",
            color: "from-purple-500 to-pink-600"
        },
        {
            icon: Sparkles,
            title: "Pre-built AI Agents",
            description: "Access ready-to-use agents: AI Email Writer, Text Formatter, Content Generator, and more.",
            badge: "Coming Soon",
            color: "from-pink-500 to-red-600"
        },
        {
            icon: Contact,
            title: "Contact Management (Mini CRM)",
            description: "Manage your contacts, interactions, and customer data in one centralized AI-powered CRM.",
            badge: "Coming Soon",
            color: "from-red-500 to-orange-600"
        },
        {
            icon: BarChart3,
            title: "Analytics for Every Module",
            description: "Track usage, performance, and insights across all features with comprehensive analytics.",
            badge: "Coming Soon",
            color: "from-orange-500 to-yellow-600"
        },
        {
            icon: MessageCircle,
            title: "Build & Deploy AI Chatbot",
            description: "Create custom AI chatbots and deploy them to your website with just a few clicks.",
            badge: "Coming Soon",
            color: "from-yellow-500 to-green-600"
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [itemsPerSlide, setItemsPerSlide] = useState(3);

    useEffect(() => {
        const updateItemsPerSlide = () => {
            if (window.innerWidth < 768) {
                setItemsPerSlide(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerSlide(2);
            } else {
                setItemsPerSlide(3);
            }
        };

        updateItemsPerSlide();
        window.addEventListener('resize', updateItemsPerSlide);
        return () => window.removeEventListener('resize', updateItemsPerSlide);
    }, []);

    // // Auto-play slider
    // useEffect(() => {
    //     const autoPlayInterval = setInterval(() => {
    //         setCurrentSlide((prev) => (prev + 1) % Math.ceil(comingSoonFeatures.length / itemsPerSlide));
    //     }, 4000); // Auto-advance every 4 seconds

    //     return () => clearInterval(autoPlayInterval);
    // }, [itemsPerSlide]);

    const totalSlides = Math.ceil(comingSoonFeatures.length / itemsPerSlide);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const getCurrentFeatures = () => {
        const start = currentSlide * itemsPerSlide;
        return comingSoonFeatures.slice(start, start + itemsPerSlide);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Navigation */}
            <header className="w-full bg-slate-800/90 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Nexus AI Hub</span>
                        </div>

                        <nav className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
                            <a href="#coming-soon" className="text-slate-300 hover:text-white transition-colors">Coming Soon</a>
                            {/* <a href="#connect" className="text-slate-300 hover:text-white transition-colors">Connect</a> */}
                            <a onClick={() => { window.location.href = '/About/AI'; }} style={{ cursor: 'pointer' }} className="text-slate-300 hover:text-slate-100 transition-colors">About AI</a>
                        </nav>

                        <div className="flex items-center gap-4">
                            {!isMobile && <Button
                                onClick={handleGetStarted}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-6"
                            >
                                Get Started
                            </Button>}
                            <button
                                className="md:hidden text-slate-300"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 space-y-3">
                        <a href="#features" className="block text-slate-300 hover:text-white">Features</a>
                        <a href="#coming-soon" className="block text-slate-300 hover:text-white">Coming Soon</a>
                        {/* <a href="#connect" className="block text-slate-300 hover:text-white">Connect</a> */}
                        <a onClick={() => { window.location.href = '/About/AI'; }} style={{ cursor: 'pointer' }} className="block text-slate-300 hover:text-white">About AI</a>

                    </div>
                )}
            </header>

            {/* Hero Section */}
            <HeroSection onGetStarted={handleGetStarted} />

            {/* LLM Logos Carousel */}
            <LLMLogosCarousel />

            {/* Core Features */}
            <section id="features" className="py-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Core Platform Highlights
                            </span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Everything you need to build powerful AI applications
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {coreFeatures.map((feature, i) => (
                            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <FeatureCard {...feature} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Coming Soon - Slider */}
            <section id="coming-soon" className="py-20 px-4 sm:px-6 bg-slate-800/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-6 text-white">
                            What's <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">Coming Soon</span>
                        </h2>
                        <p className="text-xl text-slate-400">
                            Exciting new features in development
                        </p>
                    </div>

                    {/* Slider Container */}
                    <div className="relative">
                        {/* Slider Content */}
                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getCurrentFeatures().map((feature, i) => (
                                    <Card
                                        key={i}
                                        className="bg-slate-800/50 border-slate-700/50 hover:border-pink-500/50 transition-all duration-300 group animate-fade-in-scale"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <CardContent className="p-8 h-full flex flex-col">
                                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                                <feature.icon className="h-8 w-8 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3 text-center">{feature.title}</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-grow text-center">
                                                {feature.description}
                                            </p>
                                            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 mx-auto">
                                                {feature.badge}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        {totalSlides > 1 && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500/50 rounded-full p-3 transition-all shadow-lg z-10"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="h-6 w-6 text-slate-300" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500/50 rounded-full p-3 transition-all shadow-lg z-10"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="h-6 w-6 text-slate-300" />
                                </button>
                            </>
                        )}

                        {/* Slide Indicators */}
                        {totalSlides > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                {Array.from({ length: totalSlides }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                            ? 'w-8 bg-gradient-to-r from-pink-500 to-cyan-500'
                                            : 'w-2 bg-slate-600 hover:bg-slate-500'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Auto-scroll hint */}
                    <div className="text-center mt-8">
                        <p className="text-sm text-slate-500">
                            {totalSlides > 1 ? `${currentSlide + 1} / ${totalSlides}` : ''}
                        </p>
                    </div>
                </div>
            </section>
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
                            <h3 className="text-xl font-semibold text-white">LLM Integration</h3>
                            <p className="text-slate-400">
                                Direct access to 400+ LLM models from top providers like OpenAI, Anthropic, Google, and more through a single unified API.
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
            {/* Connect With Us */}
            {/* <section id="connect" className="py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-5xl font-bold mb-6 text-white">
                            Let's Build the Future of AI <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Together</span>
                        </h2>
                        <p className="text-xl text-slate-400">
                            Connect with us to get updates, access early features, or collaborate on custom AI integrations.
                        </p>
                    </div>

                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-8">
                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                        <Input
                                            placeholder="Your name"
                                            className="bg-slate-900/50 border-slate-700 text-white"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="bg-slate-900/50 border-slate-700 text-white"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                                    <Textarea
                                        placeholder="Tell us about your project or questions..."
                                        className="bg-slate-900/50 border-slate-700 text-white min-h-32"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Message
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Get Updates
                                    </Button>
                                </div>
                            </form>

                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <div className="flex items-center justify-center gap-6">
                                    <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                        <Github className="h-6 w-6" />
                                    </a>
                                    <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                                        <Twitter className="h-6 w-6" />
                                    </a>
                                    <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                        <Linkedin className="h-6 w-6" />
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section> */}

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-bold mb-6 text-white">
                        🌟 Join the Future of AI – Today
                    </h2>
                    <p className="text-xl text-slate-300 mb-8">
                        Don't let productivity slip away. Start using the most comprehensive AI platform today and transform how you work.                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-12 py-6 text-lg"
                        >
                            <Rocket className="h-5 w-5 mr-2" />
                            Get Early Access
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-6 text-lg"
                        >
                            View Documentation
                        </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <div className="text-center">
                            <Users className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                            <div className="text-white font-semibold">For Everyone</div>
                            <div className="text-sm text-slate-400">Students to Enterprises</div>
                        </div>
                        <div className="text-center">
                            <Building className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                            <div className="text-white font-semibold">Enterprise Ready</div>
                            <div className="text-sm text-slate-400">Secure & Scalable</div>
                        </div>
                        <div className="text-center">
                            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                            <div className="text-white font-semibold">100% Free Start</div>
                            <div className="text-sm text-slate-400">No Credit Card</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-800/90 border-t border-slate-700/50 py-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">Nexus AI Hub</span>
                            </div>
                            <p className="text-slate-400 max-w-md">
                                The ultimate AI-powered developer platform. Connect 400+ LLM models, build intelligent applications, and scale with confidence.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Product</h3>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#coming-soon" className="hover:text-white transition-colors">Coming Soon</a></li>
                                <li><a href="/auth" className="hover:text-white transition-colors">Get Started</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Connect</h3>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#connect" className="hover:text-white transition-colors">Instagram</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400">
                        <p>© 2025 Nexus AI Hub. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* AI Chat Bot */}
            <ChatBot />
        </div>
    );
}
