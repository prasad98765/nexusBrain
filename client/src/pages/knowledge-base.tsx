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
    RefreshCw,
    Eye,
    X,
    Globe,
    ExternalLink,
    Search
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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Text upload state
    const [rawText, setRawText] = useState('');
    const [textTitle, setTextTitle] = useState('');

    // Document list state
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingEntry, setDeletingEntry] = useState<any>(null);

    // Tab state for filtering
    const [activeTab, setActiveTab] = useState<'file' | 'text' | 'url'>('file');

    // URL crawl state
    const [crawlUrl, setCrawlUrl] = useState('');
    const [crawling, setCrawling] = useState(false);
    const [crawledUrls, setCrawledUrls] = useState<any[]>([]);
    const [crawlLimitReached, setCrawlLimitReached] = useState(false);
    const [crawlMode, setCrawlMode] = useState<'single' | 'multi' | 'selective'>('single');
    const [crawlJobId, setCrawlJobId] = useState<string | null>(null);
    const [crawlStatus, setCrawlStatus] = useState<any>(null);
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

    // Selective crawling state
    const [showPageSelector, setShowPageSelector] = useState(false);
    const [discoveryId, setDiscoveryId] = useState<string | null>(null);
    const [discoveredPages, setDiscoveredPages] = useState<any[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
    const [discovering, setDiscovering] = useState(false);
    const [crawlingSelected, setCrawlingSelected] = useState(false);
    const [pageSearchQuery, setPageSearchQuery] = useState('');

    // View document state
    const [viewingDocument, setViewingDocument] = useState<any | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [documentContent, setDocumentContent] = useState<string>('');
    const [loadingContent, setLoadingContent] = useState(false);

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB total
    const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/csv'];
    const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'pptx', 'csv'];

    // Load documents on mount
    useEffect(() => {
        fetchDocuments();
        fetchCrawledUrls();
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

    const fetchCrawledUrls = async () => {
        if (!token) return;

        try {
            const response = await fetch('/api/rag/crawled-urls', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCrawledUrls(data.crawled_urls || []);
                setCrawlLimitReached(data.limit_reached || false);
            }
        } catch (error) {
            console.error('Failed to fetch crawled URLs:', error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const validFiles: File[] = [];
        const errors: string[] = [];
        let totalSize = 0;

        files.forEach(file => {
            // Check file type
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
                errors.push(`${file.name}: Invalid file type`);
                return;
            }

            totalSize += file.size;
            validFiles.push(file);
        });

        // Check total size
        if (totalSize > MAX_FILE_SIZE) {
            toast({
                title: "Files too large",
                description: `Total file size is ${(totalSize / (1024 * 1024)).toFixed(2)} MB. Maximum is 30 MB.`,
                variant: "destructive",
            });
            return;
        }

        if (errors.length > 0) {
            toast({
                title: "Some files were rejected",
                description: errors.join(', '),
                variant: "destructive",
            });
        }

        if (validFiles.length > 0) {
            setSelectedFiles(validFiles);
            setUploadProgress({ type: null, message: '' });
        }
    };

    const handleFileUpload = async () => {
        if (selectedFiles.length === 0 || !token) return;

        setUploading(true);
        setUploadProgress({ type: null, message: '' });

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

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
                const uploadedCount = data.uploaded_files?.length || 1;
                const failedCount = data.failed_files?.length || 0;

                setUploadProgress({
                    type: failedCount > 0 ? 'error' : 'success',
                    message: data.message || `Successfully uploaded ${uploadedCount} file(s)`,
                    chunks: data.total_chunks || data.chunks,
                });

                toast({
                    title: failedCount > 0 ? "⚠️ Partial Upload" : "✅ Upload Successful",
                    description: `${uploadedCount} file(s) indexed into ${data.total_chunks || data.chunks} chunks${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
                    variant: failedCount > 0 ? "destructive" : "default",
                });

                setSelectedFiles([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                // Refresh document list with a small delay to ensure Qdrant indexing is complete
                setTimeout(() => {
                    fetchDocuments();
                }, 500);
            } else {
                setUploadProgress({
                    type: 'error',
                    message: data.error || 'Upload failed',
                });
                toast({
                    title: "Upload Failed",
                    description: data.error || 'Failed to upload documents',
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
                // Refresh document list with a small delay to ensure Qdrant indexing is complete
                setTimeout(() => {
                    fetchDocuments();
                }, 500);
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

    const handleUrlCrawl = async () => {
        if (!crawlUrl.trim() || !token) return;

        // Validate URL format
        if (!crawlUrl.startsWith('http://') && !crawlUrl.startsWith('https://')) {
            toast({
                title: "Invalid URL",
                description: 'URL must start with http:// or https://',
                variant: "destructive",
            });
            return;
        }

        // If selective mode, trigger page discovery instead
        if (crawlMode === 'selective') {
            handleDiscoverPages();
            return;
        }

        setCrawling(true);
        setUploadProgress({ type: null, message: '' });
        setCrawlStatus(null);

        try {
            const response = await fetch('/api/rag/crawl-url', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: crawlUrl,
                    mode: crawlMode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (crawlMode === 'single') {
                    // Single page - immediate response
                    setUploadProgress({
                        type: 'success',
                        message: `Successfully crawled "${data.url}"`,
                        chunks: data.chunks,
                    });
                    toast({
                        title: "✅ URL Crawled",
                        description: `Content indexed into ${data.chunks} chunks`,
                    });
                    setCrawlUrl('');
                    setCrawling(false);
                    // Refresh lists
                    setTimeout(() => {
                        fetchDocuments();
                        fetchCrawledUrls();
                    }, 500);
                } else {
                    // Multi-page - async job started
                    setCrawlJobId(data.job_id);
                    toast({
                        title: "🔄 Crawl Started",
                        description: `Crawling all pages from the website. This may take a few minutes...`,
                    });
                    // Start polling for status
                    startPollingCrawlStatus(data.job_id);
                }
            } else {
                // Handle limit reached error
                if (response.status === 403) {
                    setCrawlLimitReached(true);
                }
                setUploadProgress({
                    type: 'error',
                    message: data.message || data.error || 'Crawl failed',
                });
                toast({
                    title: "Crawl Failed",
                    description: data.message || data.error || 'Failed to crawl URL',
                    variant: "destructive",
                });
                setCrawling(false);
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
            setCrawling(false);
        }
    };

    const startPollingCrawlStatus = (jobId: string) => {
        // Clear any existing poll interval
        if (pollInterval) {
            clearInterval(pollInterval);
        }

        // Poll every 3 seconds
        const interval = setInterval(() => {
            checkCrawlStatus(jobId);
        }, 3000);

        setPollInterval(interval);

        // Also check immediately
        checkCrawlStatus(jobId);
    };

    const checkCrawlStatus = async (jobId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/rag/crawl-status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCrawlStatus(data);

                if (data.status === 'completed' && data.processed) {
                    // Crawl is complete and processed
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        setPollInterval(null);
                    }
                    setCrawling(false);
                    setCrawlUrl('');
                    setCrawlJobId(null);

                    toast({
                        title: "✅ Crawl Complete",
                        description: `Indexed ${data.pages_crawled} pages (${data.total_chunks} chunks). ${data.pages_failed} pages failed.`,
                    });

                    // Refresh document list
                    setTimeout(() => {
                        fetchDocuments();
                        fetchCrawledUrls();
                    }, 500);
                } else if (data.status === 'failed') {
                    // Crawl failed
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        setPollInterval(null);
                    }
                    setCrawling(false);
                    setCrawlJobId(null);

                    toast({
                        title: "Crawl Failed",
                        description: 'The crawl job failed. Please try again.',
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error('Error checking crawl status:', error);
        }
    };

    // Cleanup poll interval on unmount
    useEffect(() => {
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [pollInterval]);

    const handleDiscoverPages = async () => {
        if (!crawlUrl.trim() || !token) return;

        // Validate URL format
        if (!crawlUrl.startsWith('http://') && !crawlUrl.startsWith('https://')) {
            toast({
                title: "Invalid URL",
                description: 'URL must start with http:// or https://',
                variant: "destructive",
            });
            return;
        }

        setDiscovering(true);
        setUploadProgress({ type: null, message: '' });

        try {
            const response = await fetch('/api/rag/discover-pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: crawlUrl,
                    max_pages: 1000
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setDiscoveryId(data.discovery_id);
                setDiscoveredPages(data.pages);
                setSelectedPages(new Set());
                setShowPageSelector(true);
                toast({
                    title: "📋 Pages Discovered",
                    description: `Found ${data.total_pages} pages. Select which ones to crawl.`,
                });
            } else {
                toast({
                    title: "Discovery Failed",
                    description: data.error || 'Failed to discover pages',
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Network Error",
                description: 'Failed to connect to server',
                variant: "destructive",
            });
        } finally {
            setDiscovering(false);
        }
    };

    const handleTogglePage = (url: string) => {
        setSelectedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(url)) {
                newSet.delete(url);
            } else {
                newSet.add(url);
            }
            return newSet;
        });
    };

    const handleSelectAllPages = () => {
        if (selectedPages.size === discoveredPages.length) {
            setSelectedPages(new Set());
        } else {
            setSelectedPages(new Set(discoveredPages.map(p => p.url)));
        }
    };

    const handleSelectAllFiltered = () => {
        const filtered = getFilteredPages();
        const filteredUrls = new Set(filtered.map(p => p.url));

        // Check if all filtered pages are already selected
        const allFilteredSelected = filtered.every(p => selectedPages.has(p.url));

        if (allFilteredSelected) {
            // Deselect all filtered pages
            setSelectedPages(prev => {
                const newSet = new Set(prev);
                filtered.forEach(p => newSet.delete(p.url));
                return newSet;
            });
        } else {
            // Select all filtered pages
            setSelectedPages(prev => {
                const newSet = new Set(prev);
                filtered.forEach(p => newSet.add(p.url));
                return newSet;
            });
        }
    };

    const getFilteredPages = () => {
        if (!pageSearchQuery.trim()) {
            return discoveredPages;
        }

        const query = pageSearchQuery.toLowerCase();
        return discoveredPages.filter(page => {
            const titleMatch = page.title.toLowerCase().includes(query);
            const urlMatch = page.url.toLowerCase().includes(query);
            return titleMatch || urlMatch;
        });
    };

    const handleCrawlSelectedPages = async () => {
        if (selectedPages.size === 0 || !token || !discoveryId) return;

        setCrawlingSelected(true);
        setUploadProgress({ type: null, message: '' });

        try {
            const response = await fetch('/api/rag/crawl-selected-pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    discovery_id: discoveryId,
                    selected_urls: Array.from(selectedPages)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "✅ Crawl Complete",
                    description: `Indexed ${data.pages_crawled} pages (${data.total_chunks} chunks). ${data.pages_failed} failed.`,
                });

                // Reset state
                setShowPageSelector(false);
                setDiscoveryId(null);
                setDiscoveredPages([]);
                setSelectedPages(new Set());
                setCrawlUrl('');
                setPageSearchQuery('');

                // Refresh document list
                setTimeout(() => {
                    fetchDocuments();
                    fetchCrawledUrls();
                }, 500);
            } else {
                if (response.status === 403) {
                    setCrawlLimitReached(true);
                }
                toast({
                    title: "Crawl Failed",
                    description: data.message || data.error || 'Failed to crawl selected pages',
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Network Error",
                description: 'Failed to connect to server',
                variant: "destructive",
            });
        } finally {
            setCrawlingSelected(false);
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
            case 'csv':
                return <FileText className="h-8 w-8 text-green-500" />;
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
                // Check if it was a URL crawl
                const isUrlCrawl = filename.startsWith('url_crawl_');

                toast({
                    title: "✅ Document Deleted",
                    description: isUrlCrawl
                        ? `Successfully removed URL crawl. You can now crawl a new URL.`
                        : `Successfully removed "${filename}"`,
                });

                // Reset crawl limit if URL was deleted
                if (isUrlCrawl) {
                    setCrawlLimitReached(false);
                }

                fetchDocuments();
                fetchCrawledUrls();
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

    const handleViewDocument = async (doc: any) => {
        setViewingDocument(doc);
        setViewDialogOpen(true);
        setLoadingContent(true);
        setDocumentContent('');

        try {
            const response = await fetch(`/api/rag/documents/${encodeURIComponent(doc.filename)}/content`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDocumentContent(data.content || 'No content available');
            } else {
                const data = await response.json();
                setDocumentContent('Failed to load content: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            setDocumentContent('Network error: Failed to load document content');
        } finally {
            setLoadingContent(false);
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

    // Helper function to determine if a document is a file upload or plain text
    const isFileUpload = (filename: string) => {
        // Check if filename has a file extension from allowed types
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension && ALLOWED_EXTENSIONS.includes(extension);
    };

    // Filter documents based on active tab
    const filteredDocuments = documents.filter(doc => {
        if (activeTab === 'file') {
            // Show only file uploads (documents with valid file extensions)
            return isFileUpload(doc.filename);
        } else if (activeTab === 'text') {
            // Show only plain text entries (documents without file extensions and not URL crawls)
            return !isFileUpload(doc.filename) && !doc.filename.startsWith('url_crawl_');
        } else if (activeTab === 'url') {
            // Show only URL crawls
            return doc.filename.startsWith('url_crawl_');
        }
        return false;
    });
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
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'file' | 'text' | 'url')} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="file">Upload File</TabsTrigger>
                        <TabsTrigger value="text">Paste Text</TabsTrigger>
                        <TabsTrigger value="url">
                            <Globe className="h-4 w-4 mr-2" />
                            Crawl URL
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Upload Document</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Upload PDF, DOCX, TXT, PPTX, or CSV files (Max 30 MB total)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.txt,.pptx,.xlsx,.csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                        multiple
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                                        <p className="text-slate-300 mb-2">Click to upload or drag and drop</p>
                                        <p className="text-sm text-slate-500">
                                            PDF, DOCX, TXT, PPTX, CSV (max 30 MB total)
                                        </p>
                                    </label>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-sm text-slate-300">
                                                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected ({(selectedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} MB / 30 MB)
                                            </p>
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
                                                        Upload All
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                                                    {getFileIcon(file)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-slate-200 font-medium truncate">{file.name}</p>
                                                        <p className="text-sm text-slate-400">
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                                        disabled={uploading}
                                                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
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

                    <TabsContent value="url">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-indigo-400" />
                                    Crawl Website URL
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Crawl single page or entire website with progress tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {crawlLimitReached ? (
                                    <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-orange-400 mb-2">URL Crawl Limit Reached</h4>
                                                <p className="text-sm text-slate-300 mb-3">
                                                    You have already crawled one URL for this workspace.
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    To crawl additional URLs, please contact us at{' '}
                                                    <a
                                                        href="mailto:support@nexusaihub.co.in"
                                                        className="text-indigo-400 hover:text-indigo-300 underline"
                                                    >
                                                        support@nexusaihub.co.in
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Crawl Mode Selection */}
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Crawl Mode</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {/* <button
                                                    onClick={() => setCrawlMode('single')}
                                                    disabled={crawling || discovering}
                                                    className={`p-3 rounded-lg border-2 transition-all ${crawlMode === 'single'
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        } ${(crawling || discovering) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="text-sm font-medium">Single Page</div>
                                                    <div className="text-xs mt-1 opacity-80">Crawl one URL</div>
                                                </button> */}
                                                <button
                                                    onClick={() => setCrawlMode('multi')}
                                                    disabled={crawling || discovering}
                                                    className={`p-3 rounded-lg border-2 transition-all ${crawlMode === 'multi'
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        } ${(crawling || discovering) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="text-sm font-medium">Multi-Page</div>
                                                    <div className="text-xs mt-1 opacity-80">Crawl all pages</div>
                                                </button>
                                                <button
                                                    onClick={() => setCrawlMode('selective')}
                                                    disabled={crawling || discovering}
                                                    className={`p-3 rounded-lg border-2 transition-all ${crawlMode === 'selective'
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        } ${(crawling || discovering) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="text-sm font-medium">Select Pages</div>
                                                    <div className="text-xs mt-1 opacity-80">Choose specific</div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mode-specific info boxes */}
                                        {crawlMode === 'multi' && (
                                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                                    <div className="text-xs text-slate-300">
                                                        <p className="font-medium text-orange-400 mb-1">Multi-Page Crawling Note</p>
                                                        <p className="text-slate-400">
                                                            Multi-page crawling uses Firecrawl API credits. If credits are exhausted, the system will automatically fall back to single-page mode. For best results with limited credits, use <strong>Single Page</strong> mode.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {crawlMode === 'selective' && (
                                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div className="text-xs text-slate-300">
                                                        <p className="font-medium text-blue-400 mb-1">Selective Crawling</p>
                                                        <p className="text-slate-400">
                                                            First, we'll discover all pages on the website. Then you can select exactly which pages to crawl and index. This conserves API credits and gives you full control.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* URL Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="crawl-url" className="text-slate-300">
                                                Website URL
                                            </Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                    <Input
                                                        id="crawl-url"
                                                        type="url"
                                                        value={crawlUrl}
                                                        onChange={(e) => setCrawlUrl(e.target.value)}
                                                        placeholder="https://example.com"
                                                        className="bg-slate-900 border-slate-600 text-slate-100 pl-10"
                                                        disabled={crawling}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleUrlCrawl}
                                                    disabled={(crawling || discovering) || !crawlUrl.trim()}
                                                    className="bg-indigo-600 hover:bg-indigo-700 px-6"
                                                >
                                                    {(crawling || discovering) ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            {discovering ? 'Discovering...' : crawlMode === 'single' ? 'Crawling...' : 'Processing...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Globe className="mr-2 h-4 w-4" />
                                                            {crawlMode === 'selective' ? 'Discover Pages' : 'Crawl'}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {crawlMode === 'single'
                                                    ? 'Enter a URL to crawl and index a single page'
                                                    : 'Enter the base URL to crawl all pages from the website'
                                                }
                                            </p>
                                        </div>

                                        {/* Crawl Status (for multi-page crawls) */}
                                        {crawling && crawlMode === 'multi' && crawlStatus && (
                                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                                                        <span className="text-sm font-medium text-indigo-300">
                                                            Crawl in Progress
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {crawlStatus.status}
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400">Pages: {crawlStatus.completed_pages || 0} / {crawlStatus.total_pages || '?'}</span>
                                                        <span className="text-slate-400">
                                                            {crawlStatus.total_pages > 0
                                                                ? `${Math.round((crawlStatus.completed_pages / crawlStatus.total_pages) * 100)}%`
                                                                : 'Processing...'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 transition-all duration-300"
                                                            style={{
                                                                width: crawlStatus.total_pages > 0
                                                                    ? `${(crawlStatus.completed_pages / crawlStatus.total_pages) * 100}%`
                                                                    : '0%'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="grid grid-cols-3 gap-3 text-xs">
                                                    <div className="bg-slate-800/50 p-2 rounded">
                                                        <div className="text-slate-400">Indexed</div>
                                                        <div className="text-green-400 font-semibold">{crawlStatus.pages_crawled || 0}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 p-2 rounded">
                                                        <div className="text-slate-400">Failed</div>
                                                        <div className="text-red-400 font-semibold">{crawlStatus.pages_failed || 0}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 p-2 rounded">
                                                        <div className="text-slate-400">Chunks</div>
                                                        <div className="text-indigo-400 font-semibold">{crawlStatus.total_chunks || 0}</div>
                                                    </div>
                                                </div>

                                                {/* Page details */}
                                                {crawlStatus.crawl_details && crawlStatus.crawl_details.length > 0 && (
                                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                                        {crawlStatus.crawl_details.map((detail: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-slate-800/30 rounded">
                                                                {detail.status === 'success' ? (
                                                                    <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
                                                                ) : (
                                                                    <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                                                )}
                                                                <span className="truncate flex-1 text-slate-300">{detail.title || detail.url}</span>
                                                                <span className={detail.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                                                    {detail.chunks || 0} chunks
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Success/Error Messages */}
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
                                                            Content split into {uploadProgress.chunks} chunks for optimal retrieval
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Info Box */}
                                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <ExternalLink className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-slate-300 space-y-1">
                                                    <p className="font-medium text-blue-400">How URL Crawling Works:</p>
                                                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                                                        <li><strong>Single Mode (Recommended):</strong> Crawls one page immediately using 1 API credit</li>
                                                        <li><strong>Multi Mode:</strong> Attempts to crawl all pages (may fail if API credits exhausted)</li>
                                                        <li>Firecrawl extracts main content, excluding nav/footer/header</li>
                                                        <li>Content is processed and split into searchable chunks</li>
                                                        <li>System automatically falls back to single page if multi-page fails</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Document List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-slate-100">
                            {activeTab === 'file' ? 'Uploaded Files' : activeTab === 'text' ? 'Plain Text Entries' : 'Crawled URLs'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {activeTab === 'file'
                                ? 'View and manage your uploaded document files'
                                : activeTab === 'text'
                                    ? 'View and manage your plain text knowledge entries'
                                    : 'View your crawled website content'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingDocs ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                                <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                {activeTab === 'file' ? (
                                    <>
                                        <p>No files uploaded yet</p>
                                        <p className="text-sm mt-1">Upload a document file to get started</p>
                                    </>
                                ) : activeTab === 'text' ? (
                                    <>
                                        <p>No plain text entries yet</p>
                                        <p className="text-sm mt-1">Add plain text content to get started</p>
                                    </>
                                ) : (
                                    <>
                                        <p>No URLs crawled yet</p>
                                        <p className="text-sm mt-1">Crawl a website URL to get started</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredDocuments.map((doc) => (
                                    <div
                                        key={doc.filename}
                                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors group"
                                    >
                                        <div
                                            className="flex items-center gap-3 flex-1 cursor-pointer"
                                            onClick={() => handleViewDocument(doc)}
                                        >
                                            <FileText className="h-5 w-5 text-indigo-400" />
                                            <div className="flex-1">
                                                <p className="text-slate-200 font-medium group-hover:text-indigo-400 transition-colors">{doc.filename}</p>
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
                                            <Eye className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                        {/* Show delete button for all tabs, but with special handling for URL crawls */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletionConfirm(doc);
                                            }}
                                            disabled={deletingDoc === doc.filename}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
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

                {/* View Document Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] bg-slate-800 border-slate-700">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-400" />
                                    {viewingDocument?.filename}
                                </DialogTitle>
                                {/* <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewDialogOpen(false)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <X className="h-4 w-4" />
                                </Button> */}
                            </div>
                        </DialogHeader>
                        <div className="space-y-4">
                            {viewingDocument && (
                                <div className="flex items-center gap-4 text-sm text-slate-400 pb-2 border-b border-slate-700">
                                    <span className="flex items-center gap-1">
                                        <Database className="h-3 w-3" />
                                        {viewingDocument.chunks} chunks
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(viewingDocument.timestamp)}
                                    </span>
                                </div>
                            )}

                            <div className="max-h-[500px] overflow-y-auto">
                                {loadingContent ? (
                                    <div className="flex items-center justify-center p-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                                        <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                            {documentContent}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add ConfirmDeleteDialog for document deletion confirmation */}
                <ConfirmDeleteDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteDocument}
                    isDeleting={false}
                />

                {/* Page Selector Dialog */}
                <Dialog open={showPageSelector} onOpenChange={setShowPageSelector}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-indigo-400" />
                                Select Pages to Crawl
                            </DialogTitle>
                            <p className="text-sm text-slate-400 mt-2">
                                Found {discoveredPages.length} pages. Select the ones you want to crawl and index.
                            </p>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    value={pageSearchQuery}
                                    onChange={(e) => setPageSearchQuery(e.target.value)}
                                    placeholder="Search pages by title or URL..."
                                    className="bg-slate-900 border-slate-600 text-slate-100 pl-10 pr-10"
                                />
                                {pageSearchQuery && (
                                    <button
                                        onClick={() => setPageSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Select All / Stats */}
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-4">
                                    {pageSearchQuery ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectAllFiltered}
                                            className="text-slate-300 border-slate-600 hover:bg-slate-700"
                                        >
                                            {(() => {
                                                const filtered = getFilteredPages();
                                                const allFilteredSelected = filtered.every(p => selectedPages.has(p.url));
                                                return allFilteredSelected ? (
                                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Deselect Filtered</>
                                                ) : (
                                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Select Filtered</>
                                                );
                                            })()}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectAllPages}
                                            className="text-slate-300 border-slate-600 hover:bg-slate-700"
                                        >
                                            {selectedPages.size === discoveredPages.length ? (
                                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Deselect All</>
                                            ) : (
                                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Select All</>
                                            )}
                                        </Button>
                                    )}
                                    <span className="text-sm text-slate-400">
                                        {selectedPages.size} of {discoveredPages.length} pages selected
                                        {pageSearchQuery && (
                                            <span className="ml-2 text-indigo-400">
                                                ({getFilteredPages().length} matches)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Page List */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {(() => {
                                    const filteredPages = getFilteredPages();

                                    if (filteredPages.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                                <Search className="h-12 w-12 mb-3 opacity-50" />
                                                <p className="text-sm">No pages match your search</p>
                                                <p className="text-xs mt-1">Try a different search term</p>
                                            </div>
                                        );
                                    }

                                    return filteredPages.map((page, index) => {
                                        const isSelected = selectedPages.has(page.url);
                                        const originalIndex = discoveredPages.findIndex(p => p.url === page.url);

                                        return (
                                            <div
                                                key={page.url}
                                                onClick={() => handleTogglePage(page.url)}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'bg-indigo-600/20 border-indigo-500'
                                                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        {isSelected ? (
                                                            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded border-2 border-slate-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-medium text-slate-500">#{originalIndex + 1}</span>
                                                            <h4 className="text-sm font-medium text-slate-200 truncate">
                                                                {page.title}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs text-slate-400 truncate">{page.url}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowPageSelector(false);
                                        setDiscoveredPages([]);
                                        setSelectedPages(new Set());
                                        setDiscoveryId(null);
                                        setPageSearchQuery('');
                                    }}
                                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCrawlSelectedPages}
                                    disabled={selectedPages.size === 0 || crawlingSelected}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {crawlingSelected ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Crawling {selectedPages.size} pages...
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="mr-2 h-4 w-4" />
                                            Crawl {selectedPages.size} Selected Page{selectedPages.size !== 1 ? 's' : ''}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

        </div>
    );
}
