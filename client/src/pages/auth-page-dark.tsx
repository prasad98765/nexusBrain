import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'wouter';

interface FormData {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
}

const NexusLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-8">
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
      <span className="text-white font-bold text-xl">N</span>
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-100">Nexus AI Hub</h1>
      <p className="text-sm text-slate-400">Build Intelligent AI Agents That Connect Everything</p>
    </div>
  </div>
);

export default function AuthPageDark() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    window.location.href = '/nexus';
    return null;
  }

  const validateForm = (isSignup = false) => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignup) {
      if (!formData.first_name?.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (!formData.last_name?.trim()) {
        newErrors.last_name = 'Last name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        localStorage.setItem('auth_token', data.token);
        setMessage({ type: 'success', text: data.message });
        // Redirect will happen automatically via useAuth
        window.location.href = '/nexus';
      } else {
        if (data.verification_required) {
          setVerificationRequired(true);
          setMessage({ type: 'info', text: data.message });
        } else {
          setMessage({ type: 'error', text: data.message });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setVerificationRequired(true);
        // Clear form
        setFormData({ email: '', password: '', first_name: '', last_name: '' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setMessage(null);

    try {
      const endpoint = activeTab === 'signup' ? '/api/google-signup' : '/api/google-login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_token: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        setMessage({ type: 'success', text: data.message });
        window.location.href = '/nexus';
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Google authentication failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      setMessage({ 
        type: response.ok ? 'success' : 'error', 
        text: data.message 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resend verification email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Auth form */}
        <div className="order-2 lg:order-1">
          <NexusLogo />

          <Card className="shadow-2xl bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-slate-100">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your workspace' 
                  : 'Sign up to start building intelligent AI agents'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              {message && (
                <Alert className={`mb-4 ${
                  message.type === 'error' ? 'border-red-500 bg-red-950/50' : 
                  message.type === 'success' ? 'border-green-500 bg-green-950/50' : 
                  'border-blue-500 bg-blue-950/50'
                }`}>
                  {message.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {message.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {message.type === 'info' && <Mail className="h-4 w-4 text-blue-500" />}
                  <AlertDescription className={
                    message.type === 'error' ? 'text-red-200' :
                    message.type === 'success' ? 'text-green-200' :
                    'text-blue-200'
                  }>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {verificationRequired && (
                <div className="mb-4 p-4 bg-blue-950/50 border border-blue-500 rounded-lg">
                  <h3 className="text-blue-200 font-medium mb-2">Check Your Email</h3>
                  <p className="text-blue-300 text-sm mb-3">
                    We've sent a verification link to your email address. Please check your inbox and spam folder.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="border-blue-500 text-blue-200 hover:bg-blue-900"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="login" className="data-[state=active]:bg-slate-600 text-slate-300">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-slate-600 text-slate-300">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          className="pl-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                          disabled={loading}
                        />
                      </div>
                      {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                    </div>

                    <div className="flex justify-end">
                      <Link href="/forgot-password">
                        <Button variant="link" className="text-indigo-400 hover:text-indigo-300 p-0 h-auto">
                          Forgot password?
                        </Button>
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <Input
                            id="first_name"
                            name="first_name"
                            type="text"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder="First name"
                            className="pl-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                            disabled={loading}
                          />
                        </div>
                        {errors.first_name && <p className="text-red-400 text-sm">{errors.first_name}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          type="text"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Last name"
                          className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                          disabled={loading}
                        />
                        {errors.last_name && <p className="text-red-400 text-sm">{errors.last_name}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          className="pl-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                          disabled={loading}
                        />
                      </div>
                      {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Create a password"
                          className="pl-10 pr-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setMessage({ type: 'error', text: 'Google login failed' })}
                    theme="filled_black"
                    size="large"
                    width="100%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero section */}
        <div className="order-1 lg:order-2 text-center lg:text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-indigo-400 text-sm font-medium">Build Intelligent AI Agents</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              <span className="text-white">Build Intelligent</span><br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Agents
              </span><br />
              <span className="text-white">That Connect Everything</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-md">
              Where all your AI, tools, and data converge. Create powerful agents with drag-and-drop simplicity, integrate 
              any third-party service, and deploy everywhere.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm">No-Code Solutions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Instant Deploy</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm">Zero Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}