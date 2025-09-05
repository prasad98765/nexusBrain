import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ContactProperties from './contact-properties';

export default function ContactPropertiesPage() {
  const { user } = useAuth();
  if (!user?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Loading...</h2>
          <p className="text-slate-400">Please wait while we load your workspace.</p>
        </div>
      </div>
    );
  }

  return <ContactProperties workspaceId={user.workspace_id} />;
}