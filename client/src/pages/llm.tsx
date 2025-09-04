import { Sidebar } from "@/components/ui/sidebar";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Users, ArrowRight, Play, Brain, Cpu, Globe, X, Menu, Link2, Cog, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
        <div className="min-h-screen bg-background" style={{ color: "white" }}>
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
                            <a onClick={() => { setLocation('/landing-page'); }} className="text-slate-300 hover:text-slate-100 transition-colors">Agent Bots</a>
                            <a onClick={() => { setLocation('/landing-page'); }} className="text-slate-300 hover:text-slate-100 transition-colors">AI Search</a>
                            <a onClick={() => { setLocation('/landing-page'); }} className="text-slate-300 hover:text-slate-100 transition-colors">Technology</a>
                            <a onClick={() => { setLocation('/landing-page'); }} className="text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
                            <a onClick={() => { setLocation('/About/AI'); }} className="text-slate-300 hover:text-slate-100 transition-colors">About AI</a>
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
                        <a href="#how-it-works" className="block text-slate-300 hover:text-slate-100 transition-colors">About Ai</a>
                    </div>
                )}
            </header>
            <Sidebar />
            <main className="lg:ml-64">
                {/* Hero Section */}
                <section className="relative hero-gradient-bg px-6 py-20 lg:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                            <span className="gradient-text">Large Language</span><br />
                            <span className="gradient-text">Models</span>
                        </h1>
                        <p className="text-xl  mb-8 max-w-2xl mx-auto">
                            Explore the most powerful AI models that understand and generate human-like text, powering the next generation of intelligent applications.
                        </p>
                    </div>
                </section>

                {/* Content Sections */}
                <section className="px-6 py-16">
                    <div className="max-w-6xl mx-auto">
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

                        {/* Popular LLMs Table */}
                        <Card data-testid="card-llm-comparison" className="mb-12 hover-glow transition-all">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-6">Popular LLMs Comparison</h3>
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