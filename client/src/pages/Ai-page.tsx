import { Sidebar } from "@/components/ui/sidebar";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Users, ArrowRight, Play, Brain, Cpu, Globe, X, Menu, Sparkles, Target, TrendingUp, Activity, Settings, Network, Code, Database, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
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
            <div className="flex items-center gap-3" onClick={() => handleNav('/landing-page')} style={{ cursor: 'pointer' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-100">Nexus AI Hub</span>
            </div>

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
            <a onClick={() => { navigate('/customize-agent'); setMobileMenuOpen(false); }} className="block text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">Agent Bots</a>
            <a onClick={() => { navigate('/ai-search'); setMobileMenuOpen(false); }} className="block text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">AI Search</a>
            <a onClick={() => { navigate('/flow-builder'); setMobileMenuOpen(false); }} className="block text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">Technology</a>
            <a onClick={() => { navigate('/chatbot'); setMobileMenuOpen(false); }} className="block text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">How It Works</a>
            <a onClick={() => { navigate('/ai'); setMobileMenuOpen(false); }} className="block text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">About AI</a>
          </div>
        )}
      </header>
      <Sidebar />

      <main className="lg:ml-64">
        {/* Immersive Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-cyan-900/20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="mb-8">
              <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2 text-lg animate-pulse mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Artificial Intelligence Revolution
              </Badge>
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Artificial Intelligence
              </span><br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Unleashed
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Discover the transformative power of AI technologies that understand, learn, and adapt. 
              From intelligent agents to advanced search engines - explore how AI is reshaping our digital landscape 
              with cutting-edge capabilities and unlimited potential.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Brain className="h-5 w-5 mr-2" />
                Explore AI Technologies
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('ai-types-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Target className="h-5 w-5 mr-2" />
                Learn AI Types
              </Button>
            </div>

            {/* Interactive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</div>
                <div className="text-slate-400">Powered Future</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-cyan-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Smart</div>
                <div className="text-slate-400">Automation</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-purple-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-slate-400">Availability</div>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-green-500 transition-colors">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">∞</div>
                <div className="text-slate-400">Learning</div>
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

        {/* AI Section */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Quick Navigation */}
            <div className="mb-16">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Explore AI Concepts</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('what-is-ai')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                  >
                    What is AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('ai-agents')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    AI Agents
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('ai-search')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    AI Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('ai-types-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    AI Types
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('ai-training')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                  >
                    Training
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('ai-benefits')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm border-pink-500/50 text-pink-400 hover:bg-pink-500/20"
                  >
                    Benefits
                  </Button>
                </div>
              </Card>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Artificial Intelligence</h2>

            {/* What is AI */}
            <Card id="what-is-ai" className="mb-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    What is Artificial Intelligence?
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Artificial intelligence (AI) is a set of technologies that enable computers to perform a variety of advanced functions, including the ability to see, understand and translate spoken and written language, analyze data, make recommendations, and more.
                    </p>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      AI is a field of science concerned with building computers and machines that can reason, learn, and act in such a way that would normally require human intelligence or that involves data whose scale exceeds what humans can analyze.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-slate-300">Machine Learning & Deep Learning</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-slate-300">Natural Language Processing</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-slate-300">Computer Vision & Object Recognition</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-slate-300">Predictive Analytics & Forecasting</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-slate-300">Intelligent Data Retrieval</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                      alt="AI neural networks and human-robot interaction"
                      className="rounded-xl shadow-lg w-full h-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What is an AI Agent */}
            <Card id="ai-agents" className="mb-12 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Network className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    What is an AI Agent?
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      AI Agents are LLM-powered autonomous tools that can perceive their environment, make decisions, and take actions to achieve specific goals. They bridge the gap between human intent and automated execution.
                    </p>
                    <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
                      <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Available Now:
                      </h4>
                      <p className="text-slate-300 mb-4">Web Agent - Ready for deployment</p>
                      <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Coming Soon:
                      </h4>
                      <p className="text-slate-300">WhatsApp Agent & Voice Agent</p>
                    </Card>
                  </div>
                  <div>
                    <FlowDiagram steps={["User", "AI Agent", "LLM", "Action"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Search Engine */}
            <Card id="ai-search" className="mb-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    What is an AI Search Engine?
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Unlike traditional keyword-based search, AI Search Engines leverage LLM context to understand intent and deliver semantic, personalized results.
                    </p>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-slate-300">Semantic search understanding</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                          <Code className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-slate-300">Custom UI with CSS styling</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-slate-300">Personalized result ranking</span>
                      </div>
                    </div>
                    <Card className="bg-slate-800/50 border-slate-700 p-4">
                      <h4 className="text-purple-400 mb-2 font-semibold">Sample CSS Customization:</h4>
                      <pre className="text-sm text-slate-300 overflow-x-auto bg-slate-900/50 p-3 rounded"><code>{`.search-results {
  background: linear-gradient(135deg, #1a1b23, #2a2d34);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}`}</code></pre>
                    </Card>
                  </div>
                  <div>
                    <FlowDiagram steps={["Search Box", "LLM", "Results"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection */}
            <Card data-testid="card-ai-connection" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Connection — AI Agent + LLM</h3>
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className=" mb-4">
                      The synergy between AI Agents and Large Language Models creates a powerful ecosystem where natural language understanding meets autonomous action execution.
                    </p>
                    <p className="">
                      This connection enables agents to interpret complex user requests, reason through multi-step processes, and execute actions while maintaining context and learning from interactions.
                    </p>
                  </div>
                  <div>
                    <FlowDiagram steps={["User Input", "Agent", "LLM", "Response"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Web Bot */}
            <Card data-testid="card-web-bot" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">AI Agent Web Bot</h3>
                    <p className=" mb-6">
                      Web-based LLM agents provide real-time conversational interfaces that seamlessly integrate into existing websites and applications. Perfect for customer support, lead generation, and user engagement.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-accent mr-3" />
                        <span>Live chat capabilities</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-accent mr-3" />
                        <span>Integration-ready APIs</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-accent mr-3" />
                        <span>Popular for customer support</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                      alt="AI chatbot interface and customer service automation"
                      className="rounded-xl shadow-lg w-full h-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacts & Contact Properties */}
            {/* <Card data-testid="card-contacts" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Contacts & Contact Properties</h3>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-accent-secondary mb-2">Contact Definition:</h4>
                      <p className="">Individual records containing name, email, phone, and other identifying information.</p>
                    </div>
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-accent-secondary mb-2">Properties Include:</h4>
                      <ul className="space-y-1 ">
                        <li>• Tags and categories</li>
                        <li>• User preferences</li>
                        <li>• Traffic source tracking</li>
                        <li>• Behavioral data</li>
                      </ul>
                    </div>
                    <Card className="bg-card/50 p-4">
                      <p className="text-sm ">
                        <strong className="text-accent">Use Case:</strong> Essential for business automation, CRM integration, and targeted marketing campaigns.
                      </p>
                    </Card>
                  </div>
                  <div>
                    <FlowDiagram steps={["Web Bot", "CRM/API", "Contact Saved"]} />
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Types of AI */}
            <Card id="ai-types-section" className="mb-12 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-2 border-green-500/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="text-center space-y-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Layers className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Types of Artificial Intelligence
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-green-500 transition-colors">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-green-400 font-bold text-lg">1</span>
                    </div>
                    <h4 className="font-semibold text-white mb-3">Reactive Machines</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Limited AI that only reacts to different kinds of stimuli based on preprogrammed rules. Does not use memory and thus cannot learn with new data. IBM's Deep Blue that beat chess champion Garry Kasparov in 1997 was an example.
                    </p>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-blue-500 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-blue-400 font-bold text-lg">2</span>
                    </div>
                    <h4 className="font-semibold text-white mb-3">Limited Memory</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Most modern AI is considered limited memory. It can use memory to improve over time by being trained with new data, typically through artificial neural networks. Deep learning is considered limited memory artificial intelligence.
                    </p>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-purple-500 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-purple-400 font-bold text-lg">3</span>
                    </div>
                    <h4 className="font-semibold text-white mb-3">Theory of Mind</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Theory of mind AI does not currently exist, but research is ongoing. It describes AI that can emulate the human mind and has decision-making capabilities equal to humans, including recognizing and remembering emotions.
                    </p>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-cyan-500 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-cyan-400 font-bold text-lg">4</span>
                    </div>
                    <h4 className="font-semibold text-white mb-3">Self-Aware</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      A step above theory of mind AI, self-aware AI describes a mythical machine that is aware of its own existence and has the intellectual and emotional capabilities of a human. Self-aware AI does not currently exist.
                    </p>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* AI Training Models */}
            <Card data-testid="card-ai-training" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">AI Training Models</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-3">Supervised Learning</h4>
                    <p className=" text-sm">
                      Uses labeled training data to map specific inputs to outputs. For example, feeding the algorithm pictures labeled as cats to train it to recognize cat images.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                      <Cpu className="w-6 h-6 text-accent-secondary" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-3">Unsupervised Learning</h4>
                    <p className=" text-sm">
                      Learns patterns from unlabeled data. The algorithm categorizes information into groups based on attributes, excellent for pattern matching and descriptive modeling.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                      <Globe className="w-6 h-6 text-warning" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-3">Reinforcement Learning</h4>
                    <p className=" text-sm">
                      "Learn by doing" approach where an agent learns to perform tasks through trial and error using a feedback loop. Receives positive reinforcement for good performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits of AI */}
            <Card data-testid="card-ai-benefits" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Benefits of AI</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Automation</h4>
                        <p className=" text-sm">AI can automate workflows and processes or work independently from human teams, like monitoring network traffic for cybersecurity.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Reduce Human Error</h4>
                        <p className=" text-sm">Eliminate manual errors in data processing, analytics, and manufacturing through consistent algorithmic processes.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Eliminate Repetitive Tasks</h4>
                        <p className=" text-sm">Free human capital for higher impact problems by automating document verification, call transcription, and customer service.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Fast and Accurate</h4>
                        <p className=" text-sm">Process more information quickly than humans, finding patterns and relationships in data that humans may miss.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Infinite Availability</h4>
                        <p className=" text-sm">AI systems can be "always on," continuously working on assigned tasks without breaks or time limitations.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-accent-secondary mb-2">Accelerated R&D</h4>
                        <p className=" text-sm">Analyze vast amounts of data quickly to accelerate breakthroughs in research, pharmaceutical development, and scientific discovery.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Applications */}
            <Card data-testid="card-ai-applications" className="mb-12 hover-glow transition-all">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">AI Applications & Use Cases</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Speech Recognition</h4>
                    <p className=" text-sm">
                      Automatically convert spoken speech into written text for transcription and voice interfaces.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                      <Cpu className="w-6 h-6 text-accent-secondary" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Image Recognition</h4>
                    <p className=" text-sm">
                      Identify and categorize various aspects of images for medical diagnosis, autonomous vehicles, and security.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                      <Globe className="w-6 h-6 text-warning" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Language Translation</h4>
                    <p className=" text-sm">
                      Translate written or spoken words from one language into another with contextual understanding.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Predictive Modeling</h4>
                    <p className=" text-sm">
                      Mine data to forecast specific outcomes with high degrees of granularity for business intelligence.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-accent-secondary" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Data Analytics</h4>
                    <p className=" text-sm">
                      Find patterns and relationships in data for business intelligence and strategic decision making.
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-6">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                      <CheckCircle className="w-6 h-6 text-warning" />
                    </div>
                    <h4 className="font-semibold text-accent-secondary mb-2">Cybersecurity</h4>
                    <p className=" text-sm">
                      Autonomously scan networks for cyber attacks and threats, providing real-time security monitoring.
                    </p>
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