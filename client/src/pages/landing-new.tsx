import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Sparkles, Zap, ArrowRight, Database, Network, Bot, Globe,
    Mail, CheckCircle, Upload, RefreshCw, MessageSquare, Share2,
    FileText, Menu, X, Users, Building, Rocket, Github, Twitter, Linkedin,
    ChevronLeft, ChevronRight, Settings, BarChart3, Code2, Layers, MessageCircle, Contact,
    Shield,
    Target,
    TrendingUp,
    ExternalLink,
    Palette,
    Brain,
    Workflow,
    Cpu,
    Phone,
    Chrome,
    Send,
    Calendar,
    Lightbulb,
    GitBranch,
    Boxes,
    Play
} from 'lucide-react';
import '../styles/landing-animations.css';
import ChatBot from '@/components/ChatBot';
import { useIsMobile } from '@/hooks/use-mobile';
import NeuralAidosCanvas from '@/components/NeuralAidosCanvas';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Modular Components
const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
    const [typedText, setTypedText] = useState('');
    const [typeIndex, setTypeIndex] = useState(0);
    const heroText = "Your Business AI Operating System";
    const isMobile = useIsMobile();
    const heroRef = useRef(null);

    useEffect(() => {
        if (typeIndex < heroText.length) {
            const timeout = setTimeout(() => {
                setTypedText(prev => prev + heroText[typeIndex]);
                setTypeIndex(prev => prev + 1);
            }, 80);
            return () => clearTimeout(timeout);
        }
    }, [typeIndex]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-content', {
                opacity: 0,
                y: 50,
                duration: 1,
                ease: 'power3.out',
                stagger: 0.2
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-15 overflow-hidden">
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ marginTop: isMobile ? '1rem' : '' }}
                    className="hero-content inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-6"
                >
                    <Brain className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-indigo-300">Powered by AIDOS (Orchestrator)</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hero-content text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                >
                    <span className="block mb-4 text-white">{typedText}<span className="animate-pulse">|</span></span>
                    {/* <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        Intelligent Automation Across Every Channel
                    </span> */}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="hero-content text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
                >
                    AIDOS (AI Distributed Operating System) powers Assistants, Agents, and Workflows — enabling businesses to automate real tasks across multiple channels.
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="hero-content text-lg text-slate-400 max-w-2xl mx-auto"
                >
                    The only platform that thinks, plans, and orchestrates actions across your entire business ecosystem — from website to WhatsApp, email to voice.
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="hero-content text-xl text-cyan-300 max-w-3xl mx-auto font-semibold"
                >
                    The only AI OS that thinks, plans, and executes your business operations across every channel.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="hero-content flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
                >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={onGetStarted}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/50 transform transition-all duration-300"
                        >
                            <Rocket className="h-5 w-5 mr-2" />
                            Get Early Access
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('what-is-aidos')?.scrollIntoView({ behavior: 'smooth' })}
                            className="border-2 border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/10 px-8 py-6 text-lg font-semibold rounded-xl"
                        >
                            Discover AIDOS (Orchestrator)
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI OS</div>
                        <div className="text-slate-400 text-sm mt-2">Business Operating System</div>
                    </div>
                    <div className="text-center">
                        {/* <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Multi-Channel</div>
                        <div className="text-slate-400 text-sm mt-2">Web, WhatsApp, Voice & More</div> */}
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">400+</div>
                        <div className="text-slate-400 text-sm mt-2">AI Models Available</div>
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

