import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Upload,
    FileText,
    File,
    CheckCircle2,
    AlertCircle,
    Loader2,
    BookOpen,
    Database,
    Sparkles,
    Trash2,
    Calendar,
    RefreshCw
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, isDeleting }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; isDeleting: boolean }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange} >
            <DialogContent className="w-[350px] p-6 text-center" style={{ color: "white" }}>
                <Trash2 className="w-10 h-10 mx-auto mb-4 text-destructive" />
                <h4 className="text-lg font-semibold mb-2">Are you sure you want to delete this Document?</h4>
                <p className="text-muted-foreground mb-6">This action cannot be undone.</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} data-testid="button-cancel-delete">Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} data-testid="button-confirm-delete">
                        {isDeleting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default function KnowledgeBasePage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        type: 'success' | 'error' | null;
        message: string;
        chunks?: number;
    }>({ type: null, message: '' });

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Text upload state
    const [rawText, setRawText] = useState('');
    const [textTitle, setTextTitle] = useState('');

    // Document list state
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingEntry, setDeletingEntry] = useState<any>(null);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'pptx'];

    // Load documents on mount
    useEffect(() => {
        fetchDocuments();
    }, [token]);

    const fetchDocuments = async () => {
        if (!token) return;

        setLoadingDocs(true);
        try {
            const response = await fetch('/api/rag/documents', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: "File too large",
                description: `Maximum file size is 10 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
                variant: "destructive",
            });
            return;
        }

        // Check file type
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
            toast({
                title: "Invalid file type",
                description: `Allowed types: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`,
                variant: "destructive",
            });
            return;
        }

        setSelectedFile(file);
        setUploadProgress({ type: null, message: '' });
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !token) return;

        setUploading(true);
        setUploadProgress({ type: null, message: '' });

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/rag/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setUploadProgress({
                    type: 'success',
                    message: `Successfully uploaded "${data.filename}"`,
                    chunks: data.chunks,
                });
                toast({
                    title: "✅ Upload Successful",
                    description: `Document indexed into ${data.chunks} chunks`,
                });
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                // Refresh document list
                fetchDocuments();
            } else {
                setUploadProgress({
                    type: 'error',
                    message: data.error || 'Upload failed',
                });
                toast({
                    title: "Upload Failed",
                    description: data.error || 'Failed to upload document',
                    variant: "destructive",
                });
            }
        } catch (error) {
            setUploadProgress({
                type: 'error',
                message: 'Network error. Please try again.',
            });
            toast({
                title: "Network Error",
                description: 'Failed to connect to server',
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleTextUpload = async () => {
        if (!rawText.trim() || !token) return;

        setUploading(true);
        setUploadProgress({ type: null, message: '' });

        try {
            const response = await fetch('/api/rag/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: rawText,
                    title: textTitle || 'Raw Text',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setUploadProgress({
                    type: 'success',
                    message: `Successfully indexed "${data.title}"`,
                    chunks: data.chunks,
                });
                toast({
                    title: "✅ Text Indexed",
                    description: `Content indexed into ${data.chunks} chunks`,
                });
                setRawText('');
                setTextTitle('');
                // Refresh document list
                fetchDocuments();
            } else {
                setUploadProgress({
                    type: 'error',
                    message: data.error || 'Upload failed',
                });
                toast({
                    title: "Upload Failed",
                    description: data.error || 'Failed to index text',
                    variant: "destructive",
                });
            }
        } catch (error) {
            setUploadProgress({
                type: 'error',
                message: 'Network error. Please try again.',
            });
            toast({
                title: "Network Error",
                description: 'Failed to connect to server',
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileText className="h-8 w-8 text-red-500" />;
            case 'docx':
                return <FileText className="h-8 w-8 text-blue-500" />;
            case 'pptx':
                return <FileText className="h-8 w-8 text-orange-500" />;
            default:
                return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    const handleDeletionConfirm = (entry: any) => {
        setDeletingEntry(entry);
        setDeleteDialogOpen(true);
    };

    const handleDeleteDocument = async () => {
        let filename = deletingEntry.filename;
        setDeletingDoc(filename);
        try {
            const response = await fetch(`/api/rag/documents/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: "✅ Document Deleted",
                    description: `Successfully removed "${filename}"`,
                });
                fetchDocuments();
                setDeleteDialogOpen(false);
                setDeletingEntry(null);

            } else {
                const data = await response.json();
                toast({
                    title: "Delete Failed",
                    description: data.error || 'Failed to delete document',
                    variant: "destructive",
                });
                setDeleteDialogOpen(false);
                setDeletingEntry(null);

            }
        } catch (error) {
            toast({
                title: "Network Error",
                description: 'Failed to connect to server',
                variant: "destructive",
            });
            setDeleteDialogOpen(false);
            setDeletingEntry(null);

        } finally {
            setDeletingDoc(null);
            setDeleteDialogOpen(false);
            setDeletingEntry(null);
        }
    };

    const formatDate = (timestamp: string) => {
        if (!timestamp) return 'Unknown';
        try {
            return new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown';
        }
    };
    // Add 
    //   <ConfirmDeleteDialog
    //   open={deleteDialogOpen}
    //   onOpenChange={setDeleteDialogOpen}
    //   onConfirm={handleDeleteDocument}
    //   isDeleting={false}
    // />
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto space-y-6">
                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="pt-6">
                            <Sparkles className="h-6 w-6 text-purple-400 mb-2" />
                            <h3 className="font-semibold text-slate-100 mb-1">AI-Powered Search</h3>
                            <p className="text-sm text-slate-400">Semantic search through your documents</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="pt-6">
                            <BookOpen className="h-6 w-6 text-blue-400 mb-2" />
                            <h3 className="font-semibold text-slate-100 mb-1">Context-Aware Responses</h3>
                            <p className="text-sm text-slate-400">Get answers based on your data</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="pt-6">
                            <CheckCircle2 className="h-6 w-6 text-green-400 mb-2" />
                            <h3 className="font-semibold text-slate-100 mb-1">Multi-Format Support</h3>
                            <p className="text-sm text-slate-400">PDF, DOCX, TXT, PPTX supported</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Upload Section */}
                <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">Upload File</TabsTrigger>
                        <TabsTrigger value="text">Paste Text</TabsTrigger>
                    </TabsList>

                    <TabsContent value="file">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Upload Document</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Upload PDF, DOCX, TXT, or PPTX files (Max 10 MB)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.txt,.pptx"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                                        <p className="text-slate-300 mb-2">Click to upload or drag and drop</p>
                                        <p className="text-sm text-slate-500">
                                            PDF, DOCX, TXT, PPTX (max 10 MB)
                                        </p>
                                    </label>
                                </div>

                                {selectedFile && (
                                    <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg">
                                        {getFileIcon(selectedFile)}
                                        <div className="flex-1">
                                            <p className="text-slate-200 font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-slate-400">
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleFileUpload}
                                            disabled={uploading}
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Upload
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {uploadProgress.type && (
                                    <div className={`flex items-start gap-3 p-4 rounded-lg ${uploadProgress.type === 'success'
                                        ? 'bg-green-500/10 border border-green-500/20'
                                        : 'bg-red-500/10 border border-red-500/20'
                                        }`}>
                                        {uploadProgress.type === 'success' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                                        )}
                                        <div>
                                            <p className={uploadProgress.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                                                {uploadProgress.message}
                                            </p>
                                            {uploadProgress.chunks && (
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Document split into {uploadProgress.chunks} chunks for optimal retrieval
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="text">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Index Raw Text</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Paste any text content to add to your knowledge base
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="text-title" className="text-slate-300">
                                        Title (Optional)
                                    </Label>
                                    <Input
                                        id="text-title"
                                        value={textTitle}
                                        onChange={(e) => setTextTitle(e.target.value)}
                                        placeholder="e.g., Product Documentation"
                                        className="bg-slate-900 border-slate-600 text-slate-100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="raw-text" className="text-slate-300">
                                        Text Content
                                    </Label>
                                    <Textarea
                                        id="raw-text"
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        placeholder="Paste your text content here..."
                                        className="min-h-[300px] bg-slate-900 border-slate-600 text-slate-100"
                                    />
                                    <p className="text-sm text-slate-400">
                                        {rawText.length > 0
                                            ? `${(new Blob([rawText]).size / 1024).toFixed(2)} KB / 10 MB`
                                            : '0 KB / 10 MB'}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleTextUpload}
                                    disabled={uploading || !rawText.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Indexing...
                                        </>
                                    ) : (
                                        <>
                                            <Database className="mr-2 h-4 w-4" />
                                            Index Text
                                        </>
                                    )}
                                </Button>

                                {uploadProgress.type && (
                                    <div className={`flex items-start gap-3 p-4 rounded-lg ${uploadProgress.type === 'success'
                                        ? 'bg-green-500/10 border border-green-500/20'
                                        : 'bg-red-500/10 border border-red-500/20'
                                        }`}>
                                        {uploadProgress.type === 'success' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                                        )}
                                        <div>
                                            <p className={uploadProgress.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                                                {uploadProgress.message}
                                            </p>
                                            {uploadProgress.chunks && (
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Text split into {uploadProgress.chunks} chunks for optimal retrieval
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Document List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Uploaded Documents</CardTitle>
                        <CardDescription className="text-slate-400">
                            View and manage your knowledge base documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingDocs ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                                <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No documents uploaded yet</p>
                                <p className="text-sm mt-1">Upload a document to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.filename}
                                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <FileText className="h-5 w-5 text-indigo-400" />
                                            <div className="flex-1">
                                                <p className="text-slate-200 font-medium">{doc.filename}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-xs text-slate-400">
                                                        {doc.chunks} chunks
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(doc.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletionConfirm(doc)}
                                            disabled={deletingDoc === doc.filename}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            {deletingDoc === doc.filename ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                {/* Add ConfirmDeleteDialog for document deletion confirmation */}
                <ConfirmDeleteDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteDocument}
                    isDeleting={false}
                />
            </div>

        </div>
    );
}
