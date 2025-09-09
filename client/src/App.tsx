import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AIPage from "@/pages/Ai-page";
import LangchainPage from "@/pages/langchain";
import LLMPage from "@/pages/llm";
import Home from "@/pages/home";
import BusinessInfoPage from "@/pages/business-info";
import ForgotPasswordPage from "@/pages/forgot-password";
import LandingPage from "@/pages/landing-page";
import LandingPageHub from "@/pages/landing-page-hub";
import LandingPageEnhanced from "@/pages/landing-page-enhanced";
import ChatbotPage from "@/pages/chatbot";
import ContactPropertiesPage from "@/pages/settings/contact-properties-page";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import AgentsPage from "./pages/agents-page";
import Layout from "./pages/Layout";

function Router() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [businessInfoRequired, setBusinessInfoRequired] = useState<boolean | null>(null);

  // Check if business info is required for authenticated users
  useEffect(() => {
    if (isAuthenticated && token) {
      const checkBusinessInfo = async () => {
        try {
          const response = await fetch('/api/business-info', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setBusinessInfoRequired(data.exists === false);
          } else {
            setBusinessInfoRequired(false);
          }
        } catch (error) {
          console.error('Failed to check business info:', error);
          setBusinessInfoRequired(false);
        }
      };

      checkBusinessInfo();
    } else {
      setBusinessInfoRequired(null);
    }
  }, [isAuthenticated, token]);

  if (isLoading || (isAuthenticated && businessInfoRequired === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading Nexus AI Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Static Landing Pages - Always accessible */}
      <Route path="/landing-page" Component={LandingPageEnhanced} />
      {/* <Route path="/landing-page/hub" Component={LandingPageHub} /> */}
      <Route path="/About/AI" Component={AIPage} />
      <Route path="/About/langchain" Component={LangchainPage} />
      <Route path="/About/LLM" Component={LLMPage} />

      
      {/* Chatbot Interface - Always accessible for embedded use */}
      <Route path="/chatbot" Component={ChatbotPage} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/auth" Component={AuthPage} />
          <Route path="/forgot-password" Component={ForgotPasswordPage} />
          <Route path="/" Component={() => { window.location.href = '/auth'; return null; }} />
        </>
      ) : businessInfoRequired ? (
        <>
          <Route path="/" Component={BusinessInfoPage} />
          <Route path="/business-info" Component={BusinessInfoPage} />
        </>
      ) : (
        <>
         <Route path="/nexus" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="agents" element={<AgentsPage />} />
          </Route>
          <Route path="/business-info" Component={BusinessInfoPage} />
          <Route path="/settings/contact-properties" Component={ContactPropertiesPage} />
        </>
      )}
      <Route Component={Home} />
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="721339353722-aqnl6orqhu784lo1csncj24rbh28b9n6.apps.googleusercontent.com">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
