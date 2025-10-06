import { create } from 'zustand'

export interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  top_provider: string;
  architecture: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface Provider {
  slug: string;
  name: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  status_page_url?: string;
}

interface ModelState {
  models: Model[];
  providers: Provider[];
  setModels: (models: Model[]) => void;
  setProviders: (providers: Provider[]) => void;
  fetchModelsAndProviders: (token: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  providers: [],
  setModels: (models) => set({ models }),
  setProviders: (providers) => set({ providers }),
  fetchModelsAndProviders: async (token?: string) => {
    if (!token) {
      console.error('No authentication token provided');
      return;
    }

    try {
      const [modelsResponse, providersResponse] = await Promise.all([
        fetch('/api/v1/models', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/v1/providers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ]);

      if (!modelsResponse.ok || !providersResponse.ok) {
        throw new Error('Failed to fetch models or providers');
      }

      const modelsData = await modelsResponse.json();
      const providersData = await providersResponse.json();
      
      set({ 
        models: modelsData.data || [],
        providers: providersData.data || []
      });
    } catch (error) {
      console.error('Failed to fetch models and providers:', error);
      throw error; // Re-throw to allow handling in components
    }
  }
}));
