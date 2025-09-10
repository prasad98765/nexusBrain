import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Languages, 
  ArrowLeftRight, 
  Volume2, 
  Mic, 
  Copy, 
  Download, 
  Share2, 
  Save, 
  History, 
  Trash2, 
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  X,
  Check,
  AlertCircle,
  Info,
  Clock,
  FileText,
  Loader2
} from 'lucide-react';

interface Translation {
  id: string;
  timestamp: number;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  styledText: string;
  formatting: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
  };
}

interface UniversalTranslatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UniversalTranslator({ isOpen, onClose }: UniversalTranslatorProps) {
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [currentFormatting, setCurrentFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });

  const translatedTextRef = useRef<HTMLTextAreaElement>(null);

  const languages = [
    { code: 'auto', name: 'Auto-detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' }
  ];

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('universal_translator_history_v1');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (error) {
        console.error('Failed to parse translation history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('universal_translator_history_v1', JSON.stringify(history));
  }, [history]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      showFeedback('error', 'Please enter some text to translate');
      return;
    }

    setIsTranslating(true);
    
    // Simulate API call - replace with actual translation API later
    setTimeout(() => {
      const sourceLanguageName = languages.find(lang => lang.code === sourceLanguage)?.name || 'Auto-detect';
      const targetLanguageName = languages.find(lang => lang.code === targetLanguage)?.name || 'Unknown';
      
      // Mock translation with target language prefix for now
      const mockTranslation = `[${targetLanguageName}] ${inputText}`;
      setTranslatedText(mockTranslation);
      
      // Add to history
      const newTranslation: Translation = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sourceLanguage: sourceLanguageName,
        targetLanguage: targetLanguageName,
        originalText: inputText,
        translatedText: mockTranslation,
        styledText: mockTranslation,
        formatting: { ...currentFormatting }
      };
      
      setHistory(prev => [newTranslation, ...prev.slice(0, 9)]); // Keep only last 10
      setIsTranslating(false);
      showFeedback('success', 'Translation completed successfully!');
    }, 1500);
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === 'auto') return;
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // Also swap the text
    const tempText = inputText;
    setInputText(translatedText);
    setTranslatedText(tempText);
    
    showFeedback('info', 'Languages swapped successfully');
  };

  const handleSpeechToText = () => {
    setIsListening(true);
    showFeedback('info', 'Listening... (Speech-to-text simulation)');
    
    // Mock speech-to-text
    setTimeout(() => {
      setInputText(prev => prev + ' This is mock speech input.');
      setIsListening(false);
      showFeedback('success', 'Speech captured successfully');
    }, 2000);
  };

  const handleTextToSpeech = () => {
    if (!translatedText) {
      showFeedback('error', 'No translation to read aloud');
      return;
    }
    
    setIsSpeaking(true);
    showFeedback('info', 'Reading translation aloud...');
    
    // Mock text-to-speech
    setTimeout(() => {
      setIsSpeaking(false);
      showFeedback('success', 'Finished reading translation');
    }, 3000);
  };

  const handleFormatting = (type: keyof typeof currentFormatting) => {
    const newFormatting = {
      ...currentFormatting,
      [type]: !currentFormatting[type]
    };
    setCurrentFormatting(newFormatting);
    
    // Apply formatting to selected text or entire text
    if (translatedTextRef.current) {
      const textarea = translatedTextRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        // Format selected text (simulation - in real implementation would use rich text editor)
        showFeedback('info', `Applied ${type} formatting to selected text`);
      } else {
        showFeedback('info', `${type} formatting ${newFormatting[type] ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const handleClearFormatting = () => {
    setCurrentFormatting({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false
    });
    showFeedback('info', 'All formatting cleared');
  };

  const handleCopy = (text: string, type: string = 'text') => {
    navigator.clipboard.writeText(text).then(() => {
      showFeedback('success', `${type} copied to clipboard!`);
    }).catch(() => {
      showFeedback('error', 'Failed to copy to clipboard');
    });
  };

  const handleDownload = (text: string, filename: string = 'translation.txt') => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('success', 'Translation downloaded successfully!');
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Translation from Nexus AI Hub',
        text: text,
        url: window.location.href
      }).then(() => {
        showFeedback('success', 'Translation shared successfully!');
      }).catch(() => {
        showFeedback('error', 'Failed to share translation');
      });
    } else {
      // Fallback - copy to clipboard
      handleCopy(`Translation from Nexus AI Hub:\n\n${text}\n\nTranslated at: ${window.location.href}`, 'Shareable link');
    }
  };

  const handleLoadFromHistory = (translation: Translation) => {
    setSourceLanguage(languages.find(lang => lang.name === translation.sourceLanguage)?.code || 'auto');
    setTargetLanguage(languages.find(lang => lang.name === translation.targetLanguage)?.code || 'en');
    setInputText(translation.originalText);
    setTranslatedText(translation.styledText);
    setCurrentFormatting(translation.formatting);
    setShowHistory(false);
    showFeedback('success', 'Translation loaded from history');
  };

  const handleDeleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    showFeedback('success', 'Translation removed from history');
  };

  const handleSaveEdited = () => {
    if (history.length > 0) {
      const updatedHistory = [...history];
      updatedHistory[0] = {
        ...updatedHistory[0],
        styledText: translatedText,
        formatting: currentFormatting
      };
      setHistory(updatedHistory);
      showFeedback('success', 'Edited translation saved to history');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Languages className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Universal Translator</h2>
              <p className="text-slate-400">Powered by Nexus AI Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            feedback.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {feedback.type === 'success' && <Check className="h-4 w-4" />}
            {feedback.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {feedback.type === 'info' && <Info className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          {/* Main Translation Interface */}
          <div className={`flex-1 p-6 space-y-6 overflow-y-auto ${showHistory ? 'pr-3' : ''}`}>
            {/* Language Selection */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="source-language-select"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={handleSwapLanguages}
                disabled={sourceLanguage === 'auto'}
                className="mt-8 border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                data-testid="swap-languages-button"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="target-language-select"
                >
                  {languages.filter(lang => lang.code !== 'auto').map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Text */}
              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Type className="h-5 w-5 text-indigo-400" />
                      Enter Text
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSpeechToText}
                        disabled={isListening}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                        data-testid="speech-to-text-button"
                      >
                        {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInputText('')}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    rows={8}
                    className="w-full bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    data-testid="input-textarea"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-400">{inputText.length} characters</span>
                    <Button
                      onClick={handleTranslate}
                      disabled={isTranslating || !inputText.trim()}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white disabled:opacity-50"
                      data-testid="translate-button"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Languages className="h-4 w-4 mr-2" />
                          Translate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Translation Output */}
              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Languages className="h-5 w-5 text-purple-400" />
                      Translation
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTextToSpeech}
                        disabled={!translatedText || isSpeaking}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                        data-testid="text-to-speech-button"
                      >
                        {isSpeaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(translatedText, 'Translation')}
                        disabled={!translatedText}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                        data-testid="copy-translation-button"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Text Formatting Toolbar */}
                  <div className="flex gap-1 mb-3 p-2 bg-slate-700/50 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatting('bold')}
                      className={`text-slate-400 hover:text-white hover:bg-slate-600 ${currentFormatting.bold ? 'bg-slate-600 text-white' : ''}`}
                      data-testid="bold-button"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatting('italic')}
                      className={`text-slate-400 hover:text-white hover:bg-slate-600 ${currentFormatting.italic ? 'bg-slate-600 text-white' : ''}`}
                      data-testid="italic-button"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatting('underline')}
                      className={`text-slate-400 hover:text-white hover:bg-slate-600 ${currentFormatting.underline ? 'bg-slate-600 text-white' : ''}`}
                      data-testid="underline-button"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatting('strikethrough')}
                      className={`text-slate-400 hover:text-white hover:bg-slate-600 ${currentFormatting.strikethrough ? 'bg-slate-600 text-white' : ''}`}
                      data-testid="strikethrough-button"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                    <div className="w-px bg-slate-600 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFormatting}
                      className="text-slate-400 hover:text-white hover:bg-slate-600"
                      data-testid="clear-formatting-button"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </div>

                  <Textarea
                    ref={translatedTextRef}
                    value={translatedText}
                    onChange={(e) => setTranslatedText(e.target.value)}
                    placeholder="Translation will appear here..."
                    rows={8}
                    className={`w-full bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      currentFormatting.bold ? 'font-bold' : ''
                    } ${
                      currentFormatting.italic ? 'italic' : ''
                    } ${
                      currentFormatting.underline ? 'underline' : ''
                    } ${
                      currentFormatting.strikethrough ? 'line-through' : ''
                    }`}
                    data-testid="translation-textarea"
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-400">{translatedText.length} characters</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdited}
                        disabled={!translatedText}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        data-testid="save-edited-button"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(translatedText, 'translation.txt')}
                        disabled={!translatedText}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        data-testid="download-button"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(translatedText)}
                        disabled={!translatedText}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        data-testid="share-button"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="w-96 border-l border-slate-700 bg-slate-800/50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400" />
                  Recent Translations
                </h3>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  {history.length}/10
                </Badge>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No translations yet</p>
                  <p className="text-sm text-slate-500 mt-1">Your translation history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((translation) => (
                    <Card key={translation.id} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{formatTimestamp(translation.timestamp)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFromHistory(translation.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 h-6 w-6"
                            data-testid={`delete-history-${translation.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-slate-300">
                          <span className="text-indigo-400">{translation.sourceLanguage}</span>
                          <ArrowLeftRight className="inline h-3 w-3 mx-2" />
                          <span className="text-purple-400">{translation.targetLanguage}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-slate-800/80 p-2 rounded text-sm text-slate-300">
                            {translation.originalText.length > 60 
                              ? `${translation.originalText.substring(0, 60)}...` 
                              : translation.originalText}
                          </div>
                          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-2 rounded text-sm text-slate-200">
                            {translation.styledText.length > 60 
                              ? `${translation.styledText.substring(0, 60)}...` 
                              : translation.styledText}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadFromHistory(translation)}
                            className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                            data-testid={`load-history-${translation.id}`}
                          >
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(translation.styledText, 'Historical translation')}
                            className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                            data-testid={`copy-history-${translation.id}`}
                          >
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(translation.styledText, `translation-${translation.id}.txt`)}
                            className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                            data-testid={`download-history-${translation.id}`}
                          >
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(translation.styledText)}
                            className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                            data-testid={`share-history-${translation.id}`}
                          >
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}