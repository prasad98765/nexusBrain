import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/sheet';
import { MultiSelect } from '@/components/ui/multi-select';
import { X, Save } from 'lucide-react';
import { Contact, CustomField, InsertContact } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  workspaceId: string;
  mode: 'create' | 'edit';
}

export default function ContactDrawer({ 
  isOpen, 
  onClose, 
  contact, 
  workspaceId, 
  mode 
}: ContactDrawerProps) {
  const [formData, setFormData] = useState<Partial<Contact & InsertContact>>({
    name: '',
    email: '',
    phone: '',
    customFields: {}
  });
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom fields that should show in form
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/custom-fields?workspace_id=${workspaceId}`,{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // ✅ Added headers
      },});
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      const data = await response.json();
      // Handle both old and new API response formats
      return Array.isArray(data) ? data : data.fields || [];
    },
  });

  // Filter fields that should show in form
  const formFields = customFields.filter(field => field.showInForm);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact && mode === 'edit') {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        customFields: contact.customFields || {}
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        customFields: {}
      });
    }
  }, [contact, mode, isOpen]);

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({ title: 'Contact created successfully' });
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create contact', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const response = await fetch(`/api/contacts/${contact?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({ title: 'Contact updated successfully' });
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update contact', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleSave = () => {
    // Validate required default fields
    if (!formData.name?.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!formData.email?.trim()) {
      toast({ title: 'Email is required', variant: 'destructive' });
      return;
    }

    // Validate required custom fields
    const requiredCustomFields = customFields.filter(field => field.required && field.showInForm);
    for (const field of requiredCustomFields) {
      const value = formData.customFields?.[field.id];
      if (!value || (typeof value === 'string' && !value.trim())) {
        toast({ title: `${field.name} is required`, variant: 'destructive' });
        return;
      }
    }

    if (mode === 'create') {
      createContactMutation.mutate(formData as InsertContact);
    } else if (contact) {
      updateContactMutation.mutate(formData);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData.customFields?.[field.id] || '';
    
    switch (field.type) {
      case 'string':
        return (
          <Input
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100"
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100"
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100"
            required={field.required}
          />
        );
      
      case 'dropdown':
        return (
          <Select value={value} onValueChange={(val) => handleCustomFieldChange(field.id, val)}>
            <SelectTrigger className="bg-slate-700 border-slate-600">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2 text-slate-300">
                <input
                  type="radio"
                  name={`field_${field.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'multiselect':
        return (
          <MultiSelect
            options={field.options || []}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => handleCustomFieldChange(field.id, val)}
            placeholder="Select options..."
            className="bg-slate-700 border-slate-600"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-slate-800 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-slate-100">
            {mode === 'create' ? 'Add New Contact' : 'Edit Contact'}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            {mode === 'create' 
              ? 'Fill in the contact information below' 
              : 'Update the contact information'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Default Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200">Contact Information</h3>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Phone *</Label>
              <Input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-700 border-slate-600 text-slate-100"
                required
              />
            </div>
          </div>

          {/* Custom Fields */}
          {formFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Additional Information</h3>
              
              {formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-slate-300">
                    {field.name}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Timestamps for edit mode */}
          {mode === 'edit' && contact && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <h3 className="text-lg font-medium text-slate-200">Timestamps</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-slate-400">Created Date</Label>
                  <div className="text-slate-300 mt-1">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Modified Date</Label>
                  <div className="text-slate-300 mt-1">
                    {new Date(contact.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-6">
            <Button
              onClick={handleSave}
              disabled={createContactMutation.isPending || updateContactMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Contact' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}