import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Settings, LogOut, Menu, Phone, Mail, Bell, User } from 'lucide-react';
import ContactsTable from '@/components/contacts/ContactsTable';
import SettingsPage from '@/pages/settings-page';

export default function Home() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'contacts' | 'settings'>('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navigation Bar - Full Width */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <span className="text-xl font-bold text-slate-100">Nexus AI Hub</span>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-slate-300 hover:text-slate-100 transition-colors">AI Tools</a>
                <a href="#" className="text-slate-300 hover:text-slate-100 transition-colors">About</a>
                <a href="#" className="text-slate-300 hover:text-slate-100 transition-colors">Features</a>
                <a href="#" className="text-slate-300 hover:text-slate-100 transition-colors">How It Works</a>
                <a href="#" className="text-slate-300 hover:text-slate-100 transition-colors">Contact</a>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  Welcome, {user?.first_name || 'User'}!
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                >
                  Get Started
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-16 bg-slate-800/50 border-r border-slate-700 min-h-screen flex flex-col items-center py-6 gap-6">
          <button className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
          
          <div className="flex flex-col gap-4">
            <button 
              className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${
                activeView === 'dashboard' ? 'bg-slate-700' : ''
              }`}
              onClick={() => setActiveView('dashboard')}
            >
              <MessageSquare className={`h-5 w-5 ${
                activeView === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
            </button>
            <button 
              className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${
                activeView === 'contacts' ? 'bg-slate-700' : ''
              }`}
              onClick={() => setActiveView('contacts')}
            >
              <Users className={`h-5 w-5 ${
                activeView === 'contacts' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
            </button>
            <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <Phone className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button>
            <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <Mail className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button>
            <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <Bell className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <button 
              className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${
                activeView === 'settings' ? 'bg-slate-700' : ''
              }`}
              onClick={() => setActiveView('settings')}
            >
              <Settings className={`h-5 w-5 ${
                activeView === 'settings' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
            </button>
            <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <User className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6">
          {activeView === 'dashboard' ? (
            <div className="flex flex-col items-center justify-center min-h-full relative">
              {/* Hero Section */}
              <div className="max-w-4xl mx-auto text-center space-y-8 z-10">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="text-white">Build Intelligent</span><br />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      AI Agents
                    </span><br />
                    <span className="text-white">That <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Connect Everything</span></span>
                  </h1>
                  
                  <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Where all your AI, tools, and data converge. Create powerful agents with drag-and-drop simplicity, integrate 
                    any third-party service, and deploy everywhere.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-8 py-3 text-lg"
                  >
                    Start Building Now →
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 text-lg"
                  >
                    Watch Interactive Demo
                  </Button>
                </div>
              </div>

              {/* Feature Icons */}
              <div className="mt-20 flex justify-center items-center gap-16 z-10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded"></div>
                  </div>
                  <span className="text-sm text-slate-400">No-Code</span>
                </div>
                
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                      <span className="text-xs text-white font-bold">⚡</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-400">Instant Deploy</span>
                </div>
                
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-slate-400">Zero Code</span>
                </div>
              </div>

              {/* Background Effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          ) : activeView === 'contacts' ? (
            <ContactsTable 
              workspaceId={user?.workspaceId || 'default'} 
              onSettingsClick={() => setActiveView('settings')}
            />
          ) : activeView === 'settings' ? (
            <div className="h-full">
              <SettingsPage workspaceId={user?.workspaceId || 'default'} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}