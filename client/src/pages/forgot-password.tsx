import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

const NexusLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-8">
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
      <span className="text-white font-bold text-xl">N</span>
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-100">Nexus AI Hub</h1>
      <p className="text-sm text-slate-400">Your AI-Powered Workspace</p>
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <NexusLogo />

          <Card className="shadow-xl bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <CardTitle className="text-xl text-slate-100">Check Your Email</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                We've sent password reset instructions to your email address
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {message && (
                <Alert className="border-green-500 bg-green-950/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-4">
                <p className="text-sm text-slate-400" style={{marginBottom: "18px"}}>
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                
                <Link href="/auth">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <NexusLogo />

        <Card className="shadow-xl bg-slate-800/90 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="h-6 w-6 text-indigo-500" />
              <CardTitle className="text-xl text-slate-100">Reset Your Password</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>

          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500 bg-red-950/50' : 'border-green-500 bg-green-950/50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth">
                <Button variant="ghost" className="text-slate-400 hover:text-slate-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}