// Social Proof Section Component
const SocialProofSection = () => {
    const providers = [
        { name: 'OpenAI', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/30', textColor: 'text-green-400' },
        { name: 'Anthropic', color: 'from-orange-500/20 to-amber-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
        { name: 'Google Gemini', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30', textColor: 'text-blue-400' },
        { name: 'Mistral', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/30', textColor: 'text-purple-400' },
        { name: 'Meta Llama', color: 'from-indigo-500/20 to-violet-500/20', borderColor: 'border-indigo-500/30', textColor: 'text-indigo-400' }
    ];

    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    return (
        <section ref={sectionRef} className="py-16 px-4 sm:px-6 bg-slate-900/50">
            <div className="max-w-6xl mx-auto text-center">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-sm text-slate-500 uppercase tracking-wider mb-8"
                >
                    Powered by industry-leading AI providers
                </motion.p>
                <div className="flex flex-wrap justify-center items-center gap-6">
                    {providers.map((provider, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.1, y: -5 }}
                            className={`bg-gradient-to-br ${provider.color} border ${provider.borderColor} rounded-xl px-6 py-4 hover:shadow-lg transition-all duration-300`}
                        >
                            <span className={`${provider.textColor} font-semibold text-base`}>{provider.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
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

// What is AIDOS Section
const WhatIsAIDOSSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 100 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    return (
        <section ref={sectionRef} id="what-is-aidos" className="py-20 px-4 sm:px-6 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full"
                        >
                            <Brain className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm text-cyan-300">AIDOS (Orchestrator)</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-4xl md:text-5xl font-bold text-white"
                        >
                            What is <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AIDOS (Orchestrator)?</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-lg text-slate-300 leading-relaxed"
                        >
                            AIDOS (AI Distributed Operating System) is the intelligent core of Nexus AI Hub. It's not just a chatbot or agent framework — it's a complete Business AI Operating System.
                        </motion.p>
                        <div className="space-y-4">
                            {[
                                { icon: Lightbulb, color: 'cyan', title: 'Understands Goals', desc: 'AIDOS (Orchestrator) comprehends complex business objectives and user intent across natural language inputs.' },
                                { icon: GitBranch, color: 'purple', title: 'Plans & Chooses Paths', desc: 'Intelligently breaks down tasks and selects the optimal execution strategy for each scenario.' },
                                { icon: Network, color: 'indigo', title: 'Coordinates Everything', desc: 'Orchestrates Assistants, Agents, Workflows, Tools, RAG, and memory layers to execute tasks end-to-end.' }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className={`w-10 h-10 bg-gradient-to-br from-${item.color}-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                                        <p className="text-slate-400">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: 3D Neural Canvas */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="relative">
                            <NeuralAidosCanvas />

                            {/* Floating Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.6, delay: 0.8, type: 'spring' }}
                                className="absolute -top-4 -right-4 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full px-6 py-3 shadow-lg"
                            >
                                <p className="text-white font-semibold text-sm">AI OS</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Customer Touchpoints Section
const CustomerTouchpointsSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const touchpoints = [
        {
            icon: Chrome,
            title: "Website",
            description: "AIDOS Search Engine (Live Now)",
            status: "Available",
            color: "from-green-500 to-emerald-600"
        },
        {
            icon: MessageCircle,
            title: "WhatsApp",
            description: "WhatsApp AI Assistants",
            status: "Coming Soon",
            color: "from-indigo-500 to-purple-600"
        },
        {
            icon: Phone,
            title: "Voice",
            description: "AI Voice Bots",
            status: "Coming Soon",
            color: "from-purple-500 to-pink-600"
        },
        {
            icon: Mail,
            title: "Email",
            description: "Email AI Assistants",
            status: "Coming Soon",
            color: "from-pink-500 to-red-600"
        },
        {
            icon: Contact,
            title: "CRM",
            description: "Contact Management",
            status: "Coming Soon",
            color: "from-red-500 to-orange-600"
        },
        {
            icon: Sparkles,
            title: "Custom GPT",
            description: "Build Your Own GPT",
            status: "Coming Soon",
            color: "from-orange-500 to-yellow-600"
        },
        {
            icon: Globe,
            title: "Mobile",
            description: "iOS & Android Apps",
            status: "Coming Soon",
            color: "from-yellow-500 to-green-600"
        },
        {
            icon: Calendar,
            title: "Scheduler",
            description: "Time-based Automations",
            status: "Coming Soon",
            color: "from-cyan-500 to-blue-600"
        }
    ];

    return (
        <section ref={sectionRef} id="touchpoints" className="py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                            Meet Your Customers Everywhere
                        </span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        AIDOS (Orchestrator)-powered assistants work across every channel where your customers are
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {touchpoints.map((touchpoint, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                        >
                            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group h-full">
                                <CardContent className="p-6 text-center space-y-4">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                        className={`w-16 h-16 bg-gradient-to-br ${touchpoint.color} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg`}
                                    >
                                        <touchpoint.icon className="h-8 w-8 text-white" />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-white">{touchpoint.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {touchpoint.description}
                                    </p>
                                    <Badge className={touchpoint.status === "Available" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"}>
                                        {touchpoint.status}
                                    </Badge>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Assistant Experience Section
const AssistantExperienceSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 80 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    return (
        <section ref={sectionRef} id="assistant-experience" className="py-20 px-4 sm:px-6 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Rich <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Assistant Experiences</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Nexus AI Hub provides beautiful, intelligent interfaces that your users love to interact with
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: MessageSquare,
                            title: "Conversational UI",
                            description: "Natural, human-like conversations with voice and text support for seamless interactions.",
                            color: "from-indigo-500 to-purple-600"
                        },
                        {
                            icon: Lightbulb,
                            title: "Smart Suggestions",
                            description: "Contextual recommendations and command shortcuts to help users get things done faster.",
                            color: "from-purple-500 to-pink-600"
                        },
                        {
                            icon: Target,
                            title: "Goal-Based Input",
                            description: "Users describe what they want to achieve, and AIDOS (Orchestrator) figures out how to make it happen.",
                            color: "from-pink-500 to-cyan-600"
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all"
                        >
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4`}
                            >
                                <item.icon className="h-7 w-7 text-white" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6">
                        <p className="text-lg text-slate-300 mb-2">
                            <span className="font-semibold text-white">Assistants</span> provide the experience.
                        </p>
                        <p className="text-lg text-slate-300">
                            <span className="font-semibold text-cyan-400">AIDOS (Orchestrator)</span> handles the execution.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// How AIDOS Works Section
const HowAIDOSWorksSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, scale: 0.95 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    const steps = [
        {
            number: 1,
            icon: Upload,
            title: "Upload Your Data",
            description: "Add your documents, FAQs, PDFs, or any content you want the AI to learn from.",
            color: "from-indigo-500 to-purple-600"
        },
        {
            number: 2,
            icon: Settings,
            title: "Configure & Customize",
            description: "Choose your AI model, customize the theme, colors, and branding to match your website.",
            color: "from-purple-500 to-pink-600"
        },
        {
            number: 3,
            icon: Code2,
            title: "Embed on Your Site",
            description: "Copy the generated iframe script and paste it anywhere on your website. Done!",
            color: "from-pink-500 to-cyan-600"
        }
    ];

    return (
        <section ref={sectionRef} id="how-it-works" className="py-20 px-4 sm:px-6 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        How It <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Get your AI Search Engine up and running in just 3 simple steps
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Connection Lines (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 -translate-y-1/2 opacity-20" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 60 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: i * 0.2 }}
                                whileHover={{ y: -10 }}
                                className="relative"
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group h-full">
                                    <CardContent className="p-8 text-center space-y-4">
                                        {/* Step Number Badge */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ duration: 0.5, delay: i * 0.2 + 0.3, type: 'spring' }}
                                            className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                                        >
                                            <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                                <span className="text-white font-bold text-lg">{step.number}</span>
                                            </div>
                                        </motion.div>

                                        {/* Icon */}
                                        <div className="pt-6">
                                            <motion.div
                                                whileHover={{ rotate: 360 }}
                                                transition={{ duration: 0.6 }}
                                                className="w-20 h-20 bg-slate-900/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto group-hover:border-indigo-500/50 transition-all"
                                            >
                                                <step.icon className="h-10 w-10 text-indigo-400" />
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">
                                            {step.description}
                                        </p>

                                        {/* Arrow (Desktop) */}
                                        {i < steps.length - 1 && (
                                            <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-10 transform -translate-y-1/2">
                                                <ArrowRight className="h-6 w-6 text-indigo-500/50" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center mt-12"
                >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={() => window.location.href = '/auth'}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-6 text-lg"
                        >
                            <Rocket className="h-5 w-5 mr-2" />
                            Start Building Now
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

// Execution Layers Section
const ExecutionLayersSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 100 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    return (
        <section ref={sectionRef} id="execution-layers" className="py-20 px-4 sm:px-6 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        The <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Execution Layers</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Three powerful layers work together to execute your business logic
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Cpu,
                            title: "Specialized Agents",
                            description: "AI workers with defined tasks, tools, and logic. Each agent is an expert in its domain.",
                            items: ["Search Agent", "Booking Agent", "Data Agent"],
                            color: "from-indigo-500 to-purple-600",
                            itemColor: "indigo"
                        },
                        {
                            icon: Workflow,
                            title: "Business Flows",
                            description: "Multi-step workflows for complex business processes like booking, payments, onboarding.",
                            items: ["Lead Processing", "Order Fulfillment", "Customer Support"],
                            color: "from-purple-500 to-pink-600",
                            itemColor: "purple"
                        },
                        {
                            icon: Boxes,
                            title: "Capability Fabric",
                            description: "Tools, RAG, memory layers, integrations, databases, and APIs working as a unified system.",
                            items: ["Knowledge Base (RAG)", "API Integrations", "Memory & Context"],
                            color: "from-pink-500 to-cyan-600",
                            itemColor: "pink"
                        }
                    ].map((layer, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.2, type: 'spring' }}
                            whileHover={{ scale: 1.05, y: -10 }}
                        >
                            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 transition-all group h-full">
                                <CardContent className="p-8">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                        className={`w-16 h-16 bg-gradient-to-br ${layer.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                                    >
                                        <layer.icon className="h-8 w-8 text-white" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-white mb-4">{layer.title}</h3>
                                    <p className="text-slate-400 leading-relaxed mb-4">
                                        {layer.description}
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-500">
                                        {layer.items.map((item, idx) => (
                                            <motion.li
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                                transition={{ duration: 0.4, delay: i * 0.2 + idx * 0.1 + 0.3 }}
                                                className="flex items-center gap-2"
                                            >
                                                <CheckCircle className={`h-4 w-4 text-${layer.itemColor}-400`} />
                                                {item}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Real Example Section
const RealExampleSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 80 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    return (
        <section ref={sectionRef} id="real-example" className="py-20 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        See It <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">In Action</span>
                    </h2>
                    <p className="text-xl text-slate-400">
                        A real-world example: Hotel booking made effortless
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-cyan-500/30">
                        <CardContent className="p-8 md:p-12">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="mb-8"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-4">
                                    <Users className="h-4 w-4 text-indigo-400" />
                                    <span className="text-sm text-indigo-300">User Request</span>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                                    <p className="text-xl text-white italic">
                                        "Find a hotel under ₹5000 in Goa and book it."
                                    </p>
                                </div>
                            </motion.div>

                            <div className="space-y-6">
                                {[
                                    {
                                        number: 1,
                                        title: "Assistant Interprets",
                                        description: "The user's natural language request is understood and parsed for intent and parameters.",
                                        color: "from-indigo-500 to-purple-600"
                                    },
                                    {
                                        number: 2,
                                        title: "AIDOS (Orchestrator) Plans",
                                        description: "Orchestrator creates a plan: Search hotels → Filter by price → Get availability → Complete booking.",
                                        color: "from-purple-500 to-pink-600"
                                    },
                                    {
                                        number: 3,
                                        title: "Agents Execute",
                                        description: "Search Agent fetches hotels, Booking Agent checks availability and processes the reservation.",
                                        color: "from-pink-500 to-cyan-600"
                                    },
                                    {
                                        number: 4,
                                        title: "Result Delivered",
                                        description: "\"I found a beautiful hotel in Goa for ₹4,500/night. Your booking is confirmed for [dates]. Confirmation sent to your email!\"",
                                        color: "from-cyan-500 to-green-600"
                                    }
                                ].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                                        whileHover={{ x: 10 }}
                                        className="flex gap-4"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center`}
                                        >
                                            <span className="text-white font-bold">{step.number}</span>
                                        </motion.div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                                            <p className="text-slate-400">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.6, delay: 1.2, type: 'spring' }}
                                className="mt-8 text-center"
                            >
                                <Badge className="bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border-cyan-500/30 text-lg px-6 py-2">
                                    <Sparkles className="h-4 w-4 mr-2 inline" />
                                    Magical. Effortless. Intelligent.
                                </Badge>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
};

// Differentiator Section
const DifferentiatorSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    return (
        <section ref={sectionRef} className="py-20 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold mb-6 text-white"
                >
                    More Than Chatbots. <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">More Than Agents.</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed"
                >
                    Where other platforms help you build conversations, <span className="font-semibold text-cyan-400">AIDOS (Orchestrator)</span> runs your entire business logic end-to-end.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {[
                        { label: 'Others', value: 'Chat Interfaces', color: 'slate' },
                        { label: 'AIDOS', value: 'Complete Execution', color: 'cyan' },
                        { label: 'Result', value: 'Real Business Value', color: 'indigo' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                            className={`bg-${item.color}-500/10 border border-${item.color}-500/30 rounded-xl p-6`}
                        >
                            <p className="text-sm text-slate-400 mb-2">{item.label}</p>
                            <p className={`text-lg font-semibold text-${item.color}-300`}>{item.value}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// Why Unique Section
const WhyUniqueSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 80 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    const uniqueFeatures = [
        { icon: Cpu, title: "True Business AI OS", description: "Not just chatbots or agent frameworks — a complete operating system for AI-powered business automation." },
        { icon: Network, title: "Multi-Channel by Design", description: "Built from the ground up to work seamlessly across website, WhatsApp, voice, email, and more." },
        { icon: Boxes, title: "Reusable Blueprints", description: "Pre-built business flows and agent templates that you can customize and deploy instantly." },
        { icon: GitBranch, title: "Parallel Execution", description: "Multi-agent coordination and parallel reasoning for faster, smarter task completion." },
        { icon: Zap, title: "Easy Onboarding", description: "Get started in minutes with intuitive interfaces and smart defaults — no AI expertise required." },
        { icon: TrendingUp, title: "Future-Proof Architecture", description: "Built to evolve with AI advancements, supporting new models and capabilities as they emerge." }
    ];

    return (
        <section ref={sectionRef} id="why-unique" className="py-20 px-4 sm:px-6 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Why Nexus AI Hub is <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Unique</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        The only platform that delivers a complete Business AI Operating System
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {uniqueFeatures.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all"
                        >
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4"
                            >
                                <feature.icon className="h-7 w-7 text-white" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Future Roadmap Section  
const FutureRoadmapSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    useEffect(() => {
        if (sectionRef.current) {
            gsap.fromTo(
                sectionRef.current,
                { opacity: 0, y: 80 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }, []);

    const roadmapFeatures = [
        { icon: MessageCircle, title: "WhatsApp AI", description: "AI assistants for WhatsApp Business" },
        { icon: Phone, title: "Voice Bots", description: "Intelligent voice-based automation" },
        { icon: Mail, title: "Email Agents", description: "Smart email management & responses" },
        { icon: Calendar, title: "Scheduler Automation", description: "Time-based intelligent workflows" },
        { icon: Sparkles, title: "Custom GPT", description: "Build and deploy custom GPT models" },
        { icon: FileText, title: "Blueprint Library", description: "Pre-built business automation templates" },
        { icon: Globe, title: "Multi-Channel Workspace", description: "Unified dashboard for all channels" },
        { icon: Workflow, title: "Visual Orchestration", description: "Drag-and-drop workflow builder" }
    ];

    return (
        <section ref={sectionRef} id="roadmap" className="py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Future <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Roadmap</span>
                    </h2>
                    <p className="text-xl text-slate-400">
                        Exciting capabilities coming soon to AIDOS (Orchestrator)
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roadmapFeatures.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.08, type: 'spring' }}
                            whileHover={{ scale: 1.05, y: -5 }}
                        >
                            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group h-full">
                                <CardContent className="p-6 text-center">
                                    <motion.div
                                        whileHover={{ rotate: 360, scale: 1.1 }}
                                        transition={{ duration: 0.6 }}
                                        className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                                    >
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-400">{feature.description}</p>
                                    <Badge className="mt-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Coming Soon</Badge>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Final CTA Section
const FinalCTASection = ({ onGetStarted }: { onGetStarted: () => void }) => (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Become an AI-Powered Business <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Today</span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
                Join the future of intelligent automation. Let AIDOS transform how your business operates across every channel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    onClick={onGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 px-12 py-6 text-lg"
                >
                    <Rocket className="h-5 w-5 mr-2" />
                    Get Early Access
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-6 text-lg"
                    onClick={() => window.open('/docs/api-reference', '_blank')}
                >
                    View Documentation
                </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <div className="text-center">
                    <Users className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">For Everyone</div>
                    <div className="text-sm text-slate-400">Startups to Enterprises</div>
                </div>
                <div className="text-center">
                    <Building className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">Business Ready</div>
                    <div className="text-sm text-slate-400">Secure & Scalable</div>
                </div>
                <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">Start Free</div>
                    <div className="text-sm text-slate-400">No Credit Card Required</div>
                </div>
            </div>
        </div>
    </section>
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
                            <a href="#what-is-aidos" className="text-slate-300 hover:text-white transition-colors">What is AIDOS</a>
                            <a href="#touchpoints" className="text-slate-300 hover:text-white transition-colors">Channels</a>
                            <a href="#how-aidos-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
                            <a href="#roadmap" className="text-slate-300 hover:text-white transition-colors">Roadmap</a>
                            <a onClick={() => { window.location.href = '/About/AI'; }} style={{ cursor: 'pointer' }} className="text-slate-300 hover:text-slate-100 transition-colors">About AI</a>
                        </nav>

                        <div className="flex items-center gap-4">
                            {!isMobile ? <Button
                                variant="outline"
                                onClick={() => window.open('/docs/api-reference', '_blank')}
                                data-testid="view-docs"
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-6"

                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Docs
                            </Button> : <Button
                                variant="outline"
                                onClick={() => window.open('/docs/api-reference', '_blank')}
                                data-testid="view-docs"
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-6"
                                style={{ width: '51px', background: 'transparent' }}

                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                            </Button>}
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
                        <a href="#what-is-aidos" className="block text-slate-300 hover:text-white">What is AIDOS</a>
                        <a href="#touchpoints" className="block text-slate-300 hover:text-white">Channels</a>
                        <a href="#how-aidos-works" className="block text-slate-300 hover:text-white">How It Works</a>
                        <a href="#roadmap" className="block text-slate-300 hover:text-white">Roadmap</a>
                        <a onClick={() => { window.location.href = '/About/AI'; }} style={{ cursor: 'pointer' }} className="block text-slate-300 hover:text-white">About AI</a>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <HeroSection onGetStarted={handleGetStarted} />

            {/* LLM Logos Carousel */}
            <LLMLogosCarousel />

            {/* Social Proof Section */}
            <SocialProofSection />

            {/* What is AIDOS Section */}
            <WhatIsAIDOSSection />

            {/* Customer Touchpoints Section */}
            <CustomerTouchpointsSection />

            {/* Assistant Experience Section */}
            <AssistantExperienceSection />

            {/* How AIDOS Works Section */}
            <HowAIDOSWorksSection />

            {/* Execution Layers Section */}
            <ExecutionLayersSection />

            {/* Real Example Section */}
            <RealExampleSection />

            {/* Differentiator Section */}
            <DifferentiatorSection />

            {/* Why Unique Section */}
            <WhyUniqueSection />

            {/* Future Roadmap Section */}
            <FutureRoadmapSection />

            {/* Final CTA */}
            <FinalCTASection onGetStarted={handleGetStarted} />

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
