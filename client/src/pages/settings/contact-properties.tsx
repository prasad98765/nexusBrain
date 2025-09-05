import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Type,
  Hash,
  Calendar,
  List,
  MoreVertical,
  Check
} from 'lucide-react';
import { CustomField } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ContactPropertiesProps {
  workspaceId: string;
}

interface CustomFieldsResponse {
  fields: CustomField[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ContactProperties({ workspaceId }: ContactPropertiesProps) {
  // Create custom field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: typeof newField) => {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      resetNewField();
      setShowCreateDrawer(false);
      toast({ title: 'Custom field created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create custom field', description: error.message, variant: 'destructive' });
    },
  });
  // Track loading state for each field action
  const [loadingFieldId, setLoadingFieldId] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);
  const { user, token } = useAuth();

  const [newField, setNewField] = useState({
    name: '',
    type: 'string' as const,
    options: [] as string[],
    required: false,
    showInForm: true,
    readonly: false,
  });
  const [editData, setEditData] = useState<Partial<CustomField>>({});
  const [optionInput, setOptionInput] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editOptionInput, setEditOptionInput] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Field type definitions with tooltips
  const fieldTypes = {
    string: { 
      label: 'Text', 
      icon: Type, 
      tooltip: 'Single line text input for names, titles, or short descriptions' 
    },
    number: { 
      label: 'Number', 
      icon: Hash, 
      tooltip: 'Numeric input for quantities, prices, or calculations' 
    },
    date: { 
      label: 'Date', 
      icon: Calendar, 
      tooltip: 'Date picker for birthdays, deadlines, or important dates' 
    },
    dropdown: { 
      label: 'Dropdown', 
      icon: List, 
      tooltip: 'Single selection from predefined options' 
    },
    radio: { 
      label: 'Radio', 
      icon: List, 
      tooltip: 'Single choice from visible options displayed as radio buttons' 
    },
    multiselect: { 
      label: 'Multi-select', 
      icon: List, 
      tooltip: 'Multiple selections from predefined options with checkboxes' 
    }
  };

  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearch = useDebounce(search, 500);

  // Fetch custom fields with pagination
  const { data: customFieldsData, isLoading } = useQuery<CustomFieldsResponse>({
    queryKey: ['/api/custom-fields', workspaceId, page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      const response = await fetch(`/api/custom-fields?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          fields: data,
          total: data.length,
          page: 1,
          totalPages: 1
        };
      }
      return data;
    }
  });

  const customFields = customFieldsData?.fields || [];
  const totalPages = customFieldsData?.totalPages || 1;
  const total = customFieldsData?.total || 0;

  // Maintain search focus after data refresh
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [customFieldsData]);

  // Delete custom field mutation with per-row loading
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      setLoadingFieldId(fieldId);
      const response = await fetch(`/api/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      toast({ title: 'Custom field deleted successfully' });
      setLoadingFieldId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete custom field', description: error.message, variant: 'destructive' });
      setLoadingFieldId(null);
    },
  });
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<CustomField> }) => {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      setEditingField(null);
      setEditData({});
      setEditOptions([]);
      setShowEditDrawer(false);
      toast({ title: 'Custom field updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update custom field', description: error.message, variant: 'destructive' });
    },
  });


  const resetNewField = () => {
    setNewField({
      name: '',
      type: 'string',
      options: [],
      required: false,
      showInForm: true,
      readonly: false,
    });
    setOptionInput('');
  };

  const handleAddOption = () => {
    const trimmedOption = optionInput.trim();
    if (
      trimmedOption.length >= 3 &&
      !newField.options.includes(trimmedOption) &&
      newField.options.length < 50
    ) {
      setNewField({
        ...newField,
        options: [...newField.options, trimmedOption]
      });
      setOptionInput('');
    } else if (trimmedOption.length < 3) {
      toast({ title: 'Option must be at least 3 characters long', variant: 'destructive' });
    } else if (newField.options.includes(trimmedOption)) {
      toast({ title: 'Option already exists', variant: 'destructive' });
    } else if (newField.options.length >= 50) {
      toast({ title: 'Maximum 50 options allowed', variant: 'destructive' });
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index)
    });
  };

  const handleAddEditOption = () => {
    const trimmedOption = editOptionInput.trim();
    if (
      trimmedOption.length >= 3 &&
      !editOptions.includes(trimmedOption) &&
      editOptions.length < 50
    ) {
      const newOptions = [...editOptions, trimmedOption];
      setEditOptions(newOptions);
      setEditData({ ...editData, options: newOptions });
      setEditOptionInput('');
    } else if (trimmedOption.length < 3) {
      toast({ title: 'Option must be at least 3 characters long', variant: 'destructive' });
    } else if (editOptions.includes(trimmedOption)) {
      toast({ title: 'Option already exists', variant: 'destructive' });
    } else if (editOptions.length >= 50) {
      toast({ title: 'Maximum 50 options allowed', variant: 'destructive' });
    }
  };

  const handleRemoveEditOption = (index: number) => {
    const newOptions = editOptions.filter((_, i) => i !== index);
    setEditOptions(newOptions);
    setEditData({ ...editData, options: newOptions });
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setEditData({
      name: field.name,
      type: field.type,
      required: field.required,
      showInForm: field.showInForm,
      readonly: field.readonly,
    });
    setEditOptions(field.options || []);
    setShowEditDrawer(true);
  };

  const handleUpdateField = () => {
    if (!editingField) return;
    updateFieldMutation.mutate({
      id: editingField.id,
      updates: {
        ...editData,
        options: editOptions
      }
    });
  };

  // Reset form when drawer closes
  useEffect(() => {
    if (!showCreateDrawer) {
      resetNewField();
    }
  }, [showCreateDrawer]);

  // Reset edit form when drawer closes
  useEffect(() => {
    if (!showEditDrawer) {
      setEditingField(null);
      setEditData({});
      setEditOptions([]);
      setEditOptionInput('');
    }
  }, [showEditDrawer]);

  const getFieldTypeIcon = (type: string) => {
    const IconComponent = fieldTypes[type as keyof typeof fieldTypes]?.icon || Type;
    return <IconComponent className="h-4 w-4" />;
  };

  const getFieldTypeLabel = (type: string) => {
    return fieldTypes[type as keyof typeof fieldTypes]?.label || type;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Contact Properties
            </h1>
            <p className="text-slate-400 mt-1">
              Create and manage custom fields for your contacts
            </p>
          </div>

          <Button
            onClick={() => setShowCreateDrawer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-create-property"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Search and Stats */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                data-testid="input-search-properties"
              />
            </div>
            <div className="text-sm text-slate-400">
              {total} {total === 1 ? 'property' : 'properties'} total
            </div>
          </div>
        </Card>

        {/* Properties Table */}
        {isLoading ? (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </Card>
        ) : customFields.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="text-center">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">No custom properties yet</h3>
              <p className="text-slate-400 mb-4">
                {search ? 'No properties match your search.' : 'Create your first custom property to get started.'}
              </p>
              {!search && (
                <Button
                  onClick={() => setShowCreateDrawer(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      Property Name
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The name of the custom field as it appears in forms</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      Type
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The input type that determines how users interact with this field</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      Status
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Field settings: required, visible in forms, read-only</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300 font-medium w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field) => (
                  <TableRow key={field.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-slate-100">
                      <div className="flex items-center gap-2">
                        {getFieldTypeIcon(field.type)}
                        <span className="font-medium">{field.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="bg-slate-600 text-slate-200 hover:bg-slate-500">
                            {getFieldTypeLabel(field.type)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{fieldTypes[field.type as keyof typeof fieldTypes]?.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {field.required && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This field must be filled out</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {field.showInForm && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="default" className="text-xs bg-blue-600">Visible</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Appears in contact forms</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {field.readonly && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">Read-only</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cannot be edited by users</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={() => handleEditField(field)}
                            className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                            disabled={loadingFieldId === field.id}
                          >
                            {loadingFieldId === field.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Edit2 className="h-4 w-4 mr-2" />
                            )}
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                            className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                            disabled={loadingFieldId === field.id}
                          >
                            {loadingFieldId === field.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Create Property Drawer */}
        <Sheet open={showCreateDrawer} onOpenChange={setShowCreateDrawer}>
          <SheetContent className="bg-slate-900 border-slate-700 text-slate-100 w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="text-slate-100">Create New Property</SheetTitle>
              <SheetDescription className="text-slate-400">
                Add a custom field to collect additional contact information
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Property Name */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  Property Name
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose a clear, descriptive name (max 20 characters)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value.slice(0, 20) })}
                  placeholder="e.g., Department, Budget, Lead Source"
                  className="bg-slate-800 border-slate-600 text-slate-100"
                  maxLength={20}
                />
                <div className="text-xs text-slate-500">
                  {newField.name.length}/20 characters
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  Property Type
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the input type that best fits your data</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value as any })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(fieldTypes).map(([value, config]) => {
                      const IconComponent = config.icon;
                      return (
                        <SelectItem key={value} value={value} className="text-slate-200 hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-500">
                  {fieldTypes[newField.type as keyof typeof fieldTypes]?.tooltip}
                </div>
              </div>

              {/* Options for dropdown/radio/multiselect */}
              {['dropdown', 'radio', 'multiselect'].includes(newField.type) && (
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center gap-2">
                    Options
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add options for users to choose from (max 50 options, 3+ characters each)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Enter option text..."
                      className="bg-slate-800 border-slate-600 text-slate-100"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button
                      type="button"
                      onClick={handleAddOption}
                      disabled={optionInput.trim().length < 3}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {newField.options.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {newField.options.map((option, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-600">
                          <span className="text-slate-200 text-sm">{option}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    {newField.options.length}/50 options
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-4">
                <Label className="text-slate-300">Settings</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField({ ...newField, required: !!checked })}
                    />
                    <Label htmlFor="required" className="text-slate-300 flex items-center gap-2">
                      Required field
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Users must fill this field to save the contact</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showInForm"
                      checked={newField.showInForm}
                      onCheckedChange={(checked) => setNewField({ ...newField, showInForm: !!checked })}
                    />
                    <Label htmlFor="showInForm" className="text-slate-300 flex items-center gap-2">
                      Show in contact forms
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Display this field when creating or editing contacts</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="readonly"
                      checked={newField.readonly}
                      onCheckedChange={(checked) => setNewField({ ...newField, readonly: !!checked })}
                    />
                    <Label htmlFor="readonly" className="text-slate-300 flex items-center gap-2">
                      Read-only
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Users can view but not edit this field</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => createFieldMutation.mutate(newField)}
                  disabled={!newField.name.trim() || createFieldMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {createFieldMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Create Property
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDrawer(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Property Drawer */}
        <Sheet open={showEditDrawer} onOpenChange={setShowEditDrawer}>
          <SheetContent className="bg-slate-900 border-slate-700 text-slate-100 w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="text-slate-100">Edit Property</SheetTitle>
              <SheetDescription className="text-slate-400">
                Modify the settings and options for this custom field
              </SheetDescription>
            </SheetHeader>

            {editingField && (
              <div className="space-y-6 mt-6">
                {/* Property Name */}
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    Property Name
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a clear, descriptive name (max 20 characters)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value.slice(0, 20) })}
                    placeholder="e.g., Department, Budget, Lead Source"
                    className="bg-slate-800 border-slate-600 text-slate-100"
                    maxLength={20}
                  />
                  <div className="text-xs text-slate-500">
                    {(editData.name || '').length}/20 characters
                  </div>
                </div>

                {/* Property Type (Read-only for existing fields) */}
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    Property Type
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Type cannot be changed after creation</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-600 rounded-md">
                    {getFieldTypeIcon(editingField.type)}
                    <span className="text-slate-200">{getFieldTypeLabel(editingField.type)}</span>
                    <Badge variant="outline" className="ml-auto text-xs">Cannot change</Badge>
                  </div>
                </div>

                {/* Options for dropdown/radio/multiselect */}
                {['dropdown', 'radio', 'multiselect'].includes(editingField.type) && (
                  <div className="space-y-3">
                    <Label className="text-slate-300 flex items-center gap-2">
                      Options
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add or remove options for users to choose from (max 50 options, 3+ characters each)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    
                    <div className="flex gap-2">
                      <Input
                        value={editOptionInput}
                        onChange={(e) => setEditOptionInput(e.target.value)}
                        placeholder="Enter option text..."
                        className="bg-slate-800 border-slate-600 text-slate-100"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEditOption()}
                      />
                      <Button
                        type="button"
                        onClick={handleAddEditOption}
                        disabled={editOptionInput.trim().length < 3}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {editOptions.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {editOptions.map((option: string, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-600">
                            <span className="text-slate-200 text-sm">{option}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEditOption(index)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      {editOptions.length}/50 options
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div className="space-y-4">
                  <Label className="text-slate-300">Settings</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-required"
                        checked={editData.required || false}
                        onCheckedChange={(checked) => setEditData({ ...editData, required: !!checked })}
                      />
                      <Label htmlFor="edit-required" className="text-slate-300 flex items-center gap-2">
                        Required field
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Users must fill this field to save the contact</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-showInForm"
                        checked={editData.showInForm !== false}
                        onCheckedChange={(checked) => setEditData({ ...editData, showInForm: !!checked })}
                      />
                      <Label htmlFor="edit-showInForm" className="text-slate-300 flex items-center gap-2">
                        Show in contact forms
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Display this field when creating or editing contacts</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-readonly"
                        checked={editData.readonly || false}
                        onCheckedChange={(checked) => setEditData({ ...editData, readonly: !!checked })}
                      />
                      <Label htmlFor="edit-readonly" className="text-slate-300 flex items-center gap-2">
                        Read-only
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Users can view but not edit this field</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpdateField}
                    disabled={!editData.name?.trim() || updateFieldMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {updateFieldMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDrawer(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}