import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Code, Palette, Sparkles, Upload, Loader2, Zap, Plus, Trash2, GripVertical, Edit2, Smile, X, ExternalLink, Settings2, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ModelConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  stream: boolean;
  cache_threshold: number;
  is_cached: boolean;
  use_rag: boolean;
}

interface QuickButton {
  id: string;
  label: string;
  text: string;
  emoji?: string;
  image_url?: string;
  description?: string;
}

interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  font_style: string;
  button_style: string;
  logo_url: string;
  ai_search_engine_name: string;
  theme_preset: string;
  welcome_message: string;
  quick_start_questions?: string[];
}

interface ScriptSettings {
  workspace_id: string;
  theme_settings: ThemeSettings;
  quick_buttons?: QuickButton[];
  model_config?: ModelConfig;
  created_at?: string;
  updated_at?: string;
}

export default function ScriptsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showScript, setShowScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Buttons State
  const [quickButtons, setQuickButtons] = useState<QuickButton[]>([]);
  const [newButtonLabel, setNewButtonLabel] = useState('');
  const [newButtonText, setNewButtonText] = useState('');
  const [newButtonEmoji, setNewButtonEmoji] = useState('');
  const [newButtonImage, setNewButtonImage] = useState('');
  const [newButtonDescription, setNewButtonDescription] = useState('');
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadingButtonImage, setUploadingButtonImage] = useState(false);
  const buttonImageInputRef = useRef<HTMLInputElement>(null);

  // Quick Start Questions State
  const [newQuickStartQuestion, setNewQuickStartQuestion] = useState('');

  // Unsaved Changes Detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedThemeSettings, setSavedThemeSettings] = useState<ThemeSettings | null>(null);
  const [savedQuickButtons, setSavedQuickButtons] = useState<QuickButton[]>([]);
  const [savedModelConfig, setSavedModelConfig] = useState<ModelConfig | null>(null);

  // Model Configuration State
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'meta-llama/llama-3.3-8b-instruct:free',
    max_tokens: 300,
    temperature: 0.5,
    stream: true,
    cache_threshold: 0.5,
    is_cached: false,
    use_rag: false
  });
  const [modelSearchOpen, setModelSearchOpen] = useState(false);

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    background_color: '#ffffff',
    font_style: 'Inter',
    button_style: 'rounded',
    logo_url: '',
    ai_search_engine_name: 'AI Search Engine',
    theme_preset: 'light',
    welcome_message: 'Hello! How can I help you today?',
    quick_start_questions: []
  });

  // Fetch API token
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ['/api/api-tokens'],
    queryFn: async () => {
      const response = await apiClient.get('/api/api-tokens');
      return response.json();
    },
    enabled: !!user?.workspace_id
  });

  // Fetch available models
  const { data: availableModels = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['/api/v1/models'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/models');
      const data = await response.json();
      return data.data?.map((model: any) => ({
        id: model.id,
        name: model.name || model.id
      })) || [];
    },
    enabled: !!user?.workspace_id,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (tokenData?.tokens && tokenData.tokens.length > 0) {
      const firstToken = tokenData.tokens[0];
      setToken(firstToken.userId);
      setWorkspaceId(firstToken.workspaceId);
    }
  }, [tokenData]);

  // Fetch existing theme settings
  const { data: scriptSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/script', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/script/${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled: !!workspaceId
  });

  useEffect(() => {
    if (scriptSettings?.theme_settings) {
      setThemeSettings(scriptSettings.theme_settings);
      setSavedThemeSettings(scriptSettings.theme_settings);
      // Auto-show script interface if theme already exists
      setShowScript(true);
    }
    if (scriptSettings?.quick_buttons) {
      setQuickButtons(scriptSettings.quick_buttons);
      setSavedQuickButtons(scriptSettings.quick_buttons);
    }
    if (scriptSettings?.model_config) {
      setModelConfig(scriptSettings.model_config);
      setSavedModelConfig(scriptSettings.model_config);
    }
  }, [scriptSettings]);

  // Detect unsaved changes
  useEffect(() => {
    if (!savedThemeSettings || !savedModelConfig) {
      setHasUnsavedChanges(false);
      return;
    }

    const themeChanged = JSON.stringify(themeSettings) !== JSON.stringify(savedThemeSettings);
    const buttonsChanged = JSON.stringify(quickButtons) !== JSON.stringify(savedQuickButtons);
    const modelChanged = JSON.stringify(modelConfig) !== JSON.stringify(savedModelConfig);

    setHasUnsavedChanges(themeChanged || buttonsChanged || modelChanged);
  }, [themeSettings, quickButtons, modelConfig, savedThemeSettings, savedQuickButtons, savedModelConfig]);

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async (settings: { theme_settings: ThemeSettings; quick_buttons: QuickButton[]; model_config: ModelConfig }) => {
      const response = await apiClient.post(`/api/script/${workspaceId}`, settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Theme saved successfully.',
      });
      // Update saved state to mark changes as saved
      setSavedThemeSettings(themeSettings);
      setSavedQuickButtons(quickButtons);
      setSavedModelConfig(modelConfig);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/script', workspaceId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save theme',
        variant: 'destructive'
      });
    }
  });

  const handleGenerateScript = () => {
    if (!token || !workspaceId) {
      toast({
        title: 'Error',
        description: 'No API token found. Please create one in API Integrations.',
        variant: 'destructive'
      });
      return;
    }
    setShowScript(true);
    // Set active tab to theme when first opening
    setActiveTab('theme');
  };

  const handleSaveTheme = () => {
    saveThemeMutation.mutate({
      theme_settings: themeSettings,
      quick_buttons: quickButtons,
      model_config: modelConfig
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PNG, JPG, SVG, or WebP image.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Logo must be smaller than 2MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Convert image to base64 data URL for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setThemeSettings({ ...themeSettings, logo_url: dataUrl });
        toast({
          title: 'Logo Uploaded',
          description: 'Logo has been uploaded successfully. Remember to save your theme.',
        });
        setUploadingLogo(false);
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: 'Failed to read the image file.',
          variant: 'destructive'
        });
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'An error occurred while uploading the logo.',
        variant: 'destructive'
      });
      setUploadingLogo(false);
    }
  };

  const handleLogoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setThemeSettings({ ...themeSettings, logo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Logo Removed',
      description: 'Logo has been removed. Remember to save your theme.',
    });
  };

  // Quick Button Functions
  const handleAddQuickButton = () => {
    if (!newButtonLabel.trim() || !newButtonText.trim()) {
      toast({
        title: 'Error',
        description: 'Button label and text are required.',
        variant: 'destructive'
      });
      return;
    }

    if (editingButtonId) {
      // Update existing button
      setQuickButtons(quickButtons.map(btn =>
        btn.id === editingButtonId
          ? {
            ...btn,
            label: newButtonLabel.trim(),
            text: newButtonText.trim(),
            emoji: newButtonEmoji.trim() || undefined,
            image_url: newButtonImage.trim() || undefined,
            description: newButtonDescription.trim() || undefined
          }
          : btn
      ));
      setEditingButtonId(null);
      toast({
        title: 'Button Updated',
        description: 'Quick button updated successfully.',
      });
    } else {
      // Add new button
      const newButton: QuickButton = {
        id: Date.now().toString(),
        label: newButtonLabel.trim(),
        text: newButtonText.trim(),
        emoji: newButtonEmoji.trim() || undefined,
        image_url: newButtonImage.trim() || undefined,
        description: newButtonDescription.trim() || undefined
      };
      setQuickButtons([...quickButtons, newButton]);
      toast({
        title: 'Button Added',
        description: 'Quick button added successfully.',
      });
    }

    // Clear form
    setNewButtonLabel('');
    setNewButtonText('');
    setNewButtonEmoji('');
    setNewButtonImage('');
    setNewButtonDescription('');
  };

  const handleEditQuickButton = (button: QuickButton) => {
    setEditingButtonId(button.id);
    setNewButtonLabel(button.label);
    setNewButtonText(button.text);
    setNewButtonEmoji(button.emoji || '');
    setNewButtonImage(button.image_url || '');
    setNewButtonDescription(button.description || '');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingButtonId(null);
    setNewButtonLabel('');
    setNewButtonText('');
    setNewButtonEmoji('');
    setNewButtonImage('');
    setNewButtonDescription('');
  };

  const handleRemoveQuickButton = (id: string) => {
    setQuickButtons(quickButtons.filter(btn => btn.id !== id));
    if (editingButtonId === id) {
      handleCancelEdit();
    }
    toast({
      title: 'Button Removed',
      description: 'Quick button removed successfully.',
    });
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setNewButtonEmoji(emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  const handleButtonImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PNG, JPG, SVG, or WebP image.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 1MB for button images)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Button image must be smaller than 1MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingButtonImage(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setNewButtonImage(dataUrl);
        toast({
          title: 'Image Uploaded',
          description: 'Button image has been uploaded successfully.',
        });
        setUploadingButtonImage(false);
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: 'Failed to read the image file.',
          variant: 'destructive'
        });
        setUploadingButtonImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'An error occurred while uploading the image.',
        variant: 'destructive'
      });
      setUploadingButtonImage(false);
    }
  };

  // Drag and Drop Functions
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newButtons = [...quickButtons];
    const draggedButton = newButtons[draggedIndex];

    newButtons.splice(draggedIndex, 1);
    newButtons.splice(index, 0, draggedButton);

    setQuickButtons(newButtons);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const applyPreset = (preset: string) => {
    const presets: Record<string, Partial<ThemeSettings>> = {
      light: {
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6',
        background_color: '#ffffff',
        theme_preset: 'light'
      },
      dark: {
        primary_color: '#818cf8',
        secondary_color: '#a78bfa',
        background_color: '#1f2937',
        theme_preset: 'dark'
      },
      minimal: {
        primary_color: '#000000',
        secondary_color: '#6b7280',
        background_color: '#f9fafb',
        theme_preset: 'minimal'
      }
    };

    setThemeSettings({ ...themeSettings, ...presets[preset] });
  };

  const embedScript = `<iframe
  src="https://www.nexusaihub.co.in/chat-playground?token=${token}&client_id=${workspaceId}&site_id=1"
  style="width: 100%; height: 600px; border: none; border-radius: 10px;"
></iframe>`;

  const copyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedScript(true);
    toast({
      title: 'Copied!',
      description: 'Embed script copied to clipboard.',
    });
    setTimeout(() => setCopiedScript(false), 2000);
  };

  if (tokenLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Embed Script & Settings</h1>
          <p className="text-slate-400 mt-1">Customize your AI Search Engine theme and generate embed code</p>
        </div>
        {!showScript && !scriptSettings?.theme_settings && (
          <Button onClick={handleGenerateScript} className="bg-indigo-600 hover:bg-indigo-700">
            <Code className="w-4 h-4 mr-2" />
            Generate Script
          </Button>
        )}
      </div>

      {showScript ? (
        <>
          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-200">Unsaved Changes</p>
                <p className="text-xs text-amber-300/80">You have unsaved changes. Click "Save Changes" to keep your modifications.</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid max-w-3xl grid-cols-4 bg-slate-800">
                <TabsTrigger value="theme" className="data-[state=active]:bg-indigo-600">
                  <Palette className="w-4 h-4 mr-2" />
                  Customized Theme
                </TabsTrigger>
                <TabsTrigger value="quick-buttons" className="data-[state=active]:bg-indigo-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Buttons
                </TabsTrigger>
                <TabsTrigger value="model-config" className="data-[state=active]:bg-indigo-600">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Model Config
                </TabsTrigger>
                <TabsTrigger value="script" className="data-[state=active]:bg-indigo-600">
                  <Code className="w-4 h-4 mr-2" />
                  Script
                </TabsTrigger>
              </TabsList>

              {/* Common Save Button */}
              <Button
                onClick={handleSaveTheme}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={saveThemeMutation.isPending}
              >
                {saveThemeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            <TabsContent value="theme" className="space-y-6 mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Theme Customization</CardTitle>
                  <CardDescription className="text-slate-400">
                    Customize the appearance of your AI Search Engine
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Color Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color" className="text-slate-200">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={themeSettings.primary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={themeSettings.primary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                          className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary-color" className="text-slate-200">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={themeSettings.secondary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={themeSettings.secondary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                          className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="background-color" className="text-slate-200">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={themeSettings.background_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, background_color: e.target.value })}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={themeSettings.background_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, background_color: e.target.value })}
                          className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font and Button Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="font-style" className="text-slate-200">Font Style</Label>
                      <Select value={themeSettings.font_style} onValueChange={(value) => setThemeSettings({ ...themeSettings, font_style: value })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="button-style" className="text-slate-200">Button Style</Label>
                      <Select value={themeSettings.button_style} onValueChange={(value) => setThemeSettings({ ...themeSettings, button_style: value })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* AI Search Engine Name */}
                  <div className="space-y-2">
                    <Label htmlFor="ai-name" className="text-slate-200">AI Search Engine Name</Label>
                    <Input
                      id="ai-name"
                      type="text"
                      value={themeSettings.ai_search_engine_name}
                      onChange={(e) => setThemeSettings({ ...themeSettings, ai_search_engine_name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="e.g., My AI Assistant"
                    />
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome-message" className="text-slate-200">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      value={themeSettings.welcome_message}
                      onChange={(e) => setThemeSettings({ ...themeSettings, welcome_message: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="e.g., Hello! How can I help you today?"
                      rows={3}
                    />
                  </div>

                  {/* Quick Start Questions */}
                  <div className="space-y-3">
                    <Label className="text-slate-200">Quick Start Questions</Label>
                    <p className="text-xs text-slate-500">Add suggested questions that appear below the welcome message</p>

                    {/* Add Question Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newQuickStartQuestion}
                        onChange={(e) => setNewQuickStartQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newQuickStartQuestion.trim()) {
                            e.preventDefault();
                            const currentQuestions = themeSettings.quick_start_questions || [];
                            if (currentQuestions.length < 6) {
                              setThemeSettings({
                                ...themeSettings,
                                quick_start_questions: [...currentQuestions, newQuickStartQuestion.trim()]
                              });
                              setNewQuickStartQuestion('');
                            } else {
                              toast({
                                title: 'Limit Reached',
                                description: 'Maximum 6 quick start questions allowed.',
                                variant: 'destructive'
                              });
                            }
                          }
                        }}
                        className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="e.g., What services do you offer?"
                        maxLength={200}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newQuickStartQuestion.trim()) {
                            const currentQuestions = themeSettings.quick_start_questions || [];
                            if (currentQuestions.length < 6) {
                              setThemeSettings({
                                ...themeSettings,
                                quick_start_questions: [...currentQuestions, newQuickStartQuestion.trim()]
                              });
                              setNewQuickStartQuestion('');
                            } else {
                              toast({
                                title: 'Limit Reached',
                                description: 'Maximum 6 quick start questions allowed.',
                                variant: 'destructive'
                              });
                            }
                          }
                        }}
                        disabled={!newQuickStartQuestion.trim() || (themeSettings.quick_start_questions || []).length >= 6}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Questions List */}
                    {themeSettings.quick_start_questions && themeSettings.quick_start_questions.length > 0 && (
                      <div className="space-y-2">
                        {themeSettings.quick_start_questions.map((question, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg"
                          >
                            <span className="flex-1 text-sm text-slate-200">{question}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newQuestions = themeSettings.quick_start_questions?.filter((_, i) => i !== index) || [];
                                setThemeSettings({ ...themeSettings, quick_start_questions: newQuestions });
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-900/50"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500">Maximum 6 questions. Press Enter or click + to add.</p>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="logo-url" className="text-slate-200">Logo</Label>
                    <div className="space-y-3">
                      {/* Logo Preview */}
                      {themeSettings.logo_url && (
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-lg border-2 border-slate-600 bg-slate-700 flex items-center justify-center overflow-hidden">
                            <img
                              src={themeSettings.logo_url}
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                toast({
                                  title: 'Invalid Logo URL',
                                  description: 'The logo URL is invalid or the image cannot be loaded.',
                                  variant: 'destructive'
                                });
                              }}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}

                      {/* URL Input */}
                      <div className="flex gap-2">
                        <Input
                          id="logo-url"
                          type="text"
                          value={themeSettings.logo_url}
                          onChange={(e) => setThemeSettings({ ...themeSettings, logo_url: e.target.value })}
                          className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                          placeholder="https://example.com/logo.png or upload below"
                        />
                      </div>

                      {/* File Upload */}
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={handleLogoButtonClick}
                          disabled={uploadingLogo}
                          className="border-slate-600 hover:bg-slate-700 flex-1"
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo (PNG, JPG, SVG, WebP - Max 2MB)
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        You can either paste a URL or upload an image file. Uploaded images are stored as base64.
                      </p>
                    </div>
                  </div>

                  {/* Theme Presets */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Theme Presets</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => applyPreset('light')}
                        className="flex-1 border-slate-600 hover:bg-slate-700"
                      >
                        Light
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => applyPreset('dark')}
                        className="flex-1 border-slate-600 hover:bg-slate-700"
                      >
                        Dark
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => applyPreset('minimal')}
                        className="flex-1 border-slate-600 hover:bg-slate-700"
                      >
                        Minimal
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick-buttons" className="space-y-6 mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Quick Action Buttons</CardTitle>
                  <CardDescription className="text-slate-400">
                    Create quick action buttons that appear above the chat input for easy access to common prompts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add/Edit Button Form */}
                  <div className="space-y-4 p-4 border border-slate-700 rounded-lg bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {editingButtonId ? 'Edit Quick Button' : 'Add New Button'}
                      </h3>
                      {editingButtonId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="button-label" className="text-slate-200">Button Label *</Label>
                        <Input
                          id="button-label"
                          type="text"
                          value={newButtonLabel}
                          onChange={(e) => setNewButtonLabel(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-slate-100"
                          placeholder="e.g., T-shirt Product"
                          maxLength={30}
                        />
                        <p className="text-xs text-slate-500">Text shown on the button</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="button-emoji" className="text-slate-200">Emoji (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="button-emoji"
                            type="text"
                            value={newButtonEmoji}
                            onChange={(e) => setNewButtonEmoji(e.target.value)}
                            className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                            placeholder="Select or type emoji"
                            maxLength={2}
                          />
                          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="border-slate-600 hover:bg-slate-700"
                              >
                                <Smile className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-slate-600" align="end">
                              <EmojiPicker
                                onEmojiClick={handleEmojiSelect}
                                width={350}
                                height={400}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <p className="text-xs text-slate-500">Click the smile icon to pick or type emoji directly</p>
                      </div>
                    </div>

                    {/* Button Image Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="button-image" className="text-slate-200">Button Icon/Image (Optional)</Label>
                      <div className="space-y-3">
                        {/* Image Preview */}
                        {newButtonImage && (
                          <div className="relative inline-block">
                            <div className="w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-700 flex items-center justify-center overflow-hidden">
                              <img
                                src={newButtonImage}
                                alt="Button image preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setNewButtonImage('')}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            >
                              ×
                            </Button>
                          </div>
                        )}

                        {/* URL Input */}
                        <div className="flex gap-2">
                          <Input
                            id="button-image"
                            type="text"
                            value={newButtonImage}
                            onChange={(e) => setNewButtonImage(e.target.value)}
                            className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                            placeholder="https://example.com/icon.png or upload below"
                          />
                        </div>

                        {/* File Upload */}
                        <div className="flex gap-2">
                          <input
                            ref={buttonImageInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleButtonImageUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => buttonImageInputRef.current?.click()}
                            disabled={uploadingButtonImage}
                            className="border-slate-600 hover:bg-slate-700 flex-1"
                          >
                            {uploadingButtonImage ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Icon (PNG, JPG, SVG - Max 1MB)
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Upload an icon or image to display on the button (shown instead of emoji if provided)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="button-description" className="text-slate-200">Description (Optional)</Label>
                      <Textarea
                        id="button-description"
                        value={newButtonDescription}
                        onChange={(e) => setNewButtonDescription(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="e.g., Develop a business expansion..."
                        rows={2}
                        maxLength={200}
                      />
                      <p className="text-xs text-slate-500">Short description shown on hover (max 200 characters)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="button-text" className="text-slate-200">Button Action Text *</Label>
                      <Textarea
                        id="button-text"
                        value={newButtonText}
                        onChange={(e) => setNewButtonText(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="e.g., Show me information about t-shirt products"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-slate-500">Text that will be sent when the button is clicked</p>
                    </div>

                    <Button
                      onClick={handleAddQuickButton}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingButtonId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Update Button
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Quick Button
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Existing Buttons List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-100">Your Quick Buttons ({quickButtons.length})</h3>
                      <p className="text-xs text-slate-400">Drag to reorder</p>
                    </div>

                    {quickButtons.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No quick buttons yet. Add your first button above!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {quickButtons.map((button, index) => (
                          <div
                            key={button.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-start gap-3 p-4 bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-600 transition-all cursor-move ${draggedIndex === index ? 'opacity-50' : ''
                              } ${editingButtonId === button.id ? 'ring-2 ring-indigo-500' : ''
                              }`}
                          >
                            <GripVertical className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                {button.image_url ? (
                                  <img src={button.image_url} alt={button.label} className="w-6 h-6 object-contain rounded" />
                                ) : button.emoji ? (
                                  <span className="text-xl">{button.emoji}</span>
                                ) : null}
                                <span className="font-semibold text-slate-100">{button.label}</span>
                              </div>
                              <p className="text-sm text-slate-400">{button.text}</p>
                              {button.description && (
                                <p className="text-xs text-slate-500 italic">Description: {button.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuickButton(button)}
                                className="h-8 w-8 p-0 hover:bg-slate-700"
                                title="Edit button"
                              >
                                <Edit2 className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveQuickButton(button.id)}
                                className="h-8 w-8 p-0 hover:bg-red-900/50"
                                title="Delete button"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info Message */}
                  <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      Quick buttons and theme settings are saved together using the "Save Changes" button above.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="model-config" className="space-y-6 mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Model Configuration</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure AI model settings for your embedded chat interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">AI Model</Label>
                    <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={modelSearchOpen}
                          className="w-full justify-between h-10 bg-slate-700 border-slate-600 text-slate-100"
                        >
                          <span className="truncate text-sm">
                            {availableModels.find((m) => m.id === modelConfig.model)?.name || modelConfig.model}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput placeholder="Search models..." className="h-9 bg-slate-700 text-slate-100" />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            <CommandEmpty className="text-slate-400">No model found.</CommandEmpty>
                            <CommandGroup className="bg-slate-700">
                              {availableModels.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.name}
                                  onSelect={() => {
                                    setModelConfig({ ...modelConfig, model: model.id });
                                    setModelSearchOpen(false);
                                  }}
                                  className="cursor-pointer text-slate-100"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      modelConfig.model === model.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm">{model.name}</span>
                                    <span className="text-xs text-slate-400">{model.id}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-3">
                    <Label className="text-slate-200">Max Tokens: {modelConfig.max_tokens}</Label>
                    <Slider
                      value={[modelConfig.max_tokens]}
                      onValueChange={(v) => setModelConfig({ ...modelConfig, max_tokens: v[0] })}
                      min={50}
                      max={4000}
                      step={50}
                      className="py-2"
                    />
                    <p className="text-xs text-slate-500">Maximum number of tokens to generate</p>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-3">
                    <Label className="text-slate-200">Temperature: {modelConfig.temperature}</Label>
                    <Slider
                      value={[modelConfig.temperature]}
                      onValueChange={(v) => setModelConfig({ ...modelConfig, temperature: v[0] })}
                      min={0}
                      max={2}
                      step={0.1}
                      className="py-2"
                    />
                    <p className="text-xs text-slate-500">Controls randomness (0 = deterministic, 2 = very random)</p>
                  </div>

                  {/* Cache Threshold */}
                  <div className="space-y-3">
                    <Label className="text-slate-200">Cache Threshold: {modelConfig.cache_threshold}</Label>
                    <Slider
                      value={[modelConfig.cache_threshold]}
                      onValueChange={(v) => setModelConfig({ ...modelConfig, cache_threshold: v[0] })}
                      min={0}
                      max={1}
                      step={0.1}
                      className="py-2"
                    />
                    <p className="text-xs text-slate-500">Similarity threshold for cache hits</p>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div>
                        <Label className="text-slate-200">Stream Responses</Label>
                        <p className="text-xs text-slate-500">Enable real-time streaming of responses</p>
                      </div>
                      <Switch
                        checked={modelConfig.stream}
                        onCheckedChange={(checked) => setModelConfig({ ...modelConfig, stream: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div>
                        <Label className="text-slate-200">Use Cache</Label>
                        <p className="text-xs text-slate-500">Cache responses for faster replies</p>
                      </div>
                      <Switch
                        checked={modelConfig.is_cached}
                        onCheckedChange={(checked) => setModelConfig({ ...modelConfig, is_cached: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div>
                        <Label className="text-slate-200">Use RAG</Label>
                        <p className="text-xs text-slate-500">Enable Retrieval-Augmented Generation</p>
                      </div>
                      <Switch
                        checked={modelConfig.use_rag}
                        onCheckedChange={(checked) => setModelConfig({ ...modelConfig, use_rag: checked })}
                      />
                    </div>
                  </div>

                  {/* Info Message */}
                  <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <Settings2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      Model configuration applies to all conversations in the embedded chat interface.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="script" className="space-y-6 mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Embed Script</CardTitle>
                  <CardDescription className="text-slate-400">
                    Copy this code and paste it into your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-200 border border-slate-700">
                      <code>{embedScript}</code>
                    </pre>
                    <Button
                      onClick={copyScript}
                      className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                      size="sm"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Script
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-200">Preview (with your saved theme)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/chat-playground?token=${token}&client_id=${workspaceId}&site_id=1`, '_blank')}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
                      <iframe
                        src={`/chat-playground?token=${token}&client_id=${workspaceId}&site_id=1`}
                        style={{ width: '100%', height: '600px', border: 'none' }}
                        title="Chat Playground Preview"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-16 h-16 text-indigo-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Get Started</h3>
            <p className="text-slate-400 text-center max-w-md mb-6">
              Click "Generate Script" to customize your AI Search Engine theme and get your embed code
            </p>
            <Button onClick={handleGenerateScript} className="bg-indigo-600 hover:bg-indigo-700">
              <Code className="w-4 h-4 mr-2" />
              Generate Script
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
