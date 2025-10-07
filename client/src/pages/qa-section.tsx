import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

interface QAItem {
    id: number;
    question: string;
    answer: {
        text: string;
        images?: string[];
        diagram?: string;
        externalLinks?: { title: string; url: string; }[];
    };
    date: string;
    importance: 'High' | 'Medium' | 'Low';
    category: 'AI' | 'LLM' | 'Langchain' | 'Latest News';
}

const qaData: QAItem[] = [
    {
        id: 1,
        question: "What is Generative AI? Explained simply?",
        answer: {
            text: "Generative AI is like a creative digital assistant that can create new content based on what it has learned. Think of it like a super-smart artist that has studied millions of paintings and can now create new ones, or a writer that has read countless books and can write original stories.",
            images: ["/images/generative-ai-concept.png"],
            externalLinks: [
                { title: "Understanding Generative AI", url: "https://www.example.com/gen-ai" }
            ]
        },
        date: "2025-09-16",
        importance: "High",
        category: "AI"
    },
    {
        id: 2,
        question: "Large Language Models (LLMs) vs Generative AI?",
        answer: {
            text: "While Generative AI is a broad category of AI that can create various types of content (images, text, music), LLMs are specifically focused on understanding and generating text. LLMs are actually a type of Generative AI specialized in language tasks.",
            diagram: "/images/llm-vs-genai-diagram.svg",
            externalLinks: [
                { title: "Deep Dive into LLMs", url: "https://www.example.com/llm-deep-dive" }
            ]
        },
        date: "2025-09-17",
        importance: "High",
        category: "LLM"
    },
    {
        id: 3,
        question: "How generative AI is changing design workflows",
        answer: {
            text: "Generative AI is revolutionizing design by automating repetitive tasks, generating initial concepts, and helping designers explore more possibilities quickly. It's not replacing designers but enhancing their capabilities.",
            images: ["/images/ai-design-workflow.png"],
            diagram: "/images/design-process-transformation.svg",
            externalLinks: [
                { title: "AI in Design", url: "https://www.example.com/ai-design" }
            ]
        },
        date: "2025-09-18",
        importance: "Medium",
        category: "AI"
    },
    {
        id: 4,
        question: "How LLM Work?",
        answer: {
            text: "LLMs work by processing text through multiple layers of neural networks, analyzing patterns in language, and predicting what comes next. They use a mechanism called attention to understand context and relationships between words.",
            diagram: "/images/llm-architecture.svg",
            externalLinks: [
                { title: "LLM Architecture Explained", url: "https://www.example.com/llm-architecture" }
            ]
        },
        date: "2025-09-15",
        importance: "High",
        category: "LLM"
    },
    {
        id: 5,
        question: "What is langchain?",
        answer: {
            text: "Langchain is a framework for developing applications powered by language models. It provides tools to combine LLMs with other sources of computation or knowledge to create more powerful applications.",
            diagram: "/images/langchain-components.svg",
            externalLinks: [
                { title: "Langchain Documentation", url: "https://docs.langchain.com" }
            ]
        },
        date: "2025-09-14",
        importance: "Medium",
        category: "Langchain"
    }
];

const ITEMS_PER_PAGE = 10;

export default function QASection() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [dateFilter, setDateFilter] = useState("all");
    const [importanceFilter, setImportanceFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        let filtered = [...qaData];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.question.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Date filter
        if (dateFilter !== "all") {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case "3days":
                    filterDate.setDate(now.getDate() - 3);
                    break;
                case "week":
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case "month":
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }

            filtered = filtered.filter(item => new Date(item.date) >= filterDate);
        }

        // Importance filter
        if (importanceFilter !== "all") {
            filtered = filtered.filter(item => item.importance === importanceFilter);
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        return filtered;
    }, [searchQuery, dateFilter, importanceFilter, categoryFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="container mx-auto py-8" style={{ color: "white" }}>
            <h1 className="text-3xl font-bold mb-8">Questions & Answers</h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />

                <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="3days">Last 3 days</SelectItem>
                        <SelectItem value="week">Last week</SelectItem>
                        <SelectItem value="month">Last month</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by importance" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="AI">AI</SelectItem>
                        <SelectItem value="LLM">LLM</SelectItem>
                        <SelectItem value="Langchain">Langchain</SelectItem>
                        <SelectItem value="Latest News">Latest News</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Q&A Cards */}
            <div className="space-y-6">
                {paginatedData.map((item) => (
                    <Card key={item.id} className="w-full">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{item.question}</CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant={item.importance === 'High' ? 'destructive' :
                                        item.importance === 'Medium' ? 'default' : 'secondary'}>
                                        {item.importance}
                                    </Badge>
                                    <Badge variant="outline">{item.category}</Badge>
                                </div>
                            </div>
                            <CardDescription>{format(new Date(item.date), 'PPP')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none">
                                <p>{item.answer.text}</p>

                                {item.answer.images && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {item.answer.images.map((img, index) => (
                                            <img key={index} src={img} alt="Illustration" className="rounded-lg shadow-md" />
                                        ))}
                                    </div>
                                )}

                                {item.answer.diagram && (
                                    <div className="mt-4">
                                        <img src={item.answer.diagram} alt="Diagram" className="rounded-lg shadow-md" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {item.answer.externalLinks && (
                            <CardFooter className="flex gap-2">
                                {item.answer.externalLinks.map((link, index) => (
                                    <Button key={index} variant="outline" asChild>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                                            {link.title}
                                        </a>
                                    </Button>
                                ))}
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
