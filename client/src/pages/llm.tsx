import { Sidebar } from "@/components/ui/sidebar";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Zap, Users, ArrowRight, Play, Brain, Cpu, Globe, X, Menu, Link2, Cog, Database, Layers, Network, Bot, Settings, Clock, Activity, FileText, MessageSquare, Code, Sparkles, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";


export default function LLM() {
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
            setActiveFeature((prev: any) => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="min-h-screen bg-gray-50" style={{ color: "#1A1A1A" }}>
            <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3" onClick={() => handleNav('/landing-page')} style={{ cursor: 'pointer' }}>
                            <div className="w-8 h-8 gradient-yellow-purple rounded-lg flex items-center justify-center animate-pulse">
                                <span className="text-white font-bold text-sm">⚡</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-gray-900">Nexus AI Hub</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleGetStarted}
                                className="btn-gradient hover:opacity-90 text-white text-sm sm:text-base px-4 sm:px-6 transform hover:scale-105 transition-all duration-300"
                            >
                                Get Started
                            </Button>

                            <button
                                className="md:hidden text-gray-600 hover:text-gray-900"
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
                        <a href="#agent-bots" className="block text-gray-600 hover:text-gray-900 transition-colors">Agent Bots</a>
                        <a href="#ai-search" className="block text-gray-600 hover:text-gray-900 transition-colors">AI Search</a>
                        <a href="#ai-technology" className="block text-gray-600 hover:text-gray-900 transition-colors">Technology</a>
                        <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
                        <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 transition-colors">About Ai</a>
                    </div>
                )}
            </header>
            <Sidebar />
            <main className="lg:ml-64">
                {/* Immersive Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-yellow-50/30 to-purple-50/30">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/15 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
                    </div>

                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        <div className="mb-8">
                            <Badge variant="outline" className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white border-0 px-4 py-2 text-lg animate-pulse mb-6">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Powered by 400+ AI Models
                            </Badge>
                        </div>

                        <h1 className="text-4xl lg:text-7xl font-bold mb-8 leading-tight">
                            <span className="bg-gradient-to-r gradient-text bg-clip-text text-transparent">
                                Large Language
                            </span><br />
                            <span className="bg-gradient-to-r gradient-text bg-clip-text text-transparent animate-pulse">
                                Models Revolution
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                            Discover the most advanced AI models that understand, generate, and transform human language. 
                            Experience the power of GPT-4, Claude, Gemini, and 400+ other models through our unified platform 
                            with intelligent casting, semantic caching, and real-time streaming.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                            <Button
                                onClick={handleGetStarted}
                                className="btn-gradient hover:opacity-90 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <Brain className="h-5 w-5 mr-2" />
                                Explore AI Models
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('casting-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="border-2 border-purple-400 text-purple-600 hover:bg-yellow-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <Settings className="h-5 w-5 mr-2" />
                                Learn About Casting
                            </Button>
                        </div>

                        {/* Interactive Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            <div className="text-center space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-purple-500 transition-colors">
                                <div className="text-3xl font-bold bg-gradient-to-r gradient-text bg-clip-text text-transparent">400+</div>
                                <div className="text-gray-500">AI Models</div>
                            </div>
                            <div className="text-center space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-purple-500 transition-colors">
                                <div className="text-3xl font-bold bg-gradient-to-r gradient-text bg-clip-text text-transparent">∞</div>
                                <div className="text-gray-500">Possibilities</div>
                            </div>
                            <div className="text-center space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-pink-500 transition-colors">
                                <div className="text-3xl font-bold bg-gradient-to-r gradient-text bg-clip-text text-transparent">Real-time</div>
                                <div className="text-gray-500">Streaming</div>
                            </div>
                            <div className="text-center space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-blue-500 transition-colors">
                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Smart</div>
                                <div className="text-gray-500">Caching</div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
                        </div>
                    </div>
                </section>

                {/* Content Sections */}
                <section className="px-6 py-16">
                    <div className="max-w-6xl mx-auto">
                        {/* Quick Navigation */}
                        <div className="mb-16">
                            <Card className="bg-white/50 border-gray-200 p-6">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">Explore LLM Features</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('casting-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-sm border-purple-500/50 text-purple-600 hover:bg-yellow-400/20"
                                    >
                                        Casting
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('caching-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-sm border-blue-500/50 text-yellow-500 hover:bg-yellow-500/20"
                                    >
                                        Caching
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('rag-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-sm border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                                    >
                                        RAG
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-sm border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                                    >
                                        Functions
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-sm border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                    >
                                        MCP
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-sm border-green-500/50 text-green-400 hover:bg-green-500/20"
                                    >
                                        Streaming
                                    </Button>
                                </div>
                            </Card>
                        </div>
                        {/* AI Casting Information Section */}
                        <section id="casting-section" className="mb-20">
                            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-purple-500/50 hover:shadow-2xl transition-all duration-300">
                                <CardHeader>
                                    <div className="text-center space-y-4 mb-8">
                                        <div className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mx-auto">
                                            <Settings className="h-8 w-8 text-white" />
                                        </div>
                                        <h2 className="text-4xl font-bold bg-gradient-to-r gradient-text bg-clip-text text-transparent">
                                            AI Response Casting
                                        </h2>
                                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                            Transform and refine AI responses to perfectly match your needs with our advanced casting technology
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-6">What is AI Casting?</h3>
                                            <p className="text-gray-600 mb-6 leading-relaxed">
                                                AI Casting is our proprietary technology that allows you to edit, refine, and transform AI-generated responses 
                                                in real-time. Think of it as a sophisticated post-processing layer that adapts any AI output to match your 
                                                exact requirements, tone, and style.
                                            </p>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center mt-1">
                                                        <Target className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-1">Precision Control</h4>
                                                        <p className="text-gray-500 text-sm">Fine-tune responses for exact tone, length, and complexity</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mt-1">
                                                        <Zap className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-1">Real-time Editing</h4>
                                                        <p className="text-gray-500 text-sm">Modify responses instantly without regenerating from scratch</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center mt-1">
                                                        <Brain className="w-4 h-4 text-pink-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-1">Context Preservation</h4>
                                                        <p className="text-gray-500 text-sm">Maintain semantic meaning while adapting presentation</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                                            <h4 className="text-lg font-semibold mb-4 text-purple-600">Casting Example</h4>
                                            
                                            <div className="space-y-4">
                                                <div className="bg-white/50 rounded-lg p-4">
                                                    <div className="text-sm text-gray-500 mb-2">Original AI Response:</div>
                                                    <div className="text-white text-sm font-mono">
                                                        "Machine learning is a subset of artificial intelligence that enables computers to learn."
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-center">
                                                    <ArrowRight className="h-6 w-6 text-purple-600 animate-pulse" />
                                                </div>
                                                
                                                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                                    <div className="text-sm text-purple-600 mb-2">After Casting (Executive Summary):</div>
                                                    <div className="text-white text-sm font-mono">
                                                        "ML drives business transformation by automating decision-making processes, reducing operational costs by 30-40%."
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-purple-500 transition-colors">
                                            <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-4">
                                                <MessageSquare className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Tone Adjustment</h4>
                                            <p className="text-gray-500 text-sm">
                                                Convert formal responses to casual, professional to friendly, or technical to simplified explanations.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-purple-500 transition-colors">
                                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <FileText className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Format Transformation</h4>
                                            <p className="text-gray-500 text-sm">
                                                Transform responses into bullet points, executive summaries, technical documentation, or creative content.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-pink-500 transition-colors">
                                            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <Target className="w-6 h-6 text-pink-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Audience Targeting</h4>
                                            <p className="text-gray-500 text-sm">
                                                Adapt content for different audiences: executives, developers, students, or general public.
                                            </p>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Semantic Caching Section */}
                        <section id="caching-section" className="mb-20">
                            <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/50 hover:shadow-2xl transition-all duration-300">
                                <CardHeader>
                                    <div className="text-center space-y-4 mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                                            <Zap className="h-8 w-8 text-white" />
                                        </div>
                                        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                            Semantic Caching
                                        </h2>
                                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                            Intelligent caching that understands meaning, not just text - dramatically reducing costs and response times
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-6">Beyond Traditional Caching</h3>
                                            <p className="text-gray-600 mb-6 leading-relaxed">
                                                Unlike traditional caching that requires exact text matches, semantic caching understands the meaning 
                                                behind queries. It can serve cached responses for questions that are semantically similar, even if 
                                                the wording is completely different.
                                            </p>
                                            
                                            <div className="bg-white/50 rounded-xl p-6 border border-gray-200 mb-6">
                                                <h4 className="text-lg font-semibold mb-4 text-yellow-500">Performance Benefits</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-400">95%</div>
                                                        <div className="text-sm text-gray-500">Cost Reduction</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-yellow-500">10x</div>
                                                        <div className="text-sm text-gray-500">Faster Response</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-400">80%</div>
                                                        <div className="text-sm text-gray-500">Cache Hit Rate</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-600">100ms</div>
                                                        <div className="text-sm text-gray-500">Avg Response</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                                                <h4 className="text-lg font-semibold mb-4 text-yellow-500">Semantic Matching Examples</h4>
                                                
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500 mb-2">Query 1:</div>
                                                        <div className="text-white text-sm bg-white/50 rounded p-2 mb-2">"How do I create a React component?"</div>
                                                        <div className="text-sm text-gray-500 mb-2">Query 2 (Cache Hit):</div>
                                                        <div className="text-white text-sm bg-white/50 rounded p-2">"What's the process for building React components?"</div>
                                                    </div>
                                                    
                                                    <div className="text-center">
                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                                            ✓ Semantic Match: 89% similarity
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-blue-500 transition-colors">
                                            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <Clock className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Instant Responses</h4>
                                            <p className="text-gray-500 text-sm">
                                                Serve cached responses in milliseconds instead of waiting for full AI model processing.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-purple-500 transition-colors">
                                            <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-4">
                                                <TrendingUp className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Cost Optimization</h4>
                                            <p className="text-gray-500 text-sm">
                                                Reduce API costs by up to 95% through intelligent caching of semantically similar queries.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-purple-500 transition-colors">
                                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <Brain className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Smart Learning</h4>
                                            <p className="text-gray-500 text-sm">
                                                Cache becomes smarter over time, learning from usage patterns and improving hit rates.
                                            </p>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* RAG (Retrieval Augmented Generation) Section */}
                        <section id="rag-section" className="mb-20">
                            <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50 hover:shadow-2xl transition-all duration-300">
                                <CardHeader>
                                    <div className="text-center space-y-4 mb-8">
                                        <div className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mx-auto">
                                            <Database className="h-8 w-8 text-white" />
                                        </div>
                                        <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                            RAG - Retrieval Augmented Generation
                                        </h2>
                                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                            Combine the power of AI models with your private knowledge base for accurate, contextual responses
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-6">How RAG Works</h3>
                                            <p className="text-gray-600 mb-6 leading-relaxed">
                                                RAG enhances AI models by retrieving relevant information from your documents, databases, 
                                                or knowledge bases before generating responses. This ensures answers are grounded in your 
                                                specific data and always up-to-date.
                                            </p>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-emerald-400 font-bold text-sm">1</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">Query Processing</h4>
                                                        <p className="text-gray-500 text-sm">User question is analyzed and converted to search vectors</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-teal-400 font-bold text-sm">2</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">Retrieval</h4>
                                                        <p className="text-gray-500 text-sm">Most relevant documents are retrieved from your knowledge base</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-green-400 font-bold text-sm">3</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">Augmented Generation</h4>
                                                        <p className="text-gray-500 text-sm">AI generates response using both its training and retrieved context</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                                            <h4 className="text-lg font-semibold mb-4 text-emerald-400">RAG vs Standard AI</h4>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-sm text-gray-500 mb-2">Standard AI Response:</div>
                                                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4">
                                                        <div className="text-sm text-white">"I don't have access to your company's specific vacation policy..."</div>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <div className="text-sm text-gray-500 mb-2">RAG-Enhanced Response:</div>
                                                    <div className="bg-yellow-300/20 border border-emerald-500/30 rounded p-3">
                                                        <div className="text-sm text-white">"Based on your employee handbook, you get 15 days PTO in your first year, increasing to 20 days after 3 years..."</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-emerald-500 transition-colors">
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <FileText className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Document Understanding</h4>
                                            <p className="text-gray-500 text-sm">
                                                Upload PDFs, docs, websites, and databases. AI understands context and relationships across all content.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-teal-500 transition-colors">
                                            <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <Target className="w-6 h-6 text-teal-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Precise Answers</h4>
                                            <p className="text-gray-500 text-sm">
                                                Get answers grounded in your specific data with source citations and confidence scores.
                                            </p>
                                        </Card>
                                        
                                        <Card className="bg-white/50 border-gray-200 p-6 hover:border-green-500 transition-colors">
                                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                                                <Activity className="w-6 h-6 text-green-400" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-2">Always Current</h4>
                                            <p className="text-gray-500 text-sm">
                                                Real-time updates ensure AI responses reflect your latest documents and data changes.
                                            </p>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Advanced Features Grid */}
                        <section className="mb-20">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-bold text-white mb-4">Advanced AI Capabilities</h2>
                                <p className="text-xl text-gray-500">Cutting-edge features that set us apart</p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Function Calling */}
                                <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/50 hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                                            <Code className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                            Function Calling
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Enable AI to execute real actions: send emails, make API calls, manage calendars, and integrate with external services.
                                        </p>
                                        <div className="space-y-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-orange-400" />
                                                <span>Real-time API integration</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-orange-400" />
                                                <span>Secure execution</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* MCP Server */}
                                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                                            <Network className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r gradient-text bg-clip-text text-transparent">
                                            MCP Server
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Model Context Protocol servers provide enhanced capabilities with real-time data access.
                                        </p>
                                        <div className="space-y-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-purple-400" />
                                                <span>Real-time context</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-purple-400" />
                                                <span>External data sources</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Context Management */}
                                <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/50 hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                                            <Layers className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                            Context Management
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Advanced context management ensures optimal memory usage and conversation flow.
                                        </p>
                                        <div className="space-y-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-cyan-400" />
                                                <span>Memory optimization</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-cyan-400" />
                                                <span>Context expansion</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Streaming */}
                                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50 hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                                            <Activity className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                            Real-time Streaming
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Stream responses in real-time for better user experience, just like ChatGPT.
                                        </p>
                                        <div className="space-y-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-green-400" />
                                                <span>Instant feedback</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-green-400" />
                                                <span>Better UX</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* What is an LLM */}
                        <Card data-testid="card-llm-intro" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <div className="grid lg:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-4">What are Large Language Models?</h3>
                                        <p className=" mb-6">
                                            Large language models (LLMs) are very large deep learning models that are pre-trained on vast amounts of data. The underlying transformer is a set of neural networks that consist of an encoder and a decoder with self-attention capabilities.
                                        </p>
                                        <p className=" mb-6">
                                            The encoder and decoder extract meanings from a sequence of text and understand the relationships between words and phrases. Unlike earlier recurrent neural networks (RNN), transformers process entire sequences in parallel, significantly reducing training time.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                                                    <Users className="w-4 h-4 text-accent" />
                                                </div>
                                                <span>Conversational interfaces and chatbots</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-accent-secondary/20 rounded-lg flex items-center justify-center mr-3">
                                                    <Zap className="w-4 h-4 text-accent-secondary" />
                                                </div>
                                                <span>Text summarization and analysis</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center mr-3">
                                                    <CheckCircle className="w-4 h-4 text-warning" />
                                                </div>
                                                <span>Autonomous agents and automation</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                                                    <Brain className="w-4 h-4 text-accent" />
                                                </div>
                                                <span>Intelligent search and discovery</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <img
                                            src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                                            alt="Abstract representation of large language models and neural networks"
                                            className="rounded-xl shadow-lg w-full h-auto"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Popular LLMs Comparison */}
                        <Card data-testid="card-llm-comparison" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">Interactive Model Comparison</h3>
                                    <div className="flex gap-2">
                                        <Badge className="bg-yellow-400/20 text-purple-600">400+ Models Available</Badge>
                                        <Badge className="bg-green-500/20 text-green-400">Real-time Pricing</Badge>
                                    </div>
                                </div>
                                
                                <div className="mb-6 text-gray-500">
                                    <p>Compare top AI models by performance, cost, and capabilities. All models available through our unified API.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 font-semibold">LLM Name</th>
                                                <th className="text-left py-3 px-4 font-semibold">Provider</th>
                                                <th className="text-left py-3 px-4 font-semibold">Use Cases</th>
                                                <th className="text-left py-3 px-4 font-semibold">Cost per 1K tokens</th>
                                                <th className="text-left py-3 px-4 font-semibold">Key Features</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-5 (Frontier)</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Reasoning</Badge>
                                                        <Badge variant="secondary">Coding</Badge>
                                                        <Badge variant="secondary">Agents</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.00125 / $0.01</td>
                                                <td className="py-4 px-4">Top-tier coding & agent tooling</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-5 mini</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Summarization</Badge>
                                                        <Badge variant="secondary">Classification</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.00025 / $0.002</td>
                                                <td className="py-4 px-4">Fast & low-cost</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-4.1</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Multi-step</Badge>
                                                        <Badge variant="secondary">Fine-tuning</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.003 / $0.012</td>
                                                <td className="py-4 px-4">Extended thinking</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-4o</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Agents</Badge>
                                                        <Badge variant="secondary">Search</Badge>
                                                        <Badge variant="secondary">Vision</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.005 / $0.02</td>
                                                <td className="py-4 px-4">Multimodal + Fast</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">o3</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Reasoning</Badge>
                                                        <Badge variant="secondary">Math</Badge>
                                                        <Badge variant="secondary">Science</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.01 / $0.04</td>
                                                <td className="py-4 px-4">Reflective reasoning</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">o3-mini</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Education</Badge>
                                                        <Badge variant="secondary">Budget reasoning</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.0011 / $0.0044</td>
                                                <td className="py-4 px-4">Cost-effective</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-4 Turbo (32K)</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">High-volume</Badge>
                                                        <Badge variant="secondary">Production</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.06 / $0.12</td>
                                                <td className="py-4 px-4">Large context window</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">GPT-4 (8K)</td>
                                                <td className="py-4 px-4">OpenAI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Reliable</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.03 / $0.06</td>
                                                <td className="py-4 px-4">Legacy stable model</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Claude Sonnet 4</td>
                                                <td className="py-4 px-4">Anthropic</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Balanced</Badge>
                                                        <Badge variant="secondary">Tool use</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.003 / $0.015</td>
                                                <td className="py-4 px-4">Efficient reasoning</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Claude Opus 4</td>
                                                <td className="py-4 px-4">Anthropic</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Deep tasks</Badge>
                                                        <Badge variant="secondary">Coding</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.015 / $0.075</td>
                                                <td className="py-4 px-4">Most powerful Claude</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Gemini 2.5 Pro</td>
                                                <td className="py-4 px-4">Google</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Multimodal</Badge>
                                                        <Badge variant="secondary">Reasoning</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.00125–$0.0025 / $0.01–$0.015</td>
                                                <td className="py-4 px-4">Huge context</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Gemini 2.0 Flash</td>
                                                <td className="py-4 px-4">Google</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Cheap</Badge>
                                                        <Badge variant="secondary">High throughput</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.00015 / $0.0006</td>
                                                <td className="py-4 px-4">Low-cost multimodal</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Claude 3.5</td>
                                                <td className="py-4 px-4">Anthropic</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Long context</Badge>
                                                        <Badge variant="secondary">Analysis</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.008 / $0.024</td>
                                                <td className="py-4 px-4">Private + Stable</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Mistral Medium 3</td>
                                                <td className="py-4 px-4">Mistral AI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Performance</Badge>
                                                        <Badge variant="secondary">Cost-sensitive</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.0004 / $0.002</td>
                                                <td className="py-4 px-4">Strong for price</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Codestral</td>
                                                <td className="py-4 px-4">Mistral AI</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Coding</Badge>
                                                        <Badge variant="secondary">Low latency</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.0003 / $0.0009</td>
                                                <td className="py-4 px-4">Optimized for code</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Qwen-VL-Max</td>
                                                <td className="py-4 px-4">Alibaba</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Vision</Badge>
                                                        <Badge variant="secondary">Language</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent">$0.00041 (input only)</td>
                                                <td className="py-4 px-4">Vision LLM</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-4 font-medium">Llama 3.1</td>
                                                <td className="py-4 px-4">Meta</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary">Local</Badge>
                                                        <Badge variant="secondary">Fast</Badge>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-accent-secondary">Free</td>
                                                <td className="py-4 px-4">Open-source</td>
                                            </tr>
                                        </tbody>

                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Model Capabilities */}
                        <Card data-testid="card-llm-capabilities" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">Model Capabilities</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                                            <Brain className="w-6 h-6 text-accent" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Text Generation</h4>
                                        <p className=" text-sm">
                                            Generate human-like text for content creation, copywriting, and creative writing tasks.
                                        </p>
                                    </div>
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                                            <Cpu className="w-6 h-6 text-accent-secondary" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Code Generation</h4>
                                        <p className=" text-sm">
                                            Write, debug, and explain code in multiple programming languages with high accuracy.
                                        </p>
                                    </div>
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                                            <Globe className="w-6 h-6 text-warning" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Translation</h4>
                                        <p className=" text-sm">
                                            Translate between languages while maintaining context, tone, and cultural nuances.
                                        </p>
                                    </div>
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                                            <Zap className="w-6 h-6 text-accent" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Analysis & Reasoning</h4>
                                        <p className=" text-sm">
                                            Analyze complex problems, reason through multi-step processes, and provide insights.
                                        </p>
                                    </div>
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                                            <Users className="w-6 h-6 text-accent-secondary" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Conversation</h4>
                                        <p className=" text-sm">
                                            Engage in natural, contextual conversations and maintain dialogue state.
                                        </p>
                                    </div>
                                    <div className="bg-card/50 rounded-lg p-6">
                                        <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                                            <CheckCircle className="w-6 h-6 text-warning" />
                                        </div>
                                        <h4 className="font-semibold text-accent-secondary mb-2">Task Automation</h4>
                                        <p className=" text-sm">
                                            Automate complex workflows and execute multi-step tasks autonomously.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Why are LLMs Important */}
                        <Card data-testid="card-llm-importance" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">Why are Large Language Models Important?</h3>
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div>
                                        <p className=" mb-6">
                                            Large language models are incredibly flexible. One model can perform completely different tasks such as answering questions, summarizing documents, translating languages and completing sentences. LLMs have the potential to disrupt content creation and the way people use search engines and virtual assistants.
                                        </p>
                                        <p className=" mb-6">
                                            While not perfect, LLMs are demonstrating a remarkable ability to make predictions based on a relatively small number of prompts or inputs. LLMs can be used for generative AI to produce content based on input prompts in human language.
                                        </p>
                                        <Card className="bg-card/50 p-4">
                                            <h4 className="font-semibold text-accent mb-2">Scale Examples:</h4>
                                            <ul className="space-y-1  text-sm">
                                                <li>• GPT-3: 175 billion parameters</li>
                                                <li>• Claude 2: 100K tokens per prompt</li>
                                                <li>• Jurassic-1: 178 billion parameters</li>
                                                <li>• Command: 100+ languages support</li>
                                            </ul>
                                        </Card>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-accent-secondary mb-4">Key Advantages</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h5 className="font-medium mb-1">Versatility</h5>
                                                    <p className="text-sm ">One model handles multiple tasks without retraining</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h5 className="font-medium mb-1">Natural Interface</h5>
                                                    <p className="text-sm ">Responds to human language prompts intuitively</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h5 className="font-medium mb-1">Pattern Recognition</h5>
                                                    <p className="text-sm ">Identifies complex patterns from minimal examples</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h5 className="font-medium mb-1">API Integration</h5>
                                                    <p className="text-sm ">Easy integration with existing applications</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How LLMs Work */}
                        <Card data-testid="card-llm-how-work" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">How do Large Language Models Work?</h3>
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div>
                                        <p className=" mb-6">
                                            A key factor in how LLMs work is the way they represent words. Earlier forms of machine learning used numerical tables, but this couldn't recognize relationships between words with similar meanings.
                                        </p>
                                        <p className=" mb-6">
                                            This limitation was overcome by using multi-dimensional vectors, called word embeddings, to represent words so that words with similar contextual meanings are close to each other in the vector space.
                                        </p>
                                        <Card className="bg-card/50 p-4">
                                            <h4 className="font-semibold text-accent-secondary mb-2">Transformer Architecture</h4>
                                            <p className=" text-sm">
                                                Using word embeddings, transformers can pre-process text as numerical representations through the encoder and understand context, then produce unique output through the decoder.
                                            </p>
                                        </Card>
                                    </div>
                                    <div>
                                        <FlowDiagram steps={["Text Input", "Word Embeddings", "Transformer", "Output"]} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* LLM Applications */}
                        <Card data-testid="card-llm-applications-detailed" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">Applications of Large Language Models</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Brain className="w-6 h-6 text-accent mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Copywriting</h4>
                                            </div>
                                            <p className=" text-sm mb-3">
                                                GPT-3, ChatGPT, Claude, Llama 2, and Cohere Command can write original copy. AI21 Wordspice suggests style and voice improvements.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Cpu className="w-6 h-6 text-accent-secondary mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Knowledge Base Answering</h4>
                                            </div>
                                            <p className=" text-sm">
                                                Knowledge-intensive natural language processing (KI-NLP) enables LLMs to answer specific questions from digital archives and knowledge bases.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Globe className="w-6 h-6 text-warning mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Text Classification</h4>
                                            </div>
                                            <p className=" text-sm">
                                                Using clustering, LLMs classify text with similar meanings or sentiments for customer sentiment analysis and document search.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Zap className="w-6 h-6 text-accent mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Code Generation</h4>
                                            </div>
                                            <p className=" text-sm mb-3">
                                                LLMs excel at code generation from natural language prompts. Examples include Amazon CodeWhisperer and OpenAI's Codex, coding in Python, JavaScript, Ruby, and more.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <Users className="w-6 h-6 text-accent-secondary mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Text Generation</h4>
                                            </div>
                                            <p className=" text-sm">
                                                Complete incomplete sentences, write product documentation, or create short stories. Applications range from business content to creative writing.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="flex items-center mb-3">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3" />
                                                <h4 className="font-semibold text-accent-secondary">Conversational AI</h4>
                                            </div>
                                            <p className=" text-sm">
                                                Improve automated virtual assistants like Alexa, Google Assistant, and Siri with better intent interpretation and sophisticated command handling.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* LLM Training */}
                        <Card data-testid="card-llm-training-detailed" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">How are Large Language Models Trained?</h3>
                                <div className="space-y-6">
                                    <p className="">
                                        Transformer-based neural networks contain multiple nodes and layers with billions of parameters. Training is performed using large corpus of high-quality data, where the model iteratively adjusts parameters until it correctly predicts the next token from previous input tokens.
                                    </p>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                                                <Brain className="w-6 h-6 text-accent" />
                                            </div>
                                            <h4 className="font-semibold text-accent-secondary mb-3">Zero-shot Learning</h4>
                                            <p className=" text-sm">
                                                Base LLMs can respond to broad range of requests without explicit training, often through prompts, although accuracy varies.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                                                <Cpu className="w-6 h-6 text-accent-secondary" />
                                            </div>
                                            <h4 className="font-semibold text-accent-secondary mb-3">Few-shot Learning</h4>
                                            <p className=" text-sm">
                                                By providing a few relevant training examples, base model performance significantly improves in that specific area.
                                            </p>
                                        </div>

                                        <div className="bg-card/50 rounded-lg p-6">
                                            <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                                                <Globe className="w-6 h-6 text-warning" />
                                            </div>
                                            <h4 className="font-semibold text-accent-secondary mb-3">Fine-tuning</h4>
                                            <p className=" text-sm">
                                                Extension of few-shot learning where data scientists train base models to adjust parameters with additional data relevant to specific applications.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Future of LLMs */}
                        <Card data-testid="card-llm-future" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">What is the Future of LLMs?</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <p className=" mb-6">
                                            The introduction of large language models like ChatGPT, Claude 2, and Llama 2 points to exciting possibilities. LLMs are moving closer to human-like performance, demonstrating keen interest in robotic-type LLMs that emulate and outperform the human brain.
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h4 className="font-semibold text-accent-secondary mb-1">Increased Capabilities</h4>
                                                    <p className=" text-sm">Newer releases will have improved accuracy and enhanced capabilities as developers reduce bias and eliminate incorrect answers.</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start">
                                                <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                                <div>
                                                    <h4 className="font-semibold text-accent-secondary mb-1">Audiovisual Training</h4>
                                                    <p className=" text-sm">Training models using video and audio input will lead to faster development and new possibilities for autonomous vehicles.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-accent-secondary mb-1">Workplace Transformation</h4>
                                                <p className=" text-sm">LLMs will reduce monotonous tasks similar to manufacturing robots, affecting clerical tasks, customer service, and copywriting.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-accent-secondary mb-1">Conversational AI</h4>
                                                <p className=" text-sm">Improve virtual assistants like Alexa, Google Assistant, and Siri with better intent interpretation and sophisticated commands.</p>
                                            </div>
                                        </div>

                                        <Card className="bg-card/50 p-4 mt-6">
                                            <h4 className="font-semibold text-accent mb-2">Current Limitations Being Addressed:</h4>
                                            <ul className="space-y-1  text-sm">
                                                <li>• Reducing hallucination and bias</li>
                                                <li>• Improving factual accuracy</li>
                                                <li>• Better context understanding</li>
                                                <li>• Enhanced reasoning capabilities</li>
                                            </ul>
                                        </Card>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Model Selection Guide */}
                        <Card data-testid="card-model-selection" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">Choosing the Right Model</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-lg font-semibold text-accent-secondary mb-4">For High-Performance Applications</h4>
                                        <div className="space-y-3 mb-6">
                                            <div className="bg-card/50 rounded-lg p-4">
                                                <h5 className="font-medium mb-1">GPT-4o</h5>
                                                <p className="text-sm ">Best for complex reasoning, agents, and production applications requiring high accuracy.</p>
                                            </div>
                                            <div className="bg-card/50 rounded-lg p-4">
                                                <h5 className="font-medium mb-1">Claude 3.5 Sonnet</h5>
                                                <p className="text-sm ">Excellent for long-context tasks, analysis, and applications requiring safety.</p>
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-semibold text-accent-secondary mb-4">For Cost-Effective Solutions</h4>
                                        <div className="space-y-3">
                                            <div className="bg-card/50 rounded-lg p-4">
                                                <h5 className="font-medium mb-1">Llama 3.1</h5>
                                                <p className="text-sm ">Open-source model perfect for local deployment and cost-sensitive applications.</p>
                                            </div>
                                            <div className="bg-card/50 rounded-lg p-4">
                                                <h5 className="font-medium mb-1">Gemini Flash</h5>
                                                <p className="text-sm ">Fast and cost-effective for high-volume, lightweight tasks.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-accent-secondary mb-4">Factors to Consider</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <h5 className="font-medium mb-2">💰 Cost</h5>
                                                <p className="text-sm ">Consider both input and output token costs based on your usage patterns.</p>
                                            </div>
                                            <div>
                                                <h5 className="font-medium mb-2">⚡ Speed</h5>
                                                <p className="text-sm ">Response latency is crucial for real-time applications and user experience.</p>
                                            </div>
                                            <div>
                                                <h5 className="font-medium mb-2">🎯 Accuracy</h5>
                                                <p className="text-sm ">More sophisticated models provide better accuracy for complex tasks.</p>
                                            </div>
                                            <div>
                                                <h5 className="font-medium mb-2">📄 Context Length</h5>
                                                <p className="text-sm ">Longer context windows enable processing of larger documents and conversations.</p>
                                            </div>
                                            <div>
                                                <h5 className="font-medium mb-2">🔒 Privacy</h5>
                                                <p className="text-sm ">Consider data privacy requirements and local deployment options.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
        </div>
    );
}