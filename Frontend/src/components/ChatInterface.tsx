import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  confidence?: 'high' | 'medium' | 'low';
  citations?: string[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  documentUploaded?: boolean;
}

export const ChatInterface = ({ documentUploaded }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (documentUploaded && messages.length === 0) {
      // Add welcome message when document is uploaded
      const welcomeMessage: Message = {
        id: '1',
        text: "I've analyzed your legal document and I'm ready to help! I can explain complex clauses, summarize key points, identify potential risks, and answer your questions. What would you like to know?",
        sender: 'ai',
        confidence: 'high',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [documentUploaded, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputValue),
        sender: 'ai',
        confidence: Math.random() > 0.3 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        citations: ['Page 2, Clause 3.1', 'Page 5, Section 7.2'],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const responses = [
      "Based on the document analysis, this clause establishes a clear liability framework. The language 'shall be responsible for' creates a binding obligation that could expose you to financial risk if the specified conditions aren't met.",
      "This section outlines the termination conditions. The 30-day notice period is standard, but be aware that the 'material breach' clause allows for immediate termination under certain circumstances.",
      "The indemnification clause here is quite broad. It requires you to protect the other party from legal claims, which could include covering their legal fees and any damages awarded against them.",
      "This is a non-compete provision that restricts your business activities for 12 months after contract termination. Consider whether this timeframe and scope are reasonable for your situation."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'confidence-high';
      case 'medium': return 'confidence-medium';
      case 'low': return 'confidence-low';
      default: return 'confidence-high';
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b bg-gradient-card">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Legal AI Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            {documentUploaded ? 'Document Loaded' : 'Waiting for Document'}
          </Badge>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && !documentUploaded && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm">Upload a legal document to start our conversation</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                
                {message.confidence && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getConfidenceColor(message.confidence)} text-xs`}>
                      {message.confidence} confidence
                    </Badge>
                  </div>
                )}
                
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Sources: </span>
                    {message.citations.join(', ')}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground/70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing your question...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={documentUploaded ? "Ask about your document..." : "Upload a document first"}
            disabled={!documentUploaded || isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!documentUploaded || !inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};