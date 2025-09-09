import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building, CheckCircle } from 'lucide-react';

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

export default function BusinessInfoPage() {
  const { user, token } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Load business types
    const fetchBusinessTypes = async () => {
      try {
        const response = await fetch('/api/business-types');
        if (response.ok) {
          const data = await response.json();
          setBusinessTypes(data.business_types);
        }
      } catch (error) {
        console.error('Failed to load business types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchBusinessTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your business name' });
      return;
    }

    if (!businessType) {
      setMessage({ type: 'error', text: 'Please select your business type' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Business information saved successfully!' });
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/nexus';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save business information' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
              <CardTitle className="text-xl text-slate-100">Complete Your Setup</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Tell us about your business to personalize your AI workspace experience
            </CardDescription>
          </CardHeader>


          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                message.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-950'}`}>
                {message.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                <AlertDescription className={
                  message.type === 'error' ? 'text-red-800 dark:text-red-200' :
                    message.type === 'success' ? 'text-green-800 dark:text-green-200' :
                      'text-blue-800 dark:text-blue-200'
                }>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                {loadingTypes ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select  value={businessType} onValueChange={setBusinessType} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue className='bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500' placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200"
                disabled={loading || loadingTypes}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Welcome to {user.first_name}'s workspace! This information helps us customize your AI experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}