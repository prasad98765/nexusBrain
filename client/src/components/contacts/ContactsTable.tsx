import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Contact, CustomField, ContactsResponse, InsertContact } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ContactsTableProps {
  workspaceId: string;
}

interface EditingCell {
  contactId: string;
  field: string;
}

export default function ContactsTable({ workspaceId }: ContactsTableProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [visibleFields, setVisibleFields] = useState(['name', 'email', 'phone', 'createdAt']);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [showNewContactDialog, setShowNewContactDialog] = useState(false);
  const [newContact, setNewContact] = useState<Partial<InsertContact>>({
    name: '',
    email: '',
    phone: '',
    customFields: {}
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts with pagination and search
  const { data: contactsData, isLoading: contactsLoading } = useQuery<ContactsResponse>({
    queryKey: ['/api/contacts', workspaceId, page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch custom fields
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/custom-fields?workspace_id=${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch custom fields');
      return response.json();
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: Partial<Contact> }) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setEditingCell(null);
      toast({ title: 'Contact updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update contact', variant: 'destructive' });
    },
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contact: InsertContact) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, workspaceId }),
      });
      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowNewContactDialog(false);
      setNewContact({ name: '', email: '', phone: '', customFields: {} });
      toast({ title: 'Contact created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create contact', variant: 'destructive' });
    },
  });

  const allFields = [
    { key: 'name', label: 'Name', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'createdAt', label: 'Created Date', type: 'date' },
    ...customFields.map(field => ({
      key: `custom_${field.id}`,
      label: field.name,
      type: field.type,
      options: field.options
    }))
  ];

  const handleCellEdit = (contactId: string, field: string, currentValue: any) => {
    setEditingCell({ contactId, field });
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    const updates: any = {};
    if (editingCell.field.startsWith('custom_')) {
      const fieldId = editingCell.field.replace('custom_', '');
      updates.customFields = { [fieldId]: editValue };
    } else {
      updates[editingCell.field] = editValue;
    }

    updateContactMutation.mutate({
      contactId: editingCell.contactId,
      updates
    });
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleFieldVisibilityChange = (fieldKey: string, visible: boolean) => {
    if (visible) {
      setVisibleFields([...visibleFields, fieldKey]);
    } else {
      setVisibleFields(visibleFields.filter(f => f !== fieldKey));
    }
  };

  const formatCellValue = (contact: Contact, field: any) => {
    if (field.key.startsWith('custom_')) {
      const fieldId = field.key.replace('custom_', '');
      return contact.customFields?.[fieldId] || '';
    }

    const value = contact[field.key as keyof Contact];
    
    if (field.type === 'date' && value) {
      return new Date(value as string).toLocaleDateString();
    }
    
    return value || '';
  };

  const totalPages = contactsData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-slate-100">Contacts</h2>
        <div className="flex gap-2">
          <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Fields
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Choose Visible Fields</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {allFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={visibleFields.includes(field.key)}
                      onCheckedChange={(checked) => 
                        handleFieldVisibilityChange(field.key, checked as boolean)
                      }
                    />
                    <Label htmlFor={field.key} className="text-slate-300">
                      {field.label}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewContactDialog} onOpenChange={setShowNewContactDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
                <Input
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
                {customFields.map((field) => (
                  <div key={field.id}>
                    <Label className="text-slate-300">{field.name}</Label>
                    {field.type === 'dropdown' ? (
                      <Select
                        value={newContact.customFields?.[field.id] || ''}
                        onValueChange={(value) => 
                          setNewContact({
                            ...newContact,
                            customFields: { ...newContact.customFields, [field.id]: value }
                          })
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={newContact.customFields?.[field.id] || ''}
                        onChange={(e) => 
                          setNewContact({
                            ...newContact,
                            customFields: { ...newContact.customFields, [field.id]: e.target.value }
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => createContactMutation.mutate(newContact as InsertContact)}
                  disabled={!newContact.name || !newContact.email || createContactMutation.isPending}
                  className="w-full"
                >
                  Create Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-slate-100"
          />
        </div>
        <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800 border-slate-700">
              {allFields
                .filter(field => visibleFields.includes(field.key))
                .map((field) => (
                  <TableHead key={field.key} className="text-slate-300">
                    {field.label}
                  </TableHead>
                ))}
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactsLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleFields.length + 1} 
                  className="text-center py-8 text-slate-400"
                >
                  Loading contacts...
                </TableCell>
              </TableRow>
            ) : contactsData?.contacts.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleFields.length + 1} 
                  className="text-center py-8 text-slate-400"
                >
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contactsData?.contacts.map((contact) => (
                <TableRow key={contact.id} className="border-slate-700 hover:bg-slate-800/50">
                  {allFields
                    .filter(field => visibleFields.includes(field.key))
                    .map((field) => (
                      <TableCell key={field.key} className="text-slate-300">
                        {editingCell?.contactId === contact.id && editingCell.field === field.key ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 bg-slate-700 border-slate-600"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                              disabled={updateContactMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-slate-700 p-1 rounded flex items-center gap-2"
                            onClick={() => handleCellEdit(contact.id, field.key, formatCellValue(contact, field))}
                          >
                            <span>{formatCellValue(contact, field)}</span>
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCellEdit(contact.id, 'name', contact.name)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, contactsData?.total || 0)} of {contactsData?.total || 0} contacts
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}