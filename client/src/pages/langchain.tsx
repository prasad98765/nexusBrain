import { Sidebar } from "@/components/ui/sidebar";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Zap, Users, ArrowRight, Play, Brain, Cpu, Globe, X, Menu, Link2, Cog, Database, Layers, Network, Bot, Settings, Code, Sparkles, Target, TrendingUp, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useNavigate } from "react-router-dom";
import ChatBot from "@/components/ChatBot";
import { useIsMobile } from "@/hooks/use-mobile";


export default function LangChain() {
  const [location, setLocation] = useLocation();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile()

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
    navigate(path);
  };

  const handleGetStarted = () => {
    navigate('/auth');
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
            <div className="flex items-center gap-3" onClick={() => handleNav('/')} style={{ cursor: 'pointer' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span style={{margin:!isMobile ? "" :  "18px 14px 13px"}} className="text-lg sm:text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>

            <div className="flex items-center gap-4">
              {/* <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base px-4 sm:px-6 transform hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Button> */}

              {/* <button
                className="md:hidden text-slate-300 hover:text-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button> */}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {/* {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 space-y-3">
            <a href="#agent-bots" className="block text-slate-300 hover:text-slate-100 transition-colors">Agent Bots</a>
            <a href="#ai-search" className="block text-slate-300 hover:text-slate-100 transition-colors">AI Search</a>
            <a href="#ai-technology" className="block text-slate-300 hover:text-slate-100 transition-colors">Technology</a>
            <a href="#how-it-works" className="block text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
            <a href="#how-it-works" className="block text-slate-300 hover:text-slate-100 transition-colors">About Ai</a>
          </div>
        )} */}
      </header>
      <Sidebar />
      <main className="lg:ml-64">
        {/* Immersive Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-teal-900/20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="mb-8">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400 px-4 py-2 text-lg animate-pulse mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Framework Revolution
              </Badge>
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                LangChain
              </span><br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent animate-pulse">
                Framework for AI
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Build sophisticated LLM applications with the most popular open-source framework for creating 
              AI workflows, agents, and integrations. From simple chatbots to complex reasoning systems - 
              LangChain empowers developers to harness the full potential of large language models.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Link2 className="h-5 w-5 mr-2" />
                Explore LangChain
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('chains-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Cog className="h-5 w-5 mr-2" />
                Learn About Chains
              </Button>
            </div>

            {/* Interactive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-emerald-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Open</div>
                <div className="text-slate-400">Source Framework</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-teal-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">RAG</div>
                <div className="text-slate-400">Integration</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-green-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Agents</div>
                <div className="text-slate-400">& Workflows</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Prod</div>
                <div className="text-slate-400">Ready Apps</div>
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
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Explore LangChain Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('langchain-intro')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                  >
                    What is LangChain
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('chains-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-teal-500/50 text-teal-400 hover:bg-teal-500/20"
                  >
                    How It Works
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('components-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    Components
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('rag-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                  >
                    RAG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('integration-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    Integration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('usecases-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                  >
                    Use Cases
                  </Button>
                </div>
              </Card>
            </div>
            {/* What is LangChain */}
            <Card id="langchain-intro" data-testid="card-langchain-intro" className="mb-12 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className=" mb-6">
                      LangChain is an open source framework for building applications based on large language models (LLMs). It provides tools and abstractions to improve the customization, accuracy, and relevancy of the information the models generate.
                    </p>
                    <p className=" mb-6">
                      For example, developers can use LangChain components to build new prompt chains or customize existing templates. LangChain also includes components that allow LLMs to access new data sets without retraining.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mr-3 mt-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-accent-secondary">Prompt Templates</h4>
                          <p className=" text-sm">Pre-built structures for consistently formatting queries to AI models</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mr-3 mt-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-accent-secondary">Memory Systems</h4>
                          <p className=" text-sm">Conversation history and context management for stateful interactions</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mr-3 mt-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-accent-secondary">Agents & Chains</h4>
                          <p className=" text-sm">Sequential workflows and autonomous agents for complex tasks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <FlowDiagram steps={["Prompts", "Tools", "Agent", "Response"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why is LangChain Important */}
            <Card data-testid="card-langchain-importance" className="mb-12 bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-2 border-teal-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                    Why is LangChain Important?
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Bridging the gap between AI models and real-world applications
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <p className=" mb-6">
                      LLMs excel at responding to prompts in a general context, but struggle in a specific domain they were never trained on. Prompts are queries people use to seek responses from an LLM. For example, an LLM can provide an estimate of computer costs, but can't list the price of a specific computer model that your company sells.
                    </p>
                    <p className=" mb-6">
                      To address this, machine learning engineers must integrate the LLM with organization's internal data sources and apply prompt engineering. LangChain streamlines these intermediate steps to develop data-responsive applications, making prompt engineering more efficient.
                    </p>
                    <Card className="bg-card/50 p-4">
                      <h4 className="font-semibold text-accent mb-2">Key Benefits:</h4>
                      <ul className="space-y-1  text-sm">
                        <li>• Repurpose language models for domain-specific applications</li>
                        <li>• Simplify AI development by abstracting complexity</li>
                        <li>• Build complex applications without retraining models</li>
                        <li>• Active open-source community support</li>
                      </ul>
                    </Card>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-accent-secondary mb-4">Applications Made Easy</h4>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                        <div>
                          <h5 className="font-medium mb-1">Chatbots</h5>
                          <p className="text-sm ">Conversational interfaces with context awareness</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                        <div>
                          <h5 className="font-medium mb-1">Question-Answering</h5>
                          <p className="text-sm ">Systems that reference proprietary information</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                        <div>
                          <h5 className="font-medium mb-1">Content Generation</h5>
                          <p className="text-sm ">Automated content creation and summarization</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                        <div>
                          <h5 className="font-medium mb-1">Document Summarization</h5>
                          <p className="text-sm ">Read internal documents and create conversational responses</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How LangChain Works */}
            <Card id="chains-section" data-testid="card-langchain-how-works" className="mb-12 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Cog className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    How does LangChain Work?
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Building intelligent workflows with chains and components
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <p className="">
                    With LangChain, developers can adapt a language model flexibly to specific business contexts by designating steps required to produce the desired outcome.
                  </p>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Link2 className="w-8 h-8 text-accent mr-3" />
                        <h4 className="text-lg font-semibold text-accent-secondary">Chains</h4>
                      </div>
                      <p className=" text-sm mb-4">
                        Chains are the fundamental principle that holds various AI components in LangChain to provide context-aware responses. A chain is a series of automated actions from the user's query to the model's output.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm ">• Connecting to different data sources</p>
                        <p className="text-sm ">• Generating unique content</p>
                        <p className="text-sm ">• Translating multiple languages</p>
                        <p className="text-sm ">• Answering user queries</p>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Cog className="w-8 h-8 text-accent-secondary mr-3" />
                        <h4 className="text-lg font-semibold text-accent-secondary">Links</h4>
                      </div>
                      <p className=" text-sm mb-4">
                        Chains are made of links. Each action that developers string together to form a chained sequence is called a link. With links, developers can divide complex tasks into multiple, smaller tasks.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm ">• Formatting user input</p>
                        <p className="text-sm ">• Sending a query to an LLM</p>
                        <p className="text-sm ">• Retrieving data from cloud storage</p>
                        <p className="text-sm ">• Translating languages</p>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-card/50 p-6">
                    <h4 className="font-semibold text-accent-secondary mb-3">Installation & Usage</h4>
                    <p className=" text-sm mb-4">
                      To use LangChain, developers install the framework in Python and use chain building blocks or LangChain Expression Language (LCEL) to compose chains with simple programming commands.
                    </p>
                    <div className="bg-background rounded-lg p-4 border">
                      <code className="text-sm text-accent">pip install langchain</code>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Core Components */}
            <Card id="components-section" data-testid="card-langchain-components" className="mb-12 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Core Components of LangChain
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Building blocks for intelligent AI applications
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                        <Link2 className="w-6 h-6 text-accent" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">LLM Interface</h4>
                      <p className=" text-sm">
                        Provides APIs to connect and query LLMs from code. Developers can interface with public and proprietary models like GPT, Bard, and PaLM with simple API calls.
                      </p>
                    </div>

                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                        <Database className="w-6 h-6 text-accent-secondary" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">Prompt Templates</h4>
                      <p className=" text-sm">
                        Pre-built structures developers use to consistently and precisely format queries for AI models. Can be reused across different applications and language models.
                      </p>
                    </div>

                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                        <Cog className="w-6 h-6 text-warning" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">Agents</h4>
                      <p className=" text-sm">
                        Special chains that prompt the language model to decide the best sequence in response to a query. The language model returns a viable sequence of actions.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                        <Database className="w-6 h-6 text-accent" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">Retrieval Modules</h4>
                      <p className=" text-sm">
                        Tools to transform, store, search, and retrieve information that refine language model responses. Create semantic representations with word embeddings and vector databases.
                      </p>
                    </div>

                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-accent-secondary" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">Memory</h4>
                      <p className=" text-sm">
                        Memory capabilities for conversational applications. Supports simple systems that recall recent conversations and complex structures for historical analysis.
                      </p>
                    </div>

                    <div className="bg-card/50 rounded-lg p-6">
                      <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                        <Cog className="w-6 h-6 text-warning" />
                      </div>
                      <h4 className="font-semibold text-accent-secondary mb-3">Callbacks</h4>
                      <p className=" text-sm">
                        Codes placed in applications to log, monitor, and stream specific events in LangChain operations for tracking and debugging.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What is RAG */}
            <Card id="rag-section" data-testid="card-rag" className="mb-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Network className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    What is RAG (Retrieval-Augmented Generation)?
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Enhancing AI with external knowledge and real-time data
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <p className=" mb-6">
                      RAG combines the power of information retrieval with generative AI. It retrieves relevant documents from a knowledge base and uses them to generate more accurate, contextual responses with up-to-date information.
                    </p>
                    <Card className="bg-card/50 p-4">
                      <h4 className="font-semibold text-accent mb-2">Key Benefits:</h4>
                      <ul className="space-y-2 ">
                        <li className="flex items-center">
                          <span className="text-accent-secondary mr-2">•</span> Up-to-date information without model retraining
                        </li>
                        <li className="flex items-center">
                          <span className="text-accent-secondary mr-2">•</span> Handle long context beyond token limits
                        </li>
                        <li className="flex items-center">
                          <span className="text-accent-secondary mr-2">•</span> Source attribution and transparency
                        </li>
                        <li className="flex items-center">
                          <span className="text-accent-secondary mr-2">•</span> Domain-specific knowledge integration
                        </li>
                        <li className="flex items-center">
                          <span className="text-accent-secondary mr-2">•</span> Reduced hallucination and improved accuracy
                        </li>
                      </ul>
                    </Card>
                  </div>
                  <div>
                    <FlowDiagram steps={["Query", "Retriever", "LLM", "Response"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LangChain + RAG Integration */}
            <Card id="integration-section" data-testid="card-langchain-rag" className="mb-12 bg-gradient-to-r from-pink-500/10 to-orange-500/10 border-2 border-pink-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                    LangChain + RAG Integration
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    The perfect synergy for production-ready AI applications
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className=" mb-4">
                      The combination of LangChain's workflow management with RAG's knowledge retrieval creates a powerful foundation for building production-ready AI applications that can access external knowledge.
                    </p>
                    <p className=" mb-6">
                      This synergy enables developers to create sophisticated AI systems that can access external knowledge, maintain conversation context, execute complex multi-step workflows, and provide accurate, source-backed responses.
                    </p>
                    <Card className="bg-card/50 p-4">
                      <h4 className="text-accent-secondary font-semibold mb-2">Perfect For:</h4>
                      <p className=" text-sm">Document analysis, customer support, research assistants, knowledge management systems, and enterprise AI applications.</p>
                    </Card>
                  </div>
                  <div>
                    <div className="text-center">
                      <div className="text-4xl gradient-text font-bold mb-4">LangChain + RAG</div>
                      <div className="text-2xl text-accent-secondary mb-4">=</div>
                      <div className="text-lg font-semibold">Production AI App</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card id="usecases-section" data-testid="card-langchain-usecases" className="mb-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Popular Use Cases
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Real-world applications powered by LangChain
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Question Answering Systems</h4>
                      <p className=" text-sm">Build intelligent Q&A systems that can answer questions based on your documents and knowledge base.</p>
                    </div>
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Document Analysis</h4>
                      <p className=" text-sm">Automatically extract insights, summaries, and key information from large document collections.</p>
                    </div>
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Customer Support Bots</h4>
                      <p className=" text-sm">Create intelligent support agents that can access your knowledge base and provide accurate answers.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Research Assistants</h4>
                      <p className=" text-sm">Build AI assistants that can research topics, synthesize information, and provide comprehensive reports.</p>
                    </div>
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Content Generation</h4>
                      <p className=" text-sm">Generate content based on your specific data sources and maintain brand consistency.</p>
                    </div>
                    <div className="bg-card/50 rounded-lg p-4">
                      <h4 className="font-semibold text-accent-secondary mb-2">Code Analysis</h4>
                      <p className=" text-sm">Analyze codebases, generate documentation, and provide intelligent code suggestions.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <ChatBot />
    </div>
  );
}