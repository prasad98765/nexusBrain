import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CustomField } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

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
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);
  
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

  // Fetch custom fields with pagination
  const { data: customFieldsData, isLoading } = useQuery<CustomFieldsResponse>({
    queryKey: ['/api/custom-fields', workspaceId, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      const response = await fetch(`/api/custom-fields?${params}`);
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      const data = await response.json();
      // Handle both old and new API response formats
      if (Array.isArray(data)) {
        return {
          fields: data,
          total: data.length,
          page: 1,
          totalPages: 1
        };
      }
      return data;
    },
  });

  const customFields = customFieldsData?.fields || [];
  const totalPages = customFieldsData?.totalPages || 1;

  // Create custom field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (field: typeof newField & { workspaceId: string }) => {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      setShowCreateDrawer(false);
      resetNewField();
      toast({ title: 'Custom field created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create custom field', description: error.message, variant: 'destructive' });
    },
  });

  // Update custom field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomField> }) => {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      toast({ title: 'Custom field updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update custom field', description: error.message, variant: 'destructive' });
    },
  });

  // Delete custom field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/custom-fields/${fieldId}`, {
        method: 'DELETE',
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
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete custom field', description: error.message, variant: 'destructive' });
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
    if (optionInput.trim() && !newField.options.includes(optionInput.trim())) {
      setNewField({
        ...newField,
        options: [...newField.options, optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index)
    });
  };

  const handleAddEditOption = () => {
    if (editOptionInput.trim() && !editOptions.includes(editOptionInput.trim())) {
      const newOptions = [...editOptions, editOptionInput.trim()];
      setEditOptions(newOptions);
      setEditData({ ...editData, options: newOptions });
      setEditOptionInput('');
    }
  };

  const handleRemoveEditOption = (index: number) => {
    const newOptions = editOptions.filter((_, i) => i !== index);
    setEditOptions(newOptions);
    setEditData({ ...editData, options: newOptions });
  };

  const handleCreateField = () => {
    if (!newField.name.trim()) {
      toast({ title: 'Field name is required', variant: 'destructive' });
      return;
    }

    if (newField.name.length > 100) {
      toast({ title: 'Field name must be 100 characters or less', variant: 'destructive' });
      return;
    }

    const needsOptions = ['dropdown', 'radio', 'multiselect'].includes(newField.type);
    if (needsOptions && newField.options.length === 0) {
      toast({ title: 'At least one option is required for this field type', variant: 'destructive' });
      return;
    }

    createFieldMutation.mutate({
      ...newField,
      workspaceId
    });
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field.id);
    setEditData({
      name: field.name,
      type: field.type,
      options: field.options || [],
      required: field.required,
      showInForm: field.showInForm,
      readonly: field.readonly,
    });
    setEditOptions(field.options || []);
  };

  const handleSaveEdit = () => {
    if (!editingField || !editData.name?.trim()) {
      toast({ title: 'Field name is required', variant: 'destructive' });
      return;
    }

    if (editData.name && editData.name.length > 100) {
      toast({ title: 'Field name must be 100 characters or less', variant: 'destructive' });
      return;
    }

    // If readonly is true, showInForm must be false
    let updates = editData;
    if (editData.readonly && editData.showInForm) {
      updates = { ...editData, showInForm: false };
      toast({ title: 'Read-only fields cannot be shown in contact form', variant: 'default' });
    }

    updateFieldMutation.mutate({
      id: editingField,
      updates
    });
  };

  const handleShowInFormChange = (fieldId: string, checked: boolean) => {
    const field = customFields.find(f => f.id === fieldId);
    if (field?.readonly && checked) {
      toast({ title: 'Read-only fields cannot be shown in contact form', variant: 'destructive' });
      return;
    }
    
    if (editingField === fieldId) {
      setEditData({ ...editData, showInForm: checked });
    }
  };

  const defaultFields = [
    { name: 'Name', type: 'string', required: true, showInForm: true, readonly: false },
    { name: 'Email', type: 'string', required: true, showInForm: true, readonly: false },
    { name: 'Phone', type: 'string', required: true, showInForm: true, readonly: false },
    { name: 'Created Date', type: 'date', required: true, showInForm: false, readonly: true },
    { name: 'Modified Date', type: 'date', required: true, showInForm: false, readonly: true },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Contact Properties</h1>
          <p className="text-slate-400 mt-2">Manage custom contact properties for your workspace</p>
        </div>
        
        <Sheet open={showCreateDrawer} onOpenChange={setShowCreateDrawer}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-slate-800 border-slate-700">
            <SheetHeader>
              <SheetTitle className="text-slate-100">Create Custom Field</SheetTitle>
              <SheetDescription className="text-slate-400">
                Add a new custom field to collect additional contact information
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Field Name *</Label>
                <Input
                  placeholder="e.g., Company, Department, Birthday"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500">{newField.name.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Field Type *</Label>
                <Select value={newField.type} onValueChange={(value: any) => setNewField({ ...newField, type: value, options: [] })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="multiselect">Multi-Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(['dropdown', 'radio', 'multiselect'].includes(newField.type)) && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Options *</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an option"
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        maxLength={50}
                      />
                      <Button type="button" onClick={handleAddOption} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newField.options.map((option, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2">
                          {option}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveOption(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField({ ...newField, required: checked as boolean })}
                  />
                  <Label htmlFor="required" className="text-slate-300">Required field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showInForm"
                    checked={newField.showInForm && !newField.readonly}
                    disabled={newField.readonly}
                    onCheckedChange={(checked) => setNewField({ ...newField, showInForm: checked as boolean })}
                  />
                  <Label htmlFor="showInForm" className="text-slate-300">Show in contact form</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="readonly"
                    checked={newField.readonly}
                    onCheckedChange={(checked) => setNewField({ 
                      ...newField, 
                      readonly: checked as boolean,
                      showInForm: checked ? false : newField.showInForm
                    })}
                  />
                  <Label htmlFor="readonly" className="text-slate-300">Read-only (not editable in table)</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateField}
                  disabled={createFieldMutation.isPending}
                  className="flex-1"
                >
                  Create Field
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDrawer(false);
                    resetNewField();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Default Fields Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Default Fields</h2>
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800 border-slate-700">
                <TableHead className="text-slate-300">Field Name</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Required</TableHead>
                <TableHead className="text-slate-300">Show in Form</TableHead>
                <TableHead className="text-slate-300">Read-only</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultFields.map((field, index) => (
                <TableRow key={index} className="border-slate-700">
                  <TableCell className="text-slate-300 font-medium">{field.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-slate-400">
                      {field.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={field.required ? "default" : "secondary"}>
                      {field.required ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={field.showInForm ? "default" : "secondary"}>
                      {field.showInForm ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={field.readonly ? "destructive" : "secondary"}>
                      {field.readonly ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-100">Custom Fields</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search fields..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-700 border-slate-600 text-slate-100 w-64"
              />
            </div>
          </div>
        </div>
        
        {customFields.length === 0 && !search ? (
          <div className="border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No custom fields created yet</p>
            <p className="text-slate-500 text-sm mt-1">Click "Add Custom Field" to create your first custom field</p>
          </div>
        ) : customFields.length === 0 && search ? (
          <div className="border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No fields found matching "{search}"</p>
          </div>
        ) : (
          <>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800 border-slate-700">
                    <TableHead className="text-slate-300">Field Name</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Options</TableHead>
                    <TableHead className="text-slate-300">Required</TableHead>
                    <TableHead className="text-slate-300">Show in Form</TableHead>
                    <TableHead className="text-slate-300">Read-only</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.map((field) => (
                    <TableRow key={field.id} className="border-slate-700">
                      <TableCell className="text-slate-300 font-medium">
                        {editingField === field.id ? (
                          <div className="space-y-1">
                            <Input
                              value={editData.name || ''}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="h-8 bg-slate-700 border-slate-600"
                              maxLength={100}
                            />
                            <p className="text-xs text-slate-500">{(editData.name || '').length}/100</p>
                          </div>
                        ) : (
                          field.name
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-slate-400">
                          {field.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingField === field.id && ['dropdown', 'radio', 'multiselect'].includes(field.type) ? (
                          <div className="space-y-2 min-w-[200px]">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Add option"
                                value={editOptionInput}
                                onChange={(e) => setEditOptionInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddEditOption()}
                                className="h-7 text-xs bg-slate-700 border-slate-600"
                                maxLength={50}
                              />
                              <Button size="sm" onClick={handleAddEditOption} variant="outline" className="h-7 px-2">
                                +
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {editOptions.map((option, index) => (
                                <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                                  {option}
                                  <X 
                                    className="h-2 w-2 cursor-pointer" 
                                    onClick={() => handleRemoveEditOption(index)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : field.options && field.options.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {field.options.slice(0, 2).map((option, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                            {field.options.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{field.options.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === field.id ? (
                          <Checkbox
                            checked={editData.required || false}
                            onCheckedChange={(checked) => setEditData({ ...editData, required: checked as boolean })}
                          />
                        ) : (
                          <Badge variant={field.required ? "default" : "secondary"}>
                            {field.required ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === field.id ? (
                          <Checkbox
                            checked={editData.showInForm || false}
                            disabled={editData.readonly}
                            onCheckedChange={(checked) => handleShowInFormChange(field.id, checked as boolean)}
                          />
                        ) : (
                          <Badge variant={field.showInForm ? "default" : "secondary"}>
                            {field.showInForm ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === field.id ? (
                          <Checkbox
                            checked={editData.readonly || false}
                            onCheckedChange={(checked) => setEditData({ 
                              ...editData, 
                              readonly: checked as boolean,
                              showInForm: checked ? false : editData.showInForm
                            })}
                          />
                        ) : (
                          <Badge variant={field.readonly ? "destructive" : "secondary"}>
                            {field.readonly ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {editingField === field.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                disabled={updateFieldMutation.isPending}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingField(null);
                                  setEditData({});
                                  setEditOptions([]);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditField(field)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteFieldMutation.mutate(field.id)}
                                disabled={deleteFieldMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">
                  Page {page} of {totalPages} ({customFieldsData?.total || 0} total fields)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="border-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="border-slate-600"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}