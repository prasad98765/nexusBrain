import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import googleLogo from '@/logo/google.png';
import hubspotLogo from '@/logo/hubsopt.png';
import zohoLogo from '@/logo/zoho.png';

interface Integration {
    id: string;
    name: string;
    description: string;
    logo: React.ReactNode;
    category: string;
}

const integrations: Integration[] = [
    {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Sync data with Google Sheets for automated data management and reporting',
        logo: <img src={googleLogo} alt="Google" className="w-10 h-10 object-contain" />,
        category: 'Google Workspace'
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Schedule and manage events automatically with Google Calendar integration',
        logo: <img src={googleLogo} alt="Google" className="w-10 h-10 object-contain" />,
        category: 'Google Workspace'
    },
    {
        id: 'google-docs',
        name: 'Google Docs',
        description: 'Create and manage documents seamlessly with Google Docs',
        logo: <img src={googleLogo} alt="Google" className="w-10 h-10 object-contain" />,
        category: 'Google Workspace'
    },
    {
        id: 'google-keep',
        name: 'Google Keep',
        description: 'Capture and organize notes with Google Keep integration',
        logo: <img src={googleLogo} alt="Google" className="w-10 h-10 object-contain" />,
        category: 'Google Workspace'
    },
    {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Connect with HubSpot CRM to manage contacts, deals, and marketing automation',
        logo: <img src={hubspotLogo} alt="HubSpot" className="w-10 h-10 object-contain" />,
        category: 'CRM'
    },
    {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Connect with Salesforce CRM for comprehensive customer relationship management',
        logo: (
            <svg viewBox="0 0 48 48" className="w-10 h-10">
                <path fill="#00A1E0" d="M19.8,14.5c1.5-2.3,4.1-3.8,7-3.8c3.5,0,6.5,2.1,7.8,5.1c1.1-0.5,2.3-0.8,3.6-0.8c5,0,9,4,9,9s-4,9-9,9c-0.4,0-0.7,0-1.1-0.1c-1.3,2.6-4,4.4-7.1,4.4c-1.7,0-3.2-0.5-4.5-1.4c-1.3,1.9-3.5,3.2-6,3.2c-3.2,0-5.9-2.1-6.8-5c-0.4,0.1-0.8,0.1-1.2,0.1c-3.9,0-7-3.1-7-7s3.1-7,7-7c0.9,0,1.7,0.2,2.5,0.5C14.8,17.4,17.1,15.2,19.8,14.5z" />
            </svg>
        ),
        category: 'CRM'
    },
    {
        id: 'zoho-crm',
        name: 'Zoho CRM',
        description: 'Manage customer data and sales pipeline with Zoho CRM integration',
        logo: <img src={zohoLogo} alt="Zoho" className="w-10 h-10 object-contain" />,
        category: 'CRM'
    }
];

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Integrations</h2>
                <p className="text-muted-foreground">
                    Connect with your favorite tools and services to enhance your workflow
                </p>
            </div>

            {/* Integration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {integrations.map((integration) => (
                    <Card
                        key={integration.id}
                        className="relative hover:shadow-lg transition-all duration-200 border-muted"
                    >
                        {/* Coming Soon Badge */}
                        <div className="absolute top-3 right-3 z-10">
                            <Badge
                                variant="secondary"
                                className="bg-blue-900/20 text-blue-400 border-blue-700/50 font-semibold"
                            >
                                Coming Soon
                            </Badge>
                        </div>

                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                {/* Logo */}
                                <div className="flex-shrink-0 flex items-center justify-center">
                                    {integration.logo}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg mb-1">
                                        {integration.name}
                                    </CardTitle>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {integration.category}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <CardDescription className="text-sm leading-relaxed">
                                {integration.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Info Message */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground text-center">
                    🚀 These integrations are currently in development and will be available soon.
                    Stay tuned for updates!
                </p>
            </div>
        </div>
    );
}